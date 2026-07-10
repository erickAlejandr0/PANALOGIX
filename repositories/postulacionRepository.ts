import { db } from "@/db";
import { postulaciones } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";

export type CreatePostulacionData = {
  id_publicacion: number;
  id_transportista: number;
  id_flota: number;
  id_estado: number;
};

export const postulacionRepository = {
  create: async (data: CreatePostulacionData) => {
    const result = await db.insert(postulaciones).values(data).returning();
    return result[0];
  },

  getById: async (id: number) => {
    return db.query.postulaciones.findFirst({
      where: eq(postulaciones.id, id),
    });
  },

  getByPublicacion: async (publicacionId: number) => {
    return db.query.postulaciones.findMany({
      where: eq(postulaciones.id_publicacion, publicacionId),
    });
  },

  getByTransportista: async (transportistaId: number) => {
    return db.query.postulaciones.findMany({
      where: eq(postulaciones.id_transportista, transportistaId),
    });
  },

  existsForPublicacion: async (
    publicacionId: number,
    transportistaId: number,
  ) => {
    const existing = await db.query.postulaciones.findFirst({
      where: and(
        eq(postulaciones.id_publicacion, publicacionId),
        eq(postulaciones.id_transportista, transportistaId),
      ),
    });
    return Boolean(existing);
  },

  updateEstado: async (id: number, idEstado: number) => {
    const result = await db
      .update(postulaciones)
      .set({ id_estado: idEstado, updatedAt: new Date() })
      .where(eq(postulaciones.id, id))
      .returning();

    return result[0];
  },

  rejectPendingByPublicacion: async (
    publicacionId: number,
    exceptPostulacionId: number,
    rechazadaEstadoId: number,
    pendienteEstadoId: number,
  ) => {
    await db
      .update(postulaciones)
      .set({ id_estado: rechazadaEstadoId, updatedAt: new Date() })
      .where(
        and(
          eq(postulaciones.id_publicacion, publicacionId),
          eq(postulaciones.id_estado, pendienteEstadoId),
          ne(postulaciones.id, exceptPostulacionId),
        ),
      );
  },
};
