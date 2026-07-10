import { redirect } from "next/navigation";
import { EmpresaPerfilView } from "@/components/perfil/EmpresaPerfilView";
import { getSession } from "@/lib/auth/session";
import { getDashboardPath } from "@/lib/auth/routes";
import { EMPRESA_ROLE_ID } from "@/lib/fletes/constants";
import { empresaRepository } from "@/repositories/empresaRepository";
import { empresaPerfilService } from "@/service/empresaPerfilService";

type PerfilPageProps = {
  searchParams: Promise<{ section?: string }>;
};

export default async function PerfilPage({ searchParams }: PerfilPageProps) {
  const params = await searchParams;
  const focusPaymentsSection = params.section === "pagos";

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

  const pageData = await empresaPerfilService.getEmpresaPerfilPage(
    empresa,
    session.email,
  );

  return (
    <EmpresaPerfilView {...pageData} focusPaymentsSection={focusPaymentsSection} />
  );
}
