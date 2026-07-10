import { notFound, redirect } from "next/navigation";
import { CodigoVerificacionView } from "@/components/entregas/CodigoVerificacionView";
import { getSession } from "@/lib/auth/session";
import { getDashboardPath } from "@/lib/auth/routes";
import { EMPRESA_ROLE_ID, FASE_VIAJE } from "@/lib/fletes/constants";
import { empresaRepository } from "@/repositories/empresaRepository";
import { entregasRepository } from "@/repositories/entregasRepository";
import { negociacionViajeService } from "@/service/negociacionViajeService";

type VerificacionPageProps = {
  params: Promise<{ viajeId: string }>;
};

export default async function VerificacionPage({
  params,
}: VerificacionPageProps) {
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

  if (row.fase === FASE_VIAJE.RESUMEN) {
    redirect(`/entrega-completada/${viajeId}`);
  }
  if (row.fase !== FASE_VIAJE.CODIGO_PENDIENTE) {
    // La inspeccion aun no ha sido completada: no hay codigo que mostrar.
    redirect(`/entregas/${viajeId}`);
  }

  // El codigo solo existe en claro en el momento de emitirse (en BD solo vive el
  // hash). Por eso el render regenera un codigo fresco y valido para mostrarlo.
  const emitido = await negociacionViajeService.regenerarCodigo(
    viajeId,
    empresa.id,
  );
  if (!emitido.success) {
    redirect(`/entregas/${viajeId}`);
  }

  return (
    <CodigoVerificacionView
      viajeId={viajeId}
      fleteCodigo={row.codigo}
      pesoKg={row.peso}
      codigo={emitido.data.codigo}
      expiraEn={emitido.data.expiraEn}
    />
  );
}
