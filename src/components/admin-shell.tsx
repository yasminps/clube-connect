"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LayoutDashboard, UsersRound, Shield, ClipboardCheck, Trophy, Target, CalendarDays, Megaphone, Settings, Zap, PanelLeft, Bell } from "lucide-react";
import { useClub } from "@/services/club-provider";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard },
  { href: "/membros", label: "Membros", icon: UsersRound },
  { href: "/unidades", label: "Unidades", icon: Shield },
  { href: "/presencas", label: "Presenças", icon: ClipboardCheck },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/desafios", label: "Desafios", icon: Target },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/comunicados", label: "Comunicados", icon: Megaphone },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { data } = useClub();
  const [open, setOpen] = useState(false);
  const current = links.find(link => link.href === path) ?? links[0];
  return <div className="shell">
    {open && <button className="overlay" aria-label="Fechar menu" onClick={() => setOpen(false)} />}
    <aside className={open ? "sidebar sidebar-open" : "sidebar"} id="navigation">
      <Link href="/" className="brand" onClick={() => setOpen(false)}><span className="brand-icon"><Zap size={21} fill="currentColor" /></span><span>{data.settings.name}<small>Painel administrativo</small></span></Link>
      <nav aria-label="Menu principal"><p className="nav-label">ESPAÇO DO CLUBE</p>{links.map(({ href, label, icon: Icon }) =>
        <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={current.href === href ? "page" : undefined}><Icon size={18} />{label}</Link>
      )}</nav>
      <div className="sidebar-footer"><span className="demo-dot" /> Ambiente de demonstração</div>
    </aside>
    <div className="workspace">
      <header className="topbar">
        <div className="flex items-center gap-3"><Button className="menu-toggle" variant="ghost" size="icon" aria-label="Abrir menu" aria-controls="navigation" aria-expanded={open} onClick={() => setOpen(!open)}><PanelLeft size={20} /></Button><span className="muted breadcrumb">Painel /</span><strong>{current.label}</strong></div>
        <div className="flex items-center gap-3"><Button asChild variant="outline" size="icon"><Link href="/comunicados" aria-label="Comunicados"><Bell size={17} /></Link></Button><span className="avatar" title="Administração">AD</span></div>
      </header>
      <main className="page" id="conteudo">{children}</main>
    </div>
  </div>;
}