import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Building2, KeyRound, Pencil, Plus, Users } from "lucide-react";
import { useStore, fmtDate, type Objekt, type Einheit, type Mieter } from "@/lib/store";
import { LadeSkeleton } from "@/components/lade-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MieterDialog } from "@/components/mieter-dialog";

export const Route = createFileRoute("/dashboard/miete/")({
  component: Mietverhaeltnisse,
});

interface MietverhaeltnisZeile {
  objekt: Objekt;
  einheit: Einheit;
  mieter?: Mieter;
}

function StatKachel({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "accent" | "amber";
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div
        className={
          "text-2xl font-semibold tabular-nums " +
          (tone === "accent" ? "text-blue-600" : tone === "amber" ? "text-amber-600" : "")
        }
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

/** Top-Button "Mieter hinzufügen": erst leerstehende Einheit wählen, dann die Mieterdaten erfassen. */
function NeuerMieterDialog({ vakante }: { vakante: { objekt: Objekt; einheit: Einheit }[] }) {
  const addMieter = useStore((s) => s.addMieter);
  const [open, setOpen] = useState(false);
  const [einheitId, setEinheitId] = useState("");
  const [form, setForm] = useState({
    name: "",
    telefon: "",
    email: "",
    mietbeginn: new Date().toISOString().slice(0, 10),
    mietende: "",
    kaltmiete: 0,
    nebenkosten: 0,
    kaution: 0,
  });

  const reset = () => {
    setEinheitId("");
    setForm({
      name: "",
      telefon: "",
      email: "",
      mietbeginn: new Date().toISOString().slice(0, 10),
      mietende: "",
      kaltmiete: 0,
      nebenkosten: 0,
      kaution: 0,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={vakante.length === 0}>
          <Plus className="h-4 w-4" /> Mieter hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mieter hinzufügen</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Leerstehende Einheit</Label>
            <Select value={einheitId} onValueChange={setEinheitId}>
              <SelectTrigger>
                <SelectValue placeholder="Einheit wählen" />
              </SelectTrigger>
              <SelectContent>
                {vakante.map((v) => (
                  <SelectItem key={v.einheit.id} value={v.einheit.id}>
                    {v.objekt.strasse || v.objekt.adresse.split(",")[0]} – {v.einheit.bezeichnung}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {einheitId && (
            <>
              <div>
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Telefon</Label>
                  <Input
                    value={form.telefon}
                    onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                  />
                </div>
                <div>
                  <Label>E-Mail</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Mietbeginn</Label>
                  <Input
                    type="date"
                    value={form.mietbeginn}
                    onChange={(e) => setForm({ ...form, mietbeginn: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Mietende (optional)</Label>
                  <Input
                    type="date"
                    value={form.mietende}
                    onChange={(e) => setForm({ ...form, mietende: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Kaltmiete €</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.kaltmiete || ""}
                    onChange={(e) => setForm({ ...form, kaltmiete: +e.target.value })}
                  />
                </div>
                <div>
                  <Label>Nebenkosten €</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.nebenkosten || ""}
                    onChange={(e) => setForm({ ...form, nebenkosten: +e.target.value })}
                  />
                </div>
                <div>
                  <Label>Kaution €</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.kaution || ""}
                    onChange={(e) => setForm({ ...form, kaution: +e.target.value })}
                  />
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button
            disabled={!einheitId || !form.name.trim()}
            onClick={() => {
              addMieter({ ...form, einheitId });
              setOpen(false);
              reset();
            }}
          >
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Mietverhaeltnisse() {
  const objekte = useStore((s) => s.objekte);
  const einheiten = useStore((s) => s.einheiten);
  const mieter = useStore((s) => s.mieter);
  const objekteGeladen = useStore((s) => s.objekteGeladen);
  const einheitenGeladen = useStore((s) => s.einheitenGeladen);
  const mieterGeladen = useStore((s) => s.mieterGeladen);

  const zeilen = useMemo<MietverhaeltnisZeile[]>(() => {
    const eintraege: MietverhaeltnisZeile[] = [];
    for (const e of einheiten) {
      const objekt = objekte.find((o) => o.id === e.objektId);
      if (!objekt) continue;
      eintraege.push({
        objekt,
        einheit: e,
        mieter: mieter.find((m) => m.einheitId === e.id && !m.mietende),
      });
    }
    return eintraege.sort(
      (a, b) =>
        a.objekt.adresse.localeCompare(b.objekt.adresse) ||
        a.einheit.bezeichnung.localeCompare(b.einheit.bezeichnung),
    );
  }, [objekte, einheiten, mieter]);

  if (!objekteGeladen || !einheitenGeladen || !mieterGeladen) {
    return (
      <LadeSkeleton titel="Mietverhältnisse" text="Alle Mieter Ihrer Objekte auf einen Blick." />
    );
  }

  const vakante = zeilen
    .filter((z) => !z.mieter)
    .map(({ objekt, einheit }) => ({ objekt, einheit }));
  const vermietet = zeilen.filter((z) => z.mieter).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Mietverhältnisse</h1>
          <p className="text-sm text-muted-foreground">
            Alle Mieter Ihrer Objekte auf einen Blick.
          </p>
        </div>
        <NeuerMieterDialog vakante={vakante} />
      </div>

      {zeilen.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Noch keine Einheiten angelegt. Legen Sie zuerst bei einem Objekt eine Einheit an, um
            Mieter zu erfassen.
          </p>
          <Link
            to="/dashboard/objekte"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Zu den Objekten
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatKachel label="Einheiten gesamt" value={zeilen.length} />
            <StatKachel label="Vermietet" value={vermietet} tone="accent" />
            <StatKachel label="Leerstehend" value={zeilen.length - vermietet} tone="amber" />
          </div>
          <div className="overflow-hidden rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Objekt</TableHead>
                  <TableHead>Einheit</TableHead>
                  <TableHead>Mieter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Vertragsart</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zeilen.map(({ objekt, einheit, mieter: m }) => (
                  <TableRow key={einheit.id}>
                    <TableCell className="p-0">
                      <Link
                        to="/dashboard/objekte/$id"
                        params={{ id: objekt.id }}
                        className="flex items-center gap-2 px-2 py-2.5 font-medium hover:underline"
                      >
                        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {objekt.strasse || objekt.adresse.split(",")[0]}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{einheit.bezeichnung}</TableCell>
                    <TableCell>
                      {m?.name ?? <span className="text-muted-foreground">Leerstand</span>}
                    </TableCell>
                    <TableCell>
                      {m ? (
                        <Badge variant="outline" className="border-blue-500/40 text-blue-600">
                          <KeyRound className="h-3 w-3" /> vermietet
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-500/40 text-amber-600">
                          Leerstand
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {m
                        ? m.mietende
                          ? `Befristet bis ${fmtDate(m.mietende)}`
                          : "Unbefristet"
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {m ? (
                        <MieterDialog
                          einheitId={einheit.id}
                          existing={m}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label="Mieter bearbeiten">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />
                      ) : (
                        <MieterDialog
                          einheitId={einheit.id}
                          trigger={
                            <Button variant="ghost" size="sm">
                              <Plus className="h-4 w-4" /> Mieter
                            </Button>
                          }
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
