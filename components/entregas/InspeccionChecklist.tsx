"use client";

import {
  Calendar,
  Camera,
  CheckCircle2,
  Circle,
  Shield,
  User,
} from "lucide-react";
import type { InspeccionChecklistItem } from "@/lib/entregas/types";

const ICONS = {
  shield: Shield,
  user: User,
  camera: Camera,
  calendar: Calendar,
} as const;

function CriticalBadge() {
  return (
    <span className="rounded bg-[#fee2e2] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.5px] text-[#ef4444]">
      Crítico
    </span>
  );
}

function ChecklistIconBox({
  item,
}: {
  item: InspeccionChecklistItem;
}) {
  const Icon = ICONS[item.icon];

  if (item.completed) {
    return (
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#22c55e] bg-white">
        <Icon className="size-5 text-[#22c55e]" strokeWidth={2} />
      </div>
    );
  }

  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#e5e7eb] bg-[#f9fafb]">
      <Icon className="size-5 text-[#6b7280]" strokeWidth={2} />
    </div>
  );
}

function ChecklistItem({
  item,
  onToggle,
}: {
  item: InspeccionChecklistItem;
  onToggle: () => void;
}) {
  return (
    <article
      className={`flex gap-4 rounded-lg p-[21px] transition-colors ${
        item.completed
          ? "border-2 border-[#4ae183] bg-[rgba(107,254,156,0.07)]"
          : "border border-[#e5e7eb] bg-white"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="mt-1 shrink-0"
        aria-label={
          item.completed
            ? `Marcar "${item.title}" como pendiente`
            : `Marcar "${item.title}" como completado`
        }
      >
        {item.completed ? (
          <CheckCircle2 className="size-6 text-[#22c55e]" strokeWidth={2.5} />
        ) : (
          <Circle className="size-6 text-[#d1d5db]" strokeWidth={2} />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-base font-bold text-[#0b1f3a]">{item.title}</h3>
          {item.critical ? <CriticalBadge /> : null}
        </div>
        <p className="mt-1 text-xs text-[#6b7280]">{item.meta}</p>
        <p className="mt-1 text-sm text-[#111827]">{item.instruction}</p>
      </div>

      <ChecklistIconBox item={item} />
    </article>
  );
}

type InspeccionChecklistProps = {
  items: InspeccionChecklistItem[];
  onToggleItem: (id: string) => void;
};

export function InspeccionChecklist({
  items,
  onToggleItem,
}: InspeccionChecklistProps) {
  const criticalCount = items.filter((item) => item.critical).length;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2 pt-2">
        <h2 className="text-sm font-bold uppercase tracking-[0.7px] text-[#0b1f3a]">
          Recomendaciones de revisión
        </h2>
        <span className="text-xs text-[#6b7280]">
          {criticalCount} crítico{criticalCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <ChecklistItem
            key={item.id}
            item={item}
            onToggle={() => onToggleItem(item.id)}
          />
        ))}
      </div>
    </section>
  );
}
