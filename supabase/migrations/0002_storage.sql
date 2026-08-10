-- ============================================================================
-- ImmoArchiv – Storage-Buckets für Dateien (Dokumente, Bilder, Mängel-Fotos)
-- Konvention: Jede Datei liegt unter  <auth.uid()>/<dateiname>  →  RLS prüft,
-- dass der erste Ordner der eigenen User-ID entspricht.
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('dokumente',     'dokumente',     false),
  ('objekt-bilder', 'objekt-bilder', false),
  ('mangel-fotos',  'mangel-fotos',  false)
on conflict (id) do nothing;

-- Policies: Nutzer darf nur in seinem eigenen Ordner lesen/schreiben ----------
do $$
declare b text;
begin
  foreach b in array array['dokumente','objekt-bilder','mangel-fotos']
  loop
    execute format('drop policy if exists %I on storage.objects;', b || '_select');
    execute format('drop policy if exists %I on storage.objects;', b || '_insert');
    execute format('drop policy if exists %I on storage.objects;', b || '_update');
    execute format('drop policy if exists %I on storage.objects;', b || '_delete');

    execute format($f$
      create policy %I on storage.objects for select
      using (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text);
    $f$, b || '_select', b);

    execute format($f$
      create policy %I on storage.objects for insert
      with check (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text);
    $f$, b || '_insert', b);

    execute format($f$
      create policy %I on storage.objects for update
      using (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text);
    $f$, b || '_update', b);

    execute format($f$
      create policy %I on storage.objects for delete
      using (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text);
    $f$, b || '_delete', b);
  end loop;
end$$;
