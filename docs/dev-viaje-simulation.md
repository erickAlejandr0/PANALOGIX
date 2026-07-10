# Simulación de viaje (solo desarrollo)

Endpoints de QA para probar el flujo de entrega desde Postman/curl. Hay dos herramientas complementarias:

| Endpoint | Uso |
|----------|-----|
| **`/move`** | Tramo **geográfico**: coloca al transportista en origen/destino del flete y dispara transiciones reales (pin en mapa + Ably). |
| **`/advance`** | Atajo de **fases** (salta guards geográficos). Útil para inspección/código o E2E rápido. |
| **`/reset`** | Reinicia el viaje para repetir pruebas. |

## Configuración requerida

En `.env` del proyecto web:

```env
DEV_SIMULATION_TOKEN=<token-secreto>
NEGOCIACION_CODE_SECRET=<ya requerido para el flujo de negociación>
```

- `DEV_SIMULATION_TOKEN`: valor arbitrario que debes enviar en el header `x-dev-token`.
- Los endpoints **no existen en producción** (`NODE_ENV=production` → HTTP 404).
- Sin `DEV_SIMULATION_TOKEN` configurado → HTTP 503.

## Autenticación

No usa sesión de usuario. Solo el header:

```
x-dev-token: <valor de DEV_SIMULATION_TOKEN>
```

## POST `/api/dev/viajes/{viajeId}/move` (recomendado para mapa y entregas live)

Coloca al transportista en el **origen o destino del flete** (según la fase), actualiza ubicación en BD, emite `transportista.location.updated` y ejecuta la misma acción que la app móvil en ese punto.

**No requiere coordenadas en el body.** Las posiciones se calculan desde `origen_geom` / `destino_geom` del flete.

### Cuerpo

```json
{}
```

Sin campos obligatorios.

### Comportamiento por fase

| Fase actual     | Posición simulada | Transición real              | Estado entrega después |
|-----------------|-------------------|------------------------------|-------------------------|
| `hacia_origen`  | Origen del flete  | `confirmarRecogida`          | **en camino**           |
| `hacia_destino` | Destino del flete | `anunciarLlegada`            | **en destino**          |

| Fase actual | Respuesta |
|-------------|-----------|
| `asignado` | 422 — inicia el viaje desde la app del transportista primero |
| `en_destino`, `inspeccion`, `codigo_pendiente` | 422 — continúa con la UI de empresa/transportista |
| `resumen` / `completado` | 422 — usa `/reset` |

### Respuesta exitosa (200)

```json
{
  "data": {
    "viajeId": 42,
    "target": "origen",
    "position": { "lng": -79.5199, "lat": 8.9824 },
    "distanceToTargetM": 0,
    "transition": "confirmar_recogida",
    "faseBefore": "hacia_origen",
    "faseAfter": "hacia_destino",
    "entregaEstadoBefore": "por_recoger",
    "entregaEstadoAfter": "en_camino",
    "locationUpdated": true
  }
}
```

### Errores

Mismos códigos que `/advance` (401, 404, 422, 503).

### Móvil (simulador / dispositivo)

Durante un viaje activo, la app muestra y sincroniza la ubicación según la **fase** y el **origen/destino del flete** cuando el GPS del dispositivo está lejos del área del flete (p. ej. simulador iOS). Con GPS real en Panamá, el mapa sigue el dispositivo.

Así, al llamar `/move` y recibir `viaje.fase.updated` por Ably, el pin del transportista en el emulador **salta al origen o destino** alineado con el backend.

## POST `/api/dev/viajes/{viajeId}/advance`

Avanza el viaje **un paso** usando los mismos servicios de negocio que la app (`viajeService`, `negociacionViajeService`). Cada paso persiste en BD y emite eventos Ably.

### Cuerpo (opcional, JSON)

```json
{
  "to": "resumen"
}
```

| Campo | Tipo   | Descripción |
|-------|--------|-------------|
| `to`  | string | Fase destino. Si se envía, el endpoint repite avances hasta llegar a esa fase. |

Fases válidas para `to`: `hacia_origen`, `hacia_destino`, `en_destino`, `inspeccion`, `codigo_pendiente`, `resumen`.

Sin cuerpo: avanza **una sola fase**.

### Secuencia de fases

| Fase actual       | Acción del endpoint                          | Rol impersonado   |
|-------------------|----------------------------------------------|-------------------|
| `asignado`        | `viajeService.iniciar`                       | Transportista     |
| `hacia_origen`    | `viajeService.confirmarRecogida`             | Transportista     |
| `hacia_destino`   | `negociacionViajeService.anunciarLlegada`     | Transportista     |
| `en_destino`      | `negociacionViajeService.aceptarLlegada`     | Empresa           |
| `inspeccion`      | `negociacionViajeService.completarInspeccion`| Empresa           |
| `codigo_pendiente`| `regenerarCodigo` + `verificarCodigo`        | Empresa + Transportista |
| `resumen`         | Sin cambios (`done: true`)                   | —                 |

En `codigo_pendiente → resumen` el endpoint regenera un código y lo verifica de inmediato (prueba E2E automatizada). El código emitido se devuelve en la respuesta.

### Respuesta exitosa (200)

```json
{
  "data": {
    "from": "asignado",
    "to": "hacia_origen"
  }
}
```

Con `to` en el cuerpo (múltiples pasos):

```json
{
  "data": {
    "from": "asignado",
    "to": "resumen",
    "codigo": "482910",
    "done": true,
    "steps": [
      { "from": "asignado", "to": "hacia_origen" },
      { "from": "hacia_origen", "to": "hacia_destino" }
    ]
  }
}
```

| Campo    | Descripción |
|----------|-------------|
| `from`   | Fase al inicio del avance |
| `to`     | Fase resultante en BD |
| `codigo` | Presente si se generó código (inspección o verificación) |
| `done`   | `true` si el viaje llegó a `resumen` |
| `steps`  | Detalle de cada paso (solo con `to` en el cuerpo) |

### Errores

| Código | Motivo |
|--------|--------|
| 401 | Token inválido o ausente |
| 404 | Entorno de producción |
| 422 | Transición no permitida (guard de negocio) |
| 503 | `DEV_SIMULATION_TOKEN` no configurado |

## POST `/api/dev/viajes/{viajeId}/reset`

Reinicia un viaje para repetir pruebas con la misma publicación.

### Cuerpo

Ninguno.

### Efectos en BD

- `viajes`: `fase = asignado`, `id_estado = en_curso`, limpia código de verificación y alertas de proximidad.
- `publicaciones`: `estado = publicado`.
- `fletes`: `estado = activo`.
- Transportista: `disponible = true`.

### Respuesta (200)

```json
{
  "data": {
    "from": "resumen",
    "to": "asignado"
  }
}
```

## Flujo de prueba recomendado (UI + move + UI)

1. **UI:** empresa acepta postulación; transportista **inicia** el viaje (`asignado` → `hacia_origen`).
2. Abrir web empresa (dashboard + entregas) con sesión en vivo.
3. **`POST .../move` `{}`** → recogida confirmada, pin en origen, entrega pasa a **en camino**.
4. **`POST .../move` `{}`** → llegada anunciada, pin en destino, entrega pasa a **en destino**.
5. **UI:** empresa acepta llegada, inspección, código; transportista verifica código.
6. **`POST .../reset`** para repetir.

### Atajo E2E sin mapa (solo negociación)

1. Aceptar postulación.
2. `POST .../advance` con `{ "to": "resumen" }` (salta ubicación y fases).

## Ejemplo Postman — move (tramo geográfico)

```
POST http://localhost:3000/api/dev/viajes/42/move
Header: x-dev-token: panalogix-dev-sim-7f3a9c2e1b8d4f6a
Content-Type: application/json

{}
```

Repetir una vez cuando la fase sea `hacia_destino`.

## Ejemplo Postman — advance

```
POST http://localhost:3000/api/dev/viajes/42/advance
Header: x-dev-token: panalogix-dev-sim-7f3a9c2e1b8d4f6a
Content-Type: application/json

{}
```

Avance hasta resumen:

```
POST http://localhost:3000/api/dev/viajes/42/advance
Header: x-dev-token: panalogix-dev-sim-7f3a9c2e1b8d4f6a
Content-Type: application/json

{ "to": "resumen" }
```
