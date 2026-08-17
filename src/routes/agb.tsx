import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection } from "@/components/legal-layout";

export const Route = createFileRoute("/agb")({
  component: Agb,
});

function Agb() {
  return (
    <LegalLayout title="Allgemeine Geschäftsbedingungen">
      <LegalSection heading="1. Geltungsbereich">
        <p>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Software ImmoArchiv, angeboten
          von Artur Kraus, Buchenweg 20, 34621 Frielendorf (nachfolgend „Anbieter"), durch registrierte
          Nutzer:innen (nachfolgend „Nutzer").
        </p>
      </LegalSection>

      <LegalSection heading="2. Vertragsschluss und Leistungsbeschreibung">
        <p>
          Der Vertrag über die Nutzung von ImmoArchiv kommt mit erfolgreicher Registrierung eines Kontos zustande.
          ImmoArchiv ist eine cloudbasierte Anwendung zur Verwaltung von Immobilien, Mietverhältnissen, Mängeln und
          Nebenkostenabrechnungen. Der genaue Funktionsumfang richtet sich nach dem gewählten Plan (Starter,
          Professional, Enterprise) gemäß der aktuellen{" "}
          <a href="/dashboard/preise" className="underline underline-offset-2 hover:text-foreground">
            Preisliste
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="3. Preise und Zahlungsbedingungen">
        <p>
          Der Starter-Plan ist dauerhaft kostenlos. Kostenpflichtige Pläne (aktuell: Professional) werden monatlich
          oder jährlich im Voraus über den Zahlungsdienstleister Stripe abgerechnet. Alle Preise verstehen sich
          inklusive der gesetzlichen Umsatzsteuer, soweit anwendbar. Mit Abschluss des Bestellvorgangs bei Stripe
          verpflichtet sich der Nutzer zur Zahlung des jeweils gültigen Preises für den gewählten Abrechnungszeitraum.
        </p>
      </LegalSection>

      <LegalSection heading="4. Vertragslaufzeit und Kündigung">
        <p>
          Kostenpflichtige Pläne verlängern sich automatisch um den gewählten Abrechnungszeitraum (monatlich oder
          jährlich), sofern sie nicht vor Ablauf gekündigt werden. Die Kündigung ist jederzeit zum Ende des
          laufenden Abrechnungszeitraums über die Kündigungsseite (immoarchiv.com/kuendigen) oder über das
          Kundenportal (Konto-Seite → „Zahlung verwalten") möglich. Der Starter-Plan sowie das Nutzerkonto
          insgesamt können jederzeit über die Konto-Seite („Konto unwiderruflich löschen") beendet werden.
        </p>
      </LegalSection>

      <LegalSection heading="5. Pflichten des Nutzers">
        <ul className="list-disc space-y-1 pl-5">
          <li>Wahrheitsgemäße Angaben bei der Registrierung</li>
          <li>Sichere Aufbewahrung der Zugangsdaten; Mitteilung bei Verdacht auf unbefugten Zugriff</li>
          <li>Rechtmäßige Nutzung, insbesondere Beachtung der Datenschutzrechte der eingegebenen Mieter (siehe auch unseren Auftragsverarbeitungsvertrag)</li>
        </ul>
      </LegalSection>

      <LegalSection heading="6. Verfügbarkeit und Haftung">
        <p>
          Der Anbieter bemüht sich um eine möglichst unterbrechungsfreie Verfügbarkeit von ImmoArchiv, kann diese
          jedoch nicht garantieren (z. B. bei Wartungsarbeiten oder Ausfällen des Hosting-Anbieters). ImmoArchiv
          ersetzt keine Rechts-, Steuer- oder sonstige fachliche Beratung. Der Anbieter haftet unbeschränkt für
          Vorsatz und grobe Fahrlässigkeit sowie nach dem Produkthaftungsgesetz. Für leichte Fahrlässigkeit haftet
          der Anbieter nur bei Verletzung wesentlicher Vertragspflichten und begrenzt auf den vertragstypisch
          vorhersehbaren Schaden.
        </p>
      </LegalSection>

      <LegalSection heading="7. Änderungen dieser AGB">
        <p>
          Der Anbieter kann diese AGB mit Wirkung für die Zukunft ändern, soweit dies zur Anpassung an geänderte
          rechtliche oder technische Rahmenbedingungen erforderlich ist. Über wesentliche Änderungen wird per
          E-Mail oder in der Anwendung informiert.
        </p>
      </LegalSection>

      <LegalSection heading="8. Widerrufsbelehrung für Verbraucher">
        <p className="font-medium text-foreground">Widerrufsrecht</p>
        <p>
          Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die
          Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses (Abschluss der Bestellung eines
          kostenpflichtigen Plans). Um Ihr Widerrufsrecht auszuüben, müssen Sie uns ({" "}
          Artur Kraus, Buchenweg 20, 34621 Frielendorf, arturkraus2212@gmail.com) mittels einer eindeutigen
          Erklärung (z. B. per E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Zur
          Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts
          vor Ablauf der Widerrufsfrist absenden.
        </p>
        <p className="mt-2 font-medium text-foreground">Folgen des Widerrufs</p>
        <p>
          Wenn Sie diesen Vertrag widerrufen, erstatten wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben,
          unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurück, an dem die Mitteilung über Ihren
          Widerruf bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie
          bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas
          anderes vereinbart.
        </p>
        <p className="mt-2 font-medium text-foreground">Vorzeitiges Erlöschen des Widerrufsrechts</p>
        <p>
          Haben Sie ausdrücklich zugestimmt, dass wir mit der Ausführung der Dienstleistung (Freischaltung des
          kostenpflichtigen Plans) bereits vor Ablauf der Widerrufsfrist beginnen, und haben Sie Ihre Kenntnis
          davon bestätigt, dass Sie durch diese Zustimmung mit Beginn der Ausführung Ihr Widerrufsrecht verlieren,
          sobald wir den Vertrag vollständig erfüllt haben, erlischt Ihr Widerrufsrecht in diesem Fall vorzeitig.
        </p>
      </LegalSection>

      <LegalSection heading="9. Schlussbestimmungen">
        <p>
          Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Sollten einzelne
          Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
        </p>
      </LegalSection>

      <p className="text-xs">Stand: {new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</p>
    </LegalLayout>
  );
}
