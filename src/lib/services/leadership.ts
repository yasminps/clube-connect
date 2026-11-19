import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export function createLeadershipAdminClient() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!secret || secret.startsWith("sb_publishable_")) throw new Error("Configure a chave administrativa do Supabase.");
  return createClient<Database>(getSupabaseConfig().url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function getLeadership(client: SupabaseClient<Database>) {
  const [counselors, units, links] = await Promise.all([
    client.from("leadership_directory").select("*").order("display_name").order("id"),
    client.from("units").select("id, name, active").order("name").order("id"),
    client.from("unit_staff").select("unit_id, user_id").order("unit_id").order("user_id"),
  ]);
  if (counselors.error) throw counselors.error;
  if (units.error) throw units.error;
  if (links.error) throw links.error;
  return { counselors: counselors.data, units: units.data, links: links.data };
}