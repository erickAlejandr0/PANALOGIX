import { getPointCoordinates } from "@/lib/mapbox/geometry";
import { breakdownToDto, buildPaymentBreakdown } from "@/lib/stripe/fees";
import type { PaymentBreakdownDto } from "@/lib/stripe/fees";
import {
  extractGeocodeZone,
  reverseGeocodeFeature,
} from "@/lib/mapbox/geocoding-format";
import { getSpeedLimitMatch } from "@/lib/mapbox/map-matching";
import { getDrivingRoute } from "@/lib/mapbox/directions";
import { getMapboxServerToken } from "@/lib/mapbox/token";
import { getDriverInitials } from "@/lib/transportista/profile";
import { flotaRepository } from "@/repositories/flotaRepository";
import { transportistaHomeRepository } from "@/repositories/transportistaHomeRepository";

export type NearbyFlete = {
  publicacionId: number;
  codigo: string;
  origenNombre: string;
  destinoNombre: string;
  origen: { lng: number; lat: number };
  destino: { lng: number; lat: number };
  totalPago: string;
  peso: number;
  fechaSalida: string;
  distanceKm: number;
  nombreEmpresa: string;
  pagoDesglose: PaymentBreakdownDto | null;
  cargaPeligrosa: boolean;
};

export type TransportistaVehiculo = {
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  tipoNombre: string;
};

export type TransportistaProfile = {
  transportistaId: number;
  nombre: string;
  apellido: string;
  email: string;
  cedula: string;
  telefono: string;
  direccion: string;
  initials: string;
  photoUrl: string | null;
  disponible: boolean;
  defaultFlotaId: number | null;
  totalViajes: number;
  anosActivos: number;
  vehiculo: TransportistaVehiculo | null;
};

function getAnosActivos(createdAt: Date) {
  const now = new Date();
  let years = now.getFullYear() - createdAt.getFullYear();
  const monthDiff = now.getMonth() - createdAt.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && now.getDate() < createdAt.getDate())
  ) {
    years -= 1;
  }

  return Math.max(0, years);
}

const MIN_RADIUS_KM = 5;
const MAX_RADIUS_KM = 100;

function mapNearbyRow(row: Awaited<
  ReturnType<typeof transportistaHomeRepository.getNearbyPublicaciones>
>[number]): NearbyFlete | null {
  const origenCoords = getPointCoordinates(row.origen_geom);
  const destinoCoords = getPointCoordinates(row.destino_geom);

  if (!origenCoords || !destinoCoords) {
    return null;
  }

  return {
    publicacionId: row.publicacion_id,
    codigo: row.codigo,
    origenNombre: row.origen_nombre,
    destinoNombre: row.destino_nombre,
    origen: { lng: origenCoords[0], lat: origenCoords[1] },
    destino: { lng: destinoCoords[0], lat: destinoCoords[1] },
    totalPago: row.total_pago,
    peso: row.peso,
    fechaSalida: row.fecha_salida,
    distanceKm: Math.round((row.distance_m / 1000) * 10) / 10,
    nombreEmpresa: row.nombre_empresa,
    cargaPeligrosa: row.carga_peligrosa,
    pagoDesglose: (() => {
      const breakdown = buildPaymentBreakdown(row.total_pago);
      return breakdown ? breakdownToDto(breakdown) : null;
    })(),
  };
}

export const transportistaHomeService = {
  validateRadiusKm(radiusKm: number) {
    if (!Number.isFinite(radiusKm)) {
      return { error: "Radio inválido" };
    }
    if (radiusKm < MIN_RADIUS_KM || radiusKm > MAX_RADIUS_KM) {
      return {
        error: `El radio debe estar entre ${MIN_RADIUS_KM} y ${MAX_RADIUS_KM} km`,
      };
    }
    return null;
  },

  async getNearbyFletes(lng: number, lat: number, radiusKm: number) {
    const rows = await transportistaHomeRepository.getNearbyPublicaciones(
      lng,
      lat,
      radiusKm * 1000,
    );

    return rows
      .map(mapNearbyRow)
      .filter((item): item is NearbyFlete => item !== null);
  },

  async getProfile(userId: number): Promise<TransportistaProfile | null> {
    const row = await transportistaHomeRepository.getProfileByUserId(userId);
    if (!row) return null;

    const [flotas, totalViajes, vehiculoRow] = await Promise.all([
      flotaRepository.getByTransportista(row.transportista_id),
      transportistaHomeRepository.countCompletedViajes(row.transportista_id),
      transportistaHomeRepository.getPrimaryVehiculo(row.transportista_id),
    ]);

    return {
      transportistaId: row.transportista_id,
      nombre: row.nombre,
      apellido: row.apellido,
      email: row.email,
      cedula: row.cedula,
      telefono: row.telefono,
      direccion: row.direccion,
      initials: getDriverInitials(row.nombre, row.apellido),
      photoUrl: row.photo_url,
      disponible: row.disponible,
      defaultFlotaId: flotas[0]?.id ?? null,
      totalViajes,
      anosActivos: getAnosActivos(row.created_at),
      vehiculo: vehiculoRow
        ? {
            placa: vehiculoRow.placa,
            marca: vehiculoRow.marca,
            modelo: vehiculoRow.modelo,
            anio: vehiculoRow.anio,
            tipoNombre: vehiculoRow.tipo_nombre,
          }
        : null,
    };
  },

  async updateDisponible(userId: number, disponible: boolean) {
    const updated = await transportistaHomeRepository.updateDisponible(
      userId,
      disponible,
    );
    if (!updated) {
      return { success: false as const, error: "Perfil de transportista no encontrado" };
    }

    const profile = await this.getProfile(userId);
    if (!profile) {
      return { success: false as const, error: "Perfil de transportista no encontrado" };
    }

    return { success: true as const, data: profile };
  },

  async reverseGeocodePlace(lng: number, lat: number) {
    const token = getMapboxServerToken();
    if (!token) {
      return { success: false as const, error: "Mapbox no configurado" };
    }

    const feature = await reverseGeocodeFeature(lng, lat, token);
    if (!feature) {
      return { success: false as const, error: "No se pudo obtener la dirección" };
    }

    const zone = extractGeocodeZone(feature, lng, lat);
    if (!zone) {
      return { success: false as const, error: "No se pudo formatear la dirección" };
    }

    return { success: true as const, data: zone };
  },

  async getRoute(
    origen: { lng: number; lat: number },
    destino: { lng: number; lat: number },
    options?: { useTraffic?: boolean },
  ) {
    const result = await getDrivingRoute(
      [origen.lng, origen.lat],
      [destino.lng, destino.lat],
      {
        useTraffic: options?.useTraffic ?? true,
        includeSteps: true,
      },
    );

    if (!result.ok) {
      return { success: false as const, error: result.error.message };
    }

    return {
      success: true as const,
      data: {
        geometry: result.data.geometry,
        durationSeconds: result.data.durationSeconds,
        distanceMeters: result.data.distanceMeters,
        steps: result.data.steps,
      },
    };
  },

  async getSpeedLimit(lng: number, lat: number, bearing?: number) {
    const match = await getSpeedLimitMatch(lng, lat, bearing);
    if (!match) {
      return {
        success: true as const,
        data: {
          speedLimitKmh: null,
          segmentKey: null,
          hasSpeedLimitData: false,
        },
      };
    }

    return {
      success: true as const,
      data: {
        speedLimitKmh: match.speedLimitKmh,
        segmentKey: match.segmentKey,
        hasSpeedLimitData: match.hasSpeedLimitData,
      },
    };
  },
};
