import type { ClubRole } from "@/types/database";

export const roleHome: Record<ClubRole, string> = {
  ADMIN: "/",
  DIRECTOR: "/diretoria",
  COUNSELOR: "/conselheiro",
  MEMBER: "/minha-area",
};
export const roleLabel: Record<ClubRole, string> = {
  ADMIN: "Administração",
  DIRECTOR: "Diretoria",
  COUNSELOR: "Conselheiro",
  MEMBER: "Membro",
};
export const panelRoles = ["ADMIN", "DIRECTOR"] as const;

export function accessRedirect(role: ClubRole | null, allowed?: readonly ClubRole[]) {
  if (!role) return "/login";
  return allowed && !allowed.includes(role) ? roleHome[role] : null;
}