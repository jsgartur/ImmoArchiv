-- ============================================================================
-- ImmoArchiv – Mehrbenutzer / Team-Zugriff (Professional-Feature)
-- ----------------------------------------------------------------------------
-- Ein Konto-Eigentümer kann Team-Mitglieder per E-Mail einladen. Nimmt die
-- eingeladene Person die Einladung an (Login/Registrierung mit derselben
-- E-Mail), sieht sie fortan dieselben Daten wie der Eigentümer (Objekte,
-- Mieter, Mängel, …) und kann sie bearbeiten. Rollen sind bewusst einfach
-- gehalten (owner/mitglied) — feingranulare Rechte sind ein möglicher
-- späterer Ausbau, ohne dass dieses Schema nochmal umgebaut werden müsste.
--
-- Ausführen: Supabase Dashboard → SQL Editor → einfügen → "Run".
-- ============================================================================

create table if not exists public.team_mitglieder (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  user_id     uuid references auth.users (id) on delete cascade,
  email       text not null,
  rolle       text not null default 'mitglied' check (rolle in ('owner', 'mitglied')),
  status      text not null default 'eingeladen' check (status in ('eingeladen', 'aktiv')),
  erstellt_am timestamptz not null default now(),
  unique (owner_id, email)
);
create index if not exists team_mitglieder_owner_idx on public.team_mitglieder (owner_id);
create index if not exists team_mitglieder_user_idx on public.team_mitglieder (user_id);

alter table public.team_mitglieder enable row level security;

drop policy if exists "owner_select" on public.team_mitglieder;
drop policy if exists "owner_insert" on public.team_mitglieder;
drop policy if exists "owner_delete" on public.team_mitglieder;
drop policy if exists "own_membership_select" on public.team_mitglieder;
drop policy if exists "accept_invite" on public.team_mitglieder;

-- Der Eigentümer sieht/verwaltet seine eigenen Einladungen
create policy "owner_select" on public.team_mitglieder for select using (owner_id = auth.uid());
create policy "owner_insert" on public.team_mitglieder for insert with check (owner_id = auth.uid());
create policy "owner_delete" on public.team_mitglieder for delete using (owner_id = auth.uid());

-- Ein bereits verknüpftes Mitglied darf seine eigene Mitgliedschaftszeile sehen
create policy "own_membership_select" on public.team_mitglieder for select using (user_id = auth.uid());

-- Eine offene, noch nicht verknüpfte Einladung darf von der eingeladenen Person
-- (E-Mail-Match, über den JWT der eigenen Session) angenommen werden.
create policy "accept_invite" on public.team_mitglieder for update
  using (user_id is null and status = 'eingeladen' and email = (auth.jwt() ->> 'email'))
  with check (user_id = auth.uid() and status = 'aktiv');

-- ============================================================================
-- Hilfsfunktion: alle "Eigentümer-Konten", auf die der aktuelle Nutzer Zugriff
-- hat — sein eigenes, plus die jedes Kontos, bei dem er aktives Mitglied ist.
-- ============================================================================
create or replace function public.eigentuemer_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select auth.uid()
  union
  select owner_id from public.team_mitglieder
  where user_id = auth.uid() and status = 'aktiv';
$$;

-- ============================================================================
-- RLS auf allen Datentabellen: statt "user_id = auth.uid()" jetzt
-- "user_id in eigentuemer_ids()" — erlaubt Team-Mitgliedern denselben Zugriff
-- wie dem Eigentümer, ohne dass jede Zeile umgeschrieben werden muss.
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array['objekte','einheiten','mieter','maengel','mietzahlungen',
                           'abrechnungen','aufgaben','dokumente','handwerker',
                           'uebergabeprotokolle']
  loop
    execute format('drop policy if exists "own_select" on public.%I;', t);
    execute format('drop policy if exists "own_insert" on public.%I;', t);
    execute format('drop policy if exists "own_update" on public.%I;', t);
    execute format('drop policy if exists "own_delete" on public.%I;', t);

    execute format(
      'create policy "own_select" on public.%I for select using (user_id in (select public.eigentuemer_ids()));', t);
    execute format(
      'create policy "own_insert" on public.%I for insert with check (user_id in (select public.eigentuemer_ids()));', t);
    execute format(
      'create policy "own_update" on public.%I for update using (user_id in (select public.eigentuemer_ids())) with check (user_id in (select public.eigentuemer_ids()));', t);
    execute format(
      'create policy "own_delete" on public.%I for delete using (user_id in (select public.eigentuemer_ids()));', t);
  end loop;
end$$;

-- ============================================================================
-- HINWEIS: Storage-Buckets (objekt-bilder, dokumente, mangel-fotos) bleiben
-- unverändert nach dem Muster "erster Pfad-Ordner = auth.uid() des Uploaders".
-- Von einem Team-Mitglied hochgeladene Dateien liegen also unter dessen
-- eigener id, nicht der des Kontoeigentümers. Das ist eine bekannte
-- Einschränkung dieser ersten Mehrbenutzer-Version.
-- ============================================================================
