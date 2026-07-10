import { db } from "@/db";
import { empresas } from "@/db/schema";
import { eq } from "drizzle-orm";

export type CreateEmpresaInput = {
  nombre: string;
  ruc: string;
  direccion: string;
  telefono: string;
  id_usuario: number;
};

export const empresaRepository = {
  getByUserId: async (userId: number) => {
    try {
      return await db.query.empresas.findFirst({
        where: eq(empresas.id_usuario, userId),
      });
    } catch {
      throw new Error("Error al consultar la base de datos");
    }
  },

  create: async (data: CreateEmpresaInput) => {
    try {
      const result = await db.insert(empresas).values(data).returning();
      return result[0];
    } catch {
      throw new Error("Error al consultar la base de datos");
    }
  },
};
