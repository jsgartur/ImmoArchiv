import type { PlanId } from "./store";

export interface Plan {
  id: PlanId;
  name: string;
  preisMonat: number; // € pro Monat bei monatlicher Zahlung
  beschreibung: string;
  features: string[];
  cta: string;
  populaer?: boolean;
}

export const JAHRES_RABATT = 0.2; // 20 % bei jährlicher Zahlung

export const PLAENE: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    preisMonat: 0,
    beschreibung: "Für den Einstieg mit wenigen Einheiten.",
    features: [
      "Bis zu 3 Objekte",
      "Objekt- & Mieterverwaltung",
      "Mieteingänge & Mängel",
      "Lokale Datenspeicherung",
      "Community-Support",
    ],
    cta: "Kostenlos starten",
  },
  {
    id: "professional",
    name: "Professional",
    preisMonat: 9,
    beschreibung: "Für aktive Vermieter mit mehreren Objekten.",
    features: [
      "Unbegrenzte Objekte",
      "Restschuld & Tilgungsprognosen",
      "Dokumente & Bilder ohne Limit",
      "Auswertungen & Diagramme",
      "Mietanpassungs-Rechner",
      "E-Mail-Support (24 h)",
    ],
    cta: "Professional wählen",
    populaer: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    preisMonat: 29,
    beschreibung: "Für Portfolios und Verwaltung im Team.",
    features: [
      "Alles aus Professional",
      "Mehrbenutzer & Team-Zugriff",
      "Cloud-Sync & Backups",
      "Datenexport (CSV/PDF)",
      "Persönlicher Ansprechpartner",
      "Priorisierter Support (1 h)",
    ],
    cta: "Kontakt aufnehmen",
  },
];

export const planById = (id: PlanId) => PLAENE.find((p) => p.id === id) ?? PLAENE[0];

/** Effektiver Monatspreis je nach Abrechnungszeitraum. */
export const monatspreis = (plan: Plan, jaehrlich: boolean) =>
  jaehrlich ? plan.preisMonat * (1 - JAHRES_RABATT) : plan.preisMonat;
