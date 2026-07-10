export function getDriverInitials(nombre: string, apellido: string) {
  const first = nombre.trim().charAt(0);
  const last = apellido.trim().charAt(0);
  const initials = `${first}${last}`.toUpperCase();
  return initials || "?";
}
