import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, ClipboardList, LogIn, LogOut as LogOutIcon } from "lucide-react";
import { useStore, fmtDate, type UebergabeTyp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ObjektBild } from "@/components/objekt-bild";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LadeSkeleton } from "@/components/lade-skeleton";
import { ProGate } from "@/components/pro-gate";
import { istPro } from "@/lib/plaene";

export const Route = createFileRoute("/dashboard/uebergabe/")({
  component: UebergabeListe,
});

function NeuesProtokollDialog() {
  const objekte = useStore((s) => s.objekte);
  const einheiten = useStore((s) => s.einheiten);
  const mieter = useStore((s) => s.mieter);
  const addUebergabeprotokoll = useStore((s) => s.addUebergabeprotokoll);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [einheitId, setEinheitId] = useState("");
  const [typ, setTyp] = useState<UebergabeTyp>("einzug");
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));

  const anlegen = () => {
    if (!einheitId) return;
    const mieterDerEinheit = mieter.find((m) => m.einheitId === einheitId);
    const id = addUebergabeprotokoll({
      einheitId,
      mieterId: mieterDerEinheit?.id,
      typ,
      datum,
      raeume: [],
      zaehlerstaende: [],
    });
    setOpen(false);
    navigate({ to: "/dashboard/uebergabe/$id", params: { id } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Neues Protokoll
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neues Übergabeprotokoll</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Einheit</Label>
            <Select value={einheitId} onValueChange={setEinheitId}>
              <SelectTrigger>
                <SelectValue placeholder="Einheit wählen" />
              </SelectTrigger>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Typ</Label>
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
              <Label>Datum</Label>
              <Input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!einheitId} onClick={anlegen}>
            Erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UebergabeListe() {
  const protokolle = useStore((s) => s.uebergabeprotokolle);
  const objekte = useStore((s) => s.objekte);
  const einheiten = useStore((s) => s.einheiten);
  const mieter = useStore((s) => s.mieter);
  const geladen = useStore((s) => s.uebergabeprotokolleGeladen);
  const plan = useStore((s) => s.profil.plan);

  if (!geladen) {
    return (
      <LadeSkeleton
        titel="Übergabeprotokolle"
        text="Ein- und Auszug dokumentieren – mit Fotos und Unterschrift."
      />
    );
  }

  if (!istPro(plan)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Übergabeprotokolle</h1>
          <p className="text-sm text-muted-foreground">
            Ein- und Auszug dokumentieren – mit Fotos und Unterschrift.
          </p>
        </div>
        <ProGate feature="Übergabeprotokolle">{null}</ProGate>
      </div>
    );
  }

  const sortiert = protokolle.slice().sort((a, b) => b.datum.localeCompare(a.datum));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Übergabeprotokolle</h1>
          <p className="text-sm text-muted-foreground">
            Ein- und Auszug dokumentieren – mit Fotos und Unterschrift.
          </p>
        </div>
        <NeuesProtokollDialog />
      </div>

      {sortiert.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Noch keine Übergabeprotokolle angelegt.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sortiert.map((p) => {
            const einheit = einheiten.find((e) => e.id === p.einheitId);
            const objekt = objekte.find((o) => o.id === einheit?.objektId);
            const m = mieter.find((x) => x.id === p.mieterId);
            const Icon = p.typ === "einzug" ? LogIn : LogOutIcon;
            const vollstaendig = !!p.unterschriftMieter && !!p.unterschriftVermieter;
            return (
              <Link
                key={p.id}
                to="/dashboard/uebergabe/$id"
                params={{ id: p.id }}
                className="group overflow-hidden rounded-xl border bg-card transition hover:border-foreground/30"
              >
                {objekt?.bilder && objekt.bilder.length > 0 ? (
                  <div className="relative h-40 w-full overflow-hidden bg-muted">
                    <ObjektBild
                      pfad={objekt.bilder[0]}
                      alt={objekt.adresse}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/50 to-transparent p-2">
                      <Badge variant="secondary" className="inline-flex items-center gap-1">
                        <Icon className="h-3 w-3" /> {p.typ === "einzug" ? "Einzug" : "Auszug"}
                      </Badge>
                      {vollstaendig ? (
                        <Badge
                          variant="outline"
                          className="border-blue-500/40 bg-background/80 text-blue-600"
                        >
                          unterschrieben
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-background/80">
                          offen
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2 px-4 pt-4">
                    <Badge variant="secondary" className="inline-flex items-center gap-1">
                      <Icon className="h-3 w-3" /> {p.typ === "einzug" ? "Einzug" : "Auszug"}
                    </Badge>
                    {vollstaendig ? (
                      <Badge variant="outline" className="border-blue-500/40 text-blue-600">
                        unterschrieben
                      </Badge>
                    ) : (
                      <Badge variant="outline">offen</Badge>
                    )}
                  </div>
                )}
                <div className="p-4 pt-3">
                  <div className="font-medium leading-tight">
                    {objekt?.strasse || objekt?.adresse.split(",")[0] || "Objekt gelöscht"}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{einheit?.bezeichnung}</div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t pt-3 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Datum</dt>
                      <dd className="font-medium">{fmtDate(p.datum)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Mieter</dt>
                      <dd className="truncate font-medium">{m?.name || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Räume</dt>
                      <dd className="font-medium">{p.raeume.length || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Zählerstände</dt>
                      <dd className="font-medium">{p.zaehlerstaende.length || "—"}</dd>
                    </div>
                  </dl>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
