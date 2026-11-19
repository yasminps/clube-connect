"use client";
import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle, Panel } from "@/components/shared";
import { useClub } from "@/services/club-provider";

export function Settings() {
  const { data, update } = useClub();
  const [draft, setDraft] = useState<Partial<typeof data.settings>>({});
  const [saved, setSaved] = useState(false);
  return <><PageTitle title="Configurações" description="Personalize as informações gerais do clube." /><div className="settings-panel"><Panel title="Perfil do clube" subtitle="Alterações salvas neste navegador"><form className="form" onSubmit={event => {
    event.preventDefault();
    update(previous => ({ ...previous, settings: { name: (draft.name ?? previous.settings.name).trim(), description: (draft.description ?? previous.settings.description).trim() } }));
    setDraft({});
    setSaved(true);
  }}><label>Nome do clube<input required pattern={".*\\S.*"} maxLength={40} value={draft.name ?? data.settings.name} onChange={event => { setDraft({ ...draft, name: event.target.value }); setSaved(false); }} /></label><label>Descrição<textarea rows={4} maxLength={300} value={draft.description ?? data.settings.description} onChange={event => { setDraft({ ...draft, description: event.target.value }); setSaved(false); }} /></label><div className="flex flex-wrap items-center gap-3"><Button type="submit"><Save size={17} />Salvar alterações</Button><span className="confirmation" role="status">{saved ? "Configurações atualizadas." : ""}</span></div></form></Panel></div></>;
}