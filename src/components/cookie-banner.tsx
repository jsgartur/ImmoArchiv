import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "vermietify-cookie-consent"; // "all" | "essential"

export function CookieBanner() {
  const [sichtbar, setSichtbar] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setSichtbar(true);
    } catch {
      /* ignore */
    }
  }, []);

  const entscheiden = (wahl: "all" | "essential") => {
    try {
      localStorage.setItem(CONSENT_KEY, wahl);
    } catch {
      /* ignore */
    }
    setSichtbar(false);
  };

  if (!sichtbar) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border bg-card p-5 shadow-2xl sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary">
            <Cookie className="h-5 w-5" />
          </div>
          <div className="text-sm">
            <div className="font-medium">Wir respektieren Ihre Privatsphäre</div>
            <p className="mt-1 text-muted-foreground">
              Wir verwenden nur technisch notwendige Speicherung (localStorage) für Ihre Anmeldesitzung
              und Ihre Theme-Einstellung. Ihre Konto- und Objektdaten werden sicher in unserer Datenbank
              (Supabase) gespeichert. Es werden keine Tracking- oder Werbe-Cookies gesetzt. Mehr in der{" "}
              <Link to="/datenschutz" className="underline underline-offset-2 hover:text-foreground">
                Datenschutzerklärung
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2 sm:flex-col">
          <Button className="flex-1 sm:flex-none" onClick={() => entscheiden("all")}>
            Alle akzeptieren
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => entscheiden("essential")}>
            Nur notwendige
          </Button>
        </div>
      </div>
    </div>
  );
}
