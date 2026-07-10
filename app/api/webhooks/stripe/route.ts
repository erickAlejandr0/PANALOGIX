import type Stripe from "stripe";

import { getStripeWebhookSecret } from "@/lib/stripe/config";
import { getStripeClient } from "@/lib/stripe/client";
import { billingService } from "@/service/billingService";
import { escrowRepository } from "@/repositories/escrowRepository";
import { PAYMENT_ESCROW_STATUS } from "@/lib/stripe/config";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = getStripeWebhookSecret();

  if (!stripe || !webhookSecret) {
    return Response.json(
      { error: "Stripe webhook no configurado" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Firma ausente" }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return Response.json({ error: "Firma inválida" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "setup_intent.succeeded": {
        const setupIntent = event.data.object as Stripe.SetupIntent;
        if (setupIntent.id) {
          await billingService.handleSetupIntentSucceeded(setupIntent.id);
        }
        break;
      }
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        if (account.id) {
          await billingService.syncConnectAccount(account.id);
        }
        break;
      }
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const escrow = await escrowRepository.getByPaymentIntentId(
          paymentIntent.id,
        );
        if (escrow && escrow.status === PAYMENT_ESCROW_STATUS.PENDING) {
          const chargeId =
            typeof paymentIntent.latest_charge === "string"
              ? paymentIntent.latest_charge
              : paymentIntent.latest_charge?.id ?? null;
          await escrowRepository.markHeld(
            escrow.id,
            chargeId,
            new Date(),
            escrow.expiresAt ?? new Date(),
          );
        }
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (!paymentIntentId) break;
        const escrow =
          await escrowRepository.getByPaymentIntentId(paymentIntentId);
        if (escrow && escrow.status === PAYMENT_ESCROW_STATUS.HELD) {
          const refund = charge.refunds?.data?.[0];
          await escrowRepository.markRefunded(
            escrow.id,
            refund?.id ?? `charge_refund_${charge.id}`,
            new Date(),
          );
        }
        break;
      }
      default:
        break;
    }
  } catch {
    return Response.json({ error: "Error procesando webhook" }, { status: 500 });
  }

  return Response.json({ received: true });
}
