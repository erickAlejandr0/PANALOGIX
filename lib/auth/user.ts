import type { Usuario } from "@/db/schema";

export type PublicUser = Pick<
  Usuario,
  "id" | "email" | "roleId" | "onboardingCompleted"
>;

export type JwtPayload = {
  userId: number;
  email: string;
  roleId: number;
  onboardingCompleted: boolean;
};

export function toPublicUser(user: Usuario): PublicUser {
  return {
    id: user.id,
    email: user.email,
    roleId: user.roleId,
    onboardingCompleted: user.onboardingCompleted,
  };
}
