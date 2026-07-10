import { notFound, redirect } from "next/navigation";
import { InspeccionCargaView } from "@/components/entregas/InspeccionCargaView";
import { getSession } from "@/lib/auth/session";
import { getDashboardPath } from "@/lib/auth/routes";
import { EMPRESA_ROLE_ID, FASE_VIAJE } from "@/lib/fletes/constants";
import { mapInspeccionCargaData } from "@/lib/entregas/negociacion-mappers";
import { empresaRepository } from "@/repositories/empresaRepository";
import { entregasRepository } from "@/repositories/entregasRepository";

type EntregaInspeccionPageProps = {
  params: Promise<{ viajeId: string }>;
};

export default async function EntregaInspeccionPage({
  params,
}: EntregaInspeccionPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.roleId !== EMPRESA_ROLE_ID) {
    redirect(getDashboardPath(session.roleId));
  }

  const empresa = await empresaRepository.getByUserId(session.userId);
  if (!empresa) {
    redirect("/Onboarding/Empresa");
  }

  const { viajeId: viajeIdParam } = await params;
  const viajeId = Number.parseInt(viajeIdParam, 10);
  if (Number.isNaN(viajeId)) {
    notFound();
  }

  const row = await entregasRepository.getInspeccionContext(viajeId, empresa.id);
  if (!row) {
    notFound();
  }

  // Redirige segun la fase para respetar el flujo step-locked.
  if (row.fase === FASE_VIAJE.RESUMEN) {
    redirect(`/entrega-completada/${viajeId}`);
  }
  if (row.fase === FASE_VIAJE.CODIGO_PENDIENTE) {
    redirect(`/verificacion/${viajeId}`);
  }
  if (
    row.fase !== FASE_VIAJE.EN_DESTINO &&
    row.fase !== FASE_VIAJE.INSPECCION
  ) {
    // El transportista aun no ha avisado su llegada: no hay inspeccion todavia.
    redirect("/entregas");
  }

  const data = mapInspeccionCargaData(row);

  return <InspeccionCargaView data={data} viajeId={viajeId} fase={row.fase} />;
}
