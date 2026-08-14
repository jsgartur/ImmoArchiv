import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperSchritt<T extends string> {
  id: T;
  label: string;
}

/** Nummerierte Fortschritts-Zeitleiste für mehrstufige Formulare (Assistenten). */
export function Stepper<T extends string>({
  schritte,
  aktiv,
  onSelect,
}: {
  schritte: StepperSchritt<T>[];
  aktiv: T;
  onSelect?: (s: T) => void;
}) {
  const idx = schritte.findIndex((s) => s.id === aktiv);
  return (
    <div className="no-print flex items-start">
      {schritte.map((s, i) => {
        const Tag = onSelect ? "button" : "div";
        return (
          <div key={s.id} className={cn("flex items-center", i < schritte.length - 1 && "flex-1")}>
            <Tag
              type={onSelect ? "button" : undefined}
              onClick={onSelect ? () => onSelect(s.id) : undefined}
              className="flex shrink-0 flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full border-2 text-xs font-medium transition",
                  i < idx
                    ? "border-primary bg-primary text-primary-foreground"
                    : i === idx
                      ? "border-primary text-primary"
                      : "border-muted-foreground/30 text-muted-foreground",
                )}
              >
                {i < idx ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "max-w-24 text-center text-[11px] leading-tight",
                  i === idx ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </Tag>
            {i < schritte.length - 1 && (
              <div className={cn("mx-1 mt-3.5 h-0.5 flex-1", i < idx ? "bg-primary" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
