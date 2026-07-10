import { EntregasLiveShell } from "@/components/entregas/EntregasLiveShell";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDashboardPath } from "@/lib/auth/routes";
import { EMPRESA_ROLE_ID } from "@/lib/fletes/constants";
import { buildEntregasPageData } from "@/lib/entregas/negociacion-mappers";
import { empresaRepository } from "@/repositories/empresaRepository";
import { entregasRepository } from "@/repositories/entregasRepository";

export default async function EntregasPage() {
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

  const rows = await entregasRepository.listByEmpresa(empresa.id);
  const pageData = buildEntregasPageData(rows);

  return <EntregasLiveShell initialData={pageData} />;
}
