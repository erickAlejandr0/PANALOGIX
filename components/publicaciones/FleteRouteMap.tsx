"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getMapboxClientToken } from "@/lib/mapbox/token";

export type MapPoint = {
  lng: number;
  lat: number;
};

export type RouteGeometry = {
  type: "LineString";
  coordinates: [number, number][];
};

type FleteRouteMapProps = {
  origen: MapPoint | null;
  destino: MapPoint | null;
  routeGeometry: RouteGeometry | null;
  selectionMode: "origen" | "destino";
  onMapClick: (mode: "origen" | "destino", point: MapPoint) => void;
};

type MapData = {
  origen: MapPoint | null;
  destino: MapPoint | null;
  routeGeometry: RouteGeometry | null;
};

const PANAMA_CENTER: [number, number] = [-79.5199, 8.9824];
const PANAMA_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [-83.1, 7.0],
  [-77.0, 9.8],
];

function addPreviewLayers(map: mapboxgl.Map) {
  if (map.getSource("route-preview")) return;

  map.addSource("route-preview", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });

  map.addSource("points-preview", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });

  map.addLayer({
    id: "route-preview-line",
    type: "line",
    source: "route-preview",
    paint: {
      "line-color": "#00658d",
      "line-width": 4,
      "line-opacity": 0.9,
    },
  });

  map.addLayer({
    id: "points-preview-circle",
    type: "circle",
    source: "points-preview",
    paint: {
      "circle-radius": 8,
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

  try {
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
  } catch {
    // El mapa base sigue funcionando aunque falle la capa 3D.
  }
}

function syncMapLayers(map: mapboxgl.Map, data: MapData) {
  if (!map.getSource("points-preview") || !map.getSource("route-preview")) {
    return false;
  }

  const features = [];
  if (data.origen) {
    features.push({
      type: "Feature" as const,
      properties: { kind: "origen" },
      geometry: {
        type: "Point" as const,
        coordinates: [data.origen.lng, data.origen.lat],
      },
    });
  }
  if (data.destino) {
    features.push({
      type: "Feature" as const,
      properties: { kind: "destino" },
      geometry: {
        type: "Point" as const,
        coordinates: [data.destino.lng, data.destino.lat],
      },
    });
  }

  (map.getSource("points-preview") as mapboxgl.GeoJSONSource).setData({
    type: "FeatureCollection",
    features,
  });

  const routeFeatures = data.routeGeometry
    ? [
        {
          type: "Feature" as const,
          properties: {},
          geometry: data.routeGeometry,
        },
      ]
    : [];

  (map.getSource("route-preview") as mapboxgl.GeoJSONSource).setData({
    type: "FeatureCollection",
    features: routeFeatures,
  });

  if (data.origen && data.destino) {
    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([data.origen.lng, data.origen.lat]);
    bounds.extend([data.destino.lng, data.destino.lat]);
    map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 600 });
  } else if (data.origen) {
    map.flyTo({
      center: [data.origen.lng, data.origen.lat],
      zoom: 11,
      duration: 600,
    });
  } else if (data.destino) {
    map.flyTo({
      center: [data.destino.lng, data.destino.lat],
      zoom: 11,
      duration: 600,
    });
  }

  return true;
}

export function FleteRouteMap({
  origen,
  destino,
  routeGeometry,
  selectionMode,
  onMapClick,
}: FleteRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const selectionModeRef = useRef(selectionMode);
  const mapDataRef = useRef<MapData>({ origen, destino, routeGeometry });
  const [mapError, setMapError] = useState<string | null>(null);

  onMapClickRef.current = onMapClick;
  selectionModeRef.current = selectionMode;
  mapDataRef.current = { origen, destino, routeGeometry };

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
      maxBounds: PANAMA_BOUNDS,
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    mapRef.current = map;

    const resizeMap = () => map.resize();
    const resizeObserver = new ResizeObserver(resizeMap);
    resizeObserver.observe(containerRef.current);

    const handleWindowResize = () => resizeMap();
    window.addEventListener("resize", handleWindowResize);

    map.on("error", (event) => {
      const message =
        event.error?.message ?? "No se pudo cargar el mapa de Mapbox.";
      setMapError(message);
    });

    map.on("load", () => {
      resizeMap();
      addPreviewLayers(map);
      syncMapLayers(map, mapDataRef.current);
    });

    map.on("click", (event) => {
      onMapClickRef.current(selectionModeRef.current, {
        lng: event.lngLat.lng,
        lat: event.lngLat.lat,
      });
    });

    return () => {
      window.removeEventListener("resize", handleWindowResize);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [accessToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const data = { origen, destino, routeGeometry };

    const apply = () => {
      syncMapLayers(map, data);
    };

    if (map.getSource("points-preview")) {
      apply();
      return;
    }

    if (map.isStyleLoaded()) {
      map.once("idle", apply);
    } else {
      map.once("load", apply);
    }
  }, [origen, destino, routeGeometry]);

  return (
    <div className="relative isolate h-[320px] min-h-[280px] overflow-hidden rounded-lg bg-[#0b1f3a]">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {mapError ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0b1f3a]/90 px-6 text-center">
          <p className="max-w-md text-sm text-white/90">{mapError}</p>
        </div>
      ) : null}

      <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[calc(100%-5rem)] rounded bg-[rgba(255,255,255,0.92)] px-2.5 py-1.5 text-[10px] text-[#001b44] shadow-sm">
        <span className="font-bold uppercase tracking-[0.5px]">
          Live map preview
        </span>
        <span className="mx-1.5 text-[#6b7280]">·</span>
        <span>
          Clic para colocar{" "}
          <span className="font-bold uppercase">
            {selectionMode === "origen" ? "origen" : "destino"}
          </span>
        </span>
      </div>
    </div>
  );
}
