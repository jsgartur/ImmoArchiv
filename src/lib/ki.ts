import type { Aufgabe, Einheit, Mangel, Mieter, Mietzahlung, Objekt, Profil } from "./store";
import { fmtEUR, monatKey } from "./store";
import { berechneKennzahlen, berechneTilgung, erwarteteMieteFuerMonat, portfolioKennzahlen } from "./immobilienrechner";

export const KI_KEY_STORAGE = "vermietify-anthropic-key";
export const KI_MODELL = "claude-haiku-4-5-20251001"; // Haiku – günstig & schnell

export function getApiKey(): string {
  try {
    return localStorage.getItem(KI_KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}
export function setApiKey(k: string) {
  try {
    localStorage.setItem(KI_KEY_STORAGE, k.trim());
  } catch {
    /* ignore */
  }
}

export interface KiMessage {
  role: "user" | "assistant";
  content: string;
}

/** Baut einen kompakten Kontext-Text über das Portfolio für das System-Prompt. */
export function buildKontext(input: {
  objekte: Objekt[];
  einheiten: Einheit[];
  mieter: Mieter[];
  maengel: Mangel[];
  aufgaben: Aufgabe[];
  mietzahlungen: Mietzahlung[];
  profil: Profil;
}): string {
  const { objekte, einheiten, mieter, maengel, aufgaben, mietzahlungen, profil } = input;
  if (objekte.length === 0) return "Der Nutzer hat noch keine Objekte angelegt.";

  const p = portfolioKennzahlen(objekte);
  const mKey = monatKey();
  const zeilen: string[] = [];

  zeilen.push(
    `PORTFOLIO: ${p.anzahl} Objekte, Marktwert ${fmtEUR(p.gesamtMarktwert)}, Restschuld ${fmtEUR(
      p.gesamtRestschuld,
    )}, Eigenkapital ${fmtEUR(p.eigenkapitalAktuell)}, Cashflow/Monat ${fmtEUR(p.cashflowMonat)}, Einnahmen/Monat ${fmtEUR(
      p.monatskaltmiete,
    )}, Ausgaben/Monat ${fmtEUR(p.ausgabenMonat)}, Vermietungsquote ${p.vermietungsquote?.toFixed(0) ?? "?"}%.`,
  );

  objekte.forEach((o, i) => {
    const k = berechneKennzahlen(o);
    const t = berechneTilgung(o);
    const einheitenIds = einheiten.filter((e) => e.objektId === o.id).map((e) => e.id);
    const mieterDiesesObjekts = mieter
      .filter((m) => einheitenIds.includes(m.einheitId))
      .map((m) => ({ mieter: m, betrag: erwarteteMieteFuerMonat(m, mKey) }))
      .filter((z) => z.betrag > 0);
    const mieteStatus =
      mieterDiesesObjekts.length === 0
        ? "n/a"
        : mieterDiesesObjekts.every(({ mieter: m }) => mietzahlungen.some((z) => z.mieterId === m.id && z.monat === mKey))
          ? "bezahlt"
          : "NOCH OFFEN";
    zeilen.push(
      `OBJEKT ${i + 1}: ${o.adresse} (${o.typ}${o.baujahr ? `, Bj ${o.baujahr}` : ""}${
        o.gesamtwohnflaeche ? `, ${o.gesamtwohnflaeche} m²` : ""
      }). Kaufpreis ${fmtEUR(k.kaufpreis)}, Marktwert ${fmtEUR(k.marktwert)}, ${
        o.vermietet ? "vermietet" : "frei"
      }, Kaltmiete ${fmtEUR(k.monatskaltmiete)}/M, NK-Voraus ${fmtEUR(o.nebenkostenVorauszahlung ?? 0)}/M, Rate ${fmtEUR(
        k.rateMonat,
      )}/M, Cashflow ${fmtEUR(k.cashflowMonat)}/M, Rendite ${k.bruttorendite?.toFixed(1) ?? "?"}%, Restschuld ${
        t.gueltig ? fmtEUR(t.restschuld) : "—"
      }${o.bank ? `, Bank ${o.bank}` : ""}. Miete ${mKey}: ${mieteStatus}.`,
    );
  });

  const offeneMaengel = maengel.filter((m) => m.status !== "erledigt");
  if (offeneMaengel.length)
    zeilen.push(`OFFENE MÄNGEL: ${offeneMaengel.map((m) => `${m.titel} (${m.prioritaet})`).join("; ")}.`);

  const offeneAufgaben = aufgaben.filter((a) => !a.erledigt);
  if (offeneAufgaben.length)
    zeilen.push(
      `OFFENE AUFGABEN: ${offeneAufgaben
        .map((a) => `${a.titel}${a.faelligkeit ? ` (fällig ${a.faelligkeit.slice(0, 10)})` : ""}`)
        .join("; ")}.`,
    );

  if (profil.vorname || profil.nachname) zeilen.push(`VERMIETER: ${profil.vorname} ${profil.nachname}.`);

  return zeilen.join("\n");
}

const SYSTEM_BASIS = `Du bist der KI-Assistent von „ImmoArchiv", einer App für private Vermieter in Deutschland.
Du hilfst konkret und praxisnah bei: Nebenkostenabrechnung, Fragen zum Mietrecht, Erkennen fehlender Dokumente,
Kostenanalyse und Spartipps, Verfassen von E-Mails an Mieter, Monatszusammenfassungen und dem Erkennen ungewöhnlich
hoher Ausgaben. Antworte auf Deutsch, freundlich und kompakt. Nutze die bereitgestellten Portfolio-Daten des Nutzers.
Bei rechtlichen Themen gib einen kurzen Hinweis, dass dies keine Rechtsberatung ersetzt. Erfinde keine Zahlen, die
nicht in den Daten stehen — wenn Daten fehlen, sage das und frage nach.`;

/** Ruft die Claude-API (Haiku) direkt aus dem Browser auf. */
export async function fragKi(messages: KiMessage[], kontext: string): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error("KEIN_KEY");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: KI_MODELL,
      max_tokens: 1024,
      system: `${SYSTEM_BASIS}\n\nAKTUELLE DATEN DES NUTZERS:\n${kontext}`,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API-Fehler ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  const out = (data.content ?? [])
    .filter((c: { type: string }) => c.type === "text")
    .map((c: { text: string }) => c.text)
    .join("\n");
  return out || "(keine Antwort)";
}

export const KI_SCHNELLFRAGEN: { label: string; prompt: string }[] = [
  { label: "Monats-Zusammenfassung", prompt: "Fasse die wichtigsten Ereignisse und Zahlen dieses Monats für mein Portfolio zusammen." },
  { label: "Spartipps", prompt: "Analysiere meine Kosten und gib mir konkrete Spartipps." },
  { label: "Ungewöhnliche Ausgaben", prompt: "Gibt es bei meinen Objekten ungewöhnlich hohe Ausgaben oder Auffälligkeiten?" },
  { label: "Fehlende Dokumente", prompt: "Welche wichtigen Dokumente fehlen bei meinen Objekten (z. B. Grundbuch, Energieausweis)?" },
  { label: "E-Mail an Mieter", prompt: "Schreibe eine freundliche E-Mail an einen Mieter, der die Miete diesen Monat noch nicht gezahlt hat." },
  { label: "Mietrecht-Frage", prompt: "Wie oft und um wie viel darf ich die Miete erhöhen?" },
];
