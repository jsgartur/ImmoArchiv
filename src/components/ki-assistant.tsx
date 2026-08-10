import { useRef, useState, useEffect } from "react";
import { Sparkles, X, Send, Settings, Loader2, KeyRound, ExternalLink } from "lucide-react";
import { useStore } from "@/lib/store";
import { buildKontext, fragKi, getApiKey, setApiKey, KI_SCHNELLFRAGEN, type KiMessage } from "@/lib/ki";
import { istPro } from "@/lib/plaene";
import { useAuth } from "@/lib/supabase/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function KiAssistant() {
  const { session } = useAuth();
  const plan = useStore((s) => s.profil.plan);
  const darfNutzen = !!session && istPro(plan);
  return darfNutzen ? <KiAssistantInner /> : null;
}

function KiAssistantInner() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<KiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const objekte = useStore((s) => s.objekte);
  const einheiten = useStore((s) => s.einheiten);
  const mieter = useStore((s) => s.mieter);
  const maengel = useStore((s) => s.maengel);
  const aufgaben = useStore((s) => s.aufgaben);
  const mietzahlungen = useStore((s) => s.mietzahlungen);
  const profil = useStore((s) => s.profil);

  useEffect(() => {
    if (open) {
      const k = getApiKey();
      setHasKey(!!k);
      setKeyInput(k);
      if (!k) setShowSettings(true);
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const speichereKey = () => {
    setApiKey(keyInput);
    setHasKey(!!keyInput.trim());
    if (keyInput.trim()) setShowSettings(false);
  };

  const senden = async (text: string) => {
    const frage = text.trim();
    if (!frage || loading) return;
    setError(null);
    const neu: KiMessage[] = [...messages, { role: "user", content: frage }];
    setMessages(neu);
    setInput("");
    setLoading(true);
    try {
      const kontext = buildKontext({ objekte, einheiten, mieter, maengel, aufgaben, mietzahlungen, profil });
      const antwort = await fragKi(neu, kontext);
      setMessages((m) => [...m, { role: "assistant", content: antwort }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "KEIN_KEY") {
        setShowSettings(true);
        setError("Bitte zuerst einen API-Schlüssel hinterlegen.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Floating-Button
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="KI-Assistent öffnen"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-600/30 transition hover:scale-105 hover:shadow-xl"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[70vh] max-h-[640px] w-[calc(100vw-3rem)] max-w-[400px] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-2 border-b bg-gradient-to-br from-blue-600 to-blue-800 px-4 py-3 text-white">
        <Sparkles className="h-5 w-5" />
        <div className="flex-1">
          <div className="text-sm font-semibold">ImmoArchiv KI</div>
          <div className="text-[11px] text-white/80">Claude Haiku · Ihr Immobilien-Assistent</div>
        </div>
        <button onClick={() => setShowSettings((s) => !s)} aria-label="Einstellungen" className="grid h-8 w-8 place-items-center rounded-md hover:bg-white/15">
          <Settings className="h-4 w-4" />
        </button>
        <button onClick={() => setOpen(false)} aria-label="Schließen" className="grid h-8 w-8 place-items-center rounded-md hover:bg-white/15">
          <X className="h-4 w-4" />
        </button>
      </div>

      {showSettings ? (
        <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <KeyRound className="h-4 w-4" /> API-Schlüssel
          </div>
          <p className="text-xs text-muted-foreground">
            Der Schlüssel wird nur lokal in Ihrem Browser gespeichert und direkt an die Anthropic-API gesendet.
            Erstellen Sie einen unter{" "}
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-primary hover:underline">
              console.anthropic.com <ExternalLink className="h-3 w-3" />
            </a>
            .
          </p>
          <Input
            type="password"
            placeholder="sk-ant-..."
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={speichereKey} disabled={!keyInput.trim()}>
              Speichern
            </Button>
            {hasKey && (
              <Button size="sm" variant="ghost" onClick={() => setShowSettings(false)}>
                Zurück zum Chat
              </Button>
            )}
          </div>
          <p className="rounded-md bg-amber-500/10 p-2 text-[11px] text-amber-700 dark:text-amber-400">
            Sicherheitshinweis: Teilen Sie Ihren Schlüssel niemals in Chats oder öffentlichem Code. Ein einmal
            veröffentlichter Schlüssel sollte in der Console widerrufen und neu erstellt werden.
          </p>
        </div>
      ) : (
        <>
          {/* Nachrichten */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Hallo! Ich kenne Ihr Portfolio und helfe bei Nebenkosten, Mietrecht, Spartipps, E-Mails an Mieter und
                  mehr. Fragen Sie einfach — oder wählen Sie:
                </p>
                <div className="flex flex-wrap gap-2">
                  {KI_SCHNELLFRAGEN.map((q) => (
                    <button
                      key={q.label}
                      onClick={() => senden(q.prompt)}
                      className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm " +
                    (m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-secondary px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> denkt nach …
                </div>
              </div>
            )}
            {error && <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{error}</div>}
          </div>

          {/* Eingabe */}
          <div className="border-t p-3">
            <div className="flex items-end gap-2">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    senden(input);
                  }
                }}
                placeholder="Frage zu Ihren Immobilien …"
                className="max-h-28 flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
              <Button size="icon" onClick={() => senden(input)} disabled={loading || !input.trim()} aria-label="Senden">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
