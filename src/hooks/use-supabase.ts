"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

/** Use somente em componentes vinculados ao Supabase configurado. */
export function useSupabase() {
  const [client] = useState(createBrowserSupabase);
  return client;
}