## Vermietify — Software für private Kleinvermieter

Moderne, mobile-first Web-App auf Deutsch für private Vermieter (1–15 Wohneinheiten) mit dunklem Vercel/Geist-inspiriertem Design (Anthrazit + korallroter Akzent, wie in den Referenzbildern).

### Umfang v1 (ohne Login, ohne Payment)

**1. Landingpage (`/`)**
- Hero mit animiertem Wechsel-Wort ("einfach", "übersichtlich", "rechtssicher" …), Sub-Copy, primärer CTA „Jetzt starten" → `/dashboard`
- Drei Modul-Sektionen mit Spotlight-Glow-Cards (Objekte, Mängel, Mietanpassung) inkl. Icon + Mini-Mockup
- Warum-nicht-Hausverwaltungs-Software Vergleichs-Sektion
- DSGVO-Hinweis, Footer

**2. Dashboard-Shell (`/dashboard`)**
- Sidebar (Desktop) / Bottom-Nav (Mobile): Übersicht, Objekte, Mängel, Mietanpassung
- Übersichtsseite: KPI-Karten (offene Mängel, belegte/leere Einheiten, nächste Mietanpassungen), Liste der Objekte

**3. Modul Objekte & Mieter (`/dashboard/objekte`)**
- Karten-Grid der Objekte (Adresse, Belegungsstatus)
- Detail-Route `/dashboard/objekte/$id`: Einheiten-Liste, Mieter pro Einheit, Vertragsdaten, Warnung bei auslaufendem Mietvertrag
- Dialoge zum Anlegen/Bearbeiten von Objekt, Einheit, Mieter

**4. Modul Mängel (`/dashboard/maengel`)**
- Kanban-Board: Gemeldet → In Bearbeitung → Erledigt (Mobile: horizontaler Scroll)
- Neuer Mangel: Titel, Beschreibung, Einheit, Priorität, Fotos (mehrere, direkter Kamera-Zugriff via `capture="environment"`), Handwerker, Kosten
- Detail-Sheet mit chronologischem Verlauf
- Filter nach Objekt/Status/Priorität

**5. Modul Mietanpassung (`/dashboard/mietanpassung`)**
- Formular: Einheit wählen (oder frei eingeben), aktuelle Kaltmiete, Wohnfläche, PLZ, ortsübliche Vergleichsmiete (€/m²), Datum letzte Erhöhung, angespannter Wohnungsmarkt ja/nein
- Schritt-für-Schritt-Berechnung sichtbar (Vergleichsmiete-Ziel, Kappungsgrenze 20 %/15 % über 3 Jahre, 15-Monats-Sperre)
- Ergebnis + Mieter-Anschreiben (Text zum Kopieren, Druck-Ansicht als PDF-Ersatz)
- Rechts-Disclaimer § 558 BGB

### Datenspeicherung
- **localStorage** über eine typisierte Store-Schicht (`src/lib/store.ts`), Zustand-basiert. Kein Supabase in v1 (Prompt erlaubt beides; localStorage ist einfacher und passt zu „ohne Login"). Fotos als Base64 im localStorage (mit Größenwarnung bei >4 MB).
- Seed-Button „Beispieldaten laden" für schnelles Testen.

### Design-System
- Dark-Theme als Default (analog Screenshots): Hintergrund near-black, Karten dunkles Anthrazit, Text weiß/muted, **Akzent Koralle** (`oklch(0.72 0.17 25)`) für Destructive/CTA-Highlights, Primary weiß-auf-schwarz Button-Style
- Font: **Geist Sans** + **Geist Mono** via `<link>` in `__root.tsx`
- Semantische Tokens in `src/styles.css` überschreiben (kein Light-Mode-Toggle)
- shadcn Button/Card/Dialog/Input/Select/Tabs/Badge/Sheet werden genutzt
- Zusätzliche Komponenten: `spotlight-card.tsx` (nur Landingpage), `animated-hero.tsx` (Landingpage-Hero)

### Tech-Details
- TanStack Start (bestehend), TanStack Router-Routen unter `src/routes/dashboard.*.tsx`
- Zustand-Store mit `persist`-Middleware für localStorage
- framer-motion für Hero + subtile Card-Animationen
- Alle UI-Texte auf Deutsch; deutsche Zahlen-/Datumsformate (`Intl.NumberFormat('de-DE')`)

### Bewusst NICHT drin
Login/Auth, Supabase, Payment, Nebenkostenabrechnung, Steuer-Export, Scraping, Mehrsprachigkeit.

---

Soll ich so bauen? Zwei kurze Rückfragen:
1. **Speicherung**: localStorage ist ok für v1? (Vorteil: null Setup, Nachteil: pro Browser/Gerät getrennt, Fotos begrenzt)
2. **Beispieldaten**: Ich lege Beispiel-Objekt „Hauptstraße 12, Wolfershausen" + 2 Einheiten + 1 Mangel als Seed vor, das man mit einem Klick laden kann — ok?
