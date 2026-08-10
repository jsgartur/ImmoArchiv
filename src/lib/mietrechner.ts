export interface MietrechnerInput {
  aktuelleKaltmiete: number;
  wohnflaeche: number;
  vergleichsmieteProQm: number; // ortsübliche Vergleichsmiete €/m²
  datumLetzteErhoehung: string; // ISO
  angespannterMarkt: boolean;
  plz?: string;
}

export interface MietrechnerErgebnis {
  aktuelleKaltmiete: number;
  aktuellProQm: number;
  vergleichsmiete: number; // Ziel (100 % ortsüblich)
  kappungsgrenzeProzent: number; // 20 oder 15
  maxDurchKappung: number;
  neueMiete: number; // Minimum der beiden
  erhoehungAbsolut: number;
  erhoehungProzent: number;
  sperrfristGewahrt: boolean;
  monateSeitErhoehung: number;
  hinweise: string[];
  schritte: { label: string; wert: string }[];
}

export function berechneMietanpassung(i: MietrechnerInput): MietrechnerErgebnis {
  const hinweise: string[] = [];
  const aktuellProQm = i.aktuelleKaltmiete / i.wohnflaeche;
  const vergleichsmiete = i.vergleichsmieteProQm * i.wohnflaeche;
  const kappungsgrenzeProzent = i.angespannterMarkt ? 15 : 20;
  const maxDurchKappung = i.aktuelleKaltmiete * (1 + kappungsgrenzeProzent / 100);

  // Sperrfrist: Miete darf sich frühestens 15 Monate nach der letzten Erhöhung ändern (§ 558 Abs. 1 BGB, inkl. Ankündigungsfrist entspricht Faustregel 15 Mon.)
  const letzte = new Date(i.datumLetzteErhoehung);
  const jetzt = new Date();
  const monateSeitErhoehung = Math.floor(
    (jetzt.getFullYear() - letzte.getFullYear()) * 12 + (jetzt.getMonth() - letzte.getMonth()),
  );
  const sperrfristGewahrt = monateSeitErhoehung >= 15;
  if (!sperrfristGewahrt) {
    hinweise.push(
      `Achtung: Seit der letzten Mieterhöhung sind erst ${monateSeitErhoehung} Monate vergangen. Eine erneute Erhöhung ist frühestens nach 15 Monaten wirksam.`,
    );
  }

  const zielVergleichsmiete = Math.min(vergleichsmiete, maxDurchKappung);
  const neueMiete = Math.max(i.aktuelleKaltmiete, Math.round(zielVergleichsmiete * 100) / 100);
  const erhoehungAbsolut = Math.round((neueMiete - i.aktuelleKaltmiete) * 100) / 100;
  const erhoehungProzent = Math.round(((neueMiete / i.aktuelleKaltmiete - 1) * 100) * 100) / 100;

  if (vergleichsmiete <= i.aktuelleKaltmiete) {
    hinweise.push("Die aktuelle Miete liegt bereits auf oder über der angegebenen ortsüblichen Vergleichsmiete. Eine Erhöhung nach § 558 BGB ist nicht möglich.");
  } else if (vergleichsmiete > maxDurchKappung) {
    hinweise.push(`Die Kappungsgrenze von ${kappungsgrenzeProzent} % begrenzt die Erhöhung. Ohne Kappungsgrenze wäre die Vergleichsmiete das Ziel.`);
  }

  const schritte = [
    { label: "Aktuelle Kaltmiete", wert: `${i.aktuelleKaltmiete.toFixed(2)} € (${aktuellProQm.toFixed(2)} €/m²)` },
    { label: "Ortsübliche Vergleichsmiete", wert: `${i.vergleichsmieteProQm.toFixed(2)} €/m² × ${i.wohnflaeche} m² = ${vergleichsmiete.toFixed(2)} €` },
    { label: `Kappungsgrenze (${kappungsgrenzeProzent} % / 3 Jahre)`, wert: `max. ${maxDurchKappung.toFixed(2)} €` },
    { label: "Zulässiges Ziel", wert: `${zielVergleichsmiete.toFixed(2)} € (Minimum aus Vergleichsmiete und Kappungsgrenze)` },
    { label: "Neue Miete", wert: `${neueMiete.toFixed(2)} € (+${erhoehungAbsolut.toFixed(2)} € / +${erhoehungProzent.toFixed(2)} %)` },
  ];

  return {
    aktuelleKaltmiete: i.aktuelleKaltmiete,
    aktuellProQm,
    vergleichsmiete,
    kappungsgrenzeProzent,
    maxDurchKappung,
    neueMiete,
    erhoehungAbsolut,
    erhoehungProzent,
    sperrfristGewahrt,
    monateSeitErhoehung,
    hinweise,
    schritte,
  };
}

export function anschreibenText(opts: {
  mieterName: string;
  adresse: string;
  aktuelleKaltmiete: number;
  neueMiete: number;
  wirksamAb: string; // ISO
  vergleichsmieteProQm: number;
  wohnflaeche: number;
}) {
  const wirksam = new Date(opts.wirksamAb).toLocaleDateString("de-DE", { year: "numeric", month: "long" });
  return `Sehr geehrte/r ${opts.mieterName || "Mieter/in"},

hiermit verlange ich gemäß § 558 BGB Ihre Zustimmung zur Erhöhung der Nettokaltmiete für die von Ihnen bewohnte Wohnung ${opts.adresse}.

Bisherige Nettokaltmiete: ${opts.aktuelleKaltmiete.toFixed(2)} €
Neue Nettokaltmiete:     ${opts.neueMiete.toFixed(2)} €
Wirksam ab:              ${wirksam}

Begründung: Die verlangte Miete entspricht der ortsüblichen Vergleichsmiete für Wohnungen vergleichbarer Art, Größe, Ausstattung, Beschaffenheit und Lage. Als Vergleichswert wird ein Mietspiegelwert von ${opts.vergleichsmieteProQm.toFixed(2)} €/m² bei einer Wohnfläche von ${opts.wohnflaeche} m² zugrunde gelegt.

Die gesetzliche Kappungsgrenze innerhalb von drei Jahren wird eingehalten. Ich bitte Sie, der Mieterhöhung bis zum Ablauf des zweiten Kalendermonats nach Zugang dieses Schreibens zuzustimmen.

Mit freundlichen Grüßen
`;
}
