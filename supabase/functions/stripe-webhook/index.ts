// Supabase Edge Function: Stripe-Webhook – hält profiles.plan mit dem Abo-Status synchron.
//
// Secrets (einmalig setzen):
//   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
//   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...   (aus dem Stripe-Dashboard → Webhooks)
//
// Im Stripe-Dashboard als Endpoint eintragen:
//   https://<project-ref>.supabase.co/functions/v1/stripe-webhook
// Events abonnieren: checkout.session.completed, customer.subscription.updated,
//                    customer.subscription.deleted

import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function setzePlanFuerKunde(customerId: string, plan: "professional" | "starter", subscriptionId: string | null) {
  await adminClient
    .from("profiles")
    .update({ plan, stripe_subscription_id: subscriptionId })
    .eq("stripe_customer_id", customerId);
}

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("Fehlende Stripe-Signatur.");
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (e) {
    return new Response(`Webhook-Signatur ungültig: ${e instanceof Error ? e.message : e}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.customer && session.subscription) {
          await setzePlanFuerKunde(session.customer as string, "professional", session.subscription as string);
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const aktiv = sub.status === "active" || sub.status === "trialing";
        await setzePlanFuerKunde(sub.customer as string, aktiv ? "professional" : "starter", sub.id);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await setzePlanFuerKunde(sub.customer as string, "starter", null);
        break;
      }
      default:
        break;
    }
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500 });
  }
});
