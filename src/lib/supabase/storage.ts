import { supabase } from "./client";

function dataUrlToBlob(dataUrl: string): { blob: Blob; ext: string } {
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/data:(.*);base64/)?.[1] ?? "image/jpeg";
  const ext = mime.split("/")[1] ?? "jpg";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { blob: new Blob([bytes], { type: mime }), ext };
}

/** Lädt Base64-Fotos in einen privaten Storage-Bucket hoch und liefert die Speicherpfade zurück. */
export async function uploadFotos(bucket: string, ordnerId: string, dataUrls: string[]): Promise<string[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht angemeldet");

  const paths: string[] = [];
  for (let i = 0; i < dataUrls.length; i++) {
    const { blob, ext } = dataUrlToBlob(dataUrls[i]);
    const path = `${user.id}/${ordnerId}/${Date.now()}-${i}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: blob.type });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}

/** Erzeugt temporäre, signierte URLs zum Anzeigen von Fotos aus einem privaten Bucket. */
export async function signedFotoUrls(bucket: string, paths: string[]): Promise<string[]> {
  if (paths.length === 0) return [];
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(paths, 3600);
  if (error) throw error;
  return (data ?? []).map((d) => d.signedUrl ?? "");
}
