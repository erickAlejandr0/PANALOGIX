import type { Empresa } from "@/db/schema";
import {
  formatClienteDesde,
  formatPerfilFecha,
} from "@/lib/perfil/format";
import type {
  EmpresaPerfilMetodoPago,
  EmpresaPerfilPageData,
  EmpresaPerfilPagoHistorial,
} from "@/lib/perfil/empresa-perfil-types";
import { formatCurrencyUsd } from "@/lib/publicaciones/format";
import { PAYMENT_ESCROW_STATUS } from "@/lib/stripe/config";
import { isEmpresaBillingReady } from "@/service/billingService";
import { empresaPerfilRepository } from "@/repositories/empresaPerfilRepository";
import { escrowRepository } from "@/repositories/escrowRepository";

function mapCardBrand(
  brand: string | null | undefined,
): EmpresaPerfilMetodoPago["marca"] {
  if (brand === "mastercard") return "mastercard";
  if (brand === "visa") return "visa";
  return "generica";
}

function mapEscrowEstado(
  status: string,
): EmpresaPerfilPagoHistorial["estado"] {
  switch (status) {
    case PAYMENT_ESCROW_STATUS.RELEASED:
      return "liberada";
    case PAYMENT_ESCROW_STATUS.REFUNDED:
      return "reembolsada";
    case PAYMENT_ESCROW_STATUS.HELD:
      return "reservada";
    default:
      return "pagada";
  }
}

export const empresaPerfilService = {
  getEmpresaPerfilPage: async (
    empresa: Empresa,
    email: string,
  ): Promise<EmpresaPerfilPageData> => {
    const entregasEsteMes =
      await empresaPerfilRepository.countEntregasCompletadasEsteMes(empresa.id);
    const billingReady = isEmpresaBillingReady(empresa);
    const escrows = await escrowRepository.listByEmpresa(empresa.id, 10);

    const metodosPago: EmpresaPerfilMetodoPago[] =
      empresa.billingPaymentMethodLast4 &&
      empresa.billingPaymentMethodBrand
        ? [
            {
              id: empresa.stripeDefaultPaymentMethodId ?? "default",
              marca: mapCardBrand(empresa.billingPaymentMethodBrand),
              ultimosCuatro: empresa.billingPaymentMethodLast4,
              expiracion:
                empresa.billingPaymentMethodExpMonth &&
                empresa.billingPaymentMethodExpYear
                  ? `${String(empresa.billingPaymentMethodExpMonth).padStart(2, "0")}/${String(empresa.billingPaymentMethodExpYear).slice(-2)}`
                  : "--/--",
              principal: true,
            },
          ]
        : [];

    const historialPagos: EmpresaPerfilPagoHistorial[] = escrows.map(
      (escrow) => ({
        id: String(escrow.id),
        fecha: formatPerfilFecha(escrow.heldAt ?? escrow.createdAt),
        monto: formatCurrencyUsd(escrow.amountCents / 100),
        estado: mapEscrowEstado(escrow.status),
        referencia: escrow.stripeTransferId ?? escrow.stripePaymentIntentId,
      }),
    );

    return {
      empresa: {
        nombre: empresa.nombre,
        ruc: empresa.ruc,
        verificada: true,
        ultimaActualizacion: formatPerfilFecha(empresa.updatedAt),
        contacto: {
          email,
          telefono: empresa.telefono,
          direccion: empresa.direccion,
        },
      },
      resumen: {
        planActivo: "Empresarial",
        clienteDesde: formatClienteDesde(empresa.createdAt),
        entregasEsteMes,
      },
      metodosPago,
      historialPagos,
      billingReady,
      showBillingSetup: !billingReady,
    };
  },
};
