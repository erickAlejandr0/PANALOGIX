import { db } from "@/db";
import { fletes, publicaciones } from "@/db/schema";
import { ESTADO_PUBLICACION } from "@/lib/fletes/constants";
import { makePointSql } from "@/lib/mapbox/point-sql";
import type { CreateFleteInput } from "@/lib/validations/fletes";
import { billingRepository } from "@/repositories/billingRepository";
import { billingService } from "@/service/billingService";
import { escrowService } from "@/service/escrowService";
import { realtimeBroadcastService } from "@/service/realtimeBroadcastService";

export type FleteServiceResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      code?: string;
      redirectTo?: string;
    };

export const fleteService = {
  async createFlete(
    empresaId: number,
    input: CreateFleteInput,
  ): Promise<
    FleteServiceResult<{
      fleteId: number;
      publicacionId: number;
      codigo: string;
    }>
  > {
    try {
      const result = await db.transaction(async (tx) => {
        const [flete] = await tx
          .insert(fletes)
          .values({
            id_empresa: empresaId,
            id_tipo_carga: input.id_tipo_carga,
            fecha_salida: input.fecha_salida,
            fecha_entrega_estimada: input.fecha_entrega_estimada,
            peso: input.peso,
            origen_nombre: input.origen_nombre,
            origen_geom: makePointSql(input.origen.lng, input.origen.lat),
            destino_nombre: input.destino_nombre,
            destino_geom: makePointSql(input.destino.lng, input.destino.lat),
            carga_peligrosa: input.carga_peligrosa,
            total_pago: String(input.total_pago),
          })
          .returning();

        const [publicacion] = await tx
          .insert(publicaciones)
          .values({
            id_flete: flete.id,
            id_empresa: empresaId,
            estado: ESTADO_PUBLICACION.BORRADOR,
          })
          .returning();

        return {
          fleteId: flete.id,
          publicacionId: publicacion.id,
          codigo: flete.codigo,
        };
      });

      return { success: true, data: result };
    } catch {
      return { success: false, error: "Error al crear el flete" };
    }
  },

  async createAndPublishFlete(
    empresaId: number,
    input: CreateFleteInput,
  ): Promise<
    FleteServiceResult<{
      fleteId: number;
      publicacionId: number;
      codigo: string;
    }>
  > {
    try {
      const empresa = await billingRepository.getEmpresaById(empresaId);
      if (!empresa) {
        return { success: false, error: "Empresa no encontrada" };
      }

      const billingCheck = billingService.assertEmpresaCanPublish(empresa);
      if (!billingCheck.success) {
        return billingCheck;
      }

      const result = await db.transaction(async (tx) => {
        const [flete] = await tx
          .insert(fletes)
          .values({
            id_empresa: empresaId,
            id_tipo_carga: input.id_tipo_carga,
            fecha_salida: input.fecha_salida,
            fecha_entrega_estimada: input.fecha_entrega_estimada,
            peso: input.peso,
            origen_nombre: input.origen_nombre,
            origen_geom: makePointSql(input.origen.lng, input.origen.lat),
            destino_nombre: input.destino_nombre,
            destino_geom: makePointSql(input.destino.lng, input.destino.lat),
            carga_peligrosa: input.carga_peligrosa,
            total_pago: String(input.total_pago),
          })
          .returning();

        const [publicacion] = await tx
          .insert(publicaciones)
          .values({
            id_flete: flete.id,
            id_empresa: empresaId,
            estado: ESTADO_PUBLICACION.PUBLICADO,
          })
          .returning();

        return {
          fleteId: flete.id,
          publicacionId: publicacion.id,
          codigo: flete.codigo,
        };
      });

      const hold = await escrowService.holdFundsForPublication(
        empresa,
        result.publicacionId,
        result.fleteId,
        input.total_pago,
      );

      if (!hold.success) {
        await escrowService.revertPublicationAfterFailedPayment(
          result.publicacionId,
          result.fleteId,
        );
        return hold;
      }

      await realtimeBroadcastService.publishPublicacionPublished(
        result.publicacionId,
        empresaId,
      );

      return { success: true, data: result };
    } catch {
      return { success: false, error: "Error al publicar el flete" };
    }
  },
};
