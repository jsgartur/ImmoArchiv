import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Plus, Camera, X, Trash2, ChevronRight } from "lucide-react";
import {
  useStore,
  fmtEUR,
  fmtDate,
  type Mangel,
  type MangelStatus,
  type Prioritaet,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PageTabs, AUFGABEN_TABS } from "@/components/page-tabs";
import { LadeSkeleton } from "@/components/lade-skeleton";

export const Route = createFileRoute("/dashboard/maengel")({
  component: Maengel,
});

const spalten: { key: MangelStatus; label: string }[] = [
  { key: "gemeldet", label: "Gemeldet" },
  { key: "in_bearbeitung", label: "In Bearbeitung" },
  { key: "erledigt", label: "Erledigt" },
];

const prioColor: Record<Prioritaet, string> = {
  niedrig: "bg-secondary text-secondary-foreground",
  mittel: "bg-chart-4/20 text-chart-4",
  dringend: "bg-destructive/20 text-destructive",
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const FREI_TEXT_WERT = "__frei__";

/** Handwerker aus der gespeicherten Kontaktliste wählen, oder frei eintippen. */
function HandwerkerFeld({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const handwerker = useStore((s) => s.handwerker);
  const [frei, setFrei] = useState(value !== "" && !handwerker.some((h) => h.name === value));

  return (
    <div>
      <Label>Handwerker (optional)</Label>
      {handwerker.length === 0 || frei ? (
        <>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Name eingeben"
          />
          {handwerker.length > 0 && (
            <button
              type="button"
              onClick={() => setFrei(false)}
              className="mt-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              aus Kontaktliste wählen
            </button>
          )}
        </>
      ) : (
        <Select
          value={value || undefined}
          onValueChange={(v) => (v === FREI_TEXT_WERT ? setFrei(true) : onChange(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wählen…" />
          </SelectTrigger>
          <SelectContent>
            {handwerker.map((h) => (
              <SelectItem key={h.id} value={h.name}>
                {h.name}
                {h.gewerk ? ` · ${h.gewerk}` : ""}
              </SelectItem>
            ))}
            <SelectItem value={FREI_TEXT_WERT}>Andere (manuell eingeben)</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

function NeuerMangelDialog() {
  const [open, setOpen] = useState(false);
  const einheiten = useStore((s) => s.einheiten);
  const objekte = useStore((s) => s.objekte);
  const addMangel = useStore((s) => s.addMangel);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    titel: "",
    beschreibung: "",
    einheitId: einheiten[0]?.id ?? "",
    prioritaet: "mittel" as Prioritaet,
    gemeldetVon: "vermieter" as "mieter" | "vermieter",
    handwerker: "",
    kostenGeschaetzt: 0,
    fotos: [] as string[],
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Mangel erfassen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neuen Mangel erfassen</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Titel</Label>
            <Input
              placeholder="Wasserhahn Küche tropft"
              value={form.titel}
              onChange={(e) => setForm({ ...form, titel: e.target.value })}
            />
          </div>
          <div>
            <Label>Beschreibung</Label>
            <Textarea
              rows={3}
              value={form.beschreibung}
              onChange={(e) => setForm({ ...form, beschreibung: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Einheit</Label>
              <Select
                value={form.einheitId}
                onValueChange={(v) => setForm({ ...form, einheitId: v })}
              >
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
            <div>
              <Label>Priorität</Label>
              <Select
                value={form.prioritaet}
                onValueChange={(v) => setForm({ ...form, prioritaet: v as Prioritaet })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="niedrig">Niedrig</SelectItem>
                  <SelectItem value="mittel">Mittel</SelectItem>
                  <SelectItem value="dringend">Dringend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Gemeldet von</Label>
              <Select
                value={form.gemeldetVon}
                onValueChange={(v) =>
                  setForm({ ...form, gemeldetVon: v as "mieter" | "vermieter" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mieter">Mieter</SelectItem>
                  <SelectItem value="vermieter">Vermieter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <HandwerkerFeld
              value={form.handwerker}
              onChange={(v) => setForm({ ...form, handwerker: v })}
            />
          </div>
          <div>
            <Label>Geschätzte Kosten (€)</Label>
            <Input
              type="number"
              value={form.kostenGeschaetzt || ""}
              onChange={(e) => setForm({ ...form, kostenGeschaetzt: +e.target.value })}
            />
          </div>

          <div>
            <Label>Fotos</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.fotos.map((f, i) => (
                <div key={i} className="relative">
                  <img src={f} className="h-20 w-20 rounded-md object-cover" alt="" />
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, fotos: form.fotos.filter((_, j) => j !== i) })
                    }
                    className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs text-muted-foreground hover:bg-accent"
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
                  setForm({ ...form, fotos: [...form.fotos, ...urls] });
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!form.titel.trim() || !form.einheitId}
            onClick={() => {
              addMangel({
                titel: form.titel,
                beschreibung: form.beschreibung,
                einheitId: form.einheitId,
                prioritaet: form.prioritaet,
                gemeldetVon: form.gemeldetVon,
                handwerker: form.handwerker || undefined,
                kostenGeschaetzt: form.kostenGeschaetzt || undefined,
                fotos: form.fotos,
                status: "gemeldet",
              });
              setOpen(false);
              setForm({
                titel: "",
                beschreibung: "",
                einheitId: einheiten[0]?.id ?? "",
                prioritaet: "mittel",
                gemeldetVon: "vermieter",
                handwerker: "",
                kostenGeschaetzt: 0,
                fotos: [],
              });
            }}
          >
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MangelKarte({ m, onOpen }: { m: Mangel; onOpen: () => void }) {
  const einheit = useStore((s) => s.einheiten.find((e) => e.id === m.einheitId));
  const objekt = useStore((s) => s.objekte.find((o) => o.id === einheit?.objektId));
  return (
    <button
      onClick={onOpen}
      className="w-full rounded-lg border bg-card p-3 text-left transition hover:border-destructive/60"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium leading-tight">{m.titel}</div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide",
            prioColor[m.prioritaet],
          )}
        >
          {m.prioritaet}
        </span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {objekt?.adresse.split(",")[0]} · {einheit?.bezeichnung}
      </div>
      {m.fotos[0] && (
        <img src={m.fotos[0]} className="mt-2 h-24 w-full rounded object-cover" alt="" />
      )}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{fmtDate(m.gemeldetAm)}</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </div>
    </button>
  );
}

function MieterMangelZeile({ m, onOpen }: { m: Mangel; onOpen: () => void }) {
  const einheit = useStore((s) => s.einheiten.find((e) => e.id === m.einheitId));
  const objekt = useStore((s) => s.objekte.find((o) => o.id === einheit?.objektId));
  const mieter = useStore(
    (s) =>
      s.mieter.find((x) => x.einheitId === m.einheitId && !x.mietende) ??
      s.mieter.find((x) => x.einheitId === m.einheitId),
  );
  const statusLabel = spalten.find((sp) => sp.key === m.status)?.label ?? m.status;

  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center justify-between gap-3 rounded-lg border bg-card p-3 text-left transition hover:border-foreground/30"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide",
              prioColor[m.prioritaet],
            )}
          >
            {m.prioritaet}
          </span>
          <span className="truncate font-medium">{m.titel}</span>
        </div>
        <div className="mt-1 truncate text-xs text-muted-foreground">
          {objekt?.strasse || objekt?.adresse.split(",")[0]} · {einheit?.bezeichnung}
          {mieter ? ` · ${mieter.name}` : ""}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Badge variant="outline" className="text-[10px]">
          {statusLabel}
        </Badge>
        <span className="text-xs text-muted-foreground">{fmtDate(m.gemeldetAm)}</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </button>
  );
}

function MangelSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const m = useStore((s) => s.maengel.find((x) => x.id === id));
  const einheit = useStore((s) => s.einheiten.find((e) => e.id === m?.einheitId));
  const objekt = useStore((s) => s.objekte.find((o) => o.id === einheit?.objektId));
  const setStatus = useStore((s) => s.setMangelStatus);
  const addNotiz = useStore((s) => s.addMangelNotiz);
  const removeMangel = useStore((s) => s.removeMangel);
  const updateMangel = useStore((s) => s.updateMangel);
  const [notiz, setNotiz] = useState("");
  const [kosten, setKosten] = useState<string>("");

  if (!m) return null;

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{m.titel}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4 px-4 pb-6">
          <div className="text-sm text-muted-foreground">
            {objekt?.adresse} · {einheit?.bezeichnung}
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={cn("rounded-full px-2 py-0.5 text-xs uppercase", prioColor[m.prioritaet])}
            >
              {m.prioritaet}
            </span>
            <Badge variant="outline">
              Von {m.gemeldetVon === "mieter" ? "Mieter" : "Vermieter"}
            </Badge>
          </div>
          {m.beschreibung && <p className="text-sm">{m.beschreibung}</p>}
          {m.fotos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {m.fotos.map((f, i) => (
                <img key={i} src={f} className="aspect-square rounded object-cover" alt="" />
              ))}
            </div>
          )}

          <div>
            <Label className="mb-1">Status</Label>
            <Select value={m.status} onValueChange={(v) => setStatus(m.id, v as MangelStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemeldet">Gemeldet</SelectItem>
                <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                <SelectItem value="erledigt">Erledigt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <HandwerkerFeld
              value={m.handwerker ?? ""}
              onChange={(v) => updateMangel(m.id, { handwerker: v || undefined })}
            />
            <div>
              <Label>Tatsächliche Kosten (€)</Label>
              <Input
                type="number"
                defaultValue={m.kostenTatsaechlich ?? ""}
                onBlur={(e) =>
                  updateMangel(m.id, {
                    kostenTatsaechlich: e.target.value ? +e.target.value : undefined,
                  })
                }
              />
            </div>
          </div>
          {m.kostenGeschaetzt && (
            <div className="text-xs text-muted-foreground">
              Geschätzt: {fmtEUR(m.kostenGeschaetzt)}
            </div>
          )}

          <div>
            <Label className="mb-1">Verlauf</Label>
            <ol className="space-y-2 border-l pl-3">
              {m.verlauf.map((v, i) => (
                <li key={i} className="text-sm">
                  <div className="text-xs text-muted-foreground">
                    {new Date(v.datum).toLocaleString("de-DE")}
                  </div>
                  {v.text}
                </li>
              ))}
            </ol>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Notiz hinzufügen…"
                value={notiz}
                onChange={(e) => setNotiz(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => {
                  if (notiz.trim()) {
                    addNotiz(m.id, notiz.trim());
                    setNotiz("");
                  }
                }}
              >
                Hinzufügen
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm("Mangel löschen?")) {
                removeMangel(m.id);
                onClose();
              }
            }}
          >
            <Trash2 className="h-4 w-4" /> Mangel löschen
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Maengel() {
  const maengel = useStore((s) => s.maengel);
  const objekte = useStore((s) => s.objekte);
  const einheiten = useStore((s) => s.einheiten);
  const maengelGeladen = useStore((s) => s.maengelGeladen);
  const [filterObjekt, setFilterObjekt] = useState<string>("alle");
  const [filterPrio, setFilterPrio] = useState<string>("alle");
  const [openId, setOpenId] = useState<string | null>(null);

  const gefiltert = useMemo(() => {
    return maengel.filter((m) => {
      if (filterPrio !== "alle" && m.prioritaet !== filterPrio) return false;
      if (filterObjekt !== "alle") {
        const e = einheiten.find((x) => x.id === m.einheitId);
        if (e?.objektId !== filterObjekt) return false;
      }
      return true;
    });
  }, [maengel, filterObjekt, filterPrio, einheiten]);

  const vonMieternGemeldet = useMemo(
    () =>
      gefiltert
        .filter((m) => m.gemeldetVon === "mieter")
        .slice()
        .sort((a, b) => b.gemeldetAm.localeCompare(a.gemeldetAm)),
    [gefiltert],
  );

  if (!maengelGeladen) {
    return <LadeSkeleton titel="Mängel" text="Erfassen, verfolgen, dokumentieren." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Mängel</h1>
          <p className="text-sm text-muted-foreground">Erfassen, verfolgen, dokumentieren.</p>
        </div>
        <NeuerMangelDialog />
      </div>
      <PageTabs tabs={AUFGABEN_TABS} />

      <div className="flex flex-wrap gap-2">
        <Select value={filterObjekt} onValueChange={setFilterObjekt}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Objekte</SelectItem>
            {objekte.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.adresse.split(",")[0]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPrio} onValueChange={setFilterPrio}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Prioritäten</SelectItem>
            <SelectItem value="niedrig">Niedrig</SelectItem>
            <SelectItem value="mittel">Mittel</SelectItem>
            <SelectItem value="dringend">Dringend</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {vonMieternGemeldet.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Von Mietern gemeldete Mängel
          </h2>
          <div className="space-y-2">
            {vonMieternGemeldet.map((m) => (
              <MieterMangelZeile key={m.id} m={m} onOpen={() => setOpenId(m.id)} />
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {spalten.map((sp) => {
          const list = gefiltert.filter((m) => m.status === sp.key);
          return (
            <div key={sp.key} className="rounded-xl border bg-card/40 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="text-sm font-medium">{sp.label}</div>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{list.length}</span>
              </div>
              <div className="space-y-2">
                {list.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                    Keine Einträge
                  </div>
                ) : (
                  list.map((m) => <MangelKarte key={m.id} m={m} onOpen={() => setOpenId(m.id)} />)
                )}
              </div>
            </div>
          );
        })}
      </div>

      <MangelSheet id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
