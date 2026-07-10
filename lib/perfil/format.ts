const MONTHS_SHORT_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
] as const;

export function formatPerfilFecha(date: Date): string {
  const day = date.getDate();
  const month = MONTHS_SHORT_ES[date.getMonth()];
  const year = date.getFullYear();
  return `${String(day).padStart(2, "0")} ${month} ${year}`;
}

export function formatClienteDesde(date: Date): string {
  const month = MONTHS_SHORT_ES[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${year}`;
}
