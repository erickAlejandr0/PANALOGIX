"use server";

import { redirect } from "next/navigation";
import { getAuthFromRequest } from "@/lib/auth/get-authenticated-user";
import { EMPRESA_ROLE_ID } from "@/lib/fletes/constants";
import { empresaRepository } from "@/repositories/empresaRepository";
import { negociacionViajeService } from "@/service/negociacionViajeService";

async function getEmpresaIdForSession() {
  const session = await getAuthFromRequest();
  if (!session) {
    redirect("/login");
  }

  if (session.roleId !== EMPRESA_ROLE_ID) {
    return { error: "Solo empresas pueden realizar esta acción" as const };
  }

  const empresa = await empresaRepository.getByUserId(session.userId);
  if (!empresa) {
    redirect("/Onboarding/Empresa");
  }

  return { empresaId: empresa.id };
}

// PASO 2 (empresa): acepta la llegada del transportista.
export async function aceptarLlegadaAction(viajeId: number) {
  const empresaResult = await getEmpresaIdForSession();
  if ("error" in empresaResult) {
    return empresaResult;
  }
  return negociacionViajeService.aceptarLlegada(viajeId, empresaResult.empresaId);
}

// PASO 3 (empresa): completa la inspeccion y emite el codigo (solo se retorna aqui).
export async function completarInspeccionAction(viajeId: number) {
  const empresaResult = await getEmpresaIdForSession();
  if ("error" in empresaResult) {
    return empresaResult;
  }
  return negociacionViajeService.completarInspeccion(
    viajeId,
    empresaResult.empresaId,
  );
}

// PASO 3a (empresa): marca o desmarca un punto del checklist en vivo.
export async function actualizarItemInspeccionAction(
  viajeId: number,
  itemId: string,
  completed: boolean,
) {
  const empresaResult = await getEmpresaIdForSession();
  if ("error" in empresaResult) {
    return empresaResult;
  }
  return negociacionViajeService.actualizarItemInspeccion(
    viajeId,
    empresaResult.empresaId,
    itemId,
    completed,
  );
}

// PASO 3b (empresa): regenera el codigo si expiro.
export async function regenerarCodigoAction(viajeId: number) {
  const empresaResult = await getEmpresaIdForSession();
  if ("error" in empresaResult) {
    return empresaResult;
  }
  return negociacionViajeService.regenerarCodigo(viajeId, empresaResult.empresaId);
}

// PASO 5 (empresa): snapshot del resumen (recarga / late-join).
export async function getResumenNegociacionAction(viajeId: number) {
  const empresaResult = await getEmpresaIdForSession();
  if ("error" in empresaResult) {
    return empresaResult;
  }
  return negociacionViajeService.getResumenNegociacion(
    viajeId,
    empresaResult.empresaId,
  );
}
