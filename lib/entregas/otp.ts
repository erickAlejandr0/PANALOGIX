// La generacion de codigos vive ahora en el servidor (lib/viajes/verification-code.ts)
// con crypto + HMAC. Aqui solo queda el helper de formato de tiempo usado por la UI.
export function formatMmSs(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}
