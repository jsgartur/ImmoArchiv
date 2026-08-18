// Supabase Edge Function: löscht das Konto des aufrufenden Nutzers unwiderruflich.
//
// Braucht den service_role-Key (nur serverseitig als Secret, niemals im Client!), da nur
// er berechtigt ist, auth.users-Zeilen zu löschen. Alle abhängigen Zeilen (profiles, objekte,
// einheiten, mieter, …) hängen per ON DELETE CASCADE an auth.users bzw. an die kaskadierenden
// Tabellen und werden automatisch mitgelöscht. Storage-Dateien hängen NICHT an dieser Kaskade
// (Storage-Objekte sind kein Postgres-Fremdschlüssel) und werden hier explizit vor dem
// Löschen des Kontos entfernt, alle Buckets folgen der Konvention "erster Pfad-Ordner = user_id".
//
// Deployment (einmalig, im Supabase-Dashboard oder per CLI):
//   supabase functions deploy delete-account
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role-Key aus den Projekteinstellungen>
//
// Aufruf aus dem Client: supabase.functions.invoke("delete-account")
// (der Aufruf sendet automatisch den Bearer-Token des angemeldeten Nutzers mit).

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Löscht rekursiv alle Dateien unter einem Ordnerpfad in einem Storage-Bucket. Supabase Storage
 * listet nur eine Ebene pro Aufruf – Unterordner (z. B. objekt-bilder/{userId}/{objektId}/...)
 * werden daher per Tiefensuche eingesammelt, bevor am Ende alle gefundenen Dateipfade auf einmal
 * gelöscht werden. Fehler werden bewusst verschluckt (best effort), damit ein Storage-Problem
 * das eigentliche Konto-Löschen nicht blockiert.
 */
async function loescheOrdnerRekursiv(client: SupabaseClient, bucket: string, pfad: string): Promise<void> {
  try {
    const { data, error } = await client.storage.from(bucket).list(pfad, { limit: 1000 });
    if (error || !data || data.length === 0) return;

    const dateien: string[] = [];
    const unterordner: string[] = [];
    for (const eintrag of data) {
      const vollerPfad = `${pfad}/${eintrag.name}`;
      // Ordner haben bei Supabase Storage kein "id"-Feld, Dateien schon.
      if (eintrag.id === null) unterordner.push(vollerPfad);
      else dateien.push(vollerPfad);
    }

    await Promise.all(unterordner.map((u) => loescheOrdnerRekursiv(client, bucket, u)));
    if (dateien.length > 0) await client.storage.from(bucket).remove(dateien);
  } catch {
    // best effort – Storage-Fehler sollen das Konto-Löschen nicht verhindern
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Nicht angemeldet." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Client mit dem Token des Nutzers – nur um herauszufinden, wer den Request stellt.
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Nicht angemeldet." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Admin-Client mit service_role – einzig berechtigt, das Konto zu löschen.
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Storage-Dateien des Nutzers vor dem Konto-Löschen entfernen (kein automatischer Cascade).
  const buckets = ["dokumente", "objekt-bilder", "mangel-fotos", "avatare"];
  await Promise.all(buckets.map((bucket) => loescheOrdnerRekursiv(adminClient, bucket, user.id)));

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
