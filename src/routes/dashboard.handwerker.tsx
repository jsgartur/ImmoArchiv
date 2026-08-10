import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, Phone, Mail, Wrench } from "lucide-react";
import { useStore, type Handwerker } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LadeSkeleton } from "@/components/lade-skeleton";

export const Route = createFileRoute("/dashboard/handwerker")({
  component: HandwerkerListe,
});

const leererDraft = { name: "", gewerk: "", telefon: "", email: "", notizen: "" };

function HandwerkerDialog({ existing, onClose }: { existing?: Handwerker; onClose?: () => void }) {
  const addHandwerker = useStore((s) => s.addHandwerker);
  const updateHandwerker = useStore((s) => s.updateHandwerker);
  const [open, setOpen] = useState(!!existing);
  const [form, setForm] = useState(
    existing
      ? {
          name: existing.name,
          gewerk: existing.gewerk ?? "",
          telefon: existing.telefon ?? "",
          email: existing.email ?? "",
          notizen: existing.notizen ?? "",
        }
      : leererDraft,
  );

  const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) onClose?.();
  };

  const speichern = () => {
    const daten = {
      name: form.name.trim(),
      gewerk: form.gewerk.trim() || undefined,
      telefon: form.telefon.trim() || undefined,
      email: form.email.trim() || undefined,
      notizen: form.notizen.trim() || undefined,
    };
    if (existing) updateHandwerker(existing.id, daten);
    else addHandwerker(daten);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!existing && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4" /> Handwerker hinzufügen
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? "Handwerker bearbeiten" : "Neuer Handwerker"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Installateur Müller" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Gewerk</Label>
              <Input value={form.gewerk} onChange={(e) => set("gewerk", e.target.value)} placeholder="Sanitär, Elektrik, …" />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input value={form.telefon} onChange={(e) => set("telefon", e.target.value)} placeholder="0561 123456" />
            </div>
          </div>
          <div>
            <Label>E-Mail</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="kontakt@handwerk.de" />
          </div>
          <div>
            <Label>Notizen</Label>
            <Textarea rows={2} value={form.notizen} onChange={(e) => set("notizen", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!form.name.trim()} onClick={speichern}>
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HandwerkerKarte({ h }: { h: Handwerker }) {
  const removeHandwerker = useStore((s) => s.removeHandwerker);
  const [bearbeiten, setBearbeiten] = useState(false);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium">{h.name}</div>
          {h.gewerk && (
            <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Wrench className="h-3 w-3" /> {h.gewerk}
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setBearbeiten(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => confirm(`„${h.name}" löschen?`) && removeHandwerker(h.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
        {h.telefon && (
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> {h.telefon}
          </div>
        )}
        {h.email && (
          <div className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" /> {h.email}
          </div>
        )}
      </div>
      {h.notizen && <p className="mt-2 text-xs text-muted-foreground">{h.notizen}</p>}
      {bearbeiten && <HandwerkerDialog existing={h} onClose={() => setBearbeiten(false)} />}
    </div>
  );
}

function HandwerkerListe() {
  const handwerker = useStore((s) => s.handwerker);
  const handwerkerGeladen = useStore((s) => s.handwerkerGeladen);

  if (!handwerkerGeladen) {
    return <LadeSkeleton titel="Handwerker" text="Ihre wiederverwendbaren Kontakte für Mängel & Reparaturen." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Handwerker</h1>
          <p className="text-sm text-muted-foreground">Ihre wiederverwendbaren Kontakte für Mängel & Reparaturen.</p>
        </div>
        <HandwerkerDialog />
      </div>

      {handwerker.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <Wrench className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Noch keine Handwerker angelegt.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {handwerker.map((h) => (
            <HandwerkerKarte key={h.id} h={h} />
          ))}
        </div>
      )}
    </div>
  );
}
