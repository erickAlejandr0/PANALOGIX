"use client";

import { Activity } from "lucide-react";

type PublicacionesInsightsProps = {
  weeklyPostulaciones: number;
  weeklyTrendPercent: number | null;
  weeklyChart: number[];
};

export function PublicacionesInsights({
  weeklyPostulaciones,
  weeklyTrendPercent,
  weeklyChart,
}: PublicacionesInsightsProps) {
  const trendLabel =
    weeklyTrendPercent === null
      ? "Sin datos de la semana anterior"
      : weeklyTrendPercent >= 0
        ? `+${weeklyTrendPercent}% vs semana anterior`
        : `${weeklyTrendPercent}% vs semana anterior`;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="relative overflow-hidden rounded-xl bg-[#0b1f3a] p-6 lg:col-span-4">
        <div className="pointer-events-none absolute -bottom-12 -right-12 size-48 rounded-full bg-[rgba(0,101,141,0.2)] blur-[32px]" />
        <div className="relative">
          <h3 className="font-mono text-base text-white">Potencia tu Alcance</h3>
          <p className="mt-2 pb-4 text-base leading-6 text-[#7587a7]">
            Ajusta los pagos acorde a las distancias y tipos de carga para atraer
            más conductores.
          </p>
          <button
            type="button"
            disabled
            className="rounded-lg bg-[#00aeef] px-6 py-2 text-base font-bold text-white opacity-70"
          >
            Ver Consejos
          </button>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-6 rounded-xl bg-white p-6 sm:flex-row sm:items-center lg:col-span-8">
        <div className="flex items-center gap-6">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#d8e2ff] text-[#001b44]">
            <Activity className="size-6" />
          </div>
          <div>
            <p className="text-base text-[#121c27]">Actividad Semanal</p>
            <p className="font-mono text-base text-[#121c27]">
              {weeklyPostulaciones.toLocaleString("es-PA")} Postulaciones
            </p>
            <p
              className={`text-xs font-bold ${
                weeklyTrendPercent !== null && weeklyTrendPercent >= 0
                  ? "text-[#2ecc71]"
                  : "text-[#434750]"
              }`}
            >
              {trendLabel}
            </p>
          </div>
        </div>

        <div className="flex items-end gap-2">
          {weeklyChart.map((height, index) => (
            <div
              key={index}
              className="relative h-16 w-2 overflow-hidden rounded-full bg-[#e5efff]"
            >
              <div
                className="absolute inset-x-0 bottom-0 bg-[#00aeef]"
                style={{ height: `${Math.max(height, 8)}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
