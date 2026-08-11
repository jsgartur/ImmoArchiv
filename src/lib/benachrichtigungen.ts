import { useMemo } from "react";
import { differenceInCalendarDays } from "date-fns";
import { useStore, monatKey, monatLabel, type Objekt } from "./store";

export type BenachrichtigungQuelle = "mieter" | "system";
export type BenachrichtigungAnsichtTyp = "schaden" | "miete" | "frist" | "system";

export interface BenachrichtigungLink {
  to: string;
  params?: Record<string, string>;
}

export interface BenachrichtigungAnsicht {
  id: string;
  quelle: BenachrichtigungQuelle;
  typ: BenachrichtigungAnsichtTyp;
  titel: string;
  text?: string;
  datum: string; // ISO
  gelesen: boolean;
  link?: BenachrichtigungLink;
  markiereGelesen: () => void;
}

const FRIST_LOOKAHEAD_TAGE = 90;
const MONATSERINNERUNG_BIS_TAG = 5;

/** Fristen (Zinsbindung, Versicherung, Energieausweis), die bald ablaufen oder schon überfällig sind. */
function fristenAusObjekten(objekte: Objekt[]) {
  const heute = new Date();
  const eintraege: { objekt: Objekt; feld: string; label: string; datum: string }[] = [];
  for (const o of objekte) {
    const kandidaten: [string | undefined, string, string][] = [
      [o.zinsbindungBis, "zinsbindung", "Zinsbindung läuft ab"],
      [o.versicherungAblauf, "versicherung", "Gebäudeversicherung läuft ab"],
      [o.energieausweisGueltigBis, "energieausweis", "Energieausweis läuft ab"],
    ];
    for (const [datum, feld, label] of kandidaten) {
      if (!datum) continue;
      if (differenceInCalendarDays(new Date(datum), heute) <= FRIST_LOOKAHEAD_TAGE) {
        eintraege.push({ objekt: o, feld, label, datum });
      }
    }
  }
  return eintraege;
}

/** Kombiniert echte (Supabase-)Benachrichtigungen mit clientseitig berechneten Erinnerungen zu einer Inbox. */
export function useBenachrichtigungen(): BenachrichtigungAnsicht[] {
  const benachrichtigungen = useStore((s) => s.benachrichtigungen);
  const objekte = useStore((s) => s.objekte);
  const gelesenVirtuell = useStore((s) => s.gelesenVirtuelleBenachrichtigungen);
  const markiereBenachrichtigungGelesen = useStore((s) => s.markiereBenachrichtigungGelesen);
  const markiereVirtuelleBenachrichtigungGelesen = useStore(
    (s) => s.markiereVirtuelleBenachrichtigungGelesen,
  );

  return useMemo(() => {
    const liste: BenachrichtigungAnsicht[] = [];

    for (const b of benachrichtigungen) {
      liste.push({
        id: b.id,
        quelle: b.typ === "schaden" ? "mieter" : "system",
        typ: b.typ === "schaden" ? "schaden" : "system",
        titel: b.titel,
        text: b.text,
        datum: b.erstelltAm,
        gelesen: b.gelesen,
        link: b.objektId ? { to: "/dashboard/objekte/$id", params: { id: b.objektId } } : undefined,
        markiereGelesen: () => markiereBenachrichtigungGelesen(b.id),
      });
    }

    // Monatsanfang: Mieteingänge prüfen
    const heute = new Date();
    if (heute.getDate() <= MONATSERINNERUNG_BIS_TAG && objekte.some((o) => o.vermietet)) {
      const id = `monat:${monatKey(heute)}`;
      liste.push({
        id,
        quelle: "system",
        typ: "miete",
        titel: "Mieteingänge prüfen",
        text: `Ein neuer Monat hat begonnen — prüfen Sie die Mieteingänge für ${monatLabel(monatKey(heute))}.`,
        datum: new Date(heute.getFullYear(), heute.getMonth(), 1).toISOString(),
        gelesen: gelesenVirtuell.includes(id),
        link: { to: "/dashboard/miete" },
        markiereGelesen: () => markiereVirtuelleBenachrichtigungGelesen(id),
      });
    }

    // Ablaufende Vertragsfristen
    for (const f of fristenAusObjekten(objekte)) {
      const id = `frist:${f.objekt.id}:${f.feld}`;
      const tageBis = differenceInCalendarDays(new Date(f.datum), heute);
      liste.push({
        id,
        quelle: "system",
        typ: "frist",
        titel: f.label,
        text:
          (tageBis < 0
            ? `Überfällig seit ${new Date(f.datum).toLocaleDateString("de-DE")}`
            : `Läuft am ${new Date(f.datum).toLocaleDateString("de-DE")} ab (in ${tageBis} Tagen)`) +
          ` — ${f.objekt.strasse || f.objekt.adresse.split(",")[0]}`,
        datum: f.datum,
        gelesen: gelesenVirtuell.includes(id),
        link: { to: "/dashboard/objekte/$id", params: { id: f.objekt.id } },
        markiereGelesen: () => markiereVirtuelleBenachrichtigungGelesen(id),
      });
    }

    return liste.sort(
      (a, b) => Number(a.gelesen) - Number(b.gelesen) || b.datum.localeCompare(a.datum),
    );
  }, [
    benachrichtigungen,
    objekte,
    gelesenVirtuell,
    markiereBenachrichtigungGelesen,
    markiereVirtuelleBenachrichtigungGelesen,
  ]);
}
