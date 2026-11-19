import { panelRoles } from "@/lib/auth/access";
import { MembersPage, type MemberFilters } from "@/features/directory/pages";

export default function Page({ searchParams }: { searchParams: Promise<MemberFilters> }) {
  return <MembersPage roles={panelRoles} base="/membros" searchParams={searchParams} />;
}