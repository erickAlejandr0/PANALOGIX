import { redirect } from "next/navigation";
import { NuevoFleteForm } from "@/components/publicaciones/NuevoFleteForm";
import { getSession } from "@/lib/auth/session";
import { getDashboardPath } from "@/lib/auth/routes";
import { EMPRESA_ROLE_ID } from "@/lib/fletes/constants";
import { cargaTypeRepository } from "@/repositories/cargaTypeRepository";
import { empresaRepository } from "@/repositories/empresaRepository";

export default async function NuevoFletePage() {
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

  const cargaTypes = await cargaTypeRepository.findAll();
  if (cargaTypes.length === 0) {
    throw new Error(
      "No hay tipos de carga configurados. Ejecuta npm run db:seed.",
    );
  }

  return <NuevoFleteForm cargaTypes={cargaTypes} />;
}
