import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Wrench,
  Calculator,
  ShieldCheck,
  Smartphone,
  ClipboardList,
  Check,
  UserPlus,
  Home,
  ReceiptText,
  TrendingUp,
  CreditCard,
  Landmark,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { SparklesCore } from "@/components/ui/sparkles";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PLAENE, monatspreis, JAHRES_RABATT } from "@/lib/plaene";
import { ScrollReveal } from "@/components/scroll-reveal";

export const Route = createFileRoute("/")({
  component: Landing,
});

const ROTIERENDE_WOERTER = ["Wohnungen", "Häuser", "Mieter", "Nebenkosten", "Finanzen"];

function RotierendesWort() {
  const [index, setIndex] = useState(0);

  // Ein einziges, stabiles Intervall (statt rekursivem setTimeout, das bei jedem
  // Re-Render neu erzeugt wurde) – kann nicht auf einem Wort "hängen bleiben".
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % ROTIERENDE_WOERTER.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="relative inline-grid h-[1.2em] items-center justify-items-center overflow-visible px-1">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={ROTIERENDE_WOERTER[index]}
          className="whitespace-nowrap font-semibold text-blue-600 [grid-area:1/1]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {ROTIERENDE_WOERTER[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const SO_FUNKTIONIERT = [
  {
    id: 1,
    title: "Konto erstellen",
    date: "Schritt 1",
    content: "Kostenlos registrieren – nur E-Mail, Name und Passwort. Keine Kreditkarte nötig.",
    category: "Start",
    icon: UserPlus,
    relatedIds: [2],
    status: "completed" as const,
    energy: 100,
  },
  {
    id: 2,
    title: "Immobilie anlegen",
    date: "Schritt 2",
    content: "Adresse, Kaufdaten und Finanzierung eintragen – in unter 5 Minuten.",
    category: "Objekte",
    icon: Home,
    relatedIds: [1, 3],
    status: "completed" as const,
    energy: 85,
  },
  {
    id: 3,
    title: "Mieter & Mängel verwalten",
    date: "Schritt 3",
    content: "Mietverträge, Zahlungen und Reparaturen zentral im Blick behalten.",
    category: "Verwaltung",
    icon: Wrench,
    relatedIds: [2, 4],
    status: "in-progress" as const,
    energy: 65,
  },
  {
    id: 4,
    title: "Nebenkosten abrechnen",
    date: "Schritt 4",
    content: "Betriebskosten automatisch nach Wohnfläche oder Personen umlegen.",
    category: "Abrechnung",
    icon: ReceiptText,
    relatedIds: [3, 5],
    status: "pending" as const,
    energy: 40,
  },
  {
    id: 5,
    title: "Finanzen im Blick",
    date: "Schritt 5",
    content: "Rendite, Cashflow und Restschuld auf einen Blick – automatisch berechnet.",
    category: "Auswertung",
    icon: TrendingUp,
    relatedIds: [4],
    status: "pending" as const,
    energy: 20,
  },
];

const FAQ = [
  {
    frage: "Ist ImmoArchiv wirklich kostenlos nutzbar?",
    antwort:
      "Ja. Der Starter-Plan ist dauerhaft kostenlos und deckt bis zu 3 Objekte ab. Für unbegrenzte Objekte, Auswertungen und den KI-Assistenten gibt es die kostenpflichtigen Pläne – jederzeit kündbar.",
  },
  {
    frage: "Wie und wo werden meine Daten gespeichert?",
    antwort:
      "Ihre Daten liegen in einer gesicherten Cloud-Datenbank (Supabase), zugriffsgeschützt über Ihr persönliches Konto. Nur Sie können nach der Anmeldung auf Ihre Objekte, Mieter und Dokumente zugreifen. Details finden Sie in unserer Datenschutzerklärung.",
  },
  {
    frage: "Welche Zahlungsmethoden werden unterstützt?",
    antwort:
      "Sobald die kostenpflichtigen Pläne aktiv geschaltet sind, wickeln wir Zahlungen sicher über Stripe ab. Geplant sind Kreditkarte (Visa, Mastercard, American Express), SEPA-Lastschrift, PayPal, Apple Pay und Google Pay. Aktuell befindet sich die Zahlungsabwicklung noch in Vorbereitung.",
  },
  {
    frage: "Kann ich jederzeit kündigen?",
    antwort:
      "Ja, ein Abonnement kann jederzeit zum Ende des Abrechnungszeitraums gekündigt werden. Es gibt keine Mindestlaufzeit.",
  },
  {
    frage: "Ersetzt ImmoArchiv einen Steuerberater oder Anwalt?",
    antwort:
      "Nein. ImmoArchiv unterstützt Sie mit nachvollziehbaren Berechnungen (z. B. Mietanpassung nach § 558 BGB, AfA), ersetzt aber keine individuelle Rechts- oder Steuerberatung.",
  },
  {
    frage: "Kann ich meine Daten exportieren oder mein Konto löschen?",
    antwort:
      "Ja. Sie können Ihre steuerlichen Auswertungen als CSV exportieren und Ihr Konto inklusive aller Daten jederzeit über den Support löschen lassen.",
  },
];

function ModuleCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Building2;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative rounded-2xl border bg-card p-6 transition-colors hover:border-blue-500/50">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Logo className="h-7 w-7" />
            ImmoArchiv
          </Link>
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#module" className="hover:text-foreground">Module</a>
            <a href="#so-funktionierts" className="hover:text-foreground">So funktioniert's</a>
            <a href="#preise" className="hover:text-foreground">Preise</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle className="border-0 px-2" />
            <Button asChild size="sm">
              <Link to="/dashboard">Jetzt starten</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-blue-500/15 blur-[120px]" />
        </div>
        {/* Sterne / Sparkles */}
        <div className="pointer-events-none absolute inset-0 -z-[5]">
          <SparklesCore
            id="hero-sparkles"
            background="transparent"
            minSize={0.6}
            maxSize={1.4}
            particleDensity={90}
            speed={1}
            particleColor="#3b82f6"
            className="h-full w-full"
          />
        </div>
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-4 pt-20 pb-24 md:grid-cols-[1fr_1.15fr] md:pt-28 md:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              Für Vermieter und kleine Hausverwaltungen
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">
              Software für die Immobilienverwaltung, gemacht für <RotierendesWort />
            </h1>
            <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
              Ob 1 Wohnung oder 15 Einheiten — ImmoArchiv bündelt Objekt- und Mieterverwaltung,
              Nebenkostenabrechnung, Mängel-Dokumentation und Mieterportal an einem Ort.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {[
                "Nebenkostenabrechnung in Minuten statt Stunden",
                "Mieten, Belege und Dokumente an einem Ort",
                "Mieterportal inklusive — für weniger Anrufe und E-Mails",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-blue-600" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/dashboard">
                  Jetzt kostenlos starten <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#module">Module ansehen</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Unverbindlich testen. Keine Kreditkarte nötig.
            </p>
          </motion.div>

          {/* Dashboard-Vorschau */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mx-auto w-full max-w-lg md:max-w-none"
          >
            <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-blue-900/10">
              {/* Fensterleiste */}
              <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-blue-400" />
                <div className="ml-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Logo className="h-4 w-4" /> immoarchiv.app/dashboard
                </div>
              </div>
              <div className="p-5 text-left">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold">Übersicht</div>
                    <div className="text-xs text-muted-foreground">Ihr Immobilien-Portfolio auf einen Blick.</div>
                  </div>
                  <div className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white">Immobilie hinzufügen</div>
                </div>
                {/* KPI-Karten */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { l: "Immobilien", v: "6" },
                    { l: "Kaltmiete / Monat", v: "7.240 €" },
                    { l: "Cashflow / Monat", v: "+1.180 €", tone: "text-blue-600" },
                    { l: "Ø Rendite", v: "4,8 %" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-xl border bg-background p-3">
                      <div className="text-[11px] text-muted-foreground">{s.l}</div>
                      <div className={"mt-1 text-lg font-semibold tabular-nums " + (s.tone ?? "")}>{s.v}</div>
                    </div>
                  ))}
                </div>
                {/* Mini-Diagramme */}
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border bg-background p-4">
                    <div className="mb-3 text-xs font-medium">Vermögensaufteilung</div>
                    <div className="mx-auto grid h-24 w-24 place-items-center rounded-full" style={{ background: "conic-gradient(#2563eb 0 62%, #1e3a8a 62% 100%)" }}>
                      <div className="grid h-14 w-14 place-items-center rounded-full bg-background text-[11px] font-semibold">1,4 M€</div>
                    </div>
                  </div>
                  <div className="rounded-xl border bg-background p-4 sm:col-span-2">
                    <div className="mb-3 text-xs font-medium">Kaltmiete je Objekt</div>
                    <div className="flex h-24 items-end gap-2">
                      {[60, 85, 45, 95, 70, 55].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t bg-blue-600/80" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Für wen */}
      <section className="border-t border-border/60 bg-card/30">
        <ScrollReveal>
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Gemacht für Ihren Alltag.</h2>
            <p className="mt-3 text-muted-foreground">
              Ob privater Vermieter oder kleines Unternehmen — Sie bekommen genau die Werkzeuge,
              die Sie für Ihre Verwaltung brauchen.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                tag: "Wenige Objekte, privat vermietet",
                title: "Für Privatvermieter",
                icon: Home,
                gradient: "from-blue-600/25 via-blue-500/10 to-transparent",
                punkte: [
                  ["Mieten im Blick behalten", "Wer hat gezahlt, wer nicht? Sofort sichtbar."],
                  ["Nebenkosten ohne Aufwand", "Abrechnung in Minuten statt Excel-Formeln."],
                  ["Dokumente wiederfinden", "Kein Suchen mehr in Ordnern oder E-Mails."],
                ],
              },
              {
                tag: "Mehrere Objekte, im Team verwaltet",
                title: "Für Unternehmen",
                icon: Building2,
                gradient: "from-violet-600/25 via-violet-500/10 to-transparent",
                punkte: [
                  ["Im Team zusammenarbeiten", "Team-Mitglieder einladen, gemeinsam verwalten."],
                  ["Skalierbar verwalten", "Beliebig viele Objekte, ein Konto."],
                  ["Klarheit für Eigentümer", "Alle Kennzahlen jederzeit abrufbar."],
                ],
              },
            ].map((k) => (
              <div key={k.title} className="overflow-hidden rounded-2xl border bg-card">
                <div className={`relative h-40 bg-gradient-to-br ${k.gradient} flex items-center justify-center`}>
                  <k.icon className="h-16 w-16 text-blue-600/70" strokeWidth={1.25} />
                </div>
                <div className="p-6">
                  <p className="text-xs font-medium text-blue-600">{k.tag}</p>
                  <h3 className="mt-1 flex items-center gap-2 text-lg font-semibold">
                    <k.icon className="h-5 w-5" /> {k.title}
                  </h3>
                  <ul className="mt-4 space-y-3 text-sm">
                    {k.punkte.map(([t, d]) => (
                      <li key={t} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                        <div>
                          <div className="font-medium">{t}</div>
                          <div className="text-muted-foreground">{d}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* Module */}
      <section id="module" className="border-t border-border/60 bg-background">
        <ScrollReveal>
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-12 max-w-2xl">
            <p className="text-sm font-medium text-blue-600">Drei Module</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Alles, was Sie als Kleinvermieter wirklich brauchen.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Kein aufgeblähtes ERP. Drei fokussierte Werkzeuge, die den Alltag der nebenberuflichen
              Verwaltung abdecken — vom Küchentisch bis vor Ort auf der Baustelle.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ModuleCard icon={Building2} title="Objekte & Mieter">
              Ihre Häuser, Wohnungen und Mieter zentral. Sofort sichtbar: welche Einheit ist
              vermietet, welche steht leer, wann läuft welcher befristete Vertrag aus.
            </ModuleCard>
            <ModuleCard icon={Wrench} title="Mängel mit Fotodokumentation">
              Ein tropfender Wasserhahn wird direkt vor Ort per Handy erfasst — inklusive Foto,
              Priorität und Handwerker. Statusverlauf für saubere Dokumentation.
            </ModuleCard>
            <ModuleCard icon={Calculator} title="Mietanpassungs-Rechner">
              Nachvollziehbare Berechnung nach § 558 BGB, mit Kappungsgrenze und 15-Monats-Sperre.
              Am Ende ein fertiges Anschreiben an den Mieter zum Kopieren.
            </ModuleCard>
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* Warum */}
      <section id="warum" className="border-t border-border/60 bg-card/30">
        <ScrollReveal>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-blue-600">Warum ImmoArchiv</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Hausverwaltungs-Software ist für Sie überdimensioniert.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Die etablierten Tools sind für Verwaltungen mit hunderten Einheiten gebaut — mit
              Buchhaltungsmodulen, WEG-Verwaltung und einer Einarbeitungszeit von Wochen.
              ImmoArchiv konzentriert sich auf das, was ein Vermieter mit 1–5 Wohnungen wirklich
              tut.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "In unter 5 Minuten das erste Objekt, die erste Einheit, den ersten Mieter angelegt",
              "Mobile-first: Mängel direkt vor Ort mit Foto erfassen",
              "Keine Buchhaltung, keine WEG-Verwaltung — nur das, was Sie brauchen",
              "Rechenweg der Mietanpassung transparent, keine Blackbox",
              "Ihre Daten sind sicher in der Cloud gespeichert — von überall erreichbar",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        </ScrollReveal>
      </section>

      {/* Vergleich */}
      <section className="border-t border-border/60">
        <ScrollReveal>
        <div className="mx-auto max-w-4xl px-4 py-20">
          <div className="mb-10 text-center">
            <p className="text-sm font-medium text-blue-600">Überzeugend</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              ImmoArchiv im Vergleich zur Excel-Tabelle.
            </h2>
          </div>
          <div className="overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-card/60">
                  <th className="p-4 text-left font-medium text-muted-foreground">Kriterium</th>
                  <th className="w-32 bg-blue-600/10 p-4 text-center font-semibold">ImmoArchiv</th>
                  <th className="w-32 p-4 text-center font-medium text-muted-foreground">Excel</th>
                </tr>
              </thead>
              <tbody>
                {[
                  "Nebenkostenabrechnung in Minuten",
                  "Automatische Rendite-/Cashflow-Kennzahlen",
                  "Mieteingänge auf einen Blick",
                  "Mieterportal inklusive",
                  "Zentrale Dokumentenablage",
                  "Von überall erreichbar (Cloud)",
                ].map((z, i) => (
                  <tr key={z} className={i % 2 ? "bg-card/30" : undefined}>
                    <td className="border-t p-4">{z}</td>
                    <td className="border-t bg-blue-600/10 p-4 text-center">
                      <Check className="mx-auto h-4 w-4 text-blue-600" />
                    </td>
                    <td className="border-t p-4 text-center text-muted-foreground">✕</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg">
              <Link to="/dashboard">
                Jetzt kostenlos starten <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* Feature strip */}
      <section className="border-t border-border/60">
        <ScrollReveal>
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-3">
          {[
            { icon: Smartphone, t: "Mobile-first", d: "Bedienung auf dem Handy genauso wie am Desktop." },
            { icon: ClipboardList, t: "Dokumentation", d: "Chronologischer Verlauf jedes Mangels." },
            { icon: ShieldCheck, t: "DSGVO-bewusst", d: "Verschlüsselt in der EU gespeichert, kein Tracking." },
          ].map(({ icon: I, t, d }) => (
            <div key={t} className="flex items-start gap-3">
              <I className="mt-1 h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium">{t}</div>
                <div className="text-sm text-muted-foreground">{d}</div>
              </div>
            </div>
          ))}
        </div>
        </ScrollReveal>
      </section>

      {/* Sicherheit */}
      <section className="border-t border-border/60 bg-card/30">
        <ScrollReveal>
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mx-auto mb-8 max-w-xl text-center">
            <p className="text-sm font-medium text-blue-600">Sicherheit</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              Ein sicheres Zuhause für Ihre Daten.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-background p-5 text-center">
              <div className="text-sm font-medium">Datenbank-Standort EU</div>
              <p className="mt-1 text-xs text-muted-foreground">Gehostet in Irland (eu-west-1).</p>
            </div>
            <div className="rounded-xl border bg-background p-5 text-center">
              <div className="text-sm font-medium">Für datenschutzkonforme Verwaltung entwickelt</div>
              <p className="mt-1 text-xs text-muted-foreground">Inklusive AVV für Ihre Mieterdaten.</p>
            </div>
            <div className="rounded-xl border bg-background p-5 text-center">
              <div className="text-sm font-medium">Verschlüsselte Übertragung</div>
              <p className="mt-1 text-xs text-muted-foreground">Zugriff nur nach Anmeldung, nur für Sie.</p>
            </div>
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* So funktioniert's */}
      <section id="so-funktionierts" className="border-t border-border/60 bg-card/30">
        <ScrollReveal>
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-sm font-medium text-blue-600">So funktioniert's</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              In 5 Schritten vom Konto zur fertigen Auswertung.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Klicken Sie auf einen Punkt in der Timeline, um mehr zu erfahren.
            </p>
          </div>
          <RadialOrbitalTimeline timelineData={SO_FUNKTIONIERT} />
        </div>
        </ScrollReveal>
      </section>

      {/* Preise */}
      <section id="preise" className="border-t border-border/60 bg-card/30">
        <ScrollReveal>
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-sm font-medium text-blue-600">Preise</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Wählen Sie Ihren Plan
            </h2>
            <p className="mt-3 text-muted-foreground">
              Starten Sie kostenlos. Für unbegrenzte Objekte, Auswertungen und den KI-Assistenten gibt es Professional.
              Bei jährlicher Zahlung sparen Sie {Math.round(JAHRES_RABATT * 100)} %.
            </p>
          </div>

          <div className="mx-auto grid max-w-3xl items-stretch gap-6 sm:grid-cols-2">
            {PLAENE.map((plan) => (
              <div
                key={plan.id}
                className={
                  "flex flex-col rounded-2xl border bg-card p-6 " +
                  (plan.populaer ? "border-blue-600 shadow-lg lg:-mt-2 lg:mb-2" : "")
                }
              >
                {plan.populaer && (
                  <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-medium text-white">
                    Beliebt
                  </span>
                )}
                <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{plan.name}</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight">
                    {plan.preisMonat === 0 ? "0 €" : `${monatspreis(plan, false)} €`}
                  </span>
                  {plan.preisMonat > 0 && <span className="text-sm text-muted-foreground">/ Monat</span>}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{plan.beschreibung}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6 w-full" variant={plan.populaer ? "default" : "outline"}>
                  <Link to="/dashboard">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Bezahlte Pläne sind aktuell in Vorbereitung – bis dahin sind alle Funktionen kostenlos nutzbar.
          </p>
        </div>
        </ScrollReveal>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border/60">
        <ScrollReveal>
        <div className="mx-auto max-w-3xl px-4 py-20">
          <div className="mb-10 text-center">
            <p className="text-sm font-medium text-blue-600">Häufige Fragen</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">FAQ</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger>{f.frage}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.antwort}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        </ScrollReveal>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <ScrollReveal>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Bereit, die Zettel zu ersetzen?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Erstellen Sie jetzt kostenlos Ihr Konto und legen Sie Ihre erste Immobilie an.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link to="/dashboard">
                Jetzt starten <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        </ScrollReveal>
      </section>

      <footer id="dsgvo" className="border-t border-border/60 bg-background">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <Link to="/" className="flex items-center gap-2 font-semibold">
                <Logo className="h-7 w-7" />
                ImmoArchiv
              </Link>
              <p className="mt-3 max-w-[22ch] text-xs text-muted-foreground">
                Vermieter-Software für 1–15 Wohneinheiten. Made in Germany.
              </p>
            </div>
            <div className="text-sm">
              <div className="mb-3 font-medium">Produkt</div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href="#module" className="hover:text-foreground">Module</a></li>
                <li><a href="#so-funktionierts" className="hover:text-foreground">So funktioniert's</a></li>
                <li><a href="#preise" className="hover:text-foreground">Preise</a></li>
                <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
              </ul>
            </div>
            <div className="text-sm">
              <div className="mb-3 font-medium">Rechtliches</div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link to="/impressum" className="hover:text-foreground">Impressum</Link></li>
                <li><Link to="/datenschutz" className="hover:text-foreground">Datenschutzerklärung</Link></li>
                <li><Link to="/avv" className="hover:text-foreground">AVV</Link></li>
                <li><Link to="/agb" className="hover:text-foreground">AGB</Link></li>
              </ul>
            </div>
            <div className="text-sm">
              <div className="mb-3 font-medium">Konto</div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link to="/login" className="hover:text-foreground">Anmelden</Link></li>
                <li><Link to="/dashboard" className="hover:text-foreground">Jetzt kostenlos starten</Link></li>
              </ul>
            </div>
          </div>

          {/* Zahlungsmethoden (Stripe, in Vorbereitung) */}
          <div id="zahlungsmethoden" className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:gap-3">
            <span className="shrink-0 font-medium text-foreground">
              Zahlungsabwicklung über Stripe (in Vorbereitung):
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { icon: CreditCard, label: "Kreditkarte (Visa, Mastercard, Amex)" },
                { icon: Landmark, label: "SEPA-Lastschrift" },
                { icon: Wallet, label: "PayPal" },
                { icon: Smartphone, label: "Apple Pay" },
                { icon: Smartphone, label: "Google Pay" },
              ].map(({ icon: I, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1">
                  <I className="h-3 w-3" /> {label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-border/60 pt-4 md:flex-row md:items-center md:justify-between">
            <div>© {new Date().getFullYear()} ImmoArchiv · Version 1.0 (Testversion)</div>
            <div>
              Hinweis: ImmoArchiv ersetzt keine Rechtsberatung. Für rechtssichere Mieterhöhungen im
              Zweifel Mieterverein oder Anwalt konsultieren.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
