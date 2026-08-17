import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection } from "@/components/legal-layout";

export const Route = createFileRoute("/avv")({
  component: Avv,
});

function Avv() {
  return (
    <LegalLayout title="Auftragsverarbeitungsvertrag (AVV)">
      <LegalSection heading="1. Worum es hier geht">
        <p>
          Wenn Sie ImmoArchiv nutzen, geben Sie Daten Ihrer Mieter ein (z. B. Name, Kontaktdaten, Mietvertrag,
          Mängelmeldungen). Rechtlich sind <strong>Sie</strong> als Vermieter:in der „Verantwortliche" für diese
          Daten Ihrer Mieter (Art. 4 Nr. 7 DSGVO). ImmoArchiv verarbeitet diese Daten ausschließlich in Ihrem
          Auftrag und ist damit „Auftragsverarbeiter" (Art. 4 Nr. 8 DSGVO). Für diese Konstellation schreibt
          Art. 28 DSGVO einen schriftlichen Auftragsverarbeitungsvertrag vor – das ist dieses Dokument. Mit der
          Nutzung von ImmoArchiv zur Verwaltung von Mieterdaten kommt dieser Vertrag zwischen Ihnen
          (Verantwortlicher) und uns (Auftragsverarbeiter) zustande.
        </p>
      </LegalSection>

      <LegalSection heading="2. Vertragsparteien">
        <p>
          <strong>Verantwortlicher:</strong> Sie als registrierter Nutzer / registrierte Nutzerin von ImmoArchiv.
          <br />
          <strong>Auftragsverarbeiter:</strong>
          <br />
          Artur Kraus
          <br />
          Buchenweg 20, 34621 Frielendorf
          <br />
          arturkraus2212@gmail.com
        </p>
      </LegalSection>

      <LegalSection heading="3. Gegenstand und Dauer der Verarbeitung">
        <p>
          Gegenstand ist die Bereitstellung der Software ImmoArchiv zur Verwaltung von Immobilien, Mietverhältnissen
          und damit zusammenhängenden Vorgängen (Mängel, Nebenkosten, Zahlungen). Die Verarbeitung erfolgt für die
          Dauer Ihres Nutzungsverhältnisses mit ImmoArchiv (Bestehen Ihres Kontos).
        </p>
      </LegalSection>

      <LegalSection heading="4. Art und Zweck der Verarbeitung">
        <p>
          Speicherung, Anzeige, Änderung und Löschung der von Ihnen eingegebenen Mieterdaten innerhalb der App,
          ausschließlich zu dem Zweck, Ihnen die Verwaltungsfunktionen von ImmoArchiv bereitzustellen. Eine
          Verarbeitung zu eigenen Zwecken des Auftragsverarbeiters findet nicht statt.
        </p>
      </LegalSection>

      <LegalSection heading="5. Art der Daten und Kategorien betroffener Personen">
        <p>
          <strong>Betroffene Personen:</strong> Ihre Mieter:innen sowie ggf. weitere im Mietverhältnis genannte
          Kontaktpersonen.
          <br />
          <strong>Datenarten:</strong> Name, Kontaktdaten (Telefon, E-Mail), Mietvertragsdaten (Mietbeginn/-ende,
          Kaltmiete, Nebenkosten, Kaution), Mängelmeldungen inkl. Fotos, sowie ggf. hochgeladene Dokumente
          (z. B. Mietvertrag).
        </p>
      </LegalSection>

      <LegalSection heading="6. Pflichten des Auftragsverarbeiters">
        <ul className="list-disc space-y-1 pl-5">
          <li>Verarbeitung ausschließlich auf dokumentierte Weisung des Verantwortlichen (Ihre Eingaben in der App)</li>
          <li>Gewährleistung, dass zur Verarbeitung befugte Personen zur Vertraulichkeit verpflichtet sind</li>
          <li>Ergreifen der nach Art. 32 DSGVO erforderlichen technischen und organisatorischen Maßnahmen (siehe Punkt 8)</li>
          <li>Unterstützung bei der Erfüllung von Betroffenenrechten (Auskunft, Berichtigung, Löschung) sowie bei Datenschutz-Folgenabschätzungen, soweit zumutbar</li>
          <li>Meldung von Datenschutzverletzungen (Art. 33 DSGVO) an den Verantwortlichen unverzüglich nach Bekanntwerden</li>
          <li>Löschung oder Rückgabe aller Daten nach Ende der Nutzung, soweit keine gesetzliche Aufbewahrungspflicht entgegensteht</li>
          <li>Zugriff auf Ihre Daten zu Support-Zwecken ausschließlich auf Ihre eigene Veranlassung (z. B. bei einer Support-Anfrage) oder soweit zur Fehlerbehebung im Betrieb der Software technisch erforderlich</li>
        </ul>
      </LegalSection>

      <LegalSection heading="7. Weisungsrecht">
        <p>
          Der Verantwortliche erteilt Weisungen grundsätzlich durch die bestimmungsgemäße Nutzung der Software
          (Eingabe, Änderung, Löschung von Daten über die Benutzeroberfläche). Darüberhinausgehende Weisungen
          bedürfen der Textform (z. B. E-Mail) an die in Punkt 2 genannte Kontaktadresse.
        </p>
      </LegalSection>

      <LegalSection heading="8. Technische und organisatorische Maßnahmen (Art. 32 DSGVO)">
        <ul className="list-disc space-y-1 pl-5">
          <li>Verschlüsselte Übertragung (TLS/HTTPS) zwischen Endgerät und Server</li>
          <li>Zugriffskontrolle je Nutzerkonto durch Authentifizierung und Datenbank-Zugriffsregeln (Row Level Security), sodass jede Nutzerin/jeder Nutzer ausschließlich die eigenen Daten einsehen kann</li>
          <li>Passwörter werden ausschließlich verschlüsselt/gehasht gespeichert</li>
          <li>Regelmäßige Backups durch den Hosting-Unterauftragsverarbeiter</li>
          <li>Speicherung in Rechenzentren mit dokumentierten Sicherheitsmaßnahmen (siehe Punkt 9)</li>
        </ul>
      </LegalSection>

      <LegalSection heading="9. Unterauftragsverarbeiter">
        <p>
          Der Auftragsverarbeiter setzt zur Erbringung der Leistung folgenden Unterauftragsverarbeiter ein:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Supabase, Inc.</strong> – Hosting, Datenbank, Authentifizierung und Datei-Speicherung.
            Gewählter Datenbank-Serverstandort: eu-west-1 (Irland, EU). Mit Supabase besteht ein eigener
            Auftragsverarbeitungsvertrag (Data Processing Agreement, siehe supabase.com/legal/dpa).
          </li>
          <li>
            <strong>Vercel Inc.</strong> – Hosting/Auslieferung der Web-Anwendung.
          </li>
          <li>
            <strong>Resend</strong> – Versand von Transaktions-E-Mails (Bestätigungs-, Passwort-Reset- und
            Benachrichtigungs-E-Mails).
          </li>
        </ul>
        <p className="mt-2">
          Bei diesen Anbietern kann eine Verarbeitung teilweise auch außerhalb der EU stattfinden; in diesem Fall
          stellen wir geeignete Garantien sicher (insbesondere EU-Standardvertragsklauseln nach Art. 46 DSGVO).
        </p>
        <p className="mt-2">
          Der Verantwortliche stimmt dem Einsatz dieser Unterauftragsverarbeiter zu. Über den Wechsel oder die
          Hinzuziehung weiterer Unterauftragsverarbeiter wird der Verantwortliche vorab informiert und kann
          innerhalb einer angemessenen Frist widersprechen. Sofern Sie den optionalen KI-Assistenten mit eigenem
          API-Schlüssel aktivieren, übermitteln Sie die dabei ausgewählten Portfoliodaten selbst und auf eigene
          Veranlassung an Anthropic PBC – insoweit wird Anthropic nicht als Unterauftragsverarbeiter dieses
          Vertrags tätig, siehe hierzu Punkt 6 der Datenschutzerklärung.
        </p>
      </LegalSection>

      <LegalSection heading="10. Kontrollrechte">
        <p>
          Der Verantwortliche hat das Recht, sich von der Einhaltung der in diesem Vertrag vereinbarten Pflichten
          des Auftragsverarbeiters zu überzeugen, insbesondere durch Einholung von Auskünften. Der
          Auftragsverarbeiter stellt hierfür auf Anfrage die notwendigen Informationen bereit.
        </p>
      </LegalSection>

      <LegalSection heading="11. Löschung nach Vertragsende">
        <p>
          Mit Löschung Ihres Kontos werden alle in ImmoArchiv gespeicherten Daten – einschließlich der Mieterdaten
          – unwiderruflich gelöscht (siehe Datenschutzerklärung, Punkt 9 und 10). Eine Rückgabe der Daten vor
          Löschung ist über den Export-/Auskunftsweg möglich, sofern Sie dies wünschen.
        </p>
      </LegalSection>

      <LegalSection heading="12. Haftung">
        <p>
          Es gelten die gesetzlichen Haftungsregelungen der DSGVO (Art. 82 DSGVO) sowie ergänzend die
          Haftungsregelungen der Nutzungsbedingungen von ImmoArchiv.
        </p>
      </LegalSection>

      <p className="text-xs">Stand: {new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</p>
    </LegalLayout>
  );
}
