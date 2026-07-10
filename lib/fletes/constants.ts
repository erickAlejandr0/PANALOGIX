export const TRANSPORTISTA_ROLE_ID = 1;
export const EMPRESA_ROLE_ID = 2;

export const ESTADO_PUBLICACION = {
  BORRADOR: "borrador",
  PUBLICADO: "publicado",
  ARCHIVADO: "archivado",
} as const;

export const ESTADO_FLETE = {
  ACTIVO: "activo",
  EN_TRANSITO: "en_transito",
  ENTREGADO: "entregado",
  CANCELADO: "cancelado",
} as const;

export const ESTADO_POSTULACION_ID = {
  PENDIENTE: 1,
  ACEPTADA: 2,
  RECHAZADA: 3,
  CANCELADA: 4,
} as const;

export const ESTADO_VIAJE_ID = {
  EN_CURSO: 1,
  COMPLETADO: 2,
  REASIGNADO: 3,
  CANCELADO: 4,
} as const;

export const ESTADO_VIAJE_NOMBRE = {
  EN_CURSO: "en_curso",
  COMPLETADO: "completado",
  REASIGNADO: "reasignado",
  CANCELADO: "cancelado",
} as const;

export const FASE_VIAJE = {
  ASIGNADO: "asignado",
  HACIA_ORIGEN: "hacia_origen",
  HACIA_DESTINO: "hacia_destino",
  EN_DESTINO: "en_destino",
  INSPECCION: "inspeccion",
  CODIGO_PENDIENTE: "codigo_pendiente",
  RESUMEN: "resumen",
  COMPLETADO: "completado",
} as const;

// Fases donde el viaje sigue "vivo" para el transportista. `resumen` queda
// fuera a proposito: al verificar el codigo el viaje se cierra (id_estado
// COMPLETADO) y el transportista se libera, por lo que ya no debe aparecer
// como viaje activo aunque su fase quede en `resumen`.
export const FASES_VIAJE_ACTIVAS = [
  FASE_VIAJE.ASIGNADO,
  FASE_VIAJE.HACIA_ORIGEN,
  FASE_VIAJE.HACIA_DESTINO,
  FASE_VIAJE.EN_DESTINO,
  FASE_VIAJE.INSPECCION,
  FASE_VIAJE.CODIGO_PENDIENTE,
] as const;

export type FaseViaje = (typeof FASE_VIAJE)[keyof typeof FASE_VIAJE];

export const PROXIMITY_DESTINO_ALERT_M = 3_000;
export const PROXIMITY_ARRIVAL_RADIUS_M = 500;

// Parametros del codigo de verificacion de entrega (PASO 3-4 de la negociacion).
export const CODIGO_VERIFICACION = {
  LENGTH: 6,
  TTL_MS: 15 * 60 * 1000,
  MAX_INTENTOS: 5,
} as const;
