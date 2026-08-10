import { useMemo, useRef, useState, type ReactNode } from "react";
import { Building2, Building, Home, Store, Car, KeyRound, ArrowLeft, ArrowRight, Check, ImagePlus } from "lucide-react";
import { ladeBilderHoch } from "@/lib/bild-utils";
import { ObjektBild } from "@/components/objekt-bild";
import { toast } from "sonner";
import {
  useStore,
  fmtEUR,
  fmtPct,
  composeAdresse,
  OBJEKTTYP_LABEL,
  type Objekt,
  type Objekttyp,
} from "@/lib/store";
import { berechneKennzahlen } from "@/lib/immobilienrechner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from "lucide-react";

type Draft = Omit<Objekt, "id" | "adresse">;

const uid = () => Math.random().toString(36).slice(2, 10);

const leererDraft: Draft = {
  typ: "einfamilienhaus",
  land: "Deutschland",
  vermietet: false,
};

const TYP_ICON: Record<Objekttyp, typeof Building2> = {
  mehrfamilienhaus: Building2,
  eigentumswohnung: Building,
  einfamilienhaus: Home,
  gewerbe: Store,
  garage: Car,
  sonstiges: KeyRound,
};

const TYP_REIHENFOLGE: Objekttyp[] = [
  "mehrfamilienhaus",
  "eigentumswohnung",
  "einfamilienhaus",
  "gewerbe",
  "garage",
  "sonstiges",
];

const SCHRITTE = ["Typ", "Adresse", "Kaufdaten", "Finanzierung", "Vermietung"] as const;

function NumField({
  label,
  value,
  onChange,
  step,
  suffix,
  placeholder,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  step?: string;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          step={step}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : +e.target.value)}
          className={suffix ? "pr-9" : undefined}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function Kenn({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div
        className={
          "font-semibold tabular-nums " +
          (tone === "pos" ? "text-blue-600" : tone === "neg" ? "text-destructive" : "")
        }
      >
        {value}
      </div>
    </div>
  );
}

export function ObjektDialog({
  trigger,
  existing,
  onSaved,
}: {
  trigger: ReactNode;
  existing?: Objekt;
  onSaved?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [schritt, setSchritt] = useState(0);
  const addObjekt = useStore((s) => s.addObjekt);
  const updateObjekt = useStore((s) => s.updateObjekt);
  const addEinheit = useStore((s) => s.addEinheit);
  const addMieter = useStore((s) => s.addMieter);
  const objektAnzahl = useStore((s) => s.objekte.length);
  const plan = useStore((s) => s.profil.plan);
  const STARTER_OBJEKT_LIMIT = 3;
  const limitErreicht = !existing && plan === "starter" && objektAnzahl >= STARTER_OBJEKT_LIMIT;
  const [form, setForm] = useState<Draft>(
    existing
      ? ({ ...existing, strasse: existing.strasse ?? existing.adresse } as Draft)
      : leererDraft,
  );
  // Für neue Objekte wird schon vor dem Speichern eine id gebraucht, damit hochgeladene
  // Bilder unter dem später gespeicherten Objekt landen (Storage-Pfad enthält die Objekt-id).
  const [neuObjektId, setNeuObjektId] = useState(() => crypto.randomUUID());
  const objektIdFuerBilder = existing?.id ?? neuObjektId;

  // Nur beim Neuanlegen: optionaler Schnell-Erfassung des ersten Mieters direkt hier,
  // statt den Umweg über Einheit-Detail-Seite erzwingen zu müssen.
  const leererMieterDraft = { name: "", telefon: "", email: "", mietbeginn: new Date().toISOString().slice(0, 10), kaution: undefined as number | undefined };
  const [mieterDraft, setMieterDraft] = useState(leererMieterDraft);

  const set = <K extends keyof Draft>(key: K, val: Draft[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const vorschau = useMemo(
    () => berechneKennzahlen({ ...(form as Objekt), id: "preview", adresse: "" }),
    [form],
  );

  // Dialog beim Öffnen zurücksetzen (nur beim Neuanlegen)
  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (o) {
      setSchritt(existing ? 1 : 0);
      setForm(
        existing
          ? ({ ...existing, strasse: existing.strasse ?? existing.adresse } as Draft)
          : leererDraft,
      );
      setMieterDraft(leererMieterDraft);
      if (!existing) setNeuObjektId(crypto.randomUUID());
    }
  };

  const adresseOk = !!(form.strasse?.trim() && form.hausnummer?.trim() && form.plz?.trim() && form.stadt?.trim());
  const letzterSchritt = schritt === SCHRITTE.length - 1;

  const bildInputRef = useRef<HTMLInputElement>(null);
  const [bilderBusy, setBilderBusy] = useState(false);
  const onBilder = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBilderBusy(true);
    try {
      const { pfade, uebersprungen } = await ladeBilderHoch(objektIdFuerBilder, files);
      if (pfade.length) set("bilder", [...(form.bilder ?? []), ...pfade]);
      if (uebersprungen > 0) toast.error(`${uebersprungen} Datei(en) übersprungen (kein Bild oder > 20 MB).`);
    } catch {
      toast.error("Bild konnte nicht hochgeladen werden.");
    } finally {
      setBilderBusy(false);
      if (bildInputRef.current) bildInputRef.current.value = "";
    }
  };

  const weiter = () => setSchritt((s) => Math.min(s + 1, SCHRITTE.length - 1));
  const zurueck = () => setSchritt((s) => Math.max(s - 1, 0));

  const speichern = () => {
    if (limitErreicht) {
      toast.error(
        `Der Starter-Plan erlaubt bis zu ${STARTER_OBJEKT_LIMIT} Objekte. Für weitere Objekte auf Professional upgraden.`,
      );
      return;
    }
    const adresse = composeAdresse(form) || form.strasse?.trim() || "Ohne Adresse";
    const daten = { ...form, adresse };
    if (existing) {
      updateObjekt(existing.id, daten);
      onSaved?.(existing.id);
    } else {
      const id = addObjekt({ ...daten, id: neuObjektId });
      if (form.vermietet && mieterDraft.name.trim()) {
        const einheitId = addEinheit({
          objektId: id,
          bezeichnung: "Hauptwohnung",
          wohnflaeche: form.gesamtwohnflaeche ?? 0,
          zimmer: 0,
          stockwerk: "",
        });
        addMieter({
          einheitId,
          name: mieterDraft.name.trim(),
          telefon: mieterDraft.telefon,
          email: mieterDraft.email,
          mietbeginn: mieterDraft.mietbeginn,
          mietende: "",
          kaltmiete: form.istKaltmiete ?? 0,
          nebenkosten: form.nebenkostenVorauszahlung ?? 0,
          kaution: mieterDraft.kaution,
        });
      }
      onSaved?.(id);
    }
    setOpen(false);
  };

  const TypIcon = TYP_ICON[form.typ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {schritt === 0 ? (
          <DialogHeader>
            <DialogTitle>Was für einen Typ von Mietobjekt möchten Sie anlegen?</DialogTitle>
          </DialogHeader>
        ) : (
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TypIcon className="h-5 w-5 text-primary" />
              {SCHRITTE[schritt] === "Adresse" && `Welche Adresse hat Ihr Mietobjekt? — ${OBJEKTTYP_LABEL[form.typ]}`}
              {SCHRITTE[schritt] === "Kaufdaten" && "Kaufdaten"}
              {SCHRITTE[schritt] === "Finanzierung" && "Finanzierung"}
              {SCHRITTE[schritt] === "Vermietung" && "Vermietung & Auswertung"}
            </DialogTitle>
          </DialogHeader>
        )}

        {/* Fortschritt */}
        {schritt > 0 && (
          <div className="flex items-center gap-1.5">
            {SCHRITTE.map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-1.5">
                <div
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition",
                    i <= schritt ? "bg-primary" : "bg-muted",
                  )}
                />
              </div>
            ))}
          </div>
        )}

        {/* SCHRITT 1: Typ-Auswahl */}
        {schritt === 0 && (
          <div className="grid grid-cols-2 gap-3 py-2 sm:grid-cols-3">
            {TYP_REIHENFOLGE.map((t) => {
              const Icon = TYP_ICON[t];
              const aktiv = form.typ === t;
              return (
                <button
                  key={t}
                  onClick={() => {
                    set("typ", t);
                    setSchritt(1);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center transition hover:border-primary hover:bg-accent",
                    aktiv && "border-primary ring-1 ring-primary",
                  )}
                >
                  <Icon className="h-9 w-9 text-primary" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-primary">{OBJEKTTYP_LABEL[t]}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* SCHRITT 2: Adresse */}
        {SCHRITTE[schritt] === "Adresse" && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <div>
                <Label className="text-xs">Straße *</Label>
                <Input placeholder="Hauptstraße" value={form.strasse ?? ""} onChange={(e) => set("strasse", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Nr. *</Label>
                <Input placeholder="12" value={form.hausnummer ?? ""} onChange={(e) => set("hausnummer", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-3">
              <div>
                <Label className="text-xs">PLZ *</Label>
                <Input placeholder="10115" value={form.plz ?? ""} onChange={(e) => set("plz", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Stadt *</Label>
                <Input placeholder="Berlin" value={form.stadt ?? ""} onChange={(e) => set("stadt", e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Land</Label>
              <Input value={form.land ?? "Deutschland"} onChange={(e) => set("land", e.target.value)} />
            </div>
          </div>
        )}

        {/* SCHRITT 3: Kaufdaten */}
        {SCHRITTE[schritt] === "Kaufdaten" && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Kaufpreis" suffix="€" value={form.kaufpreis} onChange={(v) => set("kaufpreis", v)} />
              <div>
                <Label className="text-xs">Kaufdatum</Label>
                <Input
                  type="date"
                  value={form.kaufdatum?.slice(0, 10) ?? ""}
                  onChange={(e) => set("kaufdatum", e.target.value || undefined)}
                />
              </div>
            </div>
            {form.typ === "eigentumswohnung" && (
              <div>
                <Label className="text-xs">Stockwerk / Lage</Label>
                <Input
                  placeholder="z. B. 2. OG links"
                  value={form.stockwerk ?? ""}
                  onChange={(e) => set("stockwerk", e.target.value)}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <NumField
                label="Kaufnebenkosten (Steuer, Notar, Makler)"
                suffix="€"
                value={form.kaufnebenkosten}
                onChange={(v) => set("kaufnebenkosten", v)}
              />
              <NumField
                label="Aktueller Marktwert (Schätzung)"
                suffix="€"
                value={form.marktwert}
                onChange={(v) => set("marktwert", v)}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <NumField label="Wohnfläche" suffix="m²" value={form.gesamtwohnflaeche} onChange={(v) => set("gesamtwohnflaeche", v)} />
              <NumField label="Grundstück" suffix="m²" value={form.grundstuecksflaeche} onChange={(v) => set("grundstuecksflaeche", v)} />
              <NumField label="Baujahr" value={form.baujahr} onChange={(v) => set("baujahr", v)} placeholder="1978" />
            </div>
            <NumField label="Anzahl Einheiten" value={form.anzahlEinheiten} onChange={(v) => set("anzahlEinheiten", v)} placeholder="1" />
            <div className="grid grid-cols-2 gap-3">
              <NumField
                label="Bodenanteil (nicht abschreibbar)"
                suffix="%"
                value={form.grundstuecksanteilProzent}
                onChange={(v) => set("grundstuecksanteilProzent", v)}
                placeholder="20"
              />
              <div>
                <Label className="text-xs">AfA-Satz (Abschreibung)</Label>
                <Select
                  value={form.afaSatz != null ? String(form.afaSatz) : undefined}
                  onValueChange={(v) => set("afaSatz", +v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="2 % (Standard)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 % (Bau ab 1925)</SelectItem>
                    <SelectItem value="2.5">2,5 % (Bau vor 1925)</SelectItem>
                    <SelectItem value="3">3 % (Neubau ab 2023)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Boden- und AfA-Angaben werden im Steuer-Modul verwendet.</p>
          </div>
        )}

        {/* SCHRITT 4: Finanzierung */}
        {SCHRITTE[schritt] === "Finanzierung" && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Eigenkapital" suffix="€" value={form.eigenkapital} onChange={(v) => set("eigenkapital", v)} />
              <NumField label="Darlehensbetrag" suffix="€" value={form.darlehensbetrag} onChange={(v) => set("darlehensbetrag", v)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Zinssatz p. a." suffix="%" step="0.01" value={form.zinssatz} onChange={(v) => set("zinssatz", v)} />
              <NumField label="Bankrate / Monat (Zins + Tilgung)" suffix="€" value={form.monatlicheRate} onChange={(v) => set("monatlicheRate", v)} />
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">
              Nur der tatsächlich ans Kreditinstitut gezahlte Betrag. Der Zins-/Tilgungsrechner (Restschuld) rechnet ausschließlich mit diesem Betrag und dem Zinssatz.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Finanzierungsbeginn (für Restschuld)</Label>
                <Input
                  type="date"
                  value={form.finanzierungsbeginn?.slice(0, 10) ?? ""}
                  onChange={(e) => set("finanzierungsbeginn", e.target.value || undefined)}
                />
              </div>
              <NumField
                label="Bausparrate / Monat (optional)"
                suffix="€"
                value={form.bausparBetragMonat}
                onChange={(v) => set("bausparBetragMonat", v)}
              />
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">
              Für einen separaten Bausparvertrag neben dem Bankdarlehen. Fließt in den Cashflow ein, aber nicht in die Restschuld-Berechnung.
            </p>
            <NumField
              label="Laufende Kosten / Monat (nicht umlegbar)"
              suffix="€"
              value={form.laufendeKostenMonat}
              onChange={(v) => set("laufendeKostenMonat", v)}
            />
            <p className="-mt-2 text-xs text-muted-foreground">
              Kosten, die Sie nicht über die Nebenkostenabrechnung auf den Mieter umlegen können (z. B. Instandhaltungsrücklage, Verwaltung). Wird von der Miete abgezogen, um Cashflow und Nettorendite zu berechnen.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Bank</Label>
                <Input placeholder="z. B. Sparkasse" value={form.bank ?? ""} onChange={(e) => set("bank", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Zinsbindung bis</Label>
                <Input
                  type="date"
                  value={form.zinsbindungBis?.slice(0, 10) ?? ""}
                  onChange={(e) => set("zinsbindungBis", e.target.value || undefined)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Gebäudeversicherung läuft ab</Label>
                <Input
                  type="date"
                  value={form.versicherungAblauf?.slice(0, 10) ?? ""}
                  onChange={(e) => set("versicherungAblauf", e.target.value || undefined)}
                />
              </div>
              <div>
                <Label className="text-xs">Energieausweis gültig bis</Label>
                <Input
                  type="date"
                  value={form.energieausweisGueltigBis?.slice(0, 10) ?? ""}
                  onChange={(e) => set("energieausweisGueltigBis", e.target.value || undefined)}
                />
              </div>
            </div>

            {/* Sondertilgungen */}
            <div className="rounded-lg border bg-background p-3">
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-xs">Sondertilgungen (optional)</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    set("sondertilgungen", [
                      ...(form.sondertilgungen ?? []),
                      { id: uid(), datum: new Date().toISOString().slice(0, 10), betrag: 0 },
                    ])
                  }
                >
                  <Plus className="h-4 w-4" /> Sondertilgung
                </Button>
              </div>
              <div className="space-y-2">
                {(form.sondertilgungen ?? []).map((st) => (
                  <div key={st.id} className="grid grid-cols-[1fr_1fr_36px] gap-2">
                    <Input
                      type="date"
                      value={st.datum.slice(0, 10)}
                      onChange={(e) =>
                        set(
                          "sondertilgungen",
                          (form.sondertilgungen ?? []).map((x) => (x.id === st.id ? { ...x, datum: e.target.value } : x)),
                        )
                      }
                    />
                    <div className="relative">
                      <Input
                        type="number"
                        className="pr-8"
                        placeholder="Betrag"
                        value={st.betrag || ""}
                        onChange={(e) =>
                          set(
                            "sondertilgungen",
                            (form.sondertilgungen ?? []).map((x) => (x.id === st.id ? { ...x, betrag: +e.target.value } : x)),
                          )
                        }
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">€</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => set("sondertilgungen", (form.sondertilgungen ?? []).filter((x) => x.id !== st.id))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {(form.sondertilgungen ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground">Keine Sondertilgungen erfasst.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SCHRITT 5: Vermietung + Auswertung */}
        {SCHRITTE[schritt] === "Vermietung" && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between rounded-lg border bg-background p-3">
              <div>
                <div className="text-sm font-medium">Aktuell vermietet</div>
                <p className="text-xs text-muted-foreground">
                  {form.vermietet ? "Geben Sie die aktuelle Kaltmiete an." : "Geben Sie die gewünschte Zielmiete an."}
                </p>
              </div>
              <Switch checked={form.vermietet} onCheckedChange={(v) => set("vermietet", v)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {form.vermietet ? (
                <NumField label="Aktuelle Kaltmiete / Monat" suffix="€" value={form.istKaltmiete} onChange={(v) => set("istKaltmiete", v)} />
              ) : (
                <NumField label="Gewünschte Kaltmiete / Monat" suffix="€" value={form.zielKaltmiete} onChange={(v) => set("zielKaltmiete", v)} />
              )}
              <NumField
                label="Nebenkosten / Monat"
                suffix="€"
                value={form.nebenkostenVorauszahlung}
                onChange={(v) => set("nebenkostenVorauszahlung", v)}
              />
              <NumField
                label="Kaution"
                suffix="€"
                value={mieterDraft.kaution}
                onChange={(v) => setMieterDraft((m) => ({ ...m, kaution: v }))}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Nebenkosten trägt der Mieter über die Vorauszahlung; nur ein Planwert für dieses Objekt (z. B. solange noch kein Mieter feststeht). Für die tatsächliche Nebenkostenabrechnung tragen Sie den Betrag pro Mieter direkt bei der jeweiligen Partei ein.
            </p>

            {form.vermietet && !existing && (
              <div className="rounded-lg border bg-background p-3">
                <div className="text-sm font-medium">Mieter (optional direkt anlegen)</div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Legt automatisch eine Einheit „Hauptwohnung" an und trägt diesen Mieter dort ein.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={mieterDraft.name}
                      onChange={(e) => setMieterDraft((m) => ({ ...m, name: e.target.value }))}
                      placeholder="Vor- und Nachname"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Telefon</Label>
                    <Input value={mieterDraft.telefon} onChange={(e) => setMieterDraft((m) => ({ ...m, telefon: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">E-Mail</Label>
                    <Input type="email" value={mieterDraft.email} onChange={(e) => setMieterDraft((m) => ({ ...m, email: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Mietbeginn</Label>
                    <Input
                      type="date"
                      value={mieterDraft.mietbeginn}
                      onChange={(e) => setMieterDraft((m) => ({ ...m, mietbeginn: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bilder */}
            <div className="rounded-lg border bg-background p-3">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-medium">Bilder</div>
                <Button type="button" size="sm" variant="outline" disabled={bilderBusy} onClick={() => bildInputRef.current?.click()}>
                  <ImagePlus className="h-4 w-4" /> {bilderBusy ? "Lädt …" : "Bilder hinzufügen"}
                </Button>
                <input ref={bildInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onBilder(e.target.files)} />
              </div>
              {(form.bilder ?? []).length === 0 ? (
                <button
                  type="button"
                  onClick={() => bildInputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-1 rounded-md border border-dashed p-4 text-xs text-muted-foreground transition hover:border-primary hover:text-foreground"
                >
                  <ImagePlus className="h-5 w-5" />
                  Fotos vom Objekt hinzufügen (optional)
                </button>
              ) : (
                <>
                  <p className="mb-2 text-[11px] text-muted-foreground">Das erste Bild ist das Titelbild in der Objekte-Liste.</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {(form.bilder ?? []).map((src, i) => {
                      const liste = form.bilder ?? [];
                      const verschieben = (delta: number) => {
                        const ziel = i + delta;
                        if (ziel < 0 || ziel >= liste.length) return;
                        const neu = [...liste];
                        [neu[i], neu[ziel]] = [neu[ziel], neu[i]];
                        set("bilder", neu);
                      };
                      return (
                        <div key={src} className="group relative aspect-[4/3] overflow-hidden rounded-md border bg-muted">
                          <ObjektBild pfad={src} alt={`Bild ${i + 1}`} className="h-full w-full object-cover" />
                          {i === 0 && (
                            <span className="absolute left-1 top-1 rounded bg-background/85 px-1 py-0.5 text-[9px] font-medium">Titelbild</span>
                          )}
                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 transition group-hover:opacity-100">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                aria-label="Nach vorne verschieben"
                                disabled={i === 0}
                                onClick={() => verschieben(-1)}
                                className="grid h-5 w-5 place-items-center rounded bg-background/80 disabled:opacity-30"
                              >
                                <ChevronLeftIcon className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                aria-label="Nach hinten verschieben"
                                disabled={i === liste.length - 1}
                                onClick={() => verschieben(1)}
                                className="grid h-5 w-5 place-items-center rounded bg-background/80 disabled:opacity-30"
                              >
                                <ChevronRightIcon className="h-3 w-3" />
                              </button>
                            </div>
                            <button
                              type="button"
                              aria-label="Bild entfernen"
                              onClick={() => set("bilder", liste.filter((_, idx) => idx !== i))}
                              className="grid h-5 w-5 place-items-center rounded bg-background/80"
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="rounded-lg border bg-secondary/40 p-4">
              <div className="mb-3 text-xs font-medium text-muted-foreground">Automatische Auswertung</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                <Kenn label="€/m²" value={vorschau.preisProQm != null ? fmtEUR(vorschau.preisProQm) : "—"} />
                <Kenn label="Rendite" value={vorschau.bruttorendite != null ? fmtPct(vorschau.bruttorendite) : "—"} />
                <Kenn label="Jahreskaltmiete" value={vorschau.jahreskaltmiete > 0 ? fmtEUR(vorschau.jahreskaltmiete) : "—"} />
                <Kenn
                  label="Cashflow / Monat"
                  value={fmtEUR(vorschau.cashflowMonat)}
                  tone={vorschau.cashflowMonat >= 0 ? "pos" : "neg"}
                />
              </div>
            </div>
          </div>
        )}

        {/* Fußzeile mit Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setOpen(false)}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Abbrechen
          </button>

          {schritt > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={zurueck}>
                <ArrowLeft className="h-4 w-4" /> Zurück
              </Button>
              {letzterSchritt ? (
                <Button onClick={speichern} disabled={limitErreicht}>
                  <Check className="h-4 w-4" />{" "}
                  {limitErreicht ? "Objekt-Limit erreicht" : existing ? "Speichern" : "Objekt anlegen"}
                </Button>
              ) : (
                <Button onClick={weiter} disabled={SCHRITTE[schritt] === "Adresse" && !adresseOk}>
                  Weiter <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
