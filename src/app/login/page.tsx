import { AuthForm } from "@/components/auth-form";
import { AuthFrame } from "@/components/auth-frame";

import { getClubName } from '@/lib/services/identity';

export default async function Login({ searchParams }: { searchParams: Promise<{ senha?: string }> }) {
  const { senha } = await searchParams;
  const clubName = await getClubName();
  return <AuthFrame clubName={clubName} title="Entre no Clube Connect" description="Use o e-mail e a senha da sua conta do clube.">
    {senha === "alterada" && <p className="auth-success auth-message" role="status">Senha alterada. Entre com a nova senha.</p>}
    {senha === "convite" && <p className="auth-success auth-message" role="status">Conta ativada. Entre com a senha que você criou.</p>}
    <AuthForm mode="login" />
  </AuthFrame>;
}