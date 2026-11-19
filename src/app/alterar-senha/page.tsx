import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthFrame } from "@/components/auth-frame";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getClubName } from "@/lib/services/identity";

export default async function InitialPasswordPage() {
  if (!isSupabaseConfigured()) redirect("/login");
  const client = await createServerSupabase();
  const claims = await client.auth.getClaims();
  if (claims.error || !claims.data?.claims.sub) redirect("/login");

  const pending = await client.rpc("password_change_required");
  if (pending.error) throw pending.error;
  if (!pending.data) redirect("/");

  return <AuthFrame clubName={await getClubName()} title="Altere sua senha temporária" description="Crie uma senha pessoal para liberar o acesso à sua unidade.">
    <AuthForm mode="initialPassword" />
    <Link href="/sair" className="auth-link auth-back">Sair da conta</Link>
  </AuthFrame>;
}