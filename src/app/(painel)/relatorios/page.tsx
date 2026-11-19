import { PrintReport } from "@/components/print-report";
import { Empty, PageTitle, Panel } from "@/components/shared";
import { panelRoles } from "@/lib/auth/access";
import { requirePageAccess } from "@/lib/auth/page-access";
import { getClubName } from "@/lib/services/identity";
import { number } from "@/lib/utils";

export default async function ReportPage() {
  const { client } = await requirePageAccess(panelRoles);
  const [club, result] = await Promise.all([getClubName(), client.from("unit_directory").select("id, name, active, member_count, active_member_count, points").order("name").order("id")]);
  if (result.error) throw result.error;
  return <>
    <PageTitle title="Relatório de unidades" description={club + " · Clube Connect"} action={<PrintReport />} />
    <Panel title="Membros e pontuação por unidade">
      {result.data.length ? <div className="table-scroll"><table>
        <thead><tr><th scope="col">Unidade</th><th scope="col">Situação</th><th scope="col">Membros ativos</th><th scope="col">Total de membros</th><th scope="col">Pontos coletivos</th></tr></thead>
        <tbody>{result.data.map(unit => <tr key={unit.id}><td>{unit.name}</td><td>{unit.active ? "Ativa" : "Inativa"}</td><td>{number.format(unit.active_member_count)}</td><td>{number.format(unit.member_count)}</td><td>{number.format(unit.points)}</td></tr>)}</tbody>
      </table></div> : <Empty>Nenhuma unidade cadastrada.</Empty>}
    </Panel>
  </>;
}
