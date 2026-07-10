import { db } from "@/db";
import { NewUsuario, usuarios } from "@/db/schema";
import { eq } from "drizzle-orm";

export type CreateOAuthUserInput = {
  email: string;
  googleId: string;
  roleId: number;
  photoUrl?: string;
};

export const userRepository = {
  getUserByEmail: async (email: string) => {
    try {
      const result = await db.query.usuarios.findFirst({
        where: eq(usuarios.email, email),
      });
      return result;
    } catch {
      throw new Error("Error al consultar la base de datos");
    }
  },

  getUserByGoogleId: async (googleId: string) => {
    try {
      const result = await db.query.usuarios.findFirst({
        where: eq(usuarios.googleId, googleId),
      });
      return result;
    } catch {
      throw new Error("Error al consultar la base de datos");
    }
  },

  getUserById: async (id: number) => {
    try {
      const result = await db.query.usuarios.findFirst({
        where: eq(usuarios.id, id),
      });
      return result;
    } catch {
      throw new Error("Error al consultar la base de datos");
    }
  },

  createUser: async (user: NewUsuario) => {
    try {
      const result = await db.insert(usuarios).values(user).returning();
      return result[0];
    } catch {
      throw new Error("Error al consultar la base de datos");
    }
  },

  createOAuthUser: async (user: CreateOAuthUserInput) => {
    try {
      const result = await db
        .insert(usuarios)
        .values({
          email: user.email,
          googleId: user.googleId,
          roleId: user.roleId,
          password: null,
          ...(user.photoUrl ? { photoUrl: user.photoUrl } : {}),
        })
        .returning();
      return result[0];
    } catch {
      throw new Error("Error al consultar la base de datos");
    }
  },

  linkGoogleAccount: async (
    userId: number,
    googleId: string,
    photoUrl?: string,
  ) => {
    try {
      const result = await db
        .update(usuarios)
        .set({
          googleId,
          updatedAt: new Date(),
          ...(photoUrl ? { photoUrl } : {}),
        })
        .where(eq(usuarios.id, userId))
        .returning();
      return result[0];
    } catch {
      throw new Error("Error al consultar la base de datos");
    }
  },

  updatePhotoUrl: async (userId: number, photoUrl: string) => {
    try {
      const result = await db
        .update(usuarios)
        .set({ photoUrl, updatedAt: new Date() })
        .where(eq(usuarios.id, userId))
        .returning();
      return result[0];
    } catch {
      throw new Error("Error al consultar la base de datos");
    }
  },

  markOnboardingComplete: async (userId: number) => {
    try {
      const result = await db
        .update(usuarios)
        .set({ onboardingCompleted: true, updatedAt: new Date() })
        .where(eq(usuarios.id, userId))
        .returning();
      return result[0];
    } catch {
      throw new Error("Error al consultar la base de datos");
    }
  },

  findAllUsers: async () => {
    try {
      const result = await db.select().from(usuarios);
      return result;
    } catch {
      throw new Error("Error al consultar la base de datos");
    }
  },
};
