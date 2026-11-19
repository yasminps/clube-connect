"use client";

import { useState } from "react";
import { Zap } from "lucide-react";

export function ClubLogo({ large = false }: { large?: boolean }) {
  const [unavailable, setUnavailable] = useState(false);
  if (unavailable) return <span className="brand-icon" aria-hidden="true"><Zap size={21} fill="currentColor" /></span>;

  const size = large ? 88 : 42;
  return <img
    src="/bravos-guerreiros.jpg"
    alt="Logo dos Bravos Guerreiros"
    width={size}
    height={size}
    className="club-logo"
    onError={() => setUnavailable(true)}
  />;
}