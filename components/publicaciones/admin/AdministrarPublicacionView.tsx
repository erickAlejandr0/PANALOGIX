"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  MapPin,
  Pencil,
} from "lucide-react";

import { acceptPostulacionAction, publishPublicacionAction } from "@/actions/fleteActions";
import { useEmpresaRealtime } from "@/components/realtime/EmpresaRealtimeProvider";
import { ESTADO_PUBLICACION } from "@/lib/fletes/constants";
import {
  formatCurrencyUsd,
  formatFechaSalida,
  formatPesoLabel,
  formatRelativeTimeShort,
  getApplicantInitials,
} from "@/lib/publicaciones/format";
import type {
  PostulacionAdminItem,
  PostulacionTabFilter,
  PublicacionAdminDetail,
} from "@/lib/publicaciones/admin-types";

type AdministrarPublicacionViewProps = {
  initialDetail: PublicacionAdminDetail;
};

const TAB_LABELS: Record<PostulacionTabFilter, string> = {
  todas: "Todas",
  pendiente: "Pendientes",
  aceptada: "Aceptadas",
  rechazada: "Rechazadas",
};

function countByEstado(
  postulaciones: PostulacionAdminItem[],
  estado: PostulacionAdminItem["estado"],
) {
  return postulaciones.filter((item) => item.estado === estado).length;
}

function PostulacionCard({
  postulacion,
  expanded,
  onToggle,
  onAccept,
  accepting,
}: {
  postulacion: PostulacionAdminItem;
  expanded: boolean;
  onToggle: () => void;
  onAccept: () => void;
  accepting: boolean;
}) {
  const fullName = `${postulacion.nombre} ${postulacion.apellido}`.trim();
  const vehicleLabel = [postulacion.marca, postulacion.modelo]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={`overflow-hidden rounded-lg border shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] ${
        expanded
          ? "border-[rgba(11,31,58,0.08)] bg-white"
          : "border-[rgba(196,198,210,0.2)] bg-white"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between p-4 text-left ${
          expanded ? "bg-[rgba(45,188,254,0.05)]" : "bg-white"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-full border border-[#c4c6ce] bg-[#d9e3f3] text-sm font-bold text-[#0b1f3a]">
            {getApplicantInitials(postulacion.nombre, postulacion.apellido)}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold tracking-[0.14px] text-[#0b1f3a]">
                {fullName}
              </span>
              {postulacion.estado === "aceptada" ? (
                <BadgeCheck className="size-3.5 text-[#2dbcfe]" />
              ) : null}
            </div>
            <p className="text-xs text-[#44474d]">
              {vehicleLabel || "Vehículo registrado"} •{" "}
              {formatRelativeTimeShort(postulacion.createdAt)}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="size-4 text-[#44474d]" />
        ) : (
          <ChevronDown className="size-4 text-[#44474d]" />
        )}
      </button>

      {expanded ? (
        <div className="space-y-4 border-t border-[rgba(196,198,210,0.2)] p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-[#f8f9ff] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[1px] text-[#747781]">
                Placa
              </p>
              <p className="mt-1 text-sm font-semibold text-[#0b1f3a]">
                {postulacion.placa}
              </p>
            </div>
            <div className="rounded-lg bg-[#f8f9ff] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[1px] text-[#747781]">
                Modelo
              </p>
              <p className="mt-1 text-sm font-semibold text-[#0b1f3a]">
                {postulacion.modelo || "—"}
              </p>
            </div>
            <div className="rounded-lg bg-[#f8f9ff] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[1px] text-[#747781]">
                Marca
              </p>
              <p className="mt-1 text-sm font-semibold text-[#0b1f3a]">
                {postulacion.marca || "—"}
              </p>
            </div>
            <div className="rounded-lg bg-[#f8f9ff] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[1px] text-[#747781]">
                Estado
              </p>
              <p className="mt-1 text-sm font-semibold capitalize text-[#0b1f3a]">
                {postulacion.estado}
              </p>
            </div>
          </div>

          {postulacion.estado === "pendiente" ? (
            <button
              type="button"
              onClick={onAccept}
              disabled={accepting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#75f8b3] py-3 text-sm font-bold text-[#003822] disabled:opacity-60"
            >
              <Check className="size-4" />
              {accepting ? "Procesando..." : "Aceptar Postulación"}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function AdministrarPublicacionView({
  initialDetail,
}: AdministrarPublicacionViewProps) {
  const { subscribePostulacionEvents } = useEmpresaRealtime();
  const [detail, setDetail] = useState(initialDetail);
  const [tab, setTab] = useState<PostulacionTabFilter>("todas");
  const [expandedId, setExpandedId] = useState<number | null>(
    initialDetail.postulaciones.find((item) => item.estado === "pendiente")?.id ??
      initialDetail.postulaciones[0]?.id ??
      null,
  );
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return subscribePostulacionEvents((event) => {
      if (event.payload.publicacionId !== detail.id) return;

      if (event.type === "created") {
        const { payload } = event;
        setDetail((current) => {
          if (current.postulaciones.some((item) => item.id === payload.postulacionId)) {
            return current;
          }

          const nextPostulacion: PostulacionAdminItem = {
            id: payload.postulacionId,
            estado: "pendiente",
            createdAt: payload.createdAt,
            nombre: payload.nombre,
            apellido: payload.apellido,
            placa: payload.placa,
            marca: payload.marca,
            modelo: payload.modelo,
            transportistaId: payload.transportistaId,
          };

          setExpandedId(payload.postulacionId);
          return {
            ...current,
            postulaciones: [nextPostulacion, ...current.postulaciones],
          };
        });
        return;
      }

      if (event.type === "accepted") {
        setDetail((current) => ({
          ...current,
          postulaciones: current.postulaciones.map((item) => {
            if (item.id === event.payload.postulacionId) {
              return { ...item, estado: "aceptada" };
            }
            if (item.estado === "pendiente") {
              return { ...item, estado: "rechazada" };
            }
            return item;
          }),
        }));
        return;
      }

      if (event.type === "rejected") {
        setDetail((current) => ({
          ...current,
          postulaciones: current.postulaciones.map((item) =>
            item.id === event.payload.postulacionId
              ? { ...item, estado: "rechazada" }
              : item,
          ),
        }));
      }
    });
  }, [detail.id, subscribePostulacionEvents]);

  const filteredPostulaciones = useMemo(() => {
    if (tab === "todas") return detail.postulaciones;
    return detail.postulaciones.filter((item) => item.estado === tab);
  }, [detail.postulaciones, tab]);

  const tabCounts = useMemo(
    () => ({
      pendiente: countByEstado(detail.postulaciones, "pendiente"),
      aceptada: countByEstado(detail.postulaciones, "aceptada"),
      rechazada: countByEstado(detail.postulaciones, "rechazada"),
    }),
    [detail.postulaciones],
  );

  const handleAccept = useCallback((postulacionId: number) => {
    setAcceptingId(postulacionId);
    startTransition(async () => {
      const result = await acceptPostulacionAction(postulacionId);
      setAcceptingId(null);

      if (!("success" in result) || !result.success) {
        return;
      }

      setDetail((current) => ({
        ...current,
        postulaciones: current.postulaciones.map((item) => {
          if (item.id === postulacionId) {
            return { ...item, estado: "aceptada" };
          }
          if (item.estado === "pendiente") {
            return { ...item, estado: "rechazada" };
          }
          return item;
        }),
      }));
    });
  }, []);

  const handlePublish = useCallback(() => {
    if (detail.estado === ESTADO_PUBLICACION.PUBLICADO) return;

    setPublishError(null);
    startTransition(async () => {
      const result = await publishPublicacionAction(detail.id);
      if (!("success" in result) || !result.success) {
        const message =
          "error" in result && result.error
            ? result.error
            : "Error al publicar";
        const billingHint =
          "code" in result && result.code === "BILLING_REQUIRED"
            ? " Configura tu método de pago en Perfil."
            : "";
        setPublishError(`${message}${billingHint}`);
        return;
      }

      setDetail((current) => ({
        ...current,
        estado: ESTADO_PUBLICACION.PUBLICADO,
      }));
    });
  }, [detail.estado, detail.id]);

  const isPublished = detail.estado === ESTADO_PUBLICACION.PUBLICADO;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 p-8">
      <div className="relative">
        <Link
          href="/Publicaciones"
          className="inline-flex items-center gap-1 text-xs font-semibold tracking-[0.24px] text-[#44474d]"
        >
          <ArrowLeft className="size-3.5" />
          Volver a Publicaciones
        </Link>

        <h1 className="mt-1 text-[30px] font-bold tracking-[-0.75px] text-[#121c27]">
          Administrar Publicación
        </h1>
        <p className="mt-1 text-base text-[#44474d]">
          flete #{detail.codigo} - {detail.tipoCarga}
        </p>

        <div className="absolute right-0 top-8 hidden max-w-xs items-start gap-4 lg:flex">
          <Info className="mt-0.5 size-5 shrink-0 text-[#434750]" />
          <p className="text-xs leading-3 text-[#434750]">
            Solo se permite editar las publicaciones en borrador
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 xl:flex-row">
        <section className="flex-1 overflow-hidden rounded-xl border border-transparent bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <div className="border-b border-[#c4c6ce] bg-[#f8f9ff] px-4 pb-4 pt-4">
            <h2 className="text-xl font-bold text-[#121c27]">
              Postulaciones ({detail.postulaciones.length})
            </h2>
            <div className="mt-4 flex flex-wrap gap-1 overflow-x-auto pb-1">
              {(Object.keys(TAB_LABELS) as PostulacionTabFilter[]).map((key) => {
                const isActive = tab === key;
                const count =
                  key === "todas"
                    ? detail.postulaciones.length
                    : tabCounts[key as keyof typeof tabCounts];

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.24px] ${
                      isActive
                        ? "bg-[#0b1f3a] text-white"
                        : "border border-[#c4c6ce] bg-[#f8f9ff] text-[#44474d]"
                    }`}
                  >
                    {TAB_LABELS[key]}
                    {key !== "todas" ? ` (${count})` : ""}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-h-[700px] space-y-4 overflow-y-auto bg-[#f8f9ff] p-4">
            {filteredPostulaciones.length === 0 ? (
              <p className="py-12 text-center text-sm text-[#434750]">
                No hay postulaciones en esta categoría.
              </p>
            ) : (
              filteredPostulaciones.map((postulacion) => (
                <PostulacionCard
                  key={postulacion.id}
                  postulacion={postulacion}
                  expanded={expandedId === postulacion.id}
                  onToggle={() =>
                    setExpandedId((current) =>
                      current === postulacion.id ? null : postulacion.id,
                    )
                  }
                  onAccept={() => handleAccept(postulacion.id)}
                  accepting={acceptingId === postulacion.id && isPending}
                />
              ))
            )}
          </div>
        </section>

        <aside className="w-full shrink-0 xl:w-[420px]">
          <div className="overflow-hidden rounded-xl border border-[rgba(196,198,210,0.2)] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="border-b border-[rgba(196,198,210,0.2)] p-4">
              <div className="flex rounded-lg bg-[#f5f3f3] p-1">
                <button
                  type="button"
                  disabled={isPublished}
                  onClick={handlePublish}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold ${
                    isPublished
                      ? "bg-white text-[#001b44] shadow-sm"
                      : "text-[#434750]"
                  }`}
                >
                  <span
                    className={`size-2 rounded-full ${
                      isPublished ? "bg-[#006d43]" : "bg-[#747781]"
                    }`}
                  />
                  Publicada
                </button>
                <button
                  type="button"
                  disabled
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold ${
                    !isPublished
                      ? "bg-white text-[#001b44] shadow-sm"
                      : "text-[#434750] opacity-60"
                  }`}
                >
                  <span className="size-2 rounded-full bg-[#747781]" />
                  Borrador
                </button>
              </div>
              {publishError ? (
                <p className="mt-2 text-xs text-red-600">{publishError}</p>
              ) : null}
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#121c27]">
                  Detalle de la Publicación
                </h3>
                <button
                  type="button"
                  disabled={isPublished}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#002f6c] disabled:opacity-40"
                >
                  <Pencil className="size-3.5" />
                  Editar
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[1px] text-[#747781]">
                    Origen
                  </p>
                  <div className="mt-2 flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-[#002f6c]" />
                    <p className="text-sm font-medium text-[#121c27]">
                      {detail.origenNombre}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[1px] text-[#747781]">
                    Destino
                  </p>
                  <div className="mt-2 flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-[#002f6c]" />
                    <p className="text-sm font-medium text-[#121c27]">
                      {detail.destinoNombre}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-[#f8f9ff] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[1px] text-[#747781]">
                      Carga
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#121c27]">
                      {detail.tipoCarga}
                    </p>
                    <p className="text-xs text-[#434750]">
                      {formatPesoLabel(detail.peso)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#f8f9ff] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[1px] text-[#747781]">
                      Fecha Recolección
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#121c27]">
                      {formatFechaSalida(detail.fechaSalida)}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-[#001b44] p-5 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-[#aec6ff]">
                    Presupuesto Ofrecido
                  </p>
                  <p className="mt-2 text-3xl font-extrabold tracking-[-0.5px]">
                    {formatCurrencyUsd(detail.totalPago)}
                  </p>
                </div>

                {detail.cargaPeligrosa ? (
                  <div className="rounded-lg border border-[#ffb4ab] bg-[#ffdad6] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[1px] text-[#690005]">
                      Requisitos de la mercancía
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#690005]">
                      Esta carga requiere permisos especiales
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
