import { db } from "@/db";
import { sql } from "drizzle-orm";

export type ActivePublicacionRow = {
  id: number;
  origen_nombre: string;
  destino_nombre: string;
  origen_geom: unknown;
  destino_geom: unknown;
  estado: string;
  codigo: string;
};

export type ActiveDriverRow = {
  viaje_id: number;
  flete_id: number;
  nombre: string;
  apellido: string;
  placa: string | null;
  estado: string;
  fase: string;
  fecha_entrega_estimada: string;
  origen_geom: unknown;
  destino_geom: unknown;
};

export type DashboardMetricsRow = {
  fletes_hoy: number;
  publicaciones_publicadas: number;
  gasto_total: string;
};

export const dashboardRepository = {
  getActivePublicaciones: async (empresaId: number) => {
    const result = await db.execute<ActivePublicacionRow>(sql`
      SELECT
        p.id,
        f.origen_nombre,
        f.destino_nombre,
        ST_AsGeoJSON(f.origen_geom)::json AS origen_geom,
        ST_AsGeoJSON(f.destino_geom)::json AS destino_geom,
        p.estado::text AS estado,
        f.codigo
      FROM publicaciones p
      INNER JOIN fletes f ON f.id = p.id_flete
      WHERE p.id_empresa = ${empresaId}
        AND p.estado = 'publicado'
      ORDER BY p.created_at DESC
    `);

    return result.rows;
  },

  getActiveDrivers: async (empresaId: number) => {
    const result = await db.execute<ActiveDriverRow & {
      transportista_id: number;
      ubicacion_geom: unknown;
    }>(sql`
      SELECT DISTINCT ON (v.id)
        v.id AS viaje_id,
        f.id AS flete_id,
        v.id_transportista AS transportista_id,
        t.nombre,
        t.apellido,
        fl.placa,
        ev.nombre AS estado,
        v.fase::text AS fase,
        f.fecha_entrega_estimada::text AS fecha_entrega_estimada,
        ST_AsGeoJSON(f.origen_geom)::json AS origen_geom,
        ST_AsGeoJSON(f.destino_geom)::json AS destino_geom,
        ST_AsGeoJSON(tu.ubicacion_geom)::json AS ubicacion_geom
      FROM viajes v
      INNER JOIN fletes f ON f.id = v.id_flete
      INNER JOIN transportistas t ON t.id = v.id_transportista
      INNER JOIN flota fl ON fl.id = v.id_flota
      INNER JOIN estado_viaje ev ON ev.id = v.id_estado
      LEFT JOIN transportista_ubicaciones tu ON tu.id_transportista = v.id_transportista
      WHERE v.id_empresa = ${empresaId}
        AND ev.nombre = 'en_curso'
      ORDER BY v.id, v.updated_at DESC
    `);

    return result.rows;
  },

  getActiveViajeIds: async (empresaId: number) => {
    const result = await db.execute<{ viaje_id: number }>(sql`
      SELECT v.id AS viaje_id
      FROM viajes v
      INNER JOIN estado_viaje ev ON ev.id = v.id_estado
      WHERE v.id_empresa = ${empresaId}
        AND ev.nombre = 'en_curso'
    `);

    return result.rows.map((row) => row.viaje_id);
  },

  getMetrics: async (empresaId: number) => {
    const result = await db.execute<DashboardMetricsRow>(sql`
      SELECT
        (
          SELECT COUNT(*)::int
          FROM fletes
          WHERE id_empresa = ${empresaId}
            AND created_at::date = CURRENT_DATE
        ) AS fletes_hoy,
        (
          SELECT COUNT(*)::int
          FROM publicaciones
          WHERE id_empresa = ${empresaId}
            AND estado = 'publicado'
        ) AS publicaciones_publicadas,
        (
          SELECT COALESCE(SUM(total_pago), 0)::text
          FROM fletes
          WHERE id_empresa = ${empresaId}
        ) AS gasto_total
    `);

    return (
      result.rows[0] ?? {
        fletes_hoy: 0,
        publicaciones_publicadas: 0,
        gasto_total: "0",
      }
    );
  },

  countActiveDrivers: async (empresaId: number) => {
    const result = await db.execute<{ total: number }>(sql`
      SELECT COUNT(DISTINCT v.id_transportista)::int AS total
      FROM viajes v
      INNER JOIN estado_viaje ev ON ev.id = v.id_estado
      WHERE v.id_empresa = ${empresaId}
        AND ev.nombre = 'en_curso'
    `);

    return result.rows[0]?.total ?? 0;
  },
};
