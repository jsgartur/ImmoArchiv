import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useStore } from "@/lib/store";
import { istPro } from "@/lib/plaene";
import { Button } from "@/components/ui/button";

/** Blendet Inhalte für Nicht-Professional-Nutzer aus und zeigt stattdessen einen Upgrade-Hinweis. */
export function ProGate({ feature, children }: { feature: string; children: React.ReactNode }) {
  const plan = useStore((s) => s.profil.plan);
  if (istPro(plan)) return <>{children}</>;

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
        <Lock className="h-6 w-6" />
      </div>
      <div>
        <div className="font-medium">{feature} ist ein Professional-Feature</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Upgraden Sie auf Professional, um {feature.toLowerCase()} zu nutzen.
        </p>
      </div>
      <Button asChild>
        <Link to="/dashboard/preise">Auf Professional upgraden</Link>
      </Button>
    </div>
  );
}
