-- ============================================================================
-- ImmoArchiv – Team-Einladung annehmen per RPC (security definer)
-- ----------------------------------------------------------------------------
-- Die bisherige client-seitige RLS-Policy "accept_invite" (UPDATE mit
-- USING-Bedingung auf E-Mail-Match) hat sich in der Praxis als nicht
-- zuverlässig erwiesen (das UPDATE traf trotz nachweislich korrekt
-- ausgewerteter auth.jwt()/auth.uid()-Bedingungen 0 Zeilen — live per SQL
-- reproduziert). Statt weiter an der Policy zu suchen, läuft die Annahme
-- jetzt über eine security-definer-Funktion, die dasselbe Muster wie
-- eigentuemer_ids() nutzt (bereits zuverlässig im Einsatz).
--
-- Ausführen: Supabase Dashboard → SQL Editor → einfügen → "Run".
-- ============================================================================

create or replace function public.nimm_einladung_an()
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_email text;
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    return;
  end if;
  v_email := auth.jwt() ->> 'email';
  if v_email is null then
    return;
  end if;

  update public.team_mitglieder
  set user_id = v_uid, status = 'aktiv'
  where email = v_email and status = 'eingeladen' and user_id is null;
end;
$$;

grant execute on function public.nimm_einladung_an() to authenticated;

-- Die alte, unzuverlässige Policy wird entfernt (Annahme läuft jetzt nur noch über die RPC).
drop policy if exists "accept_invite" on public.team_mitglieder;
