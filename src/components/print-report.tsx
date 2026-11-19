"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintReport() {
  return <Button className="report-print" onClick={() => window.print()}><Printer size={17} />Imprimir relatório</Button>;
}