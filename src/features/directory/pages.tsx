import { notFound } from "next/navigation";
import { getMemberDetail, getMemberDirectory, getMemberHistory, type HistoryFilters } from "@/lib/services/directory";
import { requirePageAccess } from "@/lib/auth/page-access";
import type { ClubRole } from "@/types/database";
import { MembersDirectory } from "./members";
import { MemberProfile } from "./member-profile";

export type MemberFilters = { q?: string; unit?: string; status?: string; page?: string };

export async function MembersPage({ roles, base, searchParams }: { roles: readonly ClubRole[]; base: string; searchParams: Promise<MemberFilters> }) {
  const { client } = await requirePageAccess(roles);
  const data = await getMemberDirectory(client, await searchParams);
  return <MembersDirectory data={data} base={base} />;
}

export async function MemberProfilePage({ roles, base, params, searchParams }: { roles: readonly ClubRole[]; base: string; params: Promise<{ id: string }>; searchParams: Promise<HistoryFilters> }) {
  const { client, role } = await requirePageAccess(roles);
  const { id } = await params;
  const member = await getMemberDetail(client, id);
  if (!member) notFound();
  const [history, units, account] = await Promise.all([
    getMemberHistory(client, id, await searchParams),
    client.from("units").select("id, name, active").order("name"),
    role === "ADMIN" ? client.from("members").select("user_id").eq("id", id).single() : null,
  ]);
  if (units.error) throw units.error;
  if (account?.error) throw account.error;
  return <MemberProfile member={member} history={history} units={units.data} account={account?.data?.user_id} base={base} />;
}
