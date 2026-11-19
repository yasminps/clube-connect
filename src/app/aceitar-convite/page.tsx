import { AuthForm } from "@/components/auth-form";
import { AuthFrame } from "@/components/auth-frame";
import { tokenHashPattern } from "@/lib/auth/state";
import { getClubName } from "@/lib/services/identity";

export const metadata = { referrer: "no-referrer" };

export default async function InvitePage({ searchParams }: { searchParams: Promise<{ token_hash?: string }> }) {
  const [{ token_hash: token }, club] = await Promise.all([searchParams, getClubName()]);
  const valid = typeof token === "string" && tokenHashPattern.test(token);
  return <AuthFrame clubName={club} title="Ative sua conta de liderança" description={valid ? "Escolha uma senha para acessar sua área de conselheiro." : "Abra o link do convite enviado por e-mail ou fale com a administração."}>
    {valid && <AuthForm mode="invite" token={token} />}
  </AuthFrame>;
}