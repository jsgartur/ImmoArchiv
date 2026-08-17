import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection } from "@/components/legal-layout";

export const Route = createFileRoute("/impressum")({
  component: Impressum,
});

function Impressum() {
  return (
    <LegalLayout title="Impressum">
      <LegalSection heading="Angaben gemäß § 5 DDG (ehemals § 5 TMG)">
        <p>
          Artur Kraus
          <br />
          Buchenweg 20
          <br />
          34621 Frielendorf
          <br />
          Deutschland
        </p>
      </LegalSection>

      <LegalSection heading="Kontakt">
        <p>E-Mail: arturkraus2212@gmail.com</p>
      </LegalSection>

      <LegalSection heading="Umsatzsteuer-ID">
        <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: DE463767076</p>
      </LegalSection>

      <LegalSection heading="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
        <p>
          Artur Kraus
          <br />
          Buchenweg 20, 34621 Frielendorf
        </p>
      </LegalSection>

      <LegalSection heading="Streitschlichtung">
        <p>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG).
        </p>
      </LegalSection>

      <LegalSection heading="Haftung für Inhalte">
        <p>
          Die Inhalte dieser Anwendung wurden mit größtmöglicher Sorgfalt erstellt. Für die Richtigkeit,
          Vollständigkeit und Aktualität der Inhalte kann jedoch keine Gewähr übernommen werden. ImmoArchiv ersetzt
          insbesondere keine Rechts- oder Steuerberatung.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
