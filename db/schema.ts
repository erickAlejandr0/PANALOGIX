import type { InspeccionChecklistItem } from "@/lib/entregas/types";
import { sql, relations } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  doublePrecision,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
  unique,
  varchar,
  real,
} from "drizzle-orm/pg-core";

const geometry = customType<{ data: unknown; driverData: string }>({
  dataType() {
    return "geometry";
  },
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }),
  googleId: varchar("google_id", { length: 255 }).unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  roleId: integer("role_id")
    .references(() => roles.id)
    .notNull(),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  photoUrl: varchar("photo_url", { length: 512 }),
});

export type Usuario = typeof usuarios.$inferSelect;
export type NewUsuario = typeof usuarios.$inferInsert;

export const billingSetupStatusEnum = pgEnum("billing_setup_status", [
  "pending",
  "incomplete",
  "ready",
  "failed",
]);

export const paymentEscrowStatusEnum = pgEnum("payment_escrow_status", [
  "pending",
  "held",
  "released",
  "refunded",
  "failed",
]);

export const empresas = pgTable("empresas", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  ruc: varchar("ruc", { length: 255 }).notNull(),
  direccion: varchar("direccion", { length: 255 }).notNull(),
  telefono: varchar("telefono", { length: 255 }).notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeDefaultPaymentMethodId: varchar("stripe_default_payment_method_id", {
    length: 255,
  }),
  billingSetupStatus: billingSetupStatusEnum("billing_setup_status")
    .notNull()
    .default("pending"),
  billingPaymentMethodLast4: varchar("billing_payment_method_last4", {
    length: 4,
  }),
  billingPaymentMethodBrand: varchar("billing_payment_method_brand", {
    length: 32,
  }),
  billingPaymentMethodExpMonth: smallint("billing_payment_method_exp_month"),
  billingPaymentMethodExpYear: smallint("billing_payment_method_exp_year"),
  billingSetupCompletedAt: timestamp("billing_setup_completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  id_usuario: integer("id_usuario")
    .references(() => usuarios.id)
    .notNull(),
});

export type Empresa = typeof empresas.$inferSelect;
export type NewEmpresa = typeof empresas.$inferInsert;

export const transportistas = pgTable("transportistas", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  apellido: varchar("apellido", { length: 255 }).notNull(),
  cedula: varchar("cedula", { length: 255 }).notNull(),
  direccion: varchar("direccion", { length: 255 }).notNull(),
  telefono: varchar("telefono", { length: 255 }).notNull(),
  stripeConnectAccountId: varchar("stripe_connect_account_id", { length: 255 }),
  billingSetupStatus: billingSetupStatusEnum("billing_setup_status")
    .notNull()
    .default("pending"),
  payoutsEnabled: boolean("payouts_enabled").notNull().default(false),
  chargesEnabled: boolean("charges_enabled").notNull().default(false),
  connectPayoutLast4: varchar("connect_payout_last4", { length: 4 }),
  billingSetupCompletedAt: timestamp("billing_setup_completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  id_usuario: integer("id_usuario")
    .references(() => usuarios.id)
    .notNull(),
  disponible: boolean("disponible").notNull().default(true),
});

export type Transportista = typeof transportistas.$inferSelect;
export type NewTransportista = typeof transportistas.$inferInsert;

export const flota = pgTable("flota", {
  id: serial("id").primaryKey(),
  id_config: integer("id_config")
    .references(() => configVehiculo.id)
    .notNull(),
  placa: varchar("placa", { length: 255 }).notNull(),
  marca: varchar("marca", { length: 255 }).notNull(),
  modelo: varchar("modelo", { length: 255 }).notNull(),
  anio: integer("anio").notNull(),
  estado: varchar("estado", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  id_transportista: integer("id_transportista")
    .references(() => transportistas.id)
    .notNull(),
});

export type Flota = typeof flota.$inferSelect;
export type NewFlota = typeof flota.$inferInsert;

export const carga_types = pgTable("carga_types", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull().unique(),
  descripcion: text("descripcion").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CargaType = typeof carga_types.$inferSelect;
export type NewCargaType = typeof carga_types.$inferInsert;

export const fletes = pgTable("fletes", {
  id: serial("id").primaryKey(),
  id_empresa: integer("id_empresa")
    .references(() => empresas.id)
    .notNull(),
  codigo: varchar("codigo", { length: 50 })
    .notNull()
    .unique()
    .default(
      sql`'FLT-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 4)`,
    ),
  id_tipo_carga: integer("id_tipo_carga")
    .references(() => carga_types.id)
    .notNull(),
  fecha_salida: date("fecha_salida").notNull(),
  fecha_entrega_estimada: date("fecha_entrega_estimada").notNull(),
  peso: doublePrecision("peso").notNull(),
  origen_nombre: varchar("origen_nombre", { length: 255 }).notNull(),
  origen_geom: geometry("origen_geom").notNull(),
  destino_nombre: varchar("destino_nombre", { length: 255 }).notNull(),
  destino_geom: geometry("destino_geom").notNull(),
  carga_peligrosa: boolean("carga_peligrosa").notNull().default(false),
  total_pago: numeric("total_pago", { precision: 12, scale: 2 }).notNull(),
  estado: varchar("estado", { length: 32 }).notNull().default("activo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Flete = typeof fletes.$inferSelect;
export type NewFlete = typeof fletes.$inferInsert;

export const estadoPublicacionEnum = pgEnum("estado_publicacion", [
  "borrador",
  "publicado",
  "archivado",
]);

export const publicaciones = pgTable("publicaciones", {
  id: serial("id").primaryKey(),
  id_flete: integer("id_flete")
    .references(() => fletes.id)
    .notNull()
    .unique(),
  id_empresa: integer("id_empresa")
    .references(() => empresas.id)
    .notNull(),
  estado: estadoPublicacionEnum("estado").notNull().default("borrador"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Publicacion = typeof publicaciones.$inferSelect;
export type NewPublicacion = typeof publicaciones.$inferInsert;

export const estado_postulacion = pgTable("estado_postulacion", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type EstadoPostulacion = typeof estado_postulacion.$inferSelect;
export type NewEstadoPostulacion = typeof estado_postulacion.$inferInsert;

export const postulaciones = pgTable(
  "postulaciones",
  {
    id: serial("id").primaryKey(),
    id_publicacion: integer("id_publicacion")
      .references(() => publicaciones.id)
      .notNull(),
    id_transportista: integer("id_transportista")
      .references(() => transportistas.id)
      .notNull(),
    id_flota: integer("id_flota")
      .references(() => flota.id)
      .notNull(),
    id_estado: integer("id_estado")
      .references(() => estado_postulacion.id)
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    unique("postulaciones_publicacion_transportista_unique").on(
      table.id_publicacion,
      table.id_transportista,
    ),
  ],
);

export type Postulacion = typeof postulaciones.$inferSelect;
export type NewPostulacion = typeof postulaciones.$inferInsert;

export const estado_viaje = pgTable("estado_viaje", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type EstadoViaje = typeof estado_viaje.$inferSelect;
export type NewEstadoViaje = typeof estado_viaje.$inferInsert;

export const viajes = pgTable("viajes", {
  id: serial("id").primaryKey(),
  id_flete: integer("id_flete")
    .references(() => fletes.id)
    .notNull(),
  id_publicacion: integer("id_publicacion")
    .references(() => publicaciones.id)
    .notNull(),
  id_postulacion: integer("id_postulacion")
    .references(() => postulaciones.id)
    .notNull()
    .unique(),
  id_transportista: integer("id_transportista")
    .references(() => transportistas.id)
    .notNull(),
  id_empresa: integer("id_empresa")
    .references(() => empresas.id)
    .notNull(),
  id_flota: integer("id_flota")
    .references(() => flota.id)
    .notNull(),
  id_estado: integer("id_estado")
    .references(() => estado_viaje.id)
    .notNull(),
  fase: varchar("fase", { length: 32 }).notNull().default("asignado"),
  alerta_destino_enviada: boolean("alerta_destino_enviada").notNull().default(false),
  alerta_llegada_enviada: boolean("alerta_llegada_enviada").notNull().default(false),
  codigo_verificacion_hash: varchar("codigo_verificacion_hash", { length: 128 }),
  codigo_verificacion_expira: timestamp("codigo_verificacion_expira"),
  codigo_verificacion_intentos: smallint("codigo_verificacion_intentos")
    .notNull()
    .default(0),
  inspeccion_checklist: jsonb("inspeccion_checklist").$type<
    InspeccionChecklistItem[]
  >(),
  inspeccion_iniciada_at: timestamp("inspeccion_iniciada_at"),
  fecha_inicio: date("fecha_inicio").notNull(),
  fecha_fin: date("fecha_fin").notNull(),
  pagado: doublePrecision("pagado").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Viaje = typeof viajes.$inferSelect;
export type NewViaje = typeof viajes.$inferInsert;

export const transportistaUbicaciones = pgTable("transportista_ubicaciones", {
  id_transportista: integer("id_transportista")
    .primaryKey()
    .references(() => transportistas.id),
  ubicacion_geom: geometry("ubicacion_geom").notNull(),
  heading: real("heading"),
  speed_kmh: real("speed_kmh"),
  id_viaje: integer("id_viaje").references(() => viajes.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type TransportistaUbicacion = typeof transportistaUbicaciones.$inferSelect;
export type NewTransportistaUbicacion =
  typeof transportistaUbicaciones.$inferInsert;

export const viajes_reasignaciones = pgTable("viajes_reasignaciones", {
  id: serial("id").primaryKey(),
  id_viaje: integer("id_viaje")
    .references(() => viajes.id)
    .notNull(),
  id_transportista_anterior: integer("id_transportista_anterior")
    .references(() => transportistas.id)
    .notNull(),
  id_transportista_nuevo: integer("id_transportista_nuevo")
    .references(() => transportistas.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ViajeReasignacion = typeof viajes_reasignaciones.$inferSelect;
export type NewViajeReasignacion = typeof viajes_reasignaciones.$inferInsert;

export const paymentEscrows = pgTable("payment_escrows", {
  id: serial("id").primaryKey(),
  id_publicacion: integer("id_publicacion")
    .references(() => publicaciones.id)
    .notNull()
    .unique(),
  id_flete: integer("id_flete")
    .references(() => fletes.id)
    .notNull(),
  id_empresa: integer("id_empresa")
    .references(() => empresas.id)
    .notNull(),
  amountCents: integer("amount_cents").notNull(),
  platformFeeCents: integer("platform_fee_cents"),
  stripeFeeCents: integer("stripe_fee_cents"),
  transportistaPayoutCents: integer("transportista_payout_cents"),
  currency: varchar("currency", { length: 3 }).notNull().default("usd"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 })
    .notNull()
    .unique(),
  stripeChargeId: varchar("stripe_charge_id", { length: 255 }),
  stripeTransferId: varchar("stripe_transfer_id", { length: 255 }),
  stripeRefundId: varchar("stripe_refund_id", { length: 255 }),
  status: paymentEscrowStatusEnum("status").notNull().default("pending"),
  heldAt: timestamp("held_at"),
  releasedAt: timestamp("released_at"),
  refundedAt: timestamp("refunded_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PaymentEscrow = typeof paymentEscrows.$inferSelect;
export type NewPaymentEscrow = typeof paymentEscrows.$inferInsert;

export const categoriaVehiculo = pgTable('categoria_vehiculo', {
    id:     serial('id').primaryKey(),
    nombre: varchar('nombre', { length: 50 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  })
  
  export const configVehiculo = pgTable('config_vehiculo', {
    id:               serial('id').primaryKey(),
    idCategoria:      integer('id_categoria')
                        .notNull()
                        .references(() => categoriaVehiculo.id),
    codigo:           varchar('codigo', { length: 10 }),   // C2, T2S2...
    nombreComun:      varchar('nombre_comun', { length: 100 }).notNull(),
    capacidadMaxTon:  real('capacidad_max_ton'),
    licenciaRequerida: varchar('licencia_requerida', { length: 20 }).notNull(), // D, E3, F, G
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  })
  
  // Subtabla rígidos — id_config es PK y FK al mismo tiempo
  export const configRigido = pgTable('config_rigido', {
    idConfig: integer('id_config')
                .primaryKey()
                .references(() => configVehiculo.id),
    ejes: integer('ejes').notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  })
  
  // Subtabla articulados
  export const configArticulado = pgTable('config_articulado', {
    idConfig:         integer('id_config')
                        .primaryKey()
                        .references(() => configVehiculo.id),
    ejesCabezal:      integer('ejes_cabezal').notNull(),
    ejesSemirremolque: integer('ejes_semirremolque').notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  })
  
  // Subtabla especiales
  export const configEspecial = pgTable('config_especial', {
    idConfig:    integer('id_config')
                   .primaryKey()
                   .references(() => configVehiculo.id),
    descripcion: text('descripcion').notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  })
  
  export const configVehiculoRelations = relations(configVehiculo, ({ one, many }) => ({
    categoria:   one(categoriaVehiculo, {
      fields:     [configVehiculo.idCategoria],
      references: [categoriaVehiculo.id],
    }),
    rigido:      one(configRigido,      { fields: [configVehiculo.id], references: [configRigido.idConfig] }),
    articulado:  one(configArticulado,  { fields: [configVehiculo.id], references: [configArticulado.idConfig] }),
    especial:    one(configEspecial,    { fields: [configVehiculo.id], references: [configEspecial.idConfig] }),
    flota:       many(flota),
  }))
  
  export const flotaRelations = relations(flota, ({ one }) => ({
    config: one(configVehiculo, {
      fields:     [flota.id_config],
      references: [configVehiculo.id],
    }),
    transportista: one(transportistas, {
      fields:     [flota.id_transportista],
      references: [transportistas.id],
    }),
  }))

