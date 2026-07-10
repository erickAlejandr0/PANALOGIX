import { notFound, redirect } from "next/navigation";
import { EntregaCompletadaView } from "@/components/entregas/EntregaCompletadaView";
import { getSession } from "@/lib/auth/session";
import { getDashboardPath } from "@/lib/auth/routes";
import { EMPRESA_ROLE_ID } from "@/lib/fletes/constants";
import { empresaRepository } from "@/repositories/empresaRepository";
import { negociacionViajeService } from "@/service/negociacionViajeService";

type EntregaCompletadaPageProps = {
  params: Promise<{ viajeId: string }>;
};

function formatCompletadaEn(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-PA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Panama",
  });
}

export default async function EntregaCompletadaPage({
  params,
}: EntregaCompletadaPageProps) {
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

  const result = await negociacionViajeService.getResumenNegociacion(
    viajeId,
    empresa.id,
  );
  if (!result.success) {
    notFound();
  }

  const { resumen } = result.data;

  return (
    <EntregaCompletadaView
      fleteCodigo={resumen.codigo}
      pago={Number.parseFloat(resumen.totalPago)}
      receptor={resumen.nombreTransportista}
      destino={resumen.destinoNombre}
      completadaEn={formatCompletadaEn(resumen.completadoEn)}
      stripePaymentIntentId={resumen.stripePaymentIntentId}
      stripeTransferId={resumen.stripeTransferId}
      paymentStatus={resumen.paymentStatus}
      platformFee={resumen.platformFee}
      stripeFee={resumen.stripeFee}
      transportistaPayout={resumen.transportistaPayout}
      platformFeePercent={resumen.platformFeePercent}
    />
  );
}
