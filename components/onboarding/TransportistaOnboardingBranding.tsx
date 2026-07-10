import { Truck } from "lucide-react";

export function TransportistaOnboardingBranding() {
  return (
    <section className="relative hidden min-h-screen w-[42%] shrink-0 flex-col overflow-hidden bg-[#0b1f3a] p-8 lg:flex lg:p-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 70%)",
        }}
      />
      <div className="absolute -bottom-16 -right-16 size-[400px] rounded-full bg-[#00658d] opacity-20 blur-[50px]" />

      <div className="relative flex flex-1 flex-col justify-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[#00658d]">
          <Truck className="size-5 text-white" />
        </div>

        <h1 className="font-mono text-[30px] font-bold leading-[38px] text-white lg:text-[48px] lg:leading-[56px]">
          Bienvenido
          <br />a la red
        </h1>

        <p className="mt-4 max-w-md text-lg leading-7 text-[#b5c7ea]">
          Únete a la plataforma líder en logística y haz crecer tu negocio con
          acceso a miles de cargas diariamente.
        </p>
      </div>
    </section>
  );
}
