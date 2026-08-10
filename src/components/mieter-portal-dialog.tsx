import { useEffect, useRef, useState } from "react";
import { QrCode, Copy, FileText, Upload, Download, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { fmtDate, type Mieter } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  fetchMieterDokumente,
  uploadMieterDokument,
  deleteMieterDokument,
  signierteDokumentUrl,
  type MieterDokument,
} from "@/lib/supabase/mieter-dokumente-sync";

const DOK_KATEGORIEN = ["Mietvertrag", "Übergabeprotokoll", "Sonstiges"] as const;
const MAX_DOK_BYTES = 8 * 1024 * 1024;
const fmtGroesse = (b: number) => (b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

/** Dokumente (v.a. Mietvertrag), die im Mieterportal für diesen Mieter sichtbar sind. */
function MieterDokumente({ mieterId }: { mieterId: string }) {
  const [dokumente, setDokumente] = useState<MieterDokument[]>([]);
  const [geladen, setGeladen] = useState(false);
  const [kategorie, setKategorie] = useState<(typeof DOK_KATEGORIEN)[number]>("Mietvertrag");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const laden = async () => {
    try {
      setDokumente(await fetchMieterDokumente(mieterId));
    } catch {
      toast.error("Dokumente konnten nicht geladen werden.");
    } finally {
      setGeladen(true);
    }
  };

  useEffect(() => {
    laden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mieterId]);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_DOK_BYTES) {
          toast.error(`"${file.name}" ist größer als 8 MB und wurde übersprungen.`);
          continue;
        }
        await uploadMieterDokument(mieterId, file, kategorie);
      }
      toast.success("Dokument(e) hochgeladen");
      await laden();
    } catch {
      toast.error("Datei konnte nicht hochgeladen werden.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const herunterladen = async (d: MieterDokument) => {
    try {
      const url = await signierteDokumentUrl(d.storagePath);
      window.open(url, "_blank");
    } catch {
      toast.error("Link konnte nicht erzeugt werden.");
    }
  };

  const loeschen = async (d: MieterDokument) => {
    if (!confirm(`"${d.name}" löschen?`)) return;
    try {
      await deleteMieterDokument(d.id, d.storagePath);
      setDokumente((prev) => prev.filter((x) => x.id !== d.id));
    } catch {
      toast.error("Löschen fehlgeschlagen.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Mietvertrag & weitere Unterlagen — für diesen Mieter im Portal sichtbar.
        </p>
        <div className="flex items-end gap-2">
          <Select value={kategorie} onValueChange={(v) => setKategorie(v as typeof kategorie)}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DOK_KATEGORIEN.map((k) => (
                <SelectItem key={k} value={k}>{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
            <Upload className="h-4 w-4" /> {busy ? "Lädt …" : "Hochladen"}
          </Button>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
        </div>
      </div>

      {!geladen ? null : dokumente.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
          Noch keine Dokumente hinterlegt.
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {dokumente.map((d) => (
            <li key={d.id} className="flex items-center gap-3 p-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary">
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

/** Zugang & Dokumente fürs Mieterportal (Code + Name, kein Passwort). Wiederverwendet auf der Objekt-Detailseite und der zentralen Mieterportal-Übersicht. */
export function MieterPortalDialog({ mieter, kontext }: { mieter: Mieter; kontext?: string }) {
  const [open, setOpen] = useState(false);
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/portal`;

  const kopieren = async () => {
    await navigator.clipboard.writeText(`${url} — Code: ${mieter.portalCode ?? "—"}`);
    toast.success("Link & Code kopiert");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <QrCode className="h-4 w-4" /> Mieterportal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Mieterportal für {mieter.name}</DialogTitle>
          {kontext && <p className="text-xs text-muted-foreground">{kontext}</p>}
        </DialogHeader>
        {mieter.portalCode ? (
          <div className="space-y-5 py-1">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-xl border bg-white p-4">
                <QRCodeSVG value={`${url}?code=${mieter.portalCode}`} size={160} />
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Zugangscode</div>
                <div className="text-lg font-mono font-semibold tracking-wider">{mieter.portalCode}</div>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                QR-Code scannen oder unter <strong>{url}</strong> den Code und den Namen „{mieter.name}" eingeben.
              </p>
              <Button variant="outline" onClick={kopieren}>
                <Copy className="h-4 w-4" /> Link & Code kopieren
              </Button>
            </div>
            <div className="border-t pt-4">
              <div className="mb-2 text-sm font-medium">Dokumente im Portal</div>
              <MieterDokumente mieterId={mieter.id} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Für diesen Mieter wurde noch kein Zugangscode erzeugt.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
