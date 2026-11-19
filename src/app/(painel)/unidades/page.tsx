import { requirePageAccess } from "@/lib/auth/page-access";
import { panelRoles } from "@/lib/auth/access";
import { getUnitDirectory } from "@/lib/services/directory";
import { UnitsDirectory } from "@/features/directory/units";

export default async function UnitsPage() {
  const { client } = await requirePageAccess(panelRoles);
  const data = await getUnitDirectory(client);
  return <UnitsDirectory {...data} />;
}