import { supabase } from "./client";
import type { Database } from "./types";
import type { Benachrichtigung } from "../store";

type Row = Database["public"]["Tables"]["benachrichtigungen"]["Row"];

function rowToBenachrichtigung(row: Row): Benachrichtigung {
  return {
    id: row.id,
    typ: row.typ,
    titel: row.titel,
    text: row.text ?? undefined,
    gelesen: row.gelesen,
    objektId: row.objekt_id ?? undefined,
    erstelltAm: row.erstellt_am,
  };
}

export async function fetchBenachrichtigungen(): Promise<Benachrichtigung[]> {
  const { data, error } = await supabase
    .from("benachrichtigungen")
    .select("*")
    .order("erstellt_am", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map(rowToBenachrichtigung);
}

export async function markiereBenachrichtigungGelesenRow(id: string, gelesen = true) {
  const { error } = await supabase.from("benachrichtigungen").update({ gelesen }).eq("id", id);
  if (error) throw error;
}

export async function markiereAlleBenachrichtigungenGelesenRow() {
  const { error } = await supabase
    .from("benachrichtigungen")
    .update({ gelesen: true })
    .eq("gelesen", false);
  if (error) throw error;
}
