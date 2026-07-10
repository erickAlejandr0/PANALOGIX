import { db } from "@/db";
import { sql } from "drizzle-orm";

export type EntregaListRow = {
  id: number;
  fase: string;
  estado_viaje: string;
  codigo: string;
  origen_nombre: string;
  destino_nombre: string;
  peso: number;
  nombre_transportista: string;
  apellido_transportista: string;
  updated_at: string;
};

export type InspeccionContextRow = {
  id: number;
  fase: string;
  codigo: string;
  peso: number;
  total_pago: string;
  origen_nombre: string;
  destino_nombre: string;
  fecha_entrega_estimada: string;
  tipo_carga: string;
  nombre_empresa: string;
  nombre_transportista: string;
  apellido_transportista: string;
  cedula: string;
  placa: string;
  vehiculo: string;
  updated_at: string;
  inspeccion_checklist: unknown;
  inspeccion_iniciada_at: string | null;
};

export const entregasRepository = {
  // Lista las entregas de la empresa (viajes de sus fletes) para el tablero.
  listByEmpresa: async (empresaId: number) => {
    const result = await db.execute<EntregaListRow>(sql`
      SELECT
        v.id,
        v.fase,
        ev.nombre AS estado_viaje,
        f.codigo,
        f.origen_nombre,
        f.destino_nombre,
        f.peso,
        t.nombre AS nombre_transportista,
        t.apellido AS apellido_transportista,
        v.updated_at::text AS updated_at
      FROM viajes v
      INNER JOIN fletes f ON f.id = v.id_flete
      INNER JOIN estado_viaje ev ON ev.id = v.id_estado
      INNER JOIN transportistas t ON t.id = v.id_transportista
      WHERE v.id_empresa = ${empresaId}
      ORDER BY v.updated_at DESC
      LIMIT 50
    `);

    return result.rows;
  },

  // Contexto de inspeccion para una entrega concreta, con datos del vehiculo y
  // del transportista. Se filtra por empresa para garantizar el ownership.
  getInspeccionContext: async (viajeId: number, empresaId: number) => {
    const result = await db.execute<InspeccionContextRow>(sql`
      SELECT
        v.id,
        v.fase,
        f.codigo,
        f.peso,
        f.total_pago::text AS total_pago,
        f.origen_nombre,
        f.destino_nombre,
        f.fecha_entrega_estimada::text AS fecha_entrega_estimada,
        ct.nombre AS tipo_carga,
        e.nombre AS nombre_empresa,
        t.nombre AS nombre_transportista,
        t.apellido AS apellido_transportista,
        t.cedula,
        fl.placa,
        cv.nombre_comun AS vehiculo,
        v.updated_at::text AS updated_at,
        v.inspeccion_checklist,
        v.inspeccion_iniciada_at::text AS inspeccion_iniciada_at
      FROM viajes v
      INNER JOIN fletes f ON f.id = v.id_flete
      INNER JOIN carga_types ct ON ct.id = f.id_tipo_carga
      INNER JOIN empresas e ON e.id = v.id_empresa
      INNER JOIN transportistas t ON t.id = v.id_transportista
      INNER JOIN flota fl ON fl.id = v.id_flota
      INNER JOIN config_vehiculo cv ON cv.id = fl.id_config
      WHERE v.id = ${viajeId}
        AND v.id_empresa = ${empresaId}
      LIMIT 1
    `);

    return result.rows[0] ?? null;
  },
};
