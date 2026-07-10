"use client";

import type { EntregaTabFilter } from "@/lib/entregas/types";

const TABS: { value: EntregaTabFilter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "en_camino", label: "En Camino" },
  { value: "en_destino", label: "En destino" },
  { value: "completada", label: "Completadas" },
  { value: "cancelada", label: "Canceladas" },
  { value: "por_recoger", label: "Pendiente de recoger" },
];

type EntregasTabsProps = {
  activeTab: EntregaTabFilter;
  onTabChange: (tab: EntregaTabFilter) => void;
};

export function EntregasTabs({ activeTab, onTabChange }: EntregasTabsProps) {
  return (
    <div className="flex overflow-x-auto border-b border-[#e5e7eb]">
      {TABS.map((tab) => {
        const active = tab.value === activeTab;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onTabChange(tab.value)}
            className={`flex-1 whitespace-nowrap border-b-2 px-4 py-4 text-center text-sm transition ${
              active
                ? "rounded-t-lg border-[#0b1f3a] bg-[#0b1f3a] font-medium text-white"
                : "border-transparent text-[#6b7280] hover:text-[#0b1f3a]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
