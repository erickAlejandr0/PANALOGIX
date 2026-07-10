"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthCookieOptions } from "@/lib/auth/cookies";
import {
  getDashboardPath,
  TRANSPORTISTA_CONTINUE_PATH,
} from "@/lib/auth/routes";
import { verifyJwtToken } from "@/lib/auth/jwt";
import { normalizePhoneToE164 } from "@/lib/phone/e164";
import {
  parseTransportistaOnboardingFormData,
  TRANSPORTISTA_ROLE_ID,
  validateEmpresaOnboardingInput,
} from "@/lib/validations/onboarding";
import { authService } from "@/service/authService";
import { onboardingService } from "@/service/onboardingService";

export async function completeOnboardingAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      redirect("/login");
    }

    const payload = await verifyJwtToken(token);
    if (!payload) {
      cookieStore.delete("token");
      redirect("/login?error=session_expired");
    }

    const result = await authService.completeOnboarding(payload.userId);
    if (!result.success) {
      redirect("/login?error=onboarding_failed");
    }

    cookieStore.set("token", result.token, getAuthCookieOptions(true));
    redirect(getDashboardPath(result.user.roleId));
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    redirect("/login?error=onboarding_failed");
  }
}

export async function completeEmpresaOnboardingAction(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return { error: "Sesión no válida" };
    }

    const payload = await verifyJwtToken(token);
    if (!payload) {
      cookieStore.delete("token");
      return { error: "Sesión expirada" };
    }

    const nombre = (formData.get("nombre") as string)?.trim();
    const ruc = (formData.get("ruc") as string)?.trim();
    const direccion = (formData.get("direccion") as string)?.trim();
    const telefono = (formData.get("telefono") as string)?.trim();

    const validationError = validateEmpresaOnboardingInput(
      nombre,
      ruc,
      direccion,
      telefono,
    );
    if (validationError) {
      return validationError;
    }

    const telefonoNormalized = normalizePhoneToE164(telefono);
    if (!telefonoNormalized.success) {
      return { error: "Teléfono corporativo inválido" };
    }

    const result = await onboardingService.completeEmpresaOnboarding(
      payload.userId,
      { nombre, ruc, direccion, telefono: telefonoNormalized.e164 },
    );

    if (!result.success) {
      return { error: result.error };
    }

    cookieStore.set("token", result.token, getAuthCookieOptions(true));
    redirect(getDashboardPath(payload.roleId));
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return { error: "Error interno al completar onboarding" };
  }
}

export async function completeTransportistaOnboardingAction(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return { error: "Sesión no válida" };
    }

    const payload = await verifyJwtToken(token);
    if (!payload) {
      cookieStore.delete("token");
      return { error: "Sesión expirada" };
    }

    if (payload.roleId !== TRANSPORTISTA_ROLE_ID) {
      return { error: "Esta acción es solo para transportistas" };
    }

    const validation = parseTransportistaOnboardingFormData(formData);
    if ("error" in validation) {
      return validation;
    }

    const result = await onboardingService.completeTransportistaOnboarding(
      payload.userId,
      validation.data,
    );

    if (!result.success) {
      return { error: result.error };
    }

    cookieStore.set("token", result.token, getAuthCookieOptions(true));
    redirect(TRANSPORTISTA_CONTINUE_PATH);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return { error: "Error interno al completar onboarding" };
  }
}

export async function getVehiculoConfigsByCategoriaAction(categoriaId: number) {
  return onboardingService.getConfigsByCategoria(categoriaId);
}

export async function getVehiculoConfigDetalleAction(configId: number) {
  const detalle = await onboardingService.getConfigDetalle(configId);
  if (!detalle) {
    return { error: "Configuración no encontrada" };
  }
  return { detalle };
}
