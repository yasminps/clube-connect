"use client";
import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, PageTitle, Panel } from "@/components/shared";
import { Field, field, FormDialog } from "@/components/form-dialog";
import { useClub } from "@/services/club-provider";
import { demoDate } from "@/data/demo";
import { formatDate } from "@/lib/utils";
import type { ClubEvent } from "@/types/club";

const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const kinds: ClubEvent["kind"][] = ["Reunião", "Evento", "Atividade"];
const tones = { "Reunião": "blue", "Evento": "purple", "Atividade": "green" };
const monthKey = (year: number, month: number) => year + "-" + String(month + 1).padStart(2, "0");
export function Calendar() {
  const { data, update } = useClub();
  const [month, setMonth] = useState(() => new Date(demoDate + "T12:00:00"));
  const [selected, setSelected] = useState("");
  const [creating, setCreating] = useState(false);
  const year = month.getFullYear();
  const index = month.getMonth();
  const prefix = monthKey(year, index);
  const offset = new Date(year, index, 1).getDay();
  const count = new Date(year, index + 1, 0).getDate();
  const events = data.events.filter(item => (selected ? item.date === selected : item.date.startsWith(prefix))).sort((a,b) => (a.date + a.time).localeCompare(b.date + b.time));
  function navigate(change: number) { setMonth(new Date(year, index + change, 1)); setSelected(""); }
  return <><PageTitle title="Calendário" description="Consulte reuniões, encontros e atividades do clube." action={<Button onClick={() => setCreating(true)}><Plus size={17} />Novo evento</Button>} />
    <div className="split calendar-layout"><Card>
      <header className="panel-heading"><h2 className="month-name">{formatDate(prefix + "-01", { month: "long", year: "numeric" })}</h2><div className="flex gap-2"><Button variant="outline" size="icon" aria-label="Mês anterior" onClick={() => navigate(-1)}><ChevronLeft size={17} /></Button><Button variant="outline" size="icon" aria-label="Próximo mês" onClick={() => navigate(1)}><ChevronRight size={17} /></Button></div></header>
      <div className="calendar-grid">{weekdays.map(day => <div key={day} className="weekday">{day}</div>)}{Array.from({ length: offset }, (_, i) => <span key={"blank" + i} className="calendar-blank" />)}
      {Array.from({ length: count }, (_, i) => {
        const date = prefix + "-" + String(i + 1).padStart(2, "0");
        const dayEvents = data.events.filter(item => item.date === date);
        return <button key={date} type="button" className="calendar-day" aria-label={formatDate(date, { dateStyle: "long" }) + (dayEvents.length ? " · " + dayEvents.length + " eventos" : "")} aria-current={date === demoDate ? "date" : undefined} aria-pressed={selected === date} onClick={() => setSelected(selected === date ? "" : date)}><span>{i + 1}</span>{dayEvents.length > 0 && <span className={"calendar-marker " + tones[dayEvents[0].kind]}>{dayEvents[0].title}</span>}</button>;
      })}</div>
    </Card><Panel title={selected ? formatDate(selected, { day: "numeric", month: "long" }) : "Agenda do mês"} action={selected && <Button variant="ghost" onClick={() => setSelected("")}>Ver mês</Button>}>{events.length ? <ul className="record-list">{events.map(item => <li key={item.id} className="record"><span className={"tile " + tones[item.kind]}><CalendarDays size={17} /></span><div className="grow"><strong>{item.title}</strong><small>{item.kind} · {formatDate(item.date)} · {item.time}</small><small className="event-location"><MapPin size={13} />{item.location}</small></div></li>)}</ul> : <Empty>Nenhum evento neste período.</Empty>}</Panel></div>
    {creating && <FormDialog title="Novo evento" onClose={() => setCreating(false)} onSave={form => {
      const date = field(form, "date");
      update(previous => ({ ...previous, events: [...previous.events, { id: crypto.randomUUID(), title: field(form, "title"), date, time: field(form, "time"), location: field(form, "location"), kind: field(form, "kind") as ClubEvent["kind"] }] }));
      setMonth(new Date(date + "T12:00:00"));
      setSelected(date);
    }}><Field name="title" label="Nome do evento" /><label>Tipo<select name="kind">{kinds.map(kind => <option key={kind}>{kind}</option>)}</select></label><div className="form-pair"><Field name="date" label="Data" type="date" defaultValue={selected || (prefix === demoDate.slice(0, 7) ? demoDate : prefix + "-01")} /><Field name="time" label="Horário" type="time" /></div><Field name="location" label="Local" /></FormDialog>}
  </>;
}