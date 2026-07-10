import {
  formatDeliveryDate,
  formatDuration,
  getPointCoordinates,
} from "@/lib/mapbox/geometry";
import { getDrivingDurationSeconds } from "@/lib/mapbox/matrix";
import { ESTADO_VIAJE_NOMBRE } from "@/lib/fletes/constants";
import { getFaseLabel } from "@/lib/viajes/transitions";
import type { DriverMarker } from "@/lib/dashboard/driver-markers";
import type { DriverRow } from "@/lib/dashboard/driver-table";
import type { MapPublication } from "@/lib/dashboard/map-publications";
import { dashboardRepository } from "@/repositories/dashboardRepository";

export type DashboardData = {
  mapPublications: MapPublication[];
  driverMarkers: DriverMarker[];
  activeCount: number;
  metrics: {
    fletesHoy: number;
    publicacionesPublicadas: number;
    gastoTotal: number;
  };
  drivers: DriverRow[];
  totalDrivers: number;
};

function normalizeEstado(estado: string) {
  return estado.trim().toLowerCase().replace(/\s+/g, "_");
}

function isDeliveredEstado(estado: string) {
  return normalizeEstado(estado) === ESTADO_VIAJE_NOMBRE.COMPLETADO;
}

export const dashboardService = {
  getEmpresaDashboard: async (empresaId: number): Promise<DashboardData> => {
    const [publicaciones, drivers, metrics, totalDrivers] = await Promise.all([
      dashboardRepository.getActivePublicaciones(empresaId),
      dashboardRepository.getActiveDrivers(empresaId),
      dashboardRepository.getMetrics(empresaId),
      dashboardRepository.countActiveDrivers(empresaId),
    ]);

    const mapPublications = publicaciones.flatMap((publicacion) => {
      const origen = getPointCoordinates(publicacion.origen_geom);
      const destino = getPointCoordinates(publicacion.destino_geom);
      if (!origen || !destino) return [];

      return [
        {
          id: publicacion.id,
          codigo: publicacion.codigo,
          origenNombre: publicacion.origen_nombre,
          destinoNombre: publicacion.destino_nombre,
          origen,
          destino,
        },
      ];
    });

    const driverRows = await Promise.all(
      drivers.map(async (driver) => {
        const nombre = `${driver.nombre} ${driver.apellido}`.trim();
        const placa = driver.placa ?? "Sin placa";
        const delivered = isDeliveredEstado(driver.estado);
        let secondaryText = `fecha entrega: ${formatDeliveryDate(driver.fecha_entrega_estimada)}`;

        const livePosition = getPointCoordinates(driver.ubicacion_geom);
        const fallbackPosition = getPointCoordinates(driver.origen_geom);
        const conductorPosition = livePosition ?? fallbackPosition;

        if (!delivered) {
          const destino = getPointCoordinates(driver.destino_geom);

          if (conductorPosition && destino) {
            const duration = await getDrivingDurationSeconds(
              conductorPosition,
              destino,
            );
            secondaryText = duration
              ? formatDuration(duration)
              : "llegada estimada no disponible";
          } else {
            secondaryText = "llegada estimada no disponible";
          }
        }

        return {
          id: driver.viaje_id,
          fleteId: driver.flete_id,
          transportistaId: driver.transportista_id,
          nombre,
          placa,
          estado: driver.estado,
          fase: driver.fase,
          estadoLabel: getFaseLabel(driver.fase),
          secondaryText,
          isDelivered: delivered,
        };
      }),
    );

    const driverMarkers = drivers.flatMap((driver) => {
      const position = getPointCoordinates(driver.ubicacion_geom);
      if (!position) return [];

      return [
        {
          viajeId: driver.viaje_id,
          transportistaId: driver.transportista_id,
          nombre: `${driver.nombre} ${driver.apellido}`.trim(),
          placa: driver.placa ?? "Sin placa",
          lng: position[0],
          lat: position[1],
        },
      ];
    });

    return {
      mapPublications,
      driverMarkers,
      activeCount: publicaciones.length,
      metrics: {
        fletesHoy: metrics.fletes_hoy,
        publicacionesPublicadas: metrics.publicaciones_publicadas,
        gastoTotal: Number(metrics.gasto_total),
      },
      drivers: driverRows,
      totalDrivers,
    };
  },
};
