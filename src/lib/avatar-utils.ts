// Profilbild – Bucket "avatare" (privat). Analog zu bild-utils.ts, aber mit
// kleinerer Zielkante, da Avatare nur klein angezeigt werden.
import { supabase } from "./supabase/client";

export const MAX_AVATAR_BYTES = 8 * 1024 * 1024; // 8 MB Original vor Komprimierung
const MAX_KANTE = 400;
const BUCKET = "avatare";

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
          (blob) =>
            blob ? resolve(blob) : reject(new Error("Bild konnte nicht komprimiert werden")),
          "image/jpeg",
          0.85,
        );
      };
      img.onerror = () => reject(new Error("Bild konnte nicht geladen werden"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Verkleinert + lädt ein neues Profilbild hoch, liefert den Storage-Pfad zurück. */
export async function ladeAvatarHoch(file: File): Promise<string> {
  if (!file.type.startsWith("image/") || file.size > MAX_AVATAR_BYTES) {
    throw new Error("Bitte ein Bild bis 8 MB auswählen.");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht angemeldet");

  const blob = await verkleinereZuBlob(file);
  const pfad = `${user.id}/profil-${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(pfad, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return pfad;
}

/** Signierte, zeitlich begrenzte URL zum Anzeigen des Profilbilds (Bucket ist privat). */
export async function signierteAvatarUrl(pfad: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(pfad, 3600);
  if (error) throw error;
  return data.signedUrl;
}
