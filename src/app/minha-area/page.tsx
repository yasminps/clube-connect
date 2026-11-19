import { AccountArea } from "@/components/account-area";
import { Empty, Panel } from "@/components/shared";
import { MemberHistory } from "@/features/directory/member-profile";
import { formatDate } from "@/lib/utils";
import { getMemberHistory, type HistoryFilters } from "@/lib/services/directory";
import { getClubProfile, requirePageAccess } from "@/lib/auth/page-access";

export default async function MemberArea({ searchParams }: { searchParams: Promise<HistoryFilters> }) {
  const { client, userId } = await requirePageAccess(["MEMBER"]);
  const profile = await getClubProfile();
  const member = await client.from("members").select("id, name, active, joined_on, unit:units(name)").eq("user_id", userId).maybeSingle();
  if (member.error) throw member.error;
  if (!member.data) return <AccountArea title="Minha área" name={profile.name}><Panel title="Meu cadastro"><Empty>Peça à administração para vincular seu cadastro à sua conta.</Empty></Panel></AccountArea>;

  const history = await getMemberHistory(client, member.data.id, await searchParams);
  return <AccountArea title="Minha área" name={profile.name}>
    <div className="stack"><Panel title="Meu cadastro">
      <dl className="details"><div><dt>Nome</dt><dd>{member.data.name}</dd></div><div><dt>Unidade</dt><dd>{member.data.unit?.name ?? "Indisponível"}</dd></div><div><dt>Situação</dt><dd>{member.data.active ? "Ativo" : "Inativo"}</dd></div><div><dt>Ingresso</dt><dd>{formatDate(member.data.joined_on, { dateStyle: "long" })}</dd></div></dl>
    </Panel><section id="historico"><MemberHistory history={history} href="/minha-area" /></section></div>
  </AccountArea>;
}
