-- ============================================================================
-- ImmoArchiv – Kontotyp bei Registrierung (Privatvermieter vs. Unternehmen)
-- ----------------------------------------------------------------------------
-- Ergänzt profiles.kontotyp und liest ihn (samt Firma) bei der Registrierung
-- aus den user_metadata ein, analog zu Vorname/Nachname/Geburtsdatum.
--
-- Ausführen: Supabase Dashboard → SQL Editor → einfügen → "Run".
-- ============================================================================

alter table public.profiles
  add column if not exists kontotyp text not null default 'privat'
    check (kontotyp in ('privat', 'unternehmen'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, vorname, nachname, geburtsdatum, kontotyp, firma)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'vorname',
    new.raw_user_meta_data ->> 'nachname',
    nullif(new.raw_user_meta_data ->> 'geburtsdatum', '')::date,
    coalesce(new.raw_user_meta_data ->> 'kontotyp', 'privat'),
    new.raw_user_meta_data ->> 'firma'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
