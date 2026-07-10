type ConfigBase = {
  nombreComun: string;
  capacidadMaxTon: number | null;
  licenciaRequerida: string;
};

type ConfigRigidoDetail = { ejes: number };
type ConfigArticuladoDetail = {
  ejesCabezal: number;
  ejesSemirremolque: number;
};
type ConfigEspecialDetail = { descripcion: string };

export function getConfigSelectorLabel(config: {
  codigo: string | null;
  nombreComun: string;
}) {
  return config.codigo ?? config.nombreComun;
}

export function buildConfigDetalle(
  config: ConfigBase & {
    rigido?: ConfigRigidoDetail | null;
    articulado?: ConfigArticuladoDetail | null;
    especial?: ConfigEspecialDetail | null;
  },
): string {
  if (config.especial) {
    return config.especial.descripcion;
  }

  if (config.rigido) {
    const capacidad =
      config.capacidadMaxTon != null
        ? ` Capacidad máxima: ${config.capacidadMaxTon} ton.`
        : "";
    return `${config.nombreComun} — ${config.rigido.ejes} ejes.${capacidad} Licencia requerida: ${config.licenciaRequerida}.`;
  }

  if (config.articulado) {
    const capacidad =
      config.capacidadMaxTon != null
        ? ` Capacidad máxima: ${config.capacidadMaxTon} ton.`
        : "";
    return `${config.nombreComun} — Cabezal ${config.articulado.ejesCabezal} ejes + semirremolque ${config.articulado.ejesSemirremolque} ejes.${capacidad} Licencia requerida: ${config.licenciaRequerida}.`;
  }

  return config.nombreComun;
}
