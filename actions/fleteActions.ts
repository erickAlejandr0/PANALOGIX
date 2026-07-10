"use server";

import { redirect } from "next/navigation";
import { getAuthFromRequest } from "@/lib/auth/get-authenticated-user";
import { EMPRESA_ROLE_ID } from "@/lib/fletes/constants";
import { parseCreateFleteBody } from "@/lib/validations/fletes";
import { empresaRepository } from "@/repositories/empresaRepository";
import { fleteService } from "@/service/fleteService";
import { postulacionService } from "@/service/postulacionService";
import { publicacionService } from "@/service/publicacionService";

async function getEmpresaIdForSession() {
  const session = await getAuthFromRequest();
  if (!session) {
    redirect("/login");
  }

  if (session.roleId !== EMPRESA_ROLE_ID) {
    return { error: "Solo empresas pueden realizar esta acción" };
  }

  const empresa = await empresaRepository.getByUserId(session.userId);
  if (!empresa) {
    redirect("/Onboarding/Empresa");
  }

  return { empresaId: empresa.id };
}

export async function createFleteAction(body: unknown) {
  const empresaResult = await getEmpresaIdForSession();
  if ("error" in empresaResult) {
    return empresaResult;
  }

  const validation = parseCreateFleteBody(body);
  if ("error" in validation) {
    return validation;
  }

  return fleteService.createFlete(empresaResult.empresaId, validation.data);
}

export async function createAndPublishFleteAction(body: unknown) {
  const empresaResult = await getEmpresaIdForSession();
  if ("error" in empresaResult) {
    return empresaResult;
  }

  const validation = parseCreateFleteBody(body);
  if ("error" in validation) {
    return validation;
  }

  return fleteService.createAndPublishFlete(
    empresaResult.empresaId,
    validation.data,
  );
}

export async function publishPublicacionAction(publicacionId: number) {
  const empresaResult = await getEmpresaIdForSession();
  if ("error" in empresaResult) {
    return empresaResult;
  }

  return publicacionService.publish(publicacionId, empresaResult.empresaId);
}

export async function acceptPostulacionAction(postulacionId: number) {
  const empresaResult = await getEmpresaIdForSession();
  if ("error" in empresaResult) {
    return empresaResult;
  }

  return postulacionService.accept(postulacionId, empresaResult.empresaId);
}

export async function rejectPostulacionAction(postulacionId: number) {
  const empresaResult = await getEmpresaIdForSession();
  if ("error" in empresaResult) {
    return empresaResult;
  }

  return postulacionService.reject(postulacionId, empresaResult.empresaId);
}
