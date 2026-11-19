import { AdminShell } from "@/components/admin-shell";
import { ClubProvider } from "@/services/club-provider";
import { getClubProfile, requirePageAccess } from "@/lib/auth/page-access";
import { panelRoles } from "@/lib/auth/access";

import { getClubName } from '@/lib/services/identity';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requirePageAccess(panelRoles);
  const [profile, clubName] = await Promise.all([getClubProfile(), getClubName()]);
  return <ClubProvider><AdminShell profile={profile} clubName={clubName}>{children}</AdminShell></ClubProvider>;
}