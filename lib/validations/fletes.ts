type CoordinateInput = {
  lng: number;
  lat: number;
};

export type CreateFleteInput = {
  id_tipo_carga: number;
  fecha_salida: string;
  fecha_entrega_estimada: string;
  peso: number;
  origen_nombre: string;
  origen: CoordinateInput;
  destino_nombre: string;
  destino: CoordinateInput;
  carga_peligrosa: boolean;
  total_pago: number;
};

type ValidationSuccess<T> = { data: T };
type ValidationError = { error: string };
type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function parseCoordinate(
  value: unknown,
  label: string,
): ValidationError | { value: number } {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return { error: `${label} inválida` };
  }
  return { value };
}

export function parseCreateFleteBody(
  body: unknown,
): ValidationResult<CreateFleteInput> {
  if (!body || typeof body !== "object") {
    return { error: "Cuerpo de solicitud inválido" };
  }

  const data = body as Record<string, unknown>;
  const origenNombre =
    typeof data.origen_nombre === "string" ? data.origen_nombre.trim() : "";
  const destinoNombre =
    typeof data.destino_nombre === "string" ? data.destino_nombre.trim() : "";
  const fechaSalida =
    typeof data.fecha_salida === "string" ? data.fecha_salida.trim() : "";
  const fechaEntrega =
    typeof data.fecha_entrega_estimada === "string"
      ? data.fecha_entrega_estimada.trim()
      : "";

  if (!origenNombre || !destinoNombre) {
    return { error: "Origen y destino son requeridos" };
  }

  if (!isValidDate(fechaSalida) || !isValidDate(fechaEntrega)) {
    return { error: "Las fechas deben tener formato YYYY-MM-DD" };
  }

  if (Date.parse(fechaEntrega) < Date.parse(fechaSalida)) {
    return { error: "La fecha de entrega no puede ser anterior a la de salida" };
  }

  const idTipoCarga = Number(data.id_tipo_carga);
  if (!Number.isInteger(idTipoCarga) || idTipoCarga <= 0) {
    return { error: "Tipo de carga inválido" };
  }

  const peso = Number(data.peso);
  if (!Number.isFinite(peso) || peso <= 0) {
    return { error: "El peso debe ser mayor a 0" };
  }

  const totalPago = Number(data.total_pago);
  if (!Number.isFinite(totalPago) || totalPago <= 0) {
    return { error: "El pago total debe ser mayor a 0" };
  }

  const origenLng = parseCoordinate(data.origen_lng, "Longitud de origen");
  if ("error" in origenLng) return origenLng;
  const origenLat = parseCoordinate(data.origen_lat, "Latitud de origen");
  if ("error" in origenLat) return origenLat;
  const destinoLng = parseCoordinate(data.destino_lng, "Longitud de destino");
  if ("error" in destinoLng) return destinoLng;
  const destinoLat = parseCoordinate(data.destino_lat, "Latitud de destino");
  if ("error" in destinoLat) return destinoLat;

  return {
    data: {
      id_tipo_carga: idTipoCarga,
      fecha_salida: fechaSalida,
      fecha_entrega_estimada: fechaEntrega,
      peso,
      origen_nombre: origenNombre,
      origen: { lng: origenLng.value, lat: origenLat.value },
      destino_nombre: destinoNombre,
      destino: { lng: destinoLng.value, lat: destinoLat.value },
      carga_peligrosa: Boolean(data.carga_peligrosa),
      total_pago: totalPago,
    } satisfies CreateFleteInput,
  };
}

export function parseApplyPostulacionBody(
  body: unknown,
): ValidationResult<{ id_publicacion: number; id_flota: number }> {
  if (!body || typeof body !== "object") {
    return { error: "Cuerpo de solicitud inválido" };
  }

  const data = body as Record<string, unknown>;
  const publicacionId = Number(data.id_publicacion);
  const flotaId = Number(data.id_flota);

  if (!Number.isInteger(publicacionId) || publicacionId <= 0) {
    return { error: "Publicación inválida" };
  }

  if (!Number.isInteger(flotaId) || flotaId <= 0) {
    return { error: "Vehículo inválido" };
  }

  return { data: { id_publicacion: publicacionId, id_flota: flotaId } };
}

export function parsePostulacionIdParam(
  value: string,
): ValidationResult<number> {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "Postulación inválida" };
  }
  return { data: id };
}

export function parsePublicacionIdParam(
  value: string,
): ValidationResult<number> {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "Publicación inválida" };
  }
  return { data: id };
}
