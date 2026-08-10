// Echte Storage-Bilder je Objekt — Bucket "objekt-bilder". `Objekt.bilder` speichert
// nur noch die Storage-Pfade (sortiert, erstes = Titelbild), nicht mehr die Base64-Daten
// selbst. Anzeige erfordert signierte URLs, da der Bucket privat ist (siehe ObjektBild-Komponente).
import { supabase } from "./supabase/client";

export const MAX_BILD_BYTES = 20 * 1024 * 1024; // 20 MB pro Bild (Original vor Komprimierung)
const MAX_KANTE = 1600; // längste Kante in px
const BUCKET = "objekt-bilder";

/** Lädt ein Bild und verkleinert es zu einem komprimierten JPEG-Blob. */
function verkleinereZuBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const skala = Math.min(1, MAX_KANTE / Math.max(img.width, img.height));
        const w = Math.round(img.width * skala);
        const h = Math.round(img.height * skala);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas nicht verfügbar"));
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Bild konnte nicht komprimiert werden"))),
          "image/jpeg",
          0.82,
        );
      };
      img.onerror = () => reject(new Error("Bild konnte nicht geladen werden"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Verkleinert + lädt Bilder in den Storage-Bucket "objekt-bilder" hoch, liefert die Storage-Pfade zurück. */
export async function ladeBilderHoch(
  objektId: string,
  files: FileList | File[],
): Promise<{ pfade: string[]; uebersprungen: number }> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const arr = Array.from(files);
  const pfade: string[] = [];
  let uebersprungen = 0;
  for (const file of arr) {
    if (!file.type.startsWith("image/") || file.size > MAX_BILD_BYTES) {
      uebersprungen++;
      continue;
    }
    const blob = await verkleinereZuBlob(file);
    const pfad = `${userData.user.id}/${objektId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(pfad, blob, { contentType: "image/jpeg" });
    if (error) throw error;
    pfade.push(pfad);
  }
  return { pfade, uebersprungen };
}

/** Signierte, zeitlich begrenzte URL zum Anzeigen eines Objekt-Bildes (Bucket ist privat). */
export async function signierteBildUrl(pfad: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(pfad, 3600);
  if (error) throw error;
  return data.signedUrl;
}
