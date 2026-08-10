import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Building2, Search, User, Wrench, ListChecks, AlertTriangle } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface Treffer {
  id: string;
  titel: string;
  untertitel?: string;
  gehe: () => void;
}

export function GlobalSearchTrigger() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const objekte = useStore((s) => s.objekte);
  const einheiten = useStore((s) => s.einheiten);
  const mieter = useStore((s) => s.mieter);
  const maengel = useStore((s) => s.maengel);
  const handwerker = useStore((s) => s.handwerker);
  const aufgaben = useStore((s) => s.aufgaben);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const objektTreffer: Treffer[] = useMemo(
    () =>
      objekte.map((o) => ({
        id: o.id,
        titel: o.adresse,
        untertitel: "Objekt",
        gehe: () => navigate({ to: "/dashboard/objekte/$id", params: { id: o.id } }),
      })),
    [objekte, navigate],
  );

  const mieterTreffer: Treffer[] = useMemo(
    () =>
      mieter.map((m) => {
        const einheit = einheiten.find((e) => e.id === m.einheitId);
        const objekt = objekte.find((o) => o.id === einheit?.objektId);
        return {
          id: m.id,
          titel: m.name,
          untertitel: objekt ? `Mieter · ${objekt.strasse || objekt.adresse.split(",")[0]}` : "Mieter",
          gehe: () => objekt && navigate({ to: "/dashboard/objekte/$id", params: { id: objekt.id } }),
        };
      }),
    [mieter, einheiten, objekte, navigate],
  );

  const mangelTreffer: Treffer[] = useMemo(
    () =>
      maengel.map((m) => ({
        id: m.id,
        titel: m.titel,
        untertitel: "Mangel",
        gehe: () => navigate({ to: "/dashboard/maengel" }),
      })),
    [maengel, navigate],
  );

  const handwerkerTreffer: Treffer[] = useMemo(
    () =>
      handwerker.map((h) => ({
        id: h.id,
        titel: h.name,
        untertitel: h.gewerk ? `Handwerker · ${h.gewerk}` : "Handwerker",
        gehe: () => navigate({ to: "/dashboard/handwerker" }),
      })),
    [handwerker, navigate],
  );

  const aufgabenTreffer: Treffer[] = useMemo(
    () =>
      aufgaben.map((a) => ({
        id: a.id,
        titel: a.titel,
        untertitel: "Aufgabe",
        gehe: () => navigate({ to: "/dashboard/aufgaben" }),
      })),
    [aufgaben, navigate],
  );

  const gruppen: { label: string; icon: typeof Building2; treffer: Treffer[] }[] = [
    { label: "Objekte", icon: Building2, treffer: objektTreffer },
    { label: "Mieter", icon: User, treffer: mieterTreffer },
    { label: "Mängel", icon: AlertTriangle, treffer: mangelTreffer },
    { label: "Handwerker", icon: Wrench, treffer: handwerkerTreffer },
    { label: "Aufgaben", icon: ListChecks, treffer: aufgabenTreffer },
  ];

  const auswaehlen = (t: Treffer) => {
    setOpen(false);
    t.gehe();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center gap-3 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
      >
        <Search className="h-4 w-4 shrink-0" />
        Suchen…
        <kbd className="ml-auto rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Objekte, Mieter, Mängel, Handwerker, Aufgaben, Dokumente durchsuchen…" />
        <CommandList>
          <CommandEmpty>Keine Treffer.</CommandEmpty>
          {gruppen.map(
            ({ label, icon: Icon, treffer }) =>
              treffer.length > 0 && (
                <CommandGroup key={label} heading={label}>
                  {treffer.map((t) => (
                    <CommandItem key={`${label}-${t.id}`} value={`${label} ${t.titel}`} onSelect={() => auswaehlen(t)}>
                      <Icon className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{t.titel}</span>
                        {t.untertitel && <span className="text-xs text-muted-foreground">{t.untertitel}</span>}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ),
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
