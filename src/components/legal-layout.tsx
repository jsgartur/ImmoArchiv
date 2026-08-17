import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Logo className="h-7 w-7" />
            ImmoArchiv
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Zur Startseite
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h1>
        <div className="legal mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">{children}</div>

        <div className="mt-12 flex gap-4 border-t border-border/60 pt-6 text-sm">
          <Link to="/impressum" className="text-muted-foreground hover:text-foreground">Impressum</Link>
          <Link to="/datenschutz" className="text-muted-foreground hover:text-foreground">Datenschutzerklärung</Link>
          <Link to="/avv" className="text-muted-foreground hover:text-foreground">AVV</Link>
          <Link to="/agb" className="text-muted-foreground hover:text-foreground">AGB</Link>
          <Link to="/kuendigen" className="text-muted-foreground hover:text-foreground">Vertrag kündigen</Link>
        </div>
      </main>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{heading}</h2>
      {children}
    </section>
  );
}
