import type { Empresa } from "@/db/schema";
import type { BillingServiceResult } from "@/lib/billing/types";
import {
  BILLING_ERROR_CODE,
  ESCROW_HOLD_DAYS,
  PAYMENT_ESCROW_STATUS,
  dollarsToCents,
  getStripeCurrency,
  isStripeConfigured,
} from "@/lib/stripe/config";
import {
  calculatePlatformFeeCents,
  resolveTransferAmountCents,
} from "@/lib/stripe/fees";
import { getStripeClient } from "@/lib/stripe/client";
import { billingService } from "@/service/billingService";
import { escrowRepository } from "@/repositories/escrowRepository";
import { fleteRepository } from "@/repositories/fleteRepository";
import { publicacionRepository } from "@/repositories/publicacionRepository";
import { ESTADO_PUBLICACION } from "@/lib/fletes/constants";

/** Versión de la clave Stripe al liberar (cambiar si cambia la lógica del transfer). */
const RELEASE_IDEMPOTENCY_KEY_VERSION = "net-v1";

function releaseIdempotencyKey(viajeId: number) {
  return `release-${viajeId}-${RELEASE_IDEMPOTENCY_KEY_VERSION}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export const escrowService = {
  async holdFundsForPublication(
    empresa: Empresa,
    publicacionId: number,
    fleteId: number,
    totalPago: number | string,
  ): Promise<
    BillingServiceResult<{
      escrowId: number;
      paymentIntentId: string;
    }>
  > {
    const billingCheck = billingService.assertEmpresaCanPublish(empresa);
    if (!billingCheck.success) {
      return billingCheck;
    }

    if (!isStripeConfigured()) {
      return {
        success: false,
        error: "Stripe no está configurado en el servidor",
        code: BILLING_ERROR_CODE.STRIPE_NOT_CONFIGURED,
      };
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return {
        success: false,
        error: "Stripe no está configurado en el servidor",
        code: BILLING_ERROR_CODE.STRIPE_NOT_CONFIGURED,
      };
    }

    const existing = await escrowRepository.getByPublicacionId(publicacionId);
    if (existing?.status === PAYMENT_ESCROW_STATUS.HELD) {
      return {
        success: true,
        data: {
          escrowId: existing.id,
          paymentIntentId: existing.stripePaymentIntentId,
        },
      };
    }

    const amountCents = dollarsToCents(totalPago);
    const platformFeeCents = calculatePlatformFeeCents(amountCents);
    const currency = getStripeCurrency();

    try {
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: amountCents,
          currency,
          customer: empresa.stripeCustomerId!,
          payment_method: empresa.stripeDefaultPaymentMethodId!,
          off_session: true,
          confirm: true,
          metadata: {
            publicacionId: String(publicacionId),
            fleteId: String(fleteId),
            empresaId: String(empresa.id),
          },
        },
        { idempotencyKey: `publish-${publicacionId}` },
      );

      if (paymentIntent.status !== "succeeded") {
        return {
          success: false,
          error: "No se pudo reservar el pago del flete",
          code: BILLING_ERROR_CODE.PAYMENT_FAILED,
        };
      }

      const chargeId =
        typeof paymentIntent.latest_charge === "string"
          ? paymentIntent.latest_charge
          : paymentIntent.latest_charge?.id ?? null;

      const heldAt = new Date();
      const expiresAt = addDays(heldAt, ESCROW_HOLD_DAYS);

      const escrow = await escrowRepository.create({
        id_publicacion: publicacionId,
        id_flete: fleteId,
        id_empresa: empresa.id,
        amountCents,
        platformFeeCents,
        currency,
        stripePaymentIntentId: paymentIntent.id,
        stripeChargeId: chargeId,
        status: PAYMENT_ESCROW_STATUS.HELD,
        heldAt,
        expiresAt,
      });

      return {
        success: true,
        data: {
          escrowId: escrow.id,
          paymentIntentId: paymentIntent.id,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error al procesar el pago del flete";
      return {
        success: false,
        error: message,
        code: BILLING_ERROR_CODE.PAYMENT_FAILED,
      };
    }
  },

  async releaseFundsForViaje(
    viajeId: number,
    publicacionId: number,
    transportistaConnectAccountId: string,
  ): Promise<
    BillingServiceResult<{
      transferId: string;
      amountCents: number;
    }>
  > {
    const escrow = await escrowRepository.getByPublicacionId(publicacionId);
    if (!escrow) {
      return { success: false, error: "No hay fondos reservados para este flete" };
    }

    if (escrow.status === PAYMENT_ESCROW_STATUS.RELEASED && escrow.stripeTransferId) {
      return {
        success: true,
        data: {
          transferId: escrow.stripeTransferId,
          amountCents:
            escrow.transportistaPayoutCents ?? escrow.amountCents,
        },
      };
    }

    if (escrow.status !== PAYMENT_ESCROW_STATUS.HELD) {
      return {
        success: false,
        error: "Los fondos no están disponibles para liberar",
      };
    }

    if (!isStripeConfigured()) {
      return {
        success: false,
        error: "Stripe no está configurado en el servidor",
        code: BILLING_ERROR_CODE.STRIPE_NOT_CONFIGURED,
      };
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return {
        success: false,
        error: "Stripe no está configurado en el servidor",
        code: BILLING_ERROR_CODE.STRIPE_NOT_CONFIGURED,
      };
    }

    try {
      const platformFeeCents =
        escrow.platformFeeCents ?? calculatePlatformFeeCents(escrow.amountCents);

      if (!escrow.stripeChargeId) {
        return {
          success: false,
          error: "No se encontró el cargo asociado al escrow",
        };
      }

      const charge = await stripe.charges.retrieve(escrow.stripeChargeId, {
        expand: ["balance_transaction"],
      });

      const balanceTransaction = charge.balance_transaction;
      if (!balanceTransaction || typeof balanceTransaction === "string") {
        return {
          success: false,
          error: "No se pudo obtener el balance de la transacción",
        };
      }

      const netCents = balanceTransaction.net;
      const stripeFeeCents = balanceTransaction.fee;
      const resolved = resolveTransferAmountCents(netCents, platformFeeCents);

      if (resolved.error) {
        return { success: false, error: resolved.error };
      }

      const transfer = await stripe.transfers.create(
        {
          amount: resolved.transferCents,
          currency: escrow.currency,
          destination: transportistaConnectAccountId,
          metadata: {
            viajeId: String(viajeId),
            publicacionId: String(publicacionId),
            paymentIntentId: escrow.stripePaymentIntentId,
            platformFeeCents: String(platformFeeCents),
            stripeFeeCents: String(stripeFeeCents),
          },
        },
        { idempotencyKey: releaseIdempotencyKey(viajeId) },
      );

      await escrowRepository.markReleased(
        escrow.id,
        transfer.id,
        new Date(),
        {
          stripeFeeCents,
          transportistaPayoutCents: resolved.transferCents,
        },
      );

      return {
        success: true,
        data: {
          transferId: transfer.id,
          amountCents: resolved.transferCents,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error al transferir el pago al transportista";
      return { success: false, error: message };
    }
  },

  async refundHeldFunds(
    publicacionId: number,
    reason?: string,
  ): Promise<BillingServiceResult<{ refundId: string }>> {
    const escrow = await escrowRepository.getByPublicacionId(publicacionId);
    if (!escrow) {
      return { success: true, data: { refundId: "" } };
    }

    if (escrow.status === PAYMENT_ESCROW_STATUS.REFUNDED && escrow.stripeRefundId) {
      return { success: true, data: { refundId: escrow.stripeRefundId } };
    }

    if (escrow.status !== PAYMENT_ESCROW_STATUS.HELD) {
      return { success: true, data: { refundId: "" } };
    }

    if (!isStripeConfigured()) {
      return {
        success: false,
        error: "Stripe no está configurado en el servidor",
        code: BILLING_ERROR_CODE.STRIPE_NOT_CONFIGURED,
      };
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return {
        success: false,
        error: "Stripe no está configurado en el servidor",
        code: BILLING_ERROR_CODE.STRIPE_NOT_CONFIGURED,
      };
    }

    try {
      const refund = await stripe.refunds.create(
        {
          payment_intent: escrow.stripePaymentIntentId,
          metadata: {
            publicacionId: String(publicacionId),
            reason: reason ?? "trip_cancelled",
          },
        },
        { idempotencyKey: `refund-${publicacionId}` },
      );

      await escrowRepository.markRefunded(escrow.id, refund.id, new Date());

      return { success: true, data: { refundId: refund.id } };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al reembolsar el pago";
      return { success: false, error: message };
    }
  },

  async revertPublicationAfterFailedPayment(publicacionId: number, fleteId: number) {
    await publicacionRepository.updateEstado(
      publicacionId,
      ESTADO_PUBLICACION.BORRADOR,
    );
    await fleteRepository.updateEstado(fleteId, "activo");
  },
};
