export type EmpresaPerfilContacto = {
  email: string;
  telefono: string;
  direccion: string;
};

export type EmpresaPerfilEmpresa = {
  nombre: string;
  ruc: string;
  verificada: boolean;
  ultimaActualizacion: string;
  contacto: EmpresaPerfilContacto;
};

export type EmpresaPerfilResumen = {
  planActivo: string;
  clienteDesde: string;
  entregasEsteMes: number;
};

export type EmpresaPerfilMetodoPago = {
  id: string;
  marca: "mastercard" | "visa" | "generica";
  ultimosCuatro: string;
  expiracion: string;
  principal: boolean;
};

export type EmpresaPerfilPagoHistorial = {
  id: string;
  fecha: string;
  monto: string;
  estado: "pagada" | "pendiente" | "reservada" | "liberada" | "reembolsada";
  referencia: string;
};

export type EmpresaPerfilPageData = {
  empresa: EmpresaPerfilEmpresa;
  resumen: EmpresaPerfilResumen;
  metodosPago: EmpresaPerfilMetodoPago[];
  historialPagos: EmpresaPerfilPagoHistorial[];
  billingReady: boolean;
  showBillingSetup: boolean;
};
