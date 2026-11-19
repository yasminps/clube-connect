import { requirePageAccess } from "@/lib/auth/page-access";
import { panelRoles } from "@/lib/auth/access";
import { Attendance } from "@/features/attendance";
export default async function Page() { await requirePageAccess(panelRoles); return <Attendance />; }
