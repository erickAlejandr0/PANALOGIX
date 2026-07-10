import { db } from "@/db";
import { fletes, publicaciones } from "@/db/schema";
import { ESTADO_PUBLICACION } from "@/lib/fletes/constants";
import { and, desc, eq, sql } from "drizzle-orm";

export type CreatePublicacionData = {
  id_flete: number;
  id_empresa: number;
};

export const publicacionRepository = {
  create: async (data: CreatePublicacionData) => {
    const result = await db
      .insert(publicaciones)
      .values({
        id_flete: data.id_flete,
        id_empresa: data.id_empresa,
        estado: ESTADO_PUBLICACION.BORRADOR,
      })
      .returning();

    return result[0];
  },

  getById: async (id: number) => {
    return db.query.publicaciones.findFirst({
      where: eq(publicaciones.id, id),
    });
  },

  getByIdForEmpresa: async (id: number, empresaId: number) => {
    return db.query.publicaciones.findFirst({
      where: and(
        eq(publicaciones.id, id),
        eq(publicaciones.id_empresa, empresaId),
      ),
    });
  },

  getByFleteId: async (fleteId: number) => {
    return db.query.publicaciones.findFirst({
      where: eq(publicaciones.id_flete, fleteId),
    });
  },

  updateEstado: async (
    id: number,
    estado: (typeof ESTADO_PUBLICACION)[keyof typeof ESTADO_PUBLICACION],
  ) => {
    const result = await db
      .update(publicaciones)
      .set({ estado, updatedAt: new Date() })
      .where(eq(publicaciones.id, id))
      .returning();

    return result[0];
  },

  getPublishedByEmpresa: async (empresaId: number) => {
    return db
      .select({
        publicacion: publicaciones,
        flete: fletes,
      })
      .from(publicaciones)
      .innerJoin(fletes, eq(fletes.id, publicaciones.id_flete))
      .where(
        and(
          eq(publicaciones.id_empresa, empresaId),
          eq(publicaciones.estado, ESTADO_PUBLICACION.PUBLICADO),
        ),
      )
      .orderBy(desc(publicaciones.createdAt));
  },

  getPublishedForTransportistas: async () => {
    return db
      .select({
        publicacion: publicaciones,
        flete: fletes,
      })
      .from(publicaciones)
      .innerJoin(fletes, eq(fletes.id, publicaciones.id_flete))
      .where(eq(publicaciones.estado, ESTADO_PUBLICACION.PUBLICADO))
      .orderBy(desc(publicaciones.createdAt));
  },

  getPublishedDetailById: async (publicacionId: number) => {
    const result = await db.execute<{
      publicacion_id: number;
      codigo: string;
      origen_nombre: string;
      destino_nombre: string;
      total_pago: string;
      peso: number;
      fecha_salida: string;
      carga_peligrosa: boolean;
      origen_geom: unknown;
      destino_geom: unknown;
      nombre_empresa: string;
    }>(sql`
      SELECT
        p.id AS publicacion_id,
        f.codigo,
        f.origen_nombre,
        f.destino_nombre,
        f.total_pago::text AS total_pago,
        f.peso,
        f.fecha_salida::text AS fecha_salida,
        f.carga_peligrosa,
        e.nombre AS nombre_empresa,
        ST_AsGeoJSON(f.origen_geom)::json AS origen_geom,
        ST_AsGeoJSON(f.destino_geom)::json AS destino_geom
      FROM publicaciones p
      INNER JOIN fletes f ON f.id = p.id_flete
      INNER JOIN empresas e ON e.id = f.id_empresa
      WHERE p.id = ${publicacionId}
        AND p.estado = 'publicado'
      LIMIT 1
    `);

    return result.rows[0] ?? null;
  },

  archive: async (id: number) => {
    return publicacionRepository.updateEstado(id, ESTADO_PUBLICACION.ARCHIVADO);
  },

  republish: async (id: number) => {
    return publicacionRepository.updateEstado(id, ESTADO_PUBLICACION.PUBLICADO);
  },
};
