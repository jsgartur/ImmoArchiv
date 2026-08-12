import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";
import { useStore } from "@/lib/store";
import { LadeSkeleton } from "@/components/lade-skeleton";
import { ObjektIcon } from "@/components/objekt-icon";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/dokumente")({
  component: DokumenteLayout,
});

function DokumenteLayout() {
  const objekte = useStore((s) => s.objekte);
  const objekteGeladen = useStore((s) => s.objekteGeladen);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!objekteGeladen) {
    return (
      <LadeSkeleton
        titel="Dokumente"
        text="Grundbuch, Verträge, Grundrisse – geordnet nach Objekt."
      />
    );
  }

  if (objekte.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Dokumente</h1>
          <p className="text-sm text-muted-foreground">
            Grundbuch, Kaufvertrag, Grundriss, Energieausweis – geordnet nach Objekt.
          </p>
        </div>
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Legen Sie zuerst ein Objekt an, um Dokumente abzulegen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Zweite Taskleiste: alle Objekte, fest angedockt an die Hauptnavigation */}
      <aside className="fixed left-60 top-16 z-20 hidden h-[calc(100vh-4rem)] w-64 flex-col overflow-y-auto border-r bg-sidebar px-3 py-4 md:flex">
        <div className="mb-3 px-2">
          <div className="text-sm font-semibold">Dokumente</div>
          <div className="text-xs text-muted-foreground">Alle Objekte</div>
        </div>
        <ul className="space-y-1">
          {objekte.map((o) => {
            const aktiv = pathname === `/dashboard/dokumente/${o.id}`;
            return (
              <li key={o.id}>
                <Link
                  to="/dashboard/dokumente/$objektId"
                  params={{ objektId: o.id }}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition",
                    aktiv
                      ? "bg-accent font-medium text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <ObjektIcon
                    bilder={o.bilder}
                    alt={o.adresse}
                    className="h-8 w-8 shrink-0 overflow-hidden rounded-lg"
                  />
                  <span className="truncate">{o.strasse || o.adresse.split(",")[0]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="space-y-6 md:pl-64">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Dokumente</h1>
          <p className="text-sm text-muted-foreground">
            Grundbuch, Kaufvertrag, Grundriss, Energieausweis – geordnet nach Objekt.
          </p>
        </div>
        <Outlet />
      </div>
    </>
  );
}
