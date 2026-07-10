import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  JWT_EXPIRES_REMEMBER,
  JWT_EXPIRES_SESSION,
} from "@/lib/auth/constants";
import { verifyJwtToken } from "@/lib/auth/jwt";
import {
  toPublicUser,
  type JwtPayload,
  type PublicUser,
} from "@/lib/auth/user";
import type { AuthMode } from "@/lib/validations/auth";
import { userRepository } from "@/repositories/userRepository";
import type { NewUsuario, Usuario } from "@/db/schema";

const jwtSecret = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }
  return secret;
})();

export type AuthResult =
  | { success: true; token: string; user: PublicUser; linked?: boolean }
  | { success: false; error: string };

export type GoogleAuthInput = {
  googleId: string;
  email: string;
  emailVerified: boolean;
  mode: AuthMode;
  roleId?: number;
  rememberMe?: boolean;
  picture?: string;
};

async function syncGooglePhoto(userId: number, picture?: string) {
  if (!picture) return null;
  return userRepository.updatePhotoUrl(userId, picture);
}

function signToken(user: Usuario, rememberMe = true) {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
    onboardingCompleted: user.onboardingCompleted,
  };

  return jwt.sign(payload, jwtSecret, {
    expiresIn: rememberMe ? JWT_EXPIRES_REMEMBER : JWT_EXPIRES_SESSION,
  });
}

function buildAuthSuccess(
  user: Usuario,
  rememberMe = true,
  linked?: boolean,
): Extract<AuthResult, { success: true }> {
  return {
    success: true,
    token: signToken(user, rememberMe),
    user: toPublicUser(user),
    ...(linked !== undefined ? { linked } : {}),
  };
}

export const authService = {
  async register(user: NewUsuario): Promise<AuthResult> {
    try {
      const existingUser = await userRepository.getUserByEmail(user.email);
      if (existingUser) {
        if (existingUser.googleId && !existingUser.password) {
          return {
            success: false,
            error: "Este email ya está registrado con Google",
          };
        }
        return { success: false, error: "Usuario ya existe" };
      }

      if (!user.password) {
        return { success: false, error: "La contraseña es requerida" };
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);
      const newUser = await userRepository.createUser({
        ...user,
        password: hashedPassword,
        onboardingCompleted: false,
      });

      return buildAuthSuccess(newUser, true);
    } catch {
      return { success: false, error: "Error interno al registrar usuario" };
    }
  },

  async login(
    email: string,
    password: string,
    rememberMe = false,
  ): Promise<AuthResult> {
    try {
      const user = await userRepository.getUserByEmail(email);
      if (!user) {
        return { success: false, error: "Usuario no encontrado" };
      }

      if (!user.password) {
        return {
          success: false,
          error: "Esta cuenta usa Google. Inicia sesión con Google.",
        };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { success: false, error: "Contraseña incorrecta" };
      }

      return buildAuthSuccess(user, rememberMe);
    } catch {
      return { success: false, error: "Error interno al iniciar sesión" };
    }
  },

  async loginWithGoogle(input: GoogleAuthInput): Promise<AuthResult> {
    try {
      const { googleId, email, emailVerified, mode, roleId, rememberMe, picture } =
        input;

      if (!emailVerified) {
        return {
          success: false,
          error: "El email de Google no está verificado",
        };
      }

      let user = await userRepository.getUserByGoogleId(googleId);
      if (user) {
        if (picture && picture !== user.photoUrl) {
          user = (await syncGooglePhoto(user.id, picture)) ?? user;
        }
        return buildAuthSuccess(user, rememberMe ?? true);
      }

      user = await userRepository.getUserByEmail(email);

      if (user) {
        if (!user.googleId) {
          const linkedUser = await userRepository.linkGoogleAccount(
            user.id,
            googleId,
            picture,
          );
          return buildAuthSuccess(linkedUser, rememberMe ?? true, true);
        }

        if (user.googleId !== googleId) {
          return {
            success: false,
            error: "Esta cuenta ya está vinculada a otro Google",
          };
        }

        if (picture && picture !== user.photoUrl) {
          user = (await syncGooglePhoto(user.id, picture)) ?? user;
        }
      }

      if (mode === "login") {
        return {
          success: false,
          error: "No tienes cuenta. Regístrate primero.",
        };
      }

      if (!roleId) {
        return { success: false, error: "Tipo de cuenta requerido" };
      }

      const newUser = await userRepository.createOAuthUser({
        email,
        googleId,
        roleId,
        photoUrl: picture,
      });

      return buildAuthSuccess(newUser, rememberMe ?? true);
    } catch {
      return {
        success: false,
        error: "Error interno al iniciar sesión con Google",
      };
    }
  },

  async completeOnboarding(userId: number): Promise<AuthResult> {
    try {
      const user = await userRepository.getUserById(userId);
      if (!user) {
        return { success: false, error: "Usuario no encontrado" };
      }

      if (user.onboardingCompleted) {
        return buildAuthSuccess(user, true);
      }

      const updatedUser = await userRepository.markOnboardingComplete(userId);
      return buildAuthSuccess(updatedUser, true);
    } catch {
      return {
        success: false,
        error: "Error interno al completar onboarding",
      };
    }
  },

  verifyToken(token: string) {
    return verifyJwtToken(token);
  },
};
