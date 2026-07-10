"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Ably from "ably";

import { DOMAIN_EVENT_NAMES } from "@/lib/events/types";
import type {
  PostulacionCreatedPayload,
  PostulacionStatusPayload,
  PublicacionArchivedPayload,
  PublicacionPublishedPayload,
  TransportistaLocationUpdatedPayload,
  ViajeCompletedPayload,
  ViajeFaseUpdatedPayload,
  ViajeNegociacionResumenPayload,
  ViajeProximityAlertPayload,
} from "@/lib/events/types";
import type { DriverMarker } from "@/lib/dashboard/driver-markers";
import type { DriverRow } from "@/lib/dashboard/driver-table";
import {
  markDriverEntregaCompletada,
  patchDriverFromFase,
} from "@/lib/dashboard/driver-live";
import type { MapPublication } from "@/lib/dashboard/map-publications";
import {
  markEntregaCompletada,
  patchEntregaFromFase,
} from "@/lib/entregas/entregas-live";
import type { EntregaListItem } from "@/lib/entregas/types";
import type {
  ActiveViajeTracking,
  EmpresaTripNotification,
} from "@/lib/realtime/empresa-trip-types";
import type { PublicacionListItem } from "@/lib/publicaciones/list-types";
import { getEmpresaRealtimeClient } from "@/lib/realtime/ably-client";

export type PostulacionDomainEvent =
  | { type: "created"; payload: PostulacionCreatedPayload }
  | { type: "accepted"; payload: PostulacionStatusPayload }
  | { type: "rejected"; payload: PostulacionStatusPayload };

type EmpresaRealtimeContextValue = {
  publications: MapPublication[];
  driverMarkers: DriverMarker[];
  activeCount: number;
  drivers: DriverRow[];
  entregasItems: EntregaListItem[];
  publicacionesList: PublicacionListItem[];
  activeViajes: ActiveViajeTracking[];
  tripNotifications: EmpresaTripNotification[];
  dismissTripNotification: (id: string) => void;
  setInitialData: (data: {
    publications: MapPublication[];
    driverMarkers: DriverMarker[];
    activeCount: number;
    drivers?: DriverRow[];
  }) => void;
  setInitialEntregas: (items: EntregaListItem[]) => void;
  setInitialPublicacionesList: (items: PublicacionListItem[]) => void;
  subscribePostulacionEvents: (
    listener: (event: PostulacionDomainEvent) => void,
  ) => () => void;
};

const EmpresaRealtimeContext =
  createContext<EmpresaRealtimeContextValue | null>(null);

type EmpresaRealtimeProviderProps = {
  empresaId: number | null;
  children: ReactNode;
};

function appendPostulante(
  postulantes: PublicacionListItem["postulantes"],
  nombre: string,
  apellido: string,
) {
  if (postulantes.some((item) => item.nombre === nombre && item.apellido === apellido)) {
    return postulantes;
  }

  if (postulantes.length >= 2) {
    return postulantes;
  }

  return [...postulantes, { nombre, apellido }];
}

function buildNotification(
  partial: Omit<EmpresaTripNotification, "id" | "createdAt">,
): EmpresaTripNotification {
  return {
    ...partial,
    id: `${partial.viajeId}-${partial.type}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
}

export function EmpresaRealtimeProvider({
  empresaId,
  children,
}: EmpresaRealtimeProviderProps) {
  const [publications, setPublications] = useState<MapPublication[]>([]);
  const [driverMarkers, setDriverMarkers] = useState<DriverMarker[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [entregasItems, setEntregasItems] = useState<EntregaListItem[]>([]);
  const [publicacionesList, setPublicacionesList] = useState<PublicacionListItem[]>(
    [],
  );
  const [activeViajes, setActiveViajes] = useState<ActiveViajeTracking[]>([]);
  const [tripNotifications, setTripNotifications] = useState<EmpresaTripNotification[]>(
    [],
  );
  const clientRef = useRef<Ably.Realtime | null>(null);
  const postulacionListenersRef = useRef(
    new Set<(event: PostulacionDomainEvent) => void>(),
  );

  const pushNotification = useCallback(
    (notification: EmpresaTripNotification) => {
      setTripNotifications((current) => [notification, ...current].slice(0, 8));
    },
    [],
  );

  const dismissTripNotification = useCallback((id: string) => {
    setTripNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const emitPostulacionEvent = useCallback((event: PostulacionDomainEvent) => {
    for (const listener of postulacionListenersRef.current) {
      listener(event);
    }
  }, []);

  const removePublicacionFromLiveState = useCallback((publicacionId: number) => {
    setPublications((current) =>
      current.filter((item) => item.id !== publicacionId),
    );
    setPublicacionesList((current) =>
      current.filter((item) => item.id !== publicacionId),
    );
    setActiveCount((count) => Math.max(0, count - 1));
  }, []);

  const removeViajeFromLiveState = useCallback((viajeId: number) => {
    setDriverMarkers((current) =>
      current.filter((marker) => marker.viajeId !== viajeId),
    );
    setActiveViajes((current) =>
      current.filter((item) => item.viajeId !== viajeId),
    );
  }, []);

  const markEntregaAndDriverCompletados = useCallback((viajeId: number) => {
    setEntregasItems((current) =>
      current.map((item) =>
        item.viajeId === viajeId ? markEntregaCompletada(item) : item,
      ),
    );
    setDrivers((current) =>
      current.map((driver) =>
        driver.id === viajeId ? markDriverEntregaCompletada(driver) : driver,
      ),
    );
  }, []);

  const setInitialData = useCallback(
    (data: {
      publications: MapPublication[];
      driverMarkers: DriverMarker[];
      activeCount: number;
      drivers?: DriverRow[];
    }) => {
      setPublications(data.publications);
      setDriverMarkers(data.driverMarkers);
      setActiveCount(data.activeCount);
      if (data.drivers) {
        setDrivers(data.drivers);
      }
    },
    [],
  );

  const setInitialEntregas = useCallback((items: EntregaListItem[]) => {
    setEntregasItems(items);
  }, []);

  const setInitialPublicacionesList = useCallback((items: PublicacionListItem[]) => {
    setPublicacionesList(items);
  }, []);

  const subscribePostulacionEvents = useCallback(
    (listener: (event: PostulacionDomainEvent) => void) => {
      postulacionListenersRef.current.add(listener);
      return () => {
        postulacionListenersRef.current.delete(listener);
      };
    },
    [],
  );

  const handleLocationUpdated = useCallback(
    (payload: TransportistaLocationUpdatedPayload) => {
      setDriverMarkers((current) => {
        const index = current.findIndex(
          (marker) => marker.transportistaId === payload.transportistaId,
        );

        if (index === -1) {
          if (payload.viajeId === null) return current;
          return [
            ...current,
            {
              viajeId: payload.viajeId,
              transportistaId: payload.transportistaId,
              nombre: "Transportista",
              placa: "",
              lng: payload.lng,
              lat: payload.lat,
            },
          ];
        }

        const next = [...current];
        next[index] = {
          ...next[index],
          viajeId: payload.viajeId ?? next[index].viajeId,
          lng: payload.lng,
          lat: payload.lat,
        };
        return next;
      });
    },
    [],
  );

  const handlePublicacionPublished = useCallback(
    (payload: PublicacionPublishedPayload) => {
      setPublications((current) => {
        if (current.some((item) => item.id === payload.publication.id)) {
          return current;
        }
        return [payload.publication, ...current];
      });
      setActiveCount((count) => count + 1);
    },
    [],
  );

  const handlePostulacionCreated = useCallback(
    (payload: PostulacionCreatedPayload) => {
      setPublicacionesList((current) =>
        current.map((item) => {
          if (item.id !== payload.publicacionId) return item;

          return {
            ...item,
            postulacionesCount: item.postulacionesCount + 1,
            postulantes: appendPostulante(
              item.postulantes,
              payload.nombre,
              payload.apellido,
            ),
          };
        }),
      );

      emitPostulacionEvent({ type: "created", payload });
    },
    [emitPostulacionEvent],
  );

  const handlePostulacionAccepted = useCallback(
    (payload: PostulacionStatusPayload) => {
      emitPostulacionEvent({ type: "accepted", payload });
    },
    [emitPostulacionEvent],
  );

  const handlePostulacionRejected = useCallback(
    (payload: PostulacionStatusPayload) => {
      emitPostulacionEvent({ type: "rejected", payload });
    },
    [emitPostulacionEvent],
  );

  const handleViajeFaseUpdated = useCallback(
    (payload: ViajeFaseUpdatedPayload) => {
      setEntregasItems((current) =>
        current.map((item) =>
          item.viajeId === payload.viajeId
            ? patchEntregaFromFase(item, payload)
            : item,
        ),
      );
      setDrivers((current) =>
        current.map((driver) =>
          driver.id === payload.viajeId
            ? patchDriverFromFase(driver, payload)
            : driver,
        ),
      );
      setActiveViajes((current) => {
        const next = current.filter((item) => item.viajeId !== payload.viajeId);
        if (payload.fase !== "completado") {
          next.unshift({
            viajeId: payload.viajeId,
            publicacionId: payload.publicacionId,
            fase: payload.fase,
            faseLabel: payload.faseLabel,
            codigo: payload.codigo,
            origenNombre: payload.origenNombre,
            destinoNombre: payload.destinoNombre,
          });
        }
        return next;
      });

      pushNotification(
        buildNotification({
          viajeId: payload.viajeId,
          publicacionId: payload.publicacionId,
          type: "fase",
          message: `${payload.codigo}: ${payload.faseLabel}`,
        }),
      );
    },
    [pushNotification],
  );

  const handleViajeProximityAlert = useCallback(
    (payload: ViajeProximityAlertPayload) => {
      pushNotification(
        buildNotification({
          viajeId: payload.viajeId,
          publicacionId: payload.publicacionId,
          type: "proximity",
          message: payload.message,
        }),
      );
    },
    [pushNotification],
  );

  const handleViajeCompleted = useCallback(
    (payload: ViajeCompletedPayload) => {
      markEntregaAndDriverCompletados(payload.viajeId);
      removeViajeFromLiveState(payload.viajeId);
      removePublicacionFromLiveState(payload.publicacionId);
      pushNotification(
        buildNotification({
          viajeId: payload.viajeId,
          publicacionId: payload.publicacionId,
          type: "completed",
          message: `Viaje ${payload.codigo} completado y entregado`,
        }),
      );
    },
    [
      markEntregaAndDriverCompletados,
      pushNotification,
      removePublicacionFromLiveState,
      removeViajeFromLiveState,
    ],
  );

  const handleViajeNegociacionResumen = useCallback(
    (payload: ViajeNegociacionResumenPayload) => {
      markEntregaAndDriverCompletados(payload.viajeId);
      removeViajeFromLiveState(payload.viajeId);
      removePublicacionFromLiveState(payload.publicacionId);
      pushNotification(
        buildNotification({
          viajeId: payload.viajeId,
          publicacionId: payload.publicacionId,
          type: "completed",
          message: `Entrega ${payload.codigo} verificada · resumen disponible`,
        }),
      );
    },
    [
      markEntregaAndDriverCompletados,
      pushNotification,
      removePublicacionFromLiveState,
      removeViajeFromLiveState,
    ],
  );

  const handlePublicacionArchived = useCallback(
    (payload: PublicacionArchivedPayload) => {
      removePublicacionFromLiveState(payload.publicacionId);
      removeViajeFromLiveState(payload.viajeId);
      pushNotification(
        buildNotification({
          viajeId: payload.viajeId,
          publicacionId: payload.publicacionId,
          type: "archived",
          message: `Publicación ${payload.codigo} archivada tras la entrega`,
        }),
      );
    },
    [pushNotification, removePublicacionFromLiveState, removeViajeFromLiveState],
  );

  useEffect(() => {
    if (!empresaId) {
      return;
    }

    const client = getEmpresaRealtimeClient();

    clientRef.current = client;

    const channel = client.channels.get(`empresa:${empresaId}`);

    const onLocationUpdated = (message: Ably.Message) => {
      handleLocationUpdated(
        message.data as TransportistaLocationUpdatedPayload,
      );
    };

    const onPublicacionPublished = (message: Ably.Message) => {
      handlePublicacionPublished(message.data as PublicacionPublishedPayload);
    };

    const onPostulacionCreated = (message: Ably.Message) => {
      handlePostulacionCreated(message.data as PostulacionCreatedPayload);
    };

    const onPostulacionAccepted = (message: Ably.Message) => {
      handlePostulacionAccepted(message.data as PostulacionStatusPayload);
    };

    const onPostulacionRejected = (message: Ably.Message) => {
      handlePostulacionRejected(message.data as PostulacionStatusPayload);
    };

    const onViajeFaseUpdated = (message: Ably.Message) => {
      handleViajeFaseUpdated(message.data as ViajeFaseUpdatedPayload);
    };

    const onViajeProximityAlert = (message: Ably.Message) => {
      handleViajeProximityAlert(message.data as ViajeProximityAlertPayload);
    };

    const onViajeCompleted = (message: Ably.Message) => {
      handleViajeCompleted(message.data as ViajeCompletedPayload);
    };

    const onViajeNegociacionResumen = (message: Ably.Message) => {
      handleViajeNegociacionResumen(
        message.data as ViajeNegociacionResumenPayload,
      );
    };

    const onPublicacionArchived = (message: Ably.Message) => {
      handlePublicacionArchived(message.data as PublicacionArchivedPayload);
    };

    channel.subscribe(
      DOMAIN_EVENT_NAMES.TRANSPORTISTA_LOCATION_UPDATED,
      onLocationUpdated,
    );
    channel.subscribe(
      DOMAIN_EVENT_NAMES.PUBLICACION_PUBLISHED,
      onPublicacionPublished,
    );
    channel.subscribe(
      DOMAIN_EVENT_NAMES.POSTULACION_CREATED,
      onPostulacionCreated,
    );
    channel.subscribe(
      DOMAIN_EVENT_NAMES.POSTULACION_ACCEPTED,
      onPostulacionAccepted,
    );
    channel.subscribe(
      DOMAIN_EVENT_NAMES.POSTULACION_REJECTED,
      onPostulacionRejected,
    );
    channel.subscribe(
      DOMAIN_EVENT_NAMES.VIAJE_FASE_UPDATED,
      onViajeFaseUpdated,
    );
    channel.subscribe(
      DOMAIN_EVENT_NAMES.VIAJE_PROXIMITY_ALERT,
      onViajeProximityAlert,
    );
    channel.subscribe(
      DOMAIN_EVENT_NAMES.VIAJE_COMPLETED,
      onViajeCompleted,
    );
    channel.subscribe(
      DOMAIN_EVENT_NAMES.VIAJE_NEGOCIACION_RESUMEN,
      onViajeNegociacionResumen,
    );
    channel.subscribe(
      DOMAIN_EVENT_NAMES.PUBLICACION_ARCHIVED,
      onPublicacionArchived,
    );

    return () => {
      channel.unsubscribe(
        DOMAIN_EVENT_NAMES.TRANSPORTISTA_LOCATION_UPDATED,
        onLocationUpdated,
      );
      channel.unsubscribe(
        DOMAIN_EVENT_NAMES.PUBLICACION_PUBLISHED,
        onPublicacionPublished,
      );
      channel.unsubscribe(
        DOMAIN_EVENT_NAMES.POSTULACION_CREATED,
        onPostulacionCreated,
      );
      channel.unsubscribe(
        DOMAIN_EVENT_NAMES.POSTULACION_ACCEPTED,
        onPostulacionAccepted,
      );
      channel.unsubscribe(
        DOMAIN_EVENT_NAMES.POSTULACION_REJECTED,
        onPostulacionRejected,
      );
      channel.unsubscribe(
        DOMAIN_EVENT_NAMES.VIAJE_FASE_UPDATED,
        onViajeFaseUpdated,
      );
      channel.unsubscribe(
        DOMAIN_EVENT_NAMES.VIAJE_PROXIMITY_ALERT,
        onViajeProximityAlert,
      );
      channel.unsubscribe(
        DOMAIN_EVENT_NAMES.VIAJE_COMPLETED,
        onViajeCompleted,
      );
      channel.unsubscribe(
        DOMAIN_EVENT_NAMES.VIAJE_NEGOCIACION_RESUMEN,
        onViajeNegociacionResumen,
      );
      channel.unsubscribe(
        DOMAIN_EVENT_NAMES.PUBLICACION_ARCHIVED,
        onPublicacionArchived,
      );
      // No cerramos el cliente singleton en el unmount: se comparte por pestana
      // y cerrarlo mientras la conexion aun se establece producia
      // "unhandledRejection: Connection closed". Solo removemos los listeners.
      clientRef.current = null;
    };
  }, [
    empresaId,
    handleLocationUpdated,
    handlePublicacionPublished,
    handlePostulacionCreated,
    handlePostulacionAccepted,
    handlePostulacionRejected,
    handleViajeFaseUpdated,
    handleViajeProximityAlert,
    handleViajeCompleted,
    handleViajeNegociacionResumen,
    handlePublicacionArchived,
  ]);

  const value = useMemo(
    () => ({
      publications,
      driverMarkers,
      activeCount,
      drivers,
      entregasItems,
      publicacionesList,
      activeViajes,
      tripNotifications,
      dismissTripNotification,
      setInitialData,
      setInitialEntregas,
      setInitialPublicacionesList,
      subscribePostulacionEvents,
    }),
    [
      publications,
      driverMarkers,
      activeCount,
      drivers,
      entregasItems,
      publicacionesList,
      activeViajes,
      tripNotifications,
      dismissTripNotification,
      setInitialData,
      setInitialEntregas,
      setInitialPublicacionesList,
      subscribePostulacionEvents,
    ],
  );

  return (
    <EmpresaRealtimeContext.Provider value={value}>
      {children}
    </EmpresaRealtimeContext.Provider>
  );
}

export function useEmpresaRealtime() {
  const context = useContext(EmpresaRealtimeContext);
  if (!context) {
    throw new Error("useEmpresaRealtime debe usarse dentro de EmpresaRealtimeProvider");
  }
  return context;
}
