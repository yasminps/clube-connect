import { requirePageAccess } from "@/lib/auth/page-access";
import { panelRoles } from "@/lib/auth/access";
import { Challenges } from "@/features/challenges";
export default async function Page() { await requirePageAccess(panelRoles); return <Challenges />; }
