import Link from "next/link";
import { AuthFrame } from "@/components/auth-frame";
import { Button } from "@/components/ui/button";

export default function NoAccess() {
  return <AuthFrame title="Acesso ao clube pendente" description="Peça à administração do clube para verificar a liberação da sua conta.">
    <Button asChild className="auth-back"><Link href="/sair">Sair da conta</Link></Button>
  </AuthFrame>;
}