import { AuthFrame } from "@/components/auth-frame";
import { LogoutForm } from "@/components/logout-form";

export default async function SignOut({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return <AuthFrame title="Sair do Clube Connect">
    {erro === "1" && <p role="alert" className="auth-error auth-message">Não foi possível encerrar a sessão. Tente novamente.</p>}
    <LogoutForm />
  </AuthFrame>;
}