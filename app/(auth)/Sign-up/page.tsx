import Image from "next/image";
import { AuthBrandingPanel } from "@/components/auth/AuthBrandingPanel";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { getOAuthErrorMessage } from "@/lib/auth/oauth-messages";

interface SignUpPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const errorMessage = getOAuthErrorMessage(params.error);

  return (
    <main className="flex min-h-screen w-full bg-[#f8f9ff]">
      <AuthBrandingPanel />

      <section className="flex flex-1 items-center justify-center overflow-auto bg-[#f8f9ff] p-8 md:p-12">
        <div className="w-full max-w-[448px]">
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
          {errorMessage && (
            <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}
          <SignUpForm />
        </div>
      </section>
    </main>
  );
}
