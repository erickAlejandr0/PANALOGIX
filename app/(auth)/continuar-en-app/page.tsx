import { redirect } from "next/navigation";
import { ContinuarEnAppScreen } from "@/components/onboarding/ContinuarEnAppScreen";
import { getSession } from "@/lib/auth/session";
import { getDashboardPath } from "@/lib/auth/routes";
import { TRANSPORTISTA_ROLE_ID } from "@/lib/validations/onboarding";

export default async function ContinuarEnAppPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.roleId !== TRANSPORTISTA_ROLE_ID) {
    redirect(getDashboardPath(session.roleId));
  }

  if (!session.onboardingCompleted) {
    redirect("/Onboarding/Transportista");
  }

  return <ContinuarEnAppScreen />;
}
