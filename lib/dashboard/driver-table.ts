export type DriverRow = {
  id: number;
  fleteId: number;
  transportistaId: number;
  nombre: string;
  placa: string;
  estado: string;
  fase?: string;
  estadoLabel: string;
  secondaryText: string;
  isDelivered: boolean;
};

function normalizeEstado(estado: string) {
  return estado.trim().toLowerCase().replace(/\s+/g, "_");
}

function isEnCaminoEstado(estado: string) {
  const normalized = normalizeEstado(estado);
  return (
    normalized === "en_curso" ||
    normalized === "en_camino" ||
    normalized === "reasignado"
  );
}

export function filterDriversByTab(
  drivers: DriverRow[],
  tab: "conductores" | "en_camino",
) {
  if (tab === "conductores") return drivers;
  return drivers.filter(
    (driver) => !driver.isDelivered && isEnCaminoEstado(driver.estado),
  );
}
