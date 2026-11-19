import type { NextRequest } from "next/server";
import { refreshSupabaseSession } from "@/lib/supabase/session";

export function proxy(request: NextRequest) {
  return refreshSupabaseSession(request);
}

export const config = { matcher: ["/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"] };