import { db } from "@/db";
import { transportistas } from "@/db/schema";
import { eq } from "drizzle-orm";

export type CreateTransportistaInput = {
  nombre: string;
  apellido: string;
  cedula: string;
  direccion: string;
  telefono: string;
  id_usuario: number;
};

export const transportistaRepository = {
  getByUserId: async (userId: number) => {
    try {
      return await db.query.transportistas.findFirst({
        where: eq(transportistas.id_usuario, userId),
      });
    } catch {
      throw new Error("Error al consultar la base de datos");
    }
  },

  getById: async (id: number) => {
    return db.query.transportistas.findFirst({
      where: eq(transportistas.id, id),
    });
  },

  create: async (data: CreateTransportistaInput) => {
    try {
      const result = await db.insert(transportistas).values(data).returning();
      return result[0];
    } catch {
      throw new Error("Error al consultar la base de datos");
    }
  },
};
