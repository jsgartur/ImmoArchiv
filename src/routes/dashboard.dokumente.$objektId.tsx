import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, Download, FileText, Folder, FolderPlus, Trash2, Upload } from "lucide-react";
import { useStore, fmtDate, DOKUMENT_KATEGORIEN, type DokumentKategorie } from "@/lib/store";
import { LadeSkeleton } from "@/components/lade-skeleton";
import { Button } from "@/components/ui/button";
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
import {
  fetchObjektDokumente,
  uploadObjektDokument,
  deleteObjektDokument,
  signierteObjektDokumentUrl,
  type ObjektDokument,
} from "@/lib/supabase/objekt-dokumente-sync";
import {
  fetchOrdner,
  erstelleOrdner,
  loescheOrdner,
  type DokumentOrdner,
} from "@/lib/supabase/dokument-ordner-sync";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/dokumente/$objektId")({
  component: DokumenteExplorer,
  notFoundComponent: () => (
    <div className="py-20 text-center text-muted-foreground">Objekt nicht gefunden.</div>
  ),
});

const MAX_BYTES = 20 * 1024 * 1024;
const fmtGroesse = (b: number) =>
  b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

function NeuerOrdnerDialog({ onErstellt }: { onErstellt: (name: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FolderPlus className="h-4 w-4" /> Ordner
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuer Ordner</DialogTitle>
        </DialogHeader>
        <div>
          <Label className="text-xs">Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Mietverträge"
            onKeyDown={(e) =>
              e.key === "Enter" &&
              name.trim() &&
              onErstellt(name.trim()).then(() => {
                setOpen(false);
                setName("");
              })
            }
          />
        </div>
        <DialogFooter>
          <Button
            disabled={!name.trim() || busy}
            onClick={async () => {
              setBusy(true);
              await onErstellt(name.trim());
              setBusy(false);
              setOpen(false);
              setName("");
            }}
          >
            Anlegen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DokumenteExplorer() {
  const { objektId } = Route.useParams();
  const objekt = useStore((s) => s.objekte.find((o) => o.id === objektId));
  const objekteGeladen = useStore((s) => s.objekteGeladen);

  const [alleOrdner, setAlleOrdner] = useState<DokumentOrdner[]>([]);
  const [dokumente, setDokumente] = useState<ObjektDokument[]>([]);
  const [geladen, setGeladen] = useState(false);
  const [pfad, setPfad] = useState<DokumentOrdner[]>([]);
  const [kategorie, setKategorie] = useState<DokumentKategorie>("Sonstiges");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const aktuellerOrdnerId = pfad.length > 0 ? pfad[pfad.length - 1].id : null;

  const laden = async () => {
    try {
      const [o, d] = await Promise.all([
        fetchOrdner(objektId),
        fetchObjektDokumente(objektId, aktuellerOrdnerId),
      ]);
      setAlleOrdner(o);
      setDokumente(d);
    } catch {
      toast.error("Dokumente konnten nicht geladen werden.");
    } finally {
      setGeladen(true);
    }
  };

  useEffect(() => {
    laden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objektId, aktuellerOrdnerId]);

  if (!objekteGeladen) return <LadeSkeleton titel="Dokumente" text="Details werden geladen…" />;
  if (!objekt) throw notFound();

  const unterordner = alleOrdner.filter((o) => o.parentId === aktuellerOrdnerId);

  const ordnerAnlegen = async (name: string) => {
    try {
      const neu = await erstelleOrdner(objektId, name, aktuellerOrdnerId);
      setAlleOrdner((prev) => [...prev, neu]);
      toast.success(`Ordner "${name}" angelegt`);
    } catch {
      toast.error("Ordner konnte nicht angelegt werden.");
    }
  };

  const ordnerLoeschen = async (o: DokumentOrdner) => {
    const hatUnterordner = alleOrdner.some((x) => x.parentId === o.id);
    if (hatUnterordner) {
      toast.error("Ordner enthält noch Unterordner – bitte zuerst leeren.");
      return;
    }
    try {
      const inhalt = await fetchObjektDokumente(objektId, o.id);
      if (inhalt.length > 0) {
        toast.error("Ordner enthält noch Dokumente – bitte zuerst leeren.");
        return;
      }
    } catch {
      toast.error("Ordnerinhalt konnte nicht geprüft werden.");
      return;
    }
    try {
      await loescheOrdner(o.id);
      setAlleOrdner((prev) => prev.filter((x) => x.id !== o.id));
      toast.success(`Ordner "${o.name}" gelöscht`);
    } catch {
      toast.error("Ordner konnte nicht gelöscht werden.");
    }
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_BYTES) {
          toast.error(`"${file.name}" ist größer als 20 MB und wurde übersprungen.`);
          continue;
        }
        await uploadObjektDokument(objektId, file, kategorie, aktuellerOrdnerId);
      }
      toast.success("Dokument(e) hinzugefügt");
      await laden();
    } catch {
      toast.error("Datei konnte nicht hochgeladen werden.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const herunterladen = async (d: ObjektDokument) => {
    try {
      window.open(await signierteObjektDokumentUrl(d.storagePath), "_blank");
    } catch {
      toast.error("Link konnte nicht erzeugt werden.");
    }
  };

  const dokumentLoeschen = async (d: ObjektDokument) => {
    setDokumente((prev) => prev.filter((x) => x.id !== d.id));
    try {
      await deleteObjektDokument(d.id, d.storagePath);
      toast.success(`"${d.name}" gelöscht`);
    } catch {
      toast.error("Löschen fehlgeschlagen.");
      setDokumente((prev) => [...prev, d]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          {objekt.strasse || objekt.adresse.split(",")[0]}
        </h2>
        <p className="text-sm text-muted-foreground">{objekt.adresse}</p>
      </div>

      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1 text-sm">
        <button
          onClick={() => setPfad([])}
          className={
            "hover:text-foreground " +
            (pfad.length === 0 ? "font-medium text-foreground" : "text-muted-foreground")
          }
        >
          Wurzelverzeichnis
        </button>
        {pfad.map((o, i) => (
          <span key={o.id} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <button
              onClick={() => setPfad(pfad.slice(0, i + 1))}
              className={
                "hover:text-foreground " +
                (i === pfad.length - 1 ? "font-medium text-foreground" : "text-muted-foreground")
              }
            >
              {o.name}
            </button>
          </span>
        ))}
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="text-sm font-medium">Inhalt</div>
          <div className="flex items-end gap-2">
            <NeuerOrdnerDialog onErstellt={ordnerAnlegen} />
            <div>
              <Label className="text-xs">Kategorie</Label>
              <Select value={kategorie} onValueChange={(v) => setKategorie(v as DokumentKategorie)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOKUMENT_KATEGORIEN.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
              <Upload className="h-4 w-4" /> {busy ? "Lädt …" : "Hochladen"}
            </Button>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
          </div>
        </div>

        {!geladen ? null : unterordner.length === 0 && dokumente.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Dieser Ordner ist leer. Legen Sie einen Unterordner an oder laden Sie Dokumente hoch.
          </div>
        ) : (
          <ul className="divide-y">
            {unterordner.map((o) => (
              <li key={o.id} className="group flex items-center gap-3 py-3">
                <button
                  onClick={() => setPfad([...pfad, o])}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary">
                    <Folder className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{o.name}</div>
                    <div className="text-xs text-muted-foreground">Ordner</div>
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Ordner löschen"
                  className="opacity-0 transition group-hover:opacity-100"
                  onClick={() => ordnerLoeschen(o)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
            {dokumente.map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.kategorie} · {d.groesse ? fmtGroesse(d.groesse) : "—"} ·{" "}
                    {fmtDate(d.hochgeladenAm)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Herunterladen"
                  onClick={() => herunterladen(d)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Löschen"
                  onClick={() => dokumentLoeschen(d)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
