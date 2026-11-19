"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";

function SubmitLogout() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saindo…" : "Sair da conta"}</Button>;
}

export function LogoutForm() {
  return <form action={logout} className="auth-back"><SubmitLogout /></form>;
}