"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/types/database";
import { roleHome } from "./access";
import { appOrigin } from "./origin";
import { passwordMinimum, tokenHashPattern, type AuthState } from "./state";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const genericError = "Não foi possível concluir agora. Tente novamente em instantes.";
const setupError = "A autenticação ainda não está configurada. Fale com a administração.";

function read(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}
export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: setupError };
  const email = read(form, "email").trim();
  const password = read(form, "password");
  if (email.length > 254 || !emailPattern.test(email) || !password || password.length > 1024) {
    return { error: "Informe um e-mail válido e sua senha." };
  }
  const client = await createServerSupabase({ writable: true });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    if (error?.status === 429) return { error: "Muitas tentativas. Aguarde alguns minutos." };
    if (!error?.status || error.status >= 500) return { error: genericError };
    return { error: "E-mail ou senha inválidos. Confira os dados e tente novamente." };
  }
  const role = await client.from("user_roles").select("role").eq("user_id", data.user.id).maybeSingle();
  if (role.error) {
    await client.auth.signOut({ scope: "local" });
    return { error: genericError };
  }
  if (role.data) redirect(roleHome[role.data.role]);
  const pending = await client.rpc("password_change_required");
  if (pending.error) return { error: genericError };
  redirect(pending.data ? "/alterar-senha" : "/sem-acesso");
}

export async function requestPasswordReset(_: AuthState, form: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: setupError };
  const email = read(form, "email").trim();
  if (email.length > 254 || !emailPattern.test(email)) return { error: "Informe um e-mail válido." };

  let origin: string;
  try { origin = appOrigin(); }
  catch { return { error: "A recuperação de senha ainda não está configurada. Fale com a administração." }; }

  const client = await createServerSupabase({ writable: true });
  await client.auth.resetPasswordForEmail(email, { redirectTo: origin + "/redefinir-senha" });
  return { success: "Se houver uma conta para esse e-mail, você receberá um link. Confira também a caixa de spam." };
}

export async function resetPassword(_: AuthState, form: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: setupError };
  const tokenHash = read(form, "token_hash");
  const password = read(form, "password");
  if (!tokenHashPattern.test(tokenHash)) return { error: "Link inválido. Solicite um novo link." };
  if (password.length < passwordMinimum || password.length > 72) return { error: "Use entre 12 e 72 caracteres." };
  if (password !== read(form, "confirmation")) return { error: "As duas senhas precisam ser iguais." };

  // The recovery session lives only in this action and never grants access to a browser route.
  const { url, key } = getSupabaseConfig();
  const temporary = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const verified = await temporary.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
  if (verified.error || !verified.data.user || !verified.data.session) {
    return { error: "O link é inválido, expirou ou já foi usado. Solicite um novo link." };
  }

  const result = await temporary.auth.updateUser({ password });
  if (result.error) {
    await temporary.auth.signOut({ scope: "local" });
    return { error: "A senha não foi alterada. Solicite um novo link e escolha uma senha diferente e mais forte." };
  }

  await temporary.auth.signOut({ scope: "global" });
  const client = await createServerSupabase({ writable: true });
  const current = await client.auth.getClaims();
  if (current.data?.claims.sub === verified.data.user.id) await client.auth.signOut({ scope: "local" });
  redirect("/login?senha=alterada");
}

export async function logout() {
  if (!isSupabaseConfigured()) redirect("/login");
  const client = await createServerSupabase({ writable: true });
  const { error } = await client.auth.signOut({ scope: "local" });
  if (error) redirect("/sair?erro=1");
  redirect("/login");
}
