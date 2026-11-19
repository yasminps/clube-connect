import type { NextRequest } from "next/server";
import { refreshSupabaseSession } from "@/lib/supabase/session";

export function proxy(request: NextRequest) {
  return refreshSupabaseSession(request);
}

// Reservado para a aplicação autenticada. O painel demonstrativo permanece separado.
export const config = { matcher: ["/api/club/:path*", "/conta/:path*"] };