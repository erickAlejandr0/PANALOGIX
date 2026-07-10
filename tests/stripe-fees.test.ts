import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  buildPaymentBreakdown,
  calculatePlatformFeeCents,
  estimateStripeFeeCents,
  resolveTransferAmountCents,
} from "../lib/stripe/fees";

describe("stripe fees", () => {
  test("calculatePlatformFeeCents aplica porcentaje sobre bruto", () => {
    assert.equal(calculatePlatformFeeCents(300_000, 5), 15_000);
  });

  test("estimateStripeFeeCents usa 2.9% + 30c", () => {
    assert.equal(estimateStripeFeeCents(300_000), 8_730);
  });

  test("buildPaymentBreakdown calcula pago estimado al transportista", () => {
    const breakdown = buildPaymentBreakdown(3000);
    assert.ok(breakdown);
    assert.equal(breakdown.totalPagoCents, 300_000);
    assert.equal(breakdown.platformFeeCents, 15_000);
    assert.equal(breakdown.stripeFeeEstimateCents, 8_730);
    assert.equal(breakdown.transportistaPayoutEstimateCents, 276_270);
  });

  test("resolveTransferAmountCents transfiere neto menos comisión plataforma", () => {
    const net = 291_270;
    const platformFee = 15_000;
    const resolved = resolveTransferAmountCents(net, platformFee);
    assert.equal(resolved.transferCents, 276_270);
    assert.equal(resolved.error, undefined);
  });

  test("resolveTransferAmountCents falla si el neto no alcanza", () => {
    const resolved = resolveTransferAmountCents(10_000, 15_000);
    assert.equal(resolved.transferCents, 0);
    assert.ok(resolved.error);
  });
});
