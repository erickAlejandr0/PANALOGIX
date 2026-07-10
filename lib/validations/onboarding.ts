import { normalizePhoneToE164 } from "@/lib/phone/e164";

const FIELD_MIN = 2;
const FIELD_MAX = 255;

export const TRANSPORTISTA_ROLE_ID = 1;

type ValidationError = { error: string };
type ValidationSuccess<T> = { data: T };
export type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

function validateRequiredFields(
  fields: { value: string; label: string }[],
) {
  for (const field of fields) {
    const trimmed = field.value?.trim();
    if (!trimmed) {
      return { error: `${field.label} es requerido` };
    }
    if (trimmed.length < FIELD_MIN) {
      return { error: `${field.label} es demasiado corto` };
    }
    if (trimmed.length > FIELD_MAX) {
      return { error: `${field.label} es demasiado largo` };
    }
  }

  return null;
}

function sanitizeTelefono(telefono: string): ValidationResult<string> {
  const normalized = normalizePhoneToE164(telefono);
  if (!normalized.success) {
    return { error: "Teléfono celular inválido" };
  }

  return { data: normalized.e164 };
}

export type TransportistaFlotaInput = {
  id_config: number;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
};

export type TransportistaOnboardingInput = {
  nombre: string;
  apellido: string;
  cedula: string;
  direccion: string;
  telefono: string;
  id_categoria: number;
  flota: TransportistaFlotaInput;
  aceptaTerminos: boolean;
};

export function validateEmpresaOnboardingInput(
  nombre: string,
  ruc: string,
  direccion: string,
  telefono: string,
) {
  return validateRequiredFields([
    { value: nombre, label: "Razón Social" },
    { value: ruc, label: "RUC" },
    { value: direccion, label: "Dirección Principal" },
    { value: telefono, label: "Teléfono Corporativo" },
  ]);
}

export function validateTransportistaOnboardingInput(
  nombre: string,
  apellido: string,
  cedula: string,
  direccion: string,
  telefono: string,
) {
  return validateRequiredFields([
    { value: nombre, label: "Nombres" },
    { value: apellido, label: "Apellidos" },
    { value: cedula, label: "Cédula / Pasaporte" },
    { value: direccion, label: "Dirección" },
    { value: telefono, label: "Teléfono Celular" },
  ]);
}

function validateFlotaInput(
  marca: string,
  modelo: string,
  placa: string,
  anio: number,
  idConfig: number,
  idCategoria: number,
) {
  const marcaError = validateRequiredFields([{ value: marca, label: "Marca" }]);
  if (marcaError) return marcaError;

  const modeloError = validateRequiredFields([
    { value: modelo, label: "Modelo" },
  ]);
  if (modeloError) return modeloError;

  const placaError = validateRequiredFields([{ value: placa, label: "Placa" }]);
  if (placaError) return placaError;

  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(anio) || anio < 1980 || anio > currentYear + 1) {
    return { error: "El año del vehículo no es válido" };
  }

  if (!Number.isInteger(idConfig) || idConfig <= 0) {
    return { error: "Debe seleccionar una configuración de vehículo" };
  }

  if (!Number.isInteger(idCategoria) || idCategoria <= 0) {
    return { error: "Debe seleccionar una categoría de vehículo" };
  }

  return null;
}

export function parseTransportistaOnboardingFormData(
  formData: FormData,
): ValidationResult<TransportistaOnboardingInput> {
  const nombre = (formData.get("nombre") as string)?.trim() ?? "";
  const apellido = (formData.get("apellido") as string)?.trim() ?? "";
  const cedula = (formData.get("cedula") as string)?.trim() ?? "";
  const direccion = (formData.get("direccion") as string)?.trim() ?? "";
  const telefono = (formData.get("telefono") as string)?.trim() ?? "";
  const marca = (formData.get("marca") as string)?.trim() ?? "";
  const modelo = (formData.get("modelo") as string)?.trim() ?? "";
  const placa = (formData.get("placa") as string)?.trim() ?? "";
  const anio = Number(formData.get("anio"));
  const idConfig = Number(formData.get("id_config"));
  const idCategoria = Number(formData.get("id_categoria"));
  const aceptaTerminos = formData.get("aceptaTerminos") === "true";

  const personalError = validateTransportistaOnboardingInput(
    nombre,
    apellido,
    cedula,
    direccion,
    telefono,
  );
  if (personalError) return personalError;

  const telefonoResult = sanitizeTelefono(telefono);
  if ("error" in telefonoResult) return telefonoResult;

  const flotaError = validateFlotaInput(
    marca,
    modelo,
    placa,
    anio,
    idConfig,
    idCategoria,
  );
  if (flotaError) return flotaError;

  if (!aceptaTerminos) {
    return { error: "Debe aceptar los Términos y Condiciones" };
  }

  return {
    data: {
      nombre,
      apellido,
      cedula,
      direccion,
      telefono: telefonoResult.data,
      id_categoria: idCategoria,
      flota: {
        id_config: idConfig,
        placa,
        marca,
        modelo,
        anio,
      },
      aceptaTerminos,
    },
  };
}

export function parseTransportistaOnboardingBody(
  body: unknown,
): ValidationResult<
  Omit<TransportistaOnboardingInput, "aceptaTerminos" | "id_categoria">
> {
  if (!body || typeof body !== "object") {
    return { error: "Cuerpo de solicitud inválido" };
  }

  const data = body as Record<string, unknown>;
  const flotaRaw =
    data.flota && typeof data.flota === "object"
      ? (data.flota as Record<string, unknown>)
      : null;

  const sanitized = {
    nombre: typeof data.nombre === "string" ? data.nombre.trim() : "",
    apellido: typeof data.apellido === "string" ? data.apellido.trim() : "",
    cedula: typeof data.cedula === "string" ? data.cedula.trim() : "",
    direccion: typeof data.direccion === "string" ? data.direccion.trim() : "",
    telefono: typeof data.telefono === "string" ? data.telefono.trim() : "",
    marca: typeof flotaRaw?.marca === "string" ? flotaRaw.marca.trim() : "",
    modelo: typeof flotaRaw?.modelo === "string" ? flotaRaw.modelo.trim() : "",
    placa: typeof flotaRaw?.placa === "string" ? flotaRaw.placa.trim() : "",
    anio: Number(flotaRaw?.anio),
    idConfig: Number(flotaRaw?.id_config),
    idCategoria: Number(data.id_categoria),
  };

  const personalError = validateTransportistaOnboardingInput(
    sanitized.nombre,
    sanitized.apellido,
    sanitized.cedula,
    sanitized.direccion,
    sanitized.telefono,
  );
  if (personalError) return personalError;

  const telefonoResult = sanitizeTelefono(sanitized.telefono);
  if ("error" in telefonoResult) return telefonoResult;

  const flotaError = validateFlotaInput(
    sanitized.marca,
    sanitized.modelo,
    sanitized.placa,
    sanitized.anio,
    sanitized.idConfig,
    sanitized.idCategoria,
  );
  if (flotaError) return flotaError;

  return {
    data: {
      nombre: sanitized.nombre,
      apellido: sanitized.apellido,
      cedula: sanitized.cedula,
      direccion: sanitized.direccion,
      telefono: telefonoResult.data,
      flota: {
        id_config: sanitized.idConfig,
        placa: sanitized.placa,
        marca: sanitized.marca,
        modelo: sanitized.modelo,
        anio: sanitized.anio,
      },
    },
  };
}
