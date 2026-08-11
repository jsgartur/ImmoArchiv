import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  User,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Loader2,
  CreditCard,
  UserPlus,
  Mail,
  Clock,
  CheckCircle2,
  Camera,
} from "lucide-react";
import { useStore, type Profil } from "@/lib/store";
import { planById, monatspreis, istPro } from "@/lib/plaene";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";
import {
  fetchTeamMitglieder,
  ladeMitgliedEin,
  entferneMitglied,
  type TeamMitglied,
} from "@/lib/supabase/team";
import { ladeAvatarHoch } from "@/lib/avatar-utils";
import { AvatarBild } from "@/components/avatar-bild";
import { ProGate } from "@/components/pro-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

function TeamMitgliederKarte() {
  const [mitglieder, setMitglieder] = useState<TeamMitglied[]>([]);
  const [geladen, setGeladen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const laden = () => {
    fetchTeamMitglieder()
      .then((m) => {
        setMitglieder(m);
        setGeladen(true);
      })
      .catch(() => setGeladen(true));
  };

  useEffect(laden, []);

  const einladen = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await ladeMitgliedEin(trimmed);
      toast.success(`Einladung an ${trimmed} erstellt.`);
      setEmail("");
      laden();
    } catch (e) {
      toast.error(
        e instanceof Error && e.message.includes("duplicate")
          ? "Diese Person ist bereits eingeladen."
          : "Einladung fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  };

  const entfernen = async (id: string) => {
    try {
      await entferneMitglied(id);
      setMitglieder((m) => m.filter((x) => x.id !== id));
      toast.success("Mitglied entfernt.");
    } catch {
      toast.error("Konnte nicht entfernt werden.");
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-1 text-sm font-medium">Team-Mitglieder</div>
      <p className="mb-4 text-xs text-muted-foreground">
        Eingeladene Personen sehen und bearbeiten dieselben Objekte, Mieter und Daten wie Sie.
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="name@beispiel.de"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && einladen()}
        />
        <Button onClick={einladen} disabled={busy || !email.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}{" "}
          Einladen
        </Button>
      </div>

      {geladen && mitglieder.length > 0 && (
        <div className="mt-4 divide-y rounded-lg border">
          {mitglieder.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {m.email}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs " +
                    (m.status === "aktiv"
                      ? "bg-blue-500/10 text-blue-600"
                      : "bg-muted text-muted-foreground")
                  }
                >
                  {m.status === "aktiv" ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Clock className="h-3 w-3" />
                  )}
                  {m.status === "aktiv" ? "Aktiv" : "Einladung offen"}
                </span>
                <Button variant="ghost" size="icon" onClick={() => entfernen(m.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {geladen && mitglieder.length === 0 && (
        <p className="mt-3 text-xs text-muted-foreground">Noch keine Team-Mitglieder eingeladen.</p>
      )}
    </div>
  );
}

export const Route = createFileRoute("/dashboard/account")({
  component: Account,
});

function Feld({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Account() {
  const profil = useStore((s) => s.profil);
  const profilGeladen = useStore((s) => s.profilGeladen);
  const updateProfil = useStore((s) => s.updateProfil);
  const { deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [loeschenBusy, setLoeschenBusy] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Profil>(profil);
  // Profil wird asynchron aus Supabase geladen – Formular übernimmt es, sobald es eintrifft.
  useEffect(() => {
    setForm(profil);
  }, [profil]);
  const set = <K extends keyof Profil>(k: K, v: Profil[K]) => setForm((f) => ({ ...f, [k]: v }));

  const plan = planById(profil.plan);
  const initialen = `${form.vorname?.[0] ?? ""}${form.nachname?.[0] ?? ""}`.toUpperCase() || "?";
  const dirty = JSON.stringify(form) !== JSON.stringify(profil);

  const speichern = () => {
    updateProfil(form);
    toast.success("Kontodaten gespeichert");
  };

  const avatarAendern = async (file: File | undefined) => {
    if (!file) return;
    setAvatarBusy(true);
    try {
      const pfad = await ladeAvatarHoch(file);
      updateProfil({ avatarUrl: pfad });
      toast.success("Profilbild aktualisiert");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Profilbild konnte nicht hochgeladen werden.");
    } finally {
      setAvatarBusy(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const zahlungsmethodeVerwalten = async () => {
    setPortalBusy(true);
    const { data, error } = await supabase.functions.invoke("create-portal-session", {
      body: { rueckkehrUrl: `${window.location.origin}/dashboard/account` },
    });
    setPortalBusy(false);
    if (error || !data?.url) {
      toast.error("Kundenportal konnte nicht geöffnet werden.");
      return;
    }
    window.location.href = data.url;
  };

  const kontoLoeschen = async () => {
    if (
      !confirm(
        "Konto und alle zugehörigen Daten unwiderruflich löschen? Dies kann nicht rückgängig gemacht werden.",
      )
    ) {
      return;
    }
    setLoeschenBusy(true);
    const { error } = await deleteAccount();
    setLoeschenBusy(false);
    if (error) {
      toast.error(`Konto konnte nicht gelöscht werden: ${error}`);
    } else {
      toast.success("Konto gelöscht.");
      navigate({ to: "/" });
    }
  };

  if (!profilGeladen) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Mein Konto</h1>
          <p className="text-sm text-muted-foreground">
            Ihre persönlichen Daten und Ihr Abonnement.
          </p>
        </div>
        <div className="h-40 animate-pulse rounded-2xl border bg-card/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Mein Konto</h1>
        <p className="text-sm text-muted-foreground">Ihre persönlichen Daten und Ihr Abonnement.</p>
      </div>

      {/* Kopf: Avatar + Plan */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarBusy}
            className="group relative h-14 w-14 shrink-0 rounded-full outline-none"
            aria-label="Profilbild ändern"
          >
            {profil.avatarUrl ? (
              <AvatarBild
                pfad={profil.avatarUrl}
                alt={form.vorname || "Profilbild"}
                className="h-14 w-14 rounded-full"
              />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-lg font-semibold">
                {initialen === "?" ? <User className="h-6 w-6" /> : initialen}
              </div>
            )}
            <span className="absolute inset-0 grid place-items-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
              {avatarBusy ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Camera className="h-4 w-4 text-white" />
              )}
            </span>
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => avatarAendern(e.target.files?.[0])}
          />
          <div>
            <div className="font-medium">
              {[form.vorname, form.nachname].filter(Boolean).join(" ") || "Ihr Name"}
            </div>
            <div className="text-sm text-muted-foreground">
              {form.email || "keine E-Mail hinterlegt"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-background p-3">
          <div>
            <div className="text-xs text-muted-foreground">Aktueller Plan</div>
            <div className="font-medium">
              {plan.name} ·{" "}
              {plan.preisMonat === 0 ? "kostenlos" : `${monatspreis(plan, false)} €/Mon.`}
            </div>
          </div>
          {profil.plan !== "starter" && (
            <Button
              size="sm"
              variant="outline"
              disabled={portalBusy}
              onClick={zahlungsmethodeVerwalten}
            >
              {portalBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Zahlung verwalten
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <Link to="/dashboard/preise">
              Ändern <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Persönliche Daten */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="mb-4 text-sm font-medium">Persönliche Daten</div>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[120px_1fr_1fr]">
            <div>
              <Label className="text-xs">Anrede</Label>
              <Select value={form.anrede || undefined} onValueChange={(v) => set("anrede", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Frau">Frau</SelectItem>
                  <SelectItem value="Herr">Herr</SelectItem>
                  <SelectItem value="Divers">Divers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Feld label="Vorname" value={form.vorname} onChange={(v) => set("vorname", v)} />
            <Feld label="Nachname" value={form.nachname} onChange={(v) => set("nachname", v)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Feld
              label="E-Mail"
              type="email"
              value={form.email}
              onChange={(v) => set("email", v)}
              placeholder="name@beispiel.de"
            />
            <Feld
              label="Telefon"
              value={form.telefon}
              onChange={(v) => set("telefon", v)}
              placeholder="+49 …"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Feld
              label="Geburtsdatum"
              type="date"
              value={form.geburtsdatum}
              onChange={(v) => set("geburtsdatum", v)}
            />
            <div>
              <Label className="text-xs">Kontotyp</Label>
              <Select
                value={form.kontotyp}
                onValueChange={(v) => set("kontotyp", v as Profil["kontotyp"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="privat">Privatvermieter</SelectItem>
                  <SelectItem value="unternehmen">Unternehmen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Feld
            label={form.kontotyp === "unternehmen" ? "Firma" : "Firma (optional)"}
            value={form.firma}
            onChange={(v) => set("firma", v)}
          />
        </div>
      </div>

      {/* Anschrift */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="mb-4 text-sm font-medium">Anschrift</div>
        <div className="space-y-4">
          <Feld
            label="Straße und Hausnummer"
            value={form.strasse}
            onChange={(v) => set("strasse", v)}
          />
          <div className="grid gap-4 sm:grid-cols-[140px_1fr_1fr]">
            <Feld label="PLZ" value={form.plz} onChange={(v) => set("plz", v)} />
            <Feld label="Ort" value={form.ort} onChange={(v) => set("ort", v)} />
            <Feld label="Land" value={form.land} onChange={(v) => set("land", v)} />
          </div>
        </div>
      </div>

      {/* Bankverbindung */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="mb-1 text-sm font-medium">Bankverbindung</div>
        <p className="mb-4 text-xs text-muted-foreground">
          Wird auf Nebenkostenabrechnungen als Zahlungsangabe angezeigt.
        </p>
        <div className="space-y-4">
          <Feld
            label="Kontoinhaber"
            value={form.kontoinhaber ?? ""}
            onChange={(v) => set("kontoinhaber", v)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Feld
              label="IBAN"
              value={form.iban ?? ""}
              onChange={(v) => set("iban", v)}
              placeholder="DE…"
            />
            <Feld label="BIC" value={form.bic ?? ""} onChange={(v) => set("bic", v)} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button disabled={!dirty} onClick={speichern}>
          Änderungen speichern
        </Button>
        {dirty && <span className="text-xs text-muted-foreground">Ungespeicherte Änderungen</span>}
      </div>

      {/* Team */}
      {istPro(profil.plan) ? (
        <TeamMitgliederKarte />
      ) : (
        <ProGate feature="Mehrbenutzer & Team-Zugriff">{null}</ProGate>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-card/50 p-4 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Ihre Kontodaten werden sicher in unserer Datenbank (Supabase) gespeichert und sind nur für
          Sie nach Anmeldung einsehbar. Mehr dazu in der{" "}
          <Link to="/datenschutz" className="underline underline-offset-2 hover:text-foreground">
            Datenschutzerklärung
          </Link>
          .
        </span>
      </div>

      {/* Gefahrenzone */}
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
        <div className="text-sm font-medium text-destructive">Konto löschen</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Löscht Ihr Konto sowie alle Objekte, Mieter, Mängel und sonstigen Daten unwiderruflich.
          Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
        <Button
          variant="destructive"
          className="mt-3"
          disabled={loeschenBusy}
          onClick={kontoLoeschen}
        >
          {loeschenBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Konto unwiderruflich löschen
        </Button>
      </div>
    </div>
  );
}
