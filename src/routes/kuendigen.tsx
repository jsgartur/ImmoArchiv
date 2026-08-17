import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2, XCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/supabase/auth-context";
import { useStore } from "@/lib/store";
import { planById } from "@/lib/plaene";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/kuendigen")({
  component: Kuendigen,
});

/**
 * Dedizierte, jederzeit auffindbare Kündigungsseite (§ 312k BGB). Führt für
 * zahlende Abos direkt zum Stripe-Kundenportal, wo die Kündigung final
 * ausgeführt wird.
 */
function Kuendigen() {
  const { session, loading } = useAuth();
  const profil = useStore((s) => s.profil);
  const profilGeladen = useStore((s) => s.profilGeladen);
  const [busy, setBusy] = useState(false);

  const kuendigen = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("create-portal-session", {
      body: { rueckkehrUrl: `${window.location.origin}/kuendigen` },
    });
    setBusy(false);
    if (error || !data?.url) {
      toast.error("Kundenportal konnte nicht geöffnet werden. Bitte versuchen Sie es später erneut.");
      return;
    }
    window.location.href = data.url;
  };

  const plan = planById(profil.plan);

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

      <main className="mx-auto max-w-xl px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Zur Startseite
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Vertrag kündigen</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Hier können Sie Ihr kostenpflichtiges ImmoArchiv-Abonnement kündigen. Die Kündigung wird über unseren
          Zahlungsdienstleister Stripe abgewickelt und ist dort mit einem Klick möglich.
        </p>

        <div className="mt-8 rounded-2xl border bg-card p-6">
          {loading || (session && !profilGeladen) ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Lädt …
            </div>
          ) : !session ? (
            <>
              <p className="text-sm text-muted-foreground">
                Bitte melden Sie sich an, um Ihren Vertrag zu kündigen.
              </p>
              <Button asChild className="mt-4">
                <Link to="/login" search={{ redirect: "/kuendigen" }}>
                  Anmelden
                </Link>
              </Button>
            </>
          ) : profil.plan === "starter" ? (
            <p className="text-sm text-muted-foreground">
              Sie nutzen aktuell den kostenlosen Starter-Plan — es besteht kein kostenpflichtiger Vertrag, den Sie
              kündigen müssten. Ihr Konto samt aller Daten können Sie jederzeit unter{" "}
              <Link to="/dashboard/account" className="underline underline-offset-2 hover:text-foreground">
                Mein Konto
              </Link>{" "}
              unwiderruflich löschen.
            </p>
          ) : (
            <>
              <p className="text-sm">
                Aktueller Plan: <strong>{plan.name}</strong>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Die Kündigung wird zum Ende des laufenden Abrechnungszeitraums wirksam. Sie behalten bis dahin
                vollen Zugriff auf alle Professional-Funktionen.
              </p>
              <Button variant="destructive" className="mt-4" disabled={busy} onClick={kuendigen}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Abonnement jetzt kündigen
              </Button>
            </>
          )}
        </div>

        <div className="mt-8 flex gap-4 border-t border-border/60 pt-6 text-sm">
          <Link to="/impressum" className="text-muted-foreground hover:text-foreground">Impressum</Link>
          <Link to="/datenschutz" className="text-muted-foreground hover:text-foreground">Datenschutzerklärung</Link>
          <Link to="/agb" className="text-muted-foreground hover:text-foreground">AGB</Link>
        </div>
      </main>
    </div>
  );
}
