import type { Abrechnung, NkPartei, NkPosition, Umlageschluessel } from "./store";

export interface PositionsAnteil {
  positionId: string;
  bezeichnung: string;
  schluessel: Umlageschluessel;
  gesamt: number; // Gesamtbetrag der Position
  anteil: number; // Anteil dieser Partei
}

export interface ParteiErgebnis {
  partei: NkPartei;
  anteile: PositionsAnteil[];
  gesamtKosten: number; // Summe aller Anteile
  monateAnteilig: number; // tatsächlich bewohnte Monate im Zeitraum (anteilig)
  nkVorausMonat: number; // monatliche NK-Vorauszahlung
  vorauszahlung: number; // gezahlte NK-Vorauszahlung gesamt = monatlich × Monate
  saldo: number; // vorauszahlung − gesamtKosten (>0 Guthaben, <0 Nachzahlung)
}

export interface AbrechnungErgebnis {
  parteien: ParteiErgebnis[];
  gesamtKosten: number;
  gesamtVorauszahlung: number;
  gesamtSaldo: number;
  monate: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Gewicht einer Partei für einen bestimmten Umlageschlüssel. */
function gewicht(p: NkPartei, schluessel: Umlageschluessel): number {
  if (schluessel === "wohnflaeche") return p.wohnflaeche || 0;
  if (schluessel === "personen") return p.personen || 0;
  return 1; // einheiten: jede Partei gleich
}

/** Anzahl Monate im Abrechnungszeitraum (inkl. Randmonate). */
export function monateImZeitraum(von: string, bis: string): number {
  if (!von || !bis) return 12;
  const a = new Date(von);
  const b = new Date(bis);
  const m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + 1;
  return m > 0 ? m : 0;
}

const TAG = 86400000;
const utc = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const tageImMonat = (y: number, m0: number) => new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();

/**
 * Tatsächlich bewohnte Monate im Abrechnungszeitraum – anteilig nach Tagen.
 * Einzug am 15. eines Monats zählt nur ~den halben Monat. Ohne Einzug/Auszug
 * wird der gesamte Zeitraum angesetzt.
 */
export function anteiligeMonate(von: string, bis: string, einzug?: string, auszug?: string): number {
  if (!von || !bis) return 0;
  const zeitraumStart = utc(von);
  const zeitraumEnde = utc(bis);
  const occStart = einzug ? Math.max(zeitraumStart, utc(einzug)) : zeitraumStart;
  const occEnde = auszug ? Math.min(zeitraumEnde, utc(auszug)) : zeitraumEnde;
  if (occEnde < occStart) return 0;

  let total = 0;
  const startDate = new Date(zeitraumStart);
  let y = startDate.getUTCFullYear();
  let m = startDate.getUTCMonth();
  const endDate = new Date(zeitraumEnde);
  const endY = endDate.getUTCFullYear();
  const endM = endDate.getUTCMonth();

  while (y < endY || (y === endY && m <= endM)) {
    const dim = tageImMonat(y, m);
    const monatStart = Date.UTC(y, m, 1);
    const monatEnde = Date.UTC(y, m, dim);
    const s = Math.max(monatStart, occStart);
    const e = Math.min(monatEnde, occEnde);
    if (e >= s) {
      const tage = Math.round((e - s) / TAG) + 1; // inklusive beider Randtage
      total += tage / dim;
    }
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return Math.round(total * 100) / 100;
}

/** Gezahlte NK-Vorauszahlung einer Partei im Zeitraum (monatlich × anteilige Monate). */
export function gezahlteVorauszahlung(a: Abrechnung, p: NkPartei): { monate: number; monatlich: number; gesamt: number } {
  const monate = anteiligeMonate(a.von, a.bis, p.einzug, p.auszug);
  if (p.nkVorausMonat != null) {
    return { monate, monatlich: p.nkVorausMonat, gesamt: round2(p.nkVorausMonat * monate) };
  }
  // Fallback: fester Gesamtbetrag (Altdaten)
  const gesamt = p.vorauszahlung || 0;
  return { monate, monatlich: monate > 0 ? round2(gesamt / monate) : 0, gesamt };
}

export function berechneAbrechnung(a: Abrechnung): AbrechnungErgebnis {
  const parteien = a.parteien;

  // Ergebnis je Partei vorbereiten
  const proPartei = new Map<string, PositionsAnteil[]>();
  parteien.forEach((p) => proPartei.set(p.id, []));

  for (const pos of a.positionen) {
    const summeGewicht = parteien.reduce((s, p) => s + gewicht(p, pos.schluessel), 0);
    parteien.forEach((p) => {
      const w = gewicht(p, pos.schluessel);
      // Fällt die Gewichtssumme auf 0 (z. B. keine Personen erfasst), gleichmäßig verteilen.
      const anteil =
        summeGewicht > 0 ? pos.betrag * (w / summeGewicht) : parteien.length > 0 ? pos.betrag / parteien.length : 0;
      proPartei.get(p.id)!.push({
        positionId: pos.id,
        bezeichnung: pos.bezeichnung,
        schluessel: pos.schluessel,
        gesamt: pos.betrag,
        anteil: round2(anteil),
      });
    });
  }

  const ergebnisse: ParteiErgebnis[] = parteien.map((p) => {
    const anteile = proPartei.get(p.id)!;
    const gesamtKosten = round2(anteile.reduce((s, x) => s + x.anteil, 0));
    const vz = gezahlteVorauszahlung(a, p);
    return {
      partei: p,
      anteile,
      gesamtKosten,
      monateAnteilig: vz.monate,
      nkVorausMonat: vz.monatlich,
      vorauszahlung: vz.gesamt,
      saldo: round2(vz.gesamt - gesamtKosten),
    };
  });

  return {
    parteien: ergebnisse,
    gesamtKosten: round2(ergebnisse.reduce((s, e) => s + e.gesamtKosten, 0)),
    gesamtVorauszahlung: round2(ergebnisse.reduce((s, e) => s + e.vorauszahlung, 0)),
    gesamtSaldo: round2(ergebnisse.reduce((s, e) => s + e.saldo, 0)),
    monate: monateImZeitraum(a.von, a.bis),
  };
}
