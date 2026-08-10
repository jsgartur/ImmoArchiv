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
    plan: row.plan,
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
  const { stripeCustomerId: _stripeCustomerId, ...rest } = patch;
  const row: ProfilUpdate = rest;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("profiles").update(row).eq("id", user.id);
  if (error) throw error;
}
