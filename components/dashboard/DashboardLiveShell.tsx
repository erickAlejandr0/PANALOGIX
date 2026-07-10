"use client";

import { useLayoutEffect, useState } from "react";

import { ActiveFreightTable } from "@/components/dashboard/ActiveFreightTable";
import { DashboardMap } from "@/components/dashboard/DashboardMap";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { useEmpresaRealtime } from "@/components/realtime/EmpresaRealtimeProvider";
import type { DashboardData } from "@/service/dashboardService";

type DashboardLiveShellProps = {
  initialDashboard: DashboardData;
};

export function DashboardLiveShell({ initialDashboard }: DashboardLiveShellProps) {
  const { publications, driverMarkers, activeCount, drivers, setInitialData } =
    useEmpresaRealtime();
  const [hydrated, setHydrated] = useState(false);

  useLayoutEffect(() => {
    setInitialData({
      publications: initialDashboard.mapPublications,
      driverMarkers: initialDashboard.driverMarkers,
      activeCount: initialDashboard.activeCount,
      drivers: initialDashboard.drivers,
    });
    setHydrated(true);
  }, [initialDashboard, setInitialData]);

  const resolvedPublications = hydrated
    ? publications
    : initialDashboard.mapPublications;
  const resolvedDriverMarkers = hydrated
    ? driverMarkers
    : initialDashboard.driverMarkers;
  const resolvedActiveCount = hydrated
    ? activeCount
    : initialDashboard.activeCount;
  const resolvedDrivers = hydrated ? drivers : initialDashboard.drivers;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 p-8">
      <div className="grid h-[480px] grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="h-full xl:col-span-8">
          <DashboardMap
            publications={resolvedPublications}
            driverMarkers={resolvedDriverMarkers}
            activeCount={resolvedActiveCount}
          />
        </div>
        <div className="xl:col-span-4">
          <MetricCards
            fletesHoy={initialDashboard.metrics.fletesHoy}
            publicacionesPublicadas={initialDashboard.metrics.publicacionesPublicadas}
            gastoTotal={initialDashboard.metrics.gastoTotal}
          />
        </div>
      </div>

      <ActiveFreightTable
        drivers={resolvedDrivers}
        totalDrivers={initialDashboard.totalDrivers}
      />
    </div>
  );
}
