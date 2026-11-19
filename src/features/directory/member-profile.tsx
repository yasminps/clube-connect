import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DirectoryForm } from "@/components/directory-form";
import { Empty, PageTitle, Panel } from "@/components/shared";
import { setMemberAccount } from "@/lib/directory/actions";
import { formatDate, number } from "@/lib/utils";
import type { getMemberDetail, getMemberHistory } from "@/lib/services/directory";
import { MemberEditor } from "./members";
import { StatusAction } from "./status-action";

type Member = NonNullable<Awaited<ReturnType<typeof getMemberDetail>>>;
type History = Awaited<ReturnType<typeof getMemberHistory>>;
type Unit = { id: string; name: string; active: boolean };

const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

export function MemberHistory({ history, href }: { history: History; href: string }) {
  const link = (attendancePage: number, pointsPage: number) => `${href}?attendancePage=${attendancePage}&pointsPage=${pointsPage}#historico`;
  return <div className="split">
    <Panel title="Histórico de participação" subtitle={number.format(history.present) + " presenças registradas"}>
      {history.attendance.length ? <ul className="record-list">{history.attendance.map(entry => <li key={entry.event_id} className="record">
        <div className="grow"><strong>{entry.event?.title ?? "Evento com acesso restrito"}</strong><small>{date.format(new Date(entry.event?.starts_at ?? entry.updated_at))}</small></div>
        <span className={"badge " + (entry.status === "PRESENT" ? "green" : "neutral")}>{entry.status === "PRESENT" ? "Presente" : "Ausente"}</span>
      </li>)}</ul> : <Empty>Nenhuma participação registrada.</Empty>}
      <div className="directory-actions">
        {history.attendancePage > 1 && <Button asChild variant="outline"><Link href={link(history.attendancePage - 1, history.pointsPage)}>Participações anteriores</Link></Button>}
        {history.attendanceNext && <Button asChild variant="outline"><Link href={link(history.attendancePage + 1, history.pointsPage)}>Mais participações</Link></Button>}
      </div>
    </Panel>
    <Panel title="Histórico de pontos individuais">
      {history.points.length ? <ul className="record-list">{history.points.map(entry => <li key={entry.id} className="record">
        <div className="grow"><strong>{entry.reason}</strong><small>{date.format(new Date(entry.created_at))}</small></div>
        <span className="points">{number.format(entry.amount)} <small>pts</small></span>
      </li>)}</ul> : <Empty>Nenhum lançamento registrado.</Empty>}
      <div className="directory-actions">
        {history.pointsPage > 1 && <Button asChild variant="outline"><Link href={link(history.attendancePage, history.pointsPage - 1)}>Pontos anteriores</Link></Button>}
        {history.pointsNext && <Button asChild variant="outline"><Link href={link(history.attendancePage, history.pointsPage + 1)}>Mais lançamentos</Link></Button>}
      </div>
    </Panel>
  </div>;
}

export function MemberProfile({ member, history, units, account, base }: { member: Member; history: History; units: Unit[]; account?: string | null; base: string }) {
  const unit = units.find(item => item.id === member.unit_id);
  return <>
    <Button asChild variant="ghost"><Link href={base}>Voltar para membros</Link></Button>
    <PageTitle title={member.name} description={unit?.name ?? "Unidade indisponível"} action={<div className="directory-actions"><MemberEditor units={units} member={member} /><StatusAction kind="member" id={member.id} name={member.name} active={member.active} /></div>} />
    <div className="stack">
      <Panel title="Cadastro">
        <dl className="details"><div><dt>Situação</dt><dd>{member.active ? "Ativo" : "Inativo"}</dd></div><div><dt>Data de ingresso</dt><dd>{formatDate(member.joined_on, { dateStyle: "long" })}</dd></div></dl>
      </Panel>
      <section id="historico"><MemberHistory history={history} href={base + "/" + member.id} /></section>
      {account !== undefined && <Panel title="Conta de acesso" subtitle="Use o UUID de uma conta cujo papel seja MEMBER.">
        <DirectoryForm action={setMemberAccount} submit="Salvar vínculo">
          <input type="hidden" name="id" value={member.id} />
          <label>UUID da conta<input name="user" defaultValue={account ?? ""} maxLength={36} autoComplete="off" placeholder="Deixe vazio para remover o vínculo" /></label>
        </DirectoryForm>
      </Panel>}
    </div>
  </>;
}
