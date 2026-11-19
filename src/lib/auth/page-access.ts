import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { ClubAccessError, requireClubAccess } from "@/lib/services/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ClubRole } from "@/types/database";
import { accessRedirect } from "./access";

const getAccess = cache(async () => {
  if (!isSupabaseConfigured()) redirect("/login");
  try {
    return await requireClubAccess();
  } catch (error) {
    if (error instanceof ClubAccessError) {
      if (error.status === 428) redirect("/alterar-senha");
      redirect(error.status === 401 ? "/login" : "/sem-acesso");
    }
    throw error;
  }
});

export async function requirePageAccess(allowed?: readonly ClubRole[]) {
  const access = await getAccess();
  const destination = accessRedirect(access.role, allowed);
  if (destination) redirect(destination);
  return access;
}

export const getClubProfile = cache(async () => {
  const { client, userId, role } = await getAccess();
  const result = await client.from("profiles").select("display_name").eq("id", userId).single();
  if (result.error) throw result.error;
  return { name: result.data.display_name, role };
});
