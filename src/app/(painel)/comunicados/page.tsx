import { Notices } from "@/features/notices";
import { requirePageAccess } from "@/lib/auth/page-access";
import { panelRoles } from "@/lib/auth/access";
import { getClubName } from "@/lib/services/identity";

export default async function Page() {
  await requirePageAccess(panelRoles);
  return <Notices clubName={await getClubName()} />;
}