"use client";
import { useState } from "react";
import { Megaphone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/shared";
import { Field, field, FormDialog } from "@/components/form-dialog";
import { useClub } from "@/services/club-provider";
import { demoDate } from "@/data/demo";
import { formatDate } from "@/lib/utils";

export function Notices() {
  const { data, update } = useClub();
  const [creating, setCreating] = useState(false);
  return <><PageTitle title="Comunicados" description="Mural de avisos e informações para as unidades." action={<Button onClick={() => setCreating(true)}><Plus size={17} />Novo comunicado</Button>} />
    <div className="stack">{[...data.notices].sort((a,b) => Number(b.important) - Number(a.important) || b.date.localeCompare(a.date)).map(item => <Card className="notice" key={item.id}><span className="tile blue"><Megaphone size={19} /></span><div><div className="notice-meta"><span className="muted">{formatDate(item.date)}</span>{item.important && <span className="badge orange">Importante</span>}</div><h2>{item.title}</h2><p className="muted preserve">{item.body}</p></div></Card>)}</div>
    {creating && <FormDialog title="Novo comunicado" submit="Publicar" onClose={() => setCreating(false)} onSave={form => update(previous => ({ ...previous, notices: [{ id: crypto.randomUUID(), title: field(form, "title"), body: field(form, "body"), date: demoDate, important: form.has("important") }, ...previous.notices] }))}><Field name="title" label="Título" /><label>Mensagem<textarea name="body" required rows={5} maxLength={1000} /></label><label className="check-row"><input type="checkbox" name="important" />Marcar como importante</label></FormDialog>}
  </>;
}