import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ScrollReveal as Reveal } from "@/components/scroll-reveal";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  CalendarClock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  List,
  CalendarDays,
  ShieldAlert,
  FileWarning,
  Landmark,
} from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  format,
  differenceInCalendarDays,
} from "date-fns";
import { de } from "date-fns/locale";
import {
  useStore,
  fmtDate,
  AUFGABE_LABEL,
  AUFGABE_VORLAGEN,
  type AufgabeKategorie,
  type Aufgabe,
  type Objekt,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageTabs, AUFGABEN_TABS } from "@/components/page-tabs";
import { LadeSkeleton } from "@/components/lade-skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/aufgaben")({
  component: Aufgaben,
});

const heuteIso = () => new Date().toISOString().slice(0, 10);
const istUeberfaellig = (a: Aufgabe) => !a.erledigt && !!a.faelligkeit && a.faelligkeit.slice(0, 10) < heuteIso();

function AufgabeZeile({ a }: { a: Aufgabe }) {
  const toggle = useStore((s) => s.toggleAufgabe);
  const remove = useStore((s) => s.removeAufgabe);
  const objekt = useStore((s) => s.objekte.find((o) => o.id === a.objektId));
  const ueberfaellig = istUeberfaellig(a);

  return (
    <div className="flex items-center gap-3 p-3">
      <button onClick={() => toggle(a.id)} aria-label="Erledigt umschalten" className="shrink-0">
        {a.erledigt ? (
          <CheckCircle2 className="h-5 w-5 text-blue-600" />
        ) : (
          <Circle className={"h-5 w-5 " + (ueberfaellig ? "text-destructive" : "text-muted-foreground")} />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className={"truncate text-sm font-medium " + (a.erledigt ? "text-muted-foreground line-through" : "")}>
          {a.titel}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            {AUFGABE_LABEL[a.kategorie]}
          </Badge>
          {a.faelligkeit && (
            <span className={ueberfaellig ? "font-medium text-destructive" : ""}>
              {ueberfaellig ? "überfällig seit " : "fällig "}
              {fmtDate(a.faelligkeit)}
            </span>
          )}
          {objekt && <span>· {objekt.strasse || objekt.adresse.split(",")[0]}</span>}
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={() => remove(a.id)} aria-label="Löschen">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

function AufgabenKalender({ aufgaben }: { aufgaben: Aufgabe[] }) {
  const toggle = useStore((s) => s.toggleAufgabe);
  const [monat, setMonat] = useState(() => startOfMonth(new Date()));

  const tage = useMemo(() => {
    const start = startOfWeek(startOfMonth(monat), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monat), { weekStartsOn: 1 });
    const liste: Date[] = [];
    let tag = start;
    while (tag <= end) {
      liste.push(tag);
      tag = addDays(tag, 1);
    }
    return liste;
  }, [monat]);

  const aufgabenAmTag = (tag: Date) =>
    aufgaben.filter((a) => a.faelligkeit && isSameDay(new Date(a.faelligkeit), tag));

  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex items-center justify-between border-b p-3">
        <div className="text-sm font-medium capitalize">{format(monat, "MMMM yyyy", { locale: de })}</div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setMonat((m) => subMonths(m, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonat(startOfMonth(new Date()))}>
            Heute
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonat((m) => addMonths(m, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b text-center text-xs text-muted-foreground">
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((t) => (
          <div key={t} className="p-2">
            {t}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {tage.map((tag) => {
          const heute = isSameDay(tag, new Date());
          const inMonat = isSameMonth(tag, monat);
          const tagesAufgaben = aufgabenAmTag(tag);
          return (
            <div
              key={tag.toISOString()}
              className={cn(
                "min-h-24 border-b border-r p-1.5 [&:nth-child(7n)]:border-r-0",
                !inMonat && "bg-muted/30",
              )}
            >
              <div
                className={cn(
                  "mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs",
                  heute && "bg-primary font-medium text-primary-foreground",
                  !inMonat && "text-muted-foreground",
                )}
              >
                {format(tag, "d")}
              </div>
              <div className="space-y-1">
                {tagesAufgaben.slice(0, 3).map((a) => {
                  const ueberfaellig = istUeberfaellig(a);
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggle(a.id)}
                      title={a.titel}
                      className={cn(
                        "block w-full truncate rounded px-1 py-0.5 text-left text-[11px] leading-tight",
                        a.erledigt
                          ? "bg-secondary text-muted-foreground line-through"
                          : ueberfaellig
                            ? "bg-destructive/15 text-destructive"
                            : "bg-blue-600/10 text-blue-700 dark:text-blue-400",
                      )}
                    >
                      {a.titel}
                    </button>
                  );
                })}
                {tagesAufgaben.length > 3 && (
                  <div className="px-1 text-[10px] text-muted-foreground">+{tagesAufgaben.length - 3} mehr</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const LOOKAHEAD_TAGE = 90;

interface FristEintrag {
  objekt: Objekt;
  label: string;
  datum: string;
  icon: typeof ShieldAlert;
}

/** Sammelt anstehende/überfällige Vertragsfristen direkt aus den Objektdaten (Zinsbindung, Versicherung, Energieausweis). */
function useAnstehendeFristen(): FristEintrag[] {
  const objekte = useStore((s) => s.objekte);
  return useMemo(() => {
    const heute = new Date();
    const eintraege: FristEintrag[] = [];
    for (const o of objekte) {
      const kandidaten: [string | undefined, string, typeof ShieldAlert][] = [
        [o.zinsbindungBis, "Zinsbindung läuft ab", Landmark],
        [o.versicherungAblauf, "Gebäudeversicherung läuft ab", ShieldAlert],
        [o.energieausweisGueltigBis, "Energieausweis läuft ab", FileWarning],
      ];
      for (const [datum, label, icon] of kandidaten) {
        if (!datum) continue;
        const tageBis = differenceInCalendarDays(new Date(datum), heute);
        if (tageBis <= LOOKAHEAD_TAGE) eintraege.push({ objekt: o, label, datum, icon });
      }
    }
    return eintraege.sort((a, b) => a.datum.localeCompare(b.datum));
  }, [objekte]);
}

function FristenErinnerungen() {
  const fristen = useAnstehendeFristen();
  if (fristen.length === 0) return null;

  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex items-center gap-2 border-b p-3 text-sm font-medium">
        <ShieldAlert className="h-4 w-4" /> Anstehende Vertragsfristen
      </div>
      <div className="divide-y">
        {fristen.map(({ objekt, label, datum, icon: Icon }, i) => {
          const tageBis = differenceInCalendarDays(new Date(datum), new Date());
          const ueberfaellig = tageBis < 0;
          return (
            <Link
              key={i}
              to="/dashboard/objekte/$id"
              params={{ id: objekt.id }}
              className="flex items-center gap-3 p-3 text-sm hover:bg-accent"
            >
              <Icon className={"h-4 w-4 shrink-0 " + (ueberfaellig ? "text-destructive" : "text-amber-600")} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">
                  {objekt.strasse || objekt.adresse.split(",")[0]}
                </div>
              </div>
              <div className={"shrink-0 text-xs " + (ueberfaellig ? "font-medium text-destructive" : "text-muted-foreground")}>
                {ueberfaellig ? `überfällig seit ${fmtDate(datum)}` : `${fmtDate(datum)} (in ${tageBis} Tagen)`}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Aufgaben() {
  const aufgaben = useStore((s) => s.aufgaben);
  const objekte = useStore((s) => s.objekte);
  const addAufgabe = useStore((s) => s.addAufgabe);
  const aufgabenGeladen = useStore((s) => s.aufgabenGeladen);

  const [titel, setTitel] = useState("");
  const [kategorie, setKategorie] = useState<AufgabeKategorie>("wartung");
  const [faelligkeit, setFaelligkeit] = useState("");
  const [objektId, setObjektId] = useState<string>("");
  const [ansicht, setAnsicht] = useState<"liste" | "kalender">("liste");

  const anlegen = (t = titel, k = kategorie) => {
    if (!t.trim()) return;
    addAufgabe({
      titel: t.trim(),
      kategorie: k,
      faelligkeit: faelligkeit || undefined,
      objektId: objektId || undefined,
    });
    setTitel("");
    setFaelligkeit("");
  };

  const sortiert = (list: Aufgabe[]) =>
    list.slice().sort((a, b) => (a.faelligkeit ?? "9999").localeCompare(b.faelligkeit ?? "9999"));

  const ueberfaellig = sortiert(aufgaben.filter(istUeberfaellig));
  const offen = sortiert(aufgaben.filter((a) => !a.erledigt && !istUeberfaellig(a)));
  const erledigt = aufgaben.filter((a) => a.erledigt);

  if (!aufgabenGeladen) {
    return <LadeSkeleton titel="Aufgaben" text="Fristen, Wartungen und To-dos im Blick." />;
  }

  return (
    <Reveal className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Aufgaben & Fristen</h1>
        <p className="text-sm text-muted-foreground">
          Reparaturen, Wartungen und Fristen — nie wieder Rauchmelder oder Heizungswartung vergessen.
        </p>
      </div>
      <PageTabs tabs={AUFGABEN_TABS} />

      <FristenErinnerungen />

      {/* Neue Aufgabe */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_150px_150px_1fr_auto] sm:items-end">
          <div>
            <Label className="text-xs">Aufgabe</Label>
            <Input
              placeholder="z. B. Rauchmelder prüfen"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && anlegen()}
            />
          </div>
          <div>
            <Label className="text-xs">Kategorie</Label>
            <Select value={kategorie} onValueChange={(v) => setKategorie(v as AufgabeKategorie)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(AUFGABE_LABEL) as AufgabeKategorie[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {AUFGABE_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Fällig am</Label>
            <Input type="date" value={faelligkeit} onChange={(e) => setFaelligkeit(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Objekt (optional)</Label>
            <Select value={objektId || "none"} onValueChange={(v) => setObjektId(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ohne Objekt</SelectItem>
                {objekte.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.strasse || o.adresse.split(",")[0]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => anlegen()} disabled={!titel.trim()}>
            <Plus className="h-4 w-4" /> Hinzufügen
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="self-center text-xs text-muted-foreground">Schnell:</span>
          {AUFGABE_VORLAGEN.map((v) => (
            <button
              key={v.titel}
              onClick={() => anlegen(v.titel, v.kategorie)}
              className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              + {v.titel}
            </button>
          ))}
        </div>
      </div>

      <div className="inline-flex rounded-lg border p-0.5">
        <button
          onClick={() => setAnsicht("liste")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition",
            ansicht === "liste" ? "bg-accent font-medium text-foreground" : "text-muted-foreground",
          )}
        >
          <List className="h-4 w-4" /> Liste
        </button>
        <button
          onClick={() => setAnsicht("kalender")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition",
            ansicht === "kalender" ? "bg-accent font-medium text-foreground" : "text-muted-foreground",
          )}
        >
          <CalendarDays className="h-4 w-4" /> Kalender
        </button>
      </div>

      {ansicht === "kalender" ? (
        <AufgabenKalender aufgaben={aufgaben} />
      ) : aufgaben.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Noch keine Aufgaben. Legen Sie oben Ihre erste an oder nutzen Sie eine Vorlage.
        </div>
      ) : (
        <div className="space-y-4">
          {ueberfaellig.length > 0 && (
            <div className="rounded-2xl border border-destructive/30 bg-card">
              <div className="flex items-center gap-2 border-b border-destructive/20 p-3 text-sm font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" /> Überfällig ({ueberfaellig.length})
              </div>
              <div className="divide-y">
                {ueberfaellig.map((a) => (
                  <AufgabeZeile key={a.id} a={a} />
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border bg-card">
            <div className="flex items-center gap-2 border-b p-3 text-sm font-medium">
              <CalendarClock className="h-4 w-4" /> Offen ({offen.length})
            </div>
            {offen.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Keine offenen Aufgaben. 🎉</p>
            ) : (
              <div className="divide-y">
                {offen.map((a) => (
                  <AufgabeZeile key={a.id} a={a} />
                ))}
              </div>
            )}
          </div>

          {erledigt.length > 0 && (
            <details className="rounded-2xl border bg-card">
              <summary className="cursor-pointer p-3 text-sm font-medium text-muted-foreground">
                Erledigt ({erledigt.length})
              </summary>
              <div className="divide-y border-t">
                {erledigt.map((a) => (
                  <AufgabeZeile key={a.id} a={a} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </Reveal>
  );
}
