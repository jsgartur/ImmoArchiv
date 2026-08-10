-- ============================================================================
-- ImmoArchiv – Registrierung mit Vorname/Nachname/Geburtsdatum
-- ----------------------------------------------------------------------------
-- Ergänzt profiles.geburtsdatum und liest bei der Registrierung Vorname,
-- Nachname und Geburtsdatum aus den user_metadata (die die App beim
-- supabase.auth.signUp(...) als `options.data` mitschickt) in die Profil-
-- zeile ein.
--
-- Ausführen: Supabase Dashboard → SQL Editor → einfügen → "Run".
-- ============================================================================

alter table public.profiles
  add column if not exists geburtsdatum date;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, vorname, nachname, geburtsdatum)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'vorname',
    new.raw_user_meta_data ->> 'nachname',
    nullif(new.raw_user_meta_data ->> 'geburtsdatum', '')::date
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
