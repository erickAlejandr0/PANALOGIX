import { db } from "@/db";
import { flota, transportistas } from "@/db/schema";
import { empresaRepository } from "@/repositories/empresaRepository";
import { vehiculoConfigRepository } from "@/repositories/vehiculoConfigRepository";
import type { TransportistaOnboardingInput } from "@/lib/validations/onboarding";
import {
  buildConfigDetalle,
  getConfigSelectorLabel,
} from "@/lib/vehiculos/config-detail";
import { VEHICULO_MARCAS } from "@/lib/vehiculos/marcas";
import { authService, type AuthResult } from "@/service/authService";
import { eq } from "drizzle-orm";

export const onboardingService = {
  async completeEmpresaOnboarding(
    userId: number,
    data: {
      nombre: string;
      ruc: string;
      direccion: string;
      telefono: string;
    },
  ): Promise<AuthResult> {
    try {
      const existing = await empresaRepository.getByUserId(userId);
      if (!existing) {
        await empresaRepository.create({
          nombre: data.nombre,
          ruc: data.ruc,
          direccion: data.direccion,
          telefono: data.telefono,
          id_usuario: userId,
        });
      }

      return await authService.completeOnboarding(userId);
    } catch {
      return {
        success: false,
        error: "Error interno al completar onboarding de empresa",
      };
    }
  },

  async completeTransportistaOnboarding(
    userId: number,
    data: TransportistaOnboardingInput,
  ): Promise<AuthResult> {
    try {
      const configValid = await vehiculoConfigRepository.configExistsInCategoria(
        data.flota.id_config,
        data.id_categoria,
      );
      if (!configValid) {
        return {
          success: false,
          error:
            "La configuración seleccionada no pertenece a la categoría indicada",
        };
      }

      const config = await vehiculoConfigRepository.getConfigWithDetail(
        data.flota.id_config,
      );
      if (!config) {
        return {
          success: false,
          error: "Configuración de vehículo no encontrada",
        };
      }

      await db.transaction(async (tx) => {
        let transportista = await tx.query.transportistas.findFirst({
          where: eq(transportistas.id_usuario, userId),
        });

        if (!transportista) {
          const [created] = await tx
            .insert(transportistas)
            .values({
              nombre: data.nombre,
              apellido: data.apellido,
              cedula: data.cedula,
              direccion: data.direccion,
              telefono: data.telefono,
              id_usuario: userId,
            })
            .returning();
          transportista = created;
        }

        const existingFlota = await tx.query.flota.findFirst({
          where: eq(flota.id_transportista, transportista.id),
        });

        if (!existingFlota) {
          await tx.insert(flota).values({
            id_config: data.flota.id_config,
            placa: data.flota.placa,
            marca: data.flota.marca,
            modelo: data.flota.modelo,
            anio: data.flota.anio,
            estado: "activo",
            id_transportista: transportista.id,
          });
        }
      });

      return await authService.completeOnboarding(userId);
    } catch {
      return {
        success: false,
        error: "Error interno al completar onboarding de transportista",
      };
    }
  },

  async getCategorias() {
    return vehiculoConfigRepository.getCategorias();
  },

  async getConfigsByCategoria(categoriaId: number) {
    const configs =
      await vehiculoConfigRepository.getConfigsByCategoria(categoriaId);

    return configs.map((config) => ({
      id: config.id,
      label: getConfigSelectorLabel(config),
      nombreComun: config.nombreComun,
      codigo: config.codigo,
      capacidadMaxTon: config.capacidadMaxTon,
      licenciaRequerida: config.licenciaRequerida,
    }));
  },

  getMarcas() {
    return [...VEHICULO_MARCAS];
  },

  async getConfigDetalle(configId: number) {
    const config = await vehiculoConfigRepository.getConfigWithDetail(configId);
    if (!config) return null;
    return buildConfigDetalle(config);
  },
};
