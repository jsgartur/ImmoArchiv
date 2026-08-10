-- ============================================================================
-- ImmoArchiv – Initiales Datenbank-Schema (Supabase / PostgreSQL)
-- ----------------------------------------------------------------------------
-- Bildet das App-Datenmodell (Zustand-Store) auf Tabellen ab.
-- Jede Zeile gehört einem Nutzer (auth.users). Row-Level-Security stellt sicher,
-- dass jeder nur seine eigenen Daten sieht/ändert.
--
-- Ausführen: Supabase Dashboard → SQL Editor → einfügen → "Run".
-- (oder via CLI:  supabase db push)
-- ============================================================================

-- Extensions ----------------------------------------------------------------
create extension if not exists "pgcrypto";        -- gen_random_uuid()

-- Hilfsfunktion: updated_at automatisch pflegen ------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 1) PROFILES  (1:1 zu auth.users)
-- ============================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  anrede      text,
  vorname     text,
  nachname    text,
  email       text,
  telefon     text,
  firma       text,
  strasse     text,
  plz         text,
  ort         text,
  land        text default 'Deutschland',
  plan        text not null default 'starter'
              check (plan in ('starter','professional','enterprise')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Beim Registrieren automatisch ein leeres Profil anlegen
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 2) OBJEKTE  (Immobilien)
-- ============================================================================
create table if not exists public.objekte (
  id                         uuid primary key default gen_random_uuid(),
  user_id                    uuid not null default auth.uid() references auth.users (id) on delete cascade,

  -- Stammdaten / Adresse
  adresse                    text not null,
  strasse                    text,
  hausnummer                 text,
  plz                        text,
  stadt                      text,
  land                       text default 'Deutschland',
  typ                        text not null default 'einfamilienhaus'
                             check (typ in ('mehrfamilienhaus','eigentumswohnung','einfamilienhaus','gewerbe','garage','sonstiges')),
  baujahr                    integer,
  gesamtwohnflaeche          numeric,
  grundstuecksflaeche        numeric,
  anzahl_einheiten           integer,

  -- Kaufdaten
  kaufpreis                  numeric,
  kaufdatum                  date,
  kaufnebenkosten            numeric,
  marktwert                  numeric,

  -- Finanzierung
  eigenkapital               numeric,
  darlehensbetrag            numeric,
  zinssatz                   numeric,
  monatliche_rate            numeric,
  finanzierungsbeginn        date,
  bank                       text,
  zinsbindung_bis            date,
  sondertilgungen            jsonb not null default '[]',   -- [{id,datum,betrag}]

  -- Steuer
  grundstuecksanteil_prozent numeric,
  afa_satz                   numeric,

  -- Laufende Kosten
  laufende_kosten_monat      numeric,

  -- Vermietung
  vermietet                  boolean not null default false,
  ist_kaltmiete              numeric,
  ziel_kaltmiete             numeric,
  nebenkosten_vorauszahlung  numeric,

  -- Medien (Pfade in Supabase Storage)
  bilder                     text[] not null default '{}',

  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);
create index if not exists objekte_user_idx on public.objekte (user_id);

-- ============================================================================
-- 3) EINHEITEN  (Wohneinheiten eines Objekts)
-- ============================================================================
create table if not exists public.einheiten (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  objekt_id    uuid not null references public.objekte (id) on delete cascade,
  bezeichnung  text not null,
  wohnflaeche  numeric not null default 0,
  zimmer       numeric not null default 0,
  stockwerk    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists einheiten_objekt_idx on public.einheiten (objekt_id);
create index if not exists einheiten_user_idx on public.einheiten (user_id);

-- ============================================================================
-- 4) MIETER
-- ============================================================================
create table if not exists public.mieter (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  einheit_id   uuid not null references public.einheiten (id) on delete cascade,
  name         text not null,
  kontakt      text,
  telefon      text,
  email        text,
  mietbeginn   date,
  mietende     date,
  kaltmiete    numeric not null default 0,
  nebenkosten  numeric not null default 0,
  kaution      numeric,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists mieter_einheit_idx on public.mieter (einheit_id);
create index if not exists mieter_user_idx on public.mieter (user_id);

-- ============================================================================
-- 5) MAENGEL  (Schäden / Reparaturen)
-- ============================================================================
create table if not exists public.maengel (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users (id) on delete cascade,
  einheit_id          uuid not null references public.einheiten (id) on delete cascade,
  titel               text not null,
  beschreibung        text,
  status              text not null default 'gemeldet'
                      check (status in ('gemeldet','in_bearbeitung','erledigt')),
  prioritaet          text not null default 'mittel'
                      check (prioritaet in ('niedrig','mittel','dringend')),
  fotos               text[] not null default '{}',      -- Storage-Pfade
  gemeldet_von        text not null default 'vermieter'
                      check (gemeldet_von in ('mieter','vermieter')),
  gemeldet_am         timestamptz not null default now(),
  handwerker          text,
  kosten_geschaetzt   numeric,
  kosten_tatsaechlich numeric,
  verlauf             jsonb not null default '[]',        -- [{datum,text}]
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists maengel_einheit_idx on public.maengel (einheit_id);
create index if not exists maengel_user_idx on public.maengel (user_id);

-- ============================================================================
-- 6) MIETZAHLUNGEN  (Mieteingang je Objekt & Monat)
-- ============================================================================
create table if not exists public.mietzahlungen (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  objekt_id   uuid not null references public.objekte (id) on delete cascade,
  monat       text not null,                              -- "YYYY-MM"
  betrag      numeric not null default 0,
  bezahlt_am  timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  unique (objekt_id, monat)
);
create index if not exists mietzahlungen_objekt_idx on public.mietzahlungen (objekt_id);
create index if not exists mietzahlungen_user_idx on public.mietzahlungen (user_id);

-- ============================================================================
-- 7) ABRECHNUNGEN  (Nebenkostenabrechnung)
-- ============================================================================
create table if not exists public.abrechnungen (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  objekt_id   uuid not null references public.objekte (id) on delete cascade,
  titel       text not null,
  von         date,
  bis         date,
  positionen  jsonb not null default '[]',   -- [{id,bezeichnung,betrag,schluessel}]
  parteien    jsonb not null default '[]',   -- [{id,name,wohnflaeche,personen,nkVorausMonat,einzug,auszug,...}]
  erstellt_am timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists abrechnungen_objekt_idx on public.abrechnungen (objekt_id);
create index if not exists abrechnungen_user_idx on public.abrechnungen (user_id);

-- ============================================================================
-- 8) AUFGABEN  (Aufgaben & Fristen)
-- ============================================================================
create table if not exists public.aufgaben (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  objekt_id    uuid references public.objekte (id) on delete cascade,   -- optional
  titel        text not null,
  beschreibung text,
  kategorie    text not null default 'sonstiges'
               check (kategorie in ('reparatur','wartung','frist','besichtigung','sonstiges')),
  faelligkeit  date,
  erledigt     boolean not null default false,
  erstellt_am  timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists aufgaben_user_idx on public.aufgaben (user_id);

-- ============================================================================
-- 9) DOKUMENTE  (Grundbuch, Kaufvertrag, Mietvertrag … – Datei in Storage)
--    Genau eine Zuordnung: objekt_id ODER mieter_id.
-- ============================================================================
create table if not exists public.dokumente (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  objekt_id      uuid references public.objekte (id) on delete cascade,
  mieter_id      uuid references public.mieter (id) on delete cascade,
  name           text not null,
  kategorie      text not null default 'Sonstiges',
  storage_path   text not null,        -- Pfad im Storage-Bucket "dokumente"
  groesse        bigint,
  hochgeladen_am timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  check (num_nonnulls(objekt_id, mieter_id) = 1)
);
create index if not exists dokumente_objekt_idx on public.dokumente (objekt_id);
create index if not exists dokumente_mieter_idx on public.dokumente (mieter_id);
create index if not exists dokumente_user_idx on public.dokumente (user_id);

-- ============================================================================
-- updated_at-Trigger für alle Tabellen mit dieser Spalte
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array['profiles','objekte','einheiten','mieter','maengel','abrechnungen','aufgaben']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format('create trigger set_updated_at before update on public.%I
                    for each row execute function public.set_updated_at();', t);
  end loop;
end$$;

-- ============================================================================
-- ROW LEVEL SECURITY  –  jeder sieht nur seine eigenen Zeilen
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array['profiles','objekte','einheiten','mieter','maengel',
                           'mietzahlungen','abrechnungen','aufgaben','dokumente']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "own_select" on public.%I;', t);
    execute format('drop policy if exists "own_insert" on public.%I;', t);
    execute format('drop policy if exists "own_update" on public.%I;', t);
    execute format('drop policy if exists "own_delete" on public.%I;', t);
  end loop;
end$$;

-- profiles nutzt id = auth.uid(), alle anderen user_id = auth.uid()
create policy "own_select" on public.profiles for select using (id = auth.uid());
create policy "own_update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "own_insert" on public.profiles for insert with check (id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['objekte','einheiten','mieter','maengel',
                           'mietzahlungen','abrechnungen','aufgaben','dokumente']
  loop
    execute format('create policy "own_select" on public.%I for select using (user_id = auth.uid());', t);
    execute format('create policy "own_insert" on public.%I for insert with check (user_id = auth.uid());', t);
    execute format('create policy "own_update" on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid());', t);
    execute format('create policy "own_delete" on public.%I for delete using (user_id = auth.uid());', t);
  end loop;
end$$;

-- ============================================================================
-- FERTIG. Storage-Buckets bitte separat anlegen (siehe README-Hinweis):
--   dokumente        (privat)
--   objekt-bilder    (privat)
--   mangel-fotos     (privat)
-- ============================================================================
