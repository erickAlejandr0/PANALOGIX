import { sql } from "drizzle-orm";

export function makePointSql(lng: number, lat: number) {
  return sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
}
