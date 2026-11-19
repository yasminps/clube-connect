"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { login, requestPasswordReset, resetPassword } from "@/lib/auth/actions";
import { changeInitialPassword } from "@/lib/auth/initial-password";
import { passwordMinimum, type AuthState } from "@/lib/auth/state";

const variants = {
  initialPassword: { action: changeInitialPassword, label: "Alterar senha", pending: "Salvando…" },
  login: { action: login, label: "Entrar", pending: "Entrando…" },
  recover: { action: requestPasswordReset, label: "Enviar link", pending: "Enviando…" },
  reset: { action: resetPassword, label: "Salvar nova senha", pending: "Salvando…" },
};
const initial: AuthState = {};

export function AuthForm({ mode, token }: { mode: keyof typeof variants; token?: string }) {
  const passwordForm = mode === "reset" || mode === "initialPassword";
  const { action, label, pending } = variants[mode];
  const [state, submit, busy] = useActionState(action, initial);
  return <form action={submit} className="form auth-form" aria-busy={busy}>
    <div aria-live="polite" className="auth-status">
      {state.error && <p className="auth-error" role="alert">{state.error}</p>}
      {state.success && <p className="auth-success" role="status">{state.success}</p>}
    </div>
    {!passwordForm && <label htmlFor="auth-email">E-mail
      <input id="auth-email" name="email" required type="email" autoComplete="username" maxLength={254} />
    </label>}
    {mode === "login" && <>
      <label htmlFor="auth-password">Senha
        <input id="auth-password" name="password" required type="password" autoComplete="current-password" maxLength={1024} />
      </label>
      <Link href="/recuperar-senha" className="auth-link">Esqueci minha senha</Link>
    </>}
    {passwordForm && <>
      {mode === "reset" && <input type="hidden" name="token_hash" value={token} />}
      <label htmlFor="new-password">Nova senha
        <input id="new-password" name="password" required type="password" minLength={passwordMinimum} maxLength={72} autoComplete="new-password" aria-describedby="password-help" />
      </label>
      <p className="muted" id="password-help">Use pelo menos {passwordMinimum} caracteres.</p>
      <label htmlFor="confirmation">Confirme a nova senha
        <input id="confirmation" name="confirmation" required type="password" minLength={passwordMinimum} maxLength={72} autoComplete="new-password" />
      </label>
    </>}
    <Button type="submit" disabled={busy}>{busy ? pending : label}</Button>
  </form>;
}