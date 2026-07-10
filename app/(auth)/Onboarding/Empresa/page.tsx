import { EmpresaOnboardingBranding } from "@/components/onboarding/EmpresaOnboardingBranding";
import { EmpresaOnboardingForm } from "@/components/onboarding/EmpresaOnboardingForm";

export default function EmpresaOnboardingPage() {
  return (
    <main className="flex min-h-screen w-full bg-[#f8f9ff]">
      <EmpresaOnboardingBranding />
      <EmpresaOnboardingForm />
    </main>
  );
}
