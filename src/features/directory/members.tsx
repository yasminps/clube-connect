import Link from "next/link";
import { Pencil, Plus, Search, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, PageTitle } from "@/components/shared";
import { DirectoryDialog, DirectoryForm } from "@/components/directory-form";
import { saveMember } from "@/lib/directory/actions";
import { formatDate, number } from "@/lib/utils";
import { memberPageSize, type getMemberDetail, type getMemberDirectory } from "@/lib/services/directory";

type Data = Awaited<ReturnType<typeof getMemberDirectory>>;
type Units = Data["units"];
type Member = NonNullable<Awaited<ReturnType<typeof getMemberDetail>>>;

export function MemberEditor({ units, member }: { units: Units; member?: Member }) {
  const options = units.filter(unit => unit.active || unit.id === member?.unit_id);
  return <DirectoryDialog primary={!member} title={member ? "Editar membro" : "Novo membro"} trigger={member ? <><Pencil size={16} />Editar cadastro</> : <><Plus size={17} />Novo membro</>}>
    {options.length ? <DirectoryForm action={saveMember} submit={member ? "Salvar alterações" : "Cadastrar membro"}>
      {member && <input type="hidden" name="id" value={member.id} />}
      <label>Nome<input name="name" required maxLength={100} defaultValue={member?.name} /></label>
      <label>Unidade<select required name="unit" defaultValue={member?.unit_id ?? ""}><option value="" disabled>Selecione</option>{options.map(unit => <option key={unit.id} value={unit.id}>{unit.name}{unit.active ? "" : " (inativa)"}</option>)}</select></label>
      <label>Data de ingresso<input required type="date" name="joined" defaultValue={member?.joined_on ?? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())} /></label>
    </DirectoryForm> : <Empty>O cadastro precisa de uma unidade ativa.</Empty>}
  </DirectoryDialog>;
}

export function MembersDirectory({ data, base }: { data: Data; base: string }) {
  const { members, units, filters, count } = data;
  const pages = Math.max(1, Math.ceil(count / memberPageSize));
  function pageLink(page: number) {
    const params = new URLSearchParams({ page: String(page) });
    if (filters.q) params.set("q", filters.q);
    if (filters.unit) params.set("unit", filters.unit);
    if (filters.status) params.set("status", filters.status);
    return base + "?" + params.toString();
  }
  return <>
    <PageTitle title="Membros" description="Gerencie os cadastros e consulte o histórico de participação." action={<MemberEditor units={units} />} />
    <Card className="directory-card">
      <form className="filters directory-filters" method="get" action={base}>
        <label className="search"><Search size={17} /><input name="q" aria-label="Pesquisar por nome" placeholder="Pesquisar por nome" maxLength={100} defaultValue={filters.q} /></label>
        <select name="unit" aria-label="Unidade" defaultValue={filters.unit}><option value="">Todas as unidades</option>{units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select>
        <select name="status" aria-label="Situação" defaultValue={filters.status}><option value="">Todas as situações</option><option value="active">Ativo</option><option value="inactive">Inativo</option></select>
        <Button type="submit">Filtrar</Button>
        {(filters.q || filters.unit || filters.status) && <Button asChild variant="ghost"><Link href={base}>Limpar</Link></Button>}
      </form>
      {members.length ? <div className="table-scroll"><table>
        <thead><tr><th scope="col">Nome</th><th scope="col">Unidade</th><th scope="col">Situação</th><th scope="col">Ingresso</th></tr></thead>
        <tbody>{members.map(member => <tr key={member.id}>
          <td><Link className="member-link" href={base + "/" + member.id}><span className="tile purple"><UsersRound size={17} /></span>{member.name}</Link></td>
          <td>{units.find(unit => unit.id === member.unit_id)?.name ?? "Unidade indisponível"}</td>
          <td><span className={"badge " + (member.active ? "green" : "neutral")}>{member.active ? "Ativo" : "Inativo"}</span></td>
          <td>{formatDate(member.joined_on, { dateStyle: "short" })}</td>
        </tr>)}</tbody>
      </table></div> : <Empty>Nenhum membro encontrado.</Empty>}
      <div className="pagination">
        <span className="muted">{number.format(count)} {count === 1 ? "membro" : "membros"}</span>
        <div className="flex items-center gap-2">
          {filters.page > 1 && <Button asChild variant="outline"><Link href={pageLink(Math.min(filters.page - 1, pages))}>Anterior</Link></Button>}
          {filters.page < pages && <Button asChild variant="outline"><Link href={pageLink(filters.page + 1)}>Próxima</Link></Button>}
        </div>
      </div>
    </Card>
  </>;
}