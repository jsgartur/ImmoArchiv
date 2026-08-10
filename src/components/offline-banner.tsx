import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Zeigt einen Hinweis, solange der Browser keine Internetverbindung hat. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const setzeOnline = () => setOffline(false);
    const setzeOffline = () => setOffline(true);
    window.addEventListener("online", setzeOnline);
    window.addEventListener("offline", setzeOffline);
    return () => {
      window.removeEventListener("online", setzeOnline);
      window.removeEventListener("offline", setzeOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground">
      <WifiOff className="h-4 w-4" />
      Keine Internetverbindung – Änderungen werden erst gespeichert, sobald Sie wieder online sind.
    </div>
  );
}
