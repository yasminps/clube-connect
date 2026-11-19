import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getSupabaseConfig, isSupabaseConfigured, serverCookieOptions } from "./config";

export async function refreshSupabaseSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  }
  const { url, key } = getSupabaseConfig();
  let response = NextResponse.next({ request });
  const client = createServerClient<Database>(url, key, {
    cookieOptions: serverCookieOptions,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(items, headers) {
        for (const { name, value } of items) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of items) response.cookies.set(name, value, options);
        for (const [name, value] of Object.entries(headers ?? {})) response.headers.set(name, value);
      },
    },
  });
  await client.auth.getClaims();
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
