import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Wallet,
  TrendingUp,
  Landmark,
  Home,
  PiggyBank,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  PackageOpen,
} from "lucide-react";
import { useStore, fmtEUR, fmtEUR0, fmtPct } from "@/lib/store";
import { berechneKennzahlen, berechneTilgung, portfolioKennzahlen } from "@/lib/immobilienrechner";
import { DonutCard, AreaCard, BarCard } from "@/components/charts";
import { PageTabs, PORTFOLIO_TABS } from "@/components/page-tabs";
import { ProGate } from "@/components/pro-gate";
import { istPro } from "@/lib/plaene";

export const Route = createFileRoute("/dashboard/portfolio")({
  component: Portfolio,
});

const kurz = (o: { strasse?: string; adresse: string }) => o.strasse?.trim() || o.adresse.split(",")[0];

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
  icon: typeof Wallet;
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
          "mt-2 text-2xl font-semibold tracking-tight tabular-nums md:text-[1.75rem] " +
          (tone === "pos" ? "text-blue-600" : tone === "neg" ? "text-destructive" : "")
        }
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Portfolio() {
  const objekte = useStore((s) => s.objekte);
  const plan = useStore((s) => s.profil.plan);
  const p = portfolioKennzahlen(objekte);

  if (!istPro(plan)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Portfolioübersicht</h1>
          <p className="text-sm text-muted-foreground">Ihr gesamtes Immobilienvermögen auf einen Blick.</p>
        </div>
        <PageTabs tabs={PORTFOLIO_TABS} />
        <ProGate feature="Portfolio-Auswertungen">{null}</ProGate>
      </div>
    );
  }

  if (objekte.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Portfolioübersicht</h1>
          <p className="text-sm text-muted-foreground">Ihr gesamtes Immobilienvermögen auf einen Blick.</p>
        </div>
        <PageTabs tabs={PORTFOLIO_TABS} />
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <PackageOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Noch keine Objekte im Portfolio.</p>
          <Link to="/dashboard/objekte" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
            Zu den Objekten <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Vermögensentwicklung: Marktwert konstant, Restschuld sinkt → Eigenkapital wächst
  const maxMonate = objekte.reduce((mx, o) => {
    const t = berechneTilgung(o);
    return t.restlaufzeitMonate != null ? Math.max(mx, t.restlaufzeitMonate) : mx;
  }, 0);
  const jahre = Math.min(30, Math.max(5, Math.ceil(maxMonate / 12)));
  const heute = new Date();
  const vermoegen = Array.from({ length: jahre + 1 }, (_, y) => {
    const stichtag = new Date(heute.getFullYear() + y, heute.getMonth(), 1);
    const rest = objekte.reduce((s, o) => s + berechneTilgung(o, stichtag).restschuld, 0);
    return { label: String(heute.getFullYear() + y), value: Math.max(0, p.gesamtMarktwert - rest) };
  });

  const investitionData = objekte
    .map((o) => ({ name: kurz(o), value: berechneKennzahlen(o).marktwert }))
    .filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Portfolioübersicht</h1>
        <p className="text-sm text-muted-foreground">
          Ihr gesamtes Immobilienvermögen aus {p.anzahl} Objekt{p.anzahl === 1 ? "" : "en"} auf einen Blick.
        </p>
      </div>
      <PageTabs tabs={PORTFOLIO_TABS} />

      {/* Kennzahlen */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Gesamtwert (Marktwert)" value={fmtEUR0(p.gesamtMarktwert)} hint={`Kaufpreis: ${fmtEUR0(p.gesamtinvestition)}`} icon={Home} />
        <Stat label="Gesamte Restschuld" value={fmtEUR0(p.gesamtRestschuld)} icon={Landmark} hint="alle Darlehen heute" />
        <Stat label="Eingesetztes Eigenkapital" value={fmtEUR0(p.gesamtEigenkapital)} icon={PiggyBank} hint="über alle Objekte" />
        <Stat
          label="Gesamt-Cashflow / Monat"
          value={fmtEUR0(p.cashflowMonat)}
          tone={p.cashflowMonat >= 0 ? "pos" : "neg"}
          hint={`${fmtEUR0(p.cashflowMonat * 12)} / Jahr`}
          icon={Wallet}
        />
        <Stat label="Ø Rendite" value={p.bruttorendite != null ? fmtPct(p.bruttorendite) : "—"} icon={TrendingUp} hint="Jahreskaltmiete über Kaufpreis" />
        <Stat label="Vermietungsquote" value={p.vermietungsquote != null ? fmtPct(p.vermietungsquote) : "—"} icon={Percent} hint={`${p.vermietet}/${p.anzahl} vermietet`} />
        <Stat label="Einnahmen / Monat" value={fmtEUR0(p.monatskaltmiete)} icon={ArrowUpRight} tone="pos" hint="Kaltmiete gesamt" />
        <Stat label="Ausgaben / Monat" value={fmtEUR0(p.ausgabenMonat)} icon={ArrowDownRight} tone="neg" hint="Raten + lfd. Kosten" />
      </div>

      {/* Diagramme */}
      <div className="grid gap-4 lg:grid-cols-3">
        <DonutCard
          title="Vermögensaufteilung"
          hint="Eigenkapital und Restschuld am Marktwert"
          data={[
            { name: "Eigenkapital", value: Math.max(0, p.eigenkapitalAktuell), color: "#2563eb" },
            { name: "Restschuld", value: p.gesamtRestschuld, color: "#3b82f6" },
          ]}
          centerLabel="Marktwert"
          centerValue={fmtEUR0(p.gesamtMarktwert)}
        />
        <BarCard
          title="Einnahmen vs. Ausgaben"
          hint="pro Monat"
          data={[
            { label: "Einnahmen", value: p.monatskaltmiete },
            { label: "Ausgaben", value: p.ausgabenMonat },
            { label: "Cashflow", value: p.cashflowMonat },
          ]}
        />
        <DonutCard title="Marktwert nach Objekt" hint="Verteilung des Portfolios" data={investitionData} centerLabel="Gesamt" />
      </div>

      <AreaCard
        title="Vermögensentwicklung (Prognose)"
        hint="Eigenkapital-Aufbau bei gleichbleibendem Wert und laufender Tilgung"
        data={vermoegen}
        color="#2563eb"
        height={280}
      />

      {/* Nach Objekt */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Nach Objekt</h2>
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="p-3 text-left font-medium">Objekt</th>
                <th className="p-3 text-right font-medium">Marktwert</th>
                <th className="p-3 text-right font-medium">Restschuld</th>
                <th className="p-3 text-right font-medium">Eigenkapital</th>
                <th className="p-3 text-right font-medium">Cashflow/M.</th>
                <th className="p-3 text-right font-medium">Rendite</th>
                <th className="p-3 text-right font-medium">LTV</th>
              </tr>
            </thead>
            <tbody>
              {objekte.map((o) => {
                const k = berechneKennzahlen(o);
                const t = berechneTilgung(o);
                const ek = k.marktwert - t.restschuld;
                return (
                  <tr key={o.id} className="border-b last:border-none hover:bg-accent/40">
                    <td className="p-3">
                      <Link to="/dashboard/objekte/$id" params={{ id: o.id }} className="font-medium hover:underline">
                        {kurz(o)}
                      </Link>
                    </td>
                    <td className="p-3 text-right tabular-nums">{fmtEUR0(k.marktwert)}</td>
                    <td className="p-3 text-right tabular-nums">{t.gueltig ? fmtEUR0(t.restschuld) : "—"}</td>
                    <td className="p-3 text-right tabular-nums">{fmtEUR0(ek)}</td>
                    <td className={"p-3 text-right tabular-nums " + (k.cashflowMonat >= 0 ? "text-blue-600" : "text-destructive")}>
                      {fmtEUR0(k.cashflowMonat)}
                    </td>
                    <td className="p-3 text-right tabular-nums">{k.bruttorendite != null ? fmtPct(k.bruttorendite) : "—"}</td>
                    <td className="p-3 text-right tabular-nums">{k.ltv != null ? fmtPct(k.ltv) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Der Marktwert ist Ihre eigene Schätzung (im Objekt hinterlegbar); ohne Angabe wird der Kaufpreis verwendet.
        Die Vermögensprognose nimmt einen gleichbleibenden Wert an und berücksichtigt keine Wertsteigerung.
      </p>
    </div>
  );
}
