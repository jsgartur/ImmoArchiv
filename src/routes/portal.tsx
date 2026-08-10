import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Wrench,
  Camera,
  X,
  CheckCircle2,
  LogOut,
  Home,
  FileText,
  Download,
  Phone,
  Mail,
  Receipt,
  User,
  ClipboardList,
  Gauge,
  Key,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { supabase } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/portal")({
  component: Mieterportal,
});

const SESSION_KEY = "immoarchiv-mieterportal";

interface AbrechnungAnteil {
  bezeichnung: string;
  schluessel: "wohnflaeche" | "personen" | "einheiten";
  anteil: number;
}

interface PortalAbrechnung {
  id: string;
  titel: string;
  von: string;
  bis: string;
  anteile: AbrechnungAnteil[];
  gesamtKosten: number;
  vorauszahlung: number;
  saldo: number;
  wohnflaeche: number;
  personen: number;
}

interface PortalUebergabeRaum {
  id: string;
  name: string;
  zustand: string;
  fotos: string[];
}

interface PortalZaehlerstand {
  id: string;
  bezeichnung: string;
  zaehlernummer?: string;
  stand: number;
  einheit?: string;
}

interface PortalUebergabeprotokoll {
  id: string;
  typ: "einzug" | "auszug";
  datum: string;
  raeume: PortalUebergabeRaum[];
  zaehlerstaende: PortalZaehlerstand[];
  schluesselAnzahl: number | null;
  bemerkungen: string | null;
  unterschriftMieter: string | null;
  unterschriftVermieter: string | null;
}

interface PortalDaten {
  mieter: { name: string; mietbeginn: string | null; mietende: string | null; kaltmiete: number; nebenkosten: number };
  einheit: { bezeichnung: string } | null;
  objekt: { adresse: string; strasse: string | null; stadt: string | null; plz: string | null } | null;
  vermieter: { name: string; email: string | null; telefon: string | null; firma: string | null } | null;
  maengel: { id: string; titel: string; beschreibung: string | null; status: string; prioritaet: string; gemeldet_am: string }[];
  mietzahlungen: { monat: string; betrag: number; bezahlt_am: string }[];
  dokumente: { id: string; name: string; kategorie: string; hochgeladenAm: string; url: string | null }[];
  abrechnungen: PortalAbrechnung[];
  uebergabeprotokolle: PortalUebergabeprotokoll[];
}

const eur = (n: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
const UMLAGE_LABEL: Record<AbrechnungAnteil["schluessel"], string> = {
  wohnflaeche: "nach Wohnfläche",
  personen: "nach Personen",
  einheiten: "pro Einheit",
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** Erzeugt ein einfaches, auf die eigene Partei beschränktes PDF für den Mieter. */
function erzeugeEigenesNkPdf(a: PortalAbrechnung, mieterName: string, objektAdresse: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const M = 18;
  const rechts = 210 - M;
  let y = 20;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(a.titel || "Nebenkostenabrechnung", M, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(objektAdresse, M, y);
  y += 5;
  doc.text(`Zeitraum: ${a.von} – ${a.bis}`, M, y);
  y += 5;
  doc.text(`Für: ${mieterName} (${a.wohnflaeche} m² · ${a.personen} Pers.)`, M, y);
  y += 8;
  doc.setDrawColor(210);
  doc.line(M, y, rechts, y);
  y += 8;

  doc.setTextColor(20);
  doc.setFontSize(10);
  a.anteile.forEach((an) => {
    doc.setTextColor(90);
    doc.text(`${an.bezeichnung || "—"} (${UMLAGE_LABEL[an.schluessel]})`, M, y);
    doc.setTextColor(20);
    doc.text(eur(an.anteil), rechts, y, { align: "right" });
    y += 6;
  });

  y += 2;
  doc.setDrawColor(230);
  doc.line(M, y, rechts, y);
  y += 6;
  doc.text("Umlagefähige Kosten (Ihr Anteil)", M, y);
  doc.text(eur(a.gesamtKosten), rechts, y, { align: "right" });
  y += 6;
  doc.text("Geleistete Vorauszahlung", M, y);
  doc.text("- " + eur(a.vorauszahlung), rechts, y, { align: "right" });
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(a.saldo >= 0 ? "Guthaben (Erstattung)" : "Nachzahlung", M, y);
  doc.text(eur(Math.abs(a.saldo)), rechts, y, { align: "right" });

  doc.save(`${(a.titel || "Nebenkostenabrechnung").replace(/[^\w\-]+/g, "_")}.pdf`);
}

function LoginFormular({ onErfolg }: { onErfolg: (code: string) => void }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const einloggen = async () => {
    setFehler(null);
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("portal-login", { body: { code, name } });
    setBusy(false);
    if (error || data?.error) {
      setFehler(data?.error || "Zugang fehlgeschlagen.");
      return;
    }
    sessionStorage.setItem(SESSION_KEY, code.trim().toUpperCase());
    onErfolg(code.trim().toUpperCase());
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2 font-semibold">
          <Logo className="h-8 w-8" />
          ImmoArchiv Mieterportal
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Zugang zu Ihrer Wohnung</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Geben Sie Ihren Zugangscode (aus dem QR-Code/Link) und Ihren Namen ein.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              einloggen();
            }}
            className="mt-6 space-y-4"
          >
            <div>
              <Label className="text-xs">Zugangscode</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="z. B. AB3D7KQ2XZ"
                autoCapitalize="characters"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Ihr Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vor- und Nachname" required />
            </div>
            {fehler && <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{fehler}</p>}
            <Button type="submit" className="w-full" disabled={busy || !code.trim() || !name.trim()}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Zugang öffnen
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function MangelMeldenFormular({ code, onGemeldet }: { code: string; onGemeldet: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [titel, setTitel] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [prioritaet, setPrioritaet] = useState("mittel");
  const [fotos, setFotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const melden = async () => {
    if (!titel.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("portal-mangel-melden", {
      body: { code, titel, beschreibung, prioritaet, fotos },
    });
    setBusy(false);
    if (error || data?.error) {
      toast.error(data?.error || "Mangel konnte nicht gemeldet werden.");
      return;
    }
    toast.success("Mangel gemeldet – vielen Dank!");
    setTitel("");
    setBeschreibung("");
    setFotos([]);
    onGemeldet();
  };

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium">
        <Wrench className="h-4 w-4" /> Mangel melden
      </div>
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Was ist kaputt?</Label>
          <Input value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="z. B. Wasserhahn tropft" />
        </div>
        <div>
          <Label className="text-xs">Beschreibung</Label>
          <Textarea rows={3} value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Dringlichkeit</Label>
          <Select value={prioritaet} onValueChange={setPrioritaet}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="niedrig">Niedrig</SelectItem>
              <SelectItem value="mittel">Mittel</SelectItem>
              <SelectItem value="dringend">Dringend</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Fotos</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {fotos.map((f, i) => (
              <div key={i} className="relative">
                <img src={f} className="h-16 w-16 rounded-md object-cover" alt="" />
                <button
                  type="button"
                  onClick={() => setFotos(fotos.filter((_, j) => j !== i))}
                  className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs text-muted-foreground hover:bg-accent"
            >
              <Camera className="h-4 w-4" /> Foto
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                const urls = await Promise.all(files.map(fileToDataUrl));
                setFotos((f) => [...f, ...urls]);
                e.target.value = "";
              }}
            />
          </div>
        </div>
        <Button disabled={!titel.trim() || busy} onClick={melden} className="w-full">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Mangel melden
        </Button>
      </div>
    </div>
  );
}

const TABS = [
  { id: "uebersicht", label: "Übersicht" },
  { id: "maengel", label: "Mängel" },
  { id: "dokumente", label: "Dokumente" },
  { id: "nebenkosten", label: "Nebenkosten" },
  { id: "uebergabe", label: "Übergabe" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function TabLeiste({ aktiv, onChange }: { aktiv: TabId; onChange: (t: TabId) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "-mb-px shrink-0 border-b-2 px-4 py-2 text-sm transition",
            aktiv === t.id
              ? "border-primary font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function PortalAnsicht({ code, onAbmelden }: { code: string; onAbmelden: () => void }) {
  const [daten, setDaten] = useState<PortalDaten | null>(null);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("uebersicht");

  const laden = async () => {
    const { data, error } = await supabase.functions.invoke("portal-daten", { body: { code } });
    if (error || data?.error) {
      setLadeFehler(data?.error || "Daten konnten nicht geladen werden.");
      return;
    }
    setDaten(data as PortalDaten);
  };

  useEffect(() => {
    laden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (ladeFehler) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center text-foreground">
        <div>
          <p className="text-sm text-destructive">{ladeFehler}</p>
          <Button className="mt-4" variant="outline" onClick={onAbmelden}>
            Zurück zum Login
          </Button>
        </div>
      </div>
    );
  }

  if (!daten) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const dokumente = daten.dokumente ?? [];
  const abrechnungen = daten.abrechnungen ?? [];
  const objektAdresse = daten.objekt?.strasse || daten.objekt?.adresse || "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Logo className="h-7 w-7" />
            Mieterportal
          </div>
          <Button variant="ghost" size="sm" onClick={onAbmelden}>
            <LogOut className="h-4 w-4" /> Abmelden
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-4">
        <div className="rounded-2xl border bg-card p-5">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Home className="h-4 w-4" />
            {objektAdresse} · {daten.einheit?.bezeichnung}
          </div>
          <h1 className="mt-1 text-xl font-semibold">Hallo, {daten.mieter.name.split(" ")[0]}</h1>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Kaltmiete</div>
              <div className="font-medium">{eur(daten.mieter.kaltmiete)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Nebenkosten</div>
              <div className="font-medium">{eur(daten.mieter.nebenkosten)}</div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <TabLeiste aktiv={tab} onChange={setTab} />
        </div>
      </div>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {tab === "uebersicht" && (
          <>
            {daten.vermieter && (
              <div className="rounded-2xl border bg-card p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4" /> Ihr Vermieter
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Für Rückfragen, die kein Mangel sind (z. B. Vertragliches).
                </p>
                <div className="space-y-2 text-sm">
                  <div className="font-medium">{daten.vermieter.firma || daten.vermieter.name}</div>
                  {daten.vermieter.telefon && (
                    <a href={`tel:${daten.vermieter.telefon}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                      <Phone className="h-4 w-4" /> {daten.vermieter.telefon}
                    </a>
                  )}
                  {daten.vermieter.email && (
                    <a href={`mailto:${daten.vermieter.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                      <Mail className="h-4 w-4" /> {daten.vermieter.email}
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-2xl border bg-card p-5">
              <div className="mb-3 text-sm font-medium">Zahlungshistorie</div>
              {daten.mietzahlungen.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Zahlungen erfasst.</p>
              ) : (
                <div className="space-y-2">
                  {daten.mietzahlungen.map((z, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <span>{z.monat}</span>
                      <span className="inline-flex items-center gap-1 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" /> {eur(z.betrag)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {tab === "maengel" && (
          <>
            <MangelMeldenFormular code={code} onGemeldet={laden} />
            <div className="rounded-2xl border bg-card p-5">
              <div className="mb-3 text-sm font-medium">Meine gemeldeten Mängel</div>
              {daten.maengel.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Mängel gemeldet.</p>
              ) : (
                <div className="space-y-2">
                  {daten.maengel.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <div>
                        <div className="font-medium">{m.titel}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(m.gemeldet_am).toLocaleDateString("de-DE")}
                        </div>
                      </div>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                        {m.status === "erledigt" ? "Erledigt" : m.status === "in_bearbeitung" ? "In Bearbeitung" : "Gemeldet"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {tab === "dokumente" && (
          <div className="rounded-2xl border bg-card p-5">
            <div className="mb-3 text-sm font-medium">Meine Dokumente</div>
            {dokumente.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Dokumente hinterlegt.</p>
            ) : (
              <div className="space-y-2">
                {dokumente.map((d) => (
                  <a
                    key={d.id}
                    href={d.url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-accent"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.kategorie}</div>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "nebenkosten" && (
          <div className="rounded-2xl border bg-card p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Receipt className="h-4 w-4" /> Nebenkostenabrechnungen
            </div>
            {abrechnungen.length === 0 ? (
              <p className="text-sm text-muted-foreground">Für Sie liegt noch keine Abrechnung vor.</p>
            ) : (
              <div className="space-y-3">
                {abrechnungen.map((a) => (
                  <div key={a.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{a.titel}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.von} – {a.bis}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                          a.saldo >= 0 ? "bg-blue-500/10 text-blue-600" : "bg-destructive/10 text-destructive",
                        )}
                      >
                        {a.saldo >= 0 ? `Guthaben ${eur(a.saldo)}` : `Nachzahlung ${eur(Math.abs(a.saldo))}`}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => erzeugeEigenesNkPdf(a, daten.mieter.name, objektAdresse)}
                    >
                      <Download className="h-4 w-4" /> Als PDF herunterladen
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "uebergabe" && (
          <div className="rounded-2xl border bg-card p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <ClipboardList className="h-4 w-4" /> Übergabeprotokolle
            </div>
            {(daten.uebergabeprotokolle ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Für Ihre Einheit liegt noch kein Übergabeprotokoll vor.</p>
            ) : (
              <div className="space-y-3">
                {daten.uebergabeprotokolle.map((p) => (
                  <details key={p.id} className="rounded-lg border p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      {p.typ === "einzug" ? "Einzugsprotokoll" : "Auszugsprotokoll"} ·{" "}
                      {new Date(p.datum).toLocaleDateString("de-DE")}
                    </summary>
                    <div className="mt-3 space-y-3 text-sm">
                      {p.schluesselAnzahl != null && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Key className="h-3.5 w-3.5" /> Übergebene Schlüssel: {p.schluesselAnzahl}
                        </div>
                      )}
                      {p.zaehlerstaende.length > 0 && (
                        <div>
                          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Gauge className="h-3.5 w-3.5" /> Zählerstände
                          </div>
                          <div className="space-y-1">
                            {p.zaehlerstaende.map((z) => (
                              <div key={z.id} className="flex justify-between border-b py-1 last:border-none">
                                <span>{z.bezeichnung}</span>
                                <span className="font-medium">
                                  {z.stand} {z.einheit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {p.raeume.length > 0 && (
                        <div>
                          <div className="mb-1 text-xs font-medium text-muted-foreground">Räume</div>
                          <div className="space-y-2">
                            {p.raeume.map((r) => (
                              <div key={r.id}>
                                <span className="font-medium">{r.name || "Raum"}: </span>
                                {r.zustand || "—"}
                                {r.fotos.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-2">
                                    {r.fotos.map((f, i) => (
                                      <img key={i} src={f} className="h-14 w-14 rounded-md object-cover" alt="" />
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {p.bemerkungen && (
                        <div>
                          <div className="mb-1 text-xs font-medium text-muted-foreground">Bemerkungen</div>
                          <p>{p.bemerkungen}</p>
                        </div>
                      )}
                      {(p.unterschriftMieter || p.unterschriftVermieter) && (
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div>
                            {p.unterschriftMieter && <img src={p.unterschriftMieter} className="h-14" alt="Unterschrift Mieter" />}
                            <div className="border-t pt-1 text-xs text-muted-foreground">Unterschrift Mieter</div>
                          </div>
                          <div>
                            {p.unterschriftVermieter && <img src={p.unterschriftVermieter} className="h-14" alt="Unterschrift Vermieter" />}
                            <div className="border-t pt-1 text-xs text-muted-foreground">Unterschrift Vermieter</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Mieterportal() {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const gespeichert = sessionStorage.getItem(SESSION_KEY);
    if (gespeichert) setCode(gespeichert);
  }, []);

  if (!code) return <LoginFormular onErfolg={setCode} />;
  return (
    <PortalAnsicht
      code={code}
      onAbmelden={() => {
        sessionStorage.removeItem(SESSION_KEY);
        setCode(null);
      }}
    />
  );
}
