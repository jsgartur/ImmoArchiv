// Mieterportal – Edge Function: prüft Zugangscode + Name, kein echtes Login.
//
// Sicherheitsmodell (bewusst so gewählt): der Code ist das eigentliche Geheimnis
// (lang, zufällig, wird per QR-Code/Link an den Mieter gegeben). Die Namenseingabe
// ist eine zusätzliche, aber KEINE kryptografisch sichere Hürde – sie soll nur
// verhindern, dass ein versehentlich weitergeleiteter Link sofort Daten zeigt.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const normalisiere = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { code, name } = await req.json();
    if (!code || !name) throw new Error("Code und Name werden benötigt.");

    const { data: mieter, error } = await adminClient
      .from("mieter")
      .select("id, name")
      .eq("portal_code", code.trim().toUpperCase())
      .maybeSingle();

    if (error) throw error;
    if (!mieter) throw new Error("Ungültiger Code.");

    const eingabe = normalisiere(name);
    const hinterlegt = normalisiere(mieter.name);
    if (eingabe.length < 2 || !hinterlegt.includes(eingabe)) {
      throw new Error("Name stimmt nicht mit unseren Unterlagen überein.");
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
