import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getSupabaseConfig, serverCookieOptions } from "./config";

export async function createServerSupabase({ writable = false } = {}) {
  const { url, key } = getSupabaseConfig();
  const cookieStore = await cookies();
  return createServerClient<Database>(url, key, {
    cookieOptions: serverCookieOptions,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(items) {
        if (writable) {
          for (const { name, value, options } of items) cookieStore.set(name, value, options);
        }
      },
    },
  });
}
