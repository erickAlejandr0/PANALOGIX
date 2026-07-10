"use client";

import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { EntregaListItemRow } from "@/components/entregas/EntregaListItem";
import { EntregasSummaryCards } from "@/components/entregas/EntregasSummaryCards";
import { EntregasTabs } from "@/components/entregas/EntregasTabs";
import type {
  EntregasPageData,
  EntregaTabFilter,
} from "@/lib/entregas/types";

type EntregasViewProps = EntregasPageData;

export function EntregasView({ items, totalHoy, counts }: EntregasViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<EntregaTabFilter>("todas");

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const matchesTab = activeTab === "todas" || item.estado === activeTab;
      if (!matchesTab) return false;
      if (!query) return true;

      return (
        item.codigo.toLowerCase().includes(query) ||
        item.origen.toLowerCase().includes(query) ||
        item.destino.toLowerCase().includes(query) ||
        item.empresa.toLowerCase().includes(query) ||
        item.receptor.toLowerCase().includes(query)
      );
    });
  }, [items, searchQuery, activeTab]);

  return (
    <div className="min-h-full bg-[#f8f9ff]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#04a5d8]">
              Notificaciones · En vivo
            </p>
            <h1 className="mt-1 text-[30px] font-bold leading-9 text-[#0b1f3a]">
              Entregas
            </h1>
            <p className="mt-1 text-sm text-[#6b7280]">
              entregas disponibles en el sistema
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar ID, receptor, destino..."
                className="w-72 rounded-full border border-[#e5e7eb] bg-white py-2.5 pl-11 pr-4 text-sm text-[#0b1f3a] outline-none ring-[#0b1f3a] placeholder:text-[#9ca3af] focus:ring-2"
              />
            </div>
            <button
              type="button"
              disabled
              className="flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm text-[#0b1f3a] opacity-70 shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
            >
              <Filter className="size-3.5" />
              Filtros
            </button>
          </div>
        </header>

        <EntregasSummaryCards totalHoy={totalHoy} counts={counts} />

        <section className="overflow-hidden rounded-lg border border-[#f3f4f6] bg-white shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)]">
          <EntregasTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {filtered.length === 0 ? (
            <p className="px-5 py-16 text-center text-sm text-[#6b7280]">
              No hay entregas que coincidan con tu búsqueda.
            </p>
          ) : (
            <div className="flex flex-col">
              {filtered.map((item) => (
                <EntregaListItemRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
