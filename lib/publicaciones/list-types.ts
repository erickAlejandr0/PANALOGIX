export type PublicacionListApplicant = {
  nombre: string;
  apellido: string;
};

export type PublicacionListItem = {
  id: number;
  estado: "borrador" | "publicado";
  codigo: string;
  origenNombre: string;
  destinoNombre: string;
  tipoCarga: string;
  peso: number;
  postulacionesCount: number;
  postulantes: PublicacionListApplicant[];
  createdAt: string;
  updatedAt: string;
};

export type PublicacionesPageData = {
  publicaciones: PublicacionListItem[];
  publishedCount: number;
  weeklyPostulaciones: number;
  weeklyTrendPercent: number | null;
  weeklyChart: number[];
};

export type PublicacionEstadoFilter = "todos" | "publicado" | "borrador";
