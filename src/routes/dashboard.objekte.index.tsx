import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Building2 } from "lucide-react";
import { useStore, fmtEUR, OBJEKTTYP_LABEL } from "@/lib/store";
import { berechneKennzahlen } from "@/lib/immobilienrechner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ObjektDialog } from "@/components/objekt-dialog";
import { ObjektBild } from "@/components/objekt-bild";
import { LadeSkeleton } from "@/components/lade-skeleton";

export const Route = createFileRoute("/dashboard/objekte/")({
  component: ObjekteListe,
});

function ObjekteListe() {
  const objekte = useStore((s) => s.objekte);
  const einheiten = useStore((s) => s.einheiten);
  const objekteGeladen = useStore((s) => s.objekteGeladen);

  if (!objekteGeladen) {
    return <LadeSkeleton titel="Objekte" text="Ihre Immobilien mit allen Kennzahlen." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Objekte</h1>
          <p className="text-sm text-muted-foreground">Ihre Immobilien mit allen Kennzahlen.</p>
        </div>
        <ObjektDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4" /> Immobilie hinzufügen
            </Button>
          }
        />
      </div>

      {objekte.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Noch keine Objekte angelegt.</p>
          <div className="mt-4">
            <ObjektDialog trigger={<Button variant="outline">Erste Immobilie hinzufügen</Button>} />
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {objekte.map((o) => {
            const k = berechneKennzahlen(o);
            const anzahlEinheiten = einheiten.filter((e) => e.objektId === o.id).length;
            return (
              <Link
                key={o.id}
                to="/dashboard/objekte/$id"
                params={{ id: o.id }}
                className="group overflow-hidden rounded-xl border bg-card transition hover:border-foreground/30"
              >
                {o.bilder && o.bilder.length > 0 ? (
                  <div className="relative h-56 w-full overflow-hidden bg-muted">
                    <ObjektBild pfad={o.bilder[0]} alt={o.adresse} className="h-full w-full object-cover transition group-hover:scale-105" />
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/50 to-transparent p-2">
                      <Badge variant="secondary">{OBJEKTTYP_LABEL[o.typ]}</Badge>
                      {o.vermietet ? (
                        <Badge variant="outline" className="border-blue-500/40 bg-background/80 text-blue-600">vermietet</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-background/80">frei</Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2 px-4 pt-4">
                    <Badge variant="secondary">{OBJEKTTYP_LABEL[o.typ]}</Badge>
                    {o.vermietet ? (
                      <Badge variant="outline" className="border-blue-500/40 text-blue-600">vermietet</Badge>
                    ) : (
                      <Badge variant="outline">frei</Badge>
                    )}
                  </div>
                )}
                <div className="p-4 pt-3">
                <div className="font-medium leading-tight">{o.adresse}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {o.baujahr ? `Baujahr ${o.baujahr}` : ""}
                  {o.baujahr && o.gesamtwohnflaeche ? " · " : ""}
                  {o.gesamtwohnflaeche ? `${o.gesamtwohnflaeche} m²` : ""}
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t pt-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Kaufpreis</dt>
                    <dd className="font-medium">{k.kaufpreis > 0 ? fmtEUR(k.kaufpreis) : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Einheiten</dt>
                    <dd className="font-medium">{anzahlEinheiten || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Gesamtfläche</dt>
                    <dd className="font-medium">{o.gesamtwohnflaeche ? `${o.gesamtwohnflaeche} m²` : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Miete/Mon.</dt>
                    <dd className="font-medium">{k.monatskaltmiete > 0 ? fmtEUR(k.monatskaltmiete) : "—"}</dd>
                  </div>
                </dl>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
