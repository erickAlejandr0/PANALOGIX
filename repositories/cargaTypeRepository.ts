import { db } from "@/db";
import { carga_types } from "@/db/schema";

export const cargaTypeRepository = {
  findAll: async () => {
    return db.query.carga_types.findMany({
      orderBy: (table, { asc }) => [asc(table.nombre)],
    });
  },
};
