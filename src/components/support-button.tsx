import { useState } from "react";
import { LifeBuoy } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

// TODO: Betreiber-E-Mail eintragen (wird vom Nutzer noch bereitgestellt).
export const SUPPORT_EMAIL = "support@example.com";

export function SupportButton({ className }: { className?: string }) {
  const profil = useStore((s) => s.profil);
  const [open, setOpen] = useState(false);
  const [betreff, setBetreff] = useState("");
  const [nachricht, setNachricht] = useState("");
  const [vonEmail, setVonEmail] = useState(profil.email ?? "");

  const senden = () => {
    const body = `${nachricht}\n\n---\nAbsender: ${[profil.vorname, profil.nachname].filter(Boolean).join(" ")}\nE-Mail: ${vonEmail || "—"}`;
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Support-Anfrage: " + (betreff || "Anfrage"))}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "inline-flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground",
            className,
          )}
        >
          <LifeBuoy className="h-4 w-4 shrink-0" /> Support
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Support kontaktieren</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Beschreiben Sie Ihr Anliegen. Beim Absenden öffnet sich Ihr E-Mail-Programm mit einer vorbereiteten
            Nachricht an unser Support-Team.
          </p>
          <div>
            <Label className="text-xs">Ihre E-Mail (für die Antwort)</Label>
            <Input type="email" value={vonEmail} onChange={(e) => setVonEmail(e.target.value)} placeholder="name@beispiel.de" />
          </div>
          <div>
            <Label className="text-xs">Betreff</Label>
            <Input value={betreff} onChange={(e) => setBetreff(e.target.value)} placeholder="Kurzbeschreibung" />
          </div>
          <div>
            <Label className="text-xs">Nachricht</Label>
            <Textarea rows={5} value={nachricht} onChange={(e) => setNachricht(e.target.value)} placeholder="Wie können wir helfen?" />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!nachricht.trim()} onClick={senden}>
            Anfrage senden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
