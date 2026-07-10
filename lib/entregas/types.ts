export type InspeccionChecklistItem = {
  id: string;
  title: string;
  meta: string;
  instruction: string;
  critical: boolean;
  completed: boolean;
  icon: "shield" | "user" | "camera" | "calendar";
};

export type InspeccionTransportista = {
  nombre: string;
  apellido: string;
  placa: string;
  cedula: string;
  vehiculo: string;
  iniciadaAt: string;
  iniciadaHace: string;
};

export type InspeccionFleteDetalle = {
  codigo: string;
  pesoKg: number;
  pago: number;
  tipoCarga: string;
  fechaEntrega: string;
  origen: string;
  destino: string;
  receptor: string;
  completadaEn: string;
};

export type InspeccionCargaData = {
  codigo: string;
  pasoActual: number;
  pasosTotal: number;
  estado: "en_revision" | "completada" | "pendiente";
  flete: InspeccionFleteDetalle;
  transportista: InspeccionTransportista;
  checklist: InspeccionChecklistItem[];
};

export type EntregaEstado =
  | "por_recoger"
  | "en_camino"
  | "en_destino"
  | "completada"
  | "cancelada";

export type EntregaTabFilter = "todas" | EntregaEstado;

export type EntregaListItem = {
  id: string;
  viajeId: number;
  codigo: string;
  estado: EntregaEstado;
  nuevo: boolean;
  origen: string;
  destino: string;
  empresa: string;
  receptor: string;
  pesoKg: number;
  llegadaLabel?: string;
};

export type EntregasPageData = {
  items: EntregaListItem[];
  totalHoy: number;
  counts: Record<EntregaEstado, number>;
};
