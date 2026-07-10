import { db } from "@/db";
import { sql } from "drizzle-orm";
import { ESTADO_VIAJE_ID } from "@/lib/fletes/constants";

export type CompletedViajeListRow = {
  viaje_id: number;
  codigo: string;
  origen_nombre: string;
  destino_nombre: string;
  total_pago: string;
  completado_en: string;
  pagado: number;
  transportista_payout_cents: number | null;
  distance_km: number;
};

export type CompletedViajeDetailRow = {
  viaje_id: number;
  publicacion_id: number;
  codigo: string;
  origen_nombre: string;
  destino_nombre: string;
  total_pago: string;
  peso: number;
  tipo_carga: string;
  fecha_salida: string;
  fecha_entrega_estimada: string;
  nombre_empresa: string;
  completado_en: string;
  pagado: number;
  transportista_payout_cents: number | null;
  platform_fee_cents: number | null;
  stripe_fee_cents: number | null;
  stripe_transfer_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_status: string | null;
  distance_km: number;
};

const COMPLETED_EARNINGS_SQL = sql`
  COALESCE(
    pe.transportista_payout_cents::numeric / 100.0,
    v.pagado::numeric,
    f.total_pago::numeric,
    0
  )
`;

export const transportistaViajesHistorialRepository = {
  listCompleted: async (transportistaId: number, limit = 50) => {
    const result = await db.execute<CompletedViajeListRow>(sql`
      SELECT
        v.id AS viaje_id,
        f.codigo,
        f.origen_nombre,
        f.destino_nombre,
        f.total_pago::text AS total_pago,
        v.updated_at::text AS completado_en,
        v.pagado,
        pe.transportista_payout_cents,
        (
          ST_Distance(
            f.origen_geom::geography,
            f.destino_geom::geography
          ) / 1000.0
        )::float8 AS distance_km
      FROM viajes v
      INNER JOIN fletes f ON f.id = v.id_flete
      LEFT JOIN payment_escrows pe ON pe.id_publicacion = v.id_publicacion
      WHERE v.id_transportista = ${transportistaId}
        AND v.id_estado = ${ESTADO_VIAJE_ID.COMPLETADO}
      ORDER BY v.updated_at DESC
      LIMIT ${limit}
    `);

    return result.rows;
  },

  sumCompletedEarnings: async (transportistaId: number) => {
    const result = await db.execute<{ total: string }>(sql`
      SELECT COALESCE(SUM(${COMPLETED_EARNINGS_SQL}), 0)::text AS total
      FROM viajes v
      INNER JOIN fletes f ON f.id = v.id_flete
      LEFT JOIN payment_escrows pe ON pe.id_publicacion = v.id_publicacion
      WHERE v.id_transportista = ${transportistaId}
        AND v.id_estado = ${ESTADO_VIAJE_ID.COMPLETADO}
    `);

    return Number(result.rows[0]?.total ?? 0);
  },

  getCompletedDetail: async (viajeId: number, transportistaId: number) => {
    const result = await db.execute<CompletedViajeDetailRow>(sql`
      SELECT
        v.id AS viaje_id,
        v.id_publicacion AS publicacion_id,
        f.codigo,
        f.origen_nombre,
        f.destino_nombre,
        f.total_pago::text AS total_pago,
        f.peso,
        ct.nombre AS tipo_carga,
        f.fecha_salida::text AS fecha_salida,
        f.fecha_entrega_estimada::text AS fecha_entrega_estimada,
        e.nombre AS nombre_empresa,
        v.updated_at::text AS completado_en,
        v.pagado,
        pe.transportista_payout_cents,
        pe.platform_fee_cents,
        pe.stripe_fee_cents,
        pe.stripe_transfer_id,
        pe.stripe_payment_intent_id,
        pe.status::text AS payment_status,
        (
          ST_Distance(
            f.origen_geom::geography,
            f.destino_geom::geography
          ) / 1000.0
        )::float8 AS distance_km
      FROM viajes v
      INNER JOIN fletes f ON f.id = v.id_flete
      INNER JOIN empresas e ON e.id = v.id_empresa
      INNER JOIN carga_types ct ON ct.id = f.id_tipo_carga
      LEFT JOIN payment_escrows pe ON pe.id_publicacion = v.id_publicacion
      WHERE v.id = ${viajeId}
        AND v.id_transportista = ${transportistaId}
        AND v.id_estado = ${ESTADO_VIAJE_ID.COMPLETADO}
      LIMIT 1
    `);

    return result.rows[0] ?? null;
  },
};
