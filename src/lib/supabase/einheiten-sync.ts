import { supabase } from "./client";
import { effektiverEigentuemerId } from "./team";
import type { Database } from "./types";
import type { Einheit } from "../store";

type EinheitRow = Database["public"]["Tables"]["einheiten"]["Row"];
type EinheitInsert = Database["public"]["Tables"]["einheiten"]["Insert"];
type EinheitUpdate = Database["public"]["Tables"]["einheiten"]["Update"];

const num = (v: unknown): number => (v == null ? 0 : Number(v));

function rowToEinheit(row: EinheitRow): Einheit {
  return {
    id: row.id,
    objektId: row.objekt_id,
    bezeichnung: row.bezeichnung,
    wohnflaeche: num(row.wohnflaeche),
    zimmer: num(row.zimmer),
    stockwerk: row.stockwerk ?? undefined,
  };
}

function einheitToRow(e: Partial<Einheit>): Partial<EinheitInsert> {
  const row: Record<string, unknown> = {};
  if (e.objektId !== undefined) row.objekt_id = e.objektId;
  if (e.bezeichnung !== undefined) row.bezeichnung = e.bezeichnung;
  if (e.wohnflaeche !== undefined) row.wohnflaeche = e.wohnflaeche;
  if (e.zimmer !== undefined) row.zimmer = e.zimmer;
  if (e.stockwerk !== undefined) row.stockwerk = e.stockwerk;
  return row;
}

export async function fetchEinheiten(): Promise<Einheit[]> {
  const { data, error } = await supabase.from("einheiten").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToEinheit);
}

export async function insertEinheit(id: string, e: Einheit) {
  const user_id = await effektiverEigentuemerId();
  const row: EinheitInsert = { id, user_id, ...einheitToRow(e), objekt_id: e.objektId, bezeichnung: e.bezeichnung };
  const { error } = await supabase.from("einheiten").insert(row);
  if (error) throw error;
}

export async function updateEinheitRow(id: string, patch: Partial<Einheit>) {
  const row: EinheitUpdate = einheitToRow(patch);
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("einheiten").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteEinheitRow(id: string) {
  const { error } = await supabase.from("einheiten").delete().eq("id", id);
  if (error) throw error;
}
