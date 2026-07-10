# Panalogix

**Marketplace de logística terrestre para Panamá.** Conecta empresas que necesitan mover carga con transportistas verificados, con rastreo en tiempo real, prueba de entrega digital y pagos en escrow.

---

## El problema

En Panamá, gran parte del transporte de carga aún se coordina por WhatsApp, llamadas y relaciones informales. Eso genera:

- **Falta de visibilidad** — la empresa no sabe dónde está su carga ni cuándo llegará.
- **Riesgo de pago** — el transportista espera cobro; la empresa teme pagar antes de confirmar entrega.
- **Matching ineficiente** — encontrar el vehículo correcto (capacidad, licencia, tipo de carga) es lento y opaco.
- **Sin trazabilidad** — no hay ePOD, checklist de inspección ni historial auditable del viaje.

## La solución

Panalogix digitaliza el ciclo completo del flete:

1. La **empresa** publica un flete (origen, destino, tipo de carga, precio) y el pago queda retenido en escrow.
2. Los **transportistas** ven fletes cercanos en el mapa, se postulan y, al ser aceptados, ejecutan el viaje en la app móvil.
3. El viaje avanza por fases controladas (hacia origen → en tránsito → inspección → código de verificación → completado).
4. Al verificar la entrega, el escrow se libera al transportista (menos comisión de plataforma); si el viaje se aborta, se reembolsa a la empresa.

| Para empresas (web) | Para transportistas (móvil + API) |
|---------------------|-----------------------------------|
| Dashboard con mapa en vivo | Mapa de fletes cercanos |
| Publicar y administrar fletes | Postulación y viaje activo |
| Seguimiento de entregas | Navegación, inspección y ePOD |
| Billing con tarjeta (Stripe) | Cobros vía Stripe Connect |

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | **Next.js 16** (App Router) + React 19 |
| Lenguaje | TypeScript |
| UI | Tailwind CSS 4, Radix / shadcn, Framer Motion |
| Base de datos | **PostgreSQL** + **PostGIS** (geometrías) |
| ORM / migraciones | Drizzle ORM + Drizzle Kit |
| Auth | JWT (cookie), Google OAuth, bcrypt |
| Mapas y rutas | Mapbox (geocoding, directions, matrix) |
| Tiempo real | Ably |
| Pagos | Stripe (Customer + PaymentIntents + Connect Express) |
| Tests | Node.js test runner (`node:test`) |

Este repositorio es el **backend + panel web de empresa**. La app móvil del transportista (Expo / React Native) consume las APIs bajo `/api/transportista/*`.

---

## Arquitectura general

```
┌─────────────────┐     ┌──────────────────────────────┐     ┌─────────────────┐
│  Web Empresa    │────▶│  Next.js (App Router)         │◀────│  App Móvil      │
│  Dashboard      │     │  • Pages / Server Actions     │     │  Transportista  │
│  Publicaciones  │     │  • API Routes (/api/*)        │     │  (Expo)         │
└─────────────────┘     │  • Middleware (JWT)           │     └─────────────────┘
                        └──────────────┬───────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              ▼                        ▼                        ▼
        PostgreSQL+PostGIS          Stripe                   Ably
        (fletes, viajes,            (escrow / Connect)       (ubicación,
         escrow, flota)                                       eventos)
                                       ▲
                                    Mapbox
                              (rutas / geocoding)
```

**Capas de código**

| Capa | Rol |
|------|-----|
| `app/` | Rutas UI y API (Next.js) |
| `actions/` | Server Actions (formularios / mutaciones) |
| `service/` | Lógica de negocio |
| `repositories/` | Acceso a datos (Drizzle / SQL) |
| `lib/` | Auth, Stripe, Mapbox, transiciones de viaje, validaciones |
| `db/` | Schema Drizzle + seed |
| `drizzle/` | Migraciones SQL versionadas |

**Ciclo de un viaje (fases)**

`asignado` → `hacia_origen` → `hacia_destino` → `en_destino` → `inspeccion` → `codigo_pendiente` → `resumen` → `completado`

Las transiciones están bloqueadas por reglas de negocio (proximidad geográfica, checklist, código OTP). El pago se libera al verificar el código de entrega.

---

## Estado actual del proyecto

Prototipo funcional avanzado (MVP técnico) orientado a demo y validación de producto.

**Implementado**

- Auth email/password + Google OAuth; onboarding empresa y transportista
- Publicación de fletes con geocoding Mapbox y retención Stripe (escrow)
- Postulaciones, asignación de viaje y ciclo de fases completo
- Dashboard empresa con mapa en vivo y notificaciones Ably
- Inspección de carga, código de verificación y resumen de entrega
- Billing empresa (SetupIntent / tarjeta) y Connect Express para transportistas
- Catálogo de vehículos (rígido / articulado / especializado) y tipos de carga
- Endpoints de simulación de viaje para QA (`/api/dev/viajes/*`)
- Suite de tests unitarios del dominio (`tests/`)

**Pendiente / fuera de alcance actual**

- Hardening de producción (rate limits, observabilidad, CI/CD completo)
- Compliance KYC/AML y payouts nativos Panamá (hoy Connect en modo test / país configurable)
- Matching algorítmico avanzado y consolidación de carga
- App móvil Android (iOS en desarrollo paralelo en repo separado)

---

## Setup local

### Requisitos

- Node.js 20+
- PostgreSQL 15+ con extensión **PostGIS**
- Cuentas de desarrollo: Mapbox, Ably, Stripe (test), Google Cloud OAuth

### 1. Clonar e instalar

```bash
git clone <url-del-repo>
cd boilerplate-panalogix-
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales. Resumen de grupos (placeholders en `.env.example`):

| Grupo | Variables clave |
|-------|-----------------|
| Base de datos | `DATABASE_URL` |
| Auth | `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_IOS_CLIENT_ID` |
| Mapas | `MAPBOX_API_KEY`, `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` |
| Realtime | `ABLY_API_KEY` |
| Stripe | `STRIPE_TEST_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `PLATFORM_FEE_PERCENT`, URLs Connect |
| Viajes | `NEGOCIACION_CODE_SECRET` |
| Dev (opcional) | `DEV_SIMULATION_TOKEN` |

Nunca commits `.env`. Solo `.env.example` va al repositorio.

### 3. Base de datos

```bash
# Crear DB y habilitar PostGIS (ejemplo)
# CREATE DATABASE panalogix;
# CREATE EXTENSION IF NOT EXISTS postgis;

npm run db:migrate
npm run db:seed
```

### 4. Stripe webhooks (local)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copia el `whsec_...` a `STRIPE_WEBHOOK_SECRET`. Detalle en [`docs/stripe-dev-setup.md`](docs/stripe-dev-setup.md).

### 5. Arrancar

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build y producción local |
| `npm run db:generate` | Generar migración desde el schema |
| `npm run db:migrate` | Aplicar migraciones |
| `npm run db:seed` | Datos base (roles, tipos de carga, configs de vehículo) |
| `npm run db:studio` | Drizzle Studio |
| `npm test` | Tests unitarios |
| `npm run lint` | ESLint |

Documentación adicional:

- [`docs/stripe-dev-setup.md`](docs/stripe-dev-setup.md) — billing y Connect
- [`docs/dev-viaje-simulation.md`](docs/dev-viaje-simulation.md) — simulación de viajes para QA

---

## Estructura de carpetas

```
boilerplate-panalogix-/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login, signup, onboarding
│   ├── (main)/             # Dashboard, publicaciones, entregas, perfil
│   ├── api/                # REST API (auth, billing, transportista, mapbox, webhooks)
│   ├── billing/            # Return URLs de Stripe Connect
│   ├── entrega-completada/ # Resumen post-entrega
│   └── verificacion/       # Flujo de código de verificación (web)
├── actions/                # Server Actions
├── components/             # UI por dominio (landing, dashboard, entregas, …)
├── db/                     # Schema Drizzle + seed
├── drizzle/                # Migraciones SQL
├── docs/                   # Guías de desarrollo
├── lib/                    # Utilidades de dominio (auth, stripe, mapbox, viajes, …)
├── repositories/           # Persistencia
├── service/                # Casos de uso / orquestación
├── tests/                  # Tests unitarios del dominio
├── public/                 # Assets estáticos
├── middleware.ts           # Protección de rutas y redirección por rol
└── .env.example            # Plantilla de variables (sin secretos)
```

---

## Modelo de datos (resumen)

Entidades principales en PostgreSQL + PostGIS:

| Dominio | Tablas |
|---------|--------|
| Identidad | `usuarios`, `roles`, `empresas`, `transportistas` |
| Flota | `flota`, `categoria_vehiculo`, `config_vehiculo`, configs por tipo |
| Marketplace | `fletes`, `publicaciones`, `postulaciones`, `carga_types` |
| Operación | `viajes` (fases + checklist + OTP), `transportista_ubicaciones` |
| Pagos | `payment_escrows` (held → released / refunded) |

Geometrías (`origen_geom`, `destino_geom`, ubicación del conductor) habilitan búsqueda por radio y guards de proximidad en el ciclo del viaje.

---

## Licencia

Proyecto privado. Todos los derechos reservados.
