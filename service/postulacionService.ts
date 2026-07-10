import { db } from "@/db";
import { postulaciones, viajes } from "@/db/schema";
import { fleteRepository } from "@/repositories/fleteRepository";
import { flotaRepository } from "@/repositories/flotaRepository";
import { postulacionRepository } from "@/repositories/postulacionRepository";
import { publicacionRepository } from "@/repositories/publicacionRepository";
import { transportistaHomeRepository } from "@/repositories/transportistaHomeRepository";
import { transportistaRepository } from "@/repositories/transportistaRepository";
import { viajeRepository } from "@/repositories/viajeRepository";
import { realtimeBroadcastService } from "@/service/realtimeBroadcastService";
import {
  ESTADO_FLETE,
  ESTADO_POSTULACION_ID,
  ESTADO_PUBLICACION,
  ESTADO_VIAJE_ID,
  FASE_VIAJE,
} from "@/lib/fletes/constants";
import {
  mapActiveViajeRow,
  toPostulacionAcceptedPayload,
} from "@/lib/viajes/active-viaje";
import { billingService } from "@/service/billingService";
import { and, eq, ne } from "drizzle-orm";

export type PostulacionServiceResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      code?: string;
      redirectTo?: string;
    };

export const postulacionService = {
  async apply(
    publicacionId: number,
    transportistaId: number,
    flotaId: number,
  ): Promise<PostulacionServiceResult<{ postulacionId: number }>> {
    try {
      const publicacion = await publicacionRepository.getById(publicacionId);
      if (!publicacion || publicacion.estado !== ESTADO_PUBLICACION.PUBLICADO) {
        return {
          success: false,
          error: "La publicación no está disponible para postular",
        };
      }

      const alreadyApplied = await postulacionRepository.existsForPublicacion(
        publicacionId,
        transportistaId,
      );
      if (alreadyApplied) {
        return {
          success: false,
          error: "Ya postulaste a esta publicación",
        };
      }

      const vehiculo = await flotaRepository.getByIdAndTransportista(
        flotaId,
        transportistaId,
      );
      if (!vehiculo) {
        return {
          success: false,
          error: "El vehículo seleccionado no pertenece al transportista",
        };
      }

      const transportista = await transportistaRepository.getById(transportistaId);
      if (!transportista) {
        return { success: false, error: "Transportista no encontrado" };
      }

      const billingCheck =
        billingService.assertTransportistaCanApply(transportista);
      if (!billingCheck.success) {
        return billingCheck;
      }

      const postulacion = await postulacionRepository.create({
        id_publicacion: publicacionId,
        id_transportista: transportistaId,
        id_flota: flotaId,
        id_estado: ESTADO_POSTULACION_ID.PENDIENTE,
      });

      const flete = await fleteRepository.getById(publicacion.id_flete);
      const transportistaForBroadcast =
        transportista ?? (await transportistaRepository.getById(transportistaId));

      if (flete && transportistaForBroadcast && vehiculo) {
        await realtimeBroadcastService.publishPostulacionCreated(
          {
            postulacionId: postulacion.id,
            publicacionId,
            transportistaId,
            transportistaNombre: `${transportistaForBroadcast.nombre} ${transportistaForBroadcast.apellido}`.trim(),
            nombre: transportistaForBroadcast.nombre,
            apellido: transportistaForBroadcast.apellido,
            placa: vehiculo.placa,
            marca: vehiculo.marca,
            modelo: vehiculo.modelo,
            codigo: flete.codigo,
            createdAt: new Date().toISOString(),
          },
          publicacion.id_empresa,
        );
      }

      return { success: true, data: { postulacionId: postulacion.id } };
    } catch {
      return { success: false, error: "Error al registrar la postulación" };
    }
  },

  async applyForUser(
    userId: number,
    publicacionId: number,
    flotaId?: number,
  ): Promise<PostulacionServiceResult<{ postulacionId: number }>> {
    const transportista = await transportistaRepository.getByUserId(userId);
    if (!transportista) {
      return { success: false, error: "Perfil de transportista no encontrado" };
    }

    let resolvedFlotaId = flotaId;
    if (!resolvedFlotaId) {
      const flotas = await flotaRepository.getByTransportista(transportista.id);
      resolvedFlotaId = flotas[0]?.id;
    }

    if (!resolvedFlotaId) {
      return {
        success: false,
        error: "No tienes vehículos registrados para postular",
      };
    }

    return this.apply(publicacionId, transportista.id, resolvedFlotaId);
  },

  async getApplicationStatus(
    userId: number,
    publicacionId: number,
  ): Promise<
    PostulacionServiceResult<{ applied: boolean; postulacionId?: number }>
  > {
    try {
      const transportista = await transportistaRepository.getByUserId(userId);
      if (!transportista) {
        return { success: false, error: "Perfil de transportista no encontrado" };
      }

      const existing = await postulacionRepository.existsForPublicacion(
        publicacionId,
        transportista.id,
      );

      if (!existing) {
        return { success: true, data: { applied: false } };
      }

      const postulacionesForPublicacion =
        await postulacionRepository.getByPublicacion(publicacionId);
      const mine = postulacionesForPublicacion.find(
        (item) => item.id_transportista === transportista.id,
      );

      return {
        success: true,
        data: {
          applied: true,
          postulacionId: mine?.id,
        },
      };
    } catch {
      return { success: false, error: "Error al consultar la postulación" };
    }
  },

  async accept(
    postulacionId: number,
    empresaId: number,
  ): Promise<PostulacionServiceResult<{ viajeId: number }>> {
    try {
      const postulacion = await postulacionRepository.getById(postulacionId);
      if (!postulacion) {
        return { success: false, error: "Postulación no encontrada" };
      }

      const publicacion = await publicacionRepository.getByIdForEmpresa(
        postulacion.id_publicacion,
        empresaId,
      );
      if (!publicacion) {
        return {
          success: false,
          error: "No tienes permiso para gestionar esta postulación",
        };
      }

      if (postulacion.id_estado !== ESTADO_POSTULACION_ID.PENDIENTE) {
        return {
          success: false,
          error: "Solo se pueden aceptar postulaciones pendientes",
        };
      }

      const flete = await fleteRepository.getById(publicacion.id_flete);
      if (!flete) {
        return { success: false, error: "Flete asociado no encontrado" };
      }

      const viajeId = await db.transaction(async (tx) => {
        await tx
          .update(postulaciones)
          .set({
            id_estado: ESTADO_POSTULACION_ID.ACEPTADA,
            updatedAt: new Date(),
          })
          .where(eq(postulaciones.id, postulacionId));

        await tx
          .update(postulaciones)
          .set({
            id_estado: ESTADO_POSTULACION_ID.RECHAZADA,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(postulaciones.id_publicacion, publicacion.id),
              eq(postulaciones.id_estado, ESTADO_POSTULACION_ID.PENDIENTE),
              ne(postulaciones.id, postulacionId),
            ),
          );

        const [viaje] = await tx
          .insert(viajes)
          .values({
            id_flete: flete.id,
            id_publicacion: publicacion.id,
            id_postulacion: postulacionId,
            id_transportista: postulacion.id_transportista,
            id_empresa: empresaId,
            id_flota: postulacion.id_flota,
            id_estado: ESTADO_VIAJE_ID.EN_CURSO,
            fase: FASE_VIAJE.ASIGNADO,
            fecha_inicio: flete.fecha_salida,
            fecha_fin: flete.fecha_entrega_estimada,
            pagado: Number(flete.total_pago),
          })
          .returning();

        return viaje.id;
      });

      await fleteRepository.updateEstado(flete.id, ESTADO_FLETE.EN_TRANSITO);

      await transportistaHomeRepository.updateDisponibleByTransportistaId(
        postulacion.id_transportista,
        false,
      );

      const activeRow = await viajeRepository.getActiveForTransportista(
        postulacion.id_transportista,
      );
      const activeDetail = activeRow ? mapActiveViajeRow(activeRow) : null;

      await realtimeBroadcastService.publishPostulacionAccepted(
        {
          postulacionId,
          publicacionId: publicacion.id,
          transportistaId: postulacion.id_transportista,
        },
        empresaId,
      );

      if (activeDetail) {
        await realtimeBroadcastService.publishPostulacionAcceptedToTransportista(
          toPostulacionAcceptedPayload(
            activeDetail,
            postulacion.id_transportista,
          ),
        );
      }

      return { success: true, data: { viajeId } };
    } catch {
      return { success: false, error: "Error al aceptar la postulación" };
    }
  },

  async reject(
    postulacionId: number,
    empresaId: number,
  ): Promise<PostulacionServiceResult<{ postulacionId: number }>> {
    try {
      const postulacion = await postulacionRepository.getById(postulacionId);
      if (!postulacion) {
        return { success: false, error: "Postulación no encontrada" };
      }

      const publicacion = await publicacionRepository.getByIdForEmpresa(
        postulacion.id_publicacion,
        empresaId,
      );
      if (!publicacion) {
        return {
          success: false,
          error: "No tienes permiso para gestionar esta postulación",
        };
      }

      if (postulacion.id_estado !== ESTADO_POSTULACION_ID.PENDIENTE) {
        return {
          success: false,
          error: "Solo se pueden rechazar postulaciones pendientes",
        };
      }

      await postulacionRepository.updateEstado(
        postulacionId,
        ESTADO_POSTULACION_ID.RECHAZADA,
      );

      await realtimeBroadcastService.publishPostulacionRejected(
        {
          postulacionId,
          publicacionId: postulacion.id_publicacion,
          transportistaId: postulacion.id_transportista,
        },
        empresaId,
      );

      return { success: true, data: { postulacionId } };
    } catch {
      return { success: false, error: "Error al rechazar la postulación" };
    }
  },
};
