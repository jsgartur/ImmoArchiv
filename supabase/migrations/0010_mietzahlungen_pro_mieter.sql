-- ============================================================================
-- ImmoArchiv – Mieteingänge pro Mieter statt pro Objekt
-- (bisher: eine Zahlung je Objekt+Monat -> unbrauchbar bei mehreren Einheiten
-- pro Objekt. Jetzt: eine Zahlung je Mieter+Monat.)
-- ============================================================================

alter table public.mietzahlungen add column if not exists mieter_id uuid references public.mieter (id) on delete cascade;
alter table public.mietzahlungen alter column objekt_id drop not null;

alter table public.mietzahlungen drop constraint if exists mietzahlungen_objekt_id_monat_key;
alter table public.mietzahlungen drop constraint if exists mietzahlungen_mieter_monat_key;
alter table public.mietzahlungen add constraint mietzahlungen_mieter_monat_key unique (mieter_id, monat);

create index if not exists mietzahlungen_mieter_idx on public.mietzahlungen (mieter_id);

-- Alte, rein objektbezogene Testzahlungen ohne Mieterbezug sind mit dem neuen
-- Modell nicht mehr sinnvoll zuordenbar und werden entfernt.
delete from public.mietzahlungen where mieter_id is null;
