-- ============================================================================
-- ImmoArchiv – Profilbild
-- ----------------------------------------------------------------------------
-- Ergänzt profiles.avatar_url (Storage-Pfad, Bucket ist privat) und legt den
-- Storage-Bucket "avatare" nach demselben Muster wie die übrigen Buckets an
-- (erster Pfad-Ordner = auth.uid()).
--
-- Ausführen: Supabase Dashboard → SQL Editor → einfügen → "Run".
-- ============================================================================

alter table public.profiles
  add column if not exists avatar_url text;

insert into storage.buckets (id, name, public)
values ('avatare', 'avatare', false)
on conflict (id) do nothing;

drop policy if exists "avatare_select" on storage.objects;
drop policy if exists "avatare_insert" on storage.objects;
drop policy if exists "avatare_update" on storage.objects;
drop policy if exists "avatare_delete" on storage.objects;

create policy "avatare_select" on storage.objects for select
  using (bucket_id = 'avatare' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatare_insert" on storage.objects for insert
  with check (bucket_id = 'avatare' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatare_update" on storage.objects for update
  using (bucket_id = 'avatare' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatare_delete" on storage.objects for delete
  using (bucket_id = 'avatare' and (storage.foldername(name))[1] = auth.uid()::text);
