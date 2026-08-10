-- ============================================================================
-- ImmoArchiv – optionale Bausparvertrags-Rate (getrennt vom Bankdarlehen)
-- ============================================================================

alter table public.objekte add column if not exists bauspar_betrag_monat numeric;
alter table public.objekte add column if not exists stockwerk text;
