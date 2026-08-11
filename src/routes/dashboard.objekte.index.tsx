import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Building2, Search, ArrowUp, ArrowDown, ArrowUpDown, Home, KeyRound } from "lucide-react";
import { useStore, fmtEUR, fmtEUR0, OBJEKTTYP_LABEL } from "@/lib/store";
import { berechneKennzahlen } from "@/lib/immobilienrechner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ObjektDialog } from "@/components/objekt-dialog";
import { LadeSkeleton } from "@/components/lade-skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/objekte/")({
  component: ObjekteListe,
});

type SortKey = "nr" | "adresse" | "typ" | "einheiten" | "flaeche" | "miete" | "kaufpreis";
type SortDir = "asc" | "desc";

interface ObjektZeile {
  nr: string;
  id: string;
  adresse: string;
  typ: string;
  einheiten: number;
  flaeche: number;
  miete: number;
  kaufpreis: number;
  vermietet: boolean;
}

function StatKachel({ label, value, tone }: { label: string; value: string | number; tone?: "accent" }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className={cn("text-3xl font-semibold tabular-nums", tone === "accent" && "text-blue-600")}>{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function SortButton({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground", className)}
    >
      {label}
      {active ? dir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
    </button>
  );
}

function ObjekteListe() {
  const objekte = useStore((s) => s.objekte);
  const einheiten = useStore((s) => s.einheiten);
  const objekteGeladen = useStore((s) => s.objekteGeladen);
  const [suche, setSuche] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("nr");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const zeilen = useMemo<ObjektZeile[]>(
    () =>
      objekte.map((o, i) => {
        const k = berechneKennzahlen(o);
        return {
          nr: `OBJ-${String(i + 1).padStart(4, "0")}`,
          id: o.id,
          adresse: o.adresse,
          typ: OBJEKTTYP_LABEL[o.typ],
          einheiten: einheiten.filter((e) => e.objektId === o.id).length,
          flaeche: o.gesamtwohnflaeche || 0,
          miete: k.monatskaltmiete,
          kaufpreis: k.kaufpreis,
          vermietet: o.vermietet,
        };
      }),
    [objekte, einheiten],
  );

  const sortierteUndGefilterte = useMemo(() => {
    const gefiltert = suche.trim()
      ? zeilen.filter((z) => z.adresse.toLowerCase().includes(suche.trim().toLowerCase()))
      : zeilen;
    const richtung = sortDir === "asc" ? 1 : -1;
    return gefiltert.slice().sort((a, b) => {
      if (sortKey === "adresse" || sortKey === "typ" || sortKey === "nr") {
        return a[sortKey].localeCompare(b[sortKey]) * richtung;
      }
      return (a[sortKey] - b[sortKey]) * richtung;
    });
  }, [zeilen, suche, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const vermieteteAnzahl = zeilen.filter((z) => z.vermietet).length;
  const gesamtmiete = zeilen.reduce((s, z) => s + z.miete, 0);

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
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatKachel label="Objekte gesamt" value={zeilen.length} />
            <StatKachel label="Vermietet" value={vermieteteAnzahl} tone="accent" />
            <StatKachel label="Mieteinnahmen / Monat" value={fmtEUR0(gesamtmiete)} />
          </div>

          <div className="relative max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Objekte durchsuchen…"
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead><SortButton label="Nr." active={sortKey === "nr"} dir={sortDir} onClick={() => toggleSort("nr")} /></TableHead>
                  <TableHead><SortButton label="Titel" active={sortKey === "adresse"} dir={sortDir} onClick={() => toggleSort("adresse")} /></TableHead>
                  <TableHead className="hidden md:table-cell"><SortButton label="Kategorie" active={sortKey === "typ"} dir={sortDir} onClick={() => toggleSort("typ")} /></TableHead>
                  <TableHead className="hidden text-right sm:table-cell"><SortButton label="Einheiten" active={sortKey === "einheiten"} dir={sortDir} onClick={() => toggleSort("einheiten")} className="justify-end" /></TableHead>
                  <TableHead className="hidden text-right lg:table-cell"><SortButton label="Gesamtfläche" active={sortKey === "flaeche"} dir={sortDir} onClick={() => toggleSort("flaeche")} className="justify-end" /></TableHead>
                  <TableHead className="text-right"><SortButton label="Miete" active={sortKey === "miete"} dir={sortDir} onClick={() => toggleSort("miete")} className="justify-end" /></TableHead>
                  <TableHead className="text-right"><SortButton label="Kaufpreis" active={sortKey === "kaufpreis"} dir={sortDir} onClick={() => toggleSort("kaufpreis")} className="justify-end" /></TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortierteUndGefilterte.map((z) => (
                  <TableRow key={z.id} className="cursor-pointer">
                    <TableCell className="p-0">
                      <Link to="/dashboard/objekte/$id" params={{ id: z.id }} className="block px-2 py-2 font-mono text-xs text-muted-foreground">
                        {z.nr}
                      </Link>
                    </TableCell>
                    <TableCell className="p-0">
                      <Link to="/dashboard/objekte/$id" params={{ id: z.id }} className="flex items-center gap-2 px-2 py-2 font-medium">
                        <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {z.adresse}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{z.typ}</TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">{z.einheiten || "—"}</TableCell>
                    <TableCell className="hidden text-right tabular-nums lg:table-cell">{z.flaeche ? `${z.flaeche} m²` : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{z.miete > 0 ? fmtEUR(z.miete) : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{z.kaufpreis > 0 ? fmtEUR(z.kaufpreis) : "—"}</TableCell>
                    <TableCell>
                      {z.vermietet ? (
                        <Badge variant="outline" className="border-blue-500/40 text-blue-600">
                          <KeyRound className="h-3 w-3" /> vermietet
                        </Badge>
                      ) : (
                        <Badge variant="outline">frei</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {sortierteUndGefilterte.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">Keine Objekte gefunden.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
