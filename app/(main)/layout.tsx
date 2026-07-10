import { redirect } from "next/navigation";
import { MainShell } from "@/components/main/MainShell";
import { getSession } from "@/lib/auth/session";
import { getOnboardingPath } from "@/lib/auth/routes";
import { EMPRESA_ROLE_ID } from "@/lib/fletes/constants";
import { empresaRepository } from "@/repositories/empresaRepository";

function getRoleLabel(roleId: number) {
  if (roleId === 1) return "Transportista";
  if (roleId === 2) return "Empresa";
  return "Usuario";
}

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (!session.onboardingCompleted) {
    redirect(getOnboardingPath(session.roleId));
  }

  let displayName = getRoleLabel(session.roleId);
  let empresaId: number | null = null;

  if (session.roleId === EMPRESA_ROLE_ID) {
    const empresa = await empresaRepository.getByUserId(session.userId);
    if (!empresa) {
      redirect("/Onboarding/Empresa");
    }
    displayName = empresa.nombre;
    empresaId = empresa.id;
  }

  return (
    <MainShell
      email={session.email}
      displayName={displayName}
      empresaId={empresaId}
    >
      {children}
    </MainShell>
  );
}
