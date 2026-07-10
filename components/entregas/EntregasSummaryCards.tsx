import { CheckCircle2, Clock, Package, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { EntregasPageData } from "@/lib/entregas/types";

type SummaryCard = {
  key: string;
  label: string;
  value: number;
  icon: LucideIcon;
  iconWrapClassName: string;
  iconClassName: string;
};

type EntregasSummaryCardsProps = {
  totalHoy: EntregasPageData["totalHoy"];
  counts: EntregasPageData["counts"];
};

export function EntregasSummaryCards({
  totalHoy,
  counts,
}: EntregasSummaryCardsProps) {
  const cards: SummaryCard[] = [
    {
      key: "total",
      label: "Total hoy",
      value: totalHoy,
      icon: Package,
      iconWrapClassName: "bg-[#f3f4f6]",
      iconClassName: "text-[#6b7280]",
    },
    {
      key: "en_camino",
      label: "En Camino",
      value: counts.en_camino,
      icon: Clock,
      iconWrapClassName: "bg-[#eff6ff]",
      iconClassName: "text-[#3b82f6]",
    },
    {
      key: "en_destino",
      label: "En destino",
      value: counts.en_destino,
      icon: CheckCircle2,
      iconWrapClassName: "bg-[#f0fdf4]",
      iconClassName: "text-[#22c55e]",
    },
    {
      key: "completada",
      label: "Completadas",
      value: counts.completada,
      icon: CheckCircle2,
      iconWrapClassName: "bg-[#f0fdf4]",
      iconClassName: "text-[#22c55e]",
    },
    {
      key: "cancelada",
      label: "Canceladas",
      value: counts.cancelada,
      icon: XCircle,
      iconWrapClassName: "bg-[#fef2f2]",
      iconClassName: "text-[#ef4444]",
    },
    {
      key: "por_recoger",
      label: "Por recoger",
      value: counts.por_recoger,
      icon: Clock,
      iconWrapClassName: "bg-[#eff6ff]",
      iconClassName: "text-[#3b82f6]",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.key}
            className="flex flex-col justify-between rounded-lg border border-[#f3f4f6] bg-white p-[21px] shadow-[0px_1px_1.5px_rgba(0,0,0,0.1),0px_1px_1px_rgba(0,0,0,0.06)]"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm text-[#6b7280]">{card.label}</span>
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${card.iconWrapClassName}`}
              >
                <Icon className={`size-4 ${card.iconClassName}`} />
              </span>
            </div>
            <p className="mt-4 text-[30px] font-bold leading-9 text-[#0b1f3a]">
              {card.value}
            </p>
          </article>
        );
      })}
    </section>
  );
}
