type MetricCardsProps = {
  fletesHoy: number;
  publicacionesPublicadas: number;
  gastoTotal: number;
};

const barHeights = [32, 40, 48, 64, 56, 80];

export function MetricCards({
  fletesHoy,
  publicacionesPublicadas,
  gastoTotal,
}: MetricCardsProps) {
  const gastoFormatted = new Intl.NumberFormat("es-PA", {
    maximumFractionDigits: 0,
  }).format(gastoTotal);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-1 flex-col justify-between rounded-sm border-l-4 border-[#00658d] bg-white py-6 pl-7 pr-6 shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#44474d]">
            Total de fletes creados hoy
          </p>
          <p className="mt-1 font-mono text-4xl font-extrabold text-[#121c27]">
            {fletesHoy}
          </p>
        </div>

        <div className="mt-4 flex h-20 items-end gap-2">
          {barHeights.map((height, index) => (
            <div
              key={height}
              className={`flex-1 ${index === barHeights.length - 1 ? "bg-[#00658d]" : "bg-[#f2f3f9]"}`}
              style={{ height }}
            />
          ))}
        </div>
      </div>

      <div className="rounded-sm border-l-4 border-[#ba1a1a] bg-white py-6 pl-7 pr-6 shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#44474d]">
          publicaciones activas
        </p>
        <p className="mt-1 font-mono text-4xl font-extrabold text-[#121c27]">
          {publicacionesPublicadas} ofertas
        </p>
        <div className="mt-4 inline-flex items-center rounded-sm bg-[#ffdad6] px-1.5 py-0.5">
          <span className="text-[10px] font-bold text-[#93000a]">
            gasto total (suma de todos los depositos): {gastoFormatted} balboas
          </span>
        </div>
      </div>
    </div>
  );
}
