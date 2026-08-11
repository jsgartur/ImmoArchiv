import { useEffect, useState } from "react";
import { signierteAvatarUrl } from "@/lib/avatar-utils";
import { cn } from "@/lib/utils";

/** Zeigt das Profilbild anhand seines Storage-Pfads (löst on-demand eine signierte URL auf). */
export function AvatarBild({
  pfad,
  alt,
  className,
}: {
  pfad: string;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let aktiv = true;
    setUrl(null);
    signierteAvatarUrl(pfad)
      .then((u) => aktiv && setUrl(u))
      .catch(() => {});
    return () => {
      aktiv = false;
    };
  }, [pfad]);

  if (!url) return <div className={cn(className, "animate-pulse bg-muted")} />;
  return <img src={url} alt={alt} className={cn(className, "object-cover")} />;
}
