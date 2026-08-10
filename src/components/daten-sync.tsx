import { useEffect } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { useStore, LEERES_PROFIL } from "@/lib/store";
import { nimmEinladungAn } from "@/lib/supabase/team";

/**
 * Lädt die Daten des angemeldeten Nutzers (Objekte, Profil, Einheiten, Mieter, Mängel, …) aus
 * Supabase und hält sie aktuell. Rendert nichts – rein für den Seiteneffekt gemountet (in __root.tsx).
 */
export function DatenSync() {
  const { user, loading } = useAuth();
  const ladeObjekteVonSupabase = useStore((s) => s.ladeObjekteVonSupabase);
  const ladeProfilVonSupabase = useStore((s) => s.ladeProfilVonSupabase);
  const ladeEinheitenVonSupabase = useStore((s) => s.ladeEinheitenVonSupabase);
  const ladeMieterVonSupabase = useStore((s) => s.ladeMieterVonSupabase);
  const ladeMaengelVonSupabase = useStore((s) => s.ladeMaengelVonSupabase);
  const ladeMietzahlungenVonSupabase = useStore((s) => s.ladeMietzahlungenVonSupabase);
  const ladeAbrechnungenVonSupabase = useStore((s) => s.ladeAbrechnungenVonSupabase);
  const ladeAufgabenVonSupabase = useStore((s) => s.ladeAufgabenVonSupabase);
  const ladeHandwerkerVonSupabase = useStore((s) => s.ladeHandwerkerVonSupabase);
  const ladeUebergabeprotokolleVonSupabase = useStore((s) => s.ladeUebergabeprotokolleVonSupabase);

  useEffect(() => {
    if (loading) return;
    if (user) {
      // Offene Team-Einladung zuerst annehmen, damit eigentuemer_ids() beim
      // ersten Laden schon die Daten des Kontoeigentümers mit einschließt.
      nimmEinladungAn().finally(() => {
        ladeObjekteVonSupabase();
        ladeProfilVonSupabase();
        ladeEinheitenVonSupabase();
        ladeMieterVonSupabase();
        ladeMaengelVonSupabase();
        ladeMietzahlungenVonSupabase();
        ladeAbrechnungenVonSupabase();
        ladeAufgabenVonSupabase();
        ladeHandwerkerVonSupabase();
        ladeUebergabeprotokolleVonSupabase();
      });
    } else {
      useStore.setState({
        objekte: [],
        objekteGeladen: false,
        profil: LEERES_PROFIL,
        profilGeladen: false,
        einheiten: [],
        einheitenGeladen: false,
        mieter: [],
        mieterGeladen: false,
        maengel: [],
        maengelGeladen: false,
        mietzahlungen: [],
        mietzahlungenGeladen: false,
        abrechnungen: [],
        abrechnungenGeladen: false,
        aufgaben: [],
        aufgabenGeladen: false,
        handwerker: [],
        handwerkerGeladen: false,
        uebergabeprotokolle: [],
        uebergabeprotokolleGeladen: false,
      });
    }
  }, [
    user?.id,
    loading,
    ladeObjekteVonSupabase,
    ladeProfilVonSupabase,
    ladeEinheitenVonSupabase,
    ladeMieterVonSupabase,
    ladeMaengelVonSupabase,
    ladeMietzahlungenVonSupabase,
    ladeAbrechnungenVonSupabase,
    ladeAufgabenVonSupabase,
    ladeHandwerkerVonSupabase,
    ladeUebergabeprotokolleVonSupabase,
  ]);

  return null;
}
