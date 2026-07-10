"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
} from "lucide-react";
import type {
  PublicacionEstadoFilter,
  PublicacionListItem,
} from "@/lib/publicaciones/list-types";
import {
  formatPesoLabel,
  formatPostulacionesLabel,
  formatRelativePublicationTime,
  formatRouteLabel,
  getApplicantInitials,
} from "@/lib/publicaciones/format";
import { ESTADO_PUBLICACION } from "@/lib/fletes/constants";

type PublicacionesTableProps = {
  publicaciones: PublicacionListItem[];
  publishedCount: number;
  searchQuery: string;
  estadoFilter: PublicacionEstadoFilter;
};

const PAGE_SIZE = 4;

const AVATAR_STYLES = [
  { bg: "bg-[#d8e2ff]", text: "text-[#001a42]" },
  { bg: "bg-[#78fbb6]", text: "text-[#003822]" },
  { bg: "bg-[#ffdfa0]", text: "text-[#261a00]" },
  { bg: "bg-[#aec6ff]", text: "text-[#001a42]" },
];

function StatusBadge({ estado }: { estado: PublicacionListItem["estado"] }) {
  const isPublished = estado === ESTADO_PUBLICACION.PUBLICADO;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold ${
        isPublished
          ? "bg-[#75f8b3] text-[#007147]"
          : "bg-[#e4e2e2] text-[#434750]"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          isPublished ? "bg-[#006d43]" : "bg-[#747781]"
        }`}
      />
      {isPublished ? "Publicado" : "Borrador"}
    </span>
  );
}

function ApplicantAvatars({
  postulantes,
}: {
  postulantes: PublicacionListItem["postulantes"];
}) {
  return (
    <div className="flex items-center">
      {postulantes.map((postulante, index) => {
        const style = AVATAR_STYLES[index % AVATAR_STYLES.length];
        return (
          <div
            key={`${postulante.nombre}-${postulante.apellido}-${index}`}
            className={`-ml-2 first:ml-0 flex size-6 items-center justify-center rounded-xl border-2 border-white text-[10px] font-bold ${style.bg} ${style.text}`}
          >
            {getApplicantInitials(postulante.nombre, postulante.apellido)}
          </div>
        );
      })}
    </div>
  );
}

export function PublicacionesTable({
  publicaciones,
  publishedCount,
  searchQuery,
  estadoFilter,
}: PublicacionesTableProps) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, estadoFilter]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return publicaciones.filter((item) => {
      const matchesEstado =
        estadoFilter === "todos" || item.estado === estadoFilter;

      if (!matchesEstado) return false;
      if (!query) return true;

      return (
        item.origenNombre.toLowerCase().includes(query) ||
        item.destinoNombre.toLowerCase().includes(query) ||
        item.codigo.toLowerCase().includes(query)
      );
    });
  }, [publicaciones, searchQuery, estadoFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
    .slice(0, 5);

  return (
    <section className="overflow-hidden rounded-[32px] bg-white shadow-[0px_20px_40px_0px_rgba(0,27,68,0.06)]">
      <div className="overflow-x-auto">
        <table className="min-w-[960px] w-full border-collapse">
          <thead>
            <tr className="bg-[#f5f3f3] text-left">
              {["ROUTE", "DETALLES", "POSTULACIONES", "ESTADO", "ACCIONES"].map(
                (label, index) => (
                  <th
                    key={label}
                    className={`px-8 py-5 text-xs font-bold uppercase tracking-[1.2px] text-[#434750] ${
                      index === 4 ? "text-right" : ""
                    }`}
                  >
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-8 py-16 text-center text-sm text-[#434750]"
                >
                  No hay publicaciones que coincidan con tu búsqueda.
                </td>
              </tr>
            ) : (
              pageItems.map((item) => {
                const route = formatRouteLabel(
                  item.origenNombre,
                  item.destinoNombre,
                );
                const postulacionesLabel = formatPostulacionesLabel(
                  item.postulacionesCount,
                );
                const relativeTime = formatRelativePublicationTime(
                  item.estado === ESTADO_PUBLICACION.PUBLICADO
                    ? item.updatedAt
                    : item.createdAt,
                  item.estado,
                );

                return (
                  <tr
                    key={item.id}
                    className="border-t border-[rgba(196,198,210,0.1)]"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 font-bold text-[#001b44]">
                        <span>{route.origen}</span>
                        <ArrowRight className="size-3 shrink-0 text-[#434750]" />
                        <span>{route.destino}</span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-[#434750]">
                        ID: {item.codigo} • {relativeTime}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-semibold text-[#1b1c1c]">
                        {item.tipoCarga}
                      </p>
                      <p className="mt-1 text-xs text-[#434750]">
                        {formatPesoLabel(item.peso)}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      {postulacionesLabel ? (
                        <div className="flex items-center gap-2">
                          {item.postulantes.length > 0 ? (
                            <ApplicantAvatars postulantes={item.postulantes} />
                          ) : null}
                          <span className="font-bold text-[#001b44]">
                            {postulacionesLabel}
                          </span>
                        </div>
                      ) : (
                        <span className="text-base font-medium italic text-[#434750]">
                          Sin postulaciones
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <StatusBadge estado={item.estado} />
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Link
                        href={`/Publicaciones/${item.id}/administrar`}
                        className="inline-flex rounded bg-[#001b44] px-4 py-2 text-base font-bold text-white transition hover:bg-[#002f6c]"
                      >
                        Administrar
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[rgba(196,198,210,0.1)] bg-[rgba(245,243,243,0.3)] px-6 py-6">
        <p className="text-sm font-medium text-[#434750]">
          {estadoFilter === "borrador"
            ? `Mostrando ${pageItems.length} de ${filtered.length} borradores`
            : `Mostrando ${pageItems.length} de ${publishedCount} publicaciones activas`}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={currentPage === 1}
            className="flex size-10 items-center justify-center rounded bg-white text-[#434750] shadow-sm disabled:opacity-40"
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-4" />
          </button>

          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
              className={`flex size-10 items-center justify-center rounded text-base ${
                pageNumber === currentPage
                  ? "bg-[#001b44] font-bold text-white shadow-[0px_4px_6px_-1px_rgba(0,27,68,0.2)]"
                  : "bg-white text-[#434750]"
              }`}
            >
              {pageNumber}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={currentPage === totalPages}
            className="flex size-10 items-center justify-center rounded bg-white text-[#434750] shadow-sm disabled:opacity-40"
            aria-label="Página siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

export function PublicacionesFilters({
  searchQuery,
  onSearchChange,
  estadoFilter,
  onEstadoFilterChange,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  estadoFilter: PublicacionEstadoFilter;
  onEstadoFilterChange: (value: PublicacionEstadoFilter) => void;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-[#f5f3f3] px-6 pb-6 pt-8 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#434750]" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por origen o destino..."
          className="w-full rounded-lg bg-white py-3.5 pl-12 pr-4 text-base font-medium text-[#001b44] outline-none ring-[#002f6c] placeholder:text-[#c4c6d2] focus:ring-2"
        />
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <select
          value={estadoFilter}
          onChange={(event) =>
            onEstadoFilterChange(event.target.value as PublicacionEstadoFilter)
          }
          className="rounded-lg bg-white py-3 pl-6 pr-10 text-base font-medium text-[#1b1c1c] outline-none ring-[#002f6c] focus:ring-2"
        >
          <option value="todos">Todos los Estados</option>
          <option value="publicado">Publicado</option>
          <option value="borrador">Borrador</option>
        </select>

        <button
          type="button"
          disabled
          aria-label="Filtros avanzados"
          className="flex items-center justify-center rounded-lg bg-white p-3 text-[#434750] opacity-70"
        >
          <Filter className="size-4" />
        </button>
      </div>
    </section>
  );
}
