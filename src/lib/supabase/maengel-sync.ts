import { supabase } from "./client";
import { STORAGE_BUCKETS } from "./client";
import { uploadFotos, signedFotoUrls } from "./storage";
import type { Database, VerlaufEintragRow } from "./types";
import type { Mangel } from "../store";

type MangelRow = Database["public"]["Tables"]["maengel"]["Row"];
type MangelInsert = Database["public"]["Tables"]["maengel"]["Insert"];
type MangelUpdate = Database["public"]["Tables"]["maengel"]["Update"];

const numOpt = (v: unknown): number | undefined => (v == null ? undefined : Number(v));

async function rowToMangel(row: MangelRow): Promise<Mangel> {
  const fotos = row.fotos.length > 0 ? await signedFotoUrls(STORAGE_BUCKETS.mangelFotos, row.fotos) : [];
  return {
    id: row.id,
    einheitId: row.einheit_id,
    titel: row.titel,
    beschreibung: row.beschreibung ?? "",
    status: row.status,
    prioritaet: row.prioritaet,
    fotos,
    gemeldetVon: row.gemeldet_von,
    gemeldetAm: row.gemeldet_am,
    handwerker: row.handwerker ?? undefined,
    kostenGeschaetzt: numOpt(row.kosten_geschaetzt),
    kostenTatsaechlich: numOpt(row.kosten_tatsaechlich),
    verlauf: row.verlauf as VerlaufEintragRow[],
  };
}

function mangelToRow(m: Partial<Mangel>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (m.einheitId !== undefined) row.einheit_id = m.einheitId;
  if (m.titel !== undefined) row.titel = m.titel;
  if (m.beschreibung !== undefined) row.beschreibung = m.beschreibung;
  if (m.status !== undefined) row.status = m.status;
  if (m.prioritaet !== undefined) row.prioritaet = m.prioritaet;
  if (m.gemeldetVon !== undefined) row.gemeldet_von = m.gemeldetVon;
  if (m.gemeldetAm !== undefined) row.gemeldet_am = m.gemeldetAm;
  if (m.handwerker !== undefined) row.handwerker = m.handwerker;
  if (m.kostenGeschaetzt !== undefined) row.kosten_geschaetzt = m.kostenGeschaetzt;
  if (m.kostenTatsaechlich !== undefined) row.kosten_tatsaechlich = m.kostenTatsaechlich;
  if (m.verlauf !== undefined) row.verlauf = m.verlauf;
  return row;
}

export async function fetchMaengel(): Promise<Mangel[]> {
  const { data, error } = await supabase.from("maengel").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return Promise.all((data ?? []).map(rowToMangel));
}

/** Fotos werden vor dem Insert als Base64 übergeben und hier in den Storage-Bucket hochgeladen. */
export async function insertMangel(id: string, m: Mangel) {
  const fotoPfade = m.fotos.length > 0 ? await uploadFotos(STORAGE_BUCKETS.mangelFotos, id, m.fotos) : [];
  const row: MangelInsert = {
    id,
    ...mangelToRow(m),
    einheit_id: m.einheitId,
    titel: m.titel,
    fotos: fotoPfade,
  };
  const { error } = await supabase.from("maengel").insert(row);
  if (error) throw error;
}

export async function updateMangelRow(id: string, patch: Partial<Mangel>) {
  const row: MangelUpdate = mangelToRow(patch);
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("maengel").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteMangelRow(id: string) {
  const { error } = await supabase.from("maengel").delete().eq("id", id);
  if (error) throw error;
}
