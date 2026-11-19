"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DirectoryState } from "@/lib/directory/validation";

type Action = (state: DirectoryState, form: FormData) => Promise<DirectoryState>;

export function DirectoryForm({ action, children, submit = "Salvar" }: { action: Action; children: ReactNode; submit?: string }) {
  const [state, dispatch, pending] = useActionState(action, {});
  return <form action={dispatch} className="form" aria-busy={pending} onSubmit={event => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    startTransition(() => dispatch(values));
  }}>
    {children}
    {state.error && <p className="auth-error" role="alert">{state.error}</p>}
    {state.success && <p className="auth-success" role="status">{state.success}</p>}
    <div><Button type="submit" disabled={pending}>{pending ? "Salvando…" : submit}</Button></div>
  </form>;
}

export function DirectoryDialog({ title, trigger, children, primary = false }: { title: string; trigger: ReactNode; children: ReactNode; primary?: boolean }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
  }, [open]);
  function close() {
    setOpen(false);
    button.current?.focus();
  }
  return <>
    <Button ref={button} variant={primary ? "default" : "outline"} onClick={() => setOpen(true)}>{trigger}</Button>
    {open && <dialog ref={dialog} aria-label={title} onClose={close}>
      <header className="dialog-heading"><h2>{title}</h2><Button variant="ghost" size="icon" aria-label="Fechar" onClick={() => dialog.current?.close()}><X size={18} /></Button></header>
      {children}
    </dialog>}
  </>;
}
