# Stripe billing (desarrollo)

Integración de pagos con **Stripe Connect** en test mode: escrow al publicar, transfer al completar entrega, refund al abortar.

## Variables de entorno (backend)

En `boilerplate-panalogix-/.env`:

```env
STRIPE_TEST_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=usd
PLATFORM_FEE_PERCENT=5
STRIPE_CONNECT_RETURN_URL=http://localhost:3000/billing/connect-return?stripe=return
STRIPE_CONNECT_REFRESH_URL=http://localhost:3000/billing/connect-return?stripe=refresh
STRIPE_CONNECT_DEFAULT_COUNTRY=US
```

El móvil **no** necesita keys de Stripe; usa `EXPO_PUBLIC_API_URL` hacia el backend.

## Webhooks locales

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copia el `whsec_...` impreso a `STRIPE_WEBHOOK_SECRET`.

Eventos manejados: `setup_intent.succeeded`, `account.updated`, `payment_intent.succeeded`, `charge.refunded`.

## Flujo por rol

| Rol | Perfil | Bloqueo | Acción Stripe |
|-----|--------|---------|---------------|
| Empresa | `/Perfil` → Métodos de Pago | Publicar flete | Customer + SetupIntent → PaymentIntent al publicar |
| Transportista | App → Perfil → Cobros | Postularse | Connect Express + Transfer al entregar |

## Tarjetas y datos de prueba

- Empresa: `4242 4242 4242 4242`, exp `12/34`, CVC `123`
- Transportista Connect (US test): routing `110000000`, account `000123456789`

## API

| Método | Ruta | Rol |
|--------|------|-----|
| GET | `/api/billing/status` | Empresa / Transportista |
| POST | `/api/billing/setup-intent` | Empresa |
| POST | `/api/billing/complete-setup` | Empresa |
| POST | `/api/billing/connect/onboard` | Transportista |
| POST | `/api/webhooks/stripe` | Stripe |

## Ciclo del flete

1. **Publicar** → `PaymentIntent` off-session → `payment_escrows.status = held`
2. **Postular** → requiere `payouts_enabled` en Connect
3. **Verificar código** → `Transfer` = `balance_transaction.net − platform_fee` → `released`
4. **Abortar viaje** → `Refund` → `refunded`

## Entrega completada

Web (`/entrega-completada/[viajeId]`) y móvil muestran `stripeTransferId` / `stripePaymentIntentId` del resumen real.

## Panamá (dev vs prod)

- **Dev:** cuenta plataforma test (recomendado US) + Connect accounts `US` con datos test.
- **Prod:** la empresa paga como Customer; transportistas PA requerirán cross-border payouts cuando la plataforma esté en país soportado.

## Troubleshooting

| Problema | Solución |
|----------|----------|
| `BILLING_REQUIRED` al publicar/postular | Completar Perfil → Pagos / Cobros |
| PaymentIntent falla off-session | Tarjeta `4242...` guardada; probar sin 3DS primero |
| Transfer falla | Verificar balance plataforma; el transfer usa **neto − comisión Panalogix**, no el bruto |
| Idempotency key `release-{id}` | Tras cambiar la lógica del monto, usar nueva versión (`net-v1`); reintentar verificación de código |
| Webhook no actualiza billing | `stripe listen` activo; `STRIPE_WEBHOOK_SECRET` correcto |
| Connect onboarding no completa | Revisar Connect → Accounts; webhook `account.updated` |
| Return URL en móvil no carga | Usar IP de la Mac en `STRIPE_CONNECT_*_URL`, no `localhost` |
| Vuelve al login web tras Stripe | La página `connect-return` debe abrir `panalogix://profile?billing=return` |

## Migración

```bash
npm run db:migrate
```

Tablas/columnas: `empresas.stripe_*`, `transportistas.stripe_*`, `payment_escrows`.
