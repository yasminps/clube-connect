import { requirePageAccess } from "@/lib/auth/page-access";
import { panelRoles } from "@/lib/auth/access";
import { Calendar } from "@/features/calendar";
export default async function Page() { await requirePageAccess(panelRoles); return <Calendar />; }
