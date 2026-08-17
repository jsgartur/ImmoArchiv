import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, LegalSection } from "@/components/legal-layout";

export const Route = createFileRoute("/datenschutz")({
  component: Datenschutz,
});

function Datenschutz() {
  return (
    <LegalLayout title="Datenschutzerklärung">
      <LegalSection heading="1. Überblick">
        <p>
          Der Schutz Ihrer persönlichen Daten ist uns wichtig. ImmoArchiv ist eine cloudbasierte Anwendung: Ihre
          Konto- und Objektdaten (Objekte, Mieter, Mängel, Dokumente, Finanzierungen) werden in unserer Datenbank
          bei unserem Hosting-Partner Supabase gespeichert und sind ausschließlich nach Anmeldung mit Ihrem
          persönlichen Konto zugänglich (Zugriffskontrolle „Row Level Security").
        </p>
        <p className="mt-2">
          Wenn Sie in ImmoArchiv Mieterdaten verwalten, sind Sie hierfür der datenschutzrechtlich Verantwortliche;
          ImmoArchiv verarbeitet diese Daten in Ihrem Auftrag. Die dafür nach Art. 28 DSGVO erforderlichen Regelungen
          finden Sie in unserem{" "}
          <Link to="/avv" className="underline underline-offset-2 hover:text-foreground">
            Auftragsverarbeitungsvertrag (AVV)
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection heading="2. Verantwortlicher">
        <p>
          Verantwortlich für die Datenverarbeitung im Sinne der DSGVO:
          <br />
          Artur Kraus
          <br />
          Buchenweg 20, 34621 Frielendorf
          <br />
          arturkraus2212@gmail.com
        </p>
      </LegalSection>

      <LegalSection heading="3. Registrierung und Nutzerkonto">
        <p>
          Bei der Registrierung erheben wir Vorname, Nachname, Geburtsdatum, E-Mail-Adresse und ein von Ihnen
          gewähltes Passwort (dieses wird von unserem Auth-Anbieter ausschließlich verschlüsselt/gehasht
          gespeichert, niemals im Klartext). Rechtsgrundlage ist die Erfüllung des Nutzungsvertrags
          (Art. 6 Abs. 1 lit. b DSGVO). Zur Bestätigung Ihrer E-Mail-Adresse versenden wir eine automatische
          Bestätigungs-E-Mail.
        </p>
      </LegalSection>

      <LegalSection heading="4. Hosting und Auftragsverarbeitung">
        <p>
          Wir setzen für Datenbank, Authentifizierung und Datei-Speicherung den Dienst{" "}
          <strong>Supabase</strong> (Supabase Inc.) als Auftragsverarbeiter im Sinne von Art. 28 DSGVO ein. Mit
          Supabase besteht ein Auftragsverarbeitungsvertrag. Der von uns gewählte Datenbank-Serverstandort ist
          eu-west-1 (Irland, EU). Rechtsgrundlage ist Art. 6 Abs. 1 lit. b und f DSGVO (Vertragserfüllung,
          sicherer Betrieb).
        </p>
        <p className="mt-2">
          Für das Hosting der Web-Anwendung selbst (Auslieferung der Seiten) setzen wir <strong>Vercel Inc.</strong>{" "}
          ein, für den Versand von Transaktions-E-Mails (Bestätigungs-, Passwort-Reset- und Benachrichtigungs-
          E-Mails) <strong>Resend</strong>. Mit beiden Anbietern bestehen Auftragsverarbeitungsverträge.
        </p>
        <p className="mt-2">
          Bei diesen Anbietern kann es vorkommen, dass Verarbeitungsschritte oder eingesetzte Unterauftrag­nehmer
          (z. B. Content-Delivery-Netzwerke) auch außerhalb der EU stattfinden bzw. sitzen. Soweit hierbei
          personenbezogene Daten in Drittländer übermittelt werden, stellen wir dies über geeignete Garantien
          sicher (insbesondere EU-Standardvertragsklauseln nach Art. 46 DSGVO). Eine Aussage, dass ausschließlich
          eine Verarbeitung innerhalb der EU stattfindet, können wir daher nicht uneingeschränkt treffen.
        </p>
      </LegalSection>

      <LegalSection heading="5. Cookies und lokale Speicherung">
        <p>
          Wir verwenden ausschließlich technisch notwendige Speicherung im Browser (localStorage), unter anderem
          für:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Ihre Anmeldesitzung (Auth-Token, damit Sie eingeloggt bleiben),</li>
          <li>Ihre Theme-Einstellung (hell/dunkel),</li>
          <li>Ihre Cookie-Auswahl aus diesem Hinweis.</li>
        </ul>
        <p className="mt-2">
          Diese Speicherung ist für den Betrieb der Anwendung erforderlich (Art. 6 Abs. 1 lit. b und f DSGVO,
          § 25 Abs. 2 Nr. 2 TTDSG) und benötigt keine gesonderte Einwilligung. Es werden keine
          Tracking-, Analyse- oder Werbe-Cookies gesetzt.
        </p>
      </LegalSection>

      <LegalSection heading="6. KI-Assistent (optional)">
        <p>
          ImmoArchiv bietet optional einen KI-Assistenten auf Basis der Claude-API von Anthropic PBC. Wenn Sie
          diese Funktion aktivieren und einen eigenen API-Schlüssel hinterlegen, werden Ihre Frage sowie ein
          zusammengefasster Auszug Ihrer Portfolio-Daten (z. B. Objektadressen, Finanzkennzahlen) direkt von Ihrem
          Browser an die Anthropic-API übermittelt, um eine Antwort zu erzeugen. Ihr API-Schlüssel wird nur lokal
          in Ihrem Browser gespeichert. Die Nutzung erfolgt freiwillig auf Ihre Veranlassung (Art. 6 Abs. 1 lit. a
          DSGVO, Einwilligung durch aktive Nutzung). Ohne Aktivierung dieser Funktion findet keine Übermittlung an
          Anthropic statt.
        </p>
      </LegalSection>

      <LegalSection heading="7. Zukünftige Zahlungsabwicklung über Stripe">
        <p>
          Für kostenpflichtige Pläne ist der Einsatz von Stripe Payments Europe, Ltd. als Zahlungsdienstleister
          geplant. Zum jetzigen Zeitpunkt ist die Zahlungsabwicklung <strong>noch nicht aktiv</strong>; es werden
          keine Zahlungsdaten verarbeitet. Sobald Zahlungen über Stripe live gehen, aktualisieren wir diese
          Erklärung entsprechend und ergänzen die dann relevanten Verarbeitungsdetails.
        </p>
      </LegalSection>

      <LegalSection heading="8. Server-Logfiles">
        <p>
          Beim Aufruf der Anwendung können durch den Hosting-Anbieter automatisch Zugriffsdaten (z. B. IP-Adresse,
          Datum/Uhrzeit, aufgerufene Seite, Browsertyp) in Server-Logfiles verarbeitet werden. Rechtsgrundlage ist
          Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren Betrieb). Anbieter ist unser
          Hosting-Partner Supabase; die Logfiles werden nach den Standardaufbewahrungsfristen von Supabase
          gespeichert und automatisiert gelöscht.
        </p>
      </LegalSection>

      <LegalSection heading="9. Speicherdauer">
        <p>
          Ihre Kontodaten speichern wir, solange Ihr Konto besteht. Nach Löschung Ihres Kontos (siehe Punkt 10)
          werden Ihre Daten innerhalb einer angemessenen Frist unwiderruflich gelöscht, soweit keine gesetzlichen
          Aufbewahrungspflichten entgegenstehen.
        </p>
      </LegalSection>

      <LegalSection heading="10. Ihre Rechte">
        <p>
          Sie haben nach der DSGVO das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17),
          Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21). Ihre
          Objekt- und Kontodaten können Sie jederzeit selbst in der Anwendung einsehen und bearbeiten. Ihr Konto
          samt aller zugehörigen Daten können Sie jederzeit selbst und unwiderruflich unter „Mein Konto" löschen
          (Schaltfläche „Konto unwiderruflich löschen"). Alternativ erreichen Sie uns unter arturkraus2212@gmail.com.
        </p>
      </LegalSection>

      <LegalSection heading="11. Kontakt und Aufsichtsbehörde">
        <p>
          Bei Fragen zum Datenschutz erreichen Sie uns unter arturkraus2212@gmail.com. Sie haben zudem das Recht,
          sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, für uns zuständig ist:
          <br />
          Der Hessische Beauftragte für Datenschutz und Informationsfreiheit
          <br />
          Postfach 3163, 65021 Wiesbaden
        </p>
      </LegalSection>

      <p className="text-xs">Stand: {new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</p>
    </LegalLayout>
  );
}
