// Mieterportal – Edge Function: Mieter meldet einen Mangel (inkl. Fotos) für die eigene Einheit.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const BUCKET = "mangel-fotos";

function dataUrlToBlob(dataUrl: string): { blob: Blob; ext: string } {
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/data:(.*);base64/)?.[1] ?? "image/jpeg";
  const ext = mime.split("/")[1] ?? "jpg";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { blob: new Blob([bytes], { type: mime }), ext };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { code, titel, beschreibung, prioritaet, fotos } = await req.json();
    if (!code || !titel) throw new Error("Code und Titel werden benötigt.");

    const { data: mieter, error: mieterError } = await adminClient
      .from("mieter")
      .select("einheit_id")
      .eq("portal_code", code.trim().toUpperCase())
      .maybeSingle();
    if (mieterError) throw mieterError;
    if (!mieter) throw new Error("Ungültiger Code.");

    const { data: einheit, error: einheitError } = await adminClient
      .from("einheiten")
      .select("objekt_id")
      .eq("id", mieter.einheit_id)
      .maybeSingle();
    if (einheitError) throw einheitError;

    const { data: objekt, error: objektError } = await adminClient
      .from("objekte")
      .select("user_id")
      .eq("id", einheit?.objekt_id ?? "")
      .maybeSingle();
    if (objektError) throw objektError;
    if (!objekt) throw new Error("Objekt nicht gefunden.");

    const mangelId = crypto.randomUUID();
    const fotoPfade: string[] = [];
    for (let i = 0; i < (fotos?.length ?? 0); i++) {
      const { blob, ext } = dataUrlToBlob(fotos[i]);
      const pfad = `${objekt.user_id}/${mangelId}/${Date.now()}-${i}.${ext}`;
      const { error: uploadError } = await adminClient.storage.from(BUCKET).upload(pfad, blob, { contentType: blob.type });
      if (uploadError) throw uploadError;
      fotoPfade.push(pfad);
    }

    const jetzt = new Date().toISOString();
    const { error: insertError } = await adminClient.from("maengel").insert({
      id: mangelId,
      user_id: objekt.user_id,
      einheit_id: mieter.einheit_id,
      titel,
      beschreibung: beschreibung || null,
      prioritaet: prioritaet || "mittel",
      status: "gemeldet",
      gemeldet_von: "mieter",
      gemeldet_am: jetzt,
      fotos: fotoPfade,
      verlauf: [{ datum: jetzt, text: "Mangel vom Mieter über das Mieterportal gemeldet" }],
    });
    if (insertError) throw insertError;

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
