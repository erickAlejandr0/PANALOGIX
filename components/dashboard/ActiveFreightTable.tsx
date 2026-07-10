"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import type { DriverRow } from "@/lib/dashboard/driver-table";
import { filterDriversByTab } from "@/lib/dashboard/driver-table";

type ActiveFreightTableProps = {
  drivers: DriverRow[];
  totalDrivers: number;
};

const PAGE_SIZE = 5;

export function ActiveFreightTable({
  drivers,
  totalDrivers,
}: ActiveFreightTableProps) {
  const [tab, setTab] = useState<"conductores" | "en_camino">("conductores");
  const [page, setPage] = useState(1);

  const filteredDrivers = useMemo(
    () => filterDriversByTab(drivers, tab),
    [drivers, tab],
  );

  const totalPages = Math.max(1, Math.ceil(filteredDrivers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageDrivers = filteredDrivers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <section className="overflow-hidden rounded-sm border border-[rgba(196,198,206,0.1)] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(196,198,206,0.1)] bg-[rgba(242,243,249,0.3)] px-6 py-6">
        <h2 className="font-mono text-lg font-bold text-[#121c27]">
          Fletes activos
        </h2>

        <div className="flex items-center gap-4">
          <div className="flex overflow-hidden rounded-sm border border-[rgba(196,198,206,0.3)]">
            <button
              type="button"
              onClick={() => {
                setTab("conductores");
                setPage(1);
              }}
              className={`px-3 py-2 text-xs font-bold ${
                tab === "conductores"
                  ? "bg-[#0b1f3a] text-white"
                  : "bg-white text-[#191c20]"
              }`}
            >
              Conductores
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("en_camino");
                setPage(1);
              }}
              className={`px-3 py-2 text-xs font-medium ${
                tab === "en_camino"
                  ? "bg-[#0b1f3a] text-white"
                  : "bg-white text-[#191c20]"
              }`}
            >
              En camino
            </button>
          </div>

          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 border border-[rgba(196,198,206,0.2)] bg-[#e1e2e8] px-4 py-2 text-xs font-bold text-[#191c20] opacity-70"
          >
            <Filter className="size-3.5" />
            Filter
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-[minmax(220px,1.2fr)_minmax(280px,1.5fr)_minmax(180px,0.8fr)] bg-[rgba(242,243,249,0.5)] px-6 py-4 text-[10px] font-bold uppercase tracking-[1px] text-[#44474d]">
          <span>Transportista</span>
          <span>estado actual</span>
          <span className="text-right">ACCIONES</span>
        </div>

        {pageDrivers.length === 0 ? (
          <div className="px-6 py-10 text-sm text-[#44474d]">
            No hay transportistas con fletes activos en este momento.
          </div>
        ) : (
          pageDrivers.map((driver) => (
            <div
              key={driver.id}
              className="grid grid-cols-[minmax(220px,1.2fr)_minmax(280px,1.5fr)_minmax(180px,0.8fr)] items-center border-t border-[rgba(196,198,206,0.1)] px-6 py-5"
            >
              <div>
                <p className="text-sm font-bold text-[#121c27]">{driver.nombre}</p>
                <p className="text-[10px] text-[#44474d]">placa: {driver.placa}</p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`size-2 rounded-full ${
                    driver.isDelivered ? "bg-[#4ae183]" : "bg-[#00658d]"
                  }`}
                />
                <p
                  className={`text-sm ${
                    driver.isDelivered
                      ? "font-semibold text-[#00250e]"
                      : "text-[#121c27]"
                  }`}
                >
                  {driver.estadoLabel}
                </p>
                <p className="pl-2 text-[10px] tracking-[-0.5px] text-[#44474d]">
                  {driver.secondaryText}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled
                  className="bg-[#0b1f3a]/60 px-4 py-2 text-[10px] font-bold uppercase tracking-[1px] text-white shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                >
                  PRÓXIMAMENTE
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[rgba(196,198,206,0.1)] bg-[rgba(242,243,249,0.2)] px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[-0.5px] text-[#44474d]">
          Mostrando {pageDrivers.length} de {totalDrivers} transportistas
          contratados
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={currentPage === 1}
            className="p-1 text-[#44474d] disabled:opacity-40"
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-4" />
          </button>

          {Array.from({ length: totalPages }, (_, index) => {
            const pageNumber = index + 1;
            return (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                className={`px-1 text-[10px] font-bold ${
                  pageNumber === currentPage
                    ? "text-[#0b1f3a]"
                    : "text-[#44474d]"
                }`}
              >
                {String(pageNumber).padStart(2, "0")}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            disabled={currentPage === totalPages}
            className="p-1 text-[#44474d] disabled:opacity-40"
            aria-label="Página siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
