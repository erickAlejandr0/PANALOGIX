import { db } from "@/db";
import { flota } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export type CreateFlotaInput = {
  id_config: number;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  estado: string;
  id_transportista: number;
};

export const flotaRepository = {
  create: async (data: CreateFlotaInput) => {
    const result = await db.insert(flota).values(data).returning();
    return result[0];
  },

  getByTransportista: async (transportistaId: number) => {
    return db.query.flota.findMany({
      where: eq(flota.id_transportista, transportistaId),
    });
  },

  getByIdAndTransportista: async (flotaId: number, transportistaId: number) => {
    return db.query.flota.findFirst({
      where: and(
        eq(flota.id, flotaId),
        eq(flota.id_transportista, transportistaId),
      ),
    });
  },
};
