"use client";

import { X } from "lucide-react";

import { useEmpresaRealtime } from "@/components/realtime/EmpresaRealtimeProvider";

export function EmpresaTripNotifications() {
  const { tripNotifications, dismissTripNotification } = useEmpresaRealtime();

  if (tripNotifications.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-6 top-24 z-50 flex w-full max-w-sm flex-col gap-3">
      {tripNotifications.map((notification) => (
        <div
          key={notification.id}
          className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-xl"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#007147]">
              {notification.type === "proximity"
                ? "Alerta en ruta"
                : notification.type === "completed"
                  ? "Viaje completado"
                  : notification.type === "archived"
                    ? "Publicación archivada"
                    : "Estado del viaje"}
            </p>
            <p className="mt-1 text-sm font-medium text-[#001a42]">
              {notification.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => dismissTripNotification(notification.id)}
            className="rounded-full p-1 text-[#747781] transition hover:bg-black/5 hover:text-[#001a42]"
            aria-label="Cerrar notificación"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
