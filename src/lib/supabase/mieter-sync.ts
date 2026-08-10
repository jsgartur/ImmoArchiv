import { supabase } from "./client";
import { effektiverEigentuemerId } from "./team";
import type { Database } from "./types";
import type { Mieter } from "../store";

type MieterRow = Database["public"]["Tables"]["mieter"]["Row"];
type MieterInsert = Database["public"]["Tables"]["mieter"]["Insert"];
type MieterUpdate = Database["public"]["Tables"]["mieter"]["Update"];

const num = (v: unknown): number => (v == null ? 0 : Number(v));
const numOpt = (v: unknown): number | undefined => (v == null ? undefined : Number(v));

function rowToMieter(row: MieterRow): Mieter {
  return {
    id: row.id,
    einheitId: row.einheit_id,
    name: row.name,
    kontakt: row.kontakt ?? undefined,
    telefon: row.telefon ?? undefined,
    email: row.email ?? undefined,
    mietbeginn: row.mietbeginn ?? "",
    mietende: row.mietende ?? undefined,
    kaltmiete: num(row.kaltmiete),
    nebenkosten: num(row.nebenkosten),
    kaution: numOpt(row.kaution),
    portalCode: row.portal_code ?? undefined,
  };
}

function mieterToRow(m: Partial<Mieter>): Partial<MieterInsert> {
  const row: Record<string, unknown> = {};
  if (m.einheitId !== undefined) row.einheit_id = m.einheitId;
  if (m.name !== undefined) row.name = m.name;
  if (m.kontakt !== undefined) row.kontakt = m.kontakt;
  if (m.telefon !== undefined) row.telefon = m.telefon;
  if (m.email !== undefined) row.email = m.email;
  if (m.mietbeginn !== undefined) row.mietbeginn = m.mietbeginn || null;
  if (m.mietende !== undefined) row.mietende = m.mietende || null;
  if (m.kaltmiete !== undefined) row.kaltmiete = m.kaltmiete;
  if (m.nebenkosten !== undefined) row.nebenkosten = m.nebenkosten;
  if (m.kaution !== undefined) row.kaution = m.kaution;
  if (m.portalCode !== undefined) row.portal_code = m.portalCode;
  return row;
}

export async function fetchMieter(): Promise<Mieter[]> {
  const { data, error } = await supabase.from("mieter").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToMieter);
}

export async function insertMieter(id: string, m: Mieter) {
  const user_id = await effektiverEigentuemerId();
  const row: MieterInsert = { id, user_id, ...mieterToRow(m), einheit_id: m.einheitId, name: m.name };
  const { error } = await supabase.from("mieter").insert(row);
  if (error) throw error;
}

export async function updateMieterRow(id: string, patch: Partial<Mieter>) {
  const row: MieterUpdate = mieterToRow(patch);
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("mieter").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteMieterRow(id: string) {
  const { error } = await supabase.from("mieter").delete().eq("id", id);
  if (error) throw error;
}
