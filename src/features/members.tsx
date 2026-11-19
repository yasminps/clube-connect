"use client";
import { useState } from "react";
import { Plus, Search, UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Empty, PageTitle } from "@/components/shared";
import { Field, field, FormDialog } from "@/components/form-dialog";
import { useClub } from "@/services/club-provider";
import { demoDate } from "@/data/demo";
import { formatDate } from "@/lib/utils";
import type { Member } from "@/types/club";

export function Members() {
  const { data, update } = useClub();
  const [query, setQuery] = useState("");
  const [unit, setUnit] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [creating, setCreating] = useState(false);
  const [profile, setProfile] = useState<Member | null>(null);
  const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const results = data.members.filter(item => normalized(item.name).includes(normalized(query.trim())) && (!unit || item.unitId === unit) && (!status || item.status === status));
  const unitName = (id: string) => data.units.find(item => item.id === id)?.name ?? "Sem unidade";
  return <><PageTitle title="Membros" description="Consulte os perfis e gerencie os cadastros do clube." action={<Button onClick={() => setCreating(true)}><Plus size={17} />Novo membro</Button>} />
    <Card>
      <div className="filters"><label className="search"><Search size={17} /><input aria-label="Pesquisar por nome" placeholder="Pesquisar por nome" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} /></label>
      <select aria-label="Filtrar por unidade" value={unit} onChange={event => { setUnit(event.target.value); setPage(0); }}><option value="">Todas as unidades</option>{data.units.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select aria-label="Filtrar por status" value={status} onChange={event => { setStatus(event.target.value); setPage(0); }}><option value="">Todos os status</option><option>Ativo</option><option>Inativo</option></select></div>
      {results.length ? <div className="table-scroll"><table><thead><tr><th>Nome</th><th>Unidade</th><th>Status</th><th>Cadastro</th></tr></thead><tbody>{results.slice(page * 10, page * 10 + 10).map(member => <tr key={member.id}>
        <td><button className="member-link" onClick={() => setProfile(member)}><span className="tile purple"><UsersRound size={17} /></span>{member.name}</button></td><td>{unitName(member.unitId)}</td><td><span className={"badge " + (member.status === "Ativo" ? "green" : "neutral")}>{member.status}</span></td><td>{formatDate(member.since)}</td>
      </tr>)}</tbody></table></div> : <Empty>Nenhum membro corresponde aos filtros.</Empty>}
      <div className="pagination"><span className="muted">{results.length} {results.length === 1 ? "membro" : "membros"}</span><div className="flex gap-2"><Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</Button><Button variant="outline" disabled={(page + 1) * 10 >= results.length} onClick={() => setPage(page + 1)}>Próxima</Button></div></div>
    </Card>
    {creating && <FormDialog title="Novo membro" onClose={() => setCreating(false)} onSave={form => update(previous => ({ ...previous, members: [{ id: crypto.randomUUID(), name: field(form, "name"), unitId: field(form, "unit"), since: demoDate, status: "Ativo" }, ...previous.members] }))}>
      <Field name="name" label="Nome fictício" /><label>Unidade<select name="unit" required>{data.units.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    </FormDialog>}
    {profile && <FormDialog title={profile.name} onClose={() => setProfile(null)}><dl className="details"><div><dt>Unidade</dt><dd>{unitName(profile.unitId)}</dd></div><div><dt>Status</dt><dd>{profile.status}</dd></div><div><dt>Cadastro</dt><dd>{formatDate(profile.since, { dateStyle: "long" })}</dd></div><div><dt>Presenças registradas</dt><dd>{data.attendance.filter(item => item.memberIds.includes(profile.id)).length}</dd></div></dl></FormDialog>}
  </>;
}