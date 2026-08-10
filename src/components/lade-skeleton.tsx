/** Platzhalter während Daten aus Supabase geladen werden – ersetzt kurzes "leer"-Flackern. */
export function LadeSkeleton({ titel, text }: { titel: string; text: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{titel}</h1>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="h-40 animate-pulse rounded-2xl border bg-card/40" />
        <div className="h-40 animate-pulse rounded-2xl border bg-card/40" />
        <div className="h-40 animate-pulse rounded-2xl border bg-card/40" />
      </div>
    </div>
  );
}
