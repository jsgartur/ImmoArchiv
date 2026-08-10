import { useEffect, useState } from "react";
import { signierteBildUrl } from "@/lib/bild-utils";
import { cn } from "@/lib/utils";

/** Zeigt ein Objekt-Bild anhand seines Storage-Pfads (löst on-demand eine signierte URL auf). */
export function ObjektBild({
  pfad,
  alt,
  className,
  onClick,
}: {
  pfad: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let aktiv = true;
    setUrl(null);
    signierteBildUrl(pfad)
      .then((u) => aktiv && setUrl(u))
      .catch(() => {});
    return () => {
      aktiv = false;
    };
  }, [pfad]);

  if (!url) return <div className={cn(className, "animate-pulse bg-muted")} />;
  return <img src={url} alt={alt} className={className} onClick={onClick} />;
}
