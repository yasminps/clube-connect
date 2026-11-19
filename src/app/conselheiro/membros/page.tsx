import { MembersPage, type MemberFilters } from "@/features/directory/pages";

export default function Page({ searchParams }: { searchParams: Promise<MemberFilters> }) {
  return <MembersPage roles={["COUNSELOR"]} base="/conselheiro/membros" searchParams={searchParams} />;
}