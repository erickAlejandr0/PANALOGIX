import { db } from "@/db";
import { sql } from "drizzle-orm";

export type PublicacionListRow = {
  id: number;
  estado: string;
  codigo: string;
  origen_nombre: string;
  destino_nombre: string;
  tipo_carga: string;
  peso: number;
  postulaciones_count: number;
  created_at: string;
  updated_at: string;
};

export type PostulantePreviewRow = {
  id_publicacion: number;
  nombre: string;
  apellido: string;
};

export type WeeklyChartRow = {
  day: string;
  total: number;
};

export const publicacionesListRepository = {
  getByEmpresa: async (empresaId: number) => {
    const result = await db.execute<PublicacionListRow>(sql`
      SELECT
        p.id,
        p.estado::text AS estado,
        f.codigo,
        f.origen_nombre,
        f.destino_nombre,
        ct.nombre AS tipo_carga,
        f.peso,
        (
          SELECT COUNT(*)::int
          FROM postulaciones po
          WHERE po.id_publicacion = p.id
        ) AS postulaciones_count,
        p.created_at::text AS created_at,
        p.updated_at::text AS updated_at
      FROM publicaciones p
      INNER JOIN fletes f ON f.id = p.id_flete
      INNER JOIN carga_types ct ON ct.id = f.id_tipo_carga
      WHERE p.id_empresa = ${empresaId}
        AND p.estado IN ('borrador', 'publicado')
      ORDER BY p.updated_at DESC
    `);

    return result.rows;
  },

  getRecentPostulantes: async (empresaId: number) => {
    const result = await db.execute<PostulantePreviewRow>(sql`
      SELECT
        ranked.id_publicacion,
        ranked.nombre,
        ranked.apellido
      FROM (
        SELECT
          po.id_publicacion,
          t.nombre,
          t.apellido,
          ROW_NUMBER() OVER (
            PARTITION BY po.id_publicacion
            ORDER BY po.created_at DESC
          ) AS rn
        FROM postulaciones po
        INNER JOIN publicaciones p ON p.id = po.id_publicacion
        INNER JOIN transportistas t ON t.id = po.id_transportista
        WHERE p.id_empresa = ${empresaId}
      ) ranked
      WHERE ranked.rn <= 2
    `);

    return result.rows;
  },

  countPublishedByEmpresa: async (empresaId: number) => {
    const result = await db.execute<{ total: number }>(sql`
      SELECT COUNT(*)::int AS total
      FROM publicaciones
      WHERE id_empresa = ${empresaId}
        AND estado = 'publicado'
    `);

    return result.rows[0]?.total ?? 0;
  },

  countPostulacionesInRange: async (
    empresaId: number,
    fromDaysAgo: number,
    toDaysAgo: number,
  ) => {
    const result = await db.execute<{ total: number }>(sql`
      SELECT COUNT(*)::int AS total
      FROM postulaciones po
      INNER JOIN publicaciones p ON p.id = po.id_publicacion
      WHERE p.id_empresa = ${empresaId}
        AND po.created_at >= NOW() - (${fromDaysAgo} || ' days')::interval
        AND po.created_at < NOW() - (${toDaysAgo} || ' days')::interval
    `);

    return result.rows[0]?.total ?? 0;
  },

  getWeeklyPostulacionesChart: async (empresaId: number) => {
    const result = await db.execute<WeeklyChartRow>(sql`
      SELECT
        to_char(d.day, 'YYYY-MM-DD') AS day,
        COALESCE(COUNT(empresa_po.id), 0)::int AS total
      FROM generate_series(
        CURRENT_DATE - INTERVAL '6 days',
        CURRENT_DATE,
        INTERVAL '1 day'
      ) AS d(day)
      LEFT JOIN (
        SELECT po.id, po.created_at::date AS day
        FROM postulaciones po
        INNER JOIN publicaciones p ON p.id = po.id_publicacion
        WHERE p.id_empresa = ${empresaId}
      ) AS empresa_po ON empresa_po.day = d.day::date
      GROUP BY d.day
      ORDER BY d.day
    `);

    return result.rows;
  },
};
