"use client";
import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const field = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
export function FormDialog({ title, children, onClose, onSave, submit = "Salvar" }: { title: string; children: ReactNode; onClose: () => void; onSave?: (data: FormData) => void; submit?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave?.(new FormData(event.currentTarget));
    onClose();
  }
  return <dialog ref={dialog} aria-labelledby="dialog-title" onCancel={onClose}>
    <header className="dialog-heading"><h2 id="dialog-title">{title}</h2><Button variant="ghost" size="icon" aria-label="Fechar" onClick={onClose}><X size={19} /></Button></header>
    {onSave ? <form className="form" onSubmit={save}>{children}<footer><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">{submit}</Button></footer></form> : children}
  </dialog>;
}
export function Field({ label, name, type = "text", defaultValue }: { label: string; name: string; type?: string; defaultValue?: string }) {
  return <label>{label}<input name={name} type={type} defaultValue={defaultValue} required min={type === "number" ? 0 : undefined} pattern={type === "text" ? ".*\\S.*" : undefined} maxLength={type === "text" ? 100 : undefined} /></label>;
}