import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthFrame } from "@/components/auth-frame";

export default function RecoverPassword() {
  return <AuthFrame title="Recuperar senha" description="Informe o e-mail da sua conta para receber o link de recuperação.">
    <AuthForm mode="recover" />
    <Link href="/login" className="auth-link auth-back">Voltar para o login</Link>
  </AuthFrame>;
}