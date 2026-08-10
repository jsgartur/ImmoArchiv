// Mieterportal – Edge Function: liefert die für den Mieter freigegebenen Daten
// (eigene Einheit, eigene Mängel, Dokumente, Nebenkostenabrechnung, Vermieter-Kontakt,
// Mietzahlungen des Objekts) anhand des Codes.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

// ---------------------------------------------------------------------------
// Nebenkosten-Berechnung (portierte Kopie der Logik aus src/lib/nebenkosten.ts,
// hier ohne Modul-Import, da die Edge Function als Einzeldatei im Dashboard
// eingefügt wird). Liefert absichtlich NUR das Ergebnis der eigenen Partei
// zurück – nie die Rohdaten anderer Mieter.
// ---------------------------------------------------------------------------
interface NkPosition { id: string; bezeichnung: string; betrag: number; schluessel: "wohnflaeche" | "personen" | "einheiten" }
interface NkPartei { id: string; name: string; wohnflaeche: number; personen: number; nkVorausMonat?: number; einzug?: string; auszug?: string; vorauszahlung?: number }

const round2 = (n: number) => Math.round(n * 100) / 100;
const TAG = 86400000;
const utc = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const tageImMonat = (y: number, m0: number) => new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();

function gewicht(p: NkPartei, schluessel: NkPosition["schluessel"]): number {
  if (schluessel === "wohnflaeche") return p.wohnflaeche || 0;
  if (schluessel === "personen") return p.personen || 0;
  return 1;
}

function anteiligeMonate(von: string, bis: string, einzug?: string, auszug?: string): number {
  if (!von || !bis) return 0;
  const zeitraumStart = utc(von);
  const zeitraumEnde = utc(bis);
  const occStart = einzug ? Math.max(zeitraumStart, utc(einzug)) : zeitraumStart;
  const occEnde = auszug ? Math.min(zeitraumEnde, utc(auszug)) : zeitraumEnde;
  if (occEnde < occStart) return 0;

  let total = 0;
  const startDate = new Date(zeitraumStart);
  let y = startDate.getUTCFullYear();
  let m = startDate.getUTCMonth();
  const endDate = new Date(zeitraumEnde);
  const endY = endDate.getUTCFullYear();
  const endM = endDate.getUTCMonth();

  while (y < endY || (y === endY && m <= endM)) {
    const dim = tageImMonat(y, m);
    const monatStart = Date.UTC(y, m, 1);
    const monatEnde = Date.UTC(y, m, dim);
    const s = Math.max(monatStart, occStart);
    const e = Math.min(monatEnde, occEnde);
    if (e >= s) total += (Math.round((e - s) / TAG) + 1) / dim;
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return Math.round(total * 100) / 100;
}

function gezahlteVorauszahlung(von: string, bis: string, p: NkPartei) {
  const monate = anteiligeMonate(von, bis, p.einzug, p.auszug);
  if (p.nkVorausMonat != null) return { monate, gesamt: round2(p.nkVorausMonat * monate) };
  const gesamt = p.vorauszahlung || 0;
  return { monate, gesamt };
}

/** Berechnet das Ergebnis für genau eine Partei einer Abrechnung (Gewichte berücksichtigen aber alle Parteien). */
function berechneFuerPartei(positionen: NkPosition[], parteien: NkPartei[], zielId: string, von: string, bis: string) {
  const ziel = parteien.find((p) => p.id === zielId);
  if (!ziel) return null;

  const anteile = positionen.map((pos) => {
    const summeGewicht = parteien.reduce((s, p) => s + gewicht(p, pos.schluessel), 0);
    const w = gewicht(ziel, pos.schluessel);
    const anteil = summeGewicht > 0 ? pos.betrag * (w / summeGewicht) : parteien.length > 0 ? pos.betrag / parteien.length : 0;
    return { bezeichnung: pos.bezeichnung, schluessel: pos.schluessel, anteil: round2(anteil) };
  });

  const gesamtKosten = round2(anteile.reduce((s, a) => s + a.anteil, 0));
  const vz = gezahlteVorauszahlung(von, bis, ziel);
  return {
    anteile,
    gesamtKosten,
    vorauszahlung: vz.gesamt,
    saldo: round2(vz.gesamt - gesamtKosten),
    wohnflaeche: ziel.wohnflaeche,
    personen: ziel.personen,
  };
}

/** Weicher Namensabgleich (nicht kryptographisch) – gleiche Regel wie beim Portal-Login. */
function normName(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { code } = await req.json();
    if (!code) throw new Error("Code fehlt.");

    const { data: mieter, error: mieterError } = await adminClient
      .from("mieter")
      .select("id, name, einheit_id, mietbeginn, mietende, kaltmiete, nebenkosten")
      .eq("portal_code", code.trim().toUpperCase())
      .maybeSingle();
    if (mieterError) throw mieterError;
    if (!mieter) throw new Error("Ungültiger Code.");

    const { data: einheit, error: einheitError } = await adminClient
      .from("einheiten")
      .select("id, bezeichnung, objekt_id")
      .eq("id", mieter.einheit_id)
      .maybeSingle();
    if (einheitError) throw einheitError;

    const { data: objekt, error: objektError } = await adminClient
      .from("objekte")
      .select("id, adresse, strasse, stadt, plz, user_id")
      .eq("id", einheit?.objekt_id ?? "")
      .maybeSingle();
    if (objektError) throw objektError;
    if (!objekt) throw new Error("Objekt nicht gefunden.");

    const { data: maengel, error: maengelError } = await adminClient
      .from("maengel")
      .select("id, titel, beschreibung, status, prioritaet, gemeldet_am")
      .eq("einheit_id", mieter.einheit_id)
      .order("gemeldet_am", { ascending: false });
    if (maengelError) throw maengelError;

    const { data: mietzahlungen, error: zahlungenError } = await adminClient
      .from("mietzahlungen")
      .select("monat, betrag, bezahlt_am")
      .eq("mieter_id", mieter.id)
      .order("monat", { ascending: false })
      .limit(12);
    if (zahlungenError) throw zahlungenError;

    const { data: dokumenteRows, error: dokumenteError } = await adminClient
      .from("dokumente")
      .select("id, name, kategorie, storage_path, hochgeladen_am")
      .eq("mieter_id", mieter.id)
      .order("hochgeladen_am", { ascending: false });
    if (dokumenteError) throw dokumenteError;

    const dokumente = [];
    for (const d of dokumenteRows ?? []) {
      const { data: signed } = await adminClient.storage.from("dokumente").createSignedUrl(d.storage_path, 3600);
      dokumente.push({ id: d.id, name: d.name, kategorie: d.kategorie, hochgeladenAm: d.hochgeladen_am, url: signed?.signedUrl ?? null });
    }

    const { data: uebergabeRows, error: uebergabeError } = await adminClient
      .from("uebergabeprotokolle")
      .select("id, typ, datum, raeume, zaehlerstaende, schluessel_anzahl, bemerkungen, unterschrift_mieter, unterschrift_vermieter")
      .eq("einheit_id", mieter.einheit_id)
      .order("datum", { ascending: false });
    if (uebergabeError) throw uebergabeError;

    const uebergabeprotokolle = (uebergabeRows ?? []).map((p) => ({
      id: p.id,
      typ: p.typ,
      datum: p.datum,
      raeume: p.raeume ?? [],
      zaehlerstaende: p.zaehlerstaende ?? [],
      schluesselAnzahl: p.schluessel_anzahl,
      bemerkungen: p.bemerkungen,
      unterschriftMieter: p.unterschrift_mieter,
      unterschriftVermieter: p.unterschrift_vermieter,
    }));

    // Vermieter-Kontakt (für Rückfragen abseits von Mängelmeldungen)
    const { data: profil } = await adminClient
      .from("profiles")
      .select("vorname, nachname, email, telefon, firma")
      .eq("id", objekt.user_id)
      .maybeSingle();

    // Nebenkostenabrechnungen des Objekts, in denen diese Partei (per Namensabgleich) vorkommt
    const { data: abrechnungenRows, error: abrechnungenError } = await adminClient
      .from("abrechnungen")
      .select("id, titel, von, bis, positionen, parteien")
      .eq("objekt_id", objekt.id)
      .order("bis", { ascending: false });
    if (abrechnungenError) throw abrechnungenError;

    const abrechnungen = [];
    for (const a of abrechnungenRows ?? []) {
      const parteien = (a.parteien ?? []) as NkPartei[];
      const partei = parteien.find((p) => normName(p.name) === normName(mieter.name));
      if (!partei) continue;
      const ergebnis = berechneFuerPartei((a.positionen ?? []) as NkPosition[], parteien, partei.id, a.von, a.bis);
      if (!ergebnis) continue;
      abrechnungen.push({ id: a.id, titel: a.titel, von: a.von, bis: a.bis, ...ergebnis });
    }

    return new Response(
      JSON.stringify({
        mieter: { name: mieter.name, mietbeginn: mieter.mietbeginn, mietende: mieter.mietende, kaltmiete: mieter.kaltmiete, nebenkosten: mieter.nebenkosten },
        einheit: einheit ? { bezeichnung: einheit.bezeichnung } : null,
        objekt: objekt ? { adresse: objekt.adresse, strasse: objekt.strasse, stadt: objekt.stadt, plz: objekt.plz } : null,
        vermieter: profil
          ? { name: [profil.vorname, profil.nachname].filter(Boolean).join(" ") || profil.firma || "Vermieter", email: profil.email, telefon: profil.telefon, firma: profil.firma }
          : null,
        maengel: maengel ?? [],
        mietzahlungen: mietzahlungen ?? [],
        dokumente,
        abrechnungen,
        uebergabeprotokolle,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
