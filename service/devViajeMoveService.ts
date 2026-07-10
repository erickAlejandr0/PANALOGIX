import { deriveEntregaEstado } from "@/lib/entregas/negociacion-mappers";
import type { EntregaEstado } from "@/lib/entregas/types";
import { resolveViajeMovePlan } from "@/lib/dev/viaje-move-plan";
import {
  distanceToGeomMeters,
  pointFromGeom,
  PROXIMITY_ARRIVAL_RADIUS_M,
} from "@/lib/viajes/proximity";
import { viajeRepository } from "@/repositories/viajeRepository";
import { negociacionViajeService } from "@/service/negociacionViajeService";
import { transportistaLocationService } from "@/service/transportistaLocationService";
import { viajeService } from "@/service/viajeService";

export type DevViajeMoveResult =
  | {
      success: true;
      data: {
        viajeId: number;
        target: "origen" | "destino";
        position: { lng: number; lat: number };
        distanceToTargetM: number;
        transition: "confirmar_recogida" | "anunciar_llegada";
        faseBefore: string;
        faseAfter: string;
        entregaEstadoBefore: EntregaEstado;
        entregaEstadoAfter: EntregaEstado;
        locationUpdated: boolean;
      };
    }
  | { success: false; error: string };

export const devViajeMoveService = {
  /**
   * Coloca al transportista en el origen o destino del flete (según la fase)
   * y ejecuta la transición geográfica real. Se detiene en `en_destino`.
   */
  async move(viajeId: number): Promise<DevViajeMoveResult> {
    try {
      const context = await viajeRepository.getMoveContext(viajeId);
      if (!context) {
        return {
          success: false,
          error: "Viaje no encontrado o no está en curso",
        };
      }

      const plan = resolveViajeMovePlan(context.fase);
      if (plan.kind === "blocked") {
        return { success: false, error: plan.reason };
      }

      const geom =
        plan.target === "origen" ? context.origen_geom : context.destino_geom;
      const position = pointFromGeom(geom);
      if (!position) {
        return {
          success: false,
          error: `No se pudo resolver la geometría del ${plan.target}`,
        };
      }

      const distanceToTargetM = distanceToGeomMeters(position, geom) ?? 0;
      if (distanceToTargetM > PROXIMITY_ARRIVAL_RADIUS_M) {
        return {
          success: false,
          error: `La posición calculada no está dentro del radio de ${PROXIMITY_ARRIVAL_RADIUS_M} m`,
        };
      }

      const faseBefore = context.fase;
      const entregaEstadoBefore = deriveEntregaEstado(
        context.fase,
        context.estado_viaje,
      );

      const locationResult =
        await transportistaLocationService.persistTransportistaLocation({
          transportistaId: context.id_transportista,
          viajeId: context.id,
          lng: position.lng,
          lat: position.lat,
          skipThrottle: true,
        });

      if (!locationResult.success) {
        return { success: false, error: locationResult.error };
      }

      const transitionResult =
        plan.transition === "confirmar_recogida"
          ? await viajeService.confirmarRecogida(
              viajeId,
              context.id_transportista,
            )
          : await negociacionViajeService.anunciarLlegada(
              viajeId,
              context.id_transportista,
            );

      if (!transitionResult.success) {
        return { success: false, error: transitionResult.error };
      }

      const faseAfter = transitionResult.data.viaje.fase;
      const refreshed = await viajeRepository.getMoveContext(viajeId);
      const estadoViaje = refreshed?.estado_viaje ?? context.estado_viaje;

      return {
        success: true,
        data: {
          viajeId,
          target: plan.target,
          position,
          distanceToTargetM: Math.round(distanceToTargetM),
          transition: plan.transition,
          faseBefore,
          faseAfter,
          entregaEstadoBefore,
          entregaEstadoAfter: deriveEntregaEstado(faseAfter, estadoViaje),
          locationUpdated: locationResult.data.updated,
        },
      };
    } catch {
      return { success: false, error: "Error al mover el transportista" };
    }
  },
};
