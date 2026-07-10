import { redirect } from "next/navigation";
import { TransportistaOnboardingBranding } from "@/components/onboarding/TransportistaOnboardingBranding";
import { TransportistaOnboardingForm } from "@/components/onboarding/TransportistaOnboardingForm";
import { getSession } from "@/lib/auth/session";
import { TRANSPORTISTA_CONTINUE_PATH } from "@/lib/auth/routes";
import { TRANSPORTISTA_ROLE_ID } from "@/lib/validations/onboarding";
import { onboardingService } from "@/service/onboardingService";

export default async function TransportistaOnboardingPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.roleId !== TRANSPORTISTA_ROLE_ID) {
    redirect("/Onboarding/Empresa");
  }

  if (session.onboardingCompleted) {
    redirect(TRANSPORTISTA_CONTINUE_PATH);
  }

  const categorias = await onboardingService.getCategorias();

  return (
    <main className="flex min-h-screen w-full bg-[#f8f9ff]">
      <TransportistaOnboardingBranding />
      <TransportistaOnboardingForm categorias={categorias} />
    </main>
  );
}
