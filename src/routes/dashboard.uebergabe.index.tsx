import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, ClipboardList, ArrowRight, LogIn, LogOut as LogOutIcon } from "lucide-react";
import { useStore, fmtDate, type UebergabeTyp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LadeSkeleton } from "@/components/lade-skeleton";
import { PageTabs, AUFGABEN_TABS } from "@/components/page-tabs";
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
  const geladen = useStore((s) => s.uebergabeprotokolleGeladen);
  const plan = useStore((s) => s.profil.plan);

  if (!geladen) {
    return <LadeSkeleton titel="Übergabeprotokolle" text="Ein- und Auszug dokumentieren – mit Fotos und Unterschrift." />;
  }

  if (!istPro(plan)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Übergabeprotokolle</h1>
          <p className="text-sm text-muted-foreground">Ein- und Auszug dokumentieren – mit Fotos und Unterschrift.</p>
        </div>
        <PageTabs tabs={AUFGABEN_TABS} />
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
          <p className="text-sm text-muted-foreground">Ein- und Auszug dokumentieren – mit Fotos und Unterschrift.</p>
        </div>
        <NeuesProtokollDialog />
      </div>
      <PageTabs tabs={AUFGABEN_TABS} />

      {sortiert.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Noch keine Übergabeprotokolle angelegt.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sortiert.map((p) => {
            const einheit = einheiten.find((e) => e.id === p.einheitId);
            const objekt = objekte.find((o) => o.id === einheit?.objektId);
            const Icon = p.typ === "einzug" ? LogIn : LogOutIcon;
            return (
              <Link
                key={p.id}
                to="/dashboard/uebergabe/$id"
                params={{ id: p.id }}
                className="group flex items-start justify-between gap-2 rounded-xl border bg-card p-4 hover:border-foreground/30"
              >
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" /> {p.typ === "einzug" ? "Einzug" : "Auszug"}
                  </div>
                  <div className="mt-1 truncate font-medium">
                    {objekt?.strasse || objekt?.adresse.split(",")[0]} · {einheit?.bezeichnung}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{fmtDate(p.datum)}</div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
