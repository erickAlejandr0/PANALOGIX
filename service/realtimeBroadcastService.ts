import {
  buildEmpresaCapabilities,
  buildTransportistaCapabilities,
  serializeCapabilities,
} from "@/lib/events/capabilities";
import { empresaChannel, transportistaChannel, viajeChannel } from "@/lib/events/channels";
import { publishDomainEvent } from "@/lib/events/publisher";
import { DOMAIN_EVENT_NAMES } from "@/lib/events/types";
import type {
  PostulacionAcceptedTransportistaPayload,
  PostulacionCreatedPayload,
  PostulacionStatusPayload,
  PublicacionArchivedPayload,
  PublicacionNearbyPayload,
  PublicacionPublishedPayload,
  TransportistaLocationUpdatedPayload,
  ViajeCompletedPayload,
  ViajeFaseUpdatedPayload,
  ViajeInspeccionChecklistUpdatedPayload,
  ViajeNegociacionResumenPayload,
  ViajeProximityAlertPayload,
  ViajeStartedPayload,
} from "@/lib/events/types";
import { getPointCoordinates } from "@/lib/mapbox/geometry";
import { breakdownToDto, buildPaymentBreakdown } from "@/lib/stripe/fees";
import type { MapPublication } from "@/lib/dashboard/map-publications";
import { publicacionRepository } from "@/repositories/publicacionRepository";
import { transportistaLocationRepository } from "@/repositories/transportistaLocationRepository";

const NEARBY_BROADCAST_RADIUS_M = 100_000;

function mapPublicationRow(row: {
  id: number;
  codigo: string;
  origen_nombre: string;
  destino_nombre: string;
  origen_geom: unknown;
  destino_geom: unknown;
}): MapPublication | null {
  const origen = getPointCoordinates(row.origen_geom);
  const destino = getPointCoordinates(row.destino_geom);
  if (!origen || !destino) return null;

  return {
    id: row.id,
    codigo: row.codigo,
    origenNombre: row.origen_nombre,
    destinoNombre: row.destino_nombre,
    origen,
    destino,
  };
}

function mapNearbyPayload(
  row: Awaited<
    ReturnType<typeof publicacionRepository.getPublishedDetailById>
  >,
  distanceM: number,
): PublicacionNearbyPayload | null {
  if (!row) return null;

  const origen = getPointCoordinates(row.origen_geom);
  const destino = getPointCoordinates(row.destino_geom);
  if (!origen || !destino) return null;

  return {
    publicacionId: row.publicacion_id,
    codigo: row.codigo,
    origenNombre: row.origen_nombre,
    destinoNombre: row.destino_nombre,
    origen: { lng: origen[0], lat: origen[1] },
    destino: { lng: destino[0], lat: destino[1] },
    totalPago: row.total_pago,
    peso: row.peso,
    fechaSalida: row.fecha_salida,
    distanceKm: Math.round((distanceM / 1000) * 10) / 10,
    nombreEmpresa: row.nombre_empresa,
    cargaPeligrosa: row.carga_peligrosa,
    pagoDesglose: (() => {
      const breakdown = buildPaymentBreakdown(row.total_pago);
      return breakdown ? breakdownToDto(breakdown) : null;
    })(),
  };
}

export const realtimeBroadcastService = {
  async publishTransportistaLocation(
    payload: TransportistaLocationUpdatedPayload,
    empresaIds: number[],
  ) {
    const publishes = [
      publishDomainEvent(
        transportistaChannel(payload.transportistaId),
        DOMAIN_EVENT_NAMES.TRANSPORTISTA_LOCATION_UPDATED,
        payload,
      ),
    ];

    if (payload.viajeId !== null) {
      publishes.push(
        publishDomainEvent(
          viajeChannel(payload.viajeId),
          DOMAIN_EVENT_NAMES.TRANSPORTISTA_LOCATION_UPDATED,
          payload,
        ),
      );
    }

    for (const empresaId of empresaIds) {
      publishes.push(
        publishDomainEvent(
          empresaChannel(empresaId),
          DOMAIN_EVENT_NAMES.TRANSPORTISTA_LOCATION_UPDATED,
          payload,
        ),
      );
    }

    await Promise.all(publishes);
  },

  async publishPublicacionPublished(publicacionId: number, empresaId: number) {
    const row = await publicacionRepository.getPublishedDetailById(publicacionId);
    if (!row) return;

    const publication = mapPublicationRow({
      id: row.publicacion_id,
      codigo: row.codigo,
      origen_nombre: row.origen_nombre,
      destino_nombre: row.destino_nombre,
      origen_geom: row.origen_geom,
      destino_geom: row.destino_geom,
    });

    if (!publication) return;

    const origen = getPointCoordinates(row.origen_geom);
    if (!origen) return;

    const publishedPayload: PublicacionPublishedPayload = { publication };

    await publishDomainEvent(
      empresaChannel(empresaId),
      DOMAIN_EVENT_NAMES.PUBLICACION_PUBLISHED,
      publishedPayload,
    );

    const nearbyTransportistas =
      await transportistaLocationRepository.findDisponibleNearPoint(
        origen[0],
        origen[1],
        NEARBY_BROADCAST_RADIUS_M,
      );

    await Promise.all(
      nearbyTransportistas.map(async (transportista) => {
        const nearbyPayload = mapNearbyPayload(row, transportista.distance_m);
        if (!nearbyPayload) return;

        await publishDomainEvent(
          transportistaChannel(transportista.transportista_id),
          DOMAIN_EVENT_NAMES.PUBLICACION_NEARBY,
          nearbyPayload,
        );
      }),
    );
  },

  async publishPostulacionCreated(
    payload: PostulacionCreatedPayload,
    empresaId: number,
  ) {
    await publishDomainEvent(
      empresaChannel(empresaId),
      DOMAIN_EVENT_NAMES.POSTULACION_CREATED,
      payload,
    );
  },

  async publishPostulacionAccepted(
    payload: PostulacionStatusPayload,
    empresaId: number,
  ) {
    await publishDomainEvent(
      empresaChannel(empresaId),
      DOMAIN_EVENT_NAMES.POSTULACION_ACCEPTED,
      payload,
    );
  },

  async publishPostulacionRejected(
    payload: PostulacionStatusPayload,
    empresaId: number,
  ) {
    await publishDomainEvent(
      empresaChannel(empresaId),
      DOMAIN_EVENT_NAMES.POSTULACION_REJECTED,
      payload,
    );
  },

  async publishPostulacionAcceptedToTransportista(
    payload: PostulacionAcceptedTransportistaPayload,
  ) {
    await publishDomainEvent(
      transportistaChannel(payload.transportistaId),
      DOMAIN_EVENT_NAMES.POSTULACION_ACCEPTED,
      payload,
    );
  },

  async publishViajeStarted(
    payload: ViajeStartedPayload,
    transportistaId: number,
  ) {
    await publishDomainEvent(
      transportistaChannel(transportistaId),
      DOMAIN_EVENT_NAMES.VIAJE_STARTED,
      payload,
    );
  },

  async publishViajeFaseUpdated(
    payload: ViajeFaseUpdatedPayload,
    transportistaId: number,
    empresaId: number,
  ) {
    await Promise.all([
      publishDomainEvent(
        transportistaChannel(transportistaId),
        DOMAIN_EVENT_NAMES.VIAJE_FASE_UPDATED,
        payload,
      ),
      publishDomainEvent(
        empresaChannel(empresaId),
        DOMAIN_EVENT_NAMES.VIAJE_FASE_UPDATED,
        payload,
      ),
      publishDomainEvent(
        viajeChannel(payload.viajeId),
        DOMAIN_EVENT_NAMES.VIAJE_FASE_UPDATED,
        payload,
      ),
    ]);
  },

  async publishViajeProximityAlert(
    payload: ViajeProximityAlertPayload,
    empresaId: number,
  ) {
    await Promise.all([
      publishDomainEvent(
        empresaChannel(empresaId),
        DOMAIN_EVENT_NAMES.VIAJE_PROXIMITY_ALERT,
        payload,
      ),
      publishDomainEvent(
        viajeChannel(payload.viajeId),
        DOMAIN_EVENT_NAMES.VIAJE_PROXIMITY_ALERT,
        payload,
      ),
    ]);
  },

  async publishViajeCompleted(
    payload: ViajeCompletedPayload,
    transportistaId: number,
    empresaId: number,
  ) {
    await Promise.all([
      publishDomainEvent(
        transportistaChannel(transportistaId),
        DOMAIN_EVENT_NAMES.VIAJE_COMPLETED,
        payload,
      ),
      publishDomainEvent(
        empresaChannel(empresaId),
        DOMAIN_EVENT_NAMES.VIAJE_COMPLETED,
        payload,
      ),
      publishDomainEvent(
        viajeChannel(payload.viajeId),
        DOMAIN_EVENT_NAMES.VIAJE_COMPLETED,
        payload,
      ),
    ]);
  },

  async publishPublicacionArchived(
    payload: PublicacionArchivedPayload,
    empresaId: number,
  ) {
    await publishDomainEvent(
      empresaChannel(empresaId),
      DOMAIN_EVENT_NAMES.PUBLICACION_ARCHIVED,
      payload,
    );
  },

  async publishViajeNegociacionResumen(
    payload: ViajeNegociacionResumenPayload,
    transportistaId: number,
    empresaId: number,
  ) {
    await Promise.all([
      publishDomainEvent(
        transportistaChannel(transportistaId),
        DOMAIN_EVENT_NAMES.VIAJE_NEGOCIACION_RESUMEN,
        payload,
      ),
      publishDomainEvent(
        empresaChannel(empresaId),
        DOMAIN_EVENT_NAMES.VIAJE_NEGOCIACION_RESUMEN,
        payload,
      ),
      publishDomainEvent(
        viajeChannel(payload.viajeId),
        DOMAIN_EVENT_NAMES.VIAJE_NEGOCIACION_RESUMEN,
        payload,
      ),
    ]);
  },

  async publishViajeInspeccionChecklistUpdated(
    payload: ViajeInspeccionChecklistUpdatedPayload,
    transportistaId: number,
    empresaId: number,
  ) {
    await Promise.all([
      publishDomainEvent(
        transportistaChannel(transportistaId),
        DOMAIN_EVENT_NAMES.VIAJE_INSPECCION_CHECKLIST_UPDATED,
        payload,
      ),
      publishDomainEvent(
        empresaChannel(empresaId),
        DOMAIN_EVENT_NAMES.VIAJE_INSPECCION_CHECKLIST_UPDATED,
        payload,
      ),
      publishDomainEvent(
        viajeChannel(payload.viajeId),
        DOMAIN_EVENT_NAMES.VIAJE_INSPECCION_CHECKLIST_UPDATED,
        payload,
      ),
    ]);
  },

  buildEmpresaTokenCapability(empresaId: number, activeViajeIds: number[]) {
    return serializeCapabilities(
      buildEmpresaCapabilities(empresaId, activeViajeIds),
    );
  },

  buildTransportistaTokenCapability(transportistaId: number) {
    return serializeCapabilities(
      buildTransportistaCapabilities(transportistaId),
    );
  },
};
