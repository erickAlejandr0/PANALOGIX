import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";

import { verifySvdWebhookSignature } from "@/lib/svd/webhook-hmac";

const secret = "example-webhook-secret-do-not-use-in-prod";
const body =
  '{"transportista_id":"11111111-1111-1111-1111-111111111111","tipo_documento":"cedula","resultado":"APROBADO","score_lectura":"0.955","score_autenticidad":"0.850","fecha_vencimiento":"2027-06-15"}';

test("acepta firma HMAC correcta", () => {
  const hex = createHmac("sha256", secret).update(body, "utf8").digest("hex");
  assert.equal(
    verifySvdWebhookSignature(body, `sha256=${hex}`, secret),
    true,
  );
});

test("rechaza firma incorrecta o ausente", () => {
  assert.equal(verifySvdWebhookSignature(body, "sha256=deadbeef", secret), false);
  assert.equal(verifySvdWebhookSignature(body, null, secret), false);
  assert.equal(verifySvdWebhookSignature(body, "md5=abc", secret), false);
});
