export type EmpresaTripNotification = {
  id: string;
  viajeId: number;
  publicacionId: number | null;
  type:
    | "fase"
    | "proximity"
    | "completed"
    | "archived";
  message: string;
  createdAt: string;
};

export type ActiveViajeTracking = {
  viajeId: number;
  publicacionId: number;
  fase: string;
  faseLabel: string;
  codigo: string;
  origenNombre: string;
  destinoNombre: string;
};
