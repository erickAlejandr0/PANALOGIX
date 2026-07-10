"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { DriverMarker } from "@/lib/dashboard/driver-markers";
import type { MapPublication } from "@/lib/dashboard/map-publications";
import { getMapboxClientToken } from "@/lib/mapbox/token";

type DashboardMapProps = {
  publications: MapPublication[];
  driverMarkers?: DriverMarker[];
  activeCount: number;
};

const PANAMA_CENTER: [number, number] = [-79.5199, 8.9824];

function buildRoutesGeoJson(publications: MapPublication[]) {
  return {
    type: "FeatureCollection" as const,
    features: publications.map((publication) => ({
      type: "Feature" as const,
      properties: {
        id: publication.id,
        codigo: publication.codigo,
      },
      geometry: {
        type: "LineString" as const,
        coordinates: [publication.origen, publication.destino],
      },
    })),
  };
}

function buildPointsGeoJson(publications: MapPublication[]) {
  const features = publications.flatMap((publication) => [
    {
      type: "Feature" as const,
      properties: {
        kind: "origen",
        label: publication.origenNombre,
        codigo: publication.codigo,
      },
      geometry: {
        type: "Point" as const,
        coordinates: publication.origen,
      },
    },
    {
      type: "Feature" as const,
      properties: {
        kind: "destino",
        label: publication.destinoNombre,
        codigo: publication.codigo,
      },
      geometry: {
        type: "Point" as const,
        coordinates: publication.destino,
      },
    },
  ]);

  return {
    type: "FeatureCollection" as const,
    features,
  };
}

function buildDriversGeoJson(driverMarkers: DriverMarker[]) {
  return {
    type: "FeatureCollection" as const,
    features: driverMarkers.map((driver) => ({
      type: "Feature" as const,
      properties: {
        viajeId: driver.viajeId,
        nombre: driver.nombre,
        placa: driver.placa,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [driver.lng, driver.lat] as [number, number],
      },
    })),
  };
}

function addDriverLayers(map: mapboxgl.Map, driverMarkers: DriverMarker[]) {
  if (map.getSource("drivers")) {
    (map.getSource("drivers") as mapboxgl.GeoJSONSource).setData(
      buildDriversGeoJson(driverMarkers),
    );
  } else {
    map.addSource("drivers", {
      type: "geojson",
      data: buildDriversGeoJson(driverMarkers),
    });
    map.addLayer({
      id: "drivers-circle",
      type: "circle",
      source: "drivers",
      paint: {
        "circle-radius": 8,
        "circle-color": "#2dbcfe",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });
  }
}

function addPublicationLayers(
  map: mapboxgl.Map,
  publications: MapPublication[],
  driverMarkers: DriverMarker[],
) {
  if (map.getSource("routes")) {
    (map.getSource("routes") as mapboxgl.GeoJSONSource).setData(
      buildRoutesGeoJson(publications),
    );
  } else {
    map.addSource("routes", {
      type: "geojson",
      data: buildRoutesGeoJson(publications),
    });
    map.addLayer({
      id: "routes-line",
      type: "line",
      source: "routes",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#00658d",
        "line-width": 3,
        "line-opacity": 0.85,
      },
    });
  }

  if (map.getSource("points")) {
    (map.getSource("points") as mapboxgl.GeoJSONSource).setData(
      buildPointsGeoJson(publications),
    );
  } else {
    map.addSource("points", {
      type: "geojson",
      data: buildPointsGeoJson(publications),
    });
    map.addLayer({
      id: "points-circle",
      type: "circle",
      source: "points",
      paint: {
        "circle-radius": 6,
        "circle-color": [
          "match",
          ["get", "kind"],
          "origen",
          "#0b1f3a",
          "#2dbcfe",
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });
  }

  if (publications.length > 0) {
    const bounds = new mapboxgl.LngLatBounds();
    publications.forEach((publication) => {
      bounds.extend(publication.origen);
      bounds.extend(publication.destino);
    });
    driverMarkers.forEach((driver) => {
      bounds.extend([driver.lng, driver.lat]);
    });
    map.fitBounds(bounds, { padding: 80, maxZoom: 12, duration: 0 });
  }

  addDriverLayers(map, driverMarkers);
}

function add3dBuildingsLayer(map: mapboxgl.Map) {
  if (map.getLayer("3d-buildings")) return;

  const layers = map.getStyle()?.layers;
  const labelLayerId = layers?.find(
    (layer) => layer.type === "symbol" && layer.layout?.["text-field"],
  )?.id;

  map.addLayer(
    {
      id: "3d-buildings",
      source: "composite",
      "source-layer": "building",
      filter: ["==", "extrude", "true"],
      type: "fill-extrusion",
      minzoom: 14,
      paint: {
        "fill-extrusion-color": "#445566",
        "fill-extrusion-height": ["get", "height"],
        "fill-extrusion-base": ["get", "min_height"],
        "fill-extrusion-opacity": 0.65,
      },
    },
    labelLayerId,
  );
}

export function DashboardMap({
  publications,
  driverMarkers = [],
  activeCount,
}: DashboardMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const accessToken = getMapboxClientToken();

  useEffect(() => {
    if (!accessToken) {
      setMapError("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN no está configurado.");
      return;
    }

    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = accessToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      accessToken,
      style: "mapbox://styles/mapbox/dark-v11",
      center: PANAMA_CENTER,
      zoom: 7,
      pitch: 45,
      bearing: -17,
      antialias: true,
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    mapRef.current = map;

    const resizeMap = () => {
      map.resize();
    };

    const resizeObserver = new ResizeObserver(resizeMap);
    resizeObserver.observe(containerRef.current);

    map.on("error", (event) => {
      const message =
        event.error?.message ?? "No se pudo cargar el mapa de Mapbox.";
      setMapError(message);
    });

    map.on("load", () => {
      resizeMap();

      try {
        add3dBuildingsLayer(map);
      } catch {
        // El mapa base sigue funcionando aunque falle la capa 3D.
      }

      addPublicationLayers(map, publications, driverMarkers);
    });

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [accessToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    addPublicationLayers(map, publications, driverMarkers);
  }, [publications, driverMarkers]);

  return (
    <div className="relative h-[480px] overflow-hidden rounded-sm bg-[#0b1f3a] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {mapError ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0b1f3a]/90 px-6 text-center">
          <p className="max-w-md text-sm text-white/90">{mapError}</p>
        </div>
      ) : null}

      <div className="pointer-events-none absolute left-4 top-4 z-10">
        <div className="w-[200px] border border-[rgba(196,198,206,0.1)] bg-[rgba(255,255,255,0.9)] p-[13px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[-0.3px] text-[#121c27]">
            fletes
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#00658d]" />
            <span className="text-[10px] font-medium text-[#191c20]">
              activos ({activeCount})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
