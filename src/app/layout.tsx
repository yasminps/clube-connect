import type { Metadata } from "next";
import { AdminShell } from "@/components/admin-shell";
import { ClubProvider } from "@/services/club-provider";
import "./globals.css";

export const metadata: Metadata = { title: "Clube Connect | Painel administrativo", description: "Gestão de membros, unidades e atividades do clube." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><ClubProvider><AdminShell>{children}</AdminShell></ClubProvider></body></html>;
}