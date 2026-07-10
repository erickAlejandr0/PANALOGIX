import type {
  PostulacionAdminItem,
  PostulacionEstado,
  PublicacionAdminDetail,
} from "@/lib/publicaciones/admin-types";
import { publicacionAdminRepository } from "@/repositories/publicacionAdminRepository";

function mapEstado(value: string): PostulacionEstado {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "pendiente" ||
    normalized === "aceptada" ||
    normalized === "rechazada" ||
    normalized === "cancelada"
  ) {
    return normalized;
  }
  return "pendiente";
}

function mapPostulacion(row: Awaited<
  ReturnType<typeof publicacionAdminRepository.getPostulacionesByPublicacion>
>[number]): PostulacionAdminItem {
  return {
    id: row.id,
    estado: mapEstado(row.estado),
    createdAt: row.created_at,
    nombre: row.nombre,
    apellido: row.apellido,
    placa: row.placa,
    marca: row.marca,
    modelo: row.modelo,
    transportistaId: row.transportista_id,
  };
}

export const publicacionAdminService = {
  async getAdminDetail(
    publicacionId: number,
    empresaId: number,
  ): Promise<PublicacionAdminDetail | null> {
    const publicacion = await publicacionAdminRepository.getPublicacionForEmpresa(
      publicacionId,
      empresaId,
    );

    if (!publicacion) {
      return null;
    }

    const postulaciones =
      await publicacionAdminRepository.getPostulacionesByPublicacion(publicacionId);

    return {
      id: publicacion.id,
      estado: publicacion.estado as PublicacionAdminDetail["estado"],
      codigo: publicacion.codigo,
      origenNombre: publicacion.origen_nombre,
      destinoNombre: publicacion.destino_nombre,
      tipoCarga: publicacion.tipo_carga,
      peso: publicacion.peso,
      totalPago: publicacion.total_pago,
      fechaSalida: publicacion.fecha_salida,
      cargaPeligrosa: publicacion.carga_peligrosa,
      postulaciones: postulaciones.map(mapPostulacion),
    };
  },
};
