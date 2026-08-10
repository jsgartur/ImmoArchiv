import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, Plus, QrCode, User, Phone, Mail, CalendarDays, Wallet, ShieldCheck, CheckCircle2, Circle } from "lucide-react";
import { useStore, fmtEUR, fmtDate, monatKey, monatLabel, type Mieter, type Einheit, type Objekt } from "@/lib/store";
import { erwarteteMieteFuerMonat } from "@/lib/immobilienrechner";
import { MieterPortalDialog } from "@/components/mieter-portal-dialog";
import { LadeSkeleton } from "@/components/lade-skeleton";
import { ProGate } from "@/components/pro-gate";
import { istPro } from "@/lib/plaene";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/mieterportal")({
  component: MieterportalUebersicht,
});

/** Legt einen neuen Mieter (inkl. Portal-Zugang) für eine frei wählbare Einheit an — auch mehrfach pro Objekt möglich. */
function NeuesMieterportalDialog() {
  const [open, setOpen] = useState(false);
  const objekte = useStore((s) => s.objekte);
  const einheiten = useStore((s) => s.einheiten);
  const addMieter = useStore((s) => s.addMieter);

  const [objektId, setObjektId] = useState("");
  const [einheitId, setEinheitId] = useState("");
  const [name, setName] = useState("");
  const [kaltmiete, setKaltmiete] = useState(0);
  const [nebenkosten, setNebenkosten] = useState(0);

  const einheitenFuerObjekt = einheiten.filter((e) => e.objektId === objektId);

  const reset = () => {
    setObjektId("");
    setEinheitId("");
    setName("");
    setKaltmiete(0);
    setNebenkosten(0);
  };

  const erstellen = () => {
    if (!einheitId || !name.trim()) return;
    addMieter({
      einheitId,
      name: name.trim(),
      telefon: "",
      email: "",
      mietbeginn: new Date().toISOString().slice(0, 10),
      mietende: "",
      kaltmiete,
      nebenkosten,
      kaution: 0,
    });
    toast.success("Mieter angelegt — Portal-Zugang wurde erzeugt.");
    setOpen(false);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Neues Mieterportal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neues Mieterportal</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Objekt</Label>
            <Select
              value={objektId}
              onValueChange={(v) => {
                setObjektId(v);
                setEinheitId("");
              }}
            >
              <SelectTrigger><SelectValue placeholder="Objekt wählen" /></SelectTrigger>
              <SelectContent>
                {objekte.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.strasse || o.adresse}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Einheit</Label>
            <Select value={einheitId} onValueChange={setEinheitId} disabled={!objektId}>
              <SelectTrigger><SelectValue placeholder="Einheit wählen" /></SelectTrigger>
              <SelectContent>
                {einheitenFuerObjekt.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.bezeichnung}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {objektId && einheitenFuerObjekt.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Dieses Objekt hat noch keine Einheit. Legen Sie zuerst eine auf der Objekt-Detailseite an.
              </p>
            )}
          </div>
          <div>
            <Label>Name des Mieters</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vor- und Nachname" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Kaltmiete €</Label><Input type="number" step="0.01" value={kaltmiete || ""} onChange={(e) => setKaltmiete(+e.target.value)} /></div>
            <div><Label>Nebenkosten €</Label><Input type="number" step="0.01" value={nebenkosten || ""} onChange={(e) => setNebenkosten(+e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!einheitId || !name.trim()} onClick={erstellen}>
            Erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Zeile({ icon: Icon, label, value, href }: { icon: typeof Phone; label: string; value: string; href?: string }) {
  const inhalt = (
    <div className="flex items-center gap-3 py-2">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-medium">{value}</div>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block rounded-lg transition hover:bg-accent">{inhalt}</a>
  ) : (
    inhalt
  );
}

/** Übersichtliches Detail-Menü zu einem Mieter — auf Klick auf den Namen. */
function MieterDetailDialog({
  mieter: m,
  einheit,
  objekt,
  open,
  onOpenChange,
}: {
  mieter: Mieter;
  einheit?: Einheit;
  objekt: Objekt;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const mietzahlungen = useStore((s) => s.mietzahlungen);
  const mKey = monatKey();
  const erwartet = erwarteteMieteFuerMonat(m, mKey);
  const bezahlt = mietzahlungen.some((z) => z.mieterId === m.id && z.monat === mKey);
  const warmmiete = (m.kaltmiete ?? 0) + (m.nebenkosten ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>{m.name}</DialogTitle>
              <p className="text-xs text-muted-foreground">
                {objekt.strasse || objekt.adresse} · {einheit?.bezeichnung ?? "—"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {erwartet > 0 && (
            <div
              className={
                "flex items-center gap-2 rounded-lg border p-3 text-sm " +
                (bezahlt ? "border-blue-500/40 bg-blue-500/10" : "border-amber-500/40 bg-amber-500/10")
              }
            >
              {bezahlt ? <CheckCircle2 className="h-5 w-5 text-blue-600" /> : <Circle className="h-5 w-5 text-amber-600" />}
              <div>
                <div className="font-medium">Miete {monatLabel(mKey)}: {bezahlt ? "bezahlt" : "noch offen"}</div>
                <div className="text-xs text-muted-foreground">{fmtEUR(erwartet)} erwartet</div>
              </div>
            </div>
          )}

          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">Kontakt</div>
            <div className="divide-y rounded-lg border px-3">
              {m.telefon && <Zeile icon={Phone} label="Telefon" value={m.telefon} href={`tel:${m.telefon}`} />}
              {m.email && <Zeile icon={Mail} label="E-Mail" value={m.email} href={`mailto:${m.email}`} />}
              {!m.telefon && !m.email && <p className="py-2 text-xs text-muted-foreground">Keine Kontaktdaten hinterlegt.</p>}
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">Mietverhältnis</div>
            <div className="divide-y rounded-lg border px-3">
              <Zeile
                icon={CalendarDays}
                label="Zeitraum"
                value={`seit ${fmtDate(m.mietbeginn)}${m.mietende ? ` · befristet bis ${fmtDate(m.mietende)}` : " · unbefristet"}`}
              />
              <Zeile icon={Wallet} label="Kaltmiete + Nebenkosten (Warmmiete)" value={`${fmtEUR(m.kaltmiete)} + ${fmtEUR(m.nebenkosten)} = ${fmtEUR(warmmiete)}`} />
              {m.kaution != null && m.kaution > 0 && <Zeile icon={ShieldCheck} label="Kaution" value={fmtEUR(m.kaution)} />}
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-start">
          <MieterPortalDialog mieter={m} kontext={`${objekt.strasse || objekt.adresse} · ${einheit?.bezeichnung ?? ""}`} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MieterportalUebersicht() {
  const objekte = useStore((s) => s.objekte);
  const einheiten = useStore((s) => s.einheiten);
  const mieter = useStore((s) => s.mieter);
  const geladen = useStore((s) => s.objekteGeladen && s.einheitenGeladen && s.mieterGeladen);
  const plan = useStore((s) => s.profil.plan);
  const [detailFuer, setDetailFuer] = useState<string | null>(null);

  if (!geladen) {
    return <LadeSkeleton titel="Mieterportal" text="Mieter werden geladen…" />;
  }

  if (!istPro(plan)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Mieterportal</h1>
          <p className="text-sm text-muted-foreground">
            Zugänge (QR-Code/Code) für alle Ihre Mieter — objektübergreifend an einem Ort erstellen und verwalten.
          </p>
        </div>
        <ProGate feature="Das Mieterportal">{null}</ProGate>
      </div>
    );
  }

  const aktive = mieter.filter((m) => !m.mietende || new Date(m.mietende) >= new Date());

  const gruppen = objekte
    .map((o) => {
      const objektEinheitenIds = einheiten.filter((e) => e.objektId === o.id).map((e) => e.id);
      const eigenMieter = aktive
        .filter((m) => objektEinheitenIds.includes(m.einheitId))
        .map((m) => ({ mieter: m, einheit: einheiten.find((e) => e.id === m.einheitId) }));
      return { objekt: o, eigenMieter };
    })
    .filter((g) => g.eigenMieter.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Mieterportal</h1>
          <p className="text-sm text-muted-foreground">
            Zugänge (QR-Code/Code) für alle Ihre Mieter — objektübergreifend an einem Ort erstellen und verwalten.
            Mehrere Portale pro Objekt sind möglich (z. B. bei mehreren Wohneinheiten).
          </p>
        </div>
        {objekte.length > 0 && <NeuesMieterportalDialog />}
      </div>

      {gruppen.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Noch keine Mieter erfasst. Legen Sie oben ein neues Mieterportal an oder erstellen Sie zuerst einen Mieter bei einer Einheit.
        </div>
      ) : (
        <div className="space-y-4">
          {gruppen.map(({ objekt, eigenMieter }) => (
            <div key={objekt.id} className="rounded-2xl border bg-card p-5">
              <Link
                to="/dashboard/objekte/$id"
                params={{ id: objekt.id }}
                className="mb-3 inline-flex items-center gap-2 text-sm font-medium hover:underline"
              >
                <Building2 className="h-4 w-4" />
                {objekt.strasse || objekt.adresse}
              </Link>
              <div className="space-y-2">
                {eigenMieter.map(({ mieter: m, einheit }) => (
                  <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background p-3">
                    <button
                      type="button"
                      onClick={() => setDetailFuer(m.id)}
                      className="flex min-w-0 items-center gap-3 rounded-lg text-left transition hover:opacity-80"
                    >
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium hover:underline">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{einheit?.bezeichnung ?? "—"}</div>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      {m.portalCode ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                          <QrCode className="h-3 w-3" /> Zugang eingerichtet
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Kein Zugang</span>
                      )}
                      <MieterPortalDialog mieter={m} kontext={`${objekt.strasse || objekt.adresse} · ${einheit?.bezeichnung ?? ""}`} />
                    </div>
                    {detailFuer === m.id && (
                      <MieterDetailDialog
                        mieter={m}
                        einheit={einheit}
                        objekt={objekt}
                        open={detailFuer === m.id}
                        onOpenChange={(o) => setDetailFuer(o ? m.id : null)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
