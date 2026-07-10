import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

async function seed() {
  const { db } = await import("./index");
  const {
    roles,
    estado_postulacion,
    estado_viaje,
    carga_types,
    categoriaVehiculo,
    configVehiculo,
    configRigido,
    configArticulado,
    configEspecial,
  } = await import("./schema");

  console.log("🌱 Iniciando seed...");

  await db.insert(roles).values([
    { id: 1, name: "transportista" },
    { id: 2, name: "empresa" },
  ]).onConflictDoNothing();
  console.log("✅ roles seeded");

  await db.insert(estado_postulacion).values([
    { id: 1, nombre: "pendiente" },
    { id: 2, nombre: "aceptada" },
    { id: 3, nombre: "rechazada" },
    { id: 4, nombre: "cancelada" },
  ]).onConflictDoNothing({ target: estado_postulacion.nombre });
  console.log("✅ estado_postulacion seeded");

  await db.insert(estado_viaje).values([
    { id: 1, nombre: "en_curso" },
    { id: 2, nombre: "completado" },
    { id: 3, nombre: "reasignado" },
    { id: 4, nombre: "cancelado" },
  ]).onConflictDoNothing({ target: estado_viaje.nombre });
  console.log("✅ estado_viaje seeded");

  await db.insert(carga_types).values([
    { id: 1, nombre: "Contenerizada",        descripcion: "Carga en contenedores 20', 40', High Cube" },
    { id: 2, nombre: "Carga general",        descripcion: "Mercancía suelta en furgones" },
    { id: 3, nombre: "Refrigerada/Congelada",descripcion: "Requiere cadena de frío" },
    { id: 4, nombre: "Sobredimensionada",    descripcion: "Maquinaria, estructuras, carga extra pesada" },
    { id: 5, nombre: "A granel",             descripcion: "Arena, cemento, granos, líquidos" },
    { id: 6, nombre: "Materiales peligrosos",descripcion: "Químicos, combustibles (HAZMAT)" },
    { id: 7, nombre: "Carga viva",           descripcion: "Animales" },
    { id: 8, nombre: "Carga de valor",       descripcion: "Electrónicos, medicamentos, joyería" },
  ]).onConflictDoNothing({ target: carga_types.nombre });
  console.log("✅ carga_types seeded");

  // ── Vehículos ──────────────────────────────────────────────

  await db.insert(categoriaVehiculo).values([
    { id: 1, nombre: "Rígido" },
    { id: 2, nombre: "Articulado" },
    { id: 3, nombre: "Especial" },
  ]).onConflictDoNothing();
  console.log("✅ categoria_vehiculo seeded");

  await db.insert(configVehiculo).values([
    { id: 1, idCategoria: 1, codigo: "C2",     nombreComun: "Camión 4 llantas",   capacidadMaxTon: 7,  licenciaRequerida: "D"       },
    { id: 2, idCategoria: 1, codigo: "C3",     nombreComun: "Camión 6 llantas",   capacidadMaxTon: 15, licenciaRequerida: "E3"      },
    { id: 3, idCategoria: 1, codigo: "C4",     nombreComun: "Volteo 8 llantas",   capacidadMaxTon: 22, licenciaRequerida: "E3"      },
    { id: 4, idCategoria: 2, codigo: "T2S1",   nombreComun: "Mula pequeña",       capacidadMaxTon: 25, licenciaRequerida: "F"       },
    { id: 5, idCategoria: 2, codigo: "T2S2",   nombreComun: "Mula estándar",      capacidadMaxTon: 35, licenciaRequerida: "F"       },
    { id: 6, idCategoria: 2, codigo: "T2S3",   nombreComun: "Mula larga / full",  capacidadMaxTon: 48, licenciaRequerida: "F"       },
    { id: 7, idCategoria: 3, codigo: null,  nombreComun: "Equipo pesado",      capacidadMaxTon: null, licenciaRequerida: "G"     },
    { id: 8, idCategoria: 3, codigo: null, nombreComun: "Carga especial",     capacidadMaxTon: null, licenciaRequerida: "PERMISO"},
  ]).onConflictDoNothing();
  console.log("✅ config_vehiculo seeded");

  await db.insert(configRigido).values([
    { idConfig: 1, ejes: 2 },
    { idConfig: 2, ejes: 3 },
    { idConfig: 3, ejes: 4 },
  ]).onConflictDoNothing();
  console.log("✅ config_rigido seeded");

  await db.insert(configArticulado).values([
    { idConfig: 4, ejesCabezal: 2, ejesSemirremolque: 1 },
    { idConfig: 5, ejesCabezal: 2, ejesSemirremolque: 2 },
    { idConfig: 6, ejesCabezal: 2, ejesSemirremolque: 3 },
  ]).onConflictDoNothing();
  console.log("✅ config_articulado seeded");

  await db.insert(configEspecial).values([
    { idConfig: 7, descripcion: "Retroexcavadoras, grúas, tractores. Requiere licencia G." },
    { idConfig: 8, descripcion: "Sobredimensionado, peligroso o refrigerado. Requiere permiso especial ATTT." },
  ]).onConflictDoNothing();
  console.log("✅ config_especial seeded");

  console.log("🌱 Seed completo");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Error en seed:", error);
  process.exit(1);
});