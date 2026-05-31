import Image from "next/image";
import { AuthBrandingPanel } from "@/components/auth/AuthBrandingPanel";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
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
          <SignUpForm />
        </div>
      </section>
    </main>
  );
}
