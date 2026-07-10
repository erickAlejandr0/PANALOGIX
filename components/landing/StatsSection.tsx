const stats = [
  { value: "500+", label: "EMPRESAS", accent: false },
  { value: "1200+", label: "TRANSPORTISTAS", accent: true },
  { value: "24/7", label: "SOPORTE", accent: false },
];

export function StatsSection() {
  return (
    <section className="px-6 md:px-12">
      <div className="mx-auto flex max-w-[1184px] flex-col items-stretch justify-center gap-8 rounded-[32px] border border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.7)] px-8 py-10 shadow-[0px_4px_30px_0px_rgba(0,0,0,0.05)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-16">
        {stats.map((stat, index) => (
          <div key={stat.label} className="flex flex-1 items-center sm:justify-center">
            {index > 0 && (
              <div className="mr-8 hidden h-16 w-px shrink-0 bg-[rgba(196,198,206,0.3)] sm:mr-0 sm:block" />
            )}
            <div className="flex-1 text-center">
              <p
                className={`font-mono text-base font-bold ${
                  stat.accent ? "text-[#00aeef]" : "text-[#0b1f3a]"
                }`}
              >
                {stat.value}
              </p>
              <p className="mt-2 text-base uppercase tracking-wider text-[#44474d]">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
