-- ============================================================================
-- ImmoArchiv – Ordner für Dokumente (Explorer-Struktur je Objekt)
-- ----------------------------------------------------------------------------
-- Ordner sind je Objekt beliebig verschachtelbar (parent_id). Dokumente
-- bekommen eine optionale ordner_id – ohne Ordner liegen sie im Wurzel-
-- verzeichnis des Objekts.
--
-- Ausführen: Supabase Dashboard → SQL Editor → einfügen → "Run".
-- ============================================================================

create table if not exists public.dokument_ordner (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  objekt_id   uuid not null references public.objekte (id) on delete cascade,
  parent_id   uuid references public.dokument_ordner (id) on delete cascade,
  name        text not null,
  erstellt_am timestamptz not null default now()
);
create index if not exists dokument_ordner_objekt_idx on public.dokument_ordner (objekt_id);
create index if not exists dokument_ordner_parent_idx on public.dokument_ordner (parent_id);

alter table public.dokument_ordner enable row level security;

drop policy if exists "own_select" on public.dokument_ordner;
drop policy if exists "own_insert" on public.dokument_ordner;
drop policy if exists "own_update" on public.dokument_ordner;
drop policy if exists "own_delete" on public.dokument_ordner;

create policy "own_select" on public.dokument_ordner for select
  using (user_id in (select public.eigentuemer_ids()));
create policy "own_insert" on public.dokument_ordner for insert
  with check (user_id in (select public.eigentuemer_ids()));
create policy "own_update" on public.dokument_ordner for update
  using (user_id in (select public.eigentuemer_ids())) with check (user_id in (select public.eigentuemer_ids()));
create policy "own_delete" on public.dokument_ordner for delete
  using (user_id in (select public.eigentuemer_ids()));

alter table public.dokumente
  add column if not exists ordner_id uuid references public.dokument_ordner (id) on delete set null;
create index if not exists dokumente_ordner_idx on public.dokumente (ordner_id);
