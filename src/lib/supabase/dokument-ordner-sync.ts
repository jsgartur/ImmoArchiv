// Ordnerstruktur für Dokumente je Objekt — wird auf Abruf geladen (kein Store-Slice),
// analog zu objekt-dokumente-sync.ts.
import { supabase } from "./client";
import { effektiverEigentuemerId } from "./team";

export interface DokumentOrdner {
  id: string;
  objektId: string;
  parentId: string | null;
  name: string;
  erstelltAm: string;
}

export async function fetchOrdner(objektId: string): Promise<DokumentOrdner[]> {
  const { data, error } = await supabase
    .from("dokument_ordner")
    .select("*")
    .eq("objekt_id", objektId)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((o) => ({
    id: o.id,
    objektId: o.objekt_id,
    parentId: o.parent_id,
    name: o.name,
    erstelltAm: o.erstellt_am,
  }));
}

export async function erstelleOrdner(
  objektId: string,
  name: string,
  parentId: string | null,
): Promise<DokumentOrdner> {
  const user_id = await effektiverEigentuemerId();
  const { data, error } = await supabase
    .from("dokument_ordner")
    .insert({ user_id, objekt_id: objektId, parent_id: parentId, name })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    objektId: data.objekt_id,
    parentId: data.parent_id,
    name: data.name,
    erstelltAm: data.erstellt_am,
  };
}

export async function loescheOrdner(id: string) {
  const { error } = await supabase.from("dokument_ordner").delete().eq("id", id);
  if (error) throw error;
}
