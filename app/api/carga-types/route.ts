import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth/get-authenticated-user";
import { cargaTypeRepository } from "@/repositories/cargaTypeRepository";

export async function GET(request: Request) {
  const session = await getAuthFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const cargaTypes = await cargaTypeRepository.findAll();
  return NextResponse.json({ data: cargaTypes });
}
