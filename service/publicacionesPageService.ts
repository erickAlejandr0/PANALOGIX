import type {
  PublicacionListItem,
  PublicacionesPageData,
} from "@/lib/publicaciones/list-types";
import { publicacionesListRepository } from "@/repositories/publicacionesListRepository";

function buildPostulantesMap(rows: Awaited<
  ReturnType<typeof publicacionesListRepository.getRecentPostulantes>
>) {
  const map = new Map<number, PublicacionListItem["postulantes"]>();

  for (const row of rows) {
    const current = map.get(row.id_publicacion) ?? [];
    if (current.length >= 2) continue;

    current.push({ nombre: row.nombre, apellido: row.apellido });
    map.set(row.id_publicacion, current);
  }

  return map;
}

function computeTrendPercent(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }

  return Math.round(((current - previous) / previous) * 100);
}

export const publicacionesPageService = {
  getEmpresaPublicacionesPage: async (
    empresaId: number,
  ): Promise<PublicacionesPageData> => {
    const [
      rows,
      postulanteRows,
      publishedCount,
      weeklyPostulaciones,
      previousWeekPostulaciones,
      weeklyChartRows,
    ] = await Promise.all([
      publicacionesListRepository.getByEmpresa(empresaId),
      publicacionesListRepository.getRecentPostulantes(empresaId),
      publicacionesListRepository.countPublishedByEmpresa(empresaId),
      publicacionesListRepository.countPostulacionesInRange(empresaId, 7, 0),
      publicacionesListRepository.countPostulacionesInRange(empresaId, 14, 7),
      publicacionesListRepository.getWeeklyPostulacionesChart(empresaId),
    ]);

    const postulantesMap = buildPostulantesMap(postulanteRows);
    const maxChartValue = Math.max(
      1,
      ...weeklyChartRows.map((row) => row.total),
    );

    const publicaciones: PublicacionListItem[] = rows.map((row) => ({
      id: row.id,
      estado: row.estado as PublicacionListItem["estado"],
      codigo: row.codigo,
      origenNombre: row.origen_nombre,
      destinoNombre: row.destino_nombre,
      tipoCarga: row.tipo_carga,
      peso: row.peso,
      postulacionesCount: row.postulaciones_count,
      postulantes: postulantesMap.get(row.id) ?? [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return {
      publicaciones,
      publishedCount,
      weeklyPostulaciones,
      weeklyTrendPercent: computeTrendPercent(
        weeklyPostulaciones,
        previousWeekPostulaciones,
      ),
      weeklyChart: weeklyChartRows.map((row) =>
        Math.round((row.total / maxChartValue) * 100),
      ),
    };
  },
};
