import { createFileRoute, Link } from "@tanstack/react-router";
import { Landmark, TrendingDown, CalendarCheck, Percent, ArrowRight, PartyPopper } from "lucide-react";
import { useStore, fmtEUR, fmtEUR0, monatLabel } from "@/lib/store";
import { berechneTilgung } from "@/lib/immobilienrechner";
import { DonutCard, AreaCard } from "@/components/charts";
import { PageTabs, PORTFOLIO_TABS } from "@/components/page-tabs";

export const Route = createFileRoute("/dashboard/finanzierung")({
  component: Finanzierung,
});

const jahreMonate = (m: number) => `${Math.floor(m / 12)} J. ${m % 12} Mon.`;

function Stat({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Landmark;
  tone?: "pos" | "neg";
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {label}
        <Icon className="h-4 w-4" />
      </div>
      <div
        className={
          "mt-2 text-2xl font-semibold tracking-tight tabular-nums md:text-3xl " +
          (tone === "pos" ? "text-blue-600" : tone === "neg" ? "text-destructive" : "")
        }
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Finanzierung() {
  const objekte = useStore((s) => s.objekte);

  const finanziert = objekte
    .map((o) => ({ o, t: berechneTilgung(o) }))
    .filter((x) => x.t.gueltig && x.t.darlehen > 0);

  const gesamtDarlehen = finanziert.reduce((s, x) => s + x.t.darlehen, 0);
  const gesamtRest = finanziert.reduce((s, x) => s + x.t.restschuld, 0);
  const gesamtGetilgt = finanziert.reduce((s, x) => s + x.t.bereitsGetilgt, 0);
  const gesamtZinsen = finanziert.reduce((s, x) => s + x.t.zinsenBezahlt, 0);
  const gesamtRate = finanziert.reduce((s, x) => s + (x.o.monatlicheRate ?? 0), 0);
  const getilgtProzent = gesamtDarlehen > 0 ? (gesamtGetilgt / gesamtDarlehen) * 100 : 0;

  const laufzeiten = finanziert.map((x) => x.t.restlaufzeitMonate);
  const einNieGetilgt = laufzeiten.some((m) => m == null);
  const maxMonate = laufzeiten.reduce<number>((mx, m) => (m != null ? Math.max(mx, m) : mx), 0);

  // spätestes voraussichtliches Abzahl-Datum ("komplett schuldenfrei")
  const schuldenfreiKey = finanziert
    .map((x) => x.t.abbezahltVoraussichtlich)
    .filter((k): k is string => !!k)
    .sort()
    .pop();

  // Prognose: Gesamt-Restschuld jeweils zum gleichen Monat in y Jahren
  const jahre = Math.min(45, Math.ceil(maxMonate / 12));
  const heute = new Date();
  const prognose = Array.from({ length: jahre + 1 }, (_, y) => {
    const stichtag = new Date(heute.getFullYear() + y, heute.getMonth(), 1);
    const rest = finanziert.reduce((s, x) => s + berechneTilgung(x.o, stichtag).restschuld, 0);
    return { jahr: heute.getFullYear() + y, rest };
  });

  if (finanziert.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Restschuld & Finanzierung</h1>
          <p className="text-sm text-muted-foreground">Gesamte Restschuld und Tilgungsprognose Ihrer Objekte.</p>
        </div>
        <PageTabs tabs={PORTFOLIO_TABS} />
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <Landmark className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Noch keine finanzierten Objekte. Hinterlegen Sie bei einem Objekt Darlehen, Zinssatz, Bankrate und
            Finanzierungsbeginn.
          </p>
          <Link to="/dashboard/objekte" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
            Zu den Objekten <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Restschuld & Finanzierung</h1>
        <p className="text-sm text-muted-foreground">
          Gesamte Restschuld über {finanziert.length} finanzierte{finanziert.length === 1 ? "s" : ""} Objekt
          {finanziert.length === 1 ? "" : "e"} und Tilgungsprognose.
        </p>
      </div>
      <PageTabs tabs={PORTFOLIO_TABS} />

      {/* Kennzahlen */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Gesamte Restschuld" value={fmtEUR0(gesamtRest)} hint={`von ${fmtEUR0(gesamtDarlehen)} Darlehen`} icon={TrendingDown} />
        <Stat label="Bereits getilgt" value={fmtEUR0(gesamtGetilgt)} tone="pos" hint={`${getilgtProzent.toFixed(1)} % des Darlehens`} icon={Percent} />
        <Stat label="Rate / Monat gesamt" value={fmtEUR0(gesamtRate)} hint={`gezahlte Zinsen bisher: ${fmtEUR0(gesamtZinsen)}`} icon={Landmark} />
        <Stat
          label="Voraussichtlich schuldenfrei"
          value={einNieGetilgt ? "offen" : schuldenfreiKey ? monatLabel(schuldenfreiKey) : "—"}
          tone={einNieGetilgt ? "neg" : "pos"}
          hint={einNieGetilgt ? "ein Darlehen wird so nicht getilgt" : maxMonate ? `in ca. ${jahreMonate(maxMonate)}` : undefined}
          icon={CalendarCheck}
        />
      </div>

      {/* Donut + Prognose-Flächendiagramm */}
      <div className="grid gap-4 lg:grid-cols-3">
        <DonutCard
          title="Darlehen: getilgt vs. offen"
          hint={`${getilgtProzent.toFixed(1)} % bereits getilgt`}
          data={[
            { name: "Getilgt", value: gesamtGetilgt, color: "#2563eb" },
            { name: "Restschuld", value: gesamtRest, color: "#3b82f6" },
          ]}
          centerLabel="Darlehen"
          centerValue={fmtEUR0(gesamtDarlehen)}
        />
        <div className="lg:col-span-2">
          <AreaCard
            title="Prognose: Restschuld über die Jahre"
            hint="bei gleichbleibenden Raten"
            data={prognose.map((p) => ({ label: String(p.jahr), value: Math.max(0, p.rest) }))}
            color="#3b82f6"
            height={300}
          />
          {!einNieGetilgt && schuldenfreiKey && (
            <p className="mt-3 flex items-center gap-2 rounded-md bg-blue-500/10 p-3 text-xs text-blue-700">
              <PartyPopper className="h-4 w-4 shrink-0" /> Bei gleichbleibenden Raten sind Sie voraussichtlich{" "}
              {monatLabel(schuldenfreiKey)} vollständig schuldenfrei.
            </p>
          )}
        </div>
      </div>

      {/* Pro Objekt */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Nach Objekt</h2>
        <div className="divide-y rounded-2xl border bg-card">
          {finanziert.map(({ o, t }) => {
            const pct = t.darlehen > 0 ? (t.bereitsGetilgt / t.darlehen) * 100 : 0;
            return (
              <Link
                key={o.id}
                to="/dashboard/objekte/$id"
                params={{ id: o.id }}
                className="block p-4 transition hover:bg-accent/50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">{o.adresse}</div>
                  <div className="text-sm tabular-nums">
                    <span className="font-medium">{fmtEUR(t.restschuld)}</span>
                    <span className="text-muted-foreground"> offen</span>
                  </div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>{pct.toFixed(0)} % getilgt · Rate {fmtEUR(o.monatlicheRate ?? 0)}/Mon.</span>
                  <span>
                    {t.restlaufzeitMonate == null
                      ? "wird so nicht getilgt"
                      : t.abbezahltVoraussichtlich
                        ? `fertig ~ ${monatLabel(t.abbezahltVoraussichtlich)}`
                        : `noch ${jahreMonate(t.restlaufzeitMonate)}`}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Vereinfachte Berechnung als Annuitätendarlehen (konstante Rate, monatliche Verzinsung). Sondertilgungen,
        Zinsbindungsende und Gebühren sind nicht berücksichtigt.
      </p>
    </div>
  );
}
