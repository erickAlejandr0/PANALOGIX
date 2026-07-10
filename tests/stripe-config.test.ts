import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  centsToDollars,
  dollarsToCents,
  isStripeConfigured,
} from "../lib/stripe/config";

describe("stripe config", () => {
  test("dollarsToCents convierte montos USD", () => {
    assert.equal(dollarsToCents(500), 50000);
    assert.equal(dollarsToCents("12.34"), 1234);
  });

  test("centsToDollars invierte correctamente", () => {
    assert.equal(centsToDollars(50000), 500);
  });

  test("dollarsToCents rechaza montos inválidos", () => {
    assert.throws(() => dollarsToCents(0));
    assert.throws(() => dollarsToCents("abc"));
  });

  test("isStripeConfigured depende de STRIPE_TEST_SECRET_KEY", () => {
    const previous = process.env.STRIPE_TEST_SECRET_KEY;
    delete process.env.STRIPE_TEST_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    assert.equal(isStripeConfigured(), false);
    process.env.STRIPE_TEST_SECRET_KEY = previous;
  });
});
