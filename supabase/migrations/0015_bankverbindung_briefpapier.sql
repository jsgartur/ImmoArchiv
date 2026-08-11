-- ============================================================================
-- ImmoArchiv – Bankverbindung im Profil + Briefpapier-Auswahl je Abrechnung
-- ----------------------------------------------------------------------------
-- Ergänzt Kontoinhaber/IBAN/BIC am Profil (für Zahlungsangaben auf
-- Nebenkostenabrechnungen) sowie eine Briefpapier-Vorlage je Abrechnung.
--
-- Ausführen: Supabase Dashboard → SQL Editor → einfügen → "Run".
-- ============================================================================

alter table public.profiles
  add column if not exists kontoinhaber text,
  add column if not exists iban text,
  add column if not exists bic text;

alter table public.abrechnungen
  add column if not exists briefpapier text not null default 'klassisch'
    check (briefpapier in ('klassisch', 'modern', 'elegant'));
