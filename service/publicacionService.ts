import { fleteRepository } from "@/repositories/fleteRepository";
import { publicacionRepository } from "@/repositories/publicacionRepository";
import { billingRepository } from "@/repositories/billingRepository";
import { realtimeBroadcastService } from "@/service/realtimeBroadcastService";
import { billingService } from "@/service/billingService";
import { escrowService } from "@/service/escrowService";
import { ESTADO_PUBLICACION } from "@/lib/fletes/constants";

export type PublicacionServiceResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      code?: string;
      redirectTo?: string;
    };

export const publicacionService = {
  async publish(
    publicacionId: number,
    empresaId: number,
  ): Promise<PublicacionServiceResult<{ publicacionId: number }>> {
    try {
      const publicacion = await publicacionRepository.getByIdForEmpresa(
        publicacionId,
        empresaId,
      );

      if (!publicacion) {
        return { success: false, error: "Publicación no encontrada" };
      }

      if (publicacion.estado === ESTADO_PUBLICACION.PUBLICADO) {
        return { success: false, error: "La publicación ya está publicada" };
      }

      const empresa = await billingRepository.getEmpresaById(empresaId);
      if (!empresa) {
        return { success: false, error: "Empresa no encontrada" };
      }

      const billingCheck = billingService.assertEmpresaCanPublish(empresa);
      if (!billingCheck.success) {
        return billingCheck;
      }

      const flete = await fleteRepository.getById(publicacion.id_flete);
      if (!flete) {
        return { success: false, error: "Flete asociado no encontrado" };
      }

      const hold = await escrowService.holdFundsForPublication(
        empresa,
        publicacionId,
        flete.id,
        flete.total_pago,
      );

      if (!hold.success) {
        return hold;
      }

      await publicacionRepository.updateEstado(
        publicacionId,
        ESTADO_PUBLICACION.PUBLICADO,
      );

      await realtimeBroadcastService.publishPublicacionPublished(
        publicacionId,
        empresaId,
      );

      return { success: true, data: { publicacionId } };
    } catch {
      return { success: false, error: "Error al publicar la oferta" };
    }
  },

  async listPublishedForTransportista(): Promise<
    PublicacionServiceResult<
      Awaited<ReturnType<typeof publicacionRepository.getPublishedForTransportistas>>
    >
  > {
    try {
      const rows = await publicacionRepository.getPublishedForTransportistas();
      return { success: true, data: rows };
    } catch {
      return {
        success: false,
        error: "Error al listar publicaciones disponibles",
      };
    }
  },

  async listPublishedByEmpresa(empresaId: number): Promise<
    PublicacionServiceResult<
      Awaited<ReturnType<typeof publicacionRepository.getPublishedByEmpresa>>
    >
  > {
    try {
      const rows = await publicacionRepository.getPublishedByEmpresa(empresaId);
      return { success: true, data: rows };
    } catch {
      return { success: false, error: "Error al listar publicaciones" };
    }
  },
};
