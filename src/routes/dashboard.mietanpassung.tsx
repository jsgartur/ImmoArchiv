import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Copy, Printer, Info } from "lucide-react";
import { useStore } from "@/lib/store";
import { berechneMietanpassung, anschreibenText } from "@/lib/mietrechner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ProGate } from "@/components/pro-gate";
import { istPro } from "@/lib/plaene";

export const Route = createFileRoute("/dashboard/mietanpassung")({
  component: Mietanpassung,
});

function Mietanpassung() {
  const einheiten = useStore((s) => s.einheiten);
  const mieter = useStore((s) => s.mieter);
  const objekte = useStore((s) => s.objekte);
  const plan = useStore((s) => s.profil.plan);

  const [einheitId, setEinheitId] = useState<string>("");
  const [aktuelleKaltmiete, setAktuell] = useState<number>(0);
  const [wohnflaeche, setWohnflaeche] = useState<number>(0);
  const [vergleichsmieteProQm, setVergleich] = useState<number>(0);
  const [datumLetzteErhoehung, setDatum] = useState<string>("");
  const [angespannt, setAngespannt] = useState(false);
  const [plz, setPlz] = useState("");
  const [wirksamAb, setWirksamAb] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3, 1);
    return d.toISOString().slice(0, 10);
  });

  const applyEinheit = (id: string) => {
    setEinheitId(id);
    const e = einheiten.find((x) => x.id === id);
    if (!e) return;
    setWohnflaeche(e.wohnflaeche);
    const m = mieter.find((x) => x.einheitId === id && !x.mietende);
    if (m) {
      setAktuell(m.kaltmiete);
      setDatum(m.mietbeginn.slice(0, 10));
    }
  };

  const kannBerechnen = aktuelleKaltmiete > 0 && wohnflaeche > 0 && vergleichsmieteProQm > 0 && datumLetzteErhoehung;
  const ergebnis = useMemo(() => {
    if (!kannBerechnen) return null;
    return berechneMietanpassung({
      aktuelleKaltmiete, wohnflaeche, vergleichsmieteProQm, datumLetzteErhoehung, angespannterMarkt: angespannt, plz,
    });
  }, [aktuelleKaltmiete, wohnflaeche, vergleichsmieteProQm, datumLetzteErhoehung, angespannt, plz, kannBerechnen]);

  const einheit = einheiten.find((e) => e.id === einheitId);
  const objekt = objekte.find((o) => o.id === einheit?.objektId);
  const aktMieter = mieter.find((m) => m.einheitId === einheitId && !m.mietende);

  const brief = ergebnis
    ? anschreibenText({
        mieterName: aktMieter?.name ?? "",
        adresse: `${objekt?.adresse ?? ""}${einheit ? ` (${einheit.bezeichnung})` : ""}`,
        aktuelleKaltmiete,
        neueMiete: ergebnis.neueMiete,
        wirksamAb,
        vergleichsmieteProQm,
        wohnflaeche,
      })
    : "";

  if (!istPro(plan)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Mietanpassungs-Rechner</h1>
          <p className="text-sm text-muted-foreground">
            Berechnung nach § 558 BGB — nachvollziehbar Schritt für Schritt.
          </p>
        </div>
        <ProGate feature="Der Mietanpassungs-Rechner">{null}</ProGate>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Mietanpassungs-Rechner</h1>
        <p className="text-sm text-muted-foreground">
          Berechnung nach § 558 BGB — nachvollziehbar Schritt für Schritt.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <div className="text-sm font-medium">Eingabe</div>

          {einheiten.length > 0 && (
            <div>
              <Label>Einheit übernehmen (optional)</Label>
              <Select value={einheitId} onValueChange={applyEinheit}>
                <SelectTrigger><SelectValue placeholder="Aus vorhandenen Einheiten wählen" /></SelectTrigger>
                <SelectContent>
                  {einheiten.map((e) => {
                    const o = objekte.find((x) => x.id === e.objektId);
                    return (
                      <SelectItem key={e.id} value={e.id}>
                        {o?.adresse.split(",")[0]} · {e.bezeichnung}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Aktuelle Kaltmiete (€)</Label>
              <Input type="number" step="0.01" value={aktuelleKaltmiete || ""} onChange={(e) => setAktuell(+e.target.value)} />
            </div>
            <div>
              <Label>Wohnfläche (m²)</Label>
              <Input type="number" step="0.01" value={wohnflaeche || ""} onChange={(e) => setWohnflaeche(+e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ortsübliche Vergleichsmiete (€/m²)</Label>
              <Input type="number" step="0.01" value={vergleichsmieteProQm || ""} onChange={(e) => setVergleich(+e.target.value)} />
              <p className="mt-1 text-[11px] text-muted-foreground">Aus dem Mietspiegel Ihrer Stadt.</p>
            </div>
            <div>
              <Label>PLZ / Ort</Label>
              <Input placeholder="34302" value={plz} onChange={(e) => setPlz(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Datum der letzten Mieterhöhung (bzw. Mietbeginn)</Label>
            <Input type="date" value={datumLetzteErhoehung} onChange={(e) => setDatum(e.target.value)} />
          </div>

          <div className="flex items-start justify-between rounded-lg border bg-background p-3">
            <div className="pr-4">
              <div className="text-sm font-medium">Angespannter Wohnungsmarkt</div>
              <p className="text-xs text-muted-foreground">
                In per Landesverordnung ausgewiesenen Gebieten gilt eine Kappungsgrenze von 15 % statt 20 %.
              </p>
            </div>
            <Switch checked={angespannt} onCheckedChange={setAngespannt} />
          </div>

          <div>
            <Label>Wirksam ab</Label>
            <Input type="date" value={wirksamAb} onChange={(e) => setWirksamAb(e.target.value)} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            <div className="mb-3 text-sm font-medium">Berechnung</div>
            {!ergebnis ? (
              <p className="text-sm text-muted-foreground">
                Bitte alle Pflichtfelder ausfüllen (Kaltmiete, Wohnfläche, Vergleichsmiete, Datum letzte Erhöhung).
              </p>
            ) : (
              <>
                <ol className="space-y-2">
                  {ergebnis.schritte.map((s, i) => (
                    <li key={i} className="flex items-start justify-between gap-4 border-b pb-2 text-sm last:border-none">
                      <div className="text-muted-foreground">{i + 1}. {s.label}</div>
                      <div className="text-right font-medium tabular-nums">{s.wert}</div>
                    </li>
                  ))}
                </ol>

                <div className="mt-4 rounded-lg bg-secondary p-4">
                  <div className="text-xs text-muted-foreground">Neue Kaltmiete</div>
                  <div className="mt-1 text-2xl font-semibold tabular-nums">
                    {ergebnis.neueMiete.toFixed(2)} €
                    <span className={`ml-2 text-sm ${ergebnis.erhoehungAbsolut > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      +{ergebnis.erhoehungAbsolut.toFixed(2)} € · +{ergebnis.erhoehungProzent.toFixed(2)} %
                    </span>
                  </div>
                </div>

                {ergebnis.hinweise.map((h, i) => (
                  <div key={i} className="mt-3 flex gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                    <Info className="h-4 w-4 shrink-0" /> {h}
                  </div>
                ))}
              </>
            )}
          </div>

          {ergebnis && ergebnis.erhoehungAbsolut > 0 && (
            <div className="rounded-2xl border bg-card p-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium">Anschreiben an den Mieter</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    navigator.clipboard.writeText(brief);
                    toast.success("Text in Zwischenablage kopiert");
                  }}>
                    <Copy className="h-4 w-4" /> Kopieren
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.print()}>
                    <Printer className="h-4 w-4" /> Drucken
                  </Button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap rounded-lg border bg-background p-3 font-sans text-sm leading-relaxed">
                {brief}
              </pre>
            </div>
          )}

          <div className="rounded-2xl border border-border/60 bg-card/50 p-4 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">Rechtliche Grundlage</div>
            <p className="mt-1">
              Mieterhöhung bis zur ortsüblichen Vergleichsmiete nach § 558 BGB. Die Miete darf sich innerhalb von
              drei Jahren um höchstens 20 % (in Gebieten mit angespanntem Wohnungsmarkt: 15 %) erhöhen
              (Kappungsgrenze, § 558 Abs. 3 BGB). Frühestens 15 Monate nach der letzten Erhöhung wirksam.
            </p>
            <p className="mt-2">
              <strong>Kein Rechtsberatungsersatz:</strong> Im Zweifel Mieterverein oder Anwalt konsultieren.
              Der Mietspiegelwert muss selbst recherchiert werden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
