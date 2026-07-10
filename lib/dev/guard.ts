/**
 * Protecciones para endpoints exclusivos de desarrollo/QA.
 * En producción responden 404 (el endpoint no existe).
 */
export function gateDevRequest(request: Request): Response | null {
  if (process.env.NODE_ENV === "production") {
    return new Response(null, { status: 404 });
  }

  const expected = process.env.DEV_SIMULATION_TOKEN;
  if (!expected) {
    return Response.json(
      { error: "DEV_SIMULATION_TOKEN no está configurado en el servidor" },
      { status: 503 },
    );
  }

  const token = request.headers.get("x-dev-token");
  if (!token || token !== expected) {
    return Response.json({ error: "Token de desarrollo inválido" }, { status: 401 });
  }

  return null;
}
