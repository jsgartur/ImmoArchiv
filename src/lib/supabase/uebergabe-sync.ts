import { supabase } from "./client";
import type { Database } from "./types";
import type { Uebergabeprotokoll, UebergabeRaum, Zaehlerstand } from "../store";

type Row = Database["public"]["Tables"]["uebergabeprotokolle"]["Row"];
type Insert = Database["public"]["Tables"]["uebergabeprotokolle"]["Insert"];
type Update = Database["public"]["Tables"]["uebergabeprotokolle"]["Update"];

function rowToProtokoll(row: Row): Uebergabeprotokoll {
  return {
    id: row.id,
    einheitId: row.einheit_id,
    mieterId: row.mieter_id ?? undefined,
    typ: row.typ,
    datum: row.datum,
    raeume: (row.raeume as unknown as UebergabeRaum[]) ?? [],
    zaehlerstaende: (row.zaehlerstaende as unknown as Zaehlerstand[]) ?? [],
    schluesselAnzahl: row.schluessel_anzahl ?? undefined,
    bemerkungen: row.bemerkungen ?? undefined,
    unterschriftMieter: row.unterschrift_mieter ?? undefined,
    unterschriftVermieter: row.unterschrift_vermieter ?? undefined,
    erstelltAm: row.erstellt_am,
  };
}

function protokollToRow(p: Partial<Uebergabeprotokoll>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (p.einheitId !== undefined) row.einheit_id = p.einheitId;
  if (p.mieterId !== undefined) row.mieter_id = p.mieterId || null;
  if (p.typ !== undefined) row.typ = p.typ;
  if (p.datum !== undefined) row.datum = p.datum;
  if (p.raeume !== undefined) row.raeume = p.raeume;
  if (p.zaehlerstaende !== undefined) row.zaehlerstaende = p.zaehlerstaende;
  if (p.schluesselAnzahl !== undefined) row.schluessel_anzahl = p.schluesselAnzahl;
  if (p.bemerkungen !== undefined) row.bemerkungen = p.bemerkungen;
  if (p.unterschriftMieter !== undefined) row.unterschrift_mieter = p.unterschriftMieter;
  if (p.unterschriftVermieter !== undefined) row.unterschrift_vermieter = p.unterschriftVermieter;
  if (p.erstelltAm !== undefined) row.erstellt_am = p.erstelltAm;
  return row;
}

export async function fetchUebergabeprotokolle(): Promise<Uebergabeprotokoll[]> {
  const { data, error } = await supabase
    .from("uebergabeprotokolle")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToProtokoll);
}

export async function insertUebergabeprotokoll(id: string, p: Uebergabeprotokoll) {
  const row: Insert = { id, ...protokollToRow(p), einheit_id: p.einheitId, typ: p.typ };
  const { error } = await supabase.from("uebergabeprotokolle").insert(row);
  if (error) throw error;
}

export async function updateUebergabeprotokollRow(id: string, patch: Partial<Uebergabeprotokoll>) {
  const row: Update = protokollToRow(patch);
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("uebergabeprotokolle").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteUebergabeprotokollRow(id: string) {
  const { error } = await supabase.from("uebergabeprotokolle").delete().eq("id", id);
  if (error) throw error;
}
