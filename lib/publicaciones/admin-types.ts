export type PostulacionEstado = "pendiente" | "aceptada" | "rechazada" | "cancelada";

export type PostulacionAdminItem = {
  id: number;
  estado: PostulacionEstado;
  createdAt: string;
  nombre: string;
  apellido: string;
  placa: string;
  marca: string;
  modelo: string;
  transportistaId: number;
};

export type PublicacionAdminDetail = {
  id: number;
  estado: "borrador" | "publicado";
  codigo: string;
  origenNombre: string;
  destinoNombre: string;
  tipoCarga: string;
  peso: number;
  totalPago: string;
  fechaSalida: string;
  cargaPeligrosa: boolean;
  postulaciones: PostulacionAdminItem[];
};

export type PostulacionTabFilter = "todas" | "pendiente" | "aceptada" | "rechazada";
