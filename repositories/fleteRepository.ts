import { db } from "@/db";
import { fletes } from "@/db/schema";
import { makePointSql } from "@/lib/mapbox/point-sql";
import { eq } from "drizzle-orm";

export type CreateFleteData = {
  id_empresa: number;
  id_tipo_carga: number;
  fecha_salida: string;
  fecha_entrega_estimada: string;
  peso: number;
  origen_nombre: string;
  origen: { lng: number; lat: number };
  destino_nombre: string;
  destino: { lng: number; lat: number };
  carga_peligrosa: boolean;
  total_pago: number;
};

export const fleteRepository = {
  create: async (data: CreateFleteData) => {
    const result = await db
      .insert(fletes)
      .values({
        id_empresa: data.id_empresa,
        id_tipo_carga: data.id_tipo_carga,
        fecha_salida: data.fecha_salida,
        fecha_entrega_estimada: data.fecha_entrega_estimada,
        peso: data.peso,
        origen_nombre: data.origen_nombre,
        origen_geom: makePointSql(data.origen.lng, data.origen.lat),
        destino_nombre: data.destino_nombre,
        destino_geom: makePointSql(data.destino.lng, data.destino.lat),
        carga_peligrosa: data.carga_peligrosa,
        total_pago: String(data.total_pago),
      })
      .returning();

    return result[0];
  },

  getById: async (id: number) => {
    return db.query.fletes.findFirst({
      where: eq(fletes.id, id),
    });
  },

  getByEmpresaId: async (empresaId: number) => {
    return db.query.fletes.findMany({
      where: eq(fletes.id_empresa, empresaId),
    });
  },

  updateEstado: async (id: number, estado: string) => {
    const result = await db
      .update(fletes)
      .set({ estado, updatedAt: new Date() })
      .where(eq(fletes.id, id))
      .returning();

    return result[0] ?? null;
  },
};
