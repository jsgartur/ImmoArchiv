// Supabase Edge Function: löscht das Konto des aufrufenden Nutzers unwiderruflich.
//
// Braucht den service_role-Key (nur serverseitig als Secret, niemals im Client!), da nur
// er berechtigt ist, auth.users-Zeilen zu löschen. Alle abhängigen Zeilen (profiles, objekte,
// einheiten, mieter, … sowie Storage-Dateien) hängen per ON DELETE CASCADE an auth.users
// bzw. an die kaskadierenden Tabellen und werden automatisch mitgelöscht.
//
// Deployment (einmalig, im Supabase-Dashboard oder per CLI):
//   supabase functions deploy delete-account
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role-Key aus den Projekteinstellungen>
//
// Aufruf aus dem Client: supabase.functions.invoke("delete-account")
// (der Aufruf sendet automatisch den Bearer-Token des angemeldeten Nutzers mit).

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
