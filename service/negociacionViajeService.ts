import { db } from "@/db";
import { fletes, publicaciones, viajes } from "@/db/schema";
import {
  CODIGO_VERIFICACION,
  ESTADO_FLETE,
  ESTADO_PUBLICACION,
  ESTADO_VIAJE_ID,
  FASE_VIAJE,
} from "@/lib/fletes/constants";
import type { ViajeNegociacionResumenPayload } from "@/lib/events/types";
import type { InspeccionChecklistItem } from "@/lib/entregas/types";
import {
  buildDefaultChecklist,
  countCompletedChecklist,
  isChecklistComplete,
  toChecklistBroadcastPayload,
} from "@/lib/entregas/inspeccion-checklist";
import {
  mapActiveViajeRow,
  toViajeFasePayload,
  type ActiveViajeDetail,
} from "@/lib/viajes/active-viaje";
import { canTransitionFase } from "@/lib/viajes/transitions";
import {
  computeExpiry,
  generateCode,
  hashCode,
  isExpired,
  verifyCode,
} from "@/lib/viajes/verification-code";
import {
  viajeRepository,
  type ViajeNegociacionRow,
} from "@/repositories/viajeRepository";
import { transportistaHomeRepository } from "@/repositories/transportistaHomeRepository";
import { transportistaRepository } from "@/repositories/transportistaRepository";
import { escrowRepository } from "@/repositories/escrowRepository";
import { realtimeBroadcastService } from "@/service/realtimeBroadcastService";
import { escrowService } from "@/service/escrowService";
import { eq } from "drizzle-orm";
import type { PaymentEscrow } from "@/db/schema";
import { centsToDollars, getPlatformFeePercent } from "@/lib/stripe/config";
import { breakdownToDto, buildPaymentBreakdown } from "@/lib/stripe/fees";

export type NegociacionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type VerificarErrorReason =
  | "no_encontrado"
  | "estado_invalido"
  | "expirado"
  | "incorrecto"
  | "bloqueado";

export type VerificarCodigoResult =
  | { success: true; data: { resumen: ViajeNegociacionResumenPayload } }
  | { success: false; error: string; reason: VerificarErrorReason };

export type CodigoEmitido = { codigo: string; expiraEn: string };

export type InspeccionChecklistSnapshot = {
  checklist: InspeccionChecklistItem[];
  completedCount: number;
  totalCount: number;
};

function paymentFieldsFromEscrow(
  escrow: PaymentEscrow | null | undefined,
  totalPago: string,
) {
  const estimate = buildPaymentBreakdown(totalPago);
  const estimateDto = estimate ? breakdownToDto(estimate) : null;

  return {
    stripePaymentIntentId: escrow?.stripePaymentIntentId ?? null,
    stripeTransferId: escrow?.stripeTransferId ?? null,
    paymentStatus: escrow?.status ?? null,
    platformFee:
      escrow?.platformFeeCents != null
        ? centsToDollars(escrow.platformFeeCents).toFixed(2)
        : estimateDto?.platformFee ?? null,
    stripeFee:
      escrow?.stripeFeeCents != null
        ? centsToDollars(escrow.stripeFeeCents).toFixed(2)
        : estimateDto?.stripeFeeEstimate ?? null,
    transportistaPayout:
      escrow?.transportistaPayoutCents != null
        ? centsToDollars(escrow.transportistaPayoutCents).toFixed(2)
        : estimateDto?.transportistaPayoutEstimate ?? null,
    platformFeePercent:
      escrow?.platformFeeCents != null && escrow.amountCents > 0
        ? Math.round((escrow.platformFeeCents / escrow.amountCents) * 1000) /
          10
        : estimateDto?.platformFeePercent ?? getPlatformFeePercent(),
  };
}

function buildResumen(
  row: ViajeNegociacionRow,
  escrow?: PaymentEscrow | null,
): ViajeNegociacionResumenPayload {
  const payment = paymentFieldsFromEscrow(escrow, row.total_pago);

  return {
    viajeId: row.id,
    publicacionId: row.id_publicacion,
    transportistaId: row.id_transportista,
    codigo: row.codigo,
    origenNombre: row.origen_nombre,
    destinoNombre: row.destino_nombre,
    totalPago: row.total_pago,
    peso: row.peso,
    tipoCarga: row.tipo_carga,
    fechaSalida: row.fecha_salida,
    fechaEntrega: row.fecha_entrega_estimada,
    nombreEmpresa: row.nombre_empresa,
    nombreTransportista:
      `${row.nombre_transportista} ${row.apellido_transportista}`.trim(),
    completadoEn: new Date().toISOString(),
    stripePaymentIntentId: payment.stripePaymentIntentId,
    stripeTransferId: payment.stripeTransferId,
    paymentStatus: payment.paymentStatus,
    platformFee: payment.platformFee,
    stripeFee: payment.stripeFee,
    transportistaPayout: payment.transportistaPayout,
    platformFeePercent: payment.platformFeePercent,
  };
}

async function getActiveDetail(
  transportistaId: number,
): Promise<ActiveViajeDetail | null> {
  const row = await viajeRepository.getActiveForTransportista(transportistaId);
  if (!row) return null;
  return mapActiveViajeRow(row);
}

// Publica el cambio de fase a ambos canales (empresa + transportista). El
// payload de fase nunca contiene el codigo de verificacion.
async function publishFase(transportistaId: number, empresaId: number) {
  const detail = await getActiveDetail(transportistaId);
  if (!detail) return;
  await realtimeBroadcastService.publishViajeFaseUpdated(
    toViajeFasePayload(detail, transportistaId),
    transportistaId,
    empresaId,
  );
}

async function publishChecklist(
  viaje: {
    id: number;
    id_publicacion: number;
    id_transportista: number;
    id_empresa: number;
  },
  items: InspeccionChecklistItem[],
) {
  await realtimeBroadcastService.publishViajeInspeccionChecklistUpdated(
    toChecklistBroadcastPayload(
      viaje.id,
      viaje.id_publicacion,
      viaje.id_transportista,
      items,
    ),
    viaje.id_transportista,
    viaje.id_empresa,
  );
}

async function ensureInspeccionChecklist(viajeId: number) {
  const viaje = await viajeRepository.getById(viajeId);
  if (!viaje) return null;

  let items = await viajeRepository.getInspeccionChecklist(viajeId);
  const wasMissing = !items;

  if (!items) {
    items = buildDefaultChecklist();
    await viajeRepository.initInspeccionChecklist(viajeId, items);
  }

  return { viaje, items, wasMissing };
}

export const negociacionViajeService = {
  // PASO 1 (transportista). Guard de negocio: solo el transportista asignado
  // puede avisar la llegada, y solo despues de haber salido con la carga.
  async anunciarLlegada(
    viajeId: number,
    transportistaId: number,
  ): Promise<NegociacionResult<{ viaje: ActiveViajeDetail }>> {
    try {
      const viaje = await viajeRepository.getById(viajeId);
      if (!viaje || viaje.id_transportista !== transportistaId) {
        return { success: false, error: "Viaje no encontrado" };
      }

      if (viaje.fase !== FASE_VIAJE.EN_DESTINO) {
        if (viaje.fase !== FASE_VIAJE.HACIA_DESTINO) {
          return {
            success: false,
            error: "Solo puedes avisar tu llegada durante el traslado al destino",
          };
        }
        if (!canTransitionFase(viaje.fase, FASE_VIAJE.EN_DESTINO)) {
          return { success: false, error: "Transición de fase no permitida" };
        }
        await viajeRepository.updateFase(viajeId, FASE_VIAJE.EN_DESTINO);
        await publishFase(transportistaId, viaje.id_empresa);
      }

      const detail = await getActiveDetail(transportistaId);
      if (!detail) {
        return { success: false, error: "No se pudo cargar el viaje activo" };
      }
      return { success: true, data: { viaje: detail } };
    } catch {
      return { success: false, error: "Error al anunciar la llegada" };
    }
  },

  // PASO 2 (empresa). Guard de negocio: la empresa confirma la presencia fisica
  // del transportista antes de habilitar la inspeccion de carga.
  async aceptarLlegada(
    viajeId: number,
    empresaId: number,
  ): Promise<NegociacionResult<{ viajeId: number; fase: string }>> {
    try {
      const viaje = await viajeRepository.getById(viajeId);
      if (!viaje || viaje.id_empresa !== empresaId) {
        return { success: false, error: "Viaje no encontrado" };
      }

      if (viaje.fase === FASE_VIAJE.INSPECCION) {
        const ensured = await ensureInspeccionChecklist(viajeId);
        if (!ensured) {
          return { success: false, error: "Viaje no encontrado" };
        }
        if (ensured.wasMissing) {
          await publishChecklist(ensured.viaje, ensured.items);
        }
        return { success: true, data: { viajeId, fase: viaje.fase } };
      }

      if (viaje.fase !== FASE_VIAJE.EN_DESTINO) {
        return {
          success: false,
          error: "El transportista aún no ha avisado su llegada",
        };
      }

      await viajeRepository.updateFase(viajeId, FASE_VIAJE.INSPECCION);
      const checklist = buildDefaultChecklist();
      await viajeRepository.initInspeccionChecklist(viajeId, checklist);
      await publishFase(viaje.id_transportista, empresaId);
      await publishChecklist(viaje, checklist);

      return { success: true, data: { viajeId, fase: FASE_VIAJE.INSPECCION } };
    } catch {
      return { success: false, error: "Error al aceptar la llegada" };
    }
  },

  // PASO 3a (empresa). Cada toggle del checklist persiste en BD y se emite en
  // tiempo real al transportista.
  async actualizarItemInspeccion(
    viajeId: number,
    empresaId: number,
    itemId: string,
    completed: boolean,
  ): Promise<NegociacionResult<InspeccionChecklistSnapshot>> {
    try {
      const viaje = await viajeRepository.getById(viajeId);
      if (!viaje || viaje.id_empresa !== empresaId) {
        return { success: false, error: "Viaje no encontrado" };
      }

      if (viaje.fase !== FASE_VIAJE.INSPECCION) {
        return {
          success: false,
          error: "La inspección no está activa",
        };
      }

      const ensured = await ensureInspeccionChecklist(viajeId);
      if (!ensured) {
        return { success: false, error: "Viaje no encontrado" };
      }

      const items = await viajeRepository.updateInspeccionChecklistItem(
        viajeId,
        itemId,
        completed,
      );
      if (!items) {
        return { success: false, error: "Ítem de inspección no válido" };
      }

      await publishChecklist(viaje, items);

      return {
        success: true,
        data: {
          checklist: items,
          completedCount: countCompletedChecklist(items),
          totalCount: items.length,
        },
      };
    } catch {
      return { success: false, error: "Error al actualizar la inspección" };
    }
  },

  // PASO 3 (empresa). Guard de negocio: el codigo solo se emite despues de que
  // la empresa revisa la carga. El codigo viaja solo en esta respuesta HTTP.
  async completarInspeccion(
    viajeId: number,
    empresaId: number,
  ): Promise<NegociacionResult<CodigoEmitido>> {
    try {
      const viaje = await viajeRepository.getById(viajeId);
      if (!viaje || viaje.id_empresa !== empresaId) {
        return { success: false, error: "Viaje no encontrado" };
      }

      if (viaje.fase === FASE_VIAJE.CODIGO_PENDIENTE) {
        return {
          success: false,
          error:
            "La inspección ya fue completada. Usa Regenerar para emitir un nuevo código.",
        };
      }

      if (viaje.fase !== FASE_VIAJE.INSPECCION) {
        return {
          success: false,
          error: "Debes aceptar la llegada e iniciar la inspección primero",
        };
      }

      const checklist = await viajeRepository.getInspeccionChecklist(viajeId);
      if (!checklist || !isChecklistComplete(checklist)) {
        return {
          success: false,
          error: "Debes completar todos los puntos de la inspección",
        };
      }

      const codigo = generateCode();
      const expira = computeExpiry();
      await viajeRepository.setCodigoVerificacion(
        viajeId,
        hashCode(viajeId, codigo),
        expira,
      );
      await viajeRepository.updateFase(viajeId, FASE_VIAJE.CODIGO_PENDIENTE);
      // El transportista pasa a "ingresar codigo" (sin recibir el codigo).
      await publishFase(viaje.id_transportista, empresaId);

      return { success: true, data: { codigo, expiraEn: expira.toISOString() } };
    } catch {
      return { success: false, error: "Error al completar la inspección" };
    }
  },

  // PASO 3b (empresa). Regenera el codigo si expiro, sin retroceder de etapa.
  async regenerarCodigo(
    viajeId: number,
    empresaId: number,
  ): Promise<NegociacionResult<CodigoEmitido>> {
    try {
      const viaje = await viajeRepository.getById(viajeId);
      if (!viaje || viaje.id_empresa !== empresaId) {
        return { success: false, error: "Viaje no encontrado" };
      }

      if (viaje.fase !== FASE_VIAJE.CODIGO_PENDIENTE) {
        return {
          success: false,
          error: "No hay un código activo para regenerar",
        };
      }

      const codigo = generateCode();
      const expira = computeExpiry();
      // setCodigoVerificacion reinicia el contador de intentos.
      await viajeRepository.setCodigoVerificacion(
        viajeId,
        hashCode(viajeId, codigo),
        expira,
      );

      return { success: true, data: { codigo, expiraEn: expira.toISOString() } };
    } catch {
      return { success: false, error: "Error al regenerar el código" };
    }
  },

  // PASO 4 (transportista). Valida el codigo contra el hash almacenado. Si es
  // correcto, cierra el viaje de forma atomica y entrega el resumen.
  async verificarCodigo(
    viajeId: number,
    transportistaId: number,
    codigo: string,
  ): Promise<VerificarCodigoResult> {
    try {
      const row = await viajeRepository.getNegociacionContext(viajeId);
      if (!row || row.id_transportista !== transportistaId) {
        return {
          success: false,
          error: "Viaje no encontrado",
          reason: "no_encontrado",
        };
      }

      // Idempotencia: si ya se verifico (viaje cerrado), devolver el resumen.
      if (
        row.fase === FASE_VIAJE.RESUMEN ||
        row.id_estado === ESTADO_VIAJE_ID.COMPLETADO
      ) {
        const escrow = await escrowRepository.getByPublicacionId(
          row.id_publicacion,
        );
        return {
          success: true,
          data: {
            resumen: buildResumen(row, escrow),
          },
        };
      }

      if (row.fase !== FASE_VIAJE.CODIGO_PENDIENTE) {
        return {
          success: false,
          error: "El viaje no está en fase de verificación",
          reason: "estado_invalido",
        };
      }

      if (row.codigo_verificacion_intentos >= CODIGO_VERIFICACION.MAX_INTENTOS) {
        return {
          success: false,
          error: "Demasiados intentos. Pide a la empresa regenerar el código.",
          reason: "bloqueado",
        };
      }

      const expira = row.codigo_verificacion_expira
        ? new Date(row.codigo_verificacion_expira)
        : null;
      if (isExpired(expira)) {
        return {
          success: false,
          error: "El código expiró. Pide a la empresa regenerarlo.",
          reason: "expirado",
        };
      }

      if (!verifyCode(viajeId, codigo, row.codigo_verificacion_hash)) {
        const updated = await viajeRepository.incrementCodigoIntento(viajeId);
        const intentos =
          updated?.codigo_verificacion_intentos ??
          row.codigo_verificacion_intentos + 1;
        if (intentos >= CODIGO_VERIFICACION.MAX_INTENTOS) {
          return {
            success: false,
            error: "Código incorrecto. Alcanzaste el máximo de intentos.",
            reason: "bloqueado",
          };
        }
        return { success: false, error: "Código incorrecto", reason: "incorrecto" };
      }

      const transportista = await transportistaRepository.getById(transportistaId);
      if (!transportista?.stripeConnectAccountId) {
        return {
          success: false,
          error: "El transportista no tiene cobros configurados",
          reason: "estado_invalido",
        };
      }

      const release = await escrowService.releaseFundsForViaje(
        viajeId,
        row.id_publicacion,
        transportista.stripeConnectAccountId,
      );

      if (!release.success) {
        return {
          success: false,
          error: release.error,
          reason: "estado_invalido",
        };
      }

      // Codigo correcto: cierre atomico del viaje.
      await db.transaction(async (tx) => {
        await tx
          .update(viajes)
          .set({
            fase: FASE_VIAJE.RESUMEN,
            id_estado: ESTADO_VIAJE_ID.COMPLETADO,
            codigo_verificacion_hash: null,
            codigo_verificacion_expira: null,
            codigo_verificacion_intentos: 0,
            updatedAt: new Date(),
          })
          .where(eq(viajes.id, viajeId));

        await tx
          .update(publicaciones)
          .set({ estado: ESTADO_PUBLICACION.ARCHIVADO, updatedAt: new Date() })
          .where(eq(publicaciones.id, row.id_publicacion));

        await tx
          .update(fletes)
          .set({ estado: ESTADO_FLETE.ENTREGADO, updatedAt: new Date() })
          .where(eq(fletes.id, row.id_flete));
      });

      await transportistaHomeRepository.updateDisponibleByTransportistaId(
        transportistaId,
        true,
      );

      const escrow = await escrowRepository.getByPublicacionId(row.id_publicacion);
      const resumen = buildResumen(row, escrow);

      // Limpieza de dashboards en tiempo real + entrega del resumen compartido.
      await realtimeBroadcastService.publishViajeCompleted(
        {
          viajeId: row.id,
          publicacionId: row.id_publicacion,
          transportistaId,
          fleteId: row.id_flete,
          codigo: row.codigo,
          origenNombre: row.origen_nombre,
          destinoNombre: row.destino_nombre,
          totalPago: row.total_pago,
        },
        transportistaId,
        row.id_empresa,
      );

      await realtimeBroadcastService.publishPublicacionArchived(
        {
          publicacionId: row.id_publicacion,
          viajeId: row.id,
          codigo: row.codigo,
          origenNombre: row.origen_nombre,
          destinoNombre: row.destino_nombre,
        },
        row.id_empresa,
      );

      await realtimeBroadcastService.publishViajeNegociacionResumen(
        resumen,
        transportistaId,
        row.id_empresa,
      );

      return { success: true, data: { resumen } };
    } catch {
      return {
        success: false,
        error: "Error al verificar el código",
        reason: "estado_invalido",
      };
    }
  },

  // PASO 5 (empresa). Snapshot del resumen para recarga / late-join. No modifica
  // estado (el boton "Finalizar" del cliente no dispara backend).
  async getResumenNegociacion(
    viajeId: number,
    empresaId: number,
  ): Promise<NegociacionResult<{ resumen: ViajeNegociacionResumenPayload }>> {
    try {
      const row = await viajeRepository.getNegociacionContext(viajeId);
      if (!row || row.id_empresa !== empresaId) {
        return { success: false, error: "Viaje no encontrado" };
      }
      const escrow = await escrowRepository.getByPublicacionId(row.id_publicacion);
      return {
        success: true,
        data: {
          resumen: buildResumen(row, escrow),
        },
      };
    } catch {
      return { success: false, error: "Error al obtener el resumen" };
    }
  },
};
