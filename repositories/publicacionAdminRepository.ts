import { db } from "@/db";
import { sql } from "drizzle-orm";

export type PublicacionAdminRow = {
  id: number;
  estado: string;
  codigo: string;
  origen_nombre: string;
  destino_nombre: string;
  tipo_carga: string;
  peso: number;
  total_pago: string;
  fecha_salida: string;
  carga_peligrosa: boolean;
};

export type PostulacionAdminRow = {
  id: number;
  estado: string;
  created_at: string;
  nombre: string;
  apellido: string;
  placa: string;
  marca: string;
  modelo: string;
  transportista_id: number;
};

export const publicacionAdminRepository = {
  getPublicacionForEmpresa: async (publicacionId: number, empresaId: number) => {
    const result = await db.execute<PublicacionAdminRow>(sql`
      SELECT
        p.id,
        p.estado::text AS estado,
        f.codigo,
        f.origen_nombre,
        f.destino_nombre,
        ct.nombre AS tipo_carga,
        f.peso,
        f.total_pago::text AS total_pago,
        f.fecha_salida::text AS fecha_salida,
        f.carga_peligrosa
      FROM publicaciones p
      INNER JOIN fletes f ON f.id = p.id_flete
      INNER JOIN carga_types ct ON ct.id = f.id_tipo_carga
      WHERE p.id = ${publicacionId}
        AND p.id_empresa = ${empresaId}
      LIMIT 1
    `);

    return result.rows[0] ?? null;
  },

  getPostulacionesByPublicacion: async (publicacionId: number) => {
    const result = await db.execute<PostulacionAdminRow>(sql`
      SELECT
        po.id,
        ep.nombre AS estado,
        po.created_at::text AS created_at,
        t.nombre,
        t.apellido,
        fl.placa,
        fl.marca,
        fl.modelo,
        t.id AS transportista_id
      FROM postulaciones po
      INNER JOIN estado_postulacion ep ON ep.id = po.id_estado
      INNER JOIN transportistas t ON t.id = po.id_transportista
      INNER JOIN flota fl ON fl.id = po.id_flota
      WHERE po.id_publicacion = ${publicacionId}
      ORDER BY po.created_at DESC
    `);

    return result.rows;
  },
};
