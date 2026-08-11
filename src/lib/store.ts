import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import {
  fetchObjekte,
  insertObjekt,
  updateObjektRow,
  deleteObjektRow,
  deleteAllObjekte,
} from "./supabase/objekte-sync";
import { fetchProfil, updateProfilRow } from "./supabase/profil-sync";
import {
  fetchEinheiten,
  insertEinheit,
  updateEinheitRow,
  deleteEinheitRow,
} from "./supabase/einheiten-sync";
import {
  fetchMieter,
  insertMieter,
  updateMieterRow,
  deleteMieterRow,
} from "./supabase/mieter-sync";
import {
  fetchMaengel,
  insertMangel,
  updateMangelRow,
  deleteMangelRow,
} from "./supabase/maengel-sync";
import {
  fetchMietzahlungen,
  upsertMietzahlung,
  deleteMietzahlung,
} from "./supabase/mietzahlungen-sync";
import {
  fetchAbrechnungen,
  insertAbrechnung,
  updateAbrechnungRow,
  deleteAbrechnungRow,
} from "./supabase/abrechnungen-sync";
import {
  fetchAufgaben,
  insertAufgabe,
  updateAufgabeRow,
  deleteAufgabeRow,
  deleteAllAufgaben,
} from "./supabase/aufgaben-sync";
import {
  fetchHandwerker,
  insertHandwerker,
  updateHandwerkerRow,
  deleteHandwerkerRow,
} from "./supabase/handwerker-sync";
import {
  fetchUebergabeprotokolle,
  insertUebergabeprotokoll,
  updateUebergabeprotokollRow,
  deleteUebergabeprotokollRow,
} from "./supabase/uebergabe-sync";
import {
  fetchBenachrichtigungen,
  markiereBenachrichtigungGelesenRow,
  markiereAlleBenachrichtigungenGelesenRow,
} from "./supabase/benachrichtigungen-sync";

export type Prioritaet = "niedrig" | "mittel" | "dringend";
export type MangelStatus = "gemeldet" | "in_bearbeitung" | "erledigt";

export type Objekttyp =
  "mehrfamilienhaus" | "eigentumswohnung" | "einfamilienhaus" | "gewerbe" | "garage" | "sonstiges";

export const OBJEKTTYP_LABEL: Record<Objekttyp, string> = {
  mehrfamilienhaus: "Mehrfamilienhaus",
  eigentumswohnung: "Eigentumswohnung",
  einfamilienhaus: "Einfamilienhaus",
  gewerbe: "Gewerbeeinheit",
  garage: "Garage/Stellplatz",
  sonstiges: "Sonstiges",
};

export const DOKUMENT_KATEGORIEN = [
  "Grundbuchauszug",
  "Kaufvertrag",
  "Grundriss",
  "Energieausweis",
  "Teilungserklärung",
  "Darlehensvertrag",
  "Versicherung",
  "Sonstiges",
] as const;
export type DokumentKategorie = (typeof DOKUMENT_KATEGORIEN)[number];

export interface Sondertilgung {
  id: string;
  datum: string; // ISO
  betrag: number;
}

export interface Objekt {
  id: string;
  adresse: string; // zusammengesetzte Anzeige-Adresse
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  stadt?: string;
  land?: string;
  typ: Objekttyp;
  baujahr?: number;
  gesamtwohnflaeche?: number; // m²
  grundstuecksflaeche?: number; // m²
  anzahlEinheiten?: number;
  stockwerk?: string; // v. a. bei Eigentumswohnung: z. B. "2. OG links"

  // Kaufdaten
  kaufpreis?: number;
  kaufdatum?: string; // ISO
  kaufnebenkosten?: number; // Grunderwerbsteuer + Notar + Makler (€), absolut
  marktwert?: number; // aktueller geschätzter Marktwert (€); sonst Kaufpreis

  // Finanzierung
  eigenkapital?: number;
  darlehensbetrag?: number;
  zinssatz?: number; // % p. a.
  monatlicheRate?: number; // Bankabtrag / Annuität pro Monat (Zins + Tilgung ans Kreditinstitut)
  bausparBetragMonat?: number; // optionale zusätzliche monatl. Bausparvertrags-Rate (kein Bankdarlehen, fließt nicht in Zins-/Tilgungsrechner ein)
  finanzierungsbeginn?: string; // ISO – Start der Tilgung (sonst Kaufdatum)
  bank?: string; // finanzierende Bank
  zinsbindungBis?: string; // ISO – Ende der Zinsbindung
  sondertilgungen?: Sondertilgung[]; // außerplanmäßige Tilgungen

  // Verträge & Fristen
  versicherungAblauf?: string; // ISO – Ablauf der Gebäudeversicherung
  energieausweisGueltigBis?: string; // ISO – Gültigkeit des Energieausweises

  // Steuer
  grundstuecksanteilProzent?: number; // nicht abschreibbarer Bodenanteil (%), Standard 20
  afaSatz?: number; // AfA-Satz % p. a. (2 / 2,5 / 3)

  // Laufende, nicht umlegbare Kosten
  laufendeKostenMonat?: number; // Verwaltung, Instandhaltungsrücklage etc.

  // Vermietung
  vermietet: boolean;
  istKaltmiete?: number; // aktuelle Monatskaltmiete, wenn vermietet
  zielKaltmiete?: number; // gewünschte Monatskaltmiete, wenn (noch) nicht vermietet
  nebenkostenVorauszahlung?: number; // monatliche NK-Vorauszahlung des Mieters (€)

  bilder?: string[]; // Fotos vom Objekt – Storage-Pfade im Bucket "objekt-bilder", sortiert (erstes = Titelbild)
}

export interface Mietzahlung {
  mieterId: string;
  monat: string; // "YYYY-MM"
  bezahltAm: string; // ISO
  betrag: number;
}

export type Umlageschluessel = "wohnflaeche" | "personen" | "einheiten";

export const UMLAGE_LABEL: Record<Umlageschluessel, string> = {
  wohnflaeche: "Wohnfläche (m²)",
  personen: "Personenzahl",
  einheiten: "pro Einheit (gleich)",
};

/** Typische umlagefähige Betriebskosten nach BetrKV – für Schnell-Auswahl. */
/** Vollständiger Betriebskostenkatalog nach § 2 BetrKV (17 Kostenarten) für die Schnellauswahl. */
export const NK_VORLAGEN: { bezeichnung: string; schluessel: Umlageschluessel }[] = [
  { bezeichnung: "Grundsteuer", schluessel: "wohnflaeche" },
  { bezeichnung: "Wasserversorgung (Frischwasser)", schluessel: "personen" },
  { bezeichnung: "Entwässerung (Abwasser/Niederschlag)", schluessel: "personen" },
  { bezeichnung: "Heizung", schluessel: "wohnflaeche" },
  { bezeichnung: "Warmwasser", schluessel: "wohnflaeche" },
  { bezeichnung: "Heiz- und Warmwasserkosten (verbunden)", schluessel: "wohnflaeche" },
  { bezeichnung: "Aufzug", schluessel: "wohnflaeche" },
  { bezeichnung: "Straßenreinigung", schluessel: "wohnflaeche" },
  { bezeichnung: "Müllbeseitigung", schluessel: "personen" },
  { bezeichnung: "Gebäudereinigung/Ungezieferbekämpfung", schluessel: "wohnflaeche" },
  { bezeichnung: "Gartenpflege", schluessel: "wohnflaeche" },
  { bezeichnung: "Allgemeinstrom (Beleuchtung)", schluessel: "wohnflaeche" },
  { bezeichnung: "Schornsteinfeger", schluessel: "wohnflaeche" },
  { bezeichnung: "Sach- und Haftpflichtversicherung", schluessel: "wohnflaeche" },
  { bezeichnung: "Hauswart/Hausmeister", schluessel: "wohnflaeche" },
  { bezeichnung: "Antenne/Kabelanschluss", schluessel: "wohnflaeche" },
  { bezeichnung: "Waschküche", schluessel: "einheiten" },
  { bezeichnung: "Winterdienst", schluessel: "wohnflaeche" },
  { bezeichnung: "Sonstige Betriebskosten", schluessel: "wohnflaeche" },
];

export interface NkPosition {
  id: string;
  bezeichnung: string;
  betrag: number; // Gesamtkosten der Position im Zeitraum (€)
  schluessel: Umlageschluessel;
  hinweis?: string; // frei, z. B. Belegnummer/Dienstleister
  datum?: string; // ISO – Rechnungs-/Erfassungsdatum
}

export interface NkPartei {
  id: string;
  name: string;
  wohnflaeche: number; // m²
  personen: number;
  nkVorausMonat?: number; // monatliche NK-Vorauszahlung des Mieters (€)
  einzug?: string; // ISO – Einzug (für anteilige Monate); leer = ab Zeitraumbeginn
  auszug?: string; // ISO – Auszug; leer = bis Zeitraumende
  vorauszahlung?: number; // Fallback/manueller Gesamtbetrag (€), wenn kein Monatswert
  einheitId?: string; // Bezug zur Einheit, wenn aus echten Mieterdaten übernommen (für Sortierung nach Etage)
}

export type BriefpapierId = "klassisch" | "modern" | "elegant";

export const BRIEFPAPIER_LABEL: Record<BriefpapierId, string> = {
  klassisch: "Klassisch",
  modern: "Modern",
  elegant: "Elegant",
};

export interface Abrechnung {
  id: string;
  objektId: string;
  titel: string;
  von: string; // ISO
  bis: string; // ISO
  positionen: NkPosition[];
  parteien: NkPartei[];
  briefpapier?: BriefpapierId; // default "klassisch"
  erstelltAm: string; // ISO
}

export type PlanId = "starter" | "professional";

export interface Profil {
  anrede: string;
  vorname: string;
  nachname: string;
  geburtsdatum: string; // ISO (YYYY-MM-DD)
  email: string;
  telefon: string;
  firma: string;
  strasse: string;
  plz: string;
  ort: string;
  land: string;
  kontotyp: "privat" | "unternehmen";
  plan: PlanId;
  avatarUrl?: string; // Storage-Pfad im Bucket "avatare"
  kontoinhaber?: string;
  iban?: string;
  bic?: string;
  stripeCustomerId?: string;
}

export const LEERES_PROFIL: Profil = {
  anrede: "",
  vorname: "",
  nachname: "",
  geburtsdatum: "",
  email: "",
  telefon: "",
  firma: "",
  strasse: "",
  plz: "",
  ort: "",
  land: "Deutschland",
  kontotyp: "privat",
  plan: "starter",
};

export interface Einheit {
  id: string;
  objektId: string;
  bezeichnung: string; // z. B. "Wohnung 1", "EG links"
  wohnflaeche: number;
  zimmer: number;
  stockwerk?: string;
}

export interface Mieter {
  id: string;
  einheitId: string;
  name: string;
  kontakt?: string;
  telefon?: string;
  email?: string;
  mietbeginn: string; // ISO
  mietende?: string; // ISO oder leer
  kaltmiete: number;
  nebenkosten: number;
  kaution?: number;
  portalCode?: string; // Zugangscode fürs Mieterportal (QR-Code + Name)
}

export type AufgabeKategorie = "reparatur" | "wartung" | "frist" | "besichtigung" | "sonstiges";

export const AUFGABE_LABEL: Record<AufgabeKategorie, string> = {
  reparatur: "Reparatur",
  wartung: "Wartung",
  frist: "Frist",
  besichtigung: "Besichtigung",
  sonstiges: "Sonstiges",
};

export const AUFGABE_VORLAGEN: { titel: string; kategorie: AufgabeKategorie }[] = [
  { titel: "Rauchmelder prüfen", kategorie: "wartung" },
  { titel: "Wartung Heizung", kategorie: "wartung" },
  { titel: "Schornsteinfeger-Termin", kategorie: "frist" },
  { titel: "Nebenkostenabrechnung erstellen", kategorie: "frist" },
  { titel: "Legionellenprüfung", kategorie: "wartung" },
  { titel: "Wohnungsbesichtigung", kategorie: "besichtigung" },
];

export interface Aufgabe {
  id: string;
  titel: string;
  beschreibung?: string;
  kategorie: AufgabeKategorie;
  faelligkeit?: string; // ISO
  objektId?: string;
  erledigt: boolean;
  erstelltAm: string; // ISO
}

export interface MangelVerlauf {
  datum: string;
  text: string;
}

export interface Mangel {
  id: string;
  einheitId: string;
  titel: string;
  beschreibung: string;
  status: MangelStatus;
  prioritaet: Prioritaet;
  fotos: string[]; // data URLs
  gemeldetVon: "mieter" | "vermieter";
  gemeldetAm: string;
  handwerker?: string;
  kostenGeschaetzt?: number;
  kostenTatsaechlich?: number;
  verlauf: MangelVerlauf[];
}

export type BenachrichtigungTyp = "schaden" | "system" | "sonstiges";

export interface Benachrichtigung {
  id: string;
  typ: BenachrichtigungTyp;
  titel: string;
  text?: string;
  gelesen: boolean;
  objektId?: string;
  erstelltAm: string; // ISO
}

export interface Handwerker {
  id: string;
  name: string;
  gewerk?: string;
  telefon?: string;
  email?: string;
  notizen?: string;
}

export type UebergabeTyp = "einzug" | "auszug";

export interface UebergabeRaum {
  id: string;
  name: string;
  zustand: string;
  fotos: string[]; // Base64 data URLs
}

export interface Zaehlerstand {
  id: string;
  bezeichnung: string; // z. B. "Strom", "Wasser kalt", "Gas"
  zaehlernummer?: string;
  stand: number;
  einheit?: string; // z. B. "kWh", "m³"
}

export interface Uebergabeprotokoll {
  id: string;
  einheitId: string;
  mieterId?: string;
  typ: UebergabeTyp;
  datum: string; // ISO
  raeume: UebergabeRaum[];
  zaehlerstaende: Zaehlerstand[];
  schluesselAnzahl?: number;
  bemerkungen?: string;
  unterschriftMieter?: string; // Base64 PNG
  unterschriftVermieter?: string; // Base64 PNG
  erstelltAm: string; // ISO
}

interface State {
  objekte: Objekt[];
  objekteGeladen: boolean;
  ladeObjekteVonSupabase: () => Promise<void>;
  einheiten: Einheit[];
  einheitenGeladen: boolean;
  ladeEinheitenVonSupabase: () => Promise<void>;
  mieter: Mieter[];
  mieterGeladen: boolean;
  ladeMieterVonSupabase: () => Promise<void>;
  maengel: Mangel[];
  maengelGeladen: boolean;
  ladeMaengelVonSupabase: () => Promise<void>;
  mietzahlungen: Mietzahlung[];
  mietzahlungenGeladen: boolean;
  ladeMietzahlungenVonSupabase: () => Promise<void>;
  abrechnungen: Abrechnung[];
  abrechnungenGeladen: boolean;
  ladeAbrechnungenVonSupabase: () => Promise<void>;
  aufgaben: Aufgabe[];
  aufgabenGeladen: boolean;
  ladeAufgabenVonSupabase: () => Promise<void>;
  handwerker: Handwerker[];
  handwerkerGeladen: boolean;
  ladeHandwerkerVonSupabase: () => Promise<void>;
  uebergabeprotokolle: Uebergabeprotokoll[];
  uebergabeprotokolleGeladen: boolean;
  ladeUebergabeprotokolleVonSupabase: () => Promise<void>;
  profil: Profil;
  profilGeladen: boolean;
  ladeProfilVonSupabase: () => Promise<void>;
  benachrichtigungen: Benachrichtigung[];
  benachrichtigungenGeladen: boolean;
  ladeBenachrichtigungenVonSupabase: () => Promise<void>;
  markiereBenachrichtigungGelesen: (id: string) => void;
  markiereAlleBenachrichtigungenGelesen: () => void;
  gelesenVirtuelleBenachrichtigungen: string[];
  markiereVirtuelleBenachrichtigungGelesen: (id: string) => void;

  updateProfil: (patch: Partial<Profil>) => void;

  addAufgabe: (
    a: Omit<Aufgabe, "id" | "erstelltAm" | "erledigt"> & { erledigt?: boolean },
  ) => string;
  updateAufgabe: (id: string, patch: Partial<Aufgabe>) => void;
  toggleAufgabe: (id: string) => void;
  removeAufgabe: (id: string) => void;

  addHandwerker: (h: Omit<Handwerker, "id">) => string;
  updateHandwerker: (id: string, patch: Partial<Handwerker>) => void;
  removeHandwerker: (id: string) => void;

  addUebergabeprotokoll: (p: Omit<Uebergabeprotokoll, "id" | "erstelltAm">) => string;
  updateUebergabeprotokoll: (id: string, patch: Partial<Uebergabeprotokoll>) => void;
  removeUebergabeprotokoll: (id: string) => void;

  addAbrechnung: (a: Omit<Abrechnung, "id" | "erstelltAm">) => string;
  updateAbrechnung: (id: string, patch: Partial<Abrechnung>) => void;
  removeAbrechnung: (id: string) => void;

  addObjekt: (o: Omit<Objekt, "id"> & { id?: string }) => string;
  updateObjekt: (id: string, patch: Partial<Objekt>) => void;
  removeObjekt: (id: string) => void;
  addBilder: (objektId: string, dataUrls: string[]) => void;
  removeBild: (objektId: string, index: number) => void;
  insertBild: (objektId: string, index: number, dataUrl: string) => void;
  moveBild: (objektId: string, index: number, richtung: -1 | 1) => void;

  setMieteBezahlt: (mieterId: string, monat: string, bezahlt: boolean, betrag: number) => void;

  addEinheit: (e: Omit<Einheit, "id">) => string;
  updateEinheit: (id: string, patch: Partial<Einheit>) => void;
  removeEinheit: (id: string) => void;

  addMieter: (m: Omit<Mieter, "id">) => string;
  updateMieter: (id: string, patch: Partial<Mieter>) => void;
  removeMieter: (id: string) => void;

  addMangel: (m: Omit<Mangel, "id" | "verlauf" | "gemeldetAm"> & { gemeldetAm?: string }) => string;
  updateMangel: (id: string, patch: Partial<Mangel>) => void;
  setMangelStatus: (id: string, status: MangelStatus) => void;
  addMangelNotiz: (id: string, text: string) => void;
  removeMangel: (id: string) => void;

  seedBeispiel: () => void;
  reset: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);
/** Für Supabase-persistierte Tabellen (uuid-Primärschlüssel) – echte UUIDs statt uid(). */
const newUuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : uid();

/** Extrahiert eine lesbare Meldung aus Error-Objekten UND Supabase-Fehlern (PostgrestError ist kein Error, sondern ein {message,...}-Objekt). */
const fehlerText = (e: unknown): string => {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e)
    return String((e as { message: unknown }).message);
  return String(e);
};

/** Kurzer, gut lesbarer Zugangscode fürs Mieterportal (ohne verwechselbare Zeichen wie 0/O, 1/I/l). */
const PORTAL_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const newPortalCode = () =>
  Array.from(
    { length: 10 },
    () => PORTAL_CODE_ALPHABET[Math.floor(Math.random() * PORTAL_CODE_ALPHABET.length)],
  ).join("");

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      objekte: [],
      objekteGeladen: false,

      ladeObjekteVonSupabase: async () => {
        try {
          const objekte = await fetchObjekte();
          set({ objekte, objekteGeladen: true });
        } catch (e) {
          console.error("Objekte konnten nicht geladen werden:", e);
          toast.error("Objekte konnten nicht geladen werden. Bitte Seite neu laden.");
          set({ objekteGeladen: true });
        }
      },

      einheiten: [],
      einheitenGeladen: false,
      ladeEinheitenVonSupabase: async () => {
        try {
          const einheiten = await fetchEinheiten();
          set({ einheiten, einheitenGeladen: true });
        } catch (e) {
          console.error("Einheiten konnten nicht geladen werden:", e);
          toast.error("Einheiten konnten nicht geladen werden. Bitte Seite neu laden.");
          set({ einheitenGeladen: true });
        }
      },
      mieter: [],
      mieterGeladen: false,
      ladeMieterVonSupabase: async () => {
        try {
          const mieter = await fetchMieter();
          set({ mieter, mieterGeladen: true });
        } catch (e) {
          console.error("Mieter konnten nicht geladen werden:", e);
          toast.error("Mieter konnten nicht geladen werden. Bitte Seite neu laden.");
          set({ mieterGeladen: true });
        }
      },
      maengel: [],
      maengelGeladen: false,
      ladeMaengelVonSupabase: async () => {
        try {
          const maengel = await fetchMaengel();
          set({ maengel, maengelGeladen: true });
        } catch (e) {
          console.error("Mängel konnten nicht geladen werden:", e);
          toast.error("Mängel konnten nicht geladen werden. Bitte Seite neu laden.");
          set({ maengelGeladen: true });
        }
      },
      mietzahlungen: [],
      mietzahlungenGeladen: false,
      ladeMietzahlungenVonSupabase: async () => {
        try {
          const mietzahlungen = await fetchMietzahlungen();
          set({ mietzahlungen, mietzahlungenGeladen: true });
        } catch (e) {
          console.error("Mietzahlungen konnten nicht geladen werden:", e);
          toast.error("Mietzahlungen konnten nicht geladen werden. Bitte Seite neu laden.");
          set({ mietzahlungenGeladen: true });
        }
      },
      abrechnungen: [],
      abrechnungenGeladen: false,
      ladeAbrechnungenVonSupabase: async () => {
        try {
          const abrechnungen = await fetchAbrechnungen();
          set({ abrechnungen, abrechnungenGeladen: true });
        } catch (e) {
          console.error("Nebenkostenabrechnungen konnten nicht geladen werden:", e);
          toast.error("Abrechnungen konnten nicht geladen werden. Bitte Seite neu laden.");
          set({ abrechnungenGeladen: true });
        }
      },
      aufgaben: [],
      aufgabenGeladen: false,
      ladeAufgabenVonSupabase: async () => {
        try {
          const aufgaben = await fetchAufgaben();
          set({ aufgaben, aufgabenGeladen: true });
        } catch (e) {
          console.error("Aufgaben konnten nicht geladen werden:", e);
          toast.error("Aufgaben konnten nicht geladen werden. Bitte Seite neu laden.");
          set({ aufgabenGeladen: true });
        }
      },
      handwerker: [],
      handwerkerGeladen: false,
      ladeHandwerkerVonSupabase: async () => {
        try {
          const handwerker = await fetchHandwerker();
          set({ handwerker, handwerkerGeladen: true });
        } catch (e) {
          console.error("Handwerker konnten nicht geladen werden:", e);
          toast.error("Handwerker konnten nicht geladen werden. Bitte Seite neu laden.");
          set({ handwerkerGeladen: true });
        }
      },
      uebergabeprotokolle: [],
      uebergabeprotokolleGeladen: false,
      ladeUebergabeprotokolleVonSupabase: async () => {
        try {
          const uebergabeprotokolle = await fetchUebergabeprotokolle();
          set({ uebergabeprotokolle, uebergabeprotokolleGeladen: true });
        } catch (e) {
          console.error("Übergabeprotokolle konnten nicht geladen werden:", e);
          toast.error("Übergabeprotokolle konnten nicht geladen werden. Bitte Seite neu laden.");
          set({ uebergabeprotokolleGeladen: true });
        }
      },
      profil: LEERES_PROFIL,
      profilGeladen: false,

      ladeProfilVonSupabase: async () => {
        try {
          const profil = await fetchProfil();
          set({ profil: profil ?? LEERES_PROFIL, profilGeladen: true });
        } catch (e) {
          console.error("Profil konnte nicht geladen werden:", e);
          toast.error("Profil konnte nicht geladen werden. Bitte Seite neu laden.");
          set({ profilGeladen: true });
        }
      },

      updateProfil: (patch) => {
        set((s) => ({ profil: { ...s.profil, ...patch } }));
        updateProfilRow(patch).catch((e) => {
          console.error("Profil konnte nicht gespeichert werden:", e);
          toast.error(`Änderung konnte nicht in der Cloud gespeichert werden: ${fehlerText(e)}`);
        });
      },

      benachrichtigungen: [],
      benachrichtigungenGeladen: false,
      ladeBenachrichtigungenVonSupabase: async () => {
        try {
          const benachrichtigungen = await fetchBenachrichtigungen();
          set({ benachrichtigungen, benachrichtigungenGeladen: true });
        } catch (e) {
          console.error("Benachrichtigungen konnten nicht geladen werden:", e);
          set({ benachrichtigungenGeladen: true });
        }
      },
      markiereBenachrichtigungGelesen: (id) => {
        set((s) => ({
          benachrichtigungen: s.benachrichtigungen.map((b) =>
            b.id === id ? { ...b, gelesen: true } : b,
          ),
        }));
        markiereBenachrichtigungGelesenRow(id).catch((e) =>
          console.error("Benachrichtigung konnte nicht als gelesen markiert werden:", e),
        );
      },
      markiereAlleBenachrichtigungenGelesen: () => {
        set((s) => ({
          benachrichtigungen: s.benachrichtigungen.map((b) => ({ ...b, gelesen: true })),
        }));
        markiereAlleBenachrichtigungenGelesenRow().catch((e) =>
          console.error("Benachrichtigungen konnten nicht als gelesen markiert werden:", e),
        );
      },
      gelesenVirtuelleBenachrichtigungen: [],
      markiereVirtuelleBenachrichtigungGelesen: (id) => {
        set((s) =>
          s.gelesenVirtuelleBenachrichtigungen.includes(id)
            ? s
            : { gelesenVirtuelleBenachrichtigungen: [...s.gelesenVirtuelleBenachrichtigungen, id] },
        );
      },

      addAufgabe: (a) => {
        const id = newUuid();
        const neu: Aufgabe = { erledigt: false, ...a, id, erstelltAm: new Date().toISOString() };
        set((s) => ({ aufgaben: [...s.aufgaben, neu] }));
        insertAufgabe(id, neu).catch((e) => {
          console.error("Aufgabe konnte nicht gespeichert werden:", e);
          toast.error("Aufgabe konnte nicht in der Cloud gespeichert werden.");
        });
        return id;
      },
      updateAufgabe: (id, patch) => {
        set((s) => ({ aufgaben: s.aufgaben.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
        updateAufgabeRow(id, patch).catch((e) => {
          console.error("Aufgabe konnte nicht aktualisiert werden:", e);
          toast.error("Änderung konnte nicht gespeichert werden.");
        });
      },
      toggleAufgabe: (id) => {
        const aufgabe = get().aufgaben.find((a) => a.id === id);
        if (!aufgabe) return;
        const erledigt = !aufgabe.erledigt;
        set((s) => ({ aufgaben: s.aufgaben.map((a) => (a.id === id ? { ...a, erledigt } : a)) }));
        updateAufgabeRow(id, { erledigt }).catch((e) => {
          console.error("Aufgabe konnte nicht aktualisiert werden:", e);
          toast.error("Änderung konnte nicht gespeichert werden.");
        });
      },
      removeAufgabe: (id) => {
        set((s) => ({ aufgaben: s.aufgaben.filter((a) => a.id !== id) }));
        deleteAufgabeRow(id).catch((e) => {
          console.error("Aufgabe konnte nicht gelöscht werden:", e);
          toast.error("Aufgabe konnte nicht aus der Cloud gelöscht werden.");
        });
      },

      addHandwerker: (h) => {
        const id = newUuid();
        const neu: Handwerker = { ...h, id };
        set((s) => ({ handwerker: [...s.handwerker, neu] }));
        insertHandwerker(id, neu).catch((e) => {
          console.error("Handwerker konnte nicht gespeichert werden:", e);
          toast.error("Handwerker konnte nicht in der Cloud gespeichert werden.");
        });
        return id;
      },
      updateHandwerker: (id, patch) => {
        set((s) => ({
          handwerker: s.handwerker.map((h) => (h.id === id ? { ...h, ...patch } : h)),
        }));
        updateHandwerkerRow(id, patch).catch((e) => {
          console.error("Handwerker konnte nicht aktualisiert werden:", e);
          toast.error("Änderung konnte nicht gespeichert werden.");
        });
      },
      removeHandwerker: (id) => {
        set((s) => ({ handwerker: s.handwerker.filter((h) => h.id !== id) }));
        deleteHandwerkerRow(id).catch((e) => {
          console.error("Handwerker konnte nicht gelöscht werden:", e);
          toast.error("Handwerker konnte nicht aus der Cloud gelöscht werden.");
        });
      },

      addUebergabeprotokoll: (p) => {
        const id = newUuid();
        const neu: Uebergabeprotokoll = { ...p, id, erstelltAm: new Date().toISOString() };
        set((s) => ({ uebergabeprotokolle: [...s.uebergabeprotokolle, neu] }));
        insertUebergabeprotokoll(id, neu).catch((e) => {
          console.error("Übergabeprotokoll konnte nicht gespeichert werden:", e);
          toast.error("Übergabeprotokoll konnte nicht in der Cloud gespeichert werden.");
        });
        return id;
      },
      updateUebergabeprotokoll: (id, patch) => {
        set((s) => ({
          uebergabeprotokolle: s.uebergabeprotokolle.map((p) =>
            p.id === id ? { ...p, ...patch } : p,
          ),
        }));
        updateUebergabeprotokollRow(id, patch).catch((e) => {
          console.error("Übergabeprotokoll konnte nicht aktualisiert werden:", e);
          toast.error("Änderung konnte nicht gespeichert werden.");
        });
      },
      removeUebergabeprotokoll: (id) => {
        set((s) => ({ uebergabeprotokolle: s.uebergabeprotokolle.filter((p) => p.id !== id) }));
        deleteUebergabeprotokollRow(id).catch((e) => {
          console.error("Übergabeprotokoll konnte nicht gelöscht werden:", e);
          toast.error("Übergabeprotokoll konnte nicht aus der Cloud gelöscht werden.");
        });
      },

      addAbrechnung: (a) => {
        const id = newUuid();
        const neu: Abrechnung = { ...a, id, erstelltAm: new Date().toISOString() };
        set((s) => ({ abrechnungen: [...s.abrechnungen, neu] }));
        insertAbrechnung(id, neu).catch((e) => {
          console.error("Abrechnung konnte nicht gespeichert werden:", e);
          toast.error("Abrechnung konnte nicht in der Cloud gespeichert werden.");
        });
        return id;
      },
      updateAbrechnung: (id, patch) => {
        set((s) => ({
          abrechnungen: s.abrechnungen.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        }));
        updateAbrechnungRow(id, patch).catch((e) => {
          console.error("Abrechnung konnte nicht aktualisiert werden:", e);
          toast.error("Änderung konnte nicht gespeichert werden.");
        });
      },
      removeAbrechnung: (id) => {
        set((s) => ({ abrechnungen: s.abrechnungen.filter((a) => a.id !== id) }));
        deleteAbrechnungRow(id).catch((e) => {
          console.error("Abrechnung konnte nicht gelöscht werden:", e);
          toast.error("Abrechnung konnte nicht aus der Cloud gelöscht werden.");
        });
      },

      addObjekt: (o) => {
        const id = o.id ?? newUuid();
        const neu: Objekt = { ...o, id };
        set((s) => ({ objekte: [...s.objekte, neu] }));
        insertObjekt(id, neu).catch((e) => {
          console.error("Objekt konnte nicht gespeichert werden:", e);
          toast.error("Objekt konnte nicht in der Cloud gespeichert werden.");
        });
        return id;
      },
      updateObjekt: (id, patch) => {
        set((s) => ({ objekte: s.objekte.map((o) => (o.id === id ? { ...o, ...patch } : o)) }));
        updateObjektRow(id, patch).catch((e) => {
          console.error("Objekt konnte nicht aktualisiert werden:", e);
          toast.error("Änderung konnte nicht gespeichert werden.");
        });
      },
      addBilder: (objektId, dataUrls) => {
        let neueBilder: string[] = [];
        set((s) => ({
          objekte: s.objekte.map((o) => {
            if (o.id !== objektId) return o;
            neueBilder = [...(o.bilder ?? []), ...dataUrls];
            return { ...o, bilder: neueBilder };
          }),
        }));
        updateObjektRow(objektId, { bilder: neueBilder }).catch((e) => {
          console.error("Bilder konnten nicht gespeichert werden:", e);
          toast.error("Bilder konnten nicht in der Cloud gespeichert werden.");
        });
      },
      removeBild: (objektId, index) => {
        let neueBilder: string[] = [];
        set((s) => ({
          objekte: s.objekte.map((o) => {
            if (o.id !== objektId) return o;
            neueBilder = (o.bilder ?? []).filter((_, i) => i !== index);
            return { ...o, bilder: neueBilder };
          }),
        }));
        updateObjektRow(objektId, { bilder: neueBilder }).catch((e) => {
          console.error("Bild konnte nicht entfernt werden:", e);
          toast.error("Änderung konnte nicht gespeichert werden.");
        });
      },
      insertBild: (objektId, index, dataUrl) => {
        let neueBilder: string[] = [];
        set((s) => ({
          objekte: s.objekte.map((o) => {
            if (o.id !== objektId) return o;
            neueBilder = [...(o.bilder ?? [])];
            neueBilder.splice(index, 0, dataUrl);
            return { ...o, bilder: neueBilder };
          }),
        }));
        updateObjektRow(objektId, { bilder: neueBilder }).catch((e) => {
          console.error("Bild konnte nicht wiederhergestellt werden:", e);
          toast.error("Änderung konnte nicht gespeichert werden.");
        });
      },
      moveBild: (objektId, index, richtung) => {
        let neueBilder: string[] = [];
        set((s) => ({
          objekte: s.objekte.map((o) => {
            if (o.id !== objektId) return o;
            const liste = [...(o.bilder ?? [])];
            const ziel = index + richtung;
            if (ziel < 0 || ziel >= liste.length) {
              neueBilder = liste;
              return o;
            }
            [liste[index], liste[ziel]] = [liste[ziel], liste[index]];
            neueBilder = liste;
            return { ...o, bilder: neueBilder };
          }),
        }));
        updateObjektRow(objektId, { bilder: neueBilder }).catch((e) => {
          console.error("Reihenfolge konnte nicht gespeichert werden:", e);
          toast.error("Änderung konnte nicht gespeichert werden.");
        });
      },

      setMieteBezahlt: (mieterId, monat, bezahlt, betrag) => {
        const rest = get().mietzahlungen.filter(
          (z) => !(z.mieterId === mieterId && z.monat === monat),
        );
        const bezahltAm = new Date().toISOString();
        set({
          mietzahlungen: bezahlt ? [...rest, { mieterId, monat, betrag, bezahltAm }] : rest,
        });
        if (bezahlt) {
          upsertMietzahlung({ mieterId, monat, betrag, bezahltAm }).catch((e) => {
            console.error("Mietzahlung konnte nicht gespeichert werden:", e);
            toast.error("Mietzahlung konnte nicht in der Cloud gespeichert werden.");
          });
        } else {
          deleteMietzahlung(mieterId, monat).catch((e) => {
            console.error("Mietzahlung konnte nicht gelöscht werden:", e);
            toast.error("Mietzahlung konnte nicht aus der Cloud gelöscht werden.");
          });
        }
      },
      removeObjekt: (id) => {
        set((s) => {
          const einheitenIds = s.einheiten.filter((e) => e.objektId === id).map((e) => e.id);
          const mieterIds = s.mieter
            .filter((m) => einheitenIds.includes(m.einheitId))
            .map((m) => m.id);
          return {
            objekte: s.objekte.filter((o) => o.id !== id),
            einheiten: s.einheiten.filter((e) => e.objektId !== id),
            mieter: s.mieter.filter((m) => !einheitenIds.includes(m.einheitId)),
            maengel: s.maengel.filter((m) => !einheitenIds.includes(m.einheitId)),
            mietzahlungen: s.mietzahlungen.filter((z) => !mieterIds.includes(z.mieterId)),
            abrechnungen: s.abrechnungen.filter((a) => a.objektId !== id),
            aufgaben: s.aufgaben.filter((a) => a.objektId !== id),
          };
        });
        deleteObjektRow(id).catch((e) => {
          console.error("Objekt konnte nicht gelöscht werden:", e);
          toast.error("Objekt konnte nicht aus der Cloud gelöscht werden.");
        });
      },

      addEinheit: (e) => {
        const id = newUuid();
        const neu: Einheit = { ...e, id };
        set((s) => ({ einheiten: [...s.einheiten, neu] }));
        insertEinheit(id, neu).catch((err) => {
          console.error("Einheit konnte nicht gespeichert werden:", err);
          toast.error("Einheit konnte nicht in der Cloud gespeichert werden.");
        });
        return id;
      },
      updateEinheit: (id, patch) => {
        set((s) => ({ einheiten: s.einheiten.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
        updateEinheitRow(id, patch).catch((e) => {
          console.error("Einheit konnte nicht aktualisiert werden:", e);
          toast.error("Änderung konnte nicht gespeichert werden.");
        });
      },
      removeEinheit: (id) => {
        set((s) => {
          const mieterIds = s.mieter.filter((m) => m.einheitId === id).map((m) => m.id);
          return {
            einheiten: s.einheiten.filter((e) => e.id !== id),
            mieter: s.mieter.filter((m) => m.einheitId !== id),
            maengel: s.maengel.filter((m) => m.einheitId !== id),
            mietzahlungen: s.mietzahlungen.filter((z) => !mieterIds.includes(z.mieterId)),
          };
        });
        // Mieter/Mängel/Mietzahlungen der Einheit werden serverseitig per ON DELETE CASCADE mitgelöscht.
        deleteEinheitRow(id).catch((e) => {
          console.error("Einheit konnte nicht gelöscht werden:", e);
          toast.error("Einheit konnte nicht aus der Cloud gelöscht werden.");
        });
      },

      addMieter: (m) => {
        const id = newUuid();
        const neu: Mieter = { ...m, id, portalCode: m.portalCode ?? newPortalCode() };
        set((s) => ({ mieter: [...s.mieter, neu] }));
        insertMieter(id, neu).catch((err) => {
          console.error("Mieter konnte nicht gespeichert werden:", err);
          toast.error("Mieter konnte nicht in der Cloud gespeichert werden.");
        });
        return id;
      },
      updateMieter: (id, patch) => {
        set((s) => ({ mieter: s.mieter.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
        updateMieterRow(id, patch).catch((e) => {
          console.error("Mieter konnte nicht aktualisiert werden:", e);
          toast.error("Änderung konnte nicht gespeichert werden.");
        });
      },
      removeMieter: (id) => {
        set((s) => ({
          mieter: s.mieter.filter((m) => m.id !== id),
          mietzahlungen: s.mietzahlungen.filter((z) => z.mieterId !== id),
        }));
        deleteMieterRow(id).catch((e) => {
          console.error("Mieter konnte nicht gelöscht werden:", e);
          toast.error("Mieter konnte nicht aus der Cloud gelöscht werden.");
        });
      },

      addMangel: (m) => {
        const id = newUuid();
        const gemeldetAm = m.gemeldetAm ?? new Date().toISOString();
        const neu: Mangel = {
          ...m,
          id,
          gemeldetAm,
          verlauf: [{ datum: gemeldetAm, text: "Mangel gemeldet" }],
        };
        set((s) => ({ maengel: [...s.maengel, neu] }));
        insertMangel(id, neu).catch((e) => {
          console.error("Mangel konnte nicht gespeichert werden:", e);
          toast.error("Mangel konnte nicht in der Cloud gespeichert werden.");
        });
        return id;
      },
      updateMangel: (id, patch) => {
        set((s) => ({ maengel: s.maengel.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
        updateMangelRow(id, patch).catch((e) => {
          console.error("Mangel konnte nicht aktualisiert werden:", e);
          toast.error("Änderung konnte nicht gespeichert werden.");
        });
      },
      setMangelStatus: (id, status) => {
        const label =
          status === "gemeldet"
            ? "Gemeldet"
            : status === "in_bearbeitung"
              ? "In Bearbeitung genommen"
              : "Als erledigt markiert";
        let neuerVerlauf: MangelVerlauf[] = [];
        set((s) => ({
          maengel: s.maengel.map((m) => {
            if (m.id !== id) return m;
            neuerVerlauf = [...m.verlauf, { datum: new Date().toISOString(), text: label }];
            return { ...m, status, verlauf: neuerVerlauf };
          }),
        }));
        updateMangelRow(id, { status, verlauf: neuerVerlauf }).catch((e) => {
          console.error("Status konnte nicht gespeichert werden:", e);
          toast.error("Status konnte nicht gespeichert werden.");
        });
      },
      addMangelNotiz: (id, text) => {
        let neuerVerlauf: MangelVerlauf[] = [];
        set((s) => ({
          maengel: s.maengel.map((m) => {
            if (m.id !== id) return m;
            neuerVerlauf = [...m.verlauf, { datum: new Date().toISOString(), text }];
            return { ...m, verlauf: neuerVerlauf };
          }),
        }));
        updateMangelRow(id, { verlauf: neuerVerlauf }).catch((e) => {
          console.error("Notiz konnte nicht gespeichert werden:", e);
          toast.error("Notiz konnte nicht gespeichert werden.");
        });
      },
      removeMangel: (id) => {
        set((s) => ({ maengel: s.maengel.filter((m) => m.id !== id) }));
        deleteMangelRow(id).catch((e) => {
          console.error("Mangel konnte nicht gelöscht werden:", e);
          toast.error("Mangel konnte nicht aus der Cloud gelöscht werden.");
        });
      },

      reset: () => {
        set({
          objekte: [],
          einheiten: [],
          mieter: [],
          maengel: [],
          mietzahlungen: [],
          abrechnungen: [],
          aufgaben: [],
        });
        // Einheiten/Mieter/Mängel/Mietzahlungen/Abrechnungen hängen an Objekte und werden
        // serverseitig per ON DELETE CASCADE mitgelöscht. Aufgaben ohne Objektbezug nicht – separat löschen.
        deleteAllObjekte().catch((e) => {
          console.error("Objekte konnten nicht aus der Cloud gelöscht werden:", e);
          toast.error("Löschen in der Cloud fehlgeschlagen.");
        });
        deleteAllAufgaben().catch((e) => {
          console.error("Aufgaben konnten nicht aus der Cloud gelöscht werden:", e);
          toast.error("Löschen in der Cloud fehlgeschlagen.");
        });
      },

      seedBeispiel: () => {
        get().reset();
        const oId = get().addObjekt({
          adresse: "Hauptstraße 12, 34302 Wolfershausen",
          strasse: "Hauptstraße",
          hausnummer: "12",
          plz: "34302",
          stadt: "Wolfershausen",
          land: "Deutschland",
          typ: "mehrfamilienhaus",
          baujahr: 1978,
          gesamtwohnflaeche: 210,
          grundstuecksflaeche: 480,
          anzahlEinheiten: 3,
          kaufpreis: 385000,
          kaufdatum: "2020-06-15",
          kaufnebenkosten: 42000,
          marktwert: 445000,
          eigenkapital: 90000,
          darlehensbetrag: 337000,
          zinssatz: 2.1,
          monatlicheRate: 1450,
          finanzierungsbeginn: "2020-07-01",
          bank: "Sparkasse",
          zinsbindungBis: "2030-06-30",
          grundstuecksanteilProzent: 20,
          afaSatz: 2,
          laufendeKostenMonat: 320,
          vermietet: true,
          istKaltmiete: 1210,
        });
        const e1 = get().addEinheit({
          objektId: oId,
          bezeichnung: "EG links",
          wohnflaeche: 68,
          zimmer: 3,
          stockwerk: "EG",
        });
        const e2 = get().addEinheit({
          objektId: oId,
          bezeichnung: "1. OG",
          wohnflaeche: 82,
          zimmer: 3,
          stockwerk: "1. OG",
        });
        get().addEinheit({
          objektId: oId,
          bezeichnung: "DG",
          wohnflaeche: 60,
          zimmer: 2,
          stockwerk: "DG",
        });
        get().addMieter({
          einheitId: e1,
          name: "Familie Schmidt",
          kontakt: "schmidt@example.de",
          mietbeginn: "2021-04-01",
          kaltmiete: 520,
          nebenkosten: 180,
        });
        get().addMieter({
          einheitId: e2,
          name: "Anna Weber",
          kontakt: "0561 123456",
          mietbeginn: "2023-09-01",
          mietende: "2026-08-31",
          kaltmiete: 690,
          nebenkosten: 210,
        });
        get().addMangel({
          einheitId: e1,
          titel: "Wasserhahn Küche tropft",
          beschreibung: "Undichter Wasserhahn, tropft seit ca. einer Woche.",
          status: "in_bearbeitung",
          prioritaet: "mittel",
          fotos: [],
          gemeldetVon: "mieter",
          handwerker: "Installateur Müller",
          kostenGeschaetzt: 120,
        });
        get().addMangel({
          einheitId: e2,
          titel: "Heizung im Bad wird nicht warm",
          beschreibung: "Handtuchheizkörper bleibt kalt, andere Räume ok.",
          status: "gemeldet",
          prioritaet: "dringend",
          fotos: [],
          gemeldetVon: "mieter",
        });
        const inTagen = (d: number) =>
          new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
        get().addAufgabe({
          titel: "Rauchmelder prüfen",
          kategorie: "wartung",
          objektId: oId,
          faelligkeit: inTagen(20),
        });
        get().addAufgabe({
          titel: "Wartung Heizung",
          kategorie: "wartung",
          objektId: oId,
          faelligkeit: inTagen(-5),
        });
        get().addAufgabe({
          titel: "Nebenkostenabrechnung erstellen",
          kategorie: "frist",
          objektId: oId,
          faelligkeit: inTagen(60),
        });
      },
    }),
    {
      name: "vermietify-v1",
      // Objekte, Profil, Einheiten und Mieter kommen jetzt aus Supabase – nicht mehr aus localStorage.
      partialize: (s) => {
        const {
          objekte: _objekte,
          objekteGeladen: _og,
          profil: _profil,
          profilGeladen: _pg,
          einheiten: _einheiten,
          einheitenGeladen: _eg,
          mieter: _mieter,
          mieterGeladen: _mg,
          maengel: _maengel,
          maengelGeladen: _mag,
          mietzahlungen: _mietzahlungen,
          mietzahlungenGeladen: _mzg,
          abrechnungen: _abrechnungen,
          abrechnungenGeladen: _ag,
          aufgaben: _aufgaben,
          aufgabenGeladen: _aufg,
          handwerker: _handwerker,
          handwerkerGeladen: _hwg,
          uebergabeprotokolle: _uebergabeprotokolle,
          uebergabeprotokolleGeladen: _upg,
          benachrichtigungen: _benachrichtigungen,
          benachrichtigungenGeladen: _bg,
          ...rest
        } = s;
        return rest;
      },
    },
  ),
);

// Hilfsselektoren
export const fmtEUR = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
export const fmtEUR0 = (n: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
export const fmtPct = (n: number) =>
  `${new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(n)} %`;
export const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("de-DE") : "—");

/** Monats-Schlüssel "YYYY-MM" für ein Datum (Standard: heute). */
export const monatKey = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/** Menschlich lesbarer Monat, z. B. "Juli 2026". */
export const monatLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
};

/** Setzt aus Straße/Nr./PLZ/Stadt eine Anzeige-Adresse zusammen. */
export const composeAdresse = (a: {
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  stadt?: string;
}) => {
  const zeile1 = [a.strasse?.trim(), a.hausnummer?.trim()].filter(Boolean).join(" ");
  const zeile2 = [a.plz?.trim(), a.stadt?.trim()].filter(Boolean).join(" ");
  return [zeile1, zeile2].filter(Boolean).join(", ");
};
