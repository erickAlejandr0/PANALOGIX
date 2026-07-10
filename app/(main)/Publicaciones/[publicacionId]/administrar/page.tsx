import { notFound, redirect } from "next/navigation";

import { AdministrarPublicacionView } from "@/components/publicaciones/admin/AdministrarPublicacionView";
import { getSession } from "@/lib/auth/session";
import { getDashboardPath } from "@/lib/auth/routes";
import { EMPRESA_ROLE_ID } from "@/lib/fletes/constants";
import { empresaRepository } from "@/repositories/empresaRepository";
import { publicacionAdminService } from "@/service/publicacionAdminService";

type AdministrarPublicacionPageProps = {
  params: Promise<{ publicacionId: string }>;
};

export default async function AdministrarPublicacionPage({
  params,
}: AdministrarPublicacionPageProps) {
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

  const { publicacionId: publicacionIdParam } = await params;
  const publicacionId = Number.parseInt(publicacionIdParam, 10);
  if (Number.isNaN(publicacionId)) {
    notFound();
  }

  const detail = await publicacionAdminService.getAdminDetail(
    publicacionId,
    empresa.id,
  );

  if (!detail) {
    notFound();
  }

  return <AdministrarPublicacionView initialDetail={detail} />;
}
