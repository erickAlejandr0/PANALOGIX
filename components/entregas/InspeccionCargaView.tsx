"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Ably from "ably";
import {
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { InspeccionChecklist } from "@/components/entregas/InspeccionChecklist";
import { InspeccionProgressCard } from "@/components/entregas/InspeccionProgressCard";
import { InspeccionSidebar } from "@/components/entregas/InspeccionSidebar";
import {
  aceptarLlegadaAction,
  actualizarItemInspeccionAction,
  completarInspeccionAction,
} from "@/actions/negociacionActions";
import { FASE_VIAJE } from "@/lib/fletes/constants";
import { viajeChannel } from "@/lib/events/channels";
import { DOMAIN_EVENT_NAMES } from "@/lib/events/types";
import type { ViajeFaseUpdatedPayload } from "@/lib/events/types";
import type { ViajeInspeccionChecklistUpdatedPayload } from "@/lib/events/types";
import type { InspeccionCargaData } from "@/lib/entregas/types";
import { getEmpresaRealtimeClient } from "@/lib/realtime/ably-client";

type InspeccionCargaViewProps = {
  data: InspeccionCargaData;
  viajeId: number;
  fase: string;
};

function extractError(result: unknown): string | null {
  if (result && typeof result === "object") {
    if ("success" in result) {
      const typed = result as { success: boolean; error?: string };
      return typed.success ? null : typed.error ?? "Error inesperado";
    }
    if ("error" in result) {
      return (result as { error: string }).error;
    }
  }
  return "Error inesperado";
}

export function InspeccionCargaView({
  data,
  viajeId,
  fase: initialFase,
}: InspeccionCargaViewProps) {
  const router = useRouter();
  const [fase, setFase] = useState(initialFase);
  const [checklist, setChecklist] = useState(data.checklist);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isTogglingItem, setIsTogglingItem] = useState<string | null>(null);

  useEffect(() => {
    setChecklist(data.checklist);
  }, [data.checklist]);

  const inspeccionActiva = fase === FASE_VIAJE.INSPECCION;

  const completedCount = useMemo(
    () => checklist.filter((item) => item.completed).length,
    [checklist],
  );

  const allCriticalCompleted = checklist
    .filter((item) => item.critical)
    .every((item) => item.completed);

  const canContinue =
    inspeccionActiva &&
    completedCount === checklist.length &&
    allCriticalCompleted;

  // Cuando la fase cambia desde Postman (endpoint dev) u otro cliente, el
  // server component redirige segun fase; refresh sincroniza la UI sin clicks.
  useEffect(() => {
    const client = getEmpresaRealtimeClient();
    const channel = client.channels.get(viajeChannel(viajeId));

    const onFaseUpdated = (message: Ably.Message) => {
      const payload = message.data as ViajeFaseUpdatedPayload;
      if (payload.viajeId !== viajeId) return;
      router.refresh();
    };

    channel.subscribe(DOMAIN_EVENT_NAMES.VIAJE_FASE_UPDATED, onFaseUpdated);

    return () => {
      channel.unsubscribe(
        DOMAIN_EVENT_NAMES.VIAJE_FASE_UPDATED,
        onFaseUpdated,
      );
    };
  }, [router, viajeId]);

  useEffect(() => {
    const client = getEmpresaRealtimeClient();
    const channel = client.channels.get(viajeChannel(viajeId));

    const onChecklistUpdated = (message: Ably.Message) => {
      const payload = message.data as ViajeInspeccionChecklistUpdatedPayload;
      if (payload.viajeId !== viajeId) return;

      setChecklist((current) =>
        current.map((item) => {
          const remote = payload.items.find((entry) => entry.id === item.id);
          return remote ? { ...item, completed: remote.completed } : item;
        }),
      );
    };

    channel.subscribe(
      DOMAIN_EVENT_NAMES.VIAJE_INSPECCION_CHECKLIST_UPDATED,
      onChecklistUpdated,
    );

    return () => {
      channel.unsubscribe(
        DOMAIN_EVENT_NAMES.VIAJE_INSPECCION_CHECKLIST_UPDATED,
        onChecklistUpdated,
      );
    };
  }, [viajeId]);

  function handleToggleItem(id: string) {
    if (!inspeccionActiva || isTogglingItem) return;

    const previous = checklist;
    const target = previous.find((item) => item.id === id);
    if (!target) return;

    const nextCompleted = !target.completed;
    const optimistic = previous.map((item) =>
      item.id === id ? { ...item, completed: nextCompleted } : item,
    );

    setChecklist(optimistic);
    setError(null);
    setIsTogglingItem(id);

    startTransition(async () => {
      const result = await actualizarItemInspeccionAction(
        viajeId,
        id,
        nextCompleted,
      );
      setIsTogglingItem(null);

      const message = extractError(result);
      if (message) {
        setChecklist(previous);
        setError(message);
        return;
      }

      if (
        result &&
        typeof result === "object" &&
        "success" in result &&
        result.success &&
        "data" in result &&
        result.data &&
        typeof result.data === "object" &&
        "checklist" in result.data
      ) {
        setChecklist(result.data.checklist as typeof previous);
      }
    });
  }

  function handleAceptarLlegada() {
    setError(null);
    startTransition(async () => {
      const result = await aceptarLlegadaAction(viajeId);
      const message = extractError(result);
      if (message) {
        setError(message);
        return;
      }
      // PASO 2 completado: se habilita la inspeccion de carga.
      setFase(FASE_VIAJE.INSPECCION);
    });
  }

  function handleCompletarInspeccion() {
    setError(null);
    startTransition(async () => {
      const result = await completarInspeccionAction(viajeId);
      const message = extractError(result);
      if (message) {
        setError(message);
        return;
      }
      // PASO 3 completado: el codigo se genera en el servidor y se muestra
      // en la pantalla de verificacion.
      router.push(`/verificacion/${viajeId}`);
    });
  }

  return (
    <div className="min-h-full bg-[#f3f4f6]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 p-8">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-sm"
            >
              <Link
                href="/entregas"
                className="flex items-center gap-2 text-[#6b7280] transition hover:text-[#0b1f3a]"
              >
                <ClipboardList className="size-4" />
                Inspecciones
              </Link>
              <span className="text-[#9ca3af]">/</span>
              <span className="font-bold text-[#0b1f3a]">#{data.codigo}</span>
            </nav>

            <div className="relative flex flex-wrap items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  disabled
                  className="rounded-lg border border-[#e5e7eb] bg-white px-[17px] py-2.5 text-sm text-[#111827] opacity-70"
                >
                  Reportar incidente
                </button>
                <span className="absolute -bottom-5 left-0 text-xs text-[#75777e]">
                  Próximamente
                </span>
              </div>
              {inspeccionActiva ? (
                <button
                  type="button"
                  onClick={handleCompletarInspeccion}
                  disabled={!canContinue || isPending}
                  className="flex items-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#002f6c] disabled:cursor-not-allowed disabled:bg-[#d1d5db]"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Continuar a verificación
                  <ChevronRight className="size-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAceptarLlegada}
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#002f6c] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Aceptar llegada
                  <ChevronRight className="size-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.6px] text-[#4285f4]">
              <span>Control de calidad</span>
              <span className="text-[#4285f4]/40">●</span>
              <span>
                Paso {data.pasoActual} de {data.pasosTotal}
              </span>
            </div>
            <h1 className="text-[30px] font-bold leading-9 text-[#0b1f3a]">
              Inspección de Carga
            </h1>
            <p className="max-w-2xl text-sm leading-5 text-[#6b7280]">
              Revise cada recomendación antes de autorizar el despacho del
              flete. Los puntos marcados como críticos no pueden omitirse.
            </p>
          </div>

          {!inspeccionActiva ? (
            <div className="flex items-center gap-2 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1d4ed8]">
              <CircleAlert className="size-4 shrink-0" />
              Acepta la llegada del transportista para iniciar la inspección de
              carga.
            </div>
          ) : null}

          {error ? (
            <div className="flex items-center gap-2 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
              <CircleAlert className="size-4 shrink-0" />
              {error}
            </div>
          ) : null}
        </header>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="flex flex-col gap-6 xl:col-span-2">
            <InspeccionProgressCard
              completedCount={completedCount}
              totalCount={checklist.length}
              estado={data.estado}
            />
            <InspeccionChecklist
              items={checklist}
              onToggleItem={handleToggleItem}
            />
          </div>

          <InspeccionSidebar
            flete={data.flete}
            transportista={data.transportista}
          />
        </div>
      </div>
    </div>
  );
}
