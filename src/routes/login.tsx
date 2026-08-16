import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Loader2, ArrowLeft, User, Building2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/supabase/auth-context";
import { toast } from "sonner";

type LoginSearch = { redirect?: string };

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
});

type Modus = "login" | "registrieren" | "passwort-vergessen";

function LoginPage() {
  const { session, loading: authLoading, signIn, signUp, resetPassword, resendConfirmation } = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });

  const [modus, setModus] = useState<Modus>("login");
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [passwortWiederholen, setPasswortWiederholen] = useState("");
  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [geburtsdatum, setGeburtsdatum] = useState("");
  const [kontotyp, setKontotyp] = useState<"privat" | "unternehmen">("privat");
  const [firma, setFirma] = useState("");
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [hinweis, setHinweis] = useState<string | null>(null);
  const [zeigeErneutSenden, setZeigeErneutSenden] = useState(false);
  const [erneutSendenBusy, setErneutSendenBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && session) {
      navigate({ to: redirect || "/dashboard" });
    }
  }, [authLoading, session, redirect, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFehler(null);
    setHinweis(null);
    setZeigeErneutSenden(false);
    setBusy(true);
    try {
      if (modus === "login") {
        const { error } = await signIn(email, passwort);
        if (error) {
          setFehler(error);
          if (error.includes("bestätigen")) setZeigeErneutSenden(true);
        } else navigate({ to: redirect || "/dashboard" });
      } else if (modus === "registrieren") {
        if (!vorname.trim() || !nachname.trim()) {
          setFehler("Bitte Vor- und Nachname angeben.");
          setBusy(false);
          return;
        }
        if (passwort !== passwortWiederholen) {
          setFehler("Die Passwörter stimmen nicht überein.");
          setBusy(false);
          return;
        }
        const { error, hatSession } = await signUp(email, passwort, { vorname, nachname, geburtsdatum, kontotyp, firma });
        if (error) setFehler(error);
        else if (hatSession) {
          toast.success("Registrierung erfolgreich");
          navigate({ to: redirect || "/dashboard" });
        } else {
          setHinweis("Konto erstellt! Bitte bestätigen Sie Ihre E-Mail-Adresse, um sich anzumelden.");
          toast.success("Registrierung erfolgreich");
        }
      } else {
        const { error } = await resetPassword(email);
        if (error) setFehler(error);
        else setHinweis("Falls ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen versendet.");
      }
    } finally {
      setBusy(false);
    }
  };

  const erneutSenden = async () => {
    if (!email.trim()) {
      setFehler("Bitte zuerst Ihre E-Mail-Adresse eingeben.");
      return;
    }
    setErneutSendenBusy(true);
    const { error } = await resendConfirmation(email);
    setErneutSendenBusy(false);
    if (error) setFehler(error);
    else {
      setFehler(null);
      setZeigeErneutSenden(false);
      setHinweis("Bestätigungs-E-Mail erneut gesendet. Bitte Postfach prüfen.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 font-semibold">
          <Logo className="h-8 w-8" />
          ImmoArchiv
        </Link>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">
            {modus === "login" && "Anmelden"}
            {modus === "registrieren" && "Konto erstellen"}
            {modus === "passwort-vergessen" && "Passwort zurücksetzen"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {modus === "login" && "Willkommen zurück bei ImmoArchiv."}
            {modus === "registrieren" && "Kostenlos starten – keine Kreditkarte nötig."}
            {modus === "passwort-vergessen" && "Wir senden Ihnen einen Link zum Zurücksetzen."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {modus === "registrieren" && (
              <div>
                <Label className="text-xs">Ich bin…</Label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setKontotyp("privat")}
                    className={
                      "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition " +
                      (kontotyp === "privat" ? "border-primary bg-primary/5 font-medium" : "hover:border-foreground/30")
                    }
                  >
                    <User className="h-4 w-4" /> Privatvermieter
                  </button>
                  <button
                    type="button"
                    onClick={() => setKontotyp("unternehmen")}
                    className={
                      "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition " +
                      (kontotyp === "unternehmen" ? "border-primary bg-primary/5 font-medium" : "hover:border-foreground/30")
                    }
                  >
                    <Building2 className="h-4 w-4" /> Unternehmen
                  </button>
                </div>
              </div>
            )}

            {modus === "registrieren" && kontotyp === "unternehmen" && (
              <div>
                <Label className="text-xs">Firma</Label>
                <Input
                  autoComplete="organization"
                  required
                  value={firma}
                  onChange={(e) => setFirma(e.target.value)}
                  placeholder="Mustermann Immobilien GmbH"
                />
              </div>
            )}

            {modus === "registrieren" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Vorname</Label>
                  <Input
                    autoComplete="given-name"
                    required
                    value={vorname}
                    onChange={(e) => setVorname(e.target.value)}
                    placeholder="Max"
                  />
                </div>
                <div>
                  <Label className="text-xs">Nachname</Label>
                  <Input
                    autoComplete="family-name"
                    required
                    value={nachname}
                    onChange={(e) => setNachname(e.target.value)}
                    placeholder="Mustermann"
                  />
                </div>
              </div>
            )}

            {modus === "registrieren" && (
              <div>
                <Label className="text-xs">Geburtsdatum</Label>
                <Input
                  type="date"
                  autoComplete="bday"
                  required
                  value={geburtsdatum}
                  onChange={(e) => setGeburtsdatum(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label className="text-xs">E-Mail</Label>
              <Input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@beispiel.de"
              />
            </div>

            {modus !== "passwort-vergessen" && (
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Passwort</Label>
                  {modus === "login" && (
                    <button
                      type="button"
                      onClick={() => {
                        setModus("passwort-vergessen");
                        setFehler(null);
                        setHinweis(null);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Vergessen?
                    </button>
                  )}
                </div>
                <PasswordInput
                  autoComplete={modus === "registrieren" ? "new-password" : "current-password"}
                  required
                  minLength={6}
                  value={passwort}
                  onChange={(e) => setPasswort(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            )}

            {modus === "registrieren" && (
              <div>
                <Label className="text-xs">Passwort wiederholen</Label>
                <PasswordInput
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={passwortWiederholen}
                  onChange={(e) => setPasswortWiederholen(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            )}

            {fehler && (
              <div className="space-y-1.5">
                <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{fehler}</p>
                {zeigeErneutSenden && (
                  <button
                    type="button"
                    onClick={erneutSenden}
                    disabled={erneutSendenBusy}
                    className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    {erneutSendenBusy ? "Wird gesendet…" : "Bestätigungs-E-Mail erneut senden"}
                  </button>
                )}
              </div>
            )}
            {hinweis && (
              <p className="rounded-md bg-blue-600/10 p-2 text-xs text-blue-700 dark:text-blue-400">{hinweis}</p>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {modus === "login" && "Anmelden"}
              {modus === "registrieren" && "Konto erstellen"}
              {modus === "passwort-vergessen" && "Link senden"}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            {modus === "login" && (
              <button
                onClick={() => {
                  setModus("registrieren");
                  setFehler(null);
                  setHinweis(null);
                }}
                className="hover:text-foreground hover:underline"
              >
                Noch kein Konto? <span className="font-medium text-foreground">Registrieren</span>
              </button>
            )}
            {(modus === "registrieren" || modus === "passwort-vergessen") && (
              <button
                onClick={() => {
                  setModus("login");
                  setFehler(null);
                  setHinweis(null);
                }}
                className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
              >
                <ArrowLeft className="h-3 w-3" /> Zurück zur Anmeldung
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Mit der Anmeldung akzeptieren Sie unsere{" "}
          <Link to="/agb" className="underline underline-offset-2 hover:text-foreground">
            AGB
          </Link>{" "}
          und{" "}
          <Link to="/datenschutz" className="underline underline-offset-2 hover:text-foreground">
            Datenschutzerklärung
          </Link>{" "}
          sowie – sofern Sie Mieterdaten verwalten – den{" "}
          <Link to="/avv" className="underline underline-offset-2 hover:text-foreground">
            Auftragsverarbeitungsvertrag (AVV)
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
