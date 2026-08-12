import { Building2 } from "lucide-react";
import { ObjektBild } from "@/components/objekt-bild";
import { cn } from "@/lib/utils";

/** Zeigt das erste Objekt-Foto als Icon, sonst ein generisches Gebäude-Symbol als Platzhalter. */
export function ObjektIcon({
  bilder,
  alt,
  className,
}: {
  bilder?: string[];
  alt: string;
  className?: string;
}) {
  const pfad = bilder?.[0];
  if (pfad) {
    return <ObjektBild pfad={pfad} alt={alt} className={cn(className, "object-cover")} />;
  }
  return (
    <div className={cn(className, "grid place-items-center bg-secondary")}>
      <Building2 className="h-1/2 w-1/2 text-muted-foreground" />
    </div>
  );
}
