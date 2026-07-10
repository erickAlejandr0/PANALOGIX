import { db } from "@/db";
import { fletes, postulaciones, publicaciones, viajes } from "@/db/schema";
import {
  ESTADO_FLETE,
  ESTADO_POSTULACION_ID,
  ESTADO_PUBLICACION,
  ESTADO_VIAJE_ID,
  FASE_VIAJE,
  FASES_VIAJE_ACTIVAS,
  type FaseViaje,
} from "@/lib/fletes/constants";
import {
  mapActiveViajeRow,
  toViajeFasePayload,
  type ActiveViajeDetail,
} from "@/lib/viajes/active-viaje";
import { canTransitionFase } from "@/lib/viajes/transitions";
import { publicacionRepository } from "@/repositories/publicacionRepository";
import { transportistaHomeRepository } from "@/repositories/transportistaHomeRepository";
import { viajeRepository } from "@/repositories/viajeRepository";
import { realtimeBroadcastService } from "@/service/realtimeBroadcastService";
import { escrowService } from "@/service/escrowService";
import { eq } from "drizzle-orm";

export type ViajeServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Fases posteriores a la recogida: usadas para idempotencia de confirmarRecogida.
const FASES_POST_RECOGIDA: readonly FaseViaje[] = [
  FASE_VIAJE.HACIA_DESTINO,
  FASE_VIAJE.EN_DESTINO,
  FASE_VIAJE.INSPECCION,
  FASE_VIAJE.CODIGO_PENDIENTE,
  FASE_VIAJE.RESUMEN,
];

async function getActiveDetailForTransportista(transportistaId: number) {
  const row = await viajeRepository.getActiveForTransportista(transportistaId);
  if (!row) return null;
  return mapActiveViajeRow(row);
}

async function publishFaseUpdate(
  detail: ActiveViajeDetail,
  transportistaId: number,
  empresaId: number,
) {
  await realtimeBroadcastService.publishViajeFaseUpdated(
    toViajeFasePayload(detail, transportistaId),
    transportistaId,
    empresaId,
  );
}

function isActiveFase(fase: string) {
  return (FASES_VIAJE_ACTIVAS as readonly string[]).includes(fase);
}

async function transitionFase(
  viajeId: number,
  transportistaId: number,
  nextFase: (typeof FASE_VIAJE)[keyof typeof FASE_VIAJE],
) {
  const viaje = await viajeRepository.getById(viajeId);
  if (!viaje || viaje.id_transportista !== transportistaId) {
    return { success: false as const, error: "Viaje no encontrado" };
  }

  if (!isActiveFase(viaje.fase) && viaje.fase !== FASE_VIAJE.ASIGNADO) {
    return {
      success: false as const,
      error: "Este viaje ya no está activo",
    };
  }

  if (viaje.fase === nextFase) {
    const detail = await getActiveDetailForTransportista(transportistaId);
    if (!detail) {
      return { success: false as const, error: "No se pudo cargar el viaje activo" };
    }
    return { success: true as const, data: { viaje: detail } };
  }

  if (!canTransitionFase(viaje.fase, nextFase)) {
    return {
      success: false as const,
      error: `No puedes pasar de ${viaje.fase} a ${nextFase}`,
    };
  }

  await viajeRepository.updateFase(viajeId, nextFase);

  const detail = await getActiveDetailForTransportista(transportistaId);
  if (!detail) {
    return { success: false as const, error: "No se pudo cargar el viaje activo" };
  }

  await publishFaseUpdate(detail, transportistaId, viaje.id_empresa);

  if (nextFase === FASE_VIAJE.HACIA_DESTINO) {
    await realtimeBroadcastService.publishViajeProximityAlert(
      {
        viajeId: detail.viajeId,
        publicacionId: detail.publicacionId,
        transportistaId,
        type: "cargo_picked_up",
        message: "El transportista recogió el flete",
        codigo: detail.codigo,
        destinoNombre: detail.destinoNombre,
        distanceMeters: null,
      },
      viaje.id_empresa,
    );
  }

  return { success: true as const, data: { viaje: detail } };
}

export const viajeService = {
  async getActiveForTransportista(
    transportistaId: number,
  ): Promise<ViajeServiceResult<{ viaje: ActiveViajeDetail | null }>> {
    try {
      const viaje = await getActiveDetailForTransportista(transportistaId);
      return { success: true, data: { viaje } };
    } catch {
      return { success: false, error: "Error al consultar el viaje activo" };
    }
  },

  async iniciar(
    viajeId: number,
    transportistaId: number,
  ): Promise<ViajeServiceResult<{ viaje: ActiveViajeDetail }>> {
    try {
      const result = await transitionFase(
        viajeId,
        transportistaId,
        FASE_VIAJE.HACIA_ORIGEN,
      );
      if (!result.success) return result;

      await transportistaHomeRepository.updateDisponibleByTransportistaId(
        transportistaId,
        false,
      );

      const viaje = await viajeRepository.getById(viajeId);
      if (viaje) {
        await realtimeBroadcastService.publishViajeStarted(
          {
            viajeId: result.data.viaje.viajeId,
            transportistaId,
            fleteId: viaje.id_flete,
            codigo: result.data.viaje.codigo,
          },
          transportistaId,
        );
      }

      return result;
    } catch {
      return { success: false, error: "Error al iniciar el viaje" };
    }
  },

  async confirmarRecogida(
    viajeId: number,
    transportistaId: number,
  ): Promise<ViajeServiceResult<{ viaje: ActiveViajeDetail }>> {
    try {
      const viaje = await viajeRepository.getById(viajeId);
      if (!viaje || viaje.id_transportista !== transportistaId) {
        return { success: false, error: "Viaje no encontrado" };
      }

      if (FASES_POST_RECOGIDA.includes(viaje.fase as FaseViaje)) {
        const detail = await getActiveDetailForTransportista(transportistaId);
        if (!detail) {
          return { success: false, error: "No se pudo cargar el viaje activo" };
        }
        return { success: true, data: { viaje: detail } };
      }

      return await transitionFase(
        viajeId,
        transportistaId,
        FASE_VIAJE.HACIA_DESTINO,
      );
    } catch {
      return { success: false, error: "Error al confirmar la recogida" };
    }
  },

  async cancelarAsignacion(
    viajeId: number,
    transportistaId: number,
  ): Promise<ViajeServiceResult<{ viajeId: number }>> {
    return viajeService.abortar(viajeId, transportistaId);
  },

  async abortar(
    viajeId: number,
    transportistaId: number,
  ): Promise<ViajeServiceResult<{ viajeId: number }>> {
    try {
      const viaje = await viajeRepository.getById(viajeId);
      if (!viaje || viaje.id_transportista !== transportistaId) {
        return { success: false, error: "Viaje no encontrado" };
      }

      if (!isActiveFase(viaje.fase) && viaje.fase !== FASE_VIAJE.ASIGNADO) {
        return {
          success: false,
          error: "Este viaje ya no se puede abortar",
        };
      }

      await db.transaction(async (tx) => {
        await tx
          .update(viajes)
          .set({
            id_estado: ESTADO_VIAJE_ID.CANCELADO,
            fase: FASE_VIAJE.ASIGNADO,
            updatedAt: new Date(),
          })
          .where(eq(viajes.id, viajeId));

        await tx
          .update(postulaciones)
          .set({
            id_estado: ESTADO_POSTULACION_ID.CANCELADA,
            updatedAt: new Date(),
          })
          .where(eq(postulaciones.id, viaje.id_postulacion));

        await tx
          .update(publicaciones)
          .set({
            estado: ESTADO_PUBLICACION.PUBLICADO,
            updatedAt: new Date(),
          })
          .where(eq(publicaciones.id, viaje.id_publicacion));

        await tx
          .update(fletes)
          .set({
            estado: ESTADO_FLETE.ACTIVO,
            updatedAt: new Date(),
          })
          .where(eq(fletes.id, viaje.id_flete));
      });

      await escrowService.refundHeldFunds(
        viaje.id_publicacion,
        "viaje_abortado",
      );

      await transportistaHomeRepository.updateDisponibleByTransportistaId(
        transportistaId,
        true,
      );

      return { success: true, data: { viajeId } };
    } catch {
      return { success: false, error: "Error al abortar el viaje" };
    }
  },

  async listByTransportista(transportistaId: number) {
    try {
      const rows = await viajeRepository.getByTransportista(transportistaId);
      return { success: true as const, data: rows };
    } catch {
      return { success: false as const, error: "Error al listar viajes" };
    }
  },

  async listByEmpresa(empresaId: number) {
    try {
      const rows = await viajeRepository.getByEmpresa(empresaId);
      return { success: true as const, data: rows };
    } catch {
      return { success: false as const, error: "Error al listar viajes" };
    }
  },

  async reassign(
    viajeId: number,
    empresaId: number,
    nuevoTransportistaId: number,
    nuevaFlotaId: number,
  ) {
    const { flotaRepository } = await import("@/repositories/flotaRepository");
    const { db: database } = await import("@/db");
    const { viajes: viajesTable, viajes_reasignaciones } = await import(
      "@/db/schema"
    );

    try {
      const viaje = await viajeRepository.getById(viajeId);
      if (!viaje || viaje.id_empresa !== empresaId) {
        return { success: false as const, error: "Viaje no encontrado" };
      }

      if (viaje.id_estado === ESTADO_VIAJE_ID.COMPLETADO) {
        return {
          success: false as const,
          error: "No se puede reasignar un viaje completado",
        };
      }

      const vehiculo = await flotaRepository.getByIdAndTransportista(
        nuevaFlotaId,
        nuevoTransportistaId,
      );
      if (!vehiculo) {
        return {
          success: false as const,
          error: "El vehículo no pertenece al transportista indicado",
        };
      }

      await database.transaction(async (tx) => {
        await tx.insert(viajes_reasignaciones).values({
          id_viaje: viajeId,
          id_transportista_anterior: viaje.id_transportista,
          id_transportista_nuevo: nuevoTransportistaId,
        });

        await tx
          .update(viajesTable)
          .set({
            id_transportista: nuevoTransportistaId,
            id_flota: nuevaFlotaId,
            id_estado: ESTADO_VIAJE_ID.REASIGNADO,
            updatedAt: new Date(),
          })
          .where(eq(viajesTable.id, viajeId));
      });

      return { success: true as const, data: { viajeId } };
    } catch {
      return { success: false as const, error: "Error al reasignar el viaje" };
    }
  },
};
