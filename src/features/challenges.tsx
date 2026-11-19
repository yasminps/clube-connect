"use client";
import { useState } from "react";
import { Plus, Target, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/shared";
import { Field, field, FormDialog } from "@/components/form-dialog";
import { useClub } from "@/services/club-provider";
import { demoDate } from "@/data/demo";
import { formatDate, number } from "@/lib/utils";

export function Challenges() {
  const { data, update } = useClub();
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState("");
  const challenge = data.challenges.find(item => item.id === selected);
  return <><PageTitle title="Desafios" description="Publique missões e acompanhe a participação das unidades." action={<Button onClick={() => setCreating(true)}><Plus size={17} />Novo desafio</Button>} />
    <div className="collection">{data.challenges.map(item => <Card key={item.id} className="module-card"><div className="flex items-center justify-between gap-3"><span className="tile purple"><Target size={20} /></span><span className={"badge " + (item.deadline >= demoDate ? "green" : "neutral")}>{item.deadline >= demoDate ? "Em andamento" : "Encerrado"}</span></div><h2>{item.title}</h2><p className="muted">{item.description}</p><div className="unit-stats"><span><CalendarDays size={16} />Até {formatDate(item.deadline)}</span><span className="badge purple">+{number.format(item.points)} pts</span></div><Button variant="outline" onClick={() => setSelected(item.id)}>Participação · {item.participants.length}/{data.units.length}</Button></Card>)}</div>
    {creating && <FormDialog title="Publicar desafio" submit="Publicar" onClose={() => setCreating(false)} onSave={form => update(previous => ({ ...previous, challenges: [{ id: crypto.randomUUID(), title: field(form, "title"), description: field(form, "description"), deadline: field(form, "deadline"), points: Number(field(form, "points")), participants: [] }, ...previous.challenges] }))}><Field name="title" label="Título" /><label>Descrição<textarea name="description" required rows={3} maxLength={500} /></label><Field name="deadline" label="Prazo" type="date" /><Field name="points" label="Pontuação" type="number" /></FormDialog>}
    {challenge && <FormDialog title={"Participação · " + challenge.title} onClose={() => setSelected("")} onSave={form => update(previous => ({ ...previous, challenges: previous.challenges.map(item => item.id === selected ? { ...item, participants: form.getAll("units").map(String) } : item) }))}>
      {data.units.map(unit => <label key={unit.id} className="check-row"><input type="checkbox" name="units" value={unit.id} defaultChecked={challenge.participants.includes(unit.id)} />{unit.name}</label>)}
    </FormDialog>}
  </>;
}