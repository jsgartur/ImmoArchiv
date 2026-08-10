import { jsPDF } from "jspdf";
import type { Abrechnung, Objekt, Profil } from "./store";
import { fmtDate, UMLAGE_LABEL } from "./store";
import { berechneAbrechnung } from "./nebenkosten";

const eur = (n: number) =>
  new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + " EUR";

/** Erzeugt eine PDF-Betriebskostenabrechnung und startet den Download. */
export function erzeugeNkPdf(abrechnung: Abrechnung, objekt: Objekt | undefined, profil: Profil) {
  const r = berechneAbrechnung(abrechnung);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const M = 18; // Rand
  const W = 210;
  const rechts = W - M;
  let y = 20;

  const linie = () => {
    doc.setDrawColor(210);
    doc.line(M, y, rechts, y);
    y += 6;
  };
  const seitenumbruch = (bedarf = 20) => {
    if (y + bedarf > 285) {
      doc.addPage();
      y = 20;
    }
  };

  // Absender
  doc.setFontSize(9);
  doc.setTextColor(110);
  const absender = [
    [profil.vorname, profil.nachname].filter(Boolean).join(" "),
    profil.strasse,
    [profil.plz, profil.ort].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(" · ");
  if (absender) doc.text(absender, M, y);
  y += 8;

  // Titel
  doc.setTextColor(20);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(abrechnung.titel || "Nebenkostenabrechnung", M, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`${objekt?.adresse ?? ""}`, M, y);
  y += 5;
  doc.text(`Abrechnungszeitraum: ${fmtDate(abrechnung.von)} – ${fmtDate(abrechnung.bis)}`, M, y);
  y += 8;
  doc.setTextColor(20);
  linie();

  // Parteien
  r.parteien.forEach((pe) => {
    seitenumbruch(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(pe.partei.name, M, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text(`${pe.partei.wohnflaeche} m² · ${pe.partei.personen} Pers.`, rechts, y, { align: "right" });
    doc.setTextColor(20);
    y += 6;

    doc.setFontSize(10);
    pe.anteile.forEach((an) => {
      seitenumbruch(12);
      doc.setTextColor(90);
      const label = `${an.bezeichnung || "—"} (${UMLAGE_LABEL[an.schluessel]})`;
      doc.text(label, M + 2, y);
      doc.setTextColor(20);
      doc.text(eur(an.anteil), rechts, y, { align: "right" });
      y += 5.5;
    });

    y += 1;
    doc.setDrawColor(230);
    doc.line(M, y, rechts, y);
    y += 5;

    doc.text("Umlagefähige Kosten (Anteil)", M + 2, y);
    doc.text(eur(pe.gesamtKosten), rechts, y, { align: "right" });
    y += 5.5;
    doc.text("Geleistete Vorauszahlung", M + 2, y);
    doc.text("- " + eur(pe.vorauszahlung), rechts, y, { align: "right" });
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const saldoLabel = pe.saldo >= 0 ? "Guthaben (Erstattung)" : "Nachzahlung";
    doc.text(saldoLabel, M + 2, y);
    doc.text(eur(Math.abs(pe.saldo)), rechts, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y += 10;
  });

  // Gesamt
  seitenumbruch(30);
  linie();
  doc.setFontSize(10);
  doc.text("Gesamtkosten", M, y);
  doc.text(eur(r.gesamtKosten), rechts, y, { align: "right" });
  y += 5.5;
  doc.text("Summe Vorauszahlungen", M, y);
  doc.text(eur(r.gesamtVorauszahlung), rechts, y, { align: "right" });
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(r.gesamtSaldo >= 0 ? "Gesamtsaldo (Guthaben)" : "Gesamtsaldo (Nachzahlung)", M, y);
  doc.text(eur(Math.abs(r.gesamtSaldo)), rechts, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  y += 12;

  // Fußnote
  doc.setFontSize(8);
  doc.setTextColor(130);
  const hinweis =
    "Nur tatsächlich umlagefähige Betriebskosten (§ 2 BetrKV) dürfen umgelegt werden. Diese Abrechnung ist eine Rechenhilfe und ersetzt keine rechtliche Prüfung.";
  doc.text(doc.splitTextToSize(hinweis, rechts - M), M, y);

  const dateiname = `${(abrechnung.titel || "Nebenkostenabrechnung").replace(/[^\w\-]+/g, "_")}.pdf`;
  doc.save(dateiname);
}
