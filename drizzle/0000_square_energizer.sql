CREATE EXTENSION IF NOT EXISTS postgis;--> statement-breakpoint
CREATE TYPE "public"."estado_publicacion" AS ENUM('borrador', 'publicado');--> statement-breakpoint
CREATE TABLE "carga_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"descripcion" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "carga_types_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "categoria_vehiculo" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "config_articulado" (
	"id_config" integer PRIMARY KEY NOT NULL,
	"ejes_cabezal" integer NOT NULL,
	"ejes_semirremolque" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "config_especial" (
	"id_config" integer PRIMARY KEY NOT NULL,
	"descripcion" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "config_rigido" (
	"id_config" integer PRIMARY KEY NOT NULL,
	"ejes" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "config_vehiculo" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_categoria" integer NOT NULL,
	"codigo" varchar(10),
	"nombre_comun" varchar(100) NOT NULL,
	"capacidad_max_ton" real,
	"licencia_requerida" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "empresas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"ruc" varchar(255) NOT NULL,
	"direccion" varchar(255) NOT NULL,
	"telefono" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"id_usuario" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estado_postulacion" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "estado_postulacion_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "estado_viaje" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "estado_viaje_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "fletes" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_empresa" integer NOT NULL,
	"codigo" varchar(50) DEFAULT 'FLT-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 4) NOT NULL,
	"id_tipo_carga" integer NOT NULL,
	"fecha_salida" date NOT NULL,
	"fecha_entrega_estimada" date NOT NULL,
	"peso" double precision NOT NULL,
	"origen_nombre" varchar(255) NOT NULL,
	"origen_geom" geometry NOT NULL,
	"destino_nombre" varchar(255) NOT NULL,
	"destino_geom" geometry NOT NULL,
	"carga_peligrosa" boolean DEFAULT false NOT NULL,
	"total_pago" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fletes_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "flota" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_config" integer NOT NULL,
	"placa" varchar(255) NOT NULL,
	"marca" varchar(255) NOT NULL,
	"modelo" varchar(255) NOT NULL,
	"anio" integer NOT NULL,
	"estado" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"id_transportista" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "postulaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_publicacion" integer NOT NULL,
	"id_transportista" integer NOT NULL,
	"id_flota" integer NOT NULL,
	"id_estado" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "postulaciones_publicacion_transportista_unique" UNIQUE("id_publicacion","id_transportista")
);
--> statement-breakpoint
CREATE TABLE "publicaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_flete" integer NOT NULL,
	"id_empresa" integer NOT NULL,
	"estado" "estado_publicacion" DEFAULT 'borrador' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "publicaciones_id_flete_unique" UNIQUE("id_flete")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transportistas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"apellido" varchar(255) NOT NULL,
	"cedula" varchar(255) NOT NULL,
	"direccion" varchar(255) NOT NULL,
	"telefono" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"id_usuario" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255),
	"google_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role_id" integer NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email"),
	CONSTRAINT "usuarios_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "viajes" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_flete" integer NOT NULL,
	"id_publicacion" integer NOT NULL,
	"id_postulacion" integer NOT NULL,
	"id_transportista" integer NOT NULL,
	"id_empresa" integer NOT NULL,
	"id_flota" integer NOT NULL,
	"id_estado" integer NOT NULL,
	"fecha_inicio" date NOT NULL,
	"fecha_fin" date NOT NULL,
	"pagado" double precision NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "viajes_id_postulacion_unique" UNIQUE("id_postulacion")
);
--> statement-breakpoint
CREATE TABLE "viajes_reasignaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_viaje" integer NOT NULL,
	"id_transportista_anterior" integer NOT NULL,
	"id_transportista_nuevo" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "config_articulado" ADD CONSTRAINT "config_articulado_id_config_config_vehiculo_id_fk" FOREIGN KEY ("id_config") REFERENCES "public"."config_vehiculo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "config_especial" ADD CONSTRAINT "config_especial_id_config_config_vehiculo_id_fk" FOREIGN KEY ("id_config") REFERENCES "public"."config_vehiculo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "config_rigido" ADD CONSTRAINT "config_rigido_id_config_config_vehiculo_id_fk" FOREIGN KEY ("id_config") REFERENCES "public"."config_vehiculo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "config_vehiculo" ADD CONSTRAINT "config_vehiculo_id_categoria_categoria_vehiculo_id_fk" FOREIGN KEY ("id_categoria") REFERENCES "public"."categoria_vehiculo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_id_usuario_usuarios_id_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fletes" ADD CONSTRAINT "fletes_id_empresa_empresas_id_fk" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fletes" ADD CONSTRAINT "fletes_id_tipo_carga_carga_types_id_fk" FOREIGN KEY ("id_tipo_carga") REFERENCES "public"."carga_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flota" ADD CONSTRAINT "flota_id_config_config_vehiculo_id_fk" FOREIGN KEY ("id_config") REFERENCES "public"."config_vehiculo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flota" ADD CONSTRAINT "flota_id_transportista_transportistas_id_fk" FOREIGN KEY ("id_transportista") REFERENCES "public"."transportistas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "postulaciones" ADD CONSTRAINT "postulaciones_id_publicacion_publicaciones_id_fk" FOREIGN KEY ("id_publicacion") REFERENCES "public"."publicaciones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "postulaciones" ADD CONSTRAINT "postulaciones_id_transportista_transportistas_id_fk" FOREIGN KEY ("id_transportista") REFERENCES "public"."transportistas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "postulaciones" ADD CONSTRAINT "postulaciones_id_flota_flota_id_fk" FOREIGN KEY ("id_flota") REFERENCES "public"."flota"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "postulaciones" ADD CONSTRAINT "postulaciones_id_estado_estado_postulacion_id_fk" FOREIGN KEY ("id_estado") REFERENCES "public"."estado_postulacion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_id_flete_fletes_id_fk" FOREIGN KEY ("id_flete") REFERENCES "public"."fletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_id_empresa_empresas_id_fk" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transportistas" ADD CONSTRAINT "transportistas_id_usuario_usuarios_id_fk" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viajes" ADD CONSTRAINT "viajes_id_flete_fletes_id_fk" FOREIGN KEY ("id_flete") REFERENCES "public"."fletes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viajes" ADD CONSTRAINT "viajes_id_publicacion_publicaciones_id_fk" FOREIGN KEY ("id_publicacion") REFERENCES "public"."publicaciones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viajes" ADD CONSTRAINT "viajes_id_postulacion_postulaciones_id_fk" FOREIGN KEY ("id_postulacion") REFERENCES "public"."postulaciones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viajes" ADD CONSTRAINT "viajes_id_transportista_transportistas_id_fk" FOREIGN KEY ("id_transportista") REFERENCES "public"."transportistas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viajes" ADD CONSTRAINT "viajes_id_empresa_empresas_id_fk" FOREIGN KEY ("id_empresa") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viajes" ADD CONSTRAINT "viajes_id_flota_flota_id_fk" FOREIGN KEY ("id_flota") REFERENCES "public"."flota"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viajes" ADD CONSTRAINT "viajes_id_estado_estado_viaje_id_fk" FOREIGN KEY ("id_estado") REFERENCES "public"."estado_viaje"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viajes_reasignaciones" ADD CONSTRAINT "viajes_reasignaciones_id_viaje_viajes_id_fk" FOREIGN KEY ("id_viaje") REFERENCES "public"."viajes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viajes_reasignaciones" ADD CONSTRAINT "viajes_reasignaciones_id_transportista_anterior_transportistas_id_fk" FOREIGN KEY ("id_transportista_anterior") REFERENCES "public"."transportistas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viajes_reasignaciones" ADD CONSTRAINT "viajes_reasignaciones_id_transportista_nuevo_transportistas_id_fk" FOREIGN KEY ("id_transportista_nuevo") REFERENCES "public"."transportistas"("id") ON DELETE no action ON UPDATE no action;