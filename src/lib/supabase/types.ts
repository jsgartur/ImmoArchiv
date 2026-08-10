/**
 * Handgeschriebene Typen für das Supabase-Schema (supabase/migrations/0001_init.sql).
 * Spiegeln die Tabellen 1:1 – bei Schemaänderungen hier mitpflegen (oder später
 * mit `supabase gen types typescript` automatisch generieren).
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface SondertilgungRow {
  id: string;
  datum: string;
  betrag: number;
}

export interface VerlaufEintragRow {
  datum: string;
  text: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          anrede: string | null;
          vorname: string | null;
          nachname: string | null;
          geburtsdatum: string | null;
          email: string | null;
          telefon: string | null;
          firma: string | null;
          strasse: string | null;
          plz: string | null;
          ort: string | null;
          land: string | null;
          plan: "starter" | "professional" | "enterprise";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      objekte: {
        Row: {
          id: string;
          user_id: string;
          adresse: string;
          strasse: string | null;
          hausnummer: string | null;
          plz: string | null;
          stadt: string | null;
          land: string | null;
          typ: "mehrfamilienhaus" | "eigentumswohnung" | "einfamilienhaus" | "gewerbe" | "garage" | "sonstiges";
          baujahr: number | null;
          gesamtwohnflaeche: number | null;
          grundstuecksflaeche: number | null;
          anzahl_einheiten: number | null;
          stockwerk: string | null;
          kaufpreis: number | null;
          kaufdatum: string | null;
          kaufnebenkosten: number | null;
          marktwert: number | null;
          eigenkapital: number | null;
          darlehensbetrag: number | null;
          zinssatz: number | null;
          monatliche_rate: number | null;
          bauspar_betrag_monat: number | null;
          finanzierungsbeginn: string | null;
          bank: string | null;
          zinsbindung_bis: string | null;
          versicherung_ablauf: string | null;
          energieausweis_gueltig_bis: string | null;
          sondertilgungen: SondertilgungRow[];
          grundstuecksanteil_prozent: number | null;
          afa_satz: number | null;
          laufende_kosten_monat: number | null;
          vermietet: boolean;
          ist_kaltmiete: number | null;
          ziel_kaltmiete: number | null;
          nebenkosten_vorauszahlung: number | null;
          bilder: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["objekte"]["Row"]> & { adresse: string };
        Update: Partial<Database["public"]["Tables"]["objekte"]["Row"]>;
        Relationships: [];
      };
      einheiten: {
        Row: {
          id: string;
          user_id: string;
          objekt_id: string;
          bezeichnung: string;
          wohnflaeche: number;
          zimmer: number;
          stockwerk: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["einheiten"]["Row"]> & { objekt_id: string; bezeichnung: string };
        Update: Partial<Database["public"]["Tables"]["einheiten"]["Row"]>;
        Relationships: [];
      };
      mieter: {
        Row: {
          id: string;
          user_id: string;
          einheit_id: string;
          name: string;
          kontakt: string | null;
          telefon: string | null;
          email: string | null;
          mietbeginn: string | null;
          mietende: string | null;
          kaltmiete: number;
          nebenkosten: number;
          kaution: number | null;
          portal_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["mieter"]["Row"]> & { einheit_id: string; name: string };
        Update: Partial<Database["public"]["Tables"]["mieter"]["Row"]>;
        Relationships: [];
      };
      maengel: {
        Row: {
          id: string;
          user_id: string;
          einheit_id: string;
          titel: string;
          beschreibung: string | null;
          status: "gemeldet" | "in_bearbeitung" | "erledigt";
          prioritaet: "niedrig" | "mittel" | "dringend";
          fotos: string[];
          gemeldet_von: "mieter" | "vermieter";
          gemeldet_am: string;
          handwerker: string | null;
          kosten_geschaetzt: number | null;
          kosten_tatsaechlich: number | null;
          verlauf: VerlaufEintragRow[];
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["maengel"]["Row"]> & { einheit_id: string; titel: string };
        Update: Partial<Database["public"]["Tables"]["maengel"]["Row"]>;
        Relationships: [];
      };
      mietzahlungen: {
        Row: {
          id: string;
          user_id: string;
          objekt_id: string | null;
          mieter_id: string | null;
          monat: string;
          betrag: number;
          bezahlt_am: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["mietzahlungen"]["Row"]> & { mieter_id: string; monat: string };
        Update: Partial<Database["public"]["Tables"]["mietzahlungen"]["Row"]>;
        Relationships: [];
      };
      abrechnungen: {
        Row: {
          id: string;
          user_id: string;
          objekt_id: string;
          titel: string;
          von: string | null;
          bis: string | null;
          positionen: Json;
          parteien: Json;
          erstellt_am: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["abrechnungen"]["Row"]> & { objekt_id: string; titel: string };
        Update: Partial<Database["public"]["Tables"]["abrechnungen"]["Row"]>;
        Relationships: [];
      };
      aufgaben: {
        Row: {
          id: string;
          user_id: string;
          objekt_id: string | null;
          titel: string;
          beschreibung: string | null;
          kategorie: "reparatur" | "wartung" | "frist" | "besichtigung" | "sonstiges";
          faelligkeit: string | null;
          erledigt: boolean;
          erstellt_am: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["aufgaben"]["Row"]> & { titel: string };
        Update: Partial<Database["public"]["Tables"]["aufgaben"]["Row"]>;
        Relationships: [];
      };
      dokumente: {
        Row: {
          id: string;
          user_id: string;
          objekt_id: string | null;
          mieter_id: string | null;
          name: string;
          kategorie: string;
          storage_path: string;
          groesse: number | null;
          hochgeladen_am: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["dokumente"]["Row"]> & { name: string; storage_path: string };
        Update: Partial<Database["public"]["Tables"]["dokumente"]["Row"]>;
        Relationships: [];
      };
      handwerker: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          gewerk: string | null;
          telefon: string | null;
          email: string | null;
          notizen: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["handwerker"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["handwerker"]["Row"]>;
        Relationships: [];
      };
      uebergabeprotokolle: {
        Row: {
          id: string;
          user_id: string;
          einheit_id: string;
          mieter_id: string | null;
          typ: "einzug" | "auszug";
          datum: string;
          raeume: Json;
          zaehlerstaende: Json;
          schluessel_anzahl: number | null;
          bemerkungen: string | null;
          unterschrift_mieter: string | null;
          unterschrift_vermieter: string | null;
          erstellt_am: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["uebergabeprotokolle"]["Row"]> & {
          einheit_id: string;
          typ: "einzug" | "auszug";
        };
        Update: Partial<Database["public"]["Tables"]["uebergabeprotokolle"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
