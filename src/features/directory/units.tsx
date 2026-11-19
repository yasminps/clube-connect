import { Pencil, Plus, UserRoundPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Empty, PageTitle, UnitMark } from "@/components/shared";
import { DirectoryDialog, DirectoryForm } from "@/components/directory-form";
import { saveUnit, setCounselor } from "@/lib/directory/actions";
import { number } from "@/lib/utils";
import type { getUnitDirectory } from "@/lib/services/directory";
import { StatusAction } from "./status-action";
import { UnitSymbolField } from "./unit-symbol-field";

type Data = Awaited<ReturnType<typeof getUnitDirectory>>;
type Unit = Data["units"][number];

const colors = { purple: "Roxo", blue: "Azul", green: "Verde", orange: "Laranja" };

function UnitForm({ unit }: { unit?: Unit }) {
  return <DirectoryForm action={saveUnit}>
    {unit && <input type="hidden" name="id" value={unit.id} />}
    <label>Nome<input required maxLength={100} name="name" defaultValue={unit?.name} /></label>
    <label>Descrição<textarea name="description" rows={3} maxLength={600} defaultValue={unit?.description} /></label>
    <label>Cor<select name="color" defaultValue={unit?.color}>{Object.entries(colors).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <UnitSymbolField current={unit?.symbol_image} />
  </DirectoryForm>;
}

function Counselors({ unit, counselors, staff }: { unit: Unit; counselors: Data["counselors"]; staff: Data["staff"] }) {
  const ids = new Set(staff.filter(link => link.unit_id === unit.id).map(link => link.user_id));
  const available = counselors.filter(user => !ids.has(user.id));
  return <DirectoryDialog title={"Conselheiros de " + unit.name} trigger={<><UserRoundPlus size={16} />Conselheiros</>}>
    <div className="stack">
      {ids.size ? [...ids].map(id => <DirectoryForm action={setCounselor} submit="Remover vínculo" key={id}>
        <strong>{counselors.find(user => user.id === id)?.display_name ?? "Conta sem papel de conselheiro"}</strong>
        <input type="hidden" name="unit" value={unit.id} /><input type="hidden" name="user" value={id} /><input type="hidden" name="operation" value="remove" />
      </DirectoryForm>) : <Empty>Nenhum conselheiro vinculado.</Empty>}
      {available.length > 0 && <DirectoryForm action={setCounselor} submit="Vincular conselheiro">
        <input type="hidden" name="unit" value={unit.id} /><input type="hidden" name="operation" value="assign" />
        <label>Conselheiro disponível<select name="user" required defaultValue=""><option value="" disabled>Selecione</option>{available.map(user => <option key={user.id} value={user.id}>{user.display_name}</option>)}</select></label>
      </DirectoryForm>}
    </div>
  </DirectoryDialog>;
}

export function UnitsDirectory({ units, counselors, staff }: Data) {
  return <>
    <PageTitle title="Unidades" description={`${units.length} cadastradas · ${units.filter(unit => unit.active).length} ativas`} action={<DirectoryDialog primary title="Nova unidade" trigger={<><Plus size={17} />Nova unidade</>}><UnitForm /></DirectoryDialog>} />
    <Card className="directory-card">
      {units.length ? <div className="table-scroll"><table className="directory-table">
        <thead><tr><th scope="col">Unidade</th><th scope="col">Situação</th><th scope="col">Membros ativos / total</th><th scope="col">Pontos coletivos</th><th scope="col">Ações</th></tr></thead>
        <tbody>{units.map(unit => <tr key={unit.id}>
          <td><div className="directory-name">{unit.symbol_image ? <img className="unit-symbol" src={unit.symbol_image} alt="" width={36} height={36} /> : <UnitMark color={unit.color} />}<div><strong>{unit.name}</strong>{unit.description && <p className="muted directory-description">{unit.description}</p>}</div></div></td>
          <td><span className={"badge " + (unit.active ? "green" : "neutral")}>{unit.active ? "Ativa" : "Inativa"}</span></td>
          <td>{number.format(unit.active_member_count)} / {number.format(unit.member_count)}</td>
          <td><strong>{number.format(unit.points)}</strong> pts</td>
          <td><div className="directory-actions">
            <DirectoryDialog title={"Editar " + unit.name} trigger={<><Pencil size={15} />Editar</>}><UnitForm unit={unit} /></DirectoryDialog>
            <Counselors unit={unit} counselors={counselors} staff={staff} />
            <StatusAction kind="unit" id={unit.id} name={unit.name} active={unit.active} />
          </div></td>
        </tr>)}</tbody>
      </table></div> : <Empty>Nenhuma unidade cadastrada.</Empty>}
    </Card>
  </>;
}
