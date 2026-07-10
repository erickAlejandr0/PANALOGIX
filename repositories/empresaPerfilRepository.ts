import { db } from "@/db";
import { sql } from "drizzle-orm";
import { ESTADO_VIAJE_ID } from "@/lib/fletes/constants";

export const empresaPerfilRepository = {
  countEntregasCompletadasEsteMes: async (empresaId: number) => {
    const result = await db.execute<{ total: string }>(sql`
      SELECT COUNT(*)::text AS total
      FROM viajes v
      WHERE v.id_empresa = ${empresaId}
        AND v.id_estado = ${ESTADO_VIAJE_ID.COMPLETADO}
        AND date_trunc('month', v.updated_at) = date_trunc('month', CURRENT_TIMESTAMP)
    `);

    return Number(result.rows[0]?.total ?? 0);
  },
};
