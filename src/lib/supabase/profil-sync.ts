import { supabase } from "./client";
import type { Database } from "./types";
import type { Profil } from "../store";

type ProfilRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfilUpdate = Database["public"]["Tables"]["profiles"]["Update"];

function rowToProfil(row: ProfilRow): Profil {
  return {
    anrede: row.anrede ?? "",
    vorname: row.vorname ?? "",
    nachname: row.nachname ?? "",
    geburtsdatum: row.geburtsdatum ?? "",
    email: row.email ?? "",
    telefon: row.telefon ?? "",
    firma: row.firma ?? "",
    strasse: row.strasse ?? "",
    plz: row.plz ?? "",
    ort: row.ort ?? "",
    land: row.land ?? "Deutschland",
    kontotyp: row.kontotyp ?? "privat",
    plan: row.plan,
    avatarUrl: row.avatar_url ?? undefined,
    kontoinhaber: row.kontoinhaber ?? undefined,
    iban: row.iban ?? undefined,
    bic: row.bic ?? undefined,
    stripeCustomerId: row.stripe_customer_id ?? undefined,
  };
}

/** Lädt das Profil des angemeldeten Nutzers; legt keine Zeile an (das übernimmt der Signup-Trigger). */
export async function fetchProfil(): Promise<Profil | null> {
  const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
  if (error) throw error;
  return data ? rowToProfil(data) : null;
}

/** stripeCustomerId wird ausschließlich serverseitig über den Stripe-Webhook gepflegt. */
export async function updateProfilRow(patch: Partial<Profil>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht angemeldet");
  const { stripeCustomerId: _stripeCustomerId, avatarUrl, ...rest } = patch;
  const row: ProfilUpdate = { ...rest };
  if (avatarUrl !== undefined) row.avatar_url = avatarUrl;
  // "date"-Spalte lehnt leere Strings ab – wie bei den übrigen Datumsfeldern im Projekt üblich.
  if (row.geburtsdatum !== undefined) row.geburtsdatum = row.geburtsdatum || null;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("profiles").update(row).eq("id", user.id);
  if (error) throw error;
}
