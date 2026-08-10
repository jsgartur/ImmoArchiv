import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/cookie-banner";
import { KiAssistant } from "@/components/ki-assistant";
import { AuthProvider } from "@/lib/supabase/auth-context";
import { DatenSync } from "@/components/daten-sync";
import { OfflineBanner } from "@/components/offline-banner";

const themeInitScript = `try{var t=localStorage.getItem('vermietify-theme')||'dark';var d=t!=='light';document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){document.documentElement.classList.add('dark');}`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Seite nicht gefunden</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Die aufgerufene Seite existiert nicht oder wurde verschoben.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Diese Seite konnte nicht geladen werden</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Etwas ist schiefgelaufen. Bitte erneut versuchen oder zurück zur Startseite.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Erneut versuchen
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Startseite
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ImmoArchiv — Vermieter-Software für 1–15 Wohnungen" },
      {
        name: "description",
        content:
          "ImmoArchiv ist die einfache Software für private Kleinvermieter: Objekt- und Mieterverwaltung, Mängel-Tracking mit Foto und Mietanpassungs-Rechner nach § 558 BGB.",
      },
      { property: "og:title", content: "ImmoArchiv — Vermieter-Software für 1–15 Wohnungen" },
      {
        property: "og:description",
        content:
          "Objekte, Mieter, Mängel und Mietanpassung in einer App. Für private Vermieter statt teurer Hausverwaltungs-Software.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "icon",
        type: "image/svg+xml",
        href:
          "data:image/svg+xml," +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 2.5 58 17.5V46.5L32 61.5 6 46.5V17.5Z" fill="#2563eb"/><rect x="41" y="20" width="4.5" height="10" rx="1" fill="#1e3a8a"/><path d="M12.5 35 32 18.5 51.5 35Z" fill="#fff"/><rect x="19" y="33.5" width="26" height="18" rx="1.5" fill="#fff"/><g fill="#1e40af"><rect x="23.5" y="38" width="4" height="4"/><rect x="28.6" y="38" width="4" height="4"/><rect x="23.5" y="43.1" width="4" height="4"/><rect x="28.6" y="43.1" width="4" height="4"/></g><rect x="36" y="41" width="6" height="10.5" fill="#1d4ed8"/></svg>`,
          ),
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OfflineBanner />
        <DatenSync />
        <Outlet />
        <Toaster />
        <CookieBanner />
        <KiAssistant />
      </AuthProvider>
    </QueryClientProvider>
  );
}
