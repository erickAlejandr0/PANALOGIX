"use client";

import Image from "next/image";
import { Bell, Menu, Settings } from "lucide-react";

type TopNavBarProps = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
};

export function TopNavBar({ sidebarOpen, onToggleSidebar }: TopNavBarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-20 items-center justify-between border-b border-[rgba(196,198,210,0.15)] bg-[rgba(251,249,248,0.8)] px-8 shadow-[0px_20px_40px_0px_rgba(0,27,68,0.06)] backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Ocultar menú" : "Mostrar menú"}
          aria-expanded={sidebarOpen}
          className="rounded-xl p-2 text-[#0b1f3a] transition hover:bg-[rgba(0,27,68,0.06)]"
        >
          <Menu className="size-5" />
        </button>

        <div className="flex items-center gap-2">
          <Image
            src="/auth/panalogix-logo.png"
            alt="Panalogix"
            width={33}
            height={26}
            className="h-[26px] w-auto"
          />
          <div>
            <p className="font-mono text-2xl font-bold tracking-[-0.6px] text-[#000615]">
              Panalogix
            </p>
            <p className="text-[9px] font-semibold tracking-[0.24px] text-[#44474d]">
              Conectamos carga, Movemos Panamá
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button
          type="button"
          aria-label="Notificaciones"
          className="rounded-xl p-2 text-[#44474d] transition hover:bg-[rgba(0,27,68,0.06)]"
        >
          <Bell className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Configuración"
          className="rounded-xl p-2 text-[#44474d] transition hover:bg-[rgba(0,27,68,0.06)]"
        >
          <Settings className="size-5" />
        </button>
        <div className="size-10 overflow-hidden rounded-xl bg-[#e4e2e2]">
          <div className="flex size-full items-center justify-center bg-[#00658d] text-sm font-bold text-white">
            P
          </div>
        </div>
      </div>
    </header>
  );
}
