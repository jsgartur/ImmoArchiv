import { supabase } from "./client";
import { effektiverEigentuemerId } from "./team";
import type { Database } from "./types";
import type { Handwerker } from "../store";

type Row = Database["public"]["Tables"]["handwerker"]["Row"];
type Insert = Database["public"]["Tables"]["handwerker"]["Insert"];
type Update = Database["public"]["Tables"]["handwerker"]["Update"];

function rowToHandwerker(row: Row): Handwerker {
  return {
    id: row.id,
    name: row.name,
    gewerk: row.gewerk ?? undefined,
    telefon: row.telefon ?? undefined,
    email: row.email ?? undefined,
    notizen: row.notizen ?? undefined,
  };
}

function handwerkerToRow(h: Partial<Handwerker>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (h.name !== undefined) row.name = h.name;
  if (h.gewerk !== undefined) row.gewerk = h.gewerk;
  if (h.telefon !== undefined) row.telefon = h.telefon;
  if (h.email !== undefined) row.email = h.email;
  if (h.notizen !== undefined) row.notizen = h.notizen;
  return row;
}

export async function fetchHandwerker(): Promise<Handwerker[]> {
  const { data, error } = await supabase.from("handwerker").select("*").order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToHandwerker);
}

export async function insertHandwerker(id: string, h: Handwerker) {
  const user_id = await effektiverEigentuemerId();
  const row: Insert = { id, user_id, ...handwerkerToRow(h), name: h.name };
  const { error } = await supabase.from("handwerker").insert(row);
  if (error) throw error;
}

export async function updateHandwerkerRow(id: string, patch: Partial<Handwerker>) {
  const row: Update = handwerkerToRow(patch);
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("handwerker").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteHandwerkerRow(id: string) {
  const { error } = await supabase.from("handwerker").delete().eq("id", id);
  if (error) throw error;
}
