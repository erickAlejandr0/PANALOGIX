import { db } from "@/db";
import { paymentEscrows } from "@/db/schema";
import type { PaymentEscrow } from "@/db/schema";
import { PAYMENT_ESCROW_STATUS } from "@/lib/stripe/config";
import { and, desc, eq, lte } from "drizzle-orm";

export type CreatePaymentEscrowInput = {
  id_publicacion: number;
  id_flete: number;
  id_empresa: number;
  amountCents: number;
  platformFeeCents?: number | null;
  currency: string;
  stripePaymentIntentId: string;
  stripeChargeId?: string | null;
  status: (typeof PAYMENT_ESCROW_STATUS)[keyof typeof PAYMENT_ESCROW_STATUS];
  heldAt?: Date | null;
  expiresAt?: Date | null;
};

export const escrowRepository = {
  getByPublicacionId: async (publicacionId: number) => {
    return db.query.paymentEscrows.findFirst({
      where: eq(paymentEscrows.id_publicacion, publicacionId),
    });
  },

  getByPaymentIntentId: async (paymentIntentId: string) => {
    return db.query.paymentEscrows.findFirst({
      where: eq(paymentEscrows.stripePaymentIntentId, paymentIntentId),
    });
  },

  getByViajePublicacion: async (publicacionId: number) => {
    return escrowRepository.getByPublicacionId(publicacionId);
  },

  create: async (data: CreatePaymentEscrowInput): Promise<PaymentEscrow> => {
    const [row] = await db.insert(paymentEscrows).values(data).returning();
    return row;
  },

  markHeld: async (
    id: number,
    stripeChargeId: string | null,
    heldAt: Date,
    expiresAt: Date,
  ) => {
    const [row] = await db
      .update(paymentEscrows)
      .set({
        status: PAYMENT_ESCROW_STATUS.HELD,
        stripeChargeId,
        heldAt,
        expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(paymentEscrows.id, id))
      .returning();
    return row;
  },

  markReleased: async (
    id: number,
    stripeTransferId: string,
    releasedAt: Date,
    extras?: {
      stripeFeeCents: number;
      transportistaPayoutCents: number;
    },
  ) => {
    const [row] = await db
      .update(paymentEscrows)
      .set({
        status: PAYMENT_ESCROW_STATUS.RELEASED,
        stripeTransferId,
        releasedAt,
        stripeFeeCents: extras?.stripeFeeCents,
        transportistaPayoutCents: extras?.transportistaPayoutCents,
        updatedAt: new Date(),
      })
      .where(eq(paymentEscrows.id, id))
      .returning();
    return row;
  },

  markRefunded: async (id: number, stripeRefundId: string, refundedAt: Date) => {
    const [row] = await db
      .update(paymentEscrows)
      .set({
        status: PAYMENT_ESCROW_STATUS.REFUNDED,
        stripeRefundId,
        refundedAt,
        updatedAt: new Date(),
      })
      .where(eq(paymentEscrows.id, id))
      .returning();
    return row;
  },

  markFailed: async (id: number) => {
    const [row] = await db
      .update(paymentEscrows)
      .set({
        status: PAYMENT_ESCROW_STATUS.FAILED,
        updatedAt: new Date(),
      })
      .where(eq(paymentEscrows.id, id))
      .returning();
    return row;
  },

  listHeldExpiringBefore: async (before: Date) => {
    return db
      .select()
      .from(paymentEscrows)
      .where(
        and(
          eq(paymentEscrows.status, PAYMENT_ESCROW_STATUS.HELD),
          lte(paymentEscrows.expiresAt, before),
        ),
      );
  },

  listByEmpresa: async (empresaId: number, limit = 20) => {
    return db
      .select()
      .from(paymentEscrows)
      .where(eq(paymentEscrows.id_empresa, empresaId))
      .orderBy(desc(paymentEscrows.createdAt))
      .limit(limit);
  },

  countHeldByEmpresa: async (empresaId: number) => {
    const rows = await db
      .select()
      .from(paymentEscrows)
      .where(
        and(
          eq(paymentEscrows.id_empresa, empresaId),
          eq(paymentEscrows.status, PAYMENT_ESCROW_STATUS.HELD),
        ),
      );
    return rows.length;
  },
};
