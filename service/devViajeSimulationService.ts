import { db } from "@/db";
import { fletes, publicaciones, viajes } from "@/db/schema";
import {
  ESTADO_FLETE,
  ESTADO_PUBLICACION,
  ESTADO_VIAJE_ID,
  FASE_VIAJE,
  type FaseViaje,
} from "@/lib/fletes/constants";
import { negociacionViajeService } from "@/service/negociacionViajeService";
import { viajeService } from "@/service/viajeService";
import { transportistaHomeRepository } from "@/repositories/transportistaHomeRepository";
import { viajeRepository } from "@/repositories/viajeRepository";
import { eq } from "drizzle-orm";

const PHASE_ORDER: readonly FaseViaje[] = [
  FASE_VIAJE.ASIGNADO,
  FASE_VIAJE.HACIA_ORIGEN,
  FASE_VIAJE.HACIA_DESTINO,
  FASE_VIAJE.EN_DESTINO,
  FASE_VIAJE.INSPECCION,
  FASE_VIAJE.CODIGO_PENDIENTE,
  FASE_VIAJE.RESUMEN,
];

export type DevAdvanceStep = {
  from: string;
  to: string;
  codigo?: string;
  done?: boolean;
};

export type DevAdvanceResult =
  | { success: true; data: DevAdvanceStep & { steps?: DevAdvanceStep[] } }
  | { success: false; error: string };

function phaseIndex(fase: string): number {
  return PHASE_ORDER.indexOf(fase as FaseViaje);
}

function isTerminalFase(fase: string): boolean {
  return fase === FASE_VIAJE.RESUMEN || fase === FASE_VIAJE.COMPLETADO;
}

async function advanceOneStep(viajeId: number): Promise<DevAdvanceResult> {
  const viaje = await viajeRepository.getById(viajeId);
  if (!viaje) {
    return { success: false, error: "Viaje no encontrado" };
  }

  const from = viaje.fase;

  if (isTerminalFase(from)) {
    return {
      success: true,
      data: { from, to: from, done: true },
    };
  }

  switch (viaje.fase) {
    case FASE_VIAJE.ASIGNADO: {
      const result = await viajeService.iniciar(viajeId, viaje.id_transportista);
      if (!result.success) return { success: false, error: result.error };
      return {
        success: true,
        data: { from, to: result.data.viaje.fase },
      };
    }

    case FASE_VIAJE.HACIA_ORIGEN: {
      const result = await viajeService.confirmarRecogida(
        viajeId,
        viaje.id_transportista,
      );
      if (!result.success) return { success: false, error: result.error };
      return {
        success: true,
        data: { from, to: result.data.viaje.fase },
      };
    }

    case FASE_VIAJE.HACIA_DESTINO: {
      const result = await negociacionViajeService.anunciarLlegada(
        viajeId,
        viaje.id_transportista,
      );
      if (!result.success) return { success: false, error: result.error };
      return {
        success: true,
        data: { from, to: result.data.viaje.fase },
      };
    }

    case FASE_VIAJE.EN_DESTINO: {
      const result = await negociacionViajeService.aceptarLlegada(
        viajeId,
        viaje.id_empresa,
      );
      if (!result.success) return { success: false, error: result.error };
      return {
        success: true,
        data: { from, to: result.data.fase },
      };
    }

    case FASE_VIAJE.INSPECCION: {
      await viajeRepository.completeAllInspeccionItems(viajeId);
      const result = await negociacionViajeService.completarInspeccion(
        viajeId,
        viaje.id_empresa,
      );
      if (!result.success) return { success: false, error: result.error };
      return {
        success: true,
        data: {
          from,
          to: FASE_VIAJE.CODIGO_PENDIENTE,
          codigo: result.data.codigo,
        },
      };
    }

    case FASE_VIAJE.CODIGO_PENDIENTE: {
      // Opción A: regenerar + verificar para ejercitar la lógica real de cierre.
      const emitido = await negociacionViajeService.regenerarCodigo(
        viajeId,
        viaje.id_empresa,
      );
      if (!emitido.success) {
        return { success: false, error: emitido.error };
      }

      const verificado = await negociacionViajeService.verificarCodigo(
        viajeId,
        viaje.id_transportista,
        emitido.data.codigo,
      );
      if (!verificado.success) {
        return { success: false, error: verificado.error };
      }

      return {
        success: true,
        data: {
          from,
          to: FASE_VIAJE.RESUMEN,
          codigo: emitido.data.codigo,
        },
      };
    }

    default:
      return {
        success: false,
        error: `Fase no avanzable desde el simulador: ${viaje.fase}`,
      };
  }
}

export const devViajeSimulationService = {
  /**
   * Avanza el viaje una fase usando los mismos servicios de producción.
   * Si se indica `targetFase`, repite el avance hasta alcanzarla (máx. 8 pasos).
   */
  async advance(
    viajeId: number,
    targetFase?: FaseViaje,
  ): Promise<DevAdvanceResult> {
    try {
      const viaje = await viajeRepository.getById(viajeId);
      if (!viaje) {
        return { success: false, error: "Viaje no encontrado" };
      }

      if (!targetFase) {
        return advanceOneStep(viajeId);
      }

      const targetIndex = phaseIndex(targetFase);
      if (targetIndex === -1) {
        return { success: false, error: `Fase destino inválida: ${targetFase}` };
      }

      const currentIndex = phaseIndex(viaje.fase);
      if (currentIndex === -1 && !isTerminalFase(viaje.fase)) {
        return {
          success: false,
          error: `Fase actual no soportada: ${viaje.fase}`,
        };
      }

      if (currentIndex >= targetIndex || isTerminalFase(viaje.fase)) {
        return {
          success: true,
          data: {
            from: viaje.fase,
            to: viaje.fase,
            done: isTerminalFase(viaje.fase),
          },
        };
      }

      const steps: DevAdvanceStep[] = [];
      const maxIterations = PHASE_ORDER.length;

      for (let i = 0; i < maxIterations; i += 1) {
        const current = await viajeRepository.getById(viajeId);
        if (!current) {
          return { success: false, error: "Viaje no encontrado" };
        }

        if (phaseIndex(current.fase) >= targetIndex || isTerminalFase(current.fase)) {
          break;
        }

        const step = await advanceOneStep(viajeId);
        if (!step.success) return step;
        steps.push(step.data);

        if (step.data.done) break;
      }

      const final = await viajeRepository.getById(viajeId);
      if (!final) {
        return { success: false, error: "Viaje no encontrado" };
      }

      const lastStep = steps.at(-1);

      return {
        success: true,
        data: {
          from: steps[0]?.from ?? final.fase,
          to: final.fase,
          codigo: lastStep?.codigo,
          done: isTerminalFase(final.fase),
          steps,
        },
      };
    } catch {
      return { success: false, error: "Error al avanzar el viaje" };
    }
  },

  /**
   * Restaura un viaje terminado (o en cualquier fase) a `asignado` para repetir
   * pruebas E2E con la misma publicación.
   */
  async reset(viajeId: number): Promise<DevAdvanceResult> {
    try {
      const viaje = await viajeRepository.getById(viajeId);
      if (!viaje) {
        return { success: false, error: "Viaje no encontrado" };
      }

      const previousFase = viaje.fase;

      await db.transaction(async (tx) => {
        await tx
          .update(viajes)
          .set({
            fase: FASE_VIAJE.ASIGNADO,
            id_estado: ESTADO_VIAJE_ID.EN_CURSO,
            alerta_destino_enviada: false,
            alerta_llegada_enviada: false,
            codigo_verificacion_hash: null,
            codigo_verificacion_expira: null,
            codigo_verificacion_intentos: 0,
            inspeccion_checklist: null,
            inspeccion_iniciada_at: null,
            updatedAt: new Date(),
          })
          .where(eq(viajes.id, viajeId));

        await tx
          .update(publicaciones)
          .set({ estado: ESTADO_PUBLICACION.PUBLICADO, updatedAt: new Date() })
          .where(eq(publicaciones.id, viaje.id_publicacion));

        await tx
          .update(fletes)
          .set({ estado: ESTADO_FLETE.ACTIVO, updatedAt: new Date() })
          .where(eq(fletes.id, viaje.id_flete));
      });

      await transportistaHomeRepository.updateDisponibleByTransportistaId(
        viaje.id_transportista,
        true,
      );

      return {
        success: true,
        data: {
          from: previousFase,
          to: FASE_VIAJE.ASIGNADO,
        },
      };
    } catch {
      return { success: false, error: "Error al reiniciar el viaje" };
    }
  },
};
