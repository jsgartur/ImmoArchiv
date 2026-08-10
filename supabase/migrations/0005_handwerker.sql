-- ============================================================================
-- ImmoArchiv – Handwerker-Kontaktdatenbank
-- ============================================================================

create table if not exists public.handwerker (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  gewerk     text,
  telefon    text,
  email      text,
  notizen    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists handwerker_user_idx on public.handwerker (user_id);

drop trigger if exists set_updated_at on public.handwerker;
create trigger set_updated_at before update on public.handwerker
  for each row execute function public.set_updated_at();

alter table public.handwerker enable row level security;

drop policy if exists "own_select" on public.handwerker;
drop policy if exists "own_insert" on public.handwerker;
drop policy if exists "own_update" on public.handwerker;
drop policy if exists "own_delete" on public.handwerker;

create policy "own_select" on public.handwerker for select using (user_id = auth.uid());
create policy "own_insert" on public.handwerker for insert with check (user_id = auth.uid());
create policy "own_update" on public.handwerker for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_delete" on public.handwerker for delete using (user_id = auth.uid());
