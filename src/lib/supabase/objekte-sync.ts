import { supabase } from "./client";
import type { Database, SondertilgungRow } from "./types";
import type { Objekt } from "../store";

type ObjektRow = Database["public"]["Tables"]["objekte"]["Row"];
type ObjektInsert = Database["public"]["Tables"]["objekte"]["Insert"];
type ObjektUpdate = Database["public"]["Tables"]["objekte"]["Update"];

const num = (v: unknown): number | undefined => (v == null ? undefined : Number(v));

/** PostgREST liefert `numeric`-Spalten als String – hier zu echten JS-Zahlen mappen. */
export function rowToObjekt(row: ObjektRow): Objekt {
  return {
    id: row.id,
    adresse: row.adresse,
    strasse: row.strasse ?? undefined,
    hausnummer: row.hausnummer ?? undefined,
    plz: row.plz ?? undefined,
    stadt: row.stadt ?? undefined,
    land: row.land ?? undefined,
    typ: row.typ,
    baujahr: num(row.baujahr),
    gesamtwohnflaeche: num(row.gesamtwohnflaeche),
    grundstuecksflaeche: num(row.grundstuecksflaeche),
    anzahlEinheiten: num(row.anzahl_einheiten),
    stockwerk: row.stockwerk ?? undefined,
    kaufpreis: num(row.kaufpreis),
    kaufdatum: row.kaufdatum ?? undefined,
    kaufnebenkosten: num(row.kaufnebenkosten),
    marktwert: num(row.marktwert),
    eigenkapital: num(row.eigenkapital),
    darlehensbetrag: num(row.darlehensbetrag),
    zinssatz: num(row.zinssatz),
    monatlicheRate: num(row.monatliche_rate),
    bausparBetragMonat: num(row.bauspar_betrag_monat),
    finanzierungsbeginn: row.finanzierungsbeginn ?? undefined,
    bank: row.bank ?? undefined,
    zinsbindungBis: row.zinsbindung_bis ?? undefined,
    versicherungAblauf: row.versicherung_ablauf ?? undefined,
    energieausweisGueltigBis: row.energieausweis_gueltig_bis ?? undefined,
    sondertilgungen: (row.sondertilgungen as SondertilgungRow[]) ?? [],
    grundstuecksanteilProzent: num(row.grundstuecksanteil_prozent),
    afaSatz: num(row.afa_satz),
    laufendeKostenMonat: num(row.laufende_kosten_monat),
    vermietet: row.vermietet,
    istKaltmiete: num(row.ist_kaltmiete),
    zielKaltmiete: num(row.ziel_kaltmiete),
    nebenkostenVorauszahlung: num(row.nebenkosten_vorauszahlung),
    bilder: row.bilder ?? [],
  };
}

function objektToRow(o: Partial<Objekt>): Omit<ObjektInsert, "adresse"> & { adresse?: string } {
  const row: Record<string, unknown> = {};
  if (o.adresse !== undefined) row.adresse = o.adresse;
  if (o.strasse !== undefined) row.strasse = o.strasse;
  if (o.hausnummer !== undefined) row.hausnummer = o.hausnummer;
  if (o.plz !== undefined) row.plz = o.plz;
  if (o.stadt !== undefined) row.stadt = o.stadt;
  if (o.land !== undefined) row.land = o.land;
  if (o.typ !== undefined) row.typ = o.typ;
  if (o.baujahr !== undefined) row.baujahr = o.baujahr;
  if (o.gesamtwohnflaeche !== undefined) row.gesamtwohnflaeche = o.gesamtwohnflaeche;
  if (o.grundstuecksflaeche !== undefined) row.grundstuecksflaeche = o.grundstuecksflaeche;
  if (o.anzahlEinheiten !== undefined) row.anzahl_einheiten = o.anzahlEinheiten;
  if (o.stockwerk !== undefined) row.stockwerk = o.stockwerk;
  if (o.kaufpreis !== undefined) row.kaufpreis = o.kaufpreis;
  if (o.kaufdatum !== undefined) row.kaufdatum = o.kaufdatum || null;
  if (o.kaufnebenkosten !== undefined) row.kaufnebenkosten = o.kaufnebenkosten;
  if (o.marktwert !== undefined) row.marktwert = o.marktwert;
  if (o.eigenkapital !== undefined) row.eigenkapital = o.eigenkapital;
  if (o.darlehensbetrag !== undefined) row.darlehensbetrag = o.darlehensbetrag;
  if (o.zinssatz !== undefined) row.zinssatz = o.zinssatz;
  if (o.monatlicheRate !== undefined) row.monatliche_rate = o.monatlicheRate;
  if (o.bausparBetragMonat !== undefined) row.bauspar_betrag_monat = o.bausparBetragMonat;
  if (o.finanzierungsbeginn !== undefined) row.finanzierungsbeginn = o.finanzierungsbeginn || null;
  if (o.bank !== undefined) row.bank = o.bank;
  if (o.zinsbindungBis !== undefined) row.zinsbindung_bis = o.zinsbindungBis || null;
  if (o.versicherungAblauf !== undefined) row.versicherung_ablauf = o.versicherungAblauf || null;
  if (o.energieausweisGueltigBis !== undefined) row.energieausweis_gueltig_bis = o.energieausweisGueltigBis || null;
  if (o.sondertilgungen !== undefined) row.sondertilgungen = o.sondertilgungen;
  if (o.grundstuecksanteilProzent !== undefined) row.grundstuecksanteil_prozent = o.grundstuecksanteilProzent;
  if (o.afaSatz !== undefined) row.afa_satz = o.afaSatz;
  if (o.laufendeKostenMonat !== undefined) row.laufende_kosten_monat = o.laufendeKostenMonat;
  if (o.vermietet !== undefined) row.vermietet = o.vermietet;
  if (o.istKaltmiete !== undefined) row.ist_kaltmiete = o.istKaltmiete;
  if (o.zielKaltmiete !== undefined) row.ziel_kaltmiete = o.zielKaltmiete;
  if (o.nebenkostenVorauszahlung !== undefined) row.nebenkosten_vorauszahlung = o.nebenkostenVorauszahlung;
  if (o.bilder !== undefined) row.bilder = o.bilder;
  return row as Omit<ObjektInsert, "adresse"> & { adresse?: string };
}

export async function fetchObjekte(): Promise<Objekt[]> {
  const { data, error } = await supabase.from("objekte").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToObjekt);
}

export async function insertObjekt(id: string, o: Objekt) {
  const row: ObjektInsert = { id, ...objektToRow(o), adresse: o.adresse };
  const { error } = await supabase.from("objekte").insert(row);
  if (error) throw error;
}

export async function updateObjektRow(id: string, patch: Partial<Objekt>) {
  const row: ObjektUpdate = objektToRow(patch);
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("objekte").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteObjektRow(id: string) {
  const { error } = await supabase.from("objekte").delete().eq("id", id);
  if (error) throw error;
}

/** Löscht alle Objekte des angemeldeten Nutzers (z. B. vor dem Laden der Beispieldaten). */
export async function deleteAllObjekte() {
  const { error } = await supabase.from("objekte").delete().not("id", "is", null);
  if (error) throw error;
}
