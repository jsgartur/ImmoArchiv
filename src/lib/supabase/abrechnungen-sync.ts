import { supabase } from "./client";
import { effektiverEigentuemerId } from "./team";
import type { Database } from "./types";
import type { Abrechnung, NkPartei, NkPosition } from "../store";

type Row = Database["public"]["Tables"]["abrechnungen"]["Row"];
type Insert = Database["public"]["Tables"]["abrechnungen"]["Insert"];
type Update = Database["public"]["Tables"]["abrechnungen"]["Update"];

function rowToAbrechnung(row: Row): Abrechnung {
  return {
    id: row.id,
    objektId: row.objekt_id,
    titel: row.titel,
    von: row.von ?? "",
    bis: row.bis ?? "",
    positionen: (row.positionen as unknown as NkPosition[]) ?? [],
    parteien: (row.parteien as unknown as NkPartei[]) ?? [],
    briefpapier: row.briefpapier ?? "klassisch",
    erstelltAm: row.erstellt_am,
  };
}

function abrechnungToRow(a: Partial<Abrechnung>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (a.objektId !== undefined) row.objekt_id = a.objektId;
  if (a.titel !== undefined) row.titel = a.titel;
  if (a.von !== undefined) row.von = a.von || null;
  if (a.bis !== undefined) row.bis = a.bis || null;
  if (a.positionen !== undefined) row.positionen = a.positionen;
  if (a.parteien !== undefined) row.parteien = a.parteien;
  if (a.briefpapier !== undefined) row.briefpapier = a.briefpapier;
  if (a.erstelltAm !== undefined) row.erstellt_am = a.erstelltAm;
  return row;
}

export async function fetchAbrechnungen(): Promise<Abrechnung[]> {
  const { data, error } = await supabase
    .from("abrechnungen")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToAbrechnung);
}

export async function insertAbrechnung(id: string, a: Abrechnung) {
  const user_id = await effektiverEigentuemerId();
  const row: Insert = { id, user_id, ...abrechnungToRow(a), objekt_id: a.objektId, titel: a.titel };
  const { error } = await supabase.from("abrechnungen").insert(row);
  if (error) throw error;
}

export async function updateAbrechnungRow(id: string, patch: Partial<Abrechnung>) {
  const row: Update = abrechnungToRow(patch);
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("abrechnungen").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteAbrechnungRow(id: string) {
  const { error } = await supabase.from("abrechnungen").delete().eq("id", id);
  if (error) throw error;
}
