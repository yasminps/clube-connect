import { requirePageAccess } from "@/lib/auth/page-access";
import { panelRoles } from "@/lib/auth/access";
import { Ranking } from "@/features/ranking";
export default async function Page() { await requirePageAccess(panelRoles); return <Ranking />; }
