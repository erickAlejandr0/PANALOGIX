import type { Empresa, Transportista } from "@/db/schema";
import type { BillingServiceResult } from "@/lib/billing/types";
import {
  BILLING_ERROR_CODE,
  BILLING_SETUP_STATUS,
  getConnectDefaultCountry,
  getConnectRefreshUrl,
  getConnectReturnUrl,
  isStripeConfigured,
} from "@/lib/stripe/config";
import { getStripeClient } from "@/lib/stripe/client";
import { billingRepository } from "@/repositories/billingRepository";
import { escrowRepository } from "@/repositories/escrowRepository";
import { transportistaRepository } from "@/repositories/transportistaRepository";

const EMPRESA_BILLING_REDIRECT = "/Perfil?section=pagos";
const TRANSPORTISTA_BILLING_REDIRECT = "/(main)/profile?section=cobros";

function billingRequiredError(
  message: string,
  redirectTo: string,
): BillingServiceResult<never> {
  return {
    success: false,
    error: message,
    code: BILLING_ERROR_CODE.BILLING_REQUIRED,
    redirectTo,
  };
}

function stripeNotConfiguredError(): BillingServiceResult<never> {
  return {
    success: false,
    error: "Stripe no está configurado en el servidor",
    code: BILLING_ERROR_CODE.STRIPE_NOT_CONFIGURED,
  };
}

export function isEmpresaBillingReady(empresa: Empresa): boolean {
  return (
    empresa.billingSetupStatus === BILLING_SETUP_STATUS.READY &&
    Boolean(empresa.stripeCustomerId) &&
    Boolean(empresa.stripeDefaultPaymentMethodId)
  );
}

export function isTransportistaBillingReady(
  transportista: Transportista,
): boolean {
  return (
    transportista.billingSetupStatus === BILLING_SETUP_STATUS.READY &&
    Boolean(transportista.stripeConnectAccountId) &&
    transportista.payoutsEnabled
  );
}

export const billingService = {
  assertEmpresaCanPublish(empresa: Empresa): BillingServiceResult<true> {
    if (isEmpresaBillingReady(empresa)) {
      return { success: true, data: true };
    }
    return billingRequiredError(
      "Debes configurar tu información de pagos en Perfil antes de publicar un flete.",
      EMPRESA_BILLING_REDIRECT,
    );
  },

  assertTransportistaCanApply(
    transportista: Transportista,
  ): BillingServiceResult<true> {
    if (isTransportistaBillingReady(transportista)) {
      return { success: true, data: true };
    }
    return billingRequiredError(
      "Debes completar tu información de cobros en Perfil antes de postular.",
      TRANSPORTISTA_BILLING_REDIRECT,
    );
  },

  async getEmpresaStatus(empresa: Empresa) {
    return {
      role: "empresa" as const,
      status: empresa.billingSetupStatus,
      ready: isEmpresaBillingReady(empresa),
      paymentMethod:
        empresa.billingPaymentMethodLast4 && empresa.billingPaymentMethodBrand
          ? {
              brand: empresa.billingPaymentMethodBrand,
              last4: empresa.billingPaymentMethodLast4,
              expMonth: empresa.billingPaymentMethodExpMonth,
              expYear: empresa.billingPaymentMethodExpYear,
            }
          : null,
    };
  },

  async getTransportistaStatus(transportista: Transportista) {
    return {
      role: "transportista" as const,
      status: transportista.billingSetupStatus,
      ready: isTransportistaBillingReady(transportista),
      payoutsEnabled: transportista.payoutsEnabled,
      connectPayoutLast4: transportista.connectPayoutLast4,
    };
  },

  async refreshTransportistaStatus(transportista: Transportista) {
    if (
      transportista.stripeConnectAccountId &&
      !isTransportistaBillingReady(transportista) &&
      isStripeConfigured()
    ) {
      try {
        await billingService.syncConnectAccount(
          transportista.stripeConnectAccountId,
        );
        const refreshed = await transportistaRepository.getById(transportista.id);
        if (refreshed) {
          return billingService.getTransportistaStatus(refreshed);
        }
      } catch {
        // Si Stripe falla, devolvemos el estado cacheado en BD.
      }
    }

    return billingService.getTransportistaStatus(transportista);
  },

  async ensureEmpresaCustomer(
    empresa: Empresa,
    email: string,
  ): Promise<BillingServiceResult<{ customerId: string }>> {
    if (!isStripeConfigured()) {
      return stripeNotConfiguredError();
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return stripeNotConfiguredError();
    }

    if (empresa.stripeCustomerId) {
      return { success: true, data: { customerId: empresa.stripeCustomerId } };
    }

    const customer = await stripe.customers.create({
      email,
      name: empresa.nombre,
      metadata: {
        empresaId: String(empresa.id),
        ruc: empresa.ruc,
      },
    });

    await billingRepository.updateEmpresaBilling(empresa.id, {
      stripeCustomerId: customer.id,
      billingSetupStatus: BILLING_SETUP_STATUS.INCOMPLETE,
    });

    return { success: true, data: { customerId: customer.id } };
  },

  async createEmpresaSetupIntent(
    empresa: Empresa,
    email: string,
  ): Promise<
    BillingServiceResult<{ clientSecret: string; customerId: string }>
  > {
    if (!isStripeConfigured()) {
      return stripeNotConfiguredError();
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return stripeNotConfiguredError();
    }

    const customerResult = await billingService.ensureEmpresaCustomer(
      empresa,
      email,
    );
    if (!customerResult.success) {
      return customerResult;
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerResult.data.customerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        empresaId: String(empresa.id),
      },
    });

    if (!setupIntent.client_secret) {
      return {
        success: false,
        error: "No se pudo iniciar la configuración de pago",
      };
    }

    return {
      success: true,
      data: {
        clientSecret: setupIntent.client_secret,
        customerId: customerResult.data.customerId,
      },
    };
  },

  async syncEmpresaPaymentMethod(
    empresaId: number,
    customerId: string,
    paymentMethodId: string,
  ) {
    const stripe = getStripeClient();
    if (!stripe) return;

    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    const card = paymentMethod.card;

    await billingRepository.updateEmpresaBilling(empresaId, {
      stripeDefaultPaymentMethodId: paymentMethodId,
      billingSetupStatus: BILLING_SETUP_STATUS.READY,
      billingPaymentMethodLast4: card?.last4 ?? null,
      billingPaymentMethodBrand: card?.brand ?? null,
      billingPaymentMethodExpMonth: card?.exp_month ?? null,
      billingPaymentMethodExpYear: card?.exp_year ?? null,
      billingSetupCompletedAt: new Date(),
    });
  },

  async ensureTransportistaConnectAccount(
    transportista: Transportista,
    email: string,
  ): Promise<BillingServiceResult<{ accountId: string }>> {
    if (!isStripeConfigured()) {
      return stripeNotConfiguredError();
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return stripeNotConfiguredError();
    }

    if (transportista.stripeConnectAccountId) {
      return {
        success: true,
        data: { accountId: transportista.stripeConnectAccountId },
      };
    }

    const country = getConnectDefaultCountry();
    const account = await stripe.accounts.create({
      type: "express",
      country,
      email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: "individual",
      individual: {
        first_name: transportista.nombre,
        last_name: transportista.apellido,
        email,
      },
      metadata: {
        transportistaId: String(transportista.id),
      },
    });

    await billingRepository.updateTransportistaBilling(transportista.id, {
      stripeConnectAccountId: account.id,
      billingSetupStatus: BILLING_SETUP_STATUS.INCOMPLETE,
      payoutsEnabled: false,
      chargesEnabled: false,
    });

    return { success: true, data: { accountId: account.id } };
  },

  async createTransportistaOnboardingLink(
    transportista: Transportista,
    email: string,
  ): Promise<BillingServiceResult<{ url: string }>> {
    if (!isStripeConfigured()) {
      return stripeNotConfiguredError();
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return stripeNotConfiguredError();
    }

    const accountResult = await billingService.ensureTransportistaConnectAccount(
      transportista,
      email,
    );
    if (!accountResult.success) {
      return accountResult;
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountResult.data.accountId,
      refresh_url: getConnectRefreshUrl(),
      return_url: getConnectReturnUrl(),
      type: "account_onboarding",
    });

    return { success: true, data: { url: accountLink.url } };
  },

  async syncConnectAccount(accountId: string) {
    const stripe = getStripeClient();
    if (!stripe) return;

    const transportista =
      await billingRepository.findTransportistaByConnectAccountId(accountId);
    if (!transportista) return;

    const account = await stripe.accounts.retrieve(accountId);
    const payoutsEnabled = Boolean(account.payouts_enabled);
    const chargesEnabled = Boolean(account.charges_enabled);
    const requirementsDue = account.requirements?.currently_due ?? [];
    const ready =
      payoutsEnabled &&
      chargesEnabled &&
      account.details_submitted &&
      requirementsDue.length === 0;

    let connectPayoutLast4 = transportista.connectPayoutLast4;
    if (account.external_accounts?.data?.length) {
      const bank = account.external_accounts.data.find(
        (item) => item.object === "bank_account",
      );
      if (bank && "last4" in bank && typeof bank.last4 === "string") {
        connectPayoutLast4 = bank.last4;
      }
    }

    await billingRepository.updateTransportistaBilling(transportista.id, {
      payoutsEnabled,
      chargesEnabled,
      connectPayoutLast4,
      billingSetupStatus: ready
        ? BILLING_SETUP_STATUS.READY
        : BILLING_SETUP_STATUS.INCOMPLETE,
      billingSetupCompletedAt: ready ? new Date() : null,
    });
  },

  async removeEmpresaPaymentMethod(
    empresa: Empresa,
  ): Promise<BillingServiceResult<true>> {
    if (!isStripeConfigured()) {
      return stripeNotConfiguredError();
    }

    if (!empresa.stripeDefaultPaymentMethodId) {
      return {
        success: false,
        error: "No hay método de pago configurado",
      };
    }

    const heldEscrows = await escrowRepository.countHeldByEmpresa(empresa.id);
    if (heldEscrows > 0) {
      return {
        success: false,
        error:
          "No puedes eliminar la tarjeta mientras tengas fletes con fondos reservados.",
      };
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return stripeNotConfiguredError();
    }

    try {
      await stripe.paymentMethods.detach(empresa.stripeDefaultPaymentMethodId);
    } catch {
      return {
        success: false,
        error: "No se pudo eliminar el método de pago en Stripe",
      };
    }

    await billingRepository.updateEmpresaBilling(empresa.id, {
      stripeDefaultPaymentMethodId: null,
      billingSetupStatus: BILLING_SETUP_STATUS.INCOMPLETE,
      billingPaymentMethodLast4: null,
      billingPaymentMethodBrand: null,
      billingPaymentMethodExpMonth: null,
      billingPaymentMethodExpYear: null,
      billingSetupCompletedAt: null,
    });

    return { success: true, data: true };
  },

  async handleSetupIntentSucceeded(setupIntentId: string) {
    const stripe = getStripeClient();
    if (!stripe) return;

    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    const customerId =
      typeof setupIntent.customer === "string"
        ? setupIntent.customer
        : setupIntent.customer?.id;
    const paymentMethodId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id;

    if (!customerId || !paymentMethodId) return;

    const empresa =
      await billingRepository.findEmpresaByStripeCustomerId(customerId);
    if (!empresa) return;

    await billingService.syncEmpresaPaymentMethod(
      empresa.id,
      customerId,
      paymentMethodId,
    );
  },
};
