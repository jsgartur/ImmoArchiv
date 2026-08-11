import { useState } from "react";
import { Plus } from "lucide-react";
import { useStore, type Mieter } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Anlegen/Bearbeiten eines Mieters für eine Einheit – wiederverwendet auf der Objekt-Detailseite und bei den Mietverhältnissen. */
export function MieterDialog({
  einheitId,
  existing,
  trigger,
}: {
  einheitId: string;
  existing?: Mieter;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const addMieter = useStore((s) => s.addMieter);
  const updateMieter = useStore((s) => s.updateMieter);
  const [form, setForm] = useState<Omit<Mieter, "id" | "einheitId">>(
    existing
      ? {
          name: existing.name,
          kontakt: existing.kontakt,
          telefon: existing.telefon,
          email: existing.email,
          mietbeginn: existing.mietbeginn,
          mietende: existing.mietende,
          kaltmiete: existing.kaltmiete,
          nebenkosten: existing.nebenkosten,
          kaution: existing.kaution,
        }
      : {
          name: "",
          telefon: "",
          email: "",
          mietbeginn: new Date().toISOString().slice(0, 10),
          mietende: "",
          kaltmiete: 0,
          nebenkosten: 0,
          kaution: 0,
        },
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant={existing ? "ghost" : "default"}>
            {existing ? (
              "Bearbeiten"
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Mieter
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? "Mieter bearbeiten" : "Neuer Mieter"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Telefon</Label>
              <Input
                value={form.telefon ?? ""}
                onChange={(e) => setForm({ ...form, telefon: e.target.value })}
              />
            </div>
            <div>
              <Label>E-Mail</Label>
              <Input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mietbeginn</Label>
              <Input
                type="date"
                value={form.mietbeginn?.slice(0, 10) ?? ""}
                onChange={(e) => setForm({ ...form, mietbeginn: e.target.value })}
              />
            </div>
            <div>
              <Label>Mietende (optional)</Label>
              <Input
                type="date"
                value={form.mietende?.slice(0, 10) ?? ""}
                onChange={(e) => setForm({ ...form, mietende: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Kaltmiete €</Label>
              <Input
                type="number"
                step="0.01"
                value={form.kaltmiete || ""}
                onChange={(e) => setForm({ ...form, kaltmiete: +e.target.value })}
              />
            </div>
            <div>
              <Label>Nebenkosten €</Label>
              <Input
                type="number"
                step="0.01"
                value={form.nebenkosten || ""}
                onChange={(e) => setForm({ ...form, nebenkosten: +e.target.value })}
              />
            </div>
            <div>
              <Label>Kaution €</Label>
              <Input
                type="number"
                step="0.01"
                value={form.kaution || ""}
                onChange={(e) => setForm({ ...form, kaution: +e.target.value })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!form.name.trim()}
            onClick={() => {
              if (existing) updateMieter(existing.id, form);
              else addMieter({ ...form, einheitId });
              setOpen(false);
            }}
          >
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
