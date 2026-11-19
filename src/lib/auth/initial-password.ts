"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { passwordMinimum, type AuthState } from "./state";

export async function changeInitialPassword(_: AuthState, form: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) redirect("/login");
  const client = await createServerSupabase({ writable: true });
  const claims = await client.auth.getClaims();
  if (claims.error || !claims.data?.claims.sub) redirect("/login");

  const pending = await client.rpc("password_change_required");
  if (pending.error) return { error: "Não foi possível verificar seu acesso. Tente novamente." };
  if (!pending.data) redirect("/");

  const password = form.get("password");
  if (typeof password !== "string" || password.trim().length < passwordMinimum || new TextEncoder().encode(password).length > 72) {
    return { error: "Use pelo menos 12 caracteres. Se usar acentos ou símbolos, a senha pode atingir o limite antes de 72 caracteres." };
  }
  if (password !== form.get("confirmation")) return { error: "As duas senhas precisam ser iguais." };

  const result = await client.auth.updateUser({ password });
  if (result.error?.code === "same_password") return { error: "Escolha uma senha diferente da senha temporária." };
  if (result.error) return { error: "Não foi possível alterar a senha. Escolha uma senha forte e tente novamente." };

  const verified = await client.rpc("password_change_required");
  if (verified.error || verified.data) {
    return { error: "Não foi possível confirmar a troca. Entre novamente ou procure a administração." };
  }
  await client.auth.signOut({ scope: "global" });
  redirect("/login?senha=primeiro-acesso");
}