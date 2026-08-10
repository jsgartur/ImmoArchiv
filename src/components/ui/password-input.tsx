import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends Omit<React.ComponentProps<"input">, "type"> {}

/** Passwortfeld mit Auge-Icon zum kurzzeitigen Anzeigen/Verbergen der Eingabe. */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [sichtbar, setSichtbar] = React.useState(false);

    return (
      <div className="relative">
        <Input
          type={sichtbar ? "text" : "password"}
          className={cn("pr-10", className)}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setSichtbar((s) => !s)}
          aria-label={sichtbar ? "Passwort verbergen" : "Passwort anzeigen"}
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {sichtbar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
