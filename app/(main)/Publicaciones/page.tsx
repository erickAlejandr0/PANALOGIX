import { redirect } from "next/navigation";
import { PublicacionesView } from "@/components/publicaciones/PublicacionesView";
import { getSession } from "@/lib/auth/session";
import { getDashboardPath } from "@/lib/auth/routes";
import { EMPRESA_ROLE_ID } from "@/lib/fletes/constants";
import { empresaRepository } from "@/repositories/empresaRepository";
import { publicacionesPageService } from "@/service/publicacionesPageService";

export default async function PublicacionesPage() {
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

  const pageData =
    await publicacionesPageService.getEmpresaPublicacionesPage(empresa.id);

  return <PublicacionesView {...pageData} />;
}
