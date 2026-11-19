"use client";
import { useState } from "react";
import { ClipboardCheck, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, PageTitle, Panel } from "@/components/shared";
import { useClub } from "@/services/club-provider";
import { formatDate } from "@/lib/utils";

export function Attendance() {
  const { data, update } = useClub();
  const [selected, setSelected] = useState(data.events[0]?.id ?? "");
  const [draft, setDraft] = useState<string[] | null>(null);
  const [saved, setSaved] = useState(false);
  const checked = draft ?? data.attendance.find(record => record.eventId === selected)?.memberIds ?? [];
  const activeMembers = data.members.filter(member => member.status === "Ativo" || checked.includes(member.id));
  function save() {
    update(previous => ({ ...previous, attendance: [...previous.attendance.filter(item => item.eventId !== selected), { eventId: selected, memberIds: checked }] }));
    setSaved(true);
  }
  return <><PageTitle title="Presenças" description="Registre os participantes de cada encontro e consulte o histórico." />
    <div className="split"><Panel title="Lista de presença" subtitle={checked.length + " presentes"} action={<Button onClick={save} disabled={!selected}><Save size={16} />Salvar presença</Button>}>
      <label className="form">Evento<select value={selected} onChange={event => { setSelected(event.target.value); setDraft(null); setSaved(false); }}>{data.events.map(item => <option key={item.id} value={item.id}>{item.title} · {formatDate(item.date)}</option>)}</select></label>
      <p className="confirmation" role="status">{saved ? "Registro atualizado." : ""}</p>
      <ul className="attendance-list record-list">{activeMembers.map(member => <li className="record" key={member.id}><label className="check-row"><input type="checkbox" checked={checked.includes(member.id)} onChange={event => { setDraft(event.target.checked ? [...checked, member.id] : checked.filter(id => id !== member.id)); setSaved(false); }} /><span><strong>{member.name}</strong><small>{data.units.find(item => item.id === member.unitId)?.name}</small></span></label></li>)}</ul>
    </Panel><Panel title="Histórico" subtitle="Encontros com presença registrada">{data.attendance.length ? <ul className="record-list">{[...data.attendance].sort((a,b) => (data.events.find(item => item.id === b.eventId)?.date ?? "").localeCompare(data.events.find(item => item.id === a.eventId)?.date ?? "")).map(record => {
      const event = data.events.find(item => item.id === record.eventId);
      return event && <li className="record" key={record.eventId}><span className="tile green"><ClipboardCheck size={17} /></span><div className="grow"><strong>{event.title}</strong><small>{formatDate(event.date)}</small></div><span className="badge green">{record.memberIds.length} presentes</span></li>;
    })}</ul> : <Empty>Nenhum registro de presença.</Empty>}</Panel></div>
  </>;
}