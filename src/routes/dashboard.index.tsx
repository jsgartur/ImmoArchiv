import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Wrench, ArrowRight, TrendingUp, Wallet, Coins, PackageOpen, AlertCircle, CheckCircle2, Landmark, PiggyBank, Percent, ArrowDownRight } from "lucide-react";
import { useStore, fmtEUR, fmtEUR0, fmtPct, monatKey, monatLabel, OBJEKTTYP_LABEL } from "@/lib/store";
import { berechneKennzahlen, portfolioKennzahlen, erwarteteMieteFuerMonat } from "@/lib/immobilienrechner";
import { Button } from "@/components/ui/button";
import { ObjektDialog } from "@/components/objekt-dialog";
import { DonutCard, BarCard } from "@/components/charts";
import { LadeSkeleton } from "@/components/lade-skeleton";

const kurzAdresse = (o: { strasse?: string; adresse: string }) => o.strasse?.trim() || o.adresse.split(",")[0];

export const Route = createFileRoute("/dashboard/")({
  component: Uebersicht,
});

function Stat({ label, value, hint, icon: Icon, tone }: { label: string; value: string; hint?: string; icon: typeof Building2; tone?: "pos" | "neg" }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {label}
        <Icon className="h-4 w-4" />
      </div>
      <div
        className={
          "mt-2 text-3xl font-semibold tracking-tight tabular-nums " +
          (tone === "pos" ? "text-blue-600" : tone === "neg" ? "text-destructive" : "")
        }
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Uebersicht() {
  const { objekte, maengel, seedBeispiel, reset } = useStore();
  const mietzahlungen = useStore((s) => s.mietzahlungen);
  const mieter = useStore((s) => s.mieter);
  const aufgaben = useStore((s) => s.aufgaben);
  const objekteGeladen = useStore((s) => s.objekteGeladen);

  if (!objekteGeladen) {
    return <LadeSkeleton titel="Übersicht" text="Ihr Immobilien-Portfolio auf einen Blick." />;
  }

  const offen = maengel.filter((m) => m.status !== "erledigt").length;
  const heuteIso = new Date().toISOString().slice(0, 10);
  const offeneAufgaben = aufgaben.filter((a) => !a.erledigt).length;
  const ueberfaelligeAufgaben = aufgaben.filter((a) => !a.erledigt && a.faelligkeit && a.faelligkeit.slice(0, 10) < heuteIso).length;
  const p = portfolioKennzahlen(objekte);
  const isEmpty = objekte.length === 0;

  const mKey = monatKey();
  const [jy, jm] = mKey.split("-").map(Number);
  const prevKey = monatKey(new Date(jy, jm - 2, 1)); // Vormonat
  const vermietet = objekte.filter((o) => o.vermietet);
  const mieterMitMieteMonat = mieter.filter((m) => erwarteteMieteFuerMonat(m, mKey) > 0);
  const mieterMitMieteVormonat = mieter.filter((m) => erwarteteMieteFuerMonat(m, prevKey) > 0);
  const mieteOffen = mieterMitMieteMonat.filter((m) => !mietzahlungen.some((z) => z.mieterId === m.id && z.monat === mKey)).length;
  const ueberfaellig = mieterMitMieteVormonat.filter((m) => !mietzahlungen.some((z) => z.mieterId === m.id && z.monat === prevKey)).length;

  // Diagramm-Daten
  const investitionData = objekte
    .map((o) => ({ name: kurzAdresse(o), value: berechneKennzahlen(o).gesamtinvestition }))
    .filter((d) => d.value > 0);
  const vermietungData = [
    { name: "Vermietet", value: p.vermietet, color: "#2563eb" },
    { name: "Frei", value: p.leerstand, color: "#94a3b8" },
  ];
  const mieteData = objekte
    .map((o) => ({ label: kurzAdresse(o), value: berechneKennzahlen(o).monatskaltmiete }))
    .filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Übersicht</h1>
          <p className="text-sm text-muted-foreground">Ihr Immobilien-Portfolio auf einen Blick.</p>
        </div>
        <div className="flex gap-2">
          {isEmpty ? (
            <Button onClick={seedBeispiel} variant="outline">Beispieldaten laden</Button>
          ) : (
            <Button
              onClick={() => {
                if (confirm("Wirklich alle Daten löschen?")) reset();
              }}
              variant="ghost"
              size="sm"
            >
              Alle Daten löschen
            </Button>
          )}
          <ObjektDialog trigger={<Button>Immobilie hinzufügen <ArrowRight className="h-4 w-4" /></Button>} />
        </div>
      </div>

      {isEmpty ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <PackageOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Noch keine Daten</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Legen Sie Ihre erste Immobilie an — oder laden Sie Beispieldaten, um die App auszuprobieren.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={seedBeispiel} variant="outline">Beispieldaten laden</Button>
            <ObjektDialog trigger={<Button>Immobilie hinzufügen</Button>} />
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Immobilien" value={String(p.anzahl)} hint={`${p.vermietet} vermietet · ${p.leerstand} frei`} icon={Building2} />
            <Stat label="Kaltmiete / Monat" value={fmtEUR0(p.monatskaltmiete)} hint={`${fmtEUR0(p.jahreskaltmiete)} / Jahr`} icon={Coins} />
            <Stat label="Cashflow / Monat" value={fmtEUR0(p.cashflowMonat)} tone={p.cashflowMonat >= 0 ? "pos" : "neg"} hint="nach Bankrate & lfd. Kosten" icon={Wallet} />
            <Stat label="Ø Rendite" value={p.bruttorendite != null ? fmtPct(p.bruttorendite) : "—"} hint="Jahreskaltmiete über Kaufpreis" icon={TrendingUp} />
            <Stat label="Offene Kreditsumme" value={fmtEUR0(p.gesamtRestschuld)} hint="Restschuld aller Darlehen" icon={Landmark} />
            <Stat label="Eingesetztes Eigenkapital" value={fmtEUR0(p.gesamtEigenkapital)} icon={PiggyBank} hint="über alle Objekte" />
            <Stat label="Ausgaben / Monat" value={fmtEUR0(p.ausgabenMonat)} tone="neg" hint="Raten + lfd. Kosten" icon={ArrowDownRight} />
            <Stat label="Vermietungsquote" value={p.vermietungsquote != null ? fmtPct(p.vermietungsquote) : "—"} hint={`${offen} offene Mängel`} icon={Percent} />
          </div>

          <Link to="/dashboard/portfolio" className="flex items-center gap-2 rounded-xl border bg-card p-3 text-sm hover:border-foreground/30">
            <span className="font-medium">Vollständige Portfolioübersicht &amp; Vermögensentwicklung</span>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>

          {/* Diagramme */}
          <div className="grid gap-4 lg:grid-cols-3">
            <DonutCard title="Investition nach Objekt" hint="Gesamtinvestition inkl. Kaufnebenkosten" data={investitionData} centerLabel="Gesamt" />
            <DonutCard title="Vermietungsstand" hint="belegte und freie Objekte" data={vermietungData} formatValue={(n) => `${n}`} centerLabel="Objekte" />
            <BarCard title="Kaltmiete je Objekt" hint="monatliche Kaltmiete" data={mieteData} />
          </div>

          <div>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Ihre Objekte</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {objekte.map((o) => {
                const k = berechneKennzahlen(o);
                return (
                  <Link
                    key={o.id}
                    to="/dashboard/objekte/$id"
                    params={{ id: o.id }}
                    className="group flex items-start justify-between rounded-xl border bg-card p-4 hover:border-foreground/30"
                  >
                    <div>
                      <div className="font-medium">{o.adresse}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {OBJEKTTYP_LABEL[o.typ]}
                        {o.gesamtwohnflaeche ? ` · ${o.gesamtwohnflaeche} m²` : ""}
                        {" · "}
                        {o.vermietet ? "vermietet" : "frei"}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs">
                        {k.bruttorendite != null && (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <TrendingUp className="h-3 w-3" /> {fmtPct(k.bruttorendite)} Rendite
                          </span>
                        )}
                        {(k.rateMonat > 0 || k.monatskaltmiete > 0) && (
                          <span className={"inline-flex items-center gap-1 " + (k.cashflowMonat >= 0 ? "text-blue-600" : "text-destructive")}>
                            <Wallet className="h-3 w-3" /> {fmtEUR(k.cashflowMonat)}/Mon.
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </Link>
                );
              })}
            </div>
          </div>

          {ueberfaellig > 0 && (
            <Link to="/dashboard/miete" className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm hover:border-destructive/60">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="font-medium text-destructive">
                {ueberfaellig} überfällige Mietzahlung{ueberfaellig === 1 ? "" : "en"}
              </span>
              <span className="text-muted-foreground">— {monatLabel(prevKey)} noch offen</span>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </Link>
          )}

          {mieterMitMieteMonat.length > 0 && (
            <Link to="/dashboard/miete" className="flex items-center gap-2 rounded-xl border bg-card p-4 text-sm hover:border-foreground/30">
              {mieteOffen > 0 ? (
                <>
                  <Coins className="h-4 w-4 text-amber-600" />
                  <span className="font-medium">{mieteOffen} von {mieterMitMieteMonat.length} Mieten offen</span>
                  <span className="text-muted-foreground">— {monatLabel(mKey)}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Alle Mieten eingegangen</span>
                  <span className="text-muted-foreground">— {monatLabel(mKey)}</span>
                </>
              )}
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </Link>
          )}

          {offen > 0 && (
            <Link to="/dashboard/maengel" className="flex items-center gap-2 rounded-xl border bg-card p-4 text-sm hover:border-foreground/30">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="font-medium">{offen} offene Mängel</span>
              <span className="text-muted-foreground">— zur Mängelliste</span>
              <Wrench className="ml-auto h-4 w-4 text-muted-foreground" />
            </Link>
          )}

          {offeneAufgaben > 0 && (
            <Link to="/dashboard/aufgaben" className="flex items-center gap-2 rounded-xl border bg-card p-4 text-sm hover:border-foreground/30">
              <AlertCircle className={"h-4 w-4 " + (ueberfaelligeAufgaben > 0 ? "text-destructive" : "text-amber-600")} />
              <span className="font-medium">
                {offeneAufgaben} offene Aufgabe{offeneAufgaben === 1 ? "" : "n"}
              </span>
              <span className="text-muted-foreground">
                {ueberfaelligeAufgaben > 0 ? `— ${ueberfaelligeAufgaben} überfällig` : "— Fristen & Wartungen"}
              </span>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </Link>
          )}
        </>
      )}
    </div>
  );
}
