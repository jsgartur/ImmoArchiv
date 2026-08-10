import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Printer,
  Save,
  Camera,
  X,
  Gauge,
  DoorOpen,
  Key,
} from "lucide-react";
import {
  useStore,
  fmtDate,
  type UebergabeRaum,
  type Zaehlerstand,
  type UebergabeTyp,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignaturePad } from "@/components/signature-pad";
import { toast } from "sonner";
import { LadeSkeleton } from "@/components/lade-skeleton";

export const Route = createFileRoute("/dashboard/uebergabe/$id")({
  component: ProtokollEditor,
  notFoundComponent: () => <div className="py-20 text-center text-muted-foreground">Protokoll nicht gefunden.</div>,
});

const uid = () => Math.random().toString(36).slice(2, 10);

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function RaumKarte({
  raum,
  onChange,
  onRemove,
}: {
  raum: UebergabeRaum;
  onChange: (patch: Partial<UebergabeRaum>) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="flex items-center gap-2">
        <Input
          value={raum.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Raum, z. B. Wohnzimmer"
          className="font-medium"
        />
        <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Raum entfernen">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <Textarea
        className="mt-2"
        rows={2}
        placeholder="Zustand (Wände, Boden, Fenster, Mängel …)"
        value={raum.zustand}
        onChange={(e) => onChange({ zustand: e.target.value })}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {raum.fotos.map((f, i) => (
          <div key={i} className="relative">
            <img src={f} className="h-16 w-16 rounded-md object-cover" alt="" />
            <button
              type="button"
              onClick={() => onChange({ fotos: raum.fotos.filter((_, j) => j !== i) })}
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
            onChange({ fotos: [...raum.fotos, ...urls] });
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function ProtokollEditor() {
  const { id } = Route.useParams();
  const gespeichert = useStore((s) => s.uebergabeprotokolle.find((p) => p.id === id));
  const einheit = useStore((s) => s.einheiten.find((e) => e.id === gespeichert?.einheitId));
  const objekt = useStore((s) => s.objekte.find((o) => o.id === einheit?.objektId));
  const mieter = useStore((s) => s.mieter.find((m) => m.id === gespeichert?.mieterId));
  const updateUebergabeprotokoll = useStore((s) => s.updateUebergabeprotokoll);
  const removeUebergabeprotokoll = useStore((s) => s.removeUebergabeprotokoll);
  const geladen = useStore((s) => s.uebergabeprotokolleGeladen);
  const navigate = useNavigate();

  const [typ, setTyp] = useState<UebergabeTyp>(gespeichert?.typ ?? "einzug");
  const [datum, setDatum] = useState(gespeichert?.datum ?? "");
  const [raeume, setRaeume] = useState<UebergabeRaum[]>(gespeichert?.raeume ?? []);
  const [zaehlerstaende, setZaehlerstaende] = useState<Zaehlerstand[]>(gespeichert?.zaehlerstaende ?? []);
  const [schluesselAnzahl, setSchluesselAnzahl] = useState(gespeichert?.schluesselAnzahl ?? 0);
  const [bemerkungen, setBemerkungen] = useState(gespeichert?.bemerkungen ?? "");
  const [unterschriftMieter, setUnterschriftMieter] = useState(gespeichert?.unterschriftMieter);
  const [unterschriftVermieter, setUnterschriftVermieter] = useState(gespeichert?.unterschriftVermieter);

  if (!geladen) {
    return <LadeSkeleton titel="Übergabeprotokoll" text="Details werden geladen…" />;
  }
  if (!gespeichert) throw notFound();

  const aktuell = {
    ...gespeichert,
    typ,
    datum,
    raeume,
    zaehlerstaende,
    schluesselAnzahl,
    bemerkungen,
    unterschriftMieter,
    unterschriftVermieter,
  };
  const dirty = JSON.stringify(aktuell) !== JSON.stringify(gespeichert);

  const speichern = () => {
    updateUebergabeprotokoll(id, {
      typ,
      datum,
      raeume,
      zaehlerstaende,
      schluesselAnzahl,
      bemerkungen,
      unterschriftMieter,
      unterschriftVermieter,
    });
    toast.success("Übergabeprotokoll gespeichert");
  };

  const addRaum = () => setRaeume((r) => [...r, { id: uid(), name: "", zustand: "", fotos: [] }]);
  const setRaum = (rid: string, patch: Partial<UebergabeRaum>) =>
    setRaeume((list) => list.map((r) => (r.id === rid ? { ...r, ...patch } : r)));
  const removeRaum = (rid: string) => setRaeume((list) => list.filter((r) => r.id !== rid));

  const addZaehler = () =>
    setZaehlerstaende((z) => [...z, { id: uid(), bezeichnung: "", stand: 0 }]);
  const setZaehler = (zid: string, patch: Partial<Zaehlerstand>) =>
    setZaehlerstaende((list) => list.map((z) => (z.id === zid ? { ...z, ...patch } : z)));
  const removeZaehler = (zid: string) => setZaehlerstaende((list) => list.filter((z) => z.id !== zid));

  return (
    <div className="space-y-6">
      <div className="no-print">
        <Link
          to="/dashboard/uebergabe"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Alle Protokolle
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {typ === "einzug" ? "Einzugsprotokoll" : "Auszugsprotokoll"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {objekt?.strasse || objekt?.adresse.split(",")[0]} · {einheit?.bezeichnung}
              {mieter ? ` · ${mieter.name}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
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
                if (confirm("Protokoll löschen?")) {
                  removeUebergabeprotokoll(id);
                  navigate({ to: "/dashboard/uebergabe" });
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
        {dirty && <p className="mt-1 text-xs text-amber-600">Ungespeicherte Änderungen</p>}
      </div>

      <div className="no-print grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Typ</Label>
              <Select value={typ} onValueChange={(v) => setTyp(v as UebergabeTyp)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="einzug">Einzug</SelectItem>
                  <SelectItem value="auszug">Auszug</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Datum</Label>
              <Input type="date" value={datum.slice(0, 10)} onChange={(e) => setDatum(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <Label className="text-xs">
            <Key className="mr-1 inline h-3.5 w-3.5" /> Anzahl übergebener Schlüssel
          </Label>
          <Input
            type="number"
            value={schluesselAnzahl || ""}
            onChange={(e) => setSchluesselAnzahl(+e.target.value)}
          />
        </div>
      </div>

      {/* Zählerstände */}
      <div className="no-print rounded-2xl border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Gauge className="h-4 w-4" /> Zählerstände
          </div>
          <Button size="sm" variant="outline" onClick={addZaehler}>
            <Plus className="h-4 w-4" /> Zähler
          </Button>
        </div>
        <div className="space-y-2">
          {zaehlerstaende.map((z) => (
            <div key={z.id} className="grid grid-cols-[1fr_1fr_100px_80px_36px] gap-2">
              <Input
                value={z.bezeichnung}
                onChange={(e) => setZaehler(z.id, { bezeichnung: e.target.value })}
                placeholder="z. B. Strom"
              />
              <Input
                value={z.zaehlernummer ?? ""}
                onChange={(e) => setZaehler(z.id, { zaehlernummer: e.target.value })}
                placeholder="Zählernummer"
              />
              <Input
                type="number"
                value={z.stand || ""}
                onChange={(e) => setZaehler(z.id, { stand: +e.target.value })}
                placeholder="Stand"
              />
              <Select value={z.einheit ?? ""} onValueChange={(v) => setZaehler(z.id, { einheit: v })}>
                <SelectTrigger><SelectValue placeholder="Einheit" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kWh">kWh</SelectItem>
                  <SelectItem value="m³">m³</SelectItem>
                  <SelectItem value="l">l</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => removeZaehler(z.id)} aria-label="Zähler entfernen">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {zaehlerstaende.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Zähler erfasst.</p>}
        </div>
      </div>

      {/* Räume */}
      <div className="no-print rounded-2xl border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <DoorOpen className="h-4 w-4" /> Räume & Zustand
          </div>
          <Button size="sm" variant="outline" onClick={addRaum}>
            <Plus className="h-4 w-4" /> Raum
          </Button>
        </div>
        <div className="space-y-3">
          {raeume.map((r) => (
            <RaumKarte key={r.id} raum={r} onChange={(patch) => setRaum(r.id, patch)} onRemove={() => removeRaum(r.id)} />
          ))}
          {raeume.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Räume erfasst.</p>}
        </div>
      </div>

      {/* Bemerkungen */}
      <div className="no-print rounded-2xl border bg-card p-5">
        <Label className="text-xs">Sonstige Bemerkungen</Label>
        <Textarea rows={3} value={bemerkungen} onChange={(e) => setBemerkungen(e.target.value)} />
      </div>

      {/* Unterschriften */}
      <div className="no-print grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <SignaturePad label="Unterschrift Mieter" value={unterschriftMieter} onChange={setUnterschriftMieter} />
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <SignaturePad label="Unterschrift Vermieter" value={unterschriftVermieter} onChange={setUnterschriftVermieter} />
        </div>
      </div>

      {/* Druckansicht */}
      <div className="print-area rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">{typ === "einzug" ? "Einzugsprotokoll" : "Auszugsprotokoll"}</h2>
        <p className="text-sm text-muted-foreground">
          {objekt?.adresse} · {einheit?.bezeichnung} · {fmtDate(datum)}
          {mieter ? ` · ${mieter.name}` : ""}
        </p>

        <div className="mt-4 text-sm">
          <span className="font-medium">Übergebene Schlüssel: </span>
          {schluesselAnzahl || 0}
        </div>

        {zaehlerstaende.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">Zählerstände</h3>
            <table className="mt-1 w-full text-sm">
              <tbody>
                {zaehlerstaende.map((z) => (
                  <tr key={z.id} className="border-b last:border-none">
                    <td className="py-1">{z.bezeichnung}</td>
                    <td className="py-1 text-muted-foreground">{z.zaehlernummer}</td>
                    <td className="py-1 text-right font-medium">
                      {z.stand} {z.einheit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {raeume.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">Räume</h3>
            <div className="mt-1 space-y-2">
              {raeume.map((r) => (
                <div key={r.id} className="text-sm">
                  <span className="font-medium">{r.name || "Raum"}: </span>
                  {r.zustand || "—"}
                  {r.fotos.length > 0 && (
                    <span className="text-xs text-muted-foreground"> ({r.fotos.length} Foto(s))</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {bemerkungen && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">Bemerkungen</h3>
            <p className="text-sm">{bemerkungen}</p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            {unterschriftMieter && <img src={unterschriftMieter} className="h-16" alt="Unterschrift Mieter" />}
            <div className="border-t pt-1 text-xs text-muted-foreground">Unterschrift Mieter</div>
          </div>
          <div>
            {unterschriftVermieter && <img src={unterschriftVermieter} className="h-16" alt="Unterschrift Vermieter" />}
            <div className="border-t pt-1 text-xs text-muted-foreground">Unterschrift Vermieter</div>
          </div>
        </div>
      </div>
    </div>
  );
}
