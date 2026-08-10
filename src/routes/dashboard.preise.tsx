import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Star, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { PLAENE, monatspreis, JAHRES_RABATT } from "@/lib/plaene";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/preise")({
  component: Preise,
});

const preisText = (n: number) =>
  n === 0 ? "0 €" : new Intl.NumberFormat("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n) + " €";

function Preise() {
  const [jaehrlich, setJaehrlich] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState<string | null>(null);
  const aktuellerPlan = useStore((s) => s.profil.plan);
  const updateProfil = useStore((s) => s.updateProfil);

  const starteCheckout = async (planId: "professional") => {
    const priceId = jaehrlich
      ? import.meta.env.VITE_STRIPE_PRICE_PROFESSIONAL_YEARLY
      : import.meta.env.VITE_STRIPE_PRICE_PROFESSIONAL_MONTHLY;
    if (!priceId) {
      toast.error("Zahlungsabwicklung ist noch nicht konfiguriert.");
      return;
    }
    setCheckoutBusy(planId);
    const { data, error } = await supabase.functions.invoke("create-checkout-session", {
      body: {
        priceId,
        erfolgUrl: `${window.location.origin}/dashboard/preise?checkout=erfolg`,
        abbruchUrl: `${window.location.origin}/dashboard/preise?checkout=abbruch`,
      },
    });
    setCheckoutBusy(null);
    if (error || !data?.url) {
      toast.error("Checkout konnte nicht gestartet werden. Bitte später erneut versuchen.");
      return;
    }
    window.location.href = data.url;
  };

  const waehlen = (id: (typeof PLAENE)[number]["id"], name: string) => {
    if (id === "starter") {
      updateProfil({ plan: "starter" });
      toast.success(`Plan „${name}" ausgewählt`);
    } else {
      starteCheckout("professional");
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Preise</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Wählen Sie den Plan, der zu Ihnen passt. Alle Pläne enthalten sichere Cloud-Speicherung und laufende
          Updates.
        </p>

        {/* Abrechnungs-Umschalter */}
        <div className="mt-6 inline-flex items-center gap-3 rounded-full border bg-card px-4 py-2 text-sm">
          <span className={cn(!jaehrlich && "font-medium")}>Monatlich</span>
          <Switch checked={jaehrlich} onCheckedChange={setJaehrlich} aria-label="Jährliche Abrechnung" />
          <span className={cn(jaehrlich && "font-medium")}>
            Jährlich
            <span className="ml-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-600">
              −{Math.round(JAHRES_RABATT * 100)} %
            </span>
          </span>
        </div>
      </div>

      {/* Karten – gleich hoch dank items-stretch + flex */}
      <div className="mx-auto grid max-w-3xl items-stretch gap-6 sm:grid-cols-2">
        {PLAENE.map((plan) => {
          const preis = monatspreis(plan, jaehrlich);
          const aktiv = aktuellerPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6 transition",
                plan.populaer ? "border-primary shadow-lg lg:-mt-2 lg:mb-2" : "hover:border-foreground/30",
              )}
            >
              {plan.populaer && (
                <span className="absolute right-6 top-6 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                  <Star className="h-3 w-3 fill-current" /> Beliebt
                </span>
              )}

              <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{plan.name}</div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">{preisText(preis)}</span>
                {plan.preisMonat > 0 && <span className="text-sm text-muted-foreground">/ Monat</span>}
              </div>
              <div className="mt-1 h-4 text-xs text-muted-foreground">
                {plan.preisMonat === 0
                  ? "dauerhaft kostenlos"
                  : jaehrlich
                    ? `jährlich abgerechnet (${preisText(preis * 12)}/Jahr)`
                    : "monatlich abgerechnet"}
              </div>

              <p className="mt-4 text-sm text-muted-foreground">{plan.beschreibung}</p>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-6 w-full"
                variant={plan.populaer ? "default" : "outline"}
                disabled={aktiv || checkoutBusy === plan.id}
                onClick={() => waehlen(plan.id, plan.name)}
              >
                {checkoutBusy === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}
                {aktiv ? "Aktueller Plan" : plan.cta}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Preise inkl. USt. Die Zahlungsabwicklung für Professional erfolgt sicher über Stripe. Jederzeit im
        Kundenportal (Konto-Seite) kündbar.
      </p>
    </div>
  );
}
