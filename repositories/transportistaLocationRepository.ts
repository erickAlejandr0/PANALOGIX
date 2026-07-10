import { db } from "@/db";
import { sql } from "drizzle-orm";
import { makePointSql } from "@/lib/mapbox/point-sql";

export type UpsertLocationInput = {
  transportistaId: number;
  lng: number;
  lat: number;
  heading: number | null;
  speedKmh: number | null;
  viajeId: number | null;
};

export type LocationRow = {
  id_transportista: number;
  ubicacion_geom: unknown;
  heading: number | null;
  speed_kmh: number | null;
  id_viaje: number | null;
  updated_at: Date;
};

export type DisponibleNearPointRow = {
  transportista_id: number;
  distance_m: number;
};

const MIN_UPDATE_INTERVAL_MS = 3_000;
const MIN_UPDATE_DISTANCE_M = 30;

export const transportistaLocationRepository = {
  getByTransportistaId: async (transportistaId: number) => {
    const result = await db.execute<LocationRow>(sql`
      SELECT
        id_transportista,
        ST_AsGeoJSON(ubicacion_geom)::json AS ubicacion_geom,
        heading,
        speed_kmh,
        id_viaje,
        updated_at
      FROM transportista_ubicaciones
      WHERE id_transportista = ${transportistaId}
      LIMIT 1
    `);

    return result.rows[0] ?? null;
  },

  shouldUpdate: async (transportistaId: number, lng: number, lat: number) => {
    const result = await db.execute<{
      should_update: boolean;
    }>(sql`
      SELECT
        CASE
          WHEN tu.updated_at IS NULL THEN true
          WHEN EXTRACT(EPOCH FROM (NOW() - tu.updated_at)) * 1000 >= ${MIN_UPDATE_INTERVAL_MS}
            AND ST_Distance(
              tu.ubicacion_geom::geography,
              ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
            ) >= ${MIN_UPDATE_DISTANCE_M}
          THEN true
          ELSE false
        END AS should_update
      FROM transportista_ubicaciones tu
      WHERE tu.id_transportista = ${transportistaId}
    `);

    if (result.rows.length === 0) {
      return true;
    }

    return result.rows[0]?.should_update ?? true;
  },

  upsert: async (input: UpsertLocationInput) => {
    const result = await db.execute<LocationRow>(sql`
      INSERT INTO transportista_ubicaciones (
        id_transportista,
        ubicacion_geom,
        heading,
        speed_kmh,
        id_viaje,
        updated_at
      )
      VALUES (
        ${input.transportistaId},
        ${makePointSql(input.lng, input.lat)},
        ${input.heading},
        ${input.speedKmh},
        ${input.viajeId},
        NOW()
      )
      ON CONFLICT (id_transportista) DO UPDATE SET
        ubicacion_geom = EXCLUDED.ubicacion_geom,
        heading = EXCLUDED.heading,
        speed_kmh = EXCLUDED.speed_kmh,
        id_viaje = EXCLUDED.id_viaje,
        updated_at = NOW()
      RETURNING
        id_transportista,
        ST_AsGeoJSON(ubicacion_geom)::json AS ubicacion_geom,
        heading,
        speed_kmh,
        id_viaje,
        updated_at
    `);

    return result.rows[0] ?? null;
  },

  findDisponibleNearPoint: async (
    lng: number,
    lat: number,
    radiusMeters: number,
  ) => {
    const result = await db.execute<DisponibleNearPointRow>(sql`
      SELECT
        tu.id_transportista AS transportista_id,
        ST_Distance(
          tu.ubicacion_geom::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) AS distance_m
      FROM transportista_ubicaciones tu
      INNER JOIN transportistas t ON t.id = tu.id_transportista
      WHERE t.disponible = true
        AND ST_DWithin(
          tu.ubicacion_geom::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
    `);

    return result.rows;
  },

  getEmpresaIdsForActiveViaje: async (transportistaId: number) => {
    const result = await db.execute<{ id_empresa: number }>(sql`
      SELECT DISTINCT v.id_empresa
      FROM viajes v
      INNER JOIN estado_viaje ev ON ev.id = v.id_estado
      WHERE v.id_transportista = ${transportistaId}
        AND ev.nombre = 'en_curso'
    `);

    return result.rows.map((row) => row.id_empresa);
  },

  getActiveViajeId: async (transportistaId: number) => {
    const result = await db.execute<{ id: number }>(sql`
      SELECT v.id
      FROM viajes v
      INNER JOIN estado_viaje ev ON ev.id = v.id_estado
      WHERE v.id_transportista = ${transportistaId}
        AND ev.nombre = 'en_curso'
      ORDER BY v.updated_at DESC
      LIMIT 1
    `);

    return result.rows[0]?.id ?? null;
  },
};
