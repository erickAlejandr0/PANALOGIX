export function parseCoordinate(value: string | null, label: string) {
  if (value === null) {
    return { error: `${label} es requerida` };
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    return { error: `${label} inválida` };
  }

  return { value: number };
}

export function parseRadiusKm(value: string | null, defaultValue = 15) {
  if (value === null || value.trim() === "") {
    return { value: defaultValue };
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    return { error: "Radio inválido" };
  }

  return { value: number };
}
