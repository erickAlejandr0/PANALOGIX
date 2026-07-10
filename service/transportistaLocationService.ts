import { transportistaHomeRepository } from "@/repositories/transportistaHomeRepository";
import { transportistaLocationRepository } from "@/repositories/transportistaLocationRepository";
import { viajeRepository } from "@/repositories/viajeRepository";
import { realtimeBroadcastService } from "@/service/realtimeBroadcastService";
import {
  FASE_VIAJE,
  PROXIMITY_ARRIVAL_RADIUS_M,
  PROXIMITY_DESTINO_ALERT_M,
} from "@/lib/fletes/constants";
import { getPointCoordinates } from "@/lib/mapbox/geometry";
import { haversineMeters } from "@/lib/viajes/proximity";

export type UpdateLocationInput = {
  userId: number;
  lng: number;
  lat: number;
  heading?: number | null;
  speedKmh?: number | null;
};

export type PersistTransportistaLocationInput = {
  transportistaId: number;
  viajeId: number | null;
  lng: number;
  lat: number;
  heading?: number | null;
  speedKmh?: number | null;
  skipThrottle?: boolean;
};

export type LocationServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export const transportistaLocationService = {
  async persistTransportistaLocation(
    input: PersistTransportistaLocationInput,
  ): Promise<LocationServiceResult<{ updated: boolean }>> {
    try {
      if (!input.skipThrottle) {
        const shouldUpdate = await transportistaLocationRepository.shouldUpdate(
          input.transportistaId,
          input.lng,
          input.lat,
        );

        if (!shouldUpdate) {
          return {
            success: true,
            data: { updated: false },
          };
        }
      }

      await transportistaLocationRepository.upsert({
        transportistaId: input.transportistaId,
        lng: input.lng,
        lat: input.lat,
        heading: input.heading ?? null,
        speedKmh: input.speedKmh ?? null,
        viajeId: input.viajeId,
      });

      const empresaIds =
        await transportistaLocationRepository.getEmpresaIdsForActiveViaje(
          input.transportistaId,
        );

      await realtimeBroadcastService.publishTransportistaLocation(
        {
          transportistaId: input.transportistaId,
          viajeId: input.viajeId,
          lng: input.lng,
          lat: input.lat,
          heading: input.heading ?? null,
          speedKmh: input.speedKmh ?? null,
          updatedAt: new Date().toISOString(),
        },
        empresaIds,
      );

      if (input.viajeId) {
        await transportistaLocationService.checkProximityAlerts(
          input.viajeId,
          input.lng,
          input.lat,
        );
      }

      return {
        success: true,
        data: { updated: true },
      };
    } catch {
      return { success: false, error: "Error al actualizar la ubicación" };
    }
  },

  async updateLocation(
    input: UpdateLocationInput,
  ): Promise<
    LocationServiceResult<{
      updated: boolean;
      transportistaId: number;
    }>
  > {
    try {
      const profile = await transportistaHomeRepository.getProfileByUserId(
        input.userId,
      );

      if (!profile) {
        return { success: false, error: "Perfil de transportista no encontrado" };
      }

      if (!profile.disponible) {
        const activeViajeId =
          await transportistaLocationRepository.getActiveViajeId(
            profile.transportista_id,
          );

        if (!activeViajeId) {
          return {
            success: true,
            data: { updated: false, transportistaId: profile.transportista_id },
          };
        }
      }

      const activeViajeId =
        await transportistaLocationRepository.getActiveViajeId(
          profile.transportista_id,
        );

      const result = await transportistaLocationService.persistTransportistaLocation(
        {
          transportistaId: profile.transportista_id,
          viajeId: activeViajeId,
          lng: input.lng,
          lat: input.lat,
          heading: input.heading,
          speedKmh: input.speedKmh,
        },
      );

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return {
        success: true,
        data: {
          updated: result.data.updated,
          transportistaId: profile.transportista_id,
        },
      };
    } catch {
      return { success: false, error: "Error al actualizar la ubicación" };
    }
  },

  async checkProximityAlerts(viajeId: number, lng: number, lat: number) {
    const context = await viajeRepository.getProximityContext(viajeId);
    if (!context) return;

    const position = { lng, lat };
    const destino = getPointCoordinates(context.destino_geom);

    if (!destino) return;

    const destinoPoint = { lng: destino[0], lat: destino[1] };
    const distanceMeters = haversineMeters(position, destinoPoint);

    if (
      context.fase === FASE_VIAJE.HACIA_DESTINO &&
      !context.alerta_destino_enviada &&
      distanceMeters <= PROXIMITY_DESTINO_ALERT_M
    ) {
      await viajeRepository.markDestinoAlertSent(viajeId);
      await realtimeBroadcastService.publishViajeProximityAlert(
        {
          viajeId: context.id,
          publicacionId: context.id_publicacion,
          transportistaId: context.id_transportista,
          type: "approaching_destination",
          message: "El transportista está por llegar al destino",
          codigo: context.codigo,
          destinoNombre: context.destino_nombre,
          distanceMeters: Math.round(distanceMeters),
        },
        context.id_empresa,
      );
    }

    if (
      (context.fase === FASE_VIAJE.HACIA_DESTINO ||
        context.fase === FASE_VIAJE.EN_DESTINO) &&
      !context.alerta_llegada_enviada &&
      distanceMeters <= PROXIMITY_ARRIVAL_RADIUS_M
    ) {
      await viajeRepository.markLlegadaAlertSent(viajeId);
      await realtimeBroadcastService.publishViajeProximityAlert(
        {
          viajeId: context.id,
          publicacionId: context.id_publicacion,
          transportistaId: context.id_transportista,
          type: "arrived_destination",
          message: "El transportista llegó al destino",
          codigo: context.codigo,
          destinoNombre: context.destino_nombre,
          distanceMeters: Math.round(distanceMeters),
        },
        context.id_empresa,
      );
    }
  },
};
