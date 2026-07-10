CREATE TABLE IF NOT EXISTS "transportista_ubicaciones" (
  "id_transportista" integer PRIMARY KEY NOT NULL REFERENCES "transportistas"("id"),
  "ubicacion_geom" geometry(Point) NOT NULL,
  "heading" real,
  "speed_kmh" real,
  "id_viaje" integer REFERENCES "viajes"("id"),
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "transportista_ubicaciones_geom_idx"
  ON "transportista_ubicaciones"
  USING GIST ("ubicacion_geom");
