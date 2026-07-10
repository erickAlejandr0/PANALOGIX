"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronRight,
  Flag,
  Info,
  MapPin,
  Package,
  Send,
} from "lucide-react";
import {
  createAndPublishFleteAction,
  createFleteAction,
} from "@/actions/fleteActions";
import type { CargaType } from "@/db/schema";
import {
  formatPanamaDate,
  PANAMA_DATE_PLACEHOLDER,
} from "@/lib/dates/panama";
import {
  FleteRouteMap,
  type MapPoint,
  type RouteGeometry,
} from "@/components/publicaciones/FleteRouteMap";
import { PaymentBreakdownPanel } from "@/components/billing/PaymentBreakdownPanel";
import type { PaymentBreakdownDto } from "@/lib/stripe/fees";

type NuevoFleteFormProps = {
  cargaTypes: CargaType[];
};

type RouteEstimateResponse = {
  durationSeconds: number;
  distanceMeters: number;
  geometry: RouteGeometry;
  fecha_entrega_estimada: string | null;
};

function getEntregaEstimadaLabel(options: {
  routeLoading: boolean;
  fechaSalida: string;
  fechaEntrega: string;
  canEstimateRoute: boolean;
}) {
  if (options.routeLoading) return "Calculando con Mapbox...";
  if (options.fechaEntrega) return formatPanamaDate(options.fechaEntrega);
  if (options.canEstimateRoute && !options.fechaSalida) {
    return `Seleccione fecha de salida (${PANAMA_DATE_PLACEHOLDER})`;
  }
  return "esperando respuesta del sistema..";
}

export function NuevoFleteForm({ cargaTypes }: NuevoFleteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectionMode, setSelectionMode] = useState<"origen" | "destino">(
    "origen",
  );
  const [origenNombre, setOrigenNombre] = useState("");
  const [destinoNombre, setDestinoNombre] = useState("");
  const [origen, setOrigen] = useState<MapPoint | null>(null);
  const [destino, setDestino] = useState<MapPoint | null>(null);
  const [fechaSalida, setFechaSalida] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [routeGeometry, setRouteGeometry] = useState<RouteGeometry | null>(
    null,
  );
  const [routeLoading, setRouteLoading] = useState(false);
  const [idTipoCarga, setIdTipoCarga] = useState(
    cargaTypes[0]?.id ? String(cargaTypes[0].id) : "",
  );
  const [peso, setPeso] = useState("");
  const [totalPago, setTotalPago] = useState("");
  const [paymentBreakdown, setPaymentBreakdown] =
    useState<PaymentBreakdownDto | null>(null);
  const [cargaPeligrosa, setCargaPeligrosa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const routeRequestIdRef = useRef(0);

  const canEstimateRoute = Boolean(origen && destino);

  useEffect(() => {
    const amount = Number.parseFloat(totalPago);
    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentBreakdown(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(
            `/api/billing/payment-breakdown?totalPago=${encodeURIComponent(totalPago)}`,
          );
          if (!response.ok) {
            setPaymentBreakdown(null);
            return;
          }
          const json = (await response.json()) as {
            data?: PaymentBreakdownDto;
          };
          setPaymentBreakdown(json.data ?? null);
        } catch {
          setPaymentBreakdown(null);
        }
      })();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [totalPago]);

  const payload = useMemo(
    () => ({
      origen_nombre: origenNombre,
      destino_nombre: destinoNombre,
      origen_lng: origen?.lng,
      origen_lat: origen?.lat,
      destino_lng: destino?.lng,
      destino_lat: destino?.lat,
      fecha_salida: fechaSalida,
      fecha_entrega_estimada: fechaEntrega,
      id_tipo_carga: Number(idTipoCarga),
      peso: Number(peso),
      total_pago: Number(totalPago),
      carga_peligrosa: cargaPeligrosa,
    }),
    [
      origenNombre,
      destinoNombre,
      origen,
      destino,
      fechaSalida,
      fechaEntrega,
      idTipoCarga,
      peso,
      totalPago,
      cargaPeligrosa,
    ],
  );

  async function fetchPlaceName(point: MapPoint) {
    const response = await fetch(
      `/api/mapbox/geocode?lng=${point.lng}&lat=${point.lat}`,
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { place_name?: string };
    return data.place_name ?? null;
  }

  async function fetchRouteEstimate(nextFechaSalida: string) {
    if (!origen || !destino) return;

    const requestId = ++routeRequestIdRef.current;
    setRouteLoading(true);
    setError(null);

    if (!nextFechaSalida) {
      setFechaEntrega("");
    }

    try {
      const response = await fetch("/api/mapbox/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origen_lng: origen.lng,
          origen_lat: origen.lat,
          destino_lng: destino.lng,
          destino_lat: destino.lat,
          fecha_salida: nextFechaSalida || undefined,
        }),
      });

      if (requestId !== routeRequestIdRef.current) return;

      const data = (await response.json()) as RouteEstimateResponse & {
        error?: string;
      };

      if (!response.ok) {
        setRouteGeometry(null);
        setFechaEntrega("");
        setError(
          data.error ??
            "No se pudo calcular la ruta con Mapbox. Verifique origen y destino.",
        );
        return;
      }

      setRouteGeometry(data.geometry);

      if (data.fecha_entrega_estimada) {
        setFechaEntrega(data.fecha_entrega_estimada);
      } else if (!nextFechaSalida) {
        setFechaEntrega("");
      }
    } catch {
      if (requestId === routeRequestIdRef.current) {
        setRouteGeometry(null);
        setFechaEntrega("");
        setError("Error al consultar la ruta.");
      }
    } finally {
      if (requestId === routeRequestIdRef.current) {
        setRouteLoading(false);
      }
    }
  }

  async function handleMapClick(mode: "origen" | "destino", point: MapPoint) {
    setError(null);
    const placeName = await fetchPlaceName(point);

    if (mode === "origen") {
      setOrigen(point);
      if (placeName) setOrigenNombre(placeName);
    } else {
      setDestino(point);
      if (placeName) setDestinoNombre(placeName);
    }
  }

  useEffect(() => {
    if (!canEstimateRoute) {
      setRouteGeometry(null);
      setFechaEntrega("");
      return;
    }

    void fetchRouteEstimate(fechaSalida);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origen, destino, fechaSalida]);

  function submit(publish: boolean) {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const action = publish ? createAndPublishFleteAction : createFleteAction;
      const result = await action(payload);

      if ("error" in result && typeof result.error === "string") {
        if ("code" in result && result.code === "BILLING_REQUIRED") {
          setError(
            `${result.error} Ve a Perfil → Métodos de Pago para configurar tu tarjeta.`,
          );
          return;
        }
        setError(result.error);
        return;
      }

      if ("success" in result && result.success && "data" in result) {
        setSuccess(
          publish
            ? `Flete ${result.data.codigo} publicado correctamente.`
            : `Borrador ${result.data.codigo} guardado.`,
        );
        router.push("/Publicaciones");
        router.refresh();
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-[1152px] flex-col gap-10 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-[1.2px] text-[#434750]">
            <span>publicaciones</span>
            <ChevronRight className="size-3" />
            <span className="text-[#001b44]">CREAR NUEVO FLETE</span>
          </nav>
          <h1 className="mt-1 text-4xl font-extrabold tracking-[-0.9px] text-[#001b44]">
            Nuevo Flete
          </h1>
          <p className="mt-1 text-base text-[#434750]">
            Configure los parámetros de ruta y carga para el despacho global.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-[#d8e2ff] px-3 py-1">
          <span className="size-2 rounded-full bg-[#006d43]" />
          <span className="text-xs font-bold text-[#224583]">SISTEMA ACTIVO</span>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <section className="rounded-3xl bg-white p-8 shadow-[0px_20px_20px_rgba(0,27,68,0.06)]">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#002f6c] text-white">
              <MapPin className="size-4" />
            </div>
            <h2 className="text-xl font-bold text-[#001b44]">
              Información de la Ruta
            </h2>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-[0.6px] text-[#434750]">
                    Origen
                  </label>
                  <button
                    type="button"
                    onClick={() => setSelectionMode("origen")}
                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                      selectionMode === "origen"
                        ? "bg-[#001b44] text-white"
                        : "bg-[#f5f3f3] text-[#434750]"
                    }`}
                  >
                    Seleccionar en mapa
                  </button>
                </div>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#434750]" />
                  <input
                    value={origenNombre}
                    onChange={(event) => setOrigenNombre(event.target.value)}
                    placeholder="Ciudad, Terminal o Dirección"
                    className="w-full rounded-lg bg-[#f5f3f3] py-4 pl-12 pr-4 text-sm text-[#001b44] outline-none ring-[#002f6c] focus:ring-2"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-[0.6px] text-[#434750]">
                    Destino
                  </label>
                  <button
                    type="button"
                    onClick={() => setSelectionMode("destino")}
                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                      selectionMode === "destino"
                        ? "bg-[#001b44] text-white"
                        : "bg-[#f5f3f3] text-[#434750]"
                    }`}
                  >
                    Seleccionar en mapa
                  </button>
                </div>
                <div className="relative">
                  <Flag className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#434750]" />
                  <input
                    value={destinoNombre}
                    onChange={(event) => setDestinoNombre(event.target.value)}
                    placeholder="Ciudad, Terminal o Dirección"
                    className="w-full rounded-lg bg-[#f5f3f3] py-4 pl-12 pr-4 text-sm text-[#001b44] outline-none ring-[#002f6c] focus:ring-2"
                  />
                </div>
              </div>
            </div>

            <FleteRouteMap
              origen={origen}
              destino={destino}
              routeGeometry={routeGeometry}
              selectionMode={selectionMode}
              onMapClick={handleMapClick}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.6px] text-[#434750]">
                  Fecha de salida
                </label>
                <input
                  type="date"
                  lang="es-PA"
                  value={fechaSalida}
                  onChange={(event) => setFechaSalida(event.target.value)}
                  className="w-full rounded-lg bg-[#f5f3f3] px-4 py-4 text-sm text-[#001b44] outline-none ring-[#002f6c] focus:ring-2"
                />
                {fechaSalida ? (
                  <p className="mt-1 text-xs text-[#434750]">
                    Formato: {formatPanamaDate(fechaSalida)}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-[#6b7280]">
                    {PANAMA_DATE_PLACEHOLDER}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.6px] text-[#434750]">
                  Entrega estimada
                </label>
                <div className="rounded-lg bg-[#f5f3f3] px-4 py-4 text-sm text-[#6b7280]">
                  {getEntregaEstimadaLabel({
                    routeLoading,
                    fechaSalida,
                    fechaEntrega,
                    canEstimateRoute,
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-[0px_20px_20px_rgba(0,27,68,0.06)]">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#002f6c] text-white">
              <Package className="size-4" />
            </div>
            <h2 className="text-xl font-bold text-[#001b44]">
              Detalles de la Carga
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.6px] text-[#434750]">
                Tipo de carga
              </label>
              <select
                value={idTipoCarga}
                onChange={(event) => setIdTipoCarga(event.target.value)}
                className="w-full rounded-lg bg-[#f5f3f3] px-4 py-4 text-sm text-[#001b44] outline-none ring-[#002f6c] focus:ring-2"
              >
                {cargaTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.6px] text-[#434750]">
                Peso total (kg)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={peso}
                onChange={(event) => setPeso(event.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg bg-[#f5f3f3] px-4 py-4 text-sm text-[#001b44] outline-none ring-[#002f6c] focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.6px] text-[#434750]">
                Total a pagar
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={totalPago}
                onChange={(event) => setTotalPago(event.target.value)}
                placeholder="200.00"
                className="w-full rounded-lg bg-[#f5f3f3] px-4 py-4 text-sm text-[#001b44] outline-none ring-[#002f6c] focus:ring-2"
              />
              {paymentBreakdown ? (
                <div className="mt-3">
                  <PaymentBreakdownPanel
                    breakdown={paymentBreakdown}
                    variant="empresa"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl bg-[#ffdad6] px-4 py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#93000a]" />
              <div>
                <p className="text-sm font-bold text-[#93000a]">
                  ¿Contiene Mercancía Peligrosa?
                </p>
                <p className="text-xs text-[#93000a]">
                  Requiere permisos especiales y escolta técnica.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={cargaPeligrosa}
              onClick={() => setCargaPeligrosa((value) => !value)}
              className={`relative h-7 w-12 rounded-full transition ${
                cargaPeligrosa ? "bg-[#001b44]" : "bg-[#c4c6ce]"
              }`}
            >
              <span
                className={`absolute top-1 size-5 rounded-full bg-white transition ${
                  cargaPeligrosa ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        </section>

        {error ? (
          <div className="rounded-lg border border-[#ffb4ab] bg-[#ffdad6] px-4 py-3 text-sm text-[#93000a]">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-lg border border-[#b6f2c9] bg-[#e8fff0] px-4 py-3 text-sm text-[#006d43]">
            {success}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[rgba(196,198,206,0.2)] bg-white px-6 py-5">
          <div className="flex items-center gap-2 text-sm text-[#434750]">
            <Info className="size-4" />
            Al publicar, este flete será visible para la red logística central.
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              disabled={isPending}
              onClick={() => submit(false)}
              className="text-sm font-semibold text-[#434750] disabled:opacity-50"
            >
              Guardar Borrador
            </button>
            <button
              type="button"
              disabled={isPending || !fechaEntrega}
              onClick={() => submit(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#001b44] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              <Send className="size-4" />
              {isPending ? "Publicando..." : "Publicar Flete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
