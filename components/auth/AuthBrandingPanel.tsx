import Image from "next/image";

export function AuthBrandingPanel() {
  return (
    <section className="relative hidden w-[42%] shrink-0 flex-col items-center justify-center overflow-hidden border-r border-[#e2e8f0] md:flex">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top left, #0b1f3a 0%, #061328 50%, #000615 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-col items-center px-8">
        <Image
          src="/auth/panalogix-logo.png"
          alt="Panalogix"
          width={392}
          height={176}
          priority
          className="h-auto w-full max-w-[392px] drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
        />
      </div>

      <div className="absolute inset-x-8 bottom-8 border-t border-white/10 pt-6">
        <p className="text-center text-base text-[#64748b]">
          © 2024 Panalogix Inc. Todos los derechos reservados.
        </p>
      </div>
    </section>
  );
}
