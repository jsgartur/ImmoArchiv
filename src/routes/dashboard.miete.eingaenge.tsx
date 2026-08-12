import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Building2, ChevronLeft, ChevronRight, Coins, Search } from "lucide-react";
import { useStore, fmtEUR, monatKey, monatLabel } from "@/lib/store";
import { erwarteteMieteFuerMonat } from "@/lib/immobilienrechner";
import { LadeSkeleton } from "@/components/lade-skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/dashboard/miete/eingaenge")({
  component: Mietuebersicht,
});

const shiftMonat = (key: string, delta: number) => {
  const [y, m] = key.split("-").map(Number);
  return monatKey(new Date(y, m - 1 + delta, 1));
};

function StatKachel({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "destructive" | "accent" | "pos";
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div
        className={
          "text-3xl font-semibold tabular-nums " +
          (tone === "destructive"
            ? "text-destructive"
            : tone === "accent"
              ? "text-amber-600"
              : "text-blue-600")
        }
      >
        {value}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function Mietuebersicht() {
  const objekte = useStore((s) => s.objekte);
  const einheiten = useStore((s) => s.einheiten);
  const mieter = useStore((s) => s.mieter);
  const mietzahlungen = useStore((s) => s.mietzahlungen);
  const setMieteBezahlt = useStore((s) => s.setMieteBezahlt);
  const objekteGeladen = useStore((s) => s.objekteGeladen);
  const einheitenGeladen = useStore((s) => s.einheitenGeladen);
  const mieterGeladen = useStore((s) => s.mieterGeladen);
  const mietzahlungenGeladen = useStore((s) => s.mietzahlungenGeladen);
  const [monat, setMonat] = useState(monatKey());
  const [suche, setSuche] = useState("");

  const istBezahlt = (mieterId: string) =>
    mietzahlungen.some((z) => z.mieterId === mieterId && z.monat === monat);

  const zeilen = useMemo(() => {
    return mieter
      .map((m) => {
        const einheit = einheiten.find((e) => e.id === m.einheitId);
        const objekt = einheit ? objekte.find((o) => o.id === einheit.objektId) : undefined;
        const betrag = erwarteteMieteFuerMonat(m, monat);
        return { mieter: m, einheit, objekt, betrag };
      })
      .filter((z) => z.betrag > 0 && z.objekt)
      .filter(
        (z) =>
          !suche.trim() ||
          z.mieter.name.toLowerCase().includes(suche.trim().toLowerCase()) ||
          z.objekt!.adresse.toLowerCase().includes(suche.trim().toLowerCase()),
      )
      .sort(
        (a, b) =>
          a.objekt!.adresse.localeCompare(b.objekt!.adresse) ||
          a.mieter.name.localeCompare(b.mieter.name),
      );
  }, [mieter, einheiten, objekte, monat, suche]);

  if (!objekteGeladen || !einheitenGeladen || !mieterGeladen || !mietzahlungenGeladen) {
    return (
      <LadeSkeleton
        titel="Mietübersicht"
        text="Behalten Sie den Überblick, wer die Miete schon gezahlt hat."
      />
    );
  }

  const istVergangenerMonat = monat < monatKey();
  const bezahlt = zeilen.filter((z) => istBezahlt(z.mieter.id));
  const offen = zeilen.filter((z) => !istBezahlt(z.mieter.id));
  const ueberfaellig = istVergangenerMonat ? offen : [];
  const erwartet = istVergangenerMonat ? [] : offen;
  const istAktuellerMonat = monat === monatKey();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Mietübersicht</h1>
          <p className="text-sm text-muted-foreground">
            Behalten Sie den Überblick, wer die Miete schon gezahlt hat.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border bg-card p-1">
          <button
            onClick={() => setMonat((m) => shiftMonat(m, -1))}
            className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent"
            aria-label="Vorheriger Monat"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-32 text-center text-sm font-medium">{monatLabel(monat)}</div>
          <button
            onClick={() => setMonat((m) => shiftMonat(m, 1))}
            className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent"
            aria-label="Nächster Monat"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {!istAktuellerMonat && (
            <button
              onClick={() => setMonat(monatKey())}
              className="ml-1 px-2 text-xs text-primary hover:underline"
            >
              Heute
            </button>
          )}
        </div>
      </div>

      {zeilen.length === 0 && !suche ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <Coins className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Für {monatLabel(monat)} sind keine Mieter mit Kaltmiete hinterlegt.
          </p>
          <Link
            to="/dashboard/miete"
            className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Zu den Mietverhältnissen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatKachel label="Überfällig" value={ueberfaellig.length} tone="destructive" />
            <StatKachel label="Erwartet" value={erwartet.length} tone="accent" />
            <StatKachel label="Bezahlt" value={bezahlt.length} tone="pos" />
          </div>

          <div className="relative max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Suchen…"
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Objekt</TableHead>
                  <TableHead>Zweck</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zeilen.map((z) => {
                  const paid = istBezahlt(z.mieter.id);
                  const status = paid ? "bezahlt" : istVergangenerMonat ? "ueberfaellig" : "offen";
                  return (
                    <TableRow
                      key={z.mieter.id}
                      className="cursor-pointer"
                      onClick={() => setMieteBezahlt(z.mieter.id, monat, !paid, z.betrag)}
                    >
                      <TableCell className="font-medium">{z.mieter.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          {z.objekt!.strasse || z.objekt!.adresse.split(",")[0]}
                        </div>
                        {z.einheit && <div className="pl-5 text-xs">{z.einheit.bezeichnung}</div>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        Miete {monatLabel(monat)}
                      </TableCell>
                      <TableCell>
                        {status === "bezahlt" ? (
                          <Badge variant="outline" className="border-blue-500/40 text-blue-600">
                            Bezahlt
                          </Badge>
                        ) : status === "ueberfaellig" ? (
                          <Badge
                            variant="outline"
                            className="border-destructive/40 text-destructive"
                          >
                            Überfällig
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-500/40 text-amber-600">
                            Offen
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {fmtEUR(z.betrag)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {zeilen.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Keine Treffer.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            Tipp: Auf eine Zeile klicken schaltet zwischen „bezahlt" und „offen" um.
          </p>
        </>
      )}
    </div>
  );
}
