import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Empty, PageTitle } from "@/components/shared";
import { DirectoryDialog, DirectoryForm } from "@/components/directory-form";
import { inviteCounselor, resendCounselorInvite, updateCounselor } from "@/lib/directory/leadership-actions";
import type { getLeadership } from "@/lib/services/leadership";

type Data = Awaited<ReturnType<typeof getLeadership>>;
type Counselor = Data["counselors"][number];

function UnitChoices({ units, selected = [] }: { units: Data["units"]; selected?: string[] }) {
  return <fieldset className="form leadership-units">
    <legend>Unidades</legend>
    {units.map(unit => <label key={unit.id} className="check-row">
      <input type="checkbox" name="units" value={unit.id} defaultChecked={selected.includes(unit.id)} />
      {unit.name}{unit.active ? "" : " (inativa)"}
    </label>)}
  </fieldset>;
}

function InviteDialog({ units }: { units: Data["units"] }) {
  return <DirectoryDialog primary title="Convidar conselheiro" trigger={<><Plus size={17} />Convidar conselheiro</>}>
    {units.length ? <DirectoryForm action={inviteCounselor} submit="Enviar convite">
      <label>Nome<input name="name" required maxLength={100} /></label>
      <label>E-mail<input type="email" name="email" required maxLength={254} /></label>
      <UnitChoices units={units} />
    </DirectoryForm> : <Empty>Cadastre ou ative uma unidade para enviar o convite.</Empty>}
  </DirectoryDialog>;
}

function CounselorActions({ counselor, units, selected }: { counselor: Counselor; units: Data["units"]; selected: string[] }) {
  return <div className="directory-actions">
    <DirectoryDialog title={"Unidades de " + counselor.display_name} trigger="Alterar vínculos">
      <DirectoryForm action={updateCounselor} submit="Salvar vínculos">
        <input type="hidden" name="id" value={counselor.id} /><input type="hidden" name="operation" value="links" />
        <UnitChoices units={units} selected={selected} />
      </DirectoryForm>
    </DirectoryDialog>
    <DirectoryDialog title={counselor.active ? "Desativar acesso" : "Reativar acesso"} trigger={counselor.active ? "Desativar" : "Reativar"}>
      <DirectoryForm action={updateCounselor} submit={counselor.active ? "Desativar acesso" : "Reativar acesso"}>
        <p>{counselor.active ? "O acesso será bloqueado e os vínculos e o histórico serão preservados." : "A conta voltará a acessar as unidades vinculadas."}</p>
        <input type="hidden" name="id" value={counselor.id} />
        <input type="hidden" name="operation" value={counselor.active ? "deactivate" : "activate"} />
      </DirectoryForm>
    </DirectoryDialog>
    {counselor.active && !counselor.confirmed && counselor.email && <DirectoryDialog title="Reenviar convite" trigger="Reenviar">
      <DirectoryForm action={resendCounselorInvite} submit="Reenviar convite">
        <p>Será enviado um novo link para {counselor.email}.</p>
        <input type="hidden" name="id" value={counselor.id} />
      </DirectoryForm>
    </DirectoryDialog>}
  </div>;
}

export function LeadershipDirectory({ data: { counselors, units, links } }: { data: Data }) {
  return <>
    <PageTitle title="Equipe de liderança" description="Convide conselheiros e gerencie o acesso às unidades." action={<InviteDialog units={units.filter(unit => unit.active)} />} />
    <Card className="directory-card">
      {counselors.length ? <div className="table-scroll"><table>
        <thead><tr><th scope="col">Conselheiro</th><th scope="col">Unidades</th><th scope="col">Situação</th><th scope="col">Ações</th></tr></thead>
        <tbody>{counselors.map(counselor => {
          const selected = links.filter(link => link.user_id === counselor.id).map(link => link.unit_id);
          const unitNames = units.filter(unit => selected.includes(unit.id)).map(unit => unit.name);
          const status = !counselor.active ? "Desativado" : counselor.confirmed ? "Ativo" : "Convite pendente";
          return <tr key={counselor.id}>
            <td><strong>{counselor.display_name}</strong>{counselor.email && <div className="muted">{counselor.email}</div>}</td>
            <td>{unitNames.length ? <ul className="leadership-unit-list">{unitNames.map((name, index) => <li key={index}>{name}</li>)}</ul> : "Sem unidades"}</td>
            <td><span className={"badge " + (status === "Ativo" ? "green" : "neutral")}>{status}</span></td>
            <td><CounselorActions counselor={counselor} units={units} selected={selected} /></td>
          </tr>;
        })}</tbody>
      </table></div> : <Empty>Nenhum conselheiro cadastrado.</Empty>}
    </Card>
  </>;
}
