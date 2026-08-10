import { supabase } from "./client";
import type { Database } from "./types";
import type { Mietzahlung } from "../store";

type Row = Database["public"]["Tables"]["mietzahlungen"]["Row"];

function rowToMietzahlung(row: Row): Mietzahlung {
  return {
    mieterId: row.mieter_id ?? "",
    monat: row.monat,
    betrag: Number(row.betrag),
    bezahltAm: row.bezahlt_am,
  };
}

export async function fetchMietzahlungen(): Promise<Mietzahlung[]> {
  const { data, error } = await supabase.from("mietzahlungen").select("*").not("mieter_id", "is", null);
  if (error) throw error;
  return (data ?? []).map(rowToMietzahlung);
}

/** Eine Zahlung je (mieter_id, monat) – erneutes Markieren überschreibt den bestehenden Eintrag. */
export async function upsertMietzahlung(z: Mietzahlung) {
  const { error } = await supabase
    .from("mietzahlungen")
    .upsert(
      { mieter_id: z.mieterId, monat: z.monat, betrag: z.betrag, bezahlt_am: z.bezahltAm },
      { onConflict: "mieter_id,monat" },
    );
  if (error) throw error;
}

export async function deleteMietzahlung(mieterId: string, monat: string) {
  const { error } = await supabase
    .from("mietzahlungen")
    .delete()
    .eq("mieter_id", mieterId)
    .eq("monat", monat);
  if (error) throw error;
}
