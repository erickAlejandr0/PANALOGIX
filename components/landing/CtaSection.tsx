export function CtaSection() {
  return (
    <section className="px-6 pb-24 md:px-12 md:pb-32">
      <div className="relative mx-auto max-w-[1184px] overflow-hidden rounded-[48px] bg-[#0b1f3a] px-8 py-16 shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] md:px-52 md:py-24">
        <div className="pointer-events-none absolute -right-64 -top-96 size-[800px] rounded-full bg-[rgba(0,174,239,0.2)] blur-[50px]" />
        <div className="pointer-events-none absolute -bottom-72 -left-48 size-[600px] rounded-full bg-[rgba(45,188,254,0.1)] blur-[40px]" />

        <div className="relative mx-auto max-w-[768px] text-center">
          <h2 className="font-mono text-4xl font-bold leading-tight text-white md:text-[56px] md:leading-[64px]">
            Transforma tu
            <br />
            operación logística
            <br />
            hoy
          </h2>
          <p className="mt-8 text-lg leading-7 text-[#b5c7ea] opacity-90 md:text-xl">
            Únete a la plataforma logística más avanzada de Panamá. Simplifica
            procesos, reduce costos operativos y mejora tus márgenes.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <button
              type="button"
              className="rounded-full bg-[#00aeef] px-10 py-5 text-sm font-semibold tracking-wide text-white shadow-lg transition hover:bg-[#0099d4]"
            >
              Comenzar Prueba Gratuita
            </button>
            <button
              type="button"
              className="rounded-full border border-[rgba(255,255,255,0.3)] px-10 py-5 text-sm font-semibold tracking-wide text-white transition hover:bg-white/10"
            >
              Contactar Ventas
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
