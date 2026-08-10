import type { Objekt, Mieter } from "./store";

export interface Kennzahlen {
  // Grunddaten
  kaufpreis: number;
  kaufnebenkosten: number;
  gesamtinvestition: number; // Kaufpreis + Nebenkosten
  wohnflaeche: number | null;

  // effektive Miete (ist, sonst Ziel)
  monatskaltmiete: number;
  jahreskaltmiete: number;
  mieteIstProognose: "ist" | "ziel" | "keine";

  // Kennzahlen
  preisProQm: number | null; // €/m² (auf Kaufpreis)
  mieteProQm: number | null; // €/m² Monatskaltmiete
  bruttorendite: number | null; // % (Jahresmiete / Gesamtinvestition)
  nettorendite: number | null; // % ((Jahresmiete − lfd. Kosten) / Kaufpreis)
  mietmultiplikator: number | null; // Kaufpreisfaktor (Gesamtinvestition / Jahresmiete)

  // Finanzierung / Cashflow
  eigenkapital: number | null;
  darlehen: number | null;
  rateMonat: number;
  bausparBetragMonat: number;
  laufendeKostenMonat: number;
  cashflowMonat: number; // Miete − Bankrate − Bausparrate − lfd. Kosten
  cashflowJahr: number;
  eigenkapitalrenditeCashflow: number | null; // % Cashflow p. a. / Eigenkapital (Cash-on-Cash)

  // Wert & Beleihung
  marktwert: number; // aktueller Marktwert (fällt auf Kaufpreis zurück)
  ltv: number | null; // Beleihungsauslauf = Darlehen / Marktwert × 100
  eigenkapitalquote: number | null; // (Marktwert − Darlehen) / Marktwert × 100
}

const nz = (n: number | undefined | null) => (typeof n === "number" && !Number.isNaN(n) ? n : 0);
const posOrNull = (n: number) => (n > 0 ? n : null);

/**
 * Effektiver Darlehensbetrag – konsistent für Restschuld, LTV & Eigenkapital.
 * Ist ein Darlehensbetrag eingetragen, gilt dieser. Sonst wird er aus
 * Kaufpreis − Eigenkapital abgeleitet (0 € Eigenkapital ⇒ Vollfinanzierung).
 */
export function effektivesDarlehen(o: Objekt): number {
  if (o.darlehensbetrag != null) return nz(o.darlehensbetrag);
  return Math.max(0, nz(o.kaufpreis) - nz(o.eigenkapital));
}

/** Effektive Monatskaltmiete: Ist-Miete wenn vermietet, sonst Ziel-Miete. */
export function effektiveKaltmiete(o: Objekt): { betrag: number; quelle: "ist" | "ziel" | "keine" } {
  if (o.vermietet && nz(o.istKaltmiete) > 0) return { betrag: nz(o.istKaltmiete), quelle: "ist" };
  if (nz(o.zielKaltmiete) > 0) return { betrag: nz(o.zielKaltmiete), quelle: "ziel" };
  if (nz(o.istKaltmiete) > 0) return { betrag: nz(o.istKaltmiete), quelle: "ist" };
  return { betrag: 0, quelle: "keine" };
}

/**
 * Anteilige Kaltmiete eines Mieters für einen Kalendermonat ("YYYY-MM").
 * Zieht sowohl beim Einzug als auch beim Auszug tagesgenau um: Zieht der
 * Mieter z. B. am 15. ein, wird für diesen Monat nur der anteilige Betrag
 * erwartet (Tage bewohnt / Tage im Monat × Kaltmiete).
 */
export function erwarteteMieteFuerMonat(mieter: Mieter, monat: string): number {
  const kaltmiete = nz(mieter.kaltmiete);
  if (kaltmiete <= 0) return 0;

  const [jahr, mon] = monat.split("-").map(Number);
  const monatsStart = new Date(jahr, mon - 1, 1);
  const monatsEnde = new Date(jahr, mon, 0); // letzter Tag des Monats
  const tageImMonat = monatsEnde.getDate();

  const beginn = mieter.mietbeginn ? new Date(mieter.mietbeginn) : null;
  const ende = mieter.mietende ? new Date(mieter.mietende) : null;

  if (beginn && beginn > monatsEnde) return 0; // noch nicht eingezogen
  if (ende && ende < monatsStart) return 0; // schon ausgezogen

  const start = beginn && beginn > monatsStart ? beginn : monatsStart;
  const ende2 = ende && ende < monatsEnde ? ende : monatsEnde;
  if (ende2 < start) return 0;

  const tageBewohnt = Math.round((ende2.getTime() - start.getTime()) / 86400000) + 1;
  if (tageBewohnt >= tageImMonat) return kaltmiete;
  return Math.round(kaltmiete * (tageBewohnt / tageImMonat) * 100) / 100;
}

export function berechneKennzahlen(o: Objekt): Kennzahlen {
  const kaufpreis = nz(o.kaufpreis);
  const kaufnebenkosten = nz(o.kaufnebenkosten);
  const gesamtinvestition = kaufpreis + kaufnebenkosten;
  const wohnflaeche = posOrNull(nz(o.gesamtwohnflaeche));

  const { betrag: monatskaltmiete, quelle } = effektiveKaltmiete(o);
  const jahreskaltmiete = monatskaltmiete * 12;

  const rateMonat = nz(o.monatlicheRate);
  const bausparBetragMonat = nz(o.bausparBetragMonat);
  const laufendeKostenMonat = nz(o.laufendeKostenMonat);
  const laufendeKostenJahr = laufendeKostenMonat * 12;

  const cashflowMonat = monatskaltmiete - rateMonat - bausparBetragMonat - laufendeKostenMonat;
  const cashflowJahr = cashflowMonat * 12;

  const eigenkapital = o.eigenkapital != null ? nz(o.eigenkapital) : posOrNull(gesamtinvestition - effektivesDarlehen(o));
  const darlehen = posOrNull(effektivesDarlehen(o));
  const marktwert = nz(o.marktwert) > 0 ? nz(o.marktwert) : kaufpreis;

  return {
    kaufpreis,
    kaufnebenkosten,
    gesamtinvestition,
    wohnflaeche,
    monatskaltmiete,
    jahreskaltmiete,
    mieteIstProognose: quelle,
    preisProQm: wohnflaeche && kaufpreis > 0 ? kaufpreis / wohnflaeche : null,
    mieteProQm: wohnflaeche && monatskaltmiete > 0 ? monatskaltmiete / wohnflaeche : null,
    bruttorendite: kaufpreis > 0 && jahreskaltmiete > 0 ? (jahreskaltmiete / kaufpreis) * 100 : null, // Standardformel: Jahreskaltmiete / Kaufpreis
    nettorendite: // Standardformel: (Jahreskaltmiete − nicht umlagefähige Kosten) / Kaufpreis
      kaufpreis > 0 && jahreskaltmiete > 0
        ? ((jahreskaltmiete - laufendeKostenJahr) / kaufpreis) * 100
        : null,
    mietmultiplikator: jahreskaltmiete > 0 && gesamtinvestition > 0 ? gesamtinvestition / jahreskaltmiete : null,
    eigenkapital,
    darlehen,
    rateMonat,
    bausparBetragMonat,
    laufendeKostenMonat,
    cashflowMonat,
    cashflowJahr,
    eigenkapitalrenditeCashflow: eigenkapital && eigenkapital > 0 ? (cashflowJahr / eigenkapital) * 100 : null,
    marktwert,
    ltv: marktwert > 0 && darlehen != null && darlehen > 0 ? (darlehen / marktwert) * 100 : null,
    eigenkapitalquote: marktwert > 0 ? ((marktwert - nz(darlehen)) / marktwert) * 100 : null,
  };
}

export interface TilgungErgebnis {
  gueltig: boolean; // genug Daten vorhanden?
  darlehen: number;
  restschuld: number; // heute
  bereitsGetilgt: number;
  zinsenBezahlt: number; // Summe der Zinsen bis heute
  monateGelaufen: number;
  restlaufzeitMonate: number | null; // null = wird mit dieser Rate nie getilgt
  abbezahltVoraussichtlich: string | null; // ISO-Monat, z. B. "2041-05"
  zinsAnteilAktuell: number; // Zinsanteil der nächsten Rate
  tilgungsAnteilAktuell: number; // Tilgungsanteil der nächsten Rate
  hinweis?: string;
}

/**
 * Anzahl der bis zum Stichtag bereits geleisteten Monatsraten.
 * Zahlung erfolgt am Monatsersten ab dem Finanzierungsbeginn – die Rate des laufenden
 * Monats zählt mit, sobald der Zahltag (Tag des Startdatums) erreicht/überschritten ist.
 */
const bezahlteRaten = (start: Date, stichtag: Date) => {
  if (stichtag < start) return 0;
  let m = (stichtag.getFullYear() - start.getFullYear()) * 12 + (stichtag.getMonth() - start.getMonth());
  if (stichtag.getDate() >= start.getDate()) m += 1;
  return Math.max(0, m);
};

/**
 * Berechnet die Restschuld eines Annuitätendarlehens zum Stichtag.
 * Monatszins = Zinssatz/12. Jede Rate: Zins = Restschuld × Monatszins, Tilgung = Rate − Zins.
 */
export function berechneTilgung(o: Objekt, stichtag: Date = new Date()): TilgungErgebnis {
  const darlehen = effektivesDarlehen(o);
  const rate = nz(o.monatlicheRate);
  const monatszins = nz(o.zinssatz) / 100 / 12;
  const startIso = o.finanzierungsbeginn ?? o.kaufdatum;

  const leer: TilgungErgebnis = {
    gueltig: false,
    darlehen,
    restschuld: darlehen,
    bereitsGetilgt: 0,
    zinsenBezahlt: 0,
    monateGelaufen: 0,
    restlaufzeitMonate: null,
    abbezahltVoraussichtlich: null,
    zinsAnteilAktuell: 0,
    tilgungsAnteilAktuell: 0,
  };

  if (darlehen <= 0 || rate <= 0 || !startIso) {
    return { ...leer, hinweis: "Für die Restschuld werden Darlehensbetrag, Bankrate und Kauf-/Finanzierungsdatum benötigt." };
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const sondertilgungen = o.sondertilgungen ?? [];
  const sonderImMonat = (jahr: number, monat0: number) =>
    sondertilgungen
      .filter((st) => {
        const d = new Date(st.datum);
        return d.getFullYear() === jahr && d.getMonth() === monat0;
      })
      .reduce((s, st) => s + nz(st.betrag), 0);

  const erstZins = darlehen * monatszins;
  if (rate <= erstZins && sondertilgungen.length === 0) {
    return {
      ...leer,
      gueltig: true,
      zinsAnteilAktuell: erstZins,
      tilgungsAnteilAktuell: Math.max(0, rate - erstZins),
      hinweis: "Die Rate deckt kaum die Zinsen — das Darlehen wird so nicht getilgt. Bitte Rate/Zinssatz prüfen.",
    };
  }

  const start = new Date(startIso);
  const monateGelaufen = bezahlteRaten(start, stichtag);

  // Restschuld bis zum Stichtag simulieren (inkl. Sondertilgungen)
  let restschuld = darlehen;
  let zinsenBezahlt = 0;
  for (let i = 0; i < monateGelaufen && restschuld > 0; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const zins = restschuld * monatszins;
    const tilgung = Math.min(rate - zins, restschuld);
    restschuld = round2(restschuld - tilgung);
    const sonder = sonderImMonat(d.getFullYear(), d.getMonth());
    if (sonder > 0) restschuld = Math.max(0, round2(restschuld - sonder));
    zinsenBezahlt += zins;
  }
  restschuld = Math.max(0, restschuld);

  // Restlaufzeit ab Stichtag simulieren (inkl. künftiger Sondertilgungen)
  let rest = restschuld;
  let restMonate = 0;
  while (rest > 0 && restMonate < 1200) {
    const d = new Date(stichtag.getFullYear(), stichtag.getMonth() + restMonate + 1, 1);
    const zins = rest * monatszins;
    rest = round2(rest - (rate - zins));
    const sonder = sonderImMonat(d.getFullYear(), d.getMonth());
    if (sonder > 0) rest = Math.max(0, round2(rest - sonder));
    restMonate++;
    if (rate <= rest * monatszins && sonderImMonat(d.getFullYear(), d.getMonth()) === 0 && restMonate > 1) {
      // Rate deckt Zinsen nicht mehr und keine weiteren Sondertilgungen -> Abbruch
      if (sondertilgungen.every((st) => new Date(st.datum) <= d)) break;
    }
  }
  const restlaufzeitMonate = rest <= 0 ? restMonate : null;

  let abbezahlt: string | null = null;
  if (restlaufzeitMonate != null) {
    const d = new Date(stichtag);
    d.setMonth(d.getMonth() + restlaufzeitMonate);
    abbezahlt = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  const zinsAnteilAktuell = restschuld * monatszins;
  return {
    gueltig: true,
    darlehen,
    restschuld,
    bereitsGetilgt: Math.max(0, darlehen - restschuld),
    zinsenBezahlt: Math.round(zinsenBezahlt * 100) / 100,
    monateGelaufen,
    restlaufzeitMonate,
    abbezahltVoraussichtlich: abbezahlt,
    zinsAnteilAktuell,
    tilgungsAnteilAktuell: Math.max(0, Math.min(rate - zinsAnteilAktuell, restschuld)),
  };
}

/** Summe der im Kalenderjahr gezahlten Darlehenszinsen (für Steuer / Werbungskosten). */
export function zinsenImJahr(o: Objekt, jahr: number): number {
  const darlehen = nz(o.darlehensbetrag);
  const rate = nz(o.monatlicheRate);
  const monatszins = nz(o.zinssatz) / 100 / 12;
  const startIso = o.finanzierungsbeginn ?? o.kaufdatum;
  if (darlehen <= 0 || rate <= 0 || !startIso) return 0;

  const start = new Date(startIso);
  if (jahr < start.getFullYear()) return 0;

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const sonder = (y: number, m: number) =>
    (o.sondertilgungen ?? [])
      .filter((st) => {
        const d = new Date(st.datum);
        return d.getFullYear() === y && d.getMonth() === m;
      })
      .reduce((s, st) => s + nz(st.betrag), 0);

  let rest = berechneTilgung(o, new Date(jahr, 0, 1)).restschuld;
  let zinsen = 0;
  const startMonat = jahr === start.getFullYear() ? start.getMonth() : 0;
  for (let m = startMonat; m < 12 && rest > 0; m++) {
    const zins = rest * monatszins;
    rest = round2(rest - (rate - zins));
    const s = sonder(jahr, m);
    if (s > 0) rest = Math.max(0, round2(rest - s));
    zinsen += zins;
  }
  return round2(zinsen);
}

export interface PortfolioKennzahlen {
  anzahl: number;
  gesamtinvestition: number;
  gesamtMarktwert: number;
  gesamtRestschuld: number; // heutige Restschuld aller Darlehen
  eigenkapitalAktuell: number; // Marktwert − Restschuld (aktuelles Nettovermögen)
  gesamtEigenkapital: number; // Summe des eingesetzten Eigenkapitals über alle Objekte
  jahreskaltmiete: number;
  monatskaltmiete: number; // = monatliche Einnahmen (Kaltmiete)
  ausgabenMonat: number; // Bankraten + laufende Kosten
  cashflowMonat: number;
  bruttorendite: number | null; // gewichtet über Gesamtinvestition (reine Mietrendite, unabhängig von Finanzierung)
  renditeEigenkapital: number | null; // Cashflow p. a. (nach Bankrate/Bauspar/lfd. Kosten) / eingesetztes Eigenkapital
  vermietet: number;
  leerstand: number;
  vermietungsquote: number | null; // % vermietet
}

export function portfolioKennzahlen(objekte: Objekt[]): PortfolioKennzahlen {
  let gesamtinvestition = 0;
  let gesamtKaufpreis = 0;
  let gesamtMarktwert = 0;
  let gesamtRestschuld = 0;
  let jahreskaltmiete = 0;
  let monatskaltmiete = 0;
  let ausgabenMonat = 0;
  let cashflowMonat = 0;
  let gesamtEigenkapital = 0;
  let vermietet = 0;
  for (const o of objekte) {
    const k = berechneKennzahlen(o);
    gesamtinvestition += k.gesamtinvestition;
    gesamtKaufpreis += k.kaufpreis;
    gesamtMarktwert += k.marktwert;
    gesamtRestschuld += berechneTilgung(o).restschuld;
    jahreskaltmiete += k.jahreskaltmiete;
    monatskaltmiete += k.monatskaltmiete;
    ausgabenMonat += k.rateMonat + k.bausparBetragMonat + k.laufendeKostenMonat;
    cashflowMonat += k.cashflowMonat;
    gesamtEigenkapital += k.eigenkapital ?? 0;
    if (o.vermietet) vermietet += 1;
  }
  return {
    anzahl: objekte.length,
    gesamtinvestition,
    gesamtMarktwert,
    gesamtRestschuld,
    eigenkapitalAktuell: gesamtMarktwert - gesamtRestschuld,
    gesamtEigenkapital,
    jahreskaltmiete,
    monatskaltmiete,
    ausgabenMonat,
    cashflowMonat,
    bruttorendite: gesamtKaufpreis > 0 && jahreskaltmiete > 0 ? (jahreskaltmiete / gesamtKaufpreis) * 100 : null, // Standardformel: Jahreskaltmiete / Kaufpreis
    renditeEigenkapital: gesamtEigenkapital > 0 ? ((cashflowMonat * 12) / gesamtEigenkapital) * 100 : null,
    vermietet,
    leerstand: objekte.length - vermietet,
    vermietungsquote: objekte.length > 0 ? (vermietet / objekte.length) * 100 : null,
  };
}
