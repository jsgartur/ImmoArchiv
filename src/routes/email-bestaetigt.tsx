import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/email-bestaetigt")({
  component: EmailBestaetigt,
});

function EmailBestaetigt() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-sm text-center">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 font-semibold">
          <Logo className="h-8 w-8" />
          ImmoArchiv
        </Link>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-blue-600/10 text-blue-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">E-Mail bestätigt</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ihre E-Mail-Adresse wurde erfolgreich bestätigt. Sie können sich jetzt anmelden.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link to="/login">Zur Anmeldung</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
