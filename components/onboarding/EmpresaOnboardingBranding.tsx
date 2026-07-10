import { Building2 } from "lucide-react";

export function EmpresaOnboardingBranding() {
  return (
    <section className="relative hidden w-[42%] shrink-0 flex-col overflow-hidden bg-[#0b1f3a] p-12 lg:flex">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-1 flex-col justify-center">
        <div className="mb-4 flex items-center">
          <Building2 className="text-[#2dbcfe]" size={20} />
        </div>

        <h1 className="font-mono text-[48px] font-bold leading-[56px] tracking-[-1.2px] text-white">
          Configura tu
          <br />
          perfil
          <br />
          corporativo.
        </h1>

        <p className="mt-4 max-w-[448px] text-lg leading-7 text-[#b5c7ea]">
          Únete a la red logística más avanzada. Configura tu empresa de manera
          rápida y segura para empezar a mover carga.
        </p>
      </div>

      <div className="relative h-16 shrink-0">
        <div className="absolute -bottom-16 -left-8 size-64 rounded-full border border-dashed border-[#b5c7ea]/20" />
        <div className="absolute -bottom-12 -left-6 size-48 rounded-full border border-[#00658d]/30" />
      </div>
    </section>
  );
}
