import { supabase } from "./client";
import type { Database } from "./types";
import type { Aufgabe } from "../store";

type Row = Database["public"]["Tables"]["aufgaben"]["Row"];
type Insert = Database["public"]["Tables"]["aufgaben"]["Insert"];
type Update = Database["public"]["Tables"]["aufgaben"]["Update"];

function rowToAufgabe(row: Row): Aufgabe {
  return {
    id: row.id,
    titel: row.titel,
    beschreibung: row.beschreibung ?? undefined,
    kategorie: row.kategorie,
    faelligkeit: row.faelligkeit ?? undefined,
    objektId: row.objekt_id ?? undefined,
    erledigt: row.erledigt,
    erstelltAm: row.erstellt_am,
  };
}

function aufgabeToRow(a: Partial<Aufgabe>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (a.titel !== undefined) row.titel = a.titel;
  if (a.beschreibung !== undefined) row.beschreibung = a.beschreibung;
  if (a.kategorie !== undefined) row.kategorie = a.kategorie;
  if (a.faelligkeit !== undefined) row.faelligkeit = a.faelligkeit || null;
  if (a.objektId !== undefined) row.objekt_id = a.objektId || null;
  if (a.erledigt !== undefined) row.erledigt = a.erledigt;
  if (a.erstelltAm !== undefined) row.erstellt_am = a.erstelltAm;
  return row;
}

export async function fetchAufgaben(): Promise<Aufgabe[]> {
  const { data, error } = await supabase.from("aufgaben").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToAufgabe);
}

export async function insertAufgabe(id: string, a: Aufgabe) {
  const row: Insert = { id, ...aufgabeToRow(a), titel: a.titel };
  const { error } = await supabase.from("aufgaben").insert(row);
  if (error) throw error;
}

export async function updateAufgabeRow(id: string, patch: Partial<Aufgabe>) {
  const row: Update = aufgabeToRow(patch);
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("aufgaben").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteAufgabeRow(id: string) {
  const { error } = await supabase.from("aufgaben").delete().eq("id", id);
  if (error) throw error;
}

/** Löscht alle Aufgaben des angemeldeten Nutzers (auch die ohne Objektbezug). */
export async function deleteAllAufgaben() {
  const { error } = await supabase.from("aufgaben").delete().not("id", "is", null);
  if (error) throw error;
}
