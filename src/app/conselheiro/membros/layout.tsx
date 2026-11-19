import { AccountArea } from "@/components/account-area";
import { getClubProfile, requirePageAccess } from "@/lib/auth/page-access";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requirePageAccess(["COUNSELOR"]);
  const profile = await getClubProfile();
  return <AccountArea name={profile.name}>{children}</AccountArea>;
}