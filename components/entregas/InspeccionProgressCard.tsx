import type { InspeccionCargaData } from "@/lib/entregas/types";

type InspeccionProgressCardProps = {
  completedCount: number;
  totalCount: number;
  estado: InspeccionCargaData["estado"];
};

const ESTADO_LABELS: Record<InspeccionCargaData["estado"], string> = {
  en_revision: "En revisión",
  completada: "Completada",
  pendiente: "Pendiente",
};

export function InspeccionProgressCard({
  completedCount,
  totalCount,
  estado,
}: InspeccionProgressCardProps) {
  const percent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <section className="rounded-lg border border-[#e5e7eb] bg-white p-[25px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#6b7280]">
            Progreso de inspección
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="bg-gradient-to-r from-[#0b1f3a] to-[#1e56a0] bg-clip-text text-[30px] font-bold leading-9 text-transparent">
              {completedCount}
            </span>
            <span className="text-lg text-[#9ca3af]">/ {totalCount}</span>
            <span className="bg-gradient-to-r from-[#0b1f3a] to-[#2385bf] bg-clip-text text-sm font-bold text-transparent">
              {percent}%
            </span>
          </div>
        </div>

        <span className="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-bold uppercase tracking-[0.6px] text-[#6b7280]">
          {ESTADO_LABELS[estado]}
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#0b1f3a] to-[#2385bf] transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </section>
  );
}
