export function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[1152px] px-6 pt-16 md:pt-24">
      <div className="absolute -right-12 top-12 size-64 rounded-full bg-[rgba(0,174,239,0.2)] blur-[32px]" />
      <div className="absolute -bottom-12 -left-12 size-64 rounded-full bg-[rgba(11,31,58,0.1)] blur-[32px]" />

      <div className="relative overflow-hidden rounded-[32px] border border-[rgba(196,198,206,0.1)] bg-[#f8f9ff] shadow-[0px_20px_50px_-12px_rgba(0,0,0,0.1)]">
        <div className="flex min-h-[400px] flex-col md:min-h-[600px] md:flex-row">
          <aside className="hidden w-64 shrink-0 border-r border-[rgba(196,198,206,0.1)] bg-white p-6 md:block">
            <div className="mb-8 h-8 w-32 rounded-lg bg-[#eef4ff]" />
            <div className="space-y-4">
              <div className="h-6 w-full rounded-md bg-[rgba(0,174,239,0.1)]" />
              <div className="h-6 w-40 rounded-md bg-[#eef4ff]" />
              <div className="h-6 w-44 rounded-md bg-[#eef4ff]" />
              <div className="h-6 w-36 rounded-md bg-[#eef4ff]" />
            </div>
          </aside>

          <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div className="h-8 w-48 rounded-lg border border-[rgba(196,198,206,0.1)] bg-white" />
              <div className="h-10 w-32 rounded-full bg-[#0b1f3a]" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-[rgba(196,198,206,0.1)] bg-white p-6">
                <div className="mb-3 h-4 w-24 rounded-md bg-[#eef4ff]" />
                <div className="h-8 w-16 rounded-md bg-[rgba(11,31,58,0.8)]" />
              </div>
              <div className="rounded-xl border border-[rgba(196,198,206,0.1)] bg-white p-6">
                <div className="mb-3 h-4 w-32 rounded-md bg-[#eef4ff]" />
                <div className="h-8 w-20 rounded-md bg-[#00aeef]" />
              </div>
              <div className="rounded-xl border border-[rgba(196,198,206,0.1)] bg-white p-6">
                <div className="mb-3 h-4 w-28 rounded-md bg-[#eef4ff]" />
                <div className="h-8 w-24 rounded-md bg-[rgba(11,31,58,0.6)]" />
              </div>
            </div>

            <div className="relative min-h-[200px] flex-1 overflow-hidden rounded-xl border border-[rgba(196,198,206,0.1)] bg-white md:min-h-[280px]">
              <div className="absolute left-[25%] top-1/2 size-3 -translate-y-1/2 rounded-full bg-[#0b1f3a] shadow-[0_0_0_4px_rgba(11,31,58,0.2)]" />
              <div className="absolute right-[33%] top-[33%] size-3 rounded-full bg-[#00aeef] shadow-[0_0_0_4px_rgba(0,174,239,0.2)]" />
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 400 200"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d="M 100 100 Q 200 40 270 70"
                  fill="none"
                  stroke="#00aeef"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  opacity="0.6"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#f8f9ff] via-transparent to-transparent opacity-40" />
      </div>
    </div>
  );
}
