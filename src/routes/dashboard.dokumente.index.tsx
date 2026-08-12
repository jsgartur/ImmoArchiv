import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderOpen, Building2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { LadeSkeleton } from "@/components/lade-skeleton";

export const Route = createFileRoute("/dashboard/dokumente/")({
  component: DokumenteObjekte,
});

function DokumenteObjekte() {
  const objekte = useStore((s) => s.objekte);
  const objekteGeladen = useStore((s) => s.objekteGeladen);

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
          Wählen Sie ein Objekt, um Ordner anzulegen und Dokumente abzulegen.
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {objekte.map((o) => (
            <Link
              key={o.id}
              to="/dashboard/dokumente/$objektId"
              params={{ objektId: o.id }}
              className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition hover:border-foreground/30"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium">{o.strasse || o.adresse.split(",")[0]}</div>
                <div className="truncate text-xs text-muted-foreground">{o.adresse}</div>
              </div>
              <FolderOpen className="ml-auto h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
