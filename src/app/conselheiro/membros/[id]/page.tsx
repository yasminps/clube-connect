import { MemberProfilePage } from "@/features/directory/pages";
import type { HistoryFilters } from "@/lib/services/directory";

export default function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<HistoryFilters> }) {
  return <MemberProfilePage roles={["COUNSELOR"]} base="/conselheiro/membros" params={params} searchParams={searchParams} />;
}
