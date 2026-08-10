-- ============================================================================
-- ImmoArchiv – Vertrags-/Versicherungsfristen am Objekt
-- ============================================================================

alter table public.objekte
  add column if not exists versicherung_ablauf date,
  add column if not exists energieausweis_gueltig_bis date;
