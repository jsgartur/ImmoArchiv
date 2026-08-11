-- ============================================================================
-- ImmoArchiv – Benachrichtigungen (Inbox)
-- ----------------------------------------------------------------------------
-- Persistierte System-Benachrichtigungen, z. B. wenn ein Mieter über das
-- Mieterportal einen Schaden meldet. Erinnerungen ohne eigenen "Ereignis"
-- (Mietprüfung zu Monatsbeginn, ablaufende Fristen) werden clientseitig aus
-- den bestehenden Objektdaten berechnet und in der Inbox mitangezeigt, statt
-- hier dupliziert gespeichert zu werden.
--
-- Ausführen: Supabase Dashboard → SQL Editor → einfügen → "Run".
-- ============================================================================

create table if not exists public.benachrichtigungen (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  typ         text not null default 'system' check (typ in ('schaden', 'system', 'sonstiges')),
  titel       text not null,
  text        text,
  gelesen     boolean not null default false,
  objekt_id   uuid references public.objekte (id) on delete cascade,
  mangel_id   uuid references public.maengel (id) on delete cascade,
  erstellt_am timestamptz not null default now()
);
create index if not exists benachrichtigungen_user_idx on public.benachrichtigungen (user_id, erstellt_am desc);

alter table public.benachrichtigungen enable row level security;

drop policy if exists "own_select" on public.benachrichtigungen;
drop policy if exists "own_insert" on public.benachrichtigungen;
drop policy if exists "own_update" on public.benachrichtigungen;
drop policy if exists "own_delete" on public.benachrichtigungen;

create policy "own_select" on public.benachrichtigungen for select
  using (user_id in (select public.eigentuemer_ids()));
create policy "own_insert" on public.benachrichtigungen for insert
  with check (user_id in (select public.eigentuemer_ids()));
create policy "own_update" on public.benachrichtigungen for update
  using (user_id in (select public.eigentuemer_ids())) with check (user_id in (select public.eigentuemer_ids()));
create policy "own_delete" on public.benachrichtigungen for delete
  using (user_id in (select public.eigentuemer_ids()));

-- ============================================================================
-- Trigger: Meldet ein Mieter (über das Mieterportal) einen Schaden, legt sich
-- automatisch eine Benachrichtigung für den Eigentümer an.
-- ============================================================================
create or replace function public.benachrichtige_bei_mieter_schaden()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_objekt_id uuid;
begin
  if new.gemeldet_von = 'mieter' then
    select objekt_id into v_objekt_id from public.einheiten where id = new.einheit_id;
    insert into public.benachrichtigungen (user_id, typ, titel, text, objekt_id, mangel_id)
    values (new.user_id, 'schaden', 'Neuer Schaden gemeldet', new.titel, v_objekt_id, new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_mangel_von_mieter on public.maengel;
create trigger on_mangel_von_mieter
  after insert on public.maengel
  for each row execute function public.benachrichtige_bei_mieter_schaden();
