import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AccountArea } from "@/components/account-area";
import { Empty, Panel, UnitMark } from "@/components/shared";
import { getClubProfile, requirePageAccess } from "@/lib/auth/page-access";

export default async function CounselorArea() {
  const { client } = await requirePageAccess(["COUNSELOR"]);
  const profile = await getClubProfile();
  const result = await client.from("units").select("id, name, color").order("name");
  if (result.error) throw result.error;
  return <AccountArea title="Área do conselheiro" name={profile.name}>
    <div className="stack"><div><Button asChild><Link href="/conselheiro/membros">Gerenciar membros</Link></Button></div><Panel title="Minhas unidades">
      {result.data.length ? <ul className="record-list">{result.data.map(unit => <li key={unit.id} className="record"><UnitMark color={unit.color} /><strong>{unit.name}</strong></li>)}</ul> : <Empty>Nenhuma unidade vinculada à sua conta.</Empty>}
    </Panel></div>
  </AccountArea>;
}