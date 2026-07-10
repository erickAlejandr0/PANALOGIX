import { redirect } from "next/navigation";
import { DashboardLiveShell } from "@/components/dashboard/DashboardLiveShell";
import { getSession } from "@/lib/auth/session";
import { getDashboardPath } from "@/lib/auth/routes";
import { empresaRepository } from "@/repositories/empresaRepository";
import { dashboardService } from "@/service/dashboardService";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.roleId !== 2) {
    redirect(getDashboardPath(session.roleId));
  }

  const empresa = await empresaRepository.getByUserId(session.userId);
  if (!empresa) {
    redirect("/Onboarding/Empresa");
  }

  const dashboard = await dashboardService.getEmpresaDashboard(empresa.id);

  return <DashboardLiveShell initialDashboard={dashboard} />;
}
