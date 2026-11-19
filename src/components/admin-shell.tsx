"use client";
import Link from "next/link";
import { ClubLogo } from "@/components/club-logo";
import { roleHome, roleLabel } from "@/lib/auth/access";
import type { ClubRole } from "@/types/database";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LayoutDashboard, UsersRound, Shield, ClipboardCheck, Trophy, Target, CalendarDays, Megaphone, Settings, PanelLeft, Bell, LogOut, FileText, ContactRound } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard },
  { href: "/membros", label: "Membros", icon: UsersRound },
  { href: "/unidades", label: "Unidades", icon: Shield },
  { href: "/equipe", label: "Equipe de liderança", icon: ContactRound },
  { href: "/presencas", label: "Presenças", icon: ClipboardCheck },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/desafios", label: "Desafios", icon: Target },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/comunicados", label: "Comunicados", icon: Megaphone },
  { href: '/relatorios', label: 'Relatórios', icon: FileText },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminShell({ children, profile, clubName }: { children: ReactNode; clubName: string; profile: { name: string; role: ClubRole } }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const home = roleHome[profile.role];
  const current = links.find(link => link.href === path) ?? links[0];
  const initials = profile.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase();
  return <div className="shell">
    {open && <button className="overlay" aria-label="Fechar menu" onClick={() => setOpen(false)} />}
    <aside className={open ? "sidebar sidebar-open" : "sidebar"} id="navigation">
      <Link href={home} className="brand" onClick={() => setOpen(false)}><ClubLogo /><span>Clube Connect<small>{clubName}</small></span></Link>
      <nav aria-label="Menu principal"><p className="nav-label">ESPAÇO DO CLUBE</p>{links.map(({ href, label, icon: Icon }) =>
        <Link key={href} href={href === "/" ? home : href} onClick={() => setOpen(false)} aria-current={current.href === href ? "page" : undefined}><Icon size={18} />{label}</Link>
      )}</nav>
      <div className="sidebar-footer"><span className="demo-dot" /> Módulos em demonstração</div>
    </aside>
    <div className="workspace">
      <header className="topbar">
        <div className="flex items-center gap-3"><Button className="menu-toggle" variant="ghost" size="icon" aria-label="Abrir menu" aria-controls="navigation" aria-expanded={open} onClick={() => setOpen(!open)}><PanelLeft size={20} /></Button><span className="muted breadcrumb">Painel /</span><strong>{current.label}</strong></div>
        <div className="flex items-center gap-3"><span className="header-club">{clubName}</span><Button asChild variant="outline" size="icon"><Link href="/comunicados" aria-label="Comunicados"><Bell size={17} /></Link></Button><span className="avatar" title={profile.name + " · " + roleLabel[profile.role]}>{initials}</span><Button asChild variant="outline" size="icon"><Link href="/sair" aria-label="Sair"><LogOut size={17} /></Link></Button></div>
      </header>
      <main className="page" id="conteudo">{children}</main>
    </div>
  </div>;
}