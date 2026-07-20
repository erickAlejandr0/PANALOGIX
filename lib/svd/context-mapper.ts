import type { MandatoryDocumentTipo, SvdCarrierContext } from "@/lib/svd/types";

export type ProfileForSvdContext = {
  cedula: string;
  nombre: string;
  apellido: string;
  placa: string | null;
};

export class SvdContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SvdContextError";
  }
}

/**
 * Arma el contexto de validación por tipo según reglas RN-04 / RN-07.
 *
 * SOAT: placa obligatoria + nombre recomendado. No envía cedula_registrada:
 * campos_aplicables de SOAT no incluye cédula; no aporta a RN-04.
 */
export function buildSvdContext(
  tipo: MandatoryDocumentTipo,
  profile: ProfileForSvdContext,
): SvdCarrierContext {
  const nombre = `${profile.nombre} ${profile.apellido}`.trim();
  const cedula = profile.cedula.trim();
  const placa = profile.placa?.trim() || null;

  switch (tipo) {
    case "cedula":
    case "licencia": {
      if (!cedula) {
        throw new SvdContextError(
          "Falta la cédula del perfil para verificar este documento.",
        );
      }
      if (!nombre) {
        throw new SvdContextError(
          "Falta el nombre del perfil para verificar este documento.",
        );
      }
      return {
        cedula_registrada: cedula,
        nombre_registrado: nombre,
      };
    }
    case "soat": {
      if (!placa) {
        throw new SvdContextError(
          "Falta la placa del vehículo para verificar el SOAT.",
        );
      }
      const ctx: SvdCarrierContext = { placa_registrada: placa };
      if (nombre) {
        ctx.nombre_registrado = nombre;
      }
      return ctx;
    }
    case "revisado": {
      if (!placa) {
        throw new SvdContextError(
          "Falta la placa del vehículo para verificar el revisado técnico.",
        );
      }
      return { placa_registrada: placa };
    }
    default: {
      const _exhaustive: never = tipo;
      throw new SvdContextError(`Tipo no soportado: ${_exhaustive}`);
    }
  }
}
