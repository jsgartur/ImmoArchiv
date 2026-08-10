// Echte Storage-Dokumente je Mieter (z.B. Mietvertrag) — Bucket "dokumente",
// Tabelle public.dokumente mit mieter_id gesetzt. Wird auf Abruf geladen
// (kein persistierter Store-Slice), da es sich um Dateien statt Stammdaten handelt.
import { supabase } from "./client";
import { effektiverEigentuemerId } from "./team";

const BUCKET = "dokumente";

export interface MieterDokument {
  id: string;
  name: string;
  kategorie: string;
  storagePath: string;
  groesse: number | null;
  hochgeladenAm: string;
}

export async function fetchMieterDokumente(mieterId: string): Promise<MieterDokument[]> {
  const { data, error } = await supabase
    .from("dokumente")
    .select("*")
    .eq("mieter_id", mieterId)
    .order("hochgeladen_am", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    kategorie: d.kategorie,
    storagePath: d.storage_path,
    groesse: d.groesse,
    hochgeladenAm: d.hochgeladen_am,
  }));
}

export async function uploadMieterDokument(
  mieterId: string,
  file: File,
  kategorie: string,
): Promise<MieterDokument> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const pfad = `${userData.user.id}/mieter/${mieterId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(pfad, file);
  if (uploadError) throw uploadError;

  const user_id = await effektiverEigentuemerId();
  const { data, error } = await supabase
    .from("dokumente")
    .insert({ user_id, mieter_id: mieterId, name: file.name, kategorie, storage_path: pfad, groesse: file.size })
    .select()
    .single();
  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    kategorie: data.kategorie,
    storagePath: data.storage_path,
    groesse: data.groesse,
    hochgeladenAm: data.hochgeladen_am,
  };
}

export async function deleteMieterDokument(id: string, storagePath: string) {
  await supabase.storage.from(BUCKET).remove([storagePath]);
  const { error } = await supabase.from("dokumente").delete().eq("id", id);
  if (error) throw error;
}

export async function signierteDokumentUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}
