# ImmoArchiv – Supabase-Datenbank

## Tabellen
`profiles`, `objekte`, `einheiten`, `mieter`, `maengel`, `mietzahlungen`,
`abrechnungen`, `aufgaben`, `dokumente` – jede Zeile gehört einem Nutzer
(`auth.users`), abgesichert per Row-Level-Security.

## Einrichten (2 Minuten)
1. Auf https://supabase.com ein **neues Projekt** erstellen.
2. Dashboard → **SQL Editor** → Inhalt von `migrations/0001_init.sql` einfügen → **Run**.
3. Danach `migrations/0002_storage.sql` genauso ausführen (legt Datei-Buckets an).
4. Dashboard → **Authentication → Providers**: „Email" aktiviert lassen
   (für den Start am einfachsten E-Mail + Passwort).
5. Projekt-Zugangsdaten kopieren: **Project Settings → API** →
   `Project URL` und `anon public` Key.

## Was die App später braucht (in `.env`)
```
VITE_SUPABASE_URL=https://<dein-projekt>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

Der `anon`-Key ist öffentlich (darf im Frontend liegen) – der Schutz kommt aus
der Row-Level-Security. Den `service_role`-Key **niemals** ins Frontend legen.
