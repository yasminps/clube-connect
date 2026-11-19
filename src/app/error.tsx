"use client";

import Link from "next/link";
import { AuthFrame } from "@/components/auth-frame";
import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { reset: () => void }) {
  return <AuthFrame title="Não foi possível carregar esta página" description="Tente novamente. Se o problema persistir, entre em contato com a administração.">
    <div className="flex flex-wrap gap-2 auth-back"><Button onClick={reset}>Tentar novamente</Button><Button asChild variant="outline"><Link href="/login">Ir para o login</Link></Button></div>
  </AuthFrame>;
}