import { db } from "@/db";
import { transportistas, usuarios } from "@/db/schema";
import { ESTADO_VIAJE_ID } from "@/lib/fletes/constants";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";

export type NearbyFleteRow = {
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
  distance_m: number;
  nombre_empresa: string;
};

export type TransportistaProfileRow = {
  transportista_id: number;
  nombre: string;
  apellido: string;
  email: string;
  cedula: string;
  telefono: string;
  direccion: string;
  photo_url: string | null;
  disponible: boolean;
  created_at: Date;
};

export type TransportistaVehiculoRow = {
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  tipo_nombre: string;
};

export const transportistaHomeRepository = {
  getNearbyPublicaciones: async (
    lng: number,
    lat: number,
    radiusMeters: number,
  ) => {
    const result = await db.execute<NearbyFleteRow>(sql`
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
        ST_AsGeoJSON(f.destino_geom)::json AS destino_geom,
        ST_Distance(
          f.origen_geom::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) AS distance_m
      FROM publicaciones p
      INNER JOIN fletes f ON f.id = p.id_flete
      INNER JOIN empresas e ON e.id = f.id_empresa
      WHERE p.estado = 'publicado'
        AND ST_DWithin(
          f.origen_geom::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY distance_m ASC
      LIMIT 100
    `);

    return result.rows;
  },

  getProfileByUserId: async (userId: number) => {
    const result = await db
      .select({
        transportista_id: transportistas.id,
        nombre: transportistas.nombre,
        apellido: transportistas.apellido,
        email: usuarios.email,
        cedula: transportistas.cedula,
        telefono: transportistas.telefono,
        direccion: transportistas.direccion,
        photo_url: usuarios.photoUrl,
        disponible: transportistas.disponible,
        created_at: transportistas.createdAt,
      })
      .from(transportistas)
      .innerJoin(usuarios, eq(transportistas.id_usuario, usuarios.id))
      .where(eq(transportistas.id_usuario, userId))
      .limit(1);

    return result[0] ?? null;
  },

  countCompletedViajes: async (transportistaId: number) => {
    const result = await db.execute<{ total: string }>(sql`
      SELECT COUNT(*)::text AS total
      FROM viajes
      WHERE id_transportista = ${transportistaId}
        AND id_estado = ${ESTADO_VIAJE_ID.COMPLETADO}
    `);

    return Number(result.rows[0]?.total ?? 0);
  },

  getPrimaryVehiculo: async (transportistaId: number) => {
    const result = await db.execute<TransportistaVehiculoRow>(sql`
      SELECT
        f.placa,
        f.marca,
        f.modelo,
        f.anio,
        cv.nombre_comun AS tipo_nombre
      FROM flota f
      INNER JOIN config_vehiculo cv ON cv.id = f.id_config
      WHERE f.id_transportista = ${transportistaId}
      ORDER BY f.created_at ASC
      LIMIT 1
    `);

    return result.rows[0] ?? null;
  },

  updateDisponible: async (userId: number, disponible: boolean) => {
    const result = await db
      .update(transportistas)
      .set({ disponible, updatedAt: new Date() })
      .where(eq(transportistas.id_usuario, userId))
      .returning();

    return result[0] ?? null;
  },

  updateDisponibleByTransportistaId: async (
    transportistaId: number,
    disponible: boolean,
  ) => {
    const result = await db
      .update(transportistas)
      .set({ disponible, updatedAt: new Date() })
      .where(eq(transportistas.id, transportistaId))
      .returning();

    return result[0] ?? null;
  },
};
