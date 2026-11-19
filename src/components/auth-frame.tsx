import { Zap } from "lucide-react";
import type { ReactNode } from "react";

export function AuthFrame({ title, description, clubName, children }: { title: string; description?: string; clubName?: string; children: ReactNode }) {
  return <main className="auth-layout">
    <div className="auth-brand">
      <div className="auth-wordmark"><span className="brand-icon"><Zap size={22} fill="currentColor" /></span><span>Clube Connect{clubName && <small className="platform-caption">{clubName}</small>}</span></div>
      <div className="auth-motif" aria-hidden="true"><span /><span /><span /></div>
    </div>
    <section className="auth-content" aria-labelledby="auth-title">
      <div className="auth-inner">
        <h1 id="auth-title">{title}</h1>
        {description && <p className="muted">{description}</p>}
        {children}
      </div>
    </section>
  </main>;
}