import Link from "next/link";
import { LogOut, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/shared";
import { getClubName } from "@/lib/services/identity";

export async function AccountArea({ title, name, children }: { title?: string; name: string; children: ReactNode }) {
  const club = await getClubName();
  return <>
    <header className="topbar"><div className="flex items-center gap-3"><span className="brand-icon"><Zap size={20} fill="currentColor" /></span><div><strong>{club}</strong><small className="platform-caption">Clube Connect</small></div></div>
      <Button asChild variant="outline"><Link href="/sair"><LogOut size={16} />Sair</Link></Button>
    </header>
    <main className="page account-area">{title && <PageTitle title={title} description={name} />}{children}</main>
  </>;
}