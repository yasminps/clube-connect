"use client";
import { useState } from "react";
import { Plus, Trophy, UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTitle, UnitMark } from "@/components/shared";
import { Field, field, FormDialog } from "@/components/form-dialog";
import { useClub } from "@/services/club-provider";
import { number } from "@/lib/utils";

export function Units() {
  const { data, update } = useClub();
  const [creating, setCreating] = useState(false);
  return <><PageTitle title="Unidades" description="Acompanhe as equipes, seus conselheiros e a pontuação." action={<Button onClick={() => setCreating(true)}><Plus size={17} />Nova unidade</Button>} />
    <div className="collection">{data.units.map(unit => <Card key={unit.id} className="unit-card"><UnitMark color={unit.color} /><h2>{unit.name}</h2><p className="muted">{unit.counselor}</p><div className="unit-stats"><span><UsersRound size={17} />{data.members.filter(item => item.unitId === unit.id).length} membros</span><span><Trophy size={17} />{number.format(unit.points)} pts</span></div></Card>)}</div>
    {creating && <FormDialog title="Nova unidade" onClose={() => setCreating(false)} onSave={form => update(previous => ({ ...previous, units: [...previous.units, { id: crypto.randomUUID(), name: field(form, "name"), counselor: field(form, "counselor"), color: field(form, "color"), points: 0 }] }))}>
      <Field name="name" label="Nome da unidade" /><Field name="counselor" label="Conselheiro responsável" /><label>Cor da unidade<select name="color"><option value="purple">Roxo</option><option value="blue">Azul</option><option value="green">Verde</option><option value="orange">Laranja</option></select></label>
    </FormDialog>}
  </>;
}