import { db } from "@/db";
import { viajes } from "@/db/schema";
import type { InspeccionChecklistItem } from "@/lib/entregas/types";
import { parseStoredChecklist } from "@/lib/entregas/inspeccion-checklist";
import { FASES_VIAJE_ACTIVAS } from "@/lib/fletes/constants";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";

export type CreateViajeData = {
  id_flete: number;
  id_publicacion: number;
  id_postulacion: number;
  id_transportista: number;
  id_empresa: number;
  id_flota: number;
  id_estado: number;
  fase: string;
  fecha_inicio: string;
  fecha_fin: string;
  pagado: number;
};

export type ActiveViajeRow = {
  id: number;
  fase: string;
  id_publicacion: number;
  id_postulacion: number;
  codigo: string;
  origen_nombre: string;
  destino_nombre: string;
  total_pago: string;
  peso: number;
  fecha_salida: string;
  nombre_empresa: string;
  origen_geom: unknown;
  destino_geom: unknown;
  inspeccion_checklist: unknown;
};

export type ViajeProximityRow = {
  id: number;
  fase: string;
  id_publicacion: number;
  id_empresa: number;
  id_transportista: number;
  id_flete: number;
  codigo: string;
  destino_nombre: string;
  alerta_destino_enviada: boolean;
  alerta_llegada_enviada: boolean;
  origen_geom: unknown;
  destino_geom: unknown;
};

export type ViajeMoveContextRow = {
  id: number;
  fase: string;
  id_transportista: number;
  estado_viaje: string;
  origen_geom: unknown;
  destino_geom: unknown;
};

export type ViajeNegociacionRow = {
  id: number;
  fase: string;
  id_estado: number;
  id_publicacion: number;
  id_postulacion: number;
  id_flete: number;
  id_empresa: number;
  id_transportista: number;
  codigo_verificacion_hash: string | null;
  codigo_verificacion_expira: string | null;
  codigo_verificacion_intentos: number;
  codigo: string;
  origen_nombre: string;
  destino_nombre: string;
  total_pago: string;
  peso: number;
  fecha_salida: string;
  fecha_entrega_estimada: string;
  tipo_carga: string;
  nombre_empresa: string;
  nombre_transportista: string;
  apellido_transportista: string;
};

const ACTIVE_FASES_SQL = sql.join(
  FASES_VIAJE_ACTIVAS.map((fase) => sql`${fase}`),
  sql`, `,
);

export const viajeRepository = {
  create: async (data: CreateViajeData) => {
    const result = await db.insert(viajes).values(data).returning();
    return result[0];
  },

  getById: async (id: number) => {
    return db.query.viajes.findFirst({
      where: eq(viajes.id, id),
    });
  },

  getByTransportista: async (transportistaId: number) => {
    return db.query.viajes.findMany({
      where: eq(viajes.id_transportista, transportistaId),
    });
  },

  getByEmpresa: async (empresaId: number) => {
    return db.query.viajes.findMany({
      where: eq(viajes.id_empresa, empresaId),
    });
  },

  getActiveForTransportista: async (transportistaId: number) => {
    const result = await db.execute<ActiveViajeRow>(sql`
      SELECT
        v.id,
        v.fase,
        v.id_publicacion,
        v.id_postulacion,
        f.codigo,
        f.origen_nombre,
        f.destino_nombre,
        f.total_pago::text AS total_pago,
        f.peso,
        f.fecha_salida::text AS fecha_salida,
        e.nombre AS nombre_empresa,
        ST_AsGeoJSON(f.origen_geom)::json AS origen_geom,
        ST_AsGeoJSON(f.destino_geom)::json AS destino_geom,
        v.inspeccion_checklist
      FROM viajes v
      INNER JOIN fletes f ON f.id = v.id_flete
      INNER JOIN empresas e ON e.id = v.id_empresa
      INNER JOIN estado_viaje ev ON ev.id = v.id_estado
      WHERE v.id_transportista = ${transportistaId}
        AND ev.nombre = 'en_curso'
        AND v.fase IN (${ACTIVE_FASES_SQL})
      ORDER BY v.updated_at DESC
      LIMIT 1
    `);

    return result.rows[0] ?? null;
  },

  getProximityContext: async (viajeId: number) => {
    const result = await db.execute<ViajeProximityRow>(sql`
      SELECT
        v.id,
        v.fase,
        v.id_publicacion,
        v.id_empresa,
        v.id_transportista,
        v.id_flete,
        f.codigo,
        f.destino_nombre,
        v.alerta_destino_enviada,
        v.alerta_llegada_enviada,
        ST_AsGeoJSON(f.origen_geom)::json AS origen_geom,
        ST_AsGeoJSON(f.destino_geom)::json AS destino_geom
      FROM viajes v
      INNER JOIN fletes f ON f.id = v.id_flete
      INNER JOIN estado_viaje ev ON ev.id = v.id_estado
      WHERE v.id = ${viajeId}
        AND ev.nombre = 'en_curso'
      LIMIT 1
    `);

    return result.rows[0] ?? null;
  },

  getMoveContext: async (viajeId: number) => {
    const result = await db.execute<ViajeMoveContextRow>(sql`
      SELECT
        v.id,
        v.fase,
        v.id_transportista,
        ev.nombre AS estado_viaje,
        ST_AsGeoJSON(f.origen_geom)::json AS origen_geom,
        ST_AsGeoJSON(f.destino_geom)::json AS destino_geom
      FROM viajes v
      INNER JOIN fletes f ON f.id = v.id_flete
      INNER JOIN estado_viaje ev ON ev.id = v.id_estado
      WHERE v.id = ${viajeId}
        AND ev.nombre = 'en_curso'
      LIMIT 1
    `);

    return result.rows[0] ?? null;
  },

  updateFase: async (viajeId: number, fase: string) => {
    const result = await db
      .update(viajes)
      .set({ fase, updatedAt: new Date() })
      .where(eq(viajes.id, viajeId))
      .returning();

    return result[0] ?? null;
  },

  markDestinoAlertSent: async (viajeId: number) => {
    const result = await db
      .update(viajes)
      .set({ alerta_destino_enviada: true, updatedAt: new Date() })
      .where(eq(viajes.id, viajeId))
      .returning();

    return result[0] ?? null;
  },

  markLlegadaAlertSent: async (viajeId: number) => {
    const result = await db
      .update(viajes)
      .set({ alerta_llegada_enviada: true, updatedAt: new Date() })
      .where(eq(viajes.id, viajeId))
      .returning();

    return result[0] ?? null;
  },

  updateEstado: async (viajeId: number, idEstado: number, fase?: string) => {
    const result = await db
      .update(viajes)
      .set({
        id_estado: idEstado,
        ...(fase ? { fase } : {}),
        updatedAt: new Date(),
      })
      .where(eq(viajes.id, viajeId))
      .returning();

    return result[0] ?? null;
  },

  getNegociacionContext: async (viajeId: number) => {
    const result = await db.execute<ViajeNegociacionRow>(sql`
      SELECT
        v.id,
        v.fase,
        v.id_estado,
        v.id_publicacion,
        v.id_postulacion,
        v.id_flete,
        v.id_empresa,
        v.id_transportista,
        v.codigo_verificacion_hash,
        v.codigo_verificacion_expira::text AS codigo_verificacion_expira,
        v.codigo_verificacion_intentos,
        f.codigo,
        f.origen_nombre,
        f.destino_nombre,
        f.total_pago::text AS total_pago,
        f.peso,
        f.fecha_salida::text AS fecha_salida,
        f.fecha_entrega_estimada::text AS fecha_entrega_estimada,
        ct.nombre AS tipo_carga,
        e.nombre AS nombre_empresa,
        t.nombre AS nombre_transportista,
        t.apellido AS apellido_transportista
      FROM viajes v
      INNER JOIN fletes f ON f.id = v.id_flete
      INNER JOIN empresas e ON e.id = v.id_empresa
      INNER JOIN transportistas t ON t.id = v.id_transportista
      INNER JOIN carga_types ct ON ct.id = f.id_tipo_carga
      WHERE v.id = ${viajeId}
      LIMIT 1
    `);

    return result.rows[0] ?? null;
  },

  setCodigoVerificacion: async (
    viajeId: number,
    hash: string,
    expira: Date,
  ) => {
    const result = await db
      .update(viajes)
      .set({
        codigo_verificacion_hash: hash,
        codigo_verificacion_expira: expira,
        codigo_verificacion_intentos: 0,
        updatedAt: new Date(),
      })
      .where(eq(viajes.id, viajeId))
      .returning();

    return result[0] ?? null;
  },

  incrementCodigoIntento: async (viajeId: number) => {
    const result = await db
      .update(viajes)
      .set({
        codigo_verificacion_intentos: sql`${viajes.codigo_verificacion_intentos} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(viajes.id, viajeId))
      .returning();

    return result[0] ?? null;
  },

  clearCodigoVerificacion: async (viajeId: number) => {
    await db
      .update(viajes)
      .set({
        codigo_verificacion_hash: null,
        codigo_verificacion_expira: null,
        codigo_verificacion_intentos: 0,
        updatedAt: new Date(),
      })
      .where(eq(viajes.id, viajeId));
  },

  initInspeccionChecklist: async (
    viajeId: number,
    checklist: InspeccionChecklistItem[],
  ) => {
    const result = await db
      .update(viajes)
      .set({
        inspeccion_checklist: checklist,
        inspeccion_iniciada_at: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(viajes.id, viajeId))
      .returning();

    return result[0] ?? null;
  },

  getInspeccionChecklist: async (
    viajeId: number,
  ): Promise<InspeccionChecklistItem[] | null> => {
    const viaje = await viajeRepository.getById(viajeId);
    if (!viaje) return null;
    return parseStoredChecklist(viaje.inspeccion_checklist);
  },

  updateInspeccionChecklistItem: async (
    viajeId: number,
    itemId: string,
    completed: boolean,
  ): Promise<InspeccionChecklistItem[] | null> => {
    const viaje = await viajeRepository.getById(viajeId);
    if (!viaje) return null;

    const items = parseStoredChecklist(viaje.inspeccion_checklist);
    if (!items) return null;

    const index = items.findIndex((item) => item.id === itemId);
    if (index === -1) return null;

    if (items[index].completed === completed) {
      return items;
    }

    const next = items.map((item, idx) =>
      idx === index ? { ...item, completed } : item,
    );

    const result = await db
      .update(viajes)
      .set({
        inspeccion_checklist: next,
        updatedAt: new Date(),
      })
      .where(eq(viajes.id, viajeId))
      .returning();

    if (!result[0]) return null;
    return parseStoredChecklist(result[0].inspeccion_checklist);
  },

  completeAllInspeccionItems: async (
    viajeId: number,
  ): Promise<InspeccionChecklistItem[] | null> => {
    const viaje = await viajeRepository.getById(viajeId);
    if (!viaje) return null;

    const items = parseStoredChecklist(viaje.inspeccion_checklist);
    if (!items) return null;

    const next = items.map((item) => ({ ...item, completed: true }));

    const result = await db
      .update(viajes)
      .set({
        inspeccion_checklist: next,
        updatedAt: new Date(),
      })
      .where(eq(viajes.id, viajeId))
      .returning();

    if (!result[0]) return null;
    return parseStoredChecklist(result[0].inspeccion_checklist);
  },

  clearInspeccionChecklist: async (viajeId: number) => {
    await db
      .update(viajes)
      .set({
        inspeccion_checklist: null,
        inspeccion_iniciada_at: null,
        updatedAt: new Date(),
      })
      .where(eq(viajes.id, viajeId));
  },
};
