"use client";
import Link from "next/link";
import { CalendarDays, ClipboardCheck, MapPin, Megaphone, Shield, Target, UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Empty, PageTitle, Panel, RankingList, ViewLink } from "@/components/shared";
import { PointsChart } from "@/features/ranking";
import { useClub } from "@/services/club-provider";
import { latestAttendance, nextEvent, rankUnits } from "@/services/club-selectors";
import { demoDate } from "@/data/demo";
import { formatDate, number } from "@/lib/utils";

export function Dashboard({ clubName, memberCount, unitCount }: { clubName: string; memberCount: number; unitCount: number }) {
  const { data } = useClub();
  const event = nextEvent(data.events);
  const last = latestAttendance(data);
  const attendance = data.attendance.find(item => item.eventId === last?.id);
  const challenges = data.challenges.filter(item => item.deadline >= demoDate);
  const activities = [
    ...data.notices.map(item => ({ id: item.id, date: item.date, title: item.title, kind: "Comunicado", icon: Megaphone, color: "blue" })),
    ...data.attendance.flatMap(record => {
      const meeting = data.events.find(item => item.id === record.eventId);
      return meeting ? [{ id: meeting.id, date: meeting.date, title: "Presenças registradas · " + meeting.title, kind: "Presenças", icon: ClipboardCheck, color: "green" }] : [];
    }),
  ].sort((a,b) => b.date.localeCompare(a.date)).slice(0,3);

  const metrics = [
    { icon: UsersRound, color: "purple", label: "Total de membros", value: number.format(memberCount), note: "Membros cadastrados", href: "/membros" },
    { icon: Shield, color: "blue", label: "Unidades", value: number.format(unitCount), note: "Unidades cadastradas", href: "/unidades" },
    { icon: ClipboardCheck, color: "green", label: "Última reunião", value: number.format(attendance?.memberIds.length ?? 0), note: last ? "Presenças · " + formatDate(last.date) : "Aguardando registros", href: "/presencas" },
    { icon: CalendarDays, color: "orange", label: "Próximo evento", value: event ? formatDate(event.date) : "Sem eventos", note: event?.title ?? "Consulte o calendário", href: "/calendario" },
  ];

  return <>
    <PageTitle title="Visão geral" description={clubName} action={<span className="date-pill"><CalendarDays size={16} />{formatDate(demoDate, { day: "numeric", month: "long", year: "numeric" })}</span>} />
    <section className="welcome">
      <div className="welcome-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" /><div className="orbit-icon"><CalendarDays size={49} strokeWidth={1.4} /></div></div>
      <div className="welcome-content"><span className="event-kicker"><CalendarDays size={15} /> PRÓXIMO ENCONTRO</span><h2>{event?.title ?? "Agenda do clube"}</h2>
      <p>{event ? <><span>{formatDate(event.date, { weekday: "long", day: "numeric", month: "long" })} · {event.time}</span><span><MapPin size={15} />{event.location}</span></> : "Acompanhe as próximas atividades do clube."}</p>
      <Button asChild className="welcome-button"><Link href="/calendario">Ver calendário</Link></Button></div>
    </section>
    <div className="metrics">{metrics.map(({ icon: Icon, color, label, value, note, href }) => <Link key={label} href={href} className="metric-link"><Card className="metric"><span className={"tile " + color}><Icon size={20} /></span><span className="muted">{label}</span><strong>{value}</strong><small>{note}</small></Card></Link>)}</div>
    <div className="split"><PointsChart /><Panel title="Ranking das unidades" subtitle="Classificação demonstrativa" action={<ViewLink href="/ranking">Ver ranking</ViewLink>}><RankingList units={rankUnits(data.units).slice(0,4)} /></Panel></div>
    <div className="split lower"><Panel title="Desafios em andamento" action={<ViewLink href="/desafios">Ver desafios</ViewLink>}>
      {challenges.length ? <ul className="record-list">{challenges.slice(0,3).map(item => <li className="record" key={item.id}><span className="tile purple"><Target size={17} /></span><div className="grow"><strong>{item.title}</strong><small>Até {formatDate(item.deadline)}</small></div><span className="badge purple">+{item.points} pts</span></li>)}</ul> : <Empty>Nenhum desafio em andamento.</Empty>}
    </Panel><Panel title="Atividades recentes">
      <ul className="record-list">{activities.map(({ id, date, title, kind, icon: Icon, color }) => <li className="record" key={id}><span className={"tile " + color}><Icon size={17} /></span><div className="grow"><strong>{title}</strong><small>{kind} · {formatDate(date)}</small></div></li>)}</ul>
    </Panel></div>
  </>;
}