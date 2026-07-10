import { db } from "@/db";
import {
  categoriaVehiculo,
  configArticulado,
  configEspecial,
  configRigido,
  configVehiculo,
} from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const vehiculoConfigRepository = {
  getCategorias: async () => {
    return db
      .select()
      .from(categoriaVehiculo)
      .orderBy(asc(categoriaVehiculo.id));
  },

  getConfigsByCategoria: async (categoriaId: number) => {
    return db
      .select({
        id: configVehiculo.id,
        codigo: configVehiculo.codigo,
        nombreComun: configVehiculo.nombreComun,
        capacidadMaxTon: configVehiculo.capacidadMaxTon,
        licenciaRequerida: configVehiculo.licenciaRequerida,
        idCategoria: configVehiculo.idCategoria,
      })
      .from(configVehiculo)
      .where(eq(configVehiculo.idCategoria, categoriaId))
      .orderBy(asc(configVehiculo.id));
  },

  getConfigWithDetail: async (configId: number) => {
    const config = await db.query.configVehiculo.findFirst({
      where: eq(configVehiculo.id, configId),
      with: {
        rigido: true,
        articulado: true,
        especial: true,
      },
    });

    if (!config) return null;

    return config;
  },

  configExistsInCategoria: async (configId: number, categoriaId: number) => {
    const row = await db.query.configVehiculo.findFirst({
      where: eq(configVehiculo.id, configId),
    });
    return row?.idCategoria === categoriaId;
  },

  getConfigById: async (configId: number) => {
    return db.query.configVehiculo.findFirst({
      where: eq(configVehiculo.id, configId),
    });
  },
};
