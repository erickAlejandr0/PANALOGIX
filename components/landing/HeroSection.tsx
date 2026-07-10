import { ArrowRight } from "lucide-react";
import { DashboardMockup } from "./DashboardMockup";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-24 md:px-12 md:pb-24 md:pt-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(223,233,249,0.4)_0%,rgba(248,249,255,1)_50%)] blur-xl" />

      <div className="relative mx-auto flex max-w-[1024px] flex-col items-center text-center">
        <h1 className="bg-gradient-to-br from-[#0b1f3a] to-[#00aeef] bg-clip-text font-mono text-4xl font-bold leading-tight tracking-tight text-transparent md:text-6xl md:leading-[72px]">
          La nueva era de la logística
          <br />
          terrestre en Panamá
        </h1>

        <p className="mt-8 max-w-[768px] text-lg leading-8 text-[#44474d] md:text-[22px]">
          Conectamos empresas y transportistas en tiempo real con tecnología de
          vanguardia. Optimiza tus rutas, rastrea tu carga y transforma tu cadena
          de suministro.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <button
            type="button"
            className="flex items-center gap-3 rounded-full bg-[#0b1f3a] px-8 py-4 text-sm font-semibold tracking-wide text-white shadow-lg transition hover:bg-[#0d2747]"
          >
            Explorar la Plataforma
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            className="rounded-full border border-[rgba(196,198,206,0.3)] bg-white px-8 py-4 text-sm font-semibold tracking-wide text-[#0b1f3a] transition hover:bg-[#f8f9ff]"
          >
            Hablar con Ventas
          </button>
        </div>
      </div>

      <DashboardMockup />
    </section>
  );
}
