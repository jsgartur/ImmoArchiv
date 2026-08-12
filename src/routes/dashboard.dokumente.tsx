import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";
import { useStore } from "@/lib/store";
import { LadeSkeleton } from "@/components/lade-skeleton";
import { ObjektIcon } from "@/components/objekt-icon";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Dokumente</h1>
        <p className="text-sm text-muted-foreground">
          Grundbuch, Kaufvertrag, Grundriss, Energieausweis – geordnet nach Objekt.
        </p>
      </div>

      {objekte.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Legen Sie zuerst ein Objekt an, um Dokumente abzulegen.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="shrink-0 lg:w-64">
            <div className="overflow-hidden rounded-2xl border bg-card">
              <ul className="divide-y">
                {objekte.map((o) => {
                  const aktiv = pathname === `/dashboard/dokumente/${o.id}`;
                  return (
                    <li key={o.id}>
                      <Link
                        to="/dashboard/dokumente/$objektId"
                        params={{ objektId: o.id }}
                        className={
                          "flex items-center gap-3 px-3 py-2.5 text-sm transition " +
                          (aktiv ? "bg-secondary font-medium" : "hover:bg-secondary/60")
                        }
                      >
                        <ObjektIcon
                          bilder={o.bilder}
                          alt={o.adresse}
                          className="h-9 w-9 shrink-0 overflow-hidden rounded-lg"
                        />
                        <div className="min-w-0">
                          <div className="truncate">{o.strasse || o.adresse.split(",")[0]}</div>
                          <div className="truncate text-xs text-muted-foreground">{o.adresse}</div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
          <div className="min-w-0 flex-1">
            <Outlet />
          </div>
        </div>
      )}
    </div>
  );
}
