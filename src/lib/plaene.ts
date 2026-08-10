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
      "Mieteingänge, Mängel & Aufgaben",
      "Nebenkostenabrechnung",
      "Sichere Cloud-Speicherung",
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
      "Alles aus Starter",
      "Unbegrenzte Objekte",
      "Restschuld & Tilgungsprognosen",
      "Portfolio-Auswertungen & Diagramme",
      "Mietanpassungs-Rechner",
      "Übergabeprotokolle & Mieterportal",
      "KI-Assistent",
      "Mehrbenutzer & Team-Zugriff",
      "Datenexport (CSV/PDF)",
      "E-Mail-Support (24 h)",
    ],
    cta: "Professional wählen",
    populaer: true,
  },
];

export const planById = (id: PlanId) => PLAENE.find((p) => p.id === id) ?? PLAENE[0];

/** Ob der Plan Zugriff auf die Professional-exklusiven Funktionen hat. */
export const istPro = (plan: PlanId) => plan === "professional";

/** Effektiver Monatspreis je nach Abrechnungszeitraum. */
export const monatspreis = (plan: Plan, jaehrlich: boolean) =>
  jaehrlich ? plan.preisMonat * (1 - JAHRES_RABATT) : plan.preisMonat;
