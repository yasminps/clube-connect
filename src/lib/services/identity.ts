import "server-only";

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export const getClubName = cache(async () => {
  if (!isSupabaseConfigured()) return "Bravos Guerreiros";
  const { url, key } = getSupabaseConfig();
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(3500) }) },
  });
  const { data } = await client.from("club_identity").select("name").maybeSingle();
  return data?.name ?? "Bravos Guerreiros";
});