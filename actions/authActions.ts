"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthCookieOptions } from "@/lib/auth/cookies";
import { getPostAuthRedirect } from "@/lib/auth/routes";
import {
  parseRoleId,
  validateLoginInput,
  validateRegisterInput,
} from "@/lib/validations/auth";
import { authService } from "@/service/authService";

export async function registrarAction(formData: FormData) {
  try {
    const email = (formData.get("email") as string)?.trim();
    const password = formData.get("password") as string;
    const roleId = parseRoleId(formData.get("roleId") as string);

    if (roleId === null) {
      return { error: "Tipo de cuenta inválido" };
    }

    const validationError = validateRegisterInput(email, password, roleId);
    if (validationError) {
      return validationError;
    }

    const result = await authService.register({ email, password, roleId });
    if (!result.success) {
      return { error: result.error };
    }

    const cookieStore = await cookies();
    cookieStore.set("token", result.token, getAuthCookieOptions(true));
    redirect(getPostAuthRedirect(result.user));
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return { error: "Error interno al registrar usuario" };
  }
}

export async function loginAction(formData: FormData) {
  try {
    const email = (formData.get("email") as string)?.trim();
    const password = formData.get("password") as string;
    const rememberMe = formData.get("rememberMe") === "true";

    const validationError = validateLoginInput(email, password);
    if (validationError) {
      return validationError;
    }

    const result = await authService.login(email, password, rememberMe);
    if (!result.success) {
      return { error: result.error };
    }

    const cookieStore = await cookies();
    cookieStore.set("token", result.token, getAuthCookieOptions(rememberMe));
    redirect(getPostAuthRedirect(result.user));
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return { error: "Error interno al iniciar sesión" };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  redirect("/login");
}
