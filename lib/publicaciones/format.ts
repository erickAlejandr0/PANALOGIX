import { ESTADO_PUBLICACION } from "@/lib/fletes/constants";

const MS_MINUTE = 60_000;
const MS_HOUR = 3_600_000;
const MS_DAY = 86_400_000;

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatRelativePublicationTime(
  isoDate: string,
  estado: "borrador" | "publicado",
) {
  const date = parseDate(isoDate);
  if (!date) return "";

  const diffMs = Date.now() - date.getTime();
  const prefix = estado === ESTADO_PUBLICACION.PUBLICADO ? "Publicado" : "Guardado";

  if (diffMs < MS_MINUTE) return `${prefix} hace un momento`;
  if (diffMs < MS_HOUR) {
    const minutes = Math.floor(diffMs / MS_MINUTE);
    return `${prefix} hace ${minutes} min`;
  }
  if (diffMs < MS_DAY) {
    const hours = Math.floor(diffMs / MS_HOUR);
    return `${prefix} hace ${hours}h`;
  }

  const days = Math.floor(diffMs / MS_DAY);
  return `${prefix} hace ${days}d`;
}

export function getApplicantInitials(nombre: string, apellido: string) {
  const first = nombre.trim().charAt(0).toUpperCase();
  const last = apellido.trim().charAt(0).toUpperCase();
  return `${first}${last}` || "?";
}

export function formatPostulacionesLabel(count: number) {
  if (count === 0) return null;
  return count === 1 ? "1 Postulación" : `${count} Postulaciones`;
}

export function formatRouteLabel(origen: string, destino: string) {
  const short = (value: string) => {
    const part = value.split(",")[0]?.trim() ?? value;
    return part.length > 28 ? `${part.slice(0, 25)}...` : part;
  };

  return {
    origen: short(origen),
    destino: short(destino),
  };
}

export function formatPesoLabel(peso: number) {
  return `${peso.toLocaleString("es-PA", { maximumFractionDigits: 1 })} kg`;
}

export function formatRelativeTimeShort(isoDate: string) {
  const date = parseDate(isoDate);
  if (!date) return "";

  const diffMs = Date.now() - date.getTime();

  if (diffMs < MS_MINUTE) return "hace un momento";
  if (diffMs < MS_HOUR) {
    const minutes = Math.floor(diffMs / MS_MINUTE);
    return `hace ${minutes}m`;
  }
  if (diffMs < MS_DAY) {
    const hours = Math.floor(diffMs / MS_HOUR);
    return `hace ${hours}h`;
  }

  const days = Math.floor(diffMs / MS_DAY);
  return `hace ${days}d`;
}

export function formatCurrencyUsd(value: string | number) {
  const amount = typeof value === "number" ? value : Number.parseFloat(value);
  if (Number.isNaN(amount)) return "$0.00";

  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

export function formatFechaSalida(isoDate: string) {
  const date = parseDate(isoDate);
  if (!date) return isoDate;

  return date.toLocaleDateString("es-PA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
