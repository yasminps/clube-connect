import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";
import type { ClubRole } from "@/types/database";

export class ClubAccessError extends Error {
  constructor(readonly status: 401 | 403) {
    super(status === 401 ? "Sessão válida obrigatória." : "Acesso ao clube não autorizado.");
  }
}

export async function requireClubAccess(allowed?: readonly ClubRole[]) {
  const client = await createServerSupabase();
  const { data, error } = await client.auth.getClaims();
  const userId = data?.claims.sub;
  if (error || !userId) throw new ClubAccessError(401);
  if (data.claims.is_anonymous === true) throw new ClubAccessError(403);

  const result = await client.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data || (allowed && !allowed.includes(result.data.role))) throw new ClubAccessError(403);

  return { client, userId, role: result.data.role };
}