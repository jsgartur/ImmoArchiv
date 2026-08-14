import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Printer,
  Save,
  ReceiptText,
  FileDown,
  User,
  Landmark,
  Check,
  ChevronUp,
  ChevronDown,
  CalendarRange,
} from "lucide-react";
import { erzeugeNkPdf } from "@/lib/nk-pdf";
import { Stepper as SchrittLeiste } from "@/components/stepper";
import {
  useStore,
  fmtEUR,
  fmtDate,
  UMLAGE_LABEL,
  NK_VORLAGEN,
  BRIEFPAPIER_LABEL,
  type NkPartei,
  type NkPosition,
  type Umlageschluessel,
  type BriefpapierId,
  type Profil,
} from "@/lib/store";
import { berechneAbrechnung, gezahlteVorauszahlung } from "@/lib/nebenkosten";
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
import { LadeSkeleton } from "@/components/lade-skeleton";
import { cn } from "@/lib/utils";

const BRIEFPAPIER_AKZENT: Record<BriefpapierId, string> = {
  klassisch: "border-blue-600",
  modern: "border-slate-900 dark:border-slate-100",
  elegant: "border-amber-600",
};

const BRIEFPAPIER_FONT: Record<BriefpapierId, string> = {
  klassisch: "",
  modern: "",
  elegant: "font-serif",
};

/** Kleine Musterrechnung als Vorschau je Briefpapier-Stil (SVG statt echter Bilddatei). */
function BriefpapierVorschau({ id }: { id: BriefpapierId }) {
  const akzent = id === "klassisch" ? "#2563eb" : id === "modern" ? "#0f172a" : "#a16207";
  const schrift = id === "elegant" ? "font-serif" : "font-sans";
  return (
    <div
      className={cn(
        "aspect-[3/4] w-full overflow-hidden rounded-md border bg-white text-[5px]",
        schrift,
      )}
    >
      <div style={{ background: akzent }} className="h-2 w-full" />
      <div className="space-y-1 p-2.5">
        <div className="h-1 w-1/3 rounded-sm" style={{ background: akzent, opacity: 0.5 }} />
        <div className="mt-1.5 h-1.5 w-2/3 rounded-sm bg-neutral-800" />
        <div className="h-1 w-1/2 rounded-sm bg-neutral-300" />
        <div className="mt-2 space-y-0.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-0.5 w-8 rounded-sm bg-neutral-300" />
              <div className="h-0.5 w-3 rounded-sm bg-neutral-400" />
            </div>
          ))}
        </div>
        <div
          className="mt-2 h-1.5 w-full rounded-sm"
          style={{ background: akzent, opacity: 0.12 }}
        />
      </div>
    </div>
  );
}

function Feldzeile({ label, wert }: { label: string; wert?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}:</span>
      {wert ? (
        <span className="font-medium">{wert}</span>
      ) : (
        <Link to="/dashboard/account" className="text-primary hover:underline">
          Hinzufügen
        </Link>
      )}
    </div>
  );
}

function AbsenderKarte({ profil }: { profil: Profil }) {
  const name = [profil.vorname, profil.nachname].filter(Boolean).join(" ");
  const ort = [profil.plz, profil.ort].filter(Boolean).join(" ");
  return (
    <div className="no-print rounded-2xl border bg-card p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <User className="h-4 w-4" /> Absenderinformationen
      </div>
      <div className="space-y-1.5 rounded-xl border bg-background p-3">
        <Feldzeile label="Firma" wert={profil.firma || undefined} />
        <Feldzeile label="Name" wert={name || undefined} />
        <Feldzeile label="Straße" wert={profil.strasse || undefined} />
        <Feldzeile label="Ort" wert={ort || undefined} />
      </div>
      <div className="mt-3 border-t pt-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Landmark className="h-4 w-4" /> Kontoinformationen
        </div>
        <div className="space-y-1.5 rounded-xl border bg-background p-3">
          <Feldzeile label="Kontoinhaber" wert={profil.kontoinhaber} />
          <Feldzeile label="IBAN" wert={profil.iban} />
          <Feldzeile label="BIC" wert={profil.bic} />
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Diese Daten befinden sich im{" "}
        <Link to="/dashboard/account" className="text-primary hover:underline">
          Benutzerprofil
        </Link>
        .
      </p>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/nebenkosten/$id")({
  component: AbrechnungEditor,
  notFoundComponent: () => (
    <div className="py-20 text-center text-muted-foreground">Abrechnung nicht gefunden.</div>
  ),
});

const uid = () => Math.random().toString(36).slice(2, 10);

/** Alle Betriebskostenarten nach § 2 BetrKV als vorausgefüllte Zeilen (0 €), statt einzeln hinzufügen zu müssen. */
const standardPositionen = (): NkPosition[] => {
  const heute = new Date().toISOString().slice(0, 10);
  return NK_VORLAGEN.map((v) => ({
    id: uid(),
    bezeichnung: v.bezeichnung,
    betrag: 0,
    schluessel: v.schluessel,
    datum: heute,
  }));
};

type Schritt = "anlage" | "empfaenger" | "briefpapier" | "kosten" | "abschluss";

const SCHRITTE: { id: Schritt; label: string }[] = [
  { id: "anlage", label: "Anlage" },
  { id: "empfaenger", label: "Absender & Empfänger" },
  { id: "briefpapier", label: "Briefpapier" },
  { id: "kosten", label: "Kostenaufstellung" },
  { id: "abschluss", label: "Prüfung & Abschluss" },
];

function AbrechnungEditor() {
  const { id } = Route.useParams();
  const gespeichert = useStore((s) => s.abrechnungen.find((a) => a.id === id));
  const objekt = useStore((s) => s.objekte.find((o) => o.id === gespeichert?.objektId));
  const einheiten = useStore((s) => s.einheiten);
  const alleMieter = useStore((s) => s.mieter);
  const profil = useStore((s) => s.profil);
  const updateAbrechnung = useStore((s) => s.updateAbrechnung);
  const removeAbrechnung = useStore((s) => s.removeAbrechnung);
  const abrechnungenGeladen = useStore((s) => s.abrechnungenGeladen);
  const navigate = useNavigate();

  const [schritt, setSchritt] = useState<Schritt>("anlage");
  const [titel, setTitel] = useState(gespeichert?.titel ?? "");
  const [von, setVon] = useState(gespeichert?.von ?? "");
  const [bis, setBis] = useState(gespeichert?.bis ?? "");
  const [parteien, setParteien] = useState<NkPartei[]>(gespeichert?.parteien ?? []);
  const [positionen, setPositionen] = useState<NkPosition[]>(
    gespeichert?.positionen?.length ? gespeichert.positionen : standardPositionen(),
  );
  const [briefpapier, setBriefpapier] = useState<BriefpapierId>(
    gespeichert?.briefpapier ?? "klassisch",
  );

  if (!abrechnungenGeladen) {
    return <LadeSkeleton titel="Abrechnung" text="Details werden geladen…" />;
  }
  if (!gespeichert) throw notFound();

  const aktuell = { ...gespeichert, titel, von, bis, parteien, positionen, briefpapier };
  const ergebnis = berechneAbrechnung(aktuell);
  const dirty =
    JSON.stringify(aktuell) !==
    JSON.stringify({ ...gespeichert, briefpapier: gespeichert.briefpapier ?? "klassisch" });

  const speichern = () => {
    updateAbrechnung(id, { titel, von, bis, parteien, positionen, briefpapier });
    toast.success("Abrechnung gespeichert");
  };

  const schrittIndex = SCHRITTE.findIndex((s) => s.id === schritt);
  const weiter = () => {
    if (schrittIndex < SCHRITTE.length - 1) setSchritt(SCHRITTE[schrittIndex + 1].id);
  };
  const zurueck = () => {
    if (schrittIndex > 0) setSchritt(SCHRITTE[schrittIndex - 1].id);
  };

  // Parteien / Empfänger
  const einheitenDesObjekts = einheiten.filter((e) => e.objektId === gespeichert.objektId);
  const mieterDesObjekts = alleMieter.filter((m) =>
    einheitenDesObjekts.some((e) => e.id === m.einheitId),
  );

  const addPartei = () =>
    setParteien((p) => [
      ...p,
      { id: uid(), name: "Neue Partei", wohnflaeche: 0, personen: 1, nkVorausMonat: 0 },
    ]);
  const setPartei = (pid: string, patch: Partial<NkPartei>) =>
    setParteien((list) => list.map((p) => (p.id === pid ? { ...p, ...patch } : p)));
  const removePartei = (pid: string) => setParteien((list) => list.filter((p) => p.id !== pid));

  const einheitLabel = (einheitId?: string) =>
    einheitId ? einheiten.find((e) => e.id === einheitId)?.bezeichnung : undefined;

  /** Empfänger auswählen: übernimmt Name/Wohnfläche/NK-Vorauszahlung/Einzug/Auszug automatisch aus dem Mieter-Datensatz. */
  const mieterZuordnen = (pid: string, mieterId: string) => {
    const m = mieterDesObjekts.find((x) => x.id === mieterId);
    if (!m) return;
    const e = einheiten.find((x) => x.id === m.einheitId);
    setPartei(pid, {
      name: m.name,
      wohnflaeche: e?.wohnflaeche || 0,
      nkVorausMonat: m.nebenkosten || 0,
      einzug: m.mietbeginn || undefined,
      auszug: m.mietende || undefined,
      einheitId: m.einheitId,
    });
    toast.success("Empfängerdaten übernommen");
  };

  const parteienSortiert = [...parteien].sort((a, b) =>
    (einheitLabel(a.einheitId) ?? a.name).localeCompare(einheitLabel(b.einheitId) ?? b.name),
  );

  // Positionen
  const addPosition = () => {
    const vorlage =
      NK_VORLAGEN.find((v) => !positionen.some((p) => p.bezeichnung === v.bezeichnung)) ??
      NK_VORLAGEN[0];
    setPositionen((p) => [
      ...p,
      {
        id: uid(),
        bezeichnung: vorlage.bezeichnung,
        betrag: 0,
        schluessel: vorlage.schluessel,
        datum: new Date().toISOString().slice(0, 10),
      },
    ]);
  };
  const setPosition = (pid: string, patch: Partial<NkPosition>) =>
    setPositionen((list) => list.map((p) => (p.id === pid ? { ...p, ...patch } : p)));
  const removePosition = (pid: string) => setPositionen((list) => list.filter((p) => p.id !== pid));
  const movePosition = (index: number, richtung: -1 | 1) => {
    setPositionen((list) => {
      const ziel = index + richtung;
      if (ziel < 0 || ziel >= list.length) return list;
      const next = [...list];
      [next[index], next[ziel]] = [next[ziel], next[index]];
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Kopf */}
      <div className="no-print">
        <Link
          to="/dashboard/nebenkosten"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Alle Abrechnungen
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {titel || "Nebenkostenabrechnung"}
            </h1>
            <p className="text-sm text-muted-foreground">{objekt?.adresse ?? "Objekt gelöscht"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => erzeugeNkPdf(aktuell, objekt, profil)}>
              <FileDown className="h-4 w-4" /> PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSchritt("abschluss");
                setTimeout(() => window.print(), 50);
              }}
            >
              <Printer className="h-4 w-4" /> Drucken
            </Button>
            <Button disabled={!dirty} onClick={speichern}>
              <Save className="h-4 w-4" /> Speichern
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (confirm("Abrechnung löschen?")) {
                  removeAbrechnung(id);
                  navigate({ to: "/dashboard/nebenkosten" });
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
        {dirty && <p className="mt-1 text-xs text-amber-600">Ungespeicherte Änderungen</p>}
      </div>

      <div className="no-print rounded-2xl border bg-card p-5">
        <SchrittLeiste schritte={SCHRITTE} aktiv={schritt} onSelect={setSchritt} />
      </div>

      {/* Schritt 1: Anlage */}
      {schritt === "anlage" && (
        <div className="no-print space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium">
              <CalendarRange className="h-4 w-4" /> Abrechnungszeitraum
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-xs">Titel</Label>
                <Input value={titel} onChange={(e) => setTitel(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Von</Label>
                <Input
                  type="date"
                  value={von.slice(0, 10)}
                  onChange={(e) => setVon(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Bis</Label>
                <Input
                  type="date"
                  value={bis.slice(0, 10)}
                  onChange={(e) => setBis(e.target.value)}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {ergebnis.monate} Monate im Abrechnungszeitraum.
            </p>
            {objekt?.kaufdatum && objekt.kaufdatum.slice(0, 10) > bis.slice(0, 10) && (
              <p className="mt-2 rounded-md bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
                Achtung: Das Objekt wurde erst am {fmtDate(objekt.kaufdatum)} gekauft — also nach
                diesem Abrechnungszeitraum. Für diesen Zeitraum sind keine Nebenkosten angefallen.
              </p>
            )}
            {objekt?.kaufdatum &&
              objekt.kaufdatum.slice(0, 10) > von.slice(0, 10) &&
              objekt.kaufdatum.slice(0, 10) <= bis.slice(0, 10) && (
                <p className="mt-2 rounded-md bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
                  Hinweis: Kauf am {fmtDate(objekt.kaufdatum)} — Vorauszahlungen werden erst ab dem
                  Kaufdatum anteilig angesetzt.
                </p>
              )}
          </div>
          <div className="flex justify-end">
            <Button onClick={weiter}>
              Weiter <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Schritt 2: Absender & Empfänger */}
      {schritt === "empfaenger" && (
        <div className="no-print space-y-4">
          <AbsenderKarte profil={profil} />

          <div className="rounded-2xl border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-medium">Empfängerinformationen (Mietparteien)</div>
              <Button size="sm" variant="outline" onClick={addPartei}>
                <Plus className="h-4 w-4" /> Partei
              </Button>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Wählen Sie oben je Partei einen Mieter aus Ihrer Mieterliste — Name, Wohnfläche und
              NK-Vorauszahlung werden automatisch übernommen. Tragen Sie zusätzlich Einzug/Auszug
              ein, falls der Mieter nicht den ganzen Zeitraum wohnte.
            </p>

            <div className="space-y-3">
              {parteienSortiert.map((p) => {
                const vz = gezahlteVorauszahlung(aktuell, p);
                const etikett = einheitLabel(p.einheitId);
                return (
                  <div key={p.id} className="rounded-xl border bg-background p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Select value="" onValueChange={(v) => mieterZuordnen(p.id, v)}>
                        <SelectTrigger className="h-8 max-w-xs text-xs">
                          <SelectValue
                            placeholder={
                              etikett ? `Mieter für ${etikett} wählen …` : "Mieter zuordnen …"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {mieterDesObjekts.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name} — {einheitLabel(m.einheitId) ?? "?"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePartei(p.id)}
                        aria-label="Partei entfernen"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Name</Label>
                        <Input
                          value={p.name}
                          onChange={(e) => setPartei(p.id, { name: e.target.value })}
                          placeholder="Name"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Wohnfl. m²</Label>
                        <Input
                          type="number"
                          value={p.wohnflaeche || ""}
                          onChange={(e) => setPartei(p.id, { wohnflaeche: +e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Personen</Label>
                        <Input
                          type="number"
                          value={p.personen || ""}
                          onChange={(e) => setPartei(p.id, { personen: +e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <div>
                        <Label className="text-[11px] text-muted-foreground">
                          NK-Vorauszahlung / Monat €
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={p.nkVorausMonat ?? ""}
                          onChange={(e) =>
                            setPartei(p.id, {
                              nkVorausMonat: e.target.value === "" ? undefined : +e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">
                          Einzug (optional)
                        </Label>
                        <Input
                          type="date"
                          value={p.einzug?.slice(0, 10) ?? ""}
                          onChange={(e) => setPartei(p.id, { einzug: e.target.value || undefined })}
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">
                          Auszug (optional)
                        </Label>
                        <Input
                          type="date"
                          value={p.auszug?.slice(0, 10) ?? ""}
                          onChange={(e) => setPartei(p.id, { auszug: e.target.value || undefined })}
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between rounded-md bg-secondary/50 px-3 py-1.5 text-xs">
                      <span className="text-muted-foreground">
                        Gezahlte Vorauszahlung: {vz.monate.toLocaleString("de-DE")} Mon. ×{" "}
                        {fmtEUR(vz.monatlich)}
                      </span>
                      <span className="font-medium tabular-nums">{fmtEUR(vz.gesamt)}</span>
                    </div>
                  </div>
                );
              })}
              {parteien.length === 0 && (
                <p className="text-sm text-muted-foreground">Noch keine Parteien.</p>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={zurueck}>
              Zurück
            </Button>
            <Button onClick={weiter}>
              Weiter <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Schritt 3: Briefpapier */}
      {schritt === "briefpapier" && (
        <div className="no-print space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            <div className="mb-1 text-sm font-medium">Briefpapier</div>
            <p className="mb-4 text-xs text-muted-foreground">
              Wählen Sie ein Layout für Bildschirmvorschau, Druck und PDF-Export.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {(Object.keys(BRIEFPAPIER_LABEL) as BriefpapierId[]).map((bid) => (
                <button
                  key={bid}
                  onClick={() => setBriefpapier(bid)}
                  className={cn(
                    "space-y-2 rounded-xl border p-2 text-left transition hover:border-foreground/40",
                    briefpapier === bid && "border-foreground ring-1 ring-foreground",
                  )}
                >
                  <BriefpapierVorschau id={bid} />
                  <div className="flex items-center justify-between px-1 pb-1">
                    <span className="text-sm font-medium">{BRIEFPAPIER_LABEL[bid]}</span>
                    {briefpapier === bid && <Check className="h-4 w-4 shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={zurueck}>
              Zurück
            </Button>
            <Button onClick={weiter}>
              Weiter <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Schritt 4: Kostenaufstellung */}
      {schritt === "kosten" && (
        <div className="no-print space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium">
              <ReceiptText className="h-4 w-4" /> Kostenaufstellung
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Kostenart wählen, Betrag und optional Datum/Hinweis ergänzen — die Verteilung auf die
              Parteien wird automatisch berechnet.
            </p>

            <div className="hidden gap-3 px-1 pb-2 text-xs font-medium text-muted-foreground lg:grid lg:grid-cols-[1.2fr_1.2fr_140px_130px_190px_88px]">
              <span>Kostenart</span>
              <span>Hinweis</span>
              <span>Datum</span>
              <span>Gesamtkosten</span>
              <span>Verteilerschlüssel</span>
              <span>Aktionen</span>
            </div>
            <div className="space-y-3">
              {positionen.map((pos, index) => (
                <div
                  key={pos.id}
                  className="grid gap-3 rounded-lg border p-3 lg:border-0 lg:p-0 lg:grid-cols-[1.2fr_1.2fr_140px_130px_190px_88px]"
                >
                  <Select
                    value={pos.bezeichnung}
                    onValueChange={(v) => setPosition(pos.id, { bezeichnung: v })}
                  >
                    <SelectTrigger className="h-11 text-[15px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NK_VORLAGEN.map((v) => (
                        <SelectItem key={v.bezeichnung} value={v.bezeichnung}>
                          {v.bezeichnung}
                        </SelectItem>
                      ))}
                      {!NK_VORLAGEN.some((v) => v.bezeichnung === pos.bezeichnung) && (
                        <SelectItem value={pos.bezeichnung}>{pos.bezeichnung}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Input
                    value={pos.hinweis ?? ""}
                    onChange={(e) => setPosition(pos.id, { hinweis: e.target.value })}
                    placeholder="z. B. Belegnummer, Dienstleister"
                    className="h-11 text-[15px]"
                  />
                  <Input
                    type="date"
                    value={pos.datum?.slice(0, 10) ?? ""}
                    onChange={(e) => setPosition(pos.id, { datum: e.target.value || undefined })}
                    className="h-11 text-[15px]"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={pos.betrag || ""}
                    onChange={(e) => setPosition(pos.id, { betrag: +e.target.value })}
                    className="h-11 text-[15px]"
                  />
                  <Select
                    value={pos.schluessel}
                    onValueChange={(v) =>
                      setPosition(pos.id, { schluessel: v as Umlageschluessel })
                    }
                  >
                    <SelectTrigger className="h-11 text-[15px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(UMLAGE_LABEL) as Umlageschluessel[]).map((k) => (
                        <SelectItem key={k} value={k}>
                          {UMLAGE_LABEL[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-end gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={index === 0}
                      onClick={() => movePosition(index, -1)}
                      aria-label="Nach oben"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={index === positionen.length - 1}
                      onClick={() => movePosition(index, 1)}
                      aria-label="Nach unten"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePosition(pos.id)}
                      aria-label="Position entfernen"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {positionen.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Noch keine Positionen. Fügen Sie unten die erste Kostenart hinzu.
                </p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <Button size="sm" variant="outline" onClick={addPosition}>
                <Plus className="h-4 w-4" /> Kosten hinzufügen
              </Button>
              <div className="text-sm">
                <span className="text-muted-foreground">Summe: </span>
                <span className="font-medium tabular-nums">{fmtEUR(ergebnis.gesamtKosten)}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={zurueck}>
              Zurück
            </Button>
            <Button onClick={weiter}>
              Weiter <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Schritt 5: Prüfung & Abschluss */}
      {schritt === "abschluss" && (
        <div className="no-print flex justify-start">
          <Button variant="outline" onClick={zurueck}>
            Zurück
          </Button>
        </div>
      )}
      {schritt === "abschluss" && (
        <div
          className={cn(
            "nk-print rounded-2xl border border-t-4 bg-card p-6",
            BRIEFPAPIER_AKZENT[briefpapier],
            BRIEFPAPIER_FONT[briefpapier],
          )}
        >
          <div className="mb-6 border-b pb-4 text-center">
            <div className="text-xs text-muted-foreground">
              {[profil.vorname, profil.nachname].filter(Boolean).join(" ") || "Vermieter/in"}
              {profil.strasse ? ` · ${profil.strasse}` : ""}
              {profil.plz || profil.ort ? ` · ${profil.plz} ${profil.ort}` : ""}
            </div>
            <h2 className="mt-2 text-xl font-semibold uppercase tracking-wide">
              {titel || "Nebenkostenabrechnung"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {objekt?.adresse} · Zeitraum {fmtDate(von)} – {fmtDate(bis)}
            </p>
          </div>

          {ergebnis.parteien.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Fügen Sie Parteien und Positionen hinzu, um das Ergebnis zu sehen.
            </p>
          ) : (
            <div className="space-y-6">
              {[...ergebnis.parteien]
                .sort((a, b) =>
                  (einheitLabel(a.partei.einheitId) ?? a.partei.name).localeCompare(
                    einheitLabel(b.partei.einheitId) ?? b.partei.name,
                  ),
                )
                .map((pe) => (
                  <div key={pe.partei.id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-center sm:text-left">
                      <div>
                        <div className="font-medium">{pe.partei.name}</div>
                        {einheitLabel(pe.partei.einheitId) && (
                          <div className="text-xs text-muted-foreground">
                            {einheitLabel(pe.partei.einheitId)}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {pe.partei.wohnflaeche} m² · {pe.partei.personen} Pers.
                      </div>
                    </div>

                    <table className="mt-3 w-full text-sm">
                      <thead>
                        <tr className="border-b text-[11px] uppercase tracking-wide text-muted-foreground">
                          <th className="py-1.5 text-left font-medium">Kostenart</th>
                          <th className="py-1.5 text-right font-medium">Gesamtkosten</th>
                          <th className="py-1.5 text-right font-medium">Ihr Anteil</th>
                          <th className="w-24 py-1.5 text-right font-medium">Betrag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pe.anteile.map((an) => (
                          <tr key={an.positionId} className="border-b last:border-none">
                            <td className="py-1.5 text-muted-foreground">
                              {an.bezeichnung || "—"}
                              <span className="ml-1 text-[11px]">
                                ({UMLAGE_LABEL[an.schluessel]})
                              </span>
                            </td>
                            <td className="py-1.5 text-right text-xs text-muted-foreground tabular-nums">
                              {fmtEUR(an.gesamt)}
                            </td>
                            <td className="py-1.5 text-right text-xs text-muted-foreground tabular-nums">
                              {an.gesamt > 0
                                ? `${((an.anteil / an.gesamt) * 100).toFixed(1)} %`
                                : "—"}
                            </td>
                            <td className="w-24 py-1.5 text-right font-medium tabular-nums">
                              {fmtEUR(an.anteil)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="mt-3 space-y-1 border-t pt-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Umlagefähige Kosten (Anteil)</span>
                        <span className="tabular-nums font-medium">{fmtEUR(pe.gesamtKosten)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Gezahlte NK-Vorauszahlung
                          {pe.nkVorausMonat > 0 && (
                            <span className="ml-1 text-xs">
                              ({pe.monateAnteilig.toLocaleString("de-DE")} Mon. ×{" "}
                              {fmtEUR(pe.nkVorausMonat)})
                            </span>
                          )}
                        </span>
                        <span className="tabular-nums">− {fmtEUR(pe.vorauszahlung)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1.5 text-base font-semibold">
                        <span>{pe.saldo >= 0 ? "Guthaben" : "Nachzahlung"}</span>
                        <span
                          className={
                            "tabular-nums " + (pe.saldo >= 0 ? "text-blue-600" : "text-destructive")
                          }
                        >
                          {fmtEUR(Math.abs(pe.saldo))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

              <div className="rounded-xl bg-secondary/50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gesamtkosten</span>
                  <span className="tabular-nums font-medium">{fmtEUR(ergebnis.gesamtKosten)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Summe Vorauszahlungen</span>
                  <span className="tabular-nums">{fmtEUR(ergebnis.gesamtVorauszahlung)}</span>
                </div>
                <div className="mt-1 flex justify-between border-t pt-1.5 font-semibold">
                  <span>Gesamtsaldo</span>
                  <span
                    className={
                      "tabular-nums " +
                      (ergebnis.gesamtSaldo >= 0 ? "text-blue-600" : "text-destructive")
                    }
                  >
                    {ergebnis.gesamtSaldo >= 0 ? "Guthaben " : "Nachzahlung "}
                    {fmtEUR(Math.abs(ergebnis.gesamtSaldo))}
                  </span>
                </div>
              </div>

              {(profil.iban || profil.kontoinhaber) && (
                <div className="rounded-xl border p-4 text-sm">
                  <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Zahlungsangaben
                  </div>
                  {profil.kontoinhaber && <div>Kontoinhaber: {profil.kontoinhaber}</div>}
                  {profil.iban && <div>IBAN: {profil.iban}</div>}
                  {profil.bic && <div>BIC: {profil.bic}</div>}
                </div>
              )}

              <p className="text-[11px] text-muted-foreground">
                Hinweis: Nur tatsächlich umlagefähige Betriebskosten (§ 2 BetrKV) dürfen umgelegt
                werden. Diese Abrechnung ist eine Rechenhilfe und ersetzt keine rechtliche Prüfung.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
