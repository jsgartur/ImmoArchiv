import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  User,
  AlertTriangle,
  Pencil,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { differenceInMonths, parseISO } from "date-fns";
import {
  useStore,
  fmtEUR,
  fmtPct,
  fmtDate,
  monatKey,
  monatLabel,
  OBJEKTTYP_LABEL,
  type Einheit,
} from "@/lib/store";
import {
  berechneKennzahlen,
  berechneTilgung,
  erwarteteMieteFuerMonat,
} from "@/lib/immobilienrechner";
import { LadeSkeleton } from "@/components/lade-skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ObjektDialog } from "@/components/objekt-dialog";
import { Dokumente } from "@/components/dokumente";
import { Bilder } from "@/components/bilder";
import { DonutCard } from "@/components/charts";
import { MieterPortalDialog } from "@/components/mieter-portal-dialog";
import { MieterDialog } from "@/components/mieter-dialog";

export const Route = createFileRoute("/dashboard/objekte/$id")({
  component: ObjektDetail,
  notFoundComponent: () => (
    <div className="py-20 text-center text-muted-foreground">Objekt nicht gefunden.</div>
  ),
});

function EinheitDialog({ objektId }: { objektId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Einheit, "id" | "objektId">>({
    bezeichnung: "",
    wohnflaeche: 0,
    zimmer: 0,
    stockwerk: "",
  });
  const addEinheit = useStore((s) => s.addEinheit);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4" />
          Einheit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Einheit</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Bezeichnung</Label>
            <Input
              placeholder="EG links"
              value={form.bezeichnung}
              onChange={(e) => setForm({ ...form, bezeichnung: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Wohnfläche (m²)</Label>
              <Input
                type="number"
                value={form.wohnflaeche || ""}
                onChange={(e) => setForm({ ...form, wohnflaeche: +e.target.value })}
              />
            </div>
            <div>
              <Label>Zimmer</Label>
              <Input
                type="number"
                value={form.zimmer || ""}
                onChange={(e) => setForm({ ...form, zimmer: +e.target.value })}
              />
            </div>
            <div>
              <Label>Stockwerk</Label>
              <Input
                value={form.stockwerk ?? ""}
                onChange={(e) => setForm({ ...form, stockwerk: e.target.value })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!form.bezeichnung.trim()}
            onClick={() => {
              addEinheit({ ...form, objektId });
              setOpen(false);
              setForm({ bezeichnung: "", wohnflaeche: 0, zimmer: 0, stockwerk: "" });
            }}
          >
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KennzahlKarte({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "pos" | "neg";
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={
          "mt-1 text-xl font-semibold tabular-nums " +
          (tone === "pos" ? "text-blue-600" : tone === "neg" ? "text-destructive" : "")
        }
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Zeile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b py-2 text-sm last:border-none">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function ObjektDetail() {
  const { id } = Route.useParams();
  const objekt = useStore((s) => s.objekte.find((o) => o.id === id));
  const alleEinheiten = useStore((s) => s.einheiten);
  const alleMieter = useStore((s) => s.mieter);
  const einheiten = alleEinheiten.filter((e) => e.objektId === id);
  const removeObjekt = useStore((s) => s.removeObjekt);
  const removeEinheit = useStore((s) => s.removeEinheit);
  const mietzahlungen = useStore((s) => s.mietzahlungen);
  const setMieteBezahlt = useStore((s) => s.setMieteBezahlt);
  const objekteGeladen = useStore((s) => s.objekteGeladen);
  const einheitenGeladen = useStore((s) => s.einheitenGeladen);
  const mieterGeladen = useStore((s) => s.mieterGeladen);

  if (!objekteGeladen || !einheitenGeladen || !mieterGeladen) {
    return <LadeSkeleton titel="Objekt" text="Details werden geladen…" />;
  }
  if (!objekt) throw notFound();
  const k = berechneKennzahlen(objekt);
  const t = berechneTilgung(objekt);
  const mKey = monatKey();
  const einheitenIds = einheiten.map((e) => e.id);
  const mieteZeilenDiesenMonat = alleMieter
    .filter((m) => einheitenIds.includes(m.einheitId))
    .map((m) => ({ mieter: m, betrag: erwarteteMieteFuerMonat(m, mKey) }))
    .filter((z) => z.betrag > 0);
  const istBezahlt = (mieterId: string) =>
    mietzahlungen.some((z) => z.mieterId === mieterId && z.monat === mKey);

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/dashboard/objekte"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Alle Objekte
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {objekt.adresse}
              </h1>
              {objekt.vermietet ? (
                <Badge variant="outline" className="border-blue-500/40 text-blue-600">
                  vermietet
                </Badge>
              ) : (
                <Badge variant="outline">frei</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {OBJEKTTYP_LABEL[objekt.typ]}
              {objekt.baujahr ? ` · Baujahr ${objekt.baujahr}` : ""}
              {objekt.gesamtwohnflaeche ? ` · ${objekt.gesamtwohnflaeche} m²` : ""}
              {objekt.kaufdatum ? ` · gekauft ${fmtDate(objekt.kaufdatum)}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <ObjektDialog
              existing={objekt}
              trigger={
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4" /> Bearbeiten
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (confirm("Objekt und alle zugehörigen Daten löschen?")) {
                  removeObjekt(objekt.id);
                  history.back();
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bilder */}
      <Bilder objektId={objekt.id} />

      {/* Kennzahlen */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KennzahlKarte
          label="Kaufpreis"
          value={k.kaufpreis > 0 ? fmtEUR(k.kaufpreis) : "—"}
          hint={k.gesamtinvestition > 0 ? `inkl. NK: ${fmtEUR(k.gesamtinvestition)}` : undefined}
        />
        <KennzahlKarte
          label="Preis pro m²"
          value={k.preisProQm != null ? fmtEUR(k.preisProQm) : "—"}
          hint={k.mieteProQm != null ? `Miete ${fmtEUR(k.mieteProQm)}/m²` : undefined}
        />
        <KennzahlKarte
          label="Rendite"
          value={k.bruttorendite != null ? fmtPct(k.bruttorendite) : "—"}
          hint={k.nettorendite != null ? `netto ${fmtPct(k.nettorendite)}` : undefined}
        />
        <KennzahlKarte
          label="Cashflow / Monat"
          value={k.rateMonat > 0 || k.monatskaltmiete > 0 ? fmtEUR(k.cashflowMonat) : "—"}
          tone={k.cashflowMonat >= 0 ? "pos" : "neg"}
          hint={`${fmtEUR(k.cashflowJahr)} / Jahr`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Kauf & Finanzierung */}
        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-3 text-sm font-medium">Kauf & Finanzierung</div>
          <Zeile label="Kaufpreis" value={k.kaufpreis > 0 ? fmtEUR(k.kaufpreis) : "—"} />
          <Zeile label="Aktueller Marktwert" value={k.marktwert > 0 ? fmtEUR(k.marktwert) : "—"} />
          <Zeile
            label="Kaufnebenkosten"
            value={k.kaufnebenkosten > 0 ? fmtEUR(k.kaufnebenkosten) : "—"}
          />
          <Zeile
            label="Gesamtinvestition"
            value={k.gesamtinvestition > 0 ? fmtEUR(k.gesamtinvestition) : "—"}
          />
          <Zeile
            label="Eigenkapital"
            value={k.eigenkapital != null ? fmtEUR(k.eigenkapital) : "—"}
          />
          <Zeile label="Darlehen" value={k.darlehen != null ? fmtEUR(k.darlehen) : "—"} />
          <Zeile
            label="Zinssatz p. a."
            value={objekt.zinssatz != null ? fmtPct(objekt.zinssatz) : "—"}
          />
          <Zeile label="Bank" value={objekt.bank || "—"} />
          <Zeile
            label="Zinsbindung bis"
            value={objekt.zinsbindungBis ? fmtDate(objekt.zinsbindungBis) : "—"}
          />
          <Zeile label="Bankrate / Monat" value={k.rateMonat > 0 ? fmtEUR(k.rateMonat) : "—"} />
          {k.bausparBetragMonat > 0 && (
            <Zeile label="Bausparrate / Monat" value={fmtEUR(k.bausparBetragMonat)} />
          )}
          {(objekt.sondertilgungen?.length ?? 0) > 0 && (
            <Zeile
              label={`Sondertilgungen (${objekt.sondertilgungen!.length})`}
              value={fmtEUR(objekt.sondertilgungen!.reduce((s, x) => s + (x.betrag || 0), 0))}
            />
          )}
          <Zeile
            label="Laufende Kosten / Monat"
            value={k.laufendeKostenMonat > 0 ? fmtEUR(k.laufendeKostenMonat) : "—"}
          />
          <Zeile
            label="Mietmultiplikator"
            value={k.mietmultiplikator != null ? `${k.mietmultiplikator.toFixed(1)}-fach` : "—"}
          />
          <Zeile label="Beleihungsauslauf (LTV)" value={k.ltv != null ? fmtPct(k.ltv) : "—"} />
          <Zeile
            label="Eigenkapitalquote"
            value={k.eigenkapitalquote != null ? fmtPct(k.eigenkapitalquote) : "—"}
          />
        </div>

        {/* Vermietung */}
        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-3 text-sm font-medium">Vermietung & Ertrag</div>
          <Zeile label="Status" value={objekt.vermietet ? "Vermietet" : "Nicht vermietet"} />
          <Zeile
            label={objekt.vermietet ? "Aktuelle Kaltmiete / Monat" : "Zielmiete / Monat"}
            value={k.monatskaltmiete > 0 ? fmtEUR(k.monatskaltmiete) : "—"}
          />
          <Zeile
            label="Kaltmiete / Jahr"
            value={k.jahreskaltmiete > 0 ? fmtEUR(k.jahreskaltmiete) : "—"}
          />
          <Zeile
            label="Nebenkosten / Monat"
            value={objekt.nebenkostenVorauszahlung ? fmtEUR(objekt.nebenkostenVorauszahlung) : "—"}
          />
          <Zeile
            label="Nebenkosten / Jahr"
            value={
              objekt.nebenkostenVorauszahlung ? fmtEUR(objekt.nebenkostenVorauszahlung * 12) : "—"
            }
          />
          <Zeile label="Miete pro m²" value={k.mieteProQm != null ? fmtEUR(k.mieteProQm) : "—"} />
          <Zeile
            label="Cashflow / Monat"
            value={k.rateMonat > 0 || k.monatskaltmiete > 0 ? fmtEUR(k.cashflowMonat) : "—"}
          />
          <Zeile
            label="Eigenkapitalrendite (Cashflow)"
            value={
              k.eigenkapitalrenditeCashflow != null ? fmtPct(k.eigenkapitalrenditeCashflow) : "—"
            }
          />
          {!objekt.vermietet && k.monatskaltmiete > 0 && (
            <p className="mt-3 rounded-md bg-secondary p-3 text-xs text-muted-foreground">
              Berechnung auf Basis Ihrer Zielmiete von {fmtEUR(k.monatskaltmiete)} / Monat.
            </p>
          )}

          {mieteZeilenDiesenMonat.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Miete {monatLabel(mKey)}
              </div>
              {mieteZeilenDiesenMonat.map(({ mieter: m, betrag }) => {
                const bezahlt = istBezahlt(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => setMieteBezahlt(m.id, mKey, !bezahlt, betrag)}
                    className={
                      "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition " +
                      (bezahlt
                        ? "border-blue-500/40 bg-blue-500/10"
                        : "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15")
                    }
                  >
                    {bezahlt ? (
                      <CheckCircle2 className="h-6 w-6 shrink-0 text-blue-600" />
                    ) : (
                      <Circle className="h-6 w-6 shrink-0 text-amber-600" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {m.name}: {bezahlt ? "bezahlt" : "noch offen"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {bezahlt
                          ? "Zum Rückgängigmachen klicken."
                          : "Klicken, um als bezahlt zu markieren."}
                      </div>
                    </div>
                    <div className="shrink-0 font-medium tabular-nums">{fmtEUR(betrag)}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Diagramme */}
      {(k.gesamtinvestition > 0 || t.gueltig) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {(k.eigenkapital || k.darlehen) && (
            <DonutCard
              title="Finanzierungsstruktur"
              hint="Eigenkapital und Fremdkapital"
              data={[
                { name: "Eigenkapital", value: k.eigenkapital ?? 0, color: "#2563eb" },
                { name: "Darlehen", value: k.darlehen ?? 0, color: "#3b82f6" },
              ]}
              centerLabel="Investition"
              centerValue={fmtEUR(k.gesamtinvestition)}
            />
          )}
          {t.gueltig && (
            <DonutCard
              title="Bankrate: Zins vs. Tilgung"
              hint="Aufteilung der nächsten Monatsrate"
              data={[
                { name: "Tilgung", value: t.tilgungsAnteilAktuell, color: "#2563eb" },
                { name: "Zinsen", value: t.zinsAnteilAktuell, color: "#f59e0b" },
              ]}
              centerLabel="Rate"
              centerValue={fmtEUR(k.rateMonat)}
            />
          )}
        </div>
      )}

      {/* Restschuld (Kurzüberblick, Details auf eigener Seite) */}
      {t.gueltig && (
        <Link
          to="/dashboard/finanzierung"
          className="block rounded-2xl border bg-card p-5 transition hover:border-foreground/30"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium">Restschuld & Tilgung</div>
            <span className="inline-flex items-center gap-1 text-xs text-primary">
              Alle Finanzierungen <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <KennzahlKarte
              label="Restschuld heute"
              value={fmtEUR(t.restschuld)}
              hint={`von ${fmtEUR(t.darlehen)} Darlehen`}
            />
            <KennzahlKarte
              label="Bereits getilgt"
              value={fmtEUR(t.bereitsGetilgt)}
              tone="pos"
              hint={`${t.monateGelaufen} Monate gezahlt`}
            />
            <KennzahlKarte
              label="Voraussichtlich schuldenfrei"
              value={
                t.restlaufzeitMonate == null
                  ? "—"
                  : `${Math.floor(t.restlaufzeitMonate / 12)} J. ${t.restlaufzeitMonate % 12} Mon.`
              }
              hint={
                t.abbezahltVoraussichtlich
                  ? `~ ${monatLabel(t.abbezahltVoraussichtlich)}`
                  : undefined
              }
            />
          </div>
          {t.hinweis && (
            <p className="mt-3 rounded-md bg-amber-500/10 p-3 text-xs text-amber-700">
              {t.hinweis}
            </p>
          )}
        </Link>
      )}

      {/* Dokumente */}
      <Dokumente objektId={objekt.id} />

      {/* Einheiten & Mieter */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Einheiten & Mieter</div>
            <p className="text-xs text-muted-foreground">
              Optional – für Objekte mit mehreren Wohneinheiten.
            </p>
          </div>
          <EinheitDialog objektId={objekt.id} />
        </div>

        {einheiten.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Noch keine Einheiten angelegt.
          </div>
        ) : (
          <div className="space-y-3">
            {einheiten.map((e) => {
              const mieter = alleMieter.find((m) => m.einheitId === e.id && !m.mietende);
              const abgelaufen = alleMieter.filter((m) => m.einheitId === e.id && m.mietende);
              const auslaufWarnung =
                mieter?.mietende &&
                differenceInMonths(parseISO(mieter.mietende), new Date()) <= 3 &&
                differenceInMonths(parseISO(mieter.mietende), new Date()) >= 0;

              return (
                <div key={e.id} className="rounded-xl border bg-background p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{e.bezeichnung}</div>
                        {mieter ? (
                          <Badge variant="secondary">belegt</Badge>
                        ) : (
                          <Badge variant="outline">frei</Badge>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {e.wohnflaeche} m² · {e.zimmer} Zi. {e.stockwerk && `· ${e.stockwerk}`}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!mieter && <MieterDialog einheitId={e.id} />}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirm("Einheit löschen?") && removeEinheit(e.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {mieter && (
                    <div className="mt-4 rounded-lg border bg-card p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{mieter.name}</div>
                            {(mieter.telefon || mieter.email || mieter.kontakt) && (
                              <div className="text-xs text-muted-foreground">
                                {[mieter.telefon, mieter.email, mieter.kontakt]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </div>
                            )}
                            <div className="mt-1 text-xs text-muted-foreground">
                              Miete seit {fmtDate(mieter.mietbeginn)}
                              {mieter.mietende
                                ? ` · befristet bis ${fmtDate(mieter.mietende)}`
                                : ""}
                              {mieter.kaution ? ` · Kaution ${fmtEUR(mieter.kaution)}` : ""}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{fmtEUR(mieter.kaltmiete)}</div>
                          <div className="text-xs text-muted-foreground">
                            + {fmtEUR(mieter.nebenkosten)} NK
                          </div>
                          <div className="mt-1 flex justify-end gap-1">
                            <MieterPortalDialog mieter={mieter} />
                            <MieterDialog einheitId={e.id} existing={mieter} />
                          </div>
                        </div>
                      </div>
                      {auslaufWarnung && (
                        <div className="mt-3 flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          Mietvertrag läuft in weniger als 3 Monaten aus ({fmtDate(mieter.mietende)}
                          ).
                        </div>
                      )}
                    </div>
                  )}

                  {abgelaufen.length > 0 && (
                    <details className="mt-3 text-xs text-muted-foreground">
                      <summary className="cursor-pointer">
                        Vorherige Mieter ({abgelaufen.length})
                      </summary>
                      <ul className="mt-2 space-y-1">
                        {abgelaufen.map((m) => (
                          <li key={m.id}>
                            {m.name} — bis {fmtDate(m.mietende)}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
