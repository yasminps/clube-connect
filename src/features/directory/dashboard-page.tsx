import { Dashboard } from "@/features/dashboard";
import { requirePageAccess } from "@/lib/auth/page-access";
import { getClubName } from "@/lib/services/identity";
import type { ClubRole } from "@/types/database";

export async function DashboardPage({ role }: { role: ClubRole }) {
  const { client } = await requirePageAccess([role]);
  const [club, members, units] = await Promise.all([
    getClubName(),
    client.from("members").select("id", { count: "exact", head: true }),
    client.from("units").select("id", { count: "exact", head: true }),
  ]);
  if (members.error) throw members.error;
  if (units.error) throw units.error;
  return <Dashboard clubName={club} memberCount={members.count ?? 0} unitCount={units.count ?? 0} />;
}