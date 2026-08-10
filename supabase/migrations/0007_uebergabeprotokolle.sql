-- ============================================================================
-- ImmoArchiv – Digitale Übergabeprotokolle (Ein-/Auszug)
-- ============================================================================

create table if not exists public.uebergabeprotokolle (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null default auth.uid() references auth.users (id) on delete cascade,
  einheit_id            uuid not null references public.einheiten (id) on delete cascade,
  mieter_id             uuid references public.mieter (id) on delete set null,
  typ                   text not null check (typ in ('einzug', 'auszug')),
  datum                 date not null default current_date,
  raeume                jsonb not null default '[]',   -- [{id,name,zustand,fotos:[]}]
  zaehlerstaende        jsonb not null default '[]',   -- [{id,bezeichnung,zaehlernummer,stand,einheit}]
  schluessel_anzahl     integer,
  bemerkungen           text,
  unterschrift_mieter   text,   -- Base64 PNG
  unterschrift_vermieter text,  -- Base64 PNG
  erstellt_am           timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists uebergabeprotokolle_einheit_idx on public.uebergabeprotokolle (einheit_id);
create index if not exists uebergabeprotokolle_user_idx on public.uebergabeprotokolle (user_id);

drop trigger if exists set_updated_at on public.uebergabeprotokolle;
create trigger set_updated_at before update on public.uebergabeprotokolle
  for each row execute function public.set_updated_at();

alter table public.uebergabeprotokolle enable row level security;

drop policy if exists "own_select" on public.uebergabeprotokolle;
drop policy if exists "own_insert" on public.uebergabeprotokolle;
drop policy if exists "own_update" on public.uebergabeprotokolle;
drop policy if exists "own_delete" on public.uebergabeprotokolle;

create policy "own_select" on public.uebergabeprotokolle for select using (user_id = auth.uid());
create policy "own_insert" on public.uebergabeprotokolle for insert with check (user_id = auth.uid());
create policy "own_update" on public.uebergabeprotokolle for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_delete" on public.uebergabeprotokolle for delete using (user_id = auth.uid());
