import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthFrame } from "@/components/auth-frame";
import { tokenHashPattern } from "@/lib/auth/state";

export const metadata = { referrer: "no-referrer" };

export default async function ResetPassword({ searchParams }: { searchParams: Promise<{ token_hash?: string }> }) {
  const { token_hash: token } = await searchParams;
  const valid = typeof token === "string" && tokenHashPattern.test(token);
  return <AuthFrame title="Redefinir senha" description={valid ? "Escolha uma nova senha para entrar na sua conta." : "Use o link enviado ao seu e-mail ou solicite um novo."}>
    {valid && <AuthForm mode="reset" token={token} />}
    <Link href="/recuperar-senha" className="auth-link auth-back">Solicitar novo link</Link>
  </AuthFrame>;
}