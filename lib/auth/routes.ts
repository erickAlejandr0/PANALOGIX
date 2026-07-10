export const TRANSPORTISTA_CONTINUE_PATH = "/continuar-en-app";

export function getOnboardingPath(roleId: number) {
  if (roleId === 1) return "/Onboarding/Transportista";
  if (roleId === 2) return "/Onboarding/Empresa";
  return "/login";
}

export function getDashboardPath(roleId: number) {
  if (roleId === 1) return TRANSPORTISTA_CONTINUE_PATH;
  if (roleId === 2) return "/dashboard";
  return "/login";
}

export function getPostAuthRedirect(user: {
  roleId: number;
  onboardingCompleted: boolean;
}) {
  if (!user.onboardingCompleted) {
    return getOnboardingPath(user.roleId);
  }
  return getDashboardPath(user.roleId);
}
