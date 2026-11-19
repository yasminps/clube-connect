import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { number } from "@/lib/utils";
import type { Unit } from "@/types/club";

export function PageTitle({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="page-title"><div><h1>{title}</h1><p className="muted">{description}</p></div>{action}</div>;
}
export function Panel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return <Card><header className="panel-heading"><div><h2>{title}</h2>{subtitle && <p className="muted">{subtitle}</p>}</div>{action}</header>{children}</Card>;
}
export function ViewLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="view-link">{children}<ArrowUpRight size={15} /></Link>;
}
export function Empty({ children }: { children: ReactNode }) { return <p className="empty muted">{children}</p>; }
export function UnitMark({ color }: { color: string }) { return <span className={"tile " + color}><Shield size={17} /></span>; }
export function RankingList({ units }: { units: Unit[] }) {
  return <ol className="record-list">{units.map((unit, index) => <li key={unit.id} className="record">
    <span className="rank">{String(index + 1).padStart(2, "0")}</span><UnitMark color={unit.color} /><strong className="grow">{unit.name}</strong><span className="points">{number.format(unit.points)} <small>pts</small></span>
  </li>)}</ol>;
}