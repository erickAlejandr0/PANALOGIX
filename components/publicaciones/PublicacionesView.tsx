"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import type {
  PublicacionEstadoFilter,
  PublicacionesPageData,
} from "@/lib/publicaciones/list-types";
import { PublicacionesFilters, PublicacionesTable } from "@/components/publicaciones/PublicacionesTable";
import { PublicacionesInsights } from "@/components/publicaciones/PublicacionesInsights";
import { useEmpresaRealtime } from "@/components/realtime/EmpresaRealtimeProvider";

type PublicacionesViewProps = PublicacionesPageData;

export function PublicacionesView({
  publicaciones,
  publishedCount,
  weeklyPostulaciones,
  weeklyTrendPercent,
  weeklyChart,
}: PublicacionesViewProps) {
  const { publicacionesList, setInitialPublicacionesList } = useEmpresaRealtime();
  const [searchQuery, setSearchQuery] = useState("");
  const [estadoFilter, setEstadoFilter] =
    useState<PublicacionEstadoFilter>("todos");

  useEffect(() => {
    setInitialPublicacionesList(publicaciones);
  }, [publicaciones, setInitialPublicacionesList]);

  const livePublicaciones =
    publicacionesList.length > 0 ? publicacionesList : publicaciones;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 p-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <nav className="text-sm font-semibold uppercase tracking-[0.6px] text-[#001b44]">
            <span>PUBLICACIONES</span>
          </nav>
          <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.9px] text-[#001b44]">
            Publicaciones de Fletes
          </h1>
        </div>

        <div className="flex max-w-sm items-start gap-4">
          <Info className="mt-0.5 size-5 shrink-0 text-[#434750]" />
          <p className="text-xs leading-3 text-[#434750]">
            Las publicaciones que cumplan más de 30 días en borrador serán
            eliminadas automáticamente como parte de un proceso de limpieza del
            sistema
          </p>
        </div>
      </div>

      <PublicacionesFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        estadoFilter={estadoFilter}
        onEstadoFilterChange={setEstadoFilter}
      />

      <PublicacionesTable
        publicaciones={livePublicaciones}
        publishedCount={publishedCount}
        searchQuery={searchQuery}
        estadoFilter={estadoFilter}
      />

      <PublicacionesInsights
        weeklyPostulaciones={weeklyPostulaciones}
        weeklyTrendPercent={weeklyTrendPercent}
        weeklyChart={weeklyChart}
      />
    </div>
  );
}
