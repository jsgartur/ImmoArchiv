import { useRef, useState } from "react";
import { ImagePlus, Trash2, X, ImageOff, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useStore } from "@/lib/store";
import { ladeBilderHoch } from "@/lib/bild-utils";
import { ObjektBild } from "@/components/objekt-bild";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const LEER: string[] = [];

export function Bilder({ objektId }: { objektId: string }) {
  const bilder = useStore((s) => s.objekte.find((o) => o.id === objektId)?.bilder ?? LEER);
  const addBilder = useStore((s) => s.addBilder);
  const removeBild = useStore((s) => s.removeBild);
  const insertBild = useStore((s) => s.insertBild);
  const moveBild = useStore((s) => s.moveBild);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const { pfade, uebersprungen } = await ladeBilderHoch(objektId, files);
      if (pfade.length) {
        addBilder(objektId, pfade);
        toast.success(`${pfade.length} Bild(er) hinzugefügt`);
      }
      if (uebersprungen > 0) toast.error(`${uebersprungen} Datei(en) übersprungen (kein Bild oder > 20 MB).`);
    } catch {
      toast.error("Bild konnte nicht hochgeladen werden.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const loeschen = (index: number) => {
    const pfad = bilder[index];
    removeBild(objektId, index);
    toast("Bild gelöscht", {
      action: { label: "Rückgängig", onClick: () => insertBild(objektId, index, pfad) },
    });
  };

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Bilder</div>
          <p className="text-xs text-muted-foreground">
            Fotos vom Objekt, Innen- und Außenansichten. Das erste Bild ist das Titelbild in der Objekte-Liste.
          </p>
        </div>
        <Button variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
          <ImagePlus className="h-4 w-4" /> {busy ? "Lädt …" : "Bilder hinzufügen"}
        </Button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
      </div>

      {bilder.length === 0 ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-sm text-muted-foreground transition hover:border-primary hover:text-foreground"
        >
          <ImageOff className="h-8 w-8" />
          Noch keine Bilder — hier klicken zum Hochladen.
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {bilder.map((pfad, i) => (
            <div key={pfad} className="group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
              <ObjektBild
                pfad={pfad}
                alt={`Objektbild ${i + 1}`}
                className="h-full w-full cursor-zoom-in object-cover"
                onClick={() => setLightbox(i)}
              />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-md bg-background/85 px-1.5 py-0.5 text-[10px] font-medium">
                  <Star className="h-3 w-3 fill-current" /> Titelbild
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
                <div className="flex gap-1">
                  <button
                    aria-label="Nach vorne verschieben"
                    disabled={i === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveBild(objektId, i, -1);
                    }}
                    className="grid h-6 w-6 place-items-center rounded bg-background/80 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    aria-label="Nach hinten verschieben"
                    disabled={i === bilder.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveBild(objektId, i, 1);
                    }}
                    className="grid h-6 w-6 place-items-center rounded bg-background/80 disabled:opacity-30"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  aria-label="Bild löschen"
                  onClick={(e) => {
                    e.stopPropagation();
                    loeschen(i);
                  }}
                  className="grid h-6 w-6 place-items-center rounded bg-background/80"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox != null && bilder[lightbox] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button aria-label="Schließen" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-md bg-background/20 text-white">
            <X className="h-5 w-5" />
          </button>
          <ObjektBild pfad={bilder[lightbox]} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
}
