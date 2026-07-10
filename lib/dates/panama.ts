const PANAMA_DATE_INPUT = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** Formato fijo Panamá: dd/mm/aaaa */
export function formatPanamaDate(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

/** Convierte dd/mm/aaaa → YYYY-MM-DD */
export function parsePanamaDateInput(input: string): string | null {
  const match = input.trim().match(PANAMA_DATE_INPUT);
  if (!match) return null;

  const [, day, month, year] = match;
  const isoDate = `${year}-${month}-${day}`;
  const [y, m, d] = [Number(year), Number(month), Number(day)];
  const date = new Date(Date.UTC(y, m - 1, d));

  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }

  return isoDate;
}

/** Suma segundos de viaje a una fecha ISO usando hora de salida 08:00 (Panamá, UTC-5). */
export function addSecondsToIsoDate(isoDate: string, seconds: number): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoDate;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const departureUtcMs = Date.UTC(year, month - 1, day, 13, 0, 0);
  const arrivalUtcMs = departureUtcMs + seconds * 1000;
  const panamaMs = arrivalUtcMs - 5 * 60 * 60 * 1000;

  const arrival = new Date(panamaMs);
  const y = arrival.getUTCFullYear();
  const m = String(arrival.getUTCMonth() + 1).padStart(2, "0");
  const d = String(arrival.getUTCDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

export const PANAMA_DATE_PLACEHOLDER = "dd/mm/aaaa";
