import { ESTADO_VIAJE_ID } from "@/lib/fletes/constants";
import { centsToDollars } from "@/lib/stripe/config";
import type {
  CompletedViajeDetailRow,
  CompletedViajeListRow,
} from "@/repositories/transportistaViajesHistorialRepository";
import { transportistaViajesHistorialRepository } from "@/repositories/transportistaViajesHistorialRepository";

export type TransportistaViajeHistorialItem = {
  viajeId: number;
  codigo: string;
  rutaLabel: string;
  origenNombre: string;
  destinoNombre: string;
  monto: string;
  completadoEn: string;
  distanceKm: number;
};

export type TransportistaViajeHistorialDetail = TransportistaViajeHistorialItem & {
  publicacionId: number;
  peso: number;
  tipoCarga: string;
  fechaSalida: string;
  fechaEntrega: string;
  nombreEmpresa: string;
  transportistaPayout: string | null;
  platformFee: string | null;
  stripeFee: string | null;
  stripeTransferId: string | null;
  stripePaymentIntentId: string | null;
  paymentStatus: string | null;
  totalPago: string;
};

export type TransportistaViajesHistorialPage = {
  gananciasTotales: string;
  viajes: TransportistaViajeHistorialItem[];
};

function shortPlaceName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "—";
  const [first] = trimmed.split(",");
  return first?.trim() || trimmed;
}

function buildRutaLabel(origenNombre: string, destinoNombre: string) {
  return `${shortPlaceName(origenNombre)} → ${shortPlaceName(destinoNombre)}`;
}

function resolveMonto(
  totalPago: string,
  pagado: number,
  transportistaPayoutCents: number | null,
) {
  if (transportistaPayoutCents != null) {
    return centsToDollars(transportistaPayoutCents).toFixed(2);
  }

  if (Number.isFinite(pagado) && pagado > 0) {
    return pagado.toFixed(2);
  }

  const parsed = Number.parseFloat(totalPago);
  if (Number.isFinite(parsed)) {
    return parsed.toFixed(2);
  }

  return "0.00";
}

function mapListRow(row: CompletedViajeListRow): TransportistaViajeHistorialItem {
  return {
    viajeId: row.viaje_id,
    codigo: row.codigo,
    rutaLabel: buildRutaLabel(row.origen_nombre, row.destino_nombre),
    origenNombre: row.origen_nombre,
    destinoNombre: row.destino_nombre,
    monto: resolveMonto(
      row.total_pago,
      row.pagado,
      row.transportista_payout_cents,
    ),
    completadoEn: row.completado_en,
    distanceKm: Math.round(row.distance_km * 10) / 10,
  };
}

function mapDetailRow(
  row: CompletedViajeDetailRow,
): TransportistaViajeHistorialDetail {
  const monto = resolveMonto(
    row.total_pago,
    row.pagado,
    row.transportista_payout_cents,
  );

  return {
    viajeId: row.viaje_id,
    publicacionId: row.publicacion_id,
    codigo: row.codigo,
    rutaLabel: buildRutaLabel(row.origen_nombre, row.destino_nombre),
    origenNombre: row.origen_nombre,
    destinoNombre: row.destino_nombre,
    monto,
    completadoEn: row.completado_en,
    distanceKm: Math.round(row.distance_km * 10) / 10,
    peso: row.peso,
    tipoCarga: row.tipo_carga,
    fechaSalida: row.fecha_salida,
    fechaEntrega: row.fecha_entrega_estimada,
    nombreEmpresa: row.nombre_empresa,
    transportistaPayout:
      row.transportista_payout_cents != null
        ? centsToDollars(row.transportista_payout_cents).toFixed(2)
        : monto,
    platformFee:
      row.platform_fee_cents != null
        ? centsToDollars(row.platform_fee_cents).toFixed(2)
        : null,
    stripeFee:
      row.stripe_fee_cents != null
        ? centsToDollars(row.stripe_fee_cents).toFixed(2)
        : null,
    stripeTransferId: row.stripe_transfer_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    paymentStatus: row.payment_status,
    totalPago: row.total_pago,
  };
}

export const transportistaViajesHistorialService = {
  getHistorialPage: async (
    transportistaId: number,
  ): Promise<TransportistaViajesHistorialPage> => {
    const [rows, gananciasTotales] = await Promise.all([
      transportistaViajesHistorialRepository.listCompleted(transportistaId),
      transportistaViajesHistorialRepository.sumCompletedEarnings(
        transportistaId,
      ),
    ]);

    return {
      gananciasTotales: gananciasTotales.toFixed(2),
      viajes: rows.map(mapListRow),
    };
  },

  getViajeDetail: async (
    transportistaId: number,
    viajeId: number,
  ): Promise<TransportistaViajeHistorialDetail | null> => {
    const row = await transportistaViajesHistorialRepository.getCompletedDetail(
      viajeId,
      transportistaId,
    );

    if (!row) {
      return null;
    }

    return mapDetailRow(row);
  },
};
