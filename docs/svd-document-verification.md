# SVD — verificación documental (integración Panalogix)

## Variables

Ver `.env.example`:

- `SVD_API_BASE_URL` — HTTP API del stack (ej. `https://jowp8cya0k.execute-api.us-east-1.amazonaws.com`)
- `SVD_API_KEY` — SSM `/svd/{env}/PANALOGIX_API_KEY`
- `SVD_WEBHOOK_HMAC_SECRET` — SSM `/svd/{env}/WEBHOOK_HMAC_SECRET`

## Webhook en AWS

Configura el parámetro SSM del SVD:

```text
/svd/{env}/WEBHOOK_URL = https://<dominio-panalogix>/api/webhooks/svd
```

## Migración

```bash
npm run db:migrate
```

Aplica `drizzle/0009_svd_document_verification.sql` (`svd_external_id` + `document_verifications`).

## Flujo

1. Transportista en `/continuar-en-app` sube cédula, licencia, SOAT, revisado.
2. `POST /api/transportista/documentos/enviar` orquesta generar-url → S3 → POST /verificaciones.
3. Resultados: webhook HMAC y/o reconcile vía `GET /verificaciones/{svd_external_id}` si el estado local queda stale (~2.5 min).
