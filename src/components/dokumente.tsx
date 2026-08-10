import { useEffect, useRef, useState } from "react";
import { FileText, Upload, Trash2, Download } from "lucide-react";
import { fmtDate, DOKUMENT_KATEGORIEN, type DokumentKategorie } from "@/lib/store";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB pro Dokument

const fmtGroesse = (b: number) => (b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

export function Dokumente({ objektId }: { objektId: string }) {
  const [dokumente, setDokumente] = useState<ObjektDokument[]>([]);
  const [geladen, setGeladen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [kategorie, setKategorie] = useState<DokumentKategorie>("Grundbuchauszug");
  const [busy, setBusy] = useState(false);

  const laden = async () => {
    try {
      setDokumente(await fetchObjektDokumente(objektId));
    } catch {
      toast.error("Dokumente konnten nicht geladen werden.");
    } finally {
      setGeladen(true);
    }
  };

  useEffect(() => {
    laden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objektId]);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_BYTES) {
          toast.error(`"${file.name}" ist größer als 20 MB und wurde übersprungen.`);
          continue;
        }
        await uploadObjektDokument(objektId, file, kategorie);
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
      const url = await signierteObjektDokumentUrl(d.storagePath);
      window.open(url, "_blank");
    } catch {
      toast.error("Link konnte nicht erzeugt werden.");
    }
  };

  const loeschen = async (d: ObjektDokument) => {
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
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Dokumente</div>
          <p className="text-xs text-muted-foreground">Grundbuch, Kaufvertrag, Grundriss, Energieausweis …</p>
        </div>
        <div className="flex items-end gap-2">
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

      {!geladen ? null : dokumente.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Noch keine Dokumente hinterlegt.
        </div>
      ) : (
        <ul className="divide-y">
          {dokumente.map((d) => (
            <li key={d.id} className="flex items-center gap-3 py-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{d.name}</div>
                <div className="text-xs text-muted-foreground">
                  {d.kategorie} · {d.groesse ? fmtGroesse(d.groesse) : "—"} · {fmtDate(d.hochgeladenAm)}
                </div>
              </div>
              <Button variant="ghost" size="icon" aria-label="Herunterladen" onClick={() => herunterladen(d)}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Löschen" onClick={() => loeschen(d)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
