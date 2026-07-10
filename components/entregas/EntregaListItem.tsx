import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Clock,
  MapPin,
  Package,
  Truck,
  User,
} from "lucide-react";
import { formatPesoLabel } from "@/lib/publicaciones/format";
import type { EntregaEstado, EntregaListItem } from "@/lib/entregas/types";

const ESTADO_BADGE: Record<
  EntregaEstado,
  { label: string; className: string; dotClassName: string }
> = {
  por_recoger: {
    label: "Por Recoger",
    className: "border-[#75777e] bg-[#eff6ff] text-black",
    dotClassName: "bg-[#6b7280]",
  },
  en_camino: {
    label: "En camino",
    className: "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
    dotClassName: "bg-[#3b82f6]",
  },
  en_destino: {
    label: "En destino",
    className: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
    dotClassName: "bg-[#22c55e]",
  },
  completada: {
    label: "Entrega completada",
    className: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
    dotClassName: "bg-[#22c55e]",
  },
  cancelada: {
    label: "Cancelada",
    className: "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]",
    dotClassName: "bg-[#ef4444]",
  },
};

function EstadoBadge({ estado }: { estado: EntregaEstado }) {
  const badge = ESTADO_BADGE[estado];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${badge.className}`}
    >
      <span className={`size-1.5 rounded-full ${badge.dotClassName}`} />
      {badge.label}
    </span>
  );
}

type EntregaListItemRowProps = {
  item: EntregaListItem;
};

export function EntregaListItemRow({ item }: EntregaListItemRowProps) {
  const isEnDestino = item.estado === "en_destino";
  const isCompletada = item.estado === "completada";
  const isCancelada = item.estado === "cancelada";
  const detailHref = isCompletada
    ? `/entrega-completada/${item.viajeId}`
    : `/entregas/${item.viajeId}`;

  return (
    <article
      className={`relative flex items-center gap-4 border-b border-[#f3f4f6] px-5 py-5 last:border-b-0 ${
        isCancelada ? "bg-[rgba(254,242,242,0.3)]" : ""
      }`}
    >
      {item.nuevo ? (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-[#3b82f6]"
        />
      ) : null}

      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#f3f4f6]">
        <Truck className="size-5 text-[#6b7280]" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-[#0b1f3a]">
            {item.codigo}
          </span>
          <EstadoBadge estado={item.estado} />
          {item.nuevo ? (
            <span className="rounded-full bg-[#0b1f3a] px-2 py-0.5 text-xs font-bold text-white">
              NUEVO
            </span>
          ) : null}
        </div>

        <div className="mt-1 flex items-center gap-2 text-sm">
          <span className="text-[#0b1f3a]">{item.origen}</span>
          <ArrowRight className="size-3.5 shrink-0 text-[#9ca3af]" />
          <span className="font-bold text-[#0b1f3a]">{item.destino}</span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-[#6b7280]">
          <span className="flex items-center gap-1">
            <MapPin className="size-3 shrink-0" />
            {item.empresa}
          </span>
          <span className="flex items-center gap-1">
            <User className="size-3 shrink-0" />
            {item.receptor}
          </span>
          <span className="flex items-center gap-1">
            <Package className="size-3 shrink-0" />
            {formatPesoLabel(item.pesoKg)}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        {isEnDestino ? (
          <>
            {item.llegadaLabel ? (
              <span className="flex items-center gap-1 text-sm text-[#6b7280]">
                <Clock className="size-3.5 shrink-0" />
                {item.llegadaLabel}
              </span>
            ) : null}
            <Link
              href={detailHref}
              className="flex items-center gap-2 rounded-full bg-[#0b1f3a] px-4 py-1.5 text-xs font-medium text-white shadow-[0px_1px_1px_rgba(0,0,0,0.05)] transition hover:bg-[#002f6c]"
            >
              ir a Inspección
              <ChevronRight className="size-3.5" />
            </Link>
          </>
        ) : isCompletada ? (
          <Link
            href={detailHref}
            className="flex items-center gap-2 rounded-full bg-[#0b1f3a] px-4 py-1.5 text-xs font-medium text-white shadow-[0px_1px_1px_rgba(0,0,0,0.05)] transition hover:bg-[#002f6c]"
          >
            Ver detalle
            <ChevronRight className="size-3.5" />
          </Link>
        ) : (
          <Link
            href={detailHref}
            className="text-xs text-[#0e76fd] transition hover:underline"
          >
            Ver detalle
          </Link>
        )}
      </div>

      <ChevronRight className="size-5 shrink-0 text-[#9ca3af]" />
    </article>
  );
}
