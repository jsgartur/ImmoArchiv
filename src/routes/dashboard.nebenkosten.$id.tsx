import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Printer, Save, Users, ReceiptText, FileDown, RefreshCw } from "lucide-react";
import { erzeugeNkPdf } from "@/lib/nk-pdf";
import {
  useStore,
  fmtEUR,
  fmtDate,
  UMLAGE_LABEL,
  NK_VORLAGEN,
  type NkPartei,
  type NkPosition,
  type Umlageschluessel,
} from "@/lib/store";
import { berechneAbrechnung, gezahlteVorauszahlung } from "@/lib/nebenkosten";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { LadeSkeleton } from "@/components/lade-skeleton";

export const Route = createFileRoute("/dashboard/nebenkosten/$id")({
  component: AbrechnungEditor,
  notFoundComponent: () => <div className="py-20 text-center text-muted-foreground">Abrechnung nicht gefunden.</div>,
});

const uid = () => Math.random().toString(36).slice(2, 10);

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

  const [titel, setTitel] = useState(gespeichert?.titel ?? "");
  const [von, setVon] = useState(gespeichert?.von ?? "");
  const [bis, setBis] = useState(gespeichert?.bis ?? "");
  const [parteien, setParteien] = useState<NkPartei[]>(gespeichert?.parteien ?? []);
  const [positionen, setPositionen] = useState<NkPosition[]>(gespeichert?.positionen ?? []);

  if (!abrechnungenGeladen) {
    return <LadeSkeleton titel="Abrechnung" text="Details werden geladen…" />;
  }
  if (!gespeichert) throw notFound();

  const aktuell = { ...gespeichert, titel, von, bis, parteien, positionen };
  const ergebnis = berechneAbrechnung(aktuell);
  const dirty = JSON.stringify(aktuell) !== JSON.stringify(gespeichert);

  const speichern = () => {
    updateAbrechnung(id, { titel, von, bis, parteien, positionen });
    toast.success("Abrechnung gespeichert");
  };

  // Parteien
  const addPartei = () =>
    setParteien((p) => [...p, { id: uid(), name: "Neue Partei", wohnflaeche: 0, personen: 1, nkVorausMonat: 0 }]);
  const setPartei = (pid: string, patch: Partial<NkPartei>) =>
    setParteien((list) => list.map((p) => (p.id === pid ? { ...p, ...patch } : p)));
  const removePartei = (pid: string) => setParteien((list) => list.filter((p) => p.id !== pid));

  const einheitLabel = (einheitId?: string) => (einheitId ? einheiten.find((e) => e.id === einheitId)?.bezeichnung : undefined);

  /** Übernimmt Name/Wohnfläche/NK-Vorauszahlung/Einzug/Auszug erneut aus dem aktuellen Mieter-Datensatz
   *  (die Partei ist beim Anlegen der Abrechnung nur eine Momentaufnahme – falls sich der Mieter seither
   *  geändert hat, sind Alt-Werte hier sonst dauerhaft eingefroren). */
  const syncPartei = (pid: string) => {
    const p = parteien.find((x) => x.id === pid);
    if (!p?.einheitId) return;
    const e = einheiten.find((x) => x.id === p.einheitId);
    const m = alleMieter.find((x) => x.einheitId === p.einheitId && !x.mietende);
    if (!e || !m) {
      toast.error("Kein aktueller Mieter für diese Einheit gefunden.");
      return;
    }
    setPartei(pid, {
      name: m.name,
      wohnflaeche: e.wohnflaeche || 0,
      nkVorausMonat: m.nebenkosten || 0,
      einzug: m.mietbeginn || undefined,
      auszug: undefined,
    });
    toast.success("Partei mit aktuellen Mieterdaten aktualisiert");
  };

  const parteienSortiert = [...parteien].sort((a, b) =>
    (einheitLabel(a.einheitId) ?? a.name).localeCompare(einheitLabel(b.einheitId) ?? b.name),
  );

  // Positionen
  const addPosition = (bezeichnung = "", schluessel: Umlageschluessel = "wohnflaeche") =>
    setPositionen((p) => [...p, { id: uid(), bezeichnung, betrag: 0, schluessel }]);
  const setPosition = (pid: string, patch: Partial<NkPosition>) =>
    setPositionen((list) => list.map((p) => (p.id === pid ? { ...p, ...patch } : p)));
  const removePosition = (pid: string) => setPositionen((list) => list.filter((p) => p.id !== pid));

  return (
    <div className="space-y-6">
      {/* Kopf */}
      <div className="no-print">
        <Link to="/dashboard/nebenkosten" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Alle Abrechnungen
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{titel || "Nebenkostenabrechnung"}</h1>
            <p className="text-sm text-muted-foreground">{objekt?.adresse ?? "Objekt gelöscht"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => erzeugeNkPdf(aktuell, objekt, profil)}>
              <FileDown className="h-4 w-4" /> PDF
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
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

      {/* Zeitraum */}
      <div className="no-print rounded-2xl border bg-card p-5">
        <div className="mb-4 text-sm font-medium">Abrechnungszeitraum</div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label className="text-xs">Titel</Label>
            <Input value={titel} onChange={(e) => setTitel(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Von</Label>
            <Input type="date" value={von.slice(0, 10)} onChange={(e) => setVon(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Bis</Label>
            <Input type="date" value={bis.slice(0, 10)} onChange={(e) => setBis(e.target.value)} />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{ergebnis.monate} Monate im Abrechnungszeitraum.</p>
        {objekt?.kaufdatum && objekt.kaufdatum.slice(0, 10) > bis.slice(0, 10) && (
          <p className="mt-2 rounded-md bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
            Achtung: Das Objekt wurde erst am {fmtDate(objekt.kaufdatum)} gekauft — also nach diesem Abrechnungszeitraum.
            Für diesen Zeitraum sind keine Nebenkosten angefallen.
          </p>
        )}
        {objekt?.kaufdatum &&
          objekt.kaufdatum.slice(0, 10) > von.slice(0, 10) &&
          objekt.kaufdatum.slice(0, 10) <= bis.slice(0, 10) && (
            <p className="mt-2 rounded-md bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
              Hinweis: Kauf am {fmtDate(objekt.kaufdatum)} — Vorauszahlungen werden erst ab dem Kaufdatum anteilig
              angesetzt.
            </p>
          )}
      </div>

      {/* Parteien */}
      <div className="no-print rounded-2xl border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" /> Mietparteien
          </div>
          <Button size="sm" variant="outline" onClick={addPartei}>
            <Plus className="h-4 w-4" /> Partei
          </Button>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Tragen Sie die <strong>monatliche NK-Vorauszahlung</strong> ein sowie – falls der Mieter nicht den ganzen
          Zeitraum wohnte – <strong>Einzug/Auszug</strong>. Die gezahlte Vorauszahlung wird daraus anteilig berechnet
          (Einzug am 15. → halber Monat). Das hat nichts mit der Kaution zu tun.
        </p>

        <div className="space-y-3">
          {parteienSortiert.map((p) => {
            const vz = gezahlteVorauszahlung(aktuell, p);
            const etikett = einheitLabel(p.einheitId);
            return (
              <div key={p.id} className="rounded-xl border bg-background p-3">
                {etikett && <div className="mb-2 text-[11px] font-medium text-muted-foreground">{etikett}</div>}
                <div className="grid gap-2 sm:grid-cols-[1fr_90px_80px_36px_36px]">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Name</Label>
                    <Input value={p.name} onChange={(e) => setPartei(p.id, { name: e.target.value })} placeholder="Name" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Wohnfl. m²</Label>
                    <Input type="number" value={p.wohnflaeche || ""} onChange={(e) => setPartei(p.id, { wohnflaeche: +e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Personen</Label>
                    <Input type="number" value={p.personen || ""} onChange={(e) => setPartei(p.id, { personen: +e.target.value })} />
                  </div>
                  <div className="flex items-end">
                    {p.einheitId && (
                      <Button variant="ghost" size="icon" onClick={() => syncPartei(p.id)} aria-label="Mit aktuellem Mieter abgleichen" title="Mit aktuellem Mieter abgleichen">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-end">
                    <Button variant="ghost" size="icon" onClick={() => removePartei(p.id)} aria-label="Partei entfernen">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">NK-Vorauszahlung / Monat €</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={p.nkVorausMonat ?? ""}
                      onChange={(e) => setPartei(p.id, { nkVorausMonat: e.target.value === "" ? undefined : +e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Einzug (optional)</Label>
                    <Input
                      type="date"
                      value={p.einzug?.slice(0, 10) ?? ""}
                      onChange={(e) => setPartei(p.id, { einzug: e.target.value || undefined })}
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Auszug (optional)</Label>
                    <Input
                      type="date"
                      value={p.auszug?.slice(0, 10) ?? ""}
                      onChange={(e) => setPartei(p.id, { auszug: e.target.value || undefined })}
                    />
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between rounded-md bg-secondary/50 px-3 py-1.5 text-xs">
                  <span className="text-muted-foreground">
                    Gezahlte Vorauszahlung: {vz.monate.toLocaleString("de-DE")} Mon. × {fmtEUR(vz.monatlich)}
                  </span>
                  <span className="font-medium tabular-nums">{fmtEUR(vz.gesamt)}</span>
                </div>
              </div>
            );
          })}
          {parteien.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Parteien.</p>}
        </div>
      </div>

      {/* Positionen */}
      <div className="no-print rounded-2xl border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ReceiptText className="h-4 w-4" /> Kostenpositionen
          </div>
          <div className="flex gap-2">
            <Select
              onValueChange={(v) => {
                const vorlage = NK_VORLAGEN.find((x) => x.bezeichnung === v);
                if (vorlage) addPosition(vorlage.bezeichnung, vorlage.schluessel);
              }}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Typische Position hinzufügen …" />
              </SelectTrigger>
              <SelectContent>
                {NK_VORLAGEN.map((v) => (
                  <SelectItem key={v.bezeichnung} value={v.bezeichnung}>
                    {v.bezeichnung}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => addPosition()}>
              <Plus className="h-4 w-4" /> Frei
            </Button>
          </div>
        </div>

        <div className="hidden gap-2 px-1 pb-2 text-[11px] text-muted-foreground sm:grid sm:grid-cols-[1fr_120px_180px_36px]">
          <span>Bezeichnung</span>
          <span>Betrag €</span>
          <span>Umlage nach</span>
          <span />
        </div>
        <div className="space-y-2">
          {positionen.map((pos) => (
            <div key={pos.id} className="grid gap-2 sm:grid-cols-[1fr_120px_180px_36px]">
              <Input value={pos.bezeichnung} onChange={(e) => setPosition(pos.id, { bezeichnung: e.target.value })} placeholder="z. B. Grundsteuer" />
              <Input type="number" step="0.01" value={pos.betrag || ""} onChange={(e) => setPosition(pos.id, { betrag: +e.target.value })} />
              <Select value={pos.schluessel} onValueChange={(v) => setPosition(pos.id, { schluessel: v as Umlageschluessel })}>
                <SelectTrigger>
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
              <Button variant="ghost" size="icon" onClick={() => removePosition(pos.id)} aria-label="Position entfernen">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {positionen.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Noch keine Positionen. Über „Typische Position hinzufügen" starten Sie mit den üblichen Betriebskosten.
            </p>
          )}
        </div>
        <div className="mt-4 flex justify-between border-t pt-3 text-sm">
          <span className="text-muted-foreground">Summe aller Positionen</span>
          <span className="font-medium tabular-nums">{fmtEUR(ergebnis.gesamtKosten)}</span>
        </div>
      </div>

      {/* Ergebnis (druckbar) */}
      <div className="nk-print rounded-2xl border bg-card p-6">
        <div className="mb-6 border-b pb-4">
          <div className="text-xs text-muted-foreground">
            {[profil.vorname, profil.nachname].filter(Boolean).join(" ") || "Vermieter/in"}
            {profil.strasse ? ` · ${profil.strasse}` : ""}
            {profil.plz || profil.ort ? ` · ${profil.plz} ${profil.ort}` : ""}
          </div>
          <h2 className="mt-2 text-xl font-semibold">{titel || "Nebenkostenabrechnung"}</h2>
          <p className="text-sm text-muted-foreground">
            {objekt?.adresse} · Zeitraum {fmtDate(von)} – {fmtDate(bis)}
          </p>
        </div>

        {ergebnis.parteien.length === 0 ? (
          <p className="text-sm text-muted-foreground">Fügen Sie Parteien und Positionen hinzu, um das Ergebnis zu sehen.</p>
        ) : (
          <div className="space-y-6">
            {[...ergebnis.parteien]
              .sort((a, b) => (einheitLabel(a.partei.einheitId) ?? a.partei.name).localeCompare(einheitLabel(b.partei.einheitId) ?? b.partei.name))
              .map((pe) => (
              <div key={pe.partei.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{pe.partei.name}</div>
                    {einheitLabel(pe.partei.einheitId) && (
                      <div className="text-xs text-muted-foreground">{einheitLabel(pe.partei.einheitId)}</div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {pe.partei.wohnflaeche} m² · {pe.partei.personen} Pers.
                  </div>
                </div>

                <table className="mt-3 w-full text-sm">
                  <tbody>
                    {pe.anteile.map((an) => (
                      <tr key={an.positionId} className="border-b last:border-none">
                        <td className="py-1.5 text-muted-foreground">
                          {an.bezeichnung || "—"}
                          <span className="ml-1 text-[11px]">({UMLAGE_LABEL[an.schluessel]})</span>
                        </td>
                        <td className="py-1.5 text-right text-xs text-muted-foreground tabular-nums">
                          von {fmtEUR(an.gesamt)}
                        </td>
                        <td className="w-28 py-1.5 text-right font-medium tabular-nums">{fmtEUR(an.anteil)}</td>
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
                          ({pe.monateAnteilig.toLocaleString("de-DE")} Mon. × {fmtEUR(pe.nkVorausMonat)})
                        </span>
                      )}
                    </span>
                    <span className="tabular-nums">− {fmtEUR(pe.vorauszahlung)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1.5 text-base font-semibold">
                    <span>{pe.saldo >= 0 ? "Guthaben" : "Nachzahlung"}</span>
                    <span className={"tabular-nums " + (pe.saldo >= 0 ? "text-blue-600" : "text-destructive")}>
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
                <span className={"tabular-nums " + (ergebnis.gesamtSaldo >= 0 ? "text-blue-600" : "text-destructive")}>
                  {ergebnis.gesamtSaldo >= 0 ? "Guthaben " : "Nachzahlung "}
                  {fmtEUR(Math.abs(ergebnis.gesamtSaldo))}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Hinweis: Nur tatsächlich umlagefähige Betriebskosten (§ 2 BetrKV) dürfen umgelegt werden. Diese
              Abrechnung ist eine Rechenhilfe und ersetzt keine rechtliche Prüfung.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
