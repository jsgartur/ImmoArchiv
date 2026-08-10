import { supabase } from "./client";
import type { Database } from "./types";

export type TeamRolle = "owner" | "mitglied";
export type TeamStatus = "eingeladen" | "aktiv";

export interface TeamMitglied {
  id: string;
  email: string;
  rolle: TeamRolle;
  status: TeamStatus;
  erstelltAm: string;
}

type Row = Database["public"]["Tables"]["team_mitglieder"]["Row"];

function rowToMitglied(row: Row): TeamMitglied {
  return { id: row.id, email: row.email, rolle: row.rolle, status: row.status, erstelltAm: row.erstellt_am };
}

let cachedOwnerId: string | null = null;
let cachedForUserId: string | null = null;

/**
 * Ermittelt, unter wessen Konto (Eigentümer) der aktuelle Nutzer Daten anlegt — die eigene id,
 * oder die des Team-Eigentümers, falls er als aktives Mitglied eingeladen wurde. Ergebnis wird
 * pro Login zwischengespeichert, damit nicht vor jedem Insert erneut abgefragt werden muss.
 */
export async function effektiverEigentuemerId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw error ?? new Error("Nicht angemeldet");
  if (cachedForUserId === user.id && cachedOwnerId) return cachedOwnerId;

  const { data, error: mErr } = await supabase
    .from("team_mitglieder")
    .select("owner_id")
    .eq("user_id", user.id)
    .eq("status", "aktiv")
    .maybeSingle();
  if (mErr) throw mErr;

  cachedForUserId = user.id;
  cachedOwnerId = data?.owner_id ?? user.id;
  return cachedOwnerId;
}

export function invalidiereEigentuemerCache() {
  cachedOwnerId = null;
  cachedForUserId = null;
}

/** Nimmt eine offene Einladung an, deren E-Mail zum gerade angemeldeten Nutzer passt. */
export async function nimmEinladungAn() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return;
  await supabase
    .from("team_mitglieder")
    .update({ user_id: user.id, status: "aktiv" })
    .eq("email", user.email)
    .eq("status", "eingeladen")
    .is("user_id", null);
  invalidiereEigentuemerCache();
}

/** Team-Mitglieder des eigenen Kontos (nur relevant, wenn man selbst Owner ist). */
export async function fetchTeamMitglieder(): Promise<TeamMitglied[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("team_mitglieder")
    .select("*")
    .eq("owner_id", user.id)
    .order("erstellt_am", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToMitglied);
}

export async function ladeMitgliedEin(email: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht angemeldet");
  const { error } = await supabase
    .from("team_mitglieder")
    .insert({ owner_id: user.id, email: email.trim().toLowerCase(), rolle: "mitglied", status: "eingeladen" });
  if (error) throw error;
}

export async function entferneMitglied(id: string) {
  const { error } = await supabase.from("team_mitglieder").delete().eq("id", id);
  if (error) throw error;
}
