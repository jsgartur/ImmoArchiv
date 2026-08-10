import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, FileSpreadsheet, ArrowRight, Trash2 } from "lucide-react";
import { useStore, fmtEUR, fmtDate, type NkPartei } from "@/lib/store";
import { berechneAbrechnung } from "@/lib/nebenkosten";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LadeSkeleton } from "@/components/lade-skeleton";

export const Route = createFileRoute("/dashboard/nebenkosten/")({
  component: NebenkostenListe,
});

const uid = () => Math.random().toString(36).slice(2, 10);

function NeueAbrechnungDialog() {
  const objekte = useStore((s) => s.objekte);
  const einheiten = useStore((s) => s.einheiten);
  const mieter = useStore((s) => s.mieter);
  const addAbrechnung = useStore((s) => s.addAbrechnung);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [objektId, setObjektId] = useState<string>("");
  const [jahr, setJahr] = useState<number>(new Date().getFullYear() - 1);

  const anlegen = () => {
    const objekt = objekte.find((o) => o.id === objektId);
    if (!objekt) return;

    // Parteien aus Einheiten/Mietern ableiten – sonst eine Partei fürs ganze Objekt.
    const eList = einheiten.filter((e) => e.objektId === objektId);
    let parteien: NkPartei[] = [];
    const zeitraumStart = `${jahr}-01-01`;
    for (const e of eList) {
      const m = mieter.find((x) => x.einheitId === e.id && !x.mietende);
      if (m) {
        // Einzug nur setzen, wenn er in den Zeitraum fällt (sonst voller Zeitraum)
        const einzug = m.mietbeginn && m.mietbeginn.slice(0, 10) > zeitraumStart ? m.mietbeginn.slice(0, 10) : undefined;
        parteien.push({
          id: uid(),
          name: m.name,
          wohnflaeche: e.wohnflaeche || 0,
          personen: 1,
          nkVorausMonat: m.nebenkosten || 0,
          einzug,
          auszug: m.mietende ? m.mietende.slice(0, 10) : undefined,
          einheitId: e.id,
        });
      }
    }
    if (parteien.length === 0) {
      // Vor dem Kauf konnte keine NK-Vorauszahlung geflossen sein → Einzug frühestens ab Kaufdatum.
      const kauf = objekt.kaufdatum?.slice(0, 10);
      const einzug = kauf && kauf > zeitraumStart ? kauf : undefined;
      parteien = [
        {
          id: uid(),
          name: "Mietpartei",
          wohnflaeche: objekt.gesamtwohnflaeche || 0,
          personen: 1,
          // monatliche NK-Vorauszahlung des Objekts – Gesamtsumme wird anteilig berechnet
          nkVorausMonat: objekt.nebenkostenVorauszahlung || 0,
          einzug,
        },
      ];
    }

    const id = addAbrechnung({
      objektId,
      titel: `Nebenkostenabrechnung ${jahr}`,
      von: `${jahr}-01-01`,
      bis: `${jahr}-12-31`,
      positionen: [],
      parteien,
    });
    setOpen(false);
    navigate({ to: "/dashboard/nebenkosten/$id", params: { id } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={objekte.length === 0}>
          <Plus className="h-4 w-4" /> Neue Abrechnung
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Nebenkostenabrechnung</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Objekt</Label>
            <Select value={objektId} onValueChange={setObjektId}>
              <SelectTrigger>
                <SelectValue placeholder="Objekt wählen" />
              </SelectTrigger>
              <SelectContent>
                {objekte.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.adresse}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Abrechnungsjahr</Label>
            <Input type="number" value={jahr} onChange={(e) => setJahr(+e.target.value)} />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Zeitraum {`01.01.${jahr}`} – {`31.12.${jahr}`}. Parteien und Vorauszahlungen werden – wenn vorhanden –
              aus den Mietern übernommen.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!objektId} onClick={anlegen}>
            Anlegen & bearbeiten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NebenkostenListe() {
  const abrechnungen = useStore((s) => s.abrechnungen);
  const objekte = useStore((s) => s.objekte);
  const removeAbrechnung = useStore((s) => s.removeAbrechnung);
  const abrechnungenGeladen = useStore((s) => s.abrechnungenGeladen);
  const [objektFilter, setObjektFilter] = useState<string>("alle");

  if (!abrechnungenGeladen) {
    return (
      <LadeSkeleton
        titel="Nebenkostenabrechnung"
        text="Betriebskosten auf Ihre Mieter umlegen – nachvollziehbar und druckfertig."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Nebenkostenabrechnung</h1>
          <p className="text-sm text-muted-foreground">
            Betriebskosten auf Ihre Mieter umlegen – nachvollziehbar und druckfertig.
          </p>
        </div>
        <NeueAbrechnungDialog />
      </div>

      {objekte.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Legen Sie zuerst ein Objekt an, um eine Nebenkostenabrechnung zu erstellen.
        </div>
      ) : abrechnungen.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Noch keine Abrechnungen erstellt.</p>
          <div className="mt-4">
            <NeueAbrechnungDialog />
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Objekt</Label>
            <Select value={objektFilter} onValueChange={setObjektFilter}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle Objekte</SelectItem>
                {objekte.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.strasse || o.adresse}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
          {abrechnungen
            .filter((a) => objektFilter === "alle" || a.objektId === objektFilter)
            .slice()
            .sort((a, b) => {
              const oa = objekte.find((o) => o.id === a.objektId)?.adresse ?? "";
              const ob = objekte.find((o) => o.id === b.objektId)?.adresse ?? "";
              return oa.localeCompare(ob) || b.von.localeCompare(a.von);
            })
            .map((a) => {
              const objekt = objekte.find((o) => o.id === a.objektId);
              const r = berechneAbrechnung(a);
              return (
                <Link
                  key={a.id}
                  to="/dashboard/nebenkosten/$id"
                  params={{ id: a.id }}
                  className="group rounded-xl border bg-card p-4 transition hover:border-foreground/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{a.titel}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {objekt?.adresse ?? "Objekt gelöscht"} · {fmtDate(a.von)}–{fmtDate(a.bis)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm("Diese Abrechnung löschen?")) removeAbrechnung(a.id);
                      }}
                      className="rounded-md p-1 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
                      aria-label="Löschen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4 flex items-end justify-between border-t pt-3">
                    <div className="text-xs text-muted-foreground">
                      {a.parteien.length} Partei(en) · {a.positionen.length} Positionen
                      <div className="mt-0.5">Gesamtkosten {fmtEUR(r.gesamtKosten)}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
