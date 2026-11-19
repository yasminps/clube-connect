import { panelRoles } from "@/lib/auth/access";
import { requirePageAccess } from "@/lib/auth/page-access";
import { getLeadership } from "@/lib/services/leadership";
import { LeadershipDirectory } from "@/features/directory/leadership";

export default async function LeadershipPage() {
  const { client } = await requirePageAccess(panelRoles);
  return <LeadershipDirectory data={await getLeadership(client)} />;
}