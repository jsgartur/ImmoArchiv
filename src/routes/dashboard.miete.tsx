import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Coins,
  ArrowRight,
  Building2,
  KeyRound,
} from "lucide-react";
import {
  useStore,
  fmtEUR,
  fmtDate,
  monatKey,
  monatLabel,
  type Objekt,
  type Einheit,
  type Mieter,
} from "@/lib/store";
import { erwarteteMieteFuerMonat } from "@/lib/immobilienrechner";
import { LadeSkeleton } from "@/components/lade-skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/dashboard/miete")({
  component: Mieteingaenge,
});

const shiftMonat = (key: string, delta: number) => {
  const [y, m] = key.split("-").map(Number);
  return monatKey(new Date(y, m - 1 + delta, 1));
};

interface MietverhaeltnisZeile {
  objekt: Objekt;
  einheit: Einheit;
  mieter?: Mieter;
}

function StatKachel({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "accent" | "amber";
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div
        className={
          "text-2xl font-semibold tabular-nums " +
          (tone === "accent" ? "text-blue-600" : tone === "amber" ? "text-amber-600" : "")
        }
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

/** Übersicht aller Mietverhältnisse (Einheit × Mieter) über alle Objekte hinweg — verknüpft Objekte/Einheiten mit den Mieteingängen darunter. */
function Mietverhaeltnisse({
  objekte,
  einheiten,
  mieter,
}: {
  objekte: Objekt[];
  einheiten: Einheit[];
  mieter: Mieter[];
}) {
  const zeilen = useMemo<MietverhaeltnisZeile[]>(() => {
    const eintraege: MietverhaeltnisZeile[] = [];
    for (const e of einheiten) {
      const objekt = objekte.find((o) => o.id === e.objektId);
      if (!objekt) continue;
      eintraege.push({
        objekt,
        einheit: e,
        mieter: mieter.find((m) => m.einheitId === e.id && !m.mietende),
      });
    }
    return eintraege.sort(
      (a, b) =>
        a.objekt.adresse.localeCompare(b.objekt.adresse) ||
        a.einheit.bezeichnung.localeCompare(b.einheit.bezeichnung),
    );
  }, [objekte, einheiten, mieter]);

  if (zeilen.length === 0) return null;

  const vermietet = zeilen.filter((z) => z.mieter).length;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatKachel label="Einheiten gesamt" value={zeilen.length} />
        <StatKachel label="Vermietet" value={vermietet} tone="accent" />
        <StatKachel label="Leerstehend" value={zeilen.length - vermietet} tone="amber" />
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Objekt</TableHead>
              <TableHead>Einheit</TableHead>
              <TableHead>Mieter</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Vertragsart</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zeilen.map(({ objekt, einheit, mieter: m }) => (
              <TableRow key={einheit.id}>
                <TableCell className="p-0">
                  <Link
                    to="/dashboard/objekte/$id"
                    params={{ id: objekt.id }}
                    className="flex items-center gap-2 px-2 py-2.5 font-medium hover:underline"
                  >
                    <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {objekt.strasse || objekt.adresse.split(",")[0]}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{einheit.bezeichnung}</TableCell>
                <TableCell>
                  {m?.name ?? <span className="text-muted-foreground">Leerstand</span>}
                </TableCell>
                <TableCell>
                  {m ? (
                    <Badge variant="outline" className="border-blue-500/40 text-blue-600">
                      <KeyRound className="h-3 w-3" /> vermietet
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500/40 text-amber-600">
                      Leerstand
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {m ? (m.mietende ? `Befristet bis ${fmtDate(m.mietende)}` : "Unbefristet") : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Mieteingaenge() {
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

  if (!objekteGeladen || !einheitenGeladen || !mieterGeladen || !mietzahlungenGeladen) {
    return (
      <LadeSkeleton
        titel="Mieteingänge"
        text="Behalten Sie den Überblick, wer die Miete schon gezahlt hat."
      />
    );
  }

  const istBezahlt = (mieterId: string) =>
    mietzahlungen.some((z) => z.mieterId === mieterId && z.monat === monat);

  // Alle Mieter, die in diesem Monat (anteilig) Miete schulden, gruppiert nach Objekt.
  const gruppen = objekte
    .map((o) => {
      const einheitenIds = einheiten.filter((e) => e.objektId === o.id).map((e) => e.id);
      const zeilen = mieter
        .filter((m) => einheitenIds.includes(m.einheitId))
        .map((m) => ({
          mieter: m,
          einheit: einheiten.find((e) => e.id === m.einheitId),
          betrag: erwarteteMieteFuerMonat(m, monat),
        }))
        .filter((z) => z.betrag > 0);
      return { objekt: o, zeilen };
    })
    .filter((g) => g.zeilen.length > 0)
    .sort((a, b) => a.objekt.adresse.localeCompare(b.objekt.adresse));

  const alleZeilen = gruppen.flatMap((g) => g.zeilen);
  const erwartet = alleZeilen.reduce((s, z) => s + z.betrag, 0);
  const eingegangen = alleZeilen
    .filter((z) => istBezahlt(z.mieter.id))
    .reduce((s, z) => s + z.betrag, 0);
  const offen = erwartet - eingegangen;
  const anzahlOffen = alleZeilen.filter((z) => !istBezahlt(z.mieter.id)).length;
  const istAktuellerMonat = monat === monatKey();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Mieteingänge</h1>
        <p className="text-sm text-muted-foreground">
          Behalten Sie den Überblick, wer die Miete schon gezahlt hat — je Mieter und Objekt.
        </p>
      </div>

      <Mietverhaeltnisse objekte={objekte} einheiten={einheiten} mieter={mieter} />

      {/* Monatsnavigation */}
      <div className="flex items-center justify-between rounded-xl border bg-card p-3">
        <button
          onClick={() => setMonat((m) => shiftMonat(m, -1))}
          className="grid h-9 w-9 place-items-center rounded-md hover:bg-accent"
          aria-label="Vorheriger Monat"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <div className="font-medium">{monatLabel(monat)}</div>
          {!istAktuellerMonat && (
            <button
              onClick={() => setMonat(monatKey())}
              className="text-xs text-primary hover:underline"
            >
              Zum aktuellen Monat
            </button>
          )}
        </div>
        <button
          onClick={() => setMonat((m) => shiftMonat(m, 1))}
          className="grid h-9 w-9 place-items-center rounded-md hover:bg-accent"
          aria-label="Nächster Monat"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {gruppen.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <Coins className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Für {monatLabel(monat)} sind keine Mieter mit Kaltmiete hinterlegt. Legen Sie einen
            Mieter bei einer Einheit an, um Mieteingänge zu verfolgen.
          </p>
          <Link
            to="/dashboard/objekte"
            className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Zu den Objekten <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* Gesamt-Summen */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-4">
              <div className="text-xs text-muted-foreground">Erwartet (gesamt)</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{fmtEUR(erwartet)}</div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="text-xs text-muted-foreground">Eingegangen</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums text-blue-600">
                {fmtEUR(eingegangen)}
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="text-xs text-muted-foreground">Offen ({anzahlOffen})</div>
              <div
                className={
                  "mt-1 text-2xl font-semibold tabular-nums " +
                  (offen > 0 ? "text-amber-600" : "text-muted-foreground")
                }
              >
                {fmtEUR(offen)}
              </div>
            </div>
          </div>

          {/* Je Objekt gruppiert */}
          <div className="space-y-4">
            {gruppen.map(({ objekt, zeilen }) => {
              const objErwartet = zeilen.reduce((s, z) => s + z.betrag, 0);
              const objEingegangen = zeilen
                .filter((z) => istBezahlt(z.mieter.id))
                .reduce((s, z) => s + z.betrag, 0);
              return (
                <div key={objekt.id} className="rounded-2xl border bg-card">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
                    <Link
                      to="/dashboard/objekte/$id"
                      params={{ id: objekt.id }}
                      className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                    >
                      <Building2 className="h-4 w-4" />
                      {objekt.strasse || objekt.adresse}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {fmtEUR(objEingegangen)} von {fmtEUR(objErwartet)} eingegangen
                    </div>
                  </div>
                  <div className="divide-y">
                    {zeilen.map(({ mieter: m, einheit, betrag }) => {
                      const paid = istBezahlt(m.id);
                      const prorated = betrag !== (m.kaltmiete ?? 0);
                      return (
                        <button
                          key={m.id}
                          onClick={() => setMieteBezahlt(m.id, monat, !paid, betrag)}
                          className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-accent/50"
                        >
                          {paid ? (
                            <CheckCircle2 className="h-7 w-7 shrink-0 text-blue-600" />
                          ) : (
                            <Circle className="h-7 w-7 shrink-0 text-amber-500" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{m.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {einheit?.bezeichnung ?? "—"} · {paid ? "bezahlt" : "offen"}
                              {prorated ? " · anteilig (Ein-/Auszug)" : ""}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium tabular-nums">{fmtEUR(betrag)}</div>
                            <div className="text-[11px] text-muted-foreground">Kaltmiete</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Tipp: Auf eine Zeile klicken schaltet zwischen „bezahlt" und „offen" um.
          </p>
        </>
      )}
    </div>
  );
}
