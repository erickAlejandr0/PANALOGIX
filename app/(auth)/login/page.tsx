import Image from "next/image";
import { AuthBrandingPanel } from "@/components/auth/AuthBrandingPanel";
import { LoginForm } from "@/components/auth/LoginForm";
import {
  getOAuthErrorMessage,
  getOAuthSuccessMessage,
} from "@/lib/auth/oauth-messages";

interface LoginPageProps {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorMessage = getOAuthErrorMessage(params.error);
  const successMessage = getOAuthSuccessMessage(params.success);

  return (
    <main className="flex min-h-screen w-full bg-[#f8fafc]">
      <AuthBrandingPanel />

      <section className="flex flex-1 items-center justify-center bg-[#f8fafc] p-8 md:p-12">
        <div className="w-full max-w-[440px]">
          <div className="mb-8 flex justify-center md:hidden">
            <Image
              src="/auth/panalogix-logo.png"
              alt="Panalogix"
              width={240}
              height={108}
              priority
              className="h-auto w-[240px]"
            />
          </div>
          {successMessage && (
            <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
              {successMessage}
            </p>
          )}
          {errorMessage && (
            <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
