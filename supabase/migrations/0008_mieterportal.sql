-- ============================================================================
-- ImmoArchiv – Mieterportal: Zugangscode je Mieter (kein Login, QR-Code + Name)
-- ============================================================================

alter table public.mieter
  add column if not exists portal_code text;

create unique index if not exists mieter_portal_code_idx on public.mieter (portal_code) where portal_code is not null;
