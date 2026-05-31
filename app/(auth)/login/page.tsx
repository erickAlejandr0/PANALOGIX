import Image from "next/image";
import { AuthBrandingPanel } from "@/components/auth/AuthBrandingPanel";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
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
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
