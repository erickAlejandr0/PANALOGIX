import type { MapPublication } from "@/lib/dashboard/map-publications";
import type { PaymentBreakdownDto } from "@/lib/stripe/fees";

export type { PaymentBreakdownDto };

export const DOMAIN_EVENT_NAMES = {
  TRANSPORTISTA_LOCATION_UPDATED: "transportista.location.updated",
  VIAJE_STARTED: "viaje.started",
  PUBLICACION_PUBLISHED: "publicacion.published",
  PUBLICACION_NEARBY: "publicacion.nearby",
  POSTULACION_CREATED: "postulacion.created",
  POSTULACION_ACCEPTED: "postulacion.accepted",
  POSTULACION_REJECTED: "postulacion.rejected",
  VIAJE_FASE_UPDATED: "viaje.fase.updated",
  VIAJE_COMPLETED: "viaje.completed",
  VIAJE_PROXIMITY_ALERT: "viaje.proximity.alert",
  VIAJE_NEGOCIACION_RESUMEN: "viaje.negociacion.resumen",
  VIAJE_INSPECCION_CHECKLIST_UPDATED: "viaje.inspeccion.checklist.updated",
  PUBLICACION_ARCHIVED: "publicacion.archived",
} as const;

export type DomainEventName =
  (typeof DOMAIN_EVENT_NAMES)[keyof typeof DOMAIN_EVENT_NAMES];

export type TransportistaLocationUpdatedPayload = {
  transportistaId: number;
  viajeId: number | null;
  lng: number;
  lat: number;
  heading: number | null;
  speedKmh: number | null;
  updatedAt: string;
};

export type DriverMarkerPayload = {
  viajeId: number;
  transportistaId: number;
  nombre: string;
  placa: string;
  lng: number;
  lat: number;
};

export type PublicacionPublishedPayload = {
  publication: MapPublication;
};

export type PublicacionNearbyPayload = {
  publicacionId: number;
  codigo: string;
  origenNombre: string;
  destinoNombre: string;
  origen: { lng: number; lat: number };
  destino: { lng: number; lat: number };
  totalPago: string;
  peso: number;
  fechaSalida: string;
  distanceKm: number;
  nombreEmpresa: string;
  pagoDesglose?: PaymentBreakdownDto | null;
  cargaPeligrosa?: boolean;
};

export type ViajeStartedPayload = {
  viajeId: number;
  transportistaId: number;
  fleteId: number;
  codigo: string;
};

export type PostulacionCreatedPayload = {
  postulacionId: number;
  publicacionId: number;
  transportistaId: number;
  transportistaNombre: string;
  nombre: string;
  apellido: string;
  placa: string;
  marca: string;
  modelo: string;
  codigo: string;
  createdAt: string;
};

export type PostulacionStatusPayload = {
  postulacionId: number;
  publicacionId: number;
  transportistaId: number;
};

export type PostulacionAcceptedTransportistaPayload = {
  postulacionId: number;
  publicacionId: number;
  viajeId: number;
  transportistaId: number;
  codigo: string;
  nombreEmpresa: string;
  origenNombre: string;
  destinoNombre: string;
  origen: { lng: number; lat: number };
  destino: { lng: number; lat: number };
  totalPago: string;
  peso: number;
  fechaSalida: string;
  fase: string;
};

export type ViajeFaseUpdatedPayload = {
  viajeId: number;
  publicacionId: number;
  transportistaId: number;
  fase: string;
  faseLabel: string;
  codigo: string;
  nombreEmpresa: string;
  origenNombre: string;
  destinoNombre: string;
  origen: { lng: number; lat: number };
  destino: { lng: number; lat: number };
  totalPago: string;
};

export type ViajeProximityAlertPayload = {
  viajeId: number;
  publicacionId: number;
  transportistaId: number;
  type: "approaching_destination" | "arrived_destination" | "cargo_picked_up";
  message: string;
  codigo: string;
  destinoNombre: string;
  distanceMeters: number | null;
};

export type ViajeCompletedPayload = {
  viajeId: number;
  publicacionId: number;
  transportistaId: number;
  fleteId: number;
  codigo: string;
  origenNombre: string;
  destinoNombre: string;
  totalPago: string;
};

export type PublicacionArchivedPayload = {
  publicacionId: number;
  viajeId: number;
  codigo: string;
  origenNombre: string;
  destinoNombre: string;
};

// Resumen compartido de la negociacion (PASO 5). Es un snapshot: se entrega al
// verificar el codigo, cuando el viaje ya esta cerrado y no aparece como activo.
// No contiene ningun dato del codigo de verificacion.
export type ViajeNegociacionResumenPayload = {
  viajeId: number;
  publicacionId: number;
  transportistaId: number;
  codigo: string;
  origenNombre: string;
  destinoNombre: string;
  totalPago: string;
  peso: number;
  tipoCarga: string;
  fechaSalida: string;
  fechaEntrega: string;
  nombreEmpresa: string;
  nombreTransportista: string;
  completadoEn: string;
  stripePaymentIntentId?: string | null;
  stripeTransferId?: string | null;
  paymentStatus?: string | null;
  platformFee?: string | null;
  stripeFee?: string | null;
  transportistaPayout?: string | null;
  platformFeePercent?: number | null;
};

export type ViajeInspeccionChecklistItemPayload = {
  id: string;
  title: string;
  completed: boolean;
  critical: boolean;
};

export type ViajeInspeccionChecklistUpdatedPayload = {
  viajeId: number;
  publicacionId: number;
  transportistaId: number;
  items: ViajeInspeccionChecklistItemPayload[];
  completedCount: number;
  totalCount: number;
  updatedAt: string;
};
