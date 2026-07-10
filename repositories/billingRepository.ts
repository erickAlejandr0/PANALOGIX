import { db } from "@/db";
import { empresas, transportistas } from "@/db/schema";
import type { Empresa, Transportista } from "@/db/schema";
import { BILLING_SETUP_STATUS } from "@/lib/stripe/config";
import { eq } from "drizzle-orm";

export type UpdateEmpresaBillingInput = {
  stripeCustomerId?: string | null;
  stripeDefaultPaymentMethodId?: string | null;
  billingSetupStatus?: (typeof BILLING_SETUP_STATUS)[keyof typeof BILLING_SETUP_STATUS];
  billingPaymentMethodLast4?: string | null;
  billingPaymentMethodBrand?: string | null;
  billingPaymentMethodExpMonth?: number | null;
  billingPaymentMethodExpYear?: number | null;
  billingSetupCompletedAt?: Date | null;
};

export type UpdateTransportistaBillingInput = {
  stripeConnectAccountId?: string | null;
  billingSetupStatus?: (typeof BILLING_SETUP_STATUS)[keyof typeof BILLING_SETUP_STATUS];
  payoutsEnabled?: boolean;
  chargesEnabled?: boolean;
  connectPayoutLast4?: string | null;
  billingSetupCompletedAt?: Date | null;
};

export const billingRepository = {
  getEmpresaById: async (empresaId: number) => {
    return db.query.empresas.findFirst({
      where: eq(empresas.id, empresaId),
    });
  },

  getTransportistaById: async (transportistaId: number) => {
    return db.query.transportistas.findFirst({
      where: eq(transportistas.id, transportistaId),
    });
  },

  updateEmpresaBilling: async (
    empresaId: number,
    data: UpdateEmpresaBillingInput,
  ): Promise<Empresa | undefined> => {
    const [row] = await db
      .update(empresas)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(empresas.id, empresaId))
      .returning();
    return row;
  },

  updateTransportistaBilling: async (
    transportistaId: number,
    data: UpdateTransportistaBillingInput,
  ): Promise<Transportista | undefined> => {
    const [row] = await db
      .update(transportistas)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(transportistas.id, transportistaId))
      .returning();
    return row;
  },

  findEmpresaByStripeCustomerId: async (customerId: string) => {
    return db.query.empresas.findFirst({
      where: eq(empresas.stripeCustomerId, customerId),
    });
  },

  findTransportistaByConnectAccountId: async (accountId: string) => {
    return db.query.transportistas.findFirst({
      where: eq(transportistas.stripeConnectAccountId, accountId),
    });
  },
};
