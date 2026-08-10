import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Calculator,
  LayoutDashboard,
  Coins,
  ReceiptText,
  PieChart,
  ListChecks,
  UserCircle,
  Menu,
  X,
  Loader2,
  LogOut,
  QrCode,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { SupportButton } from "@/components/support-button";
import { Logo } from "@/components/logo";
import { useAuth } from "@/lib/supabase/auth-context";
import { GlobalSearchTrigger } from "@/components/global-search";
import { useStore } from "@/lib/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

type NavItem = { to: string; label: string; icon: typeof Building2; exact?: boolean };

const nav: NavItem[] = [
  { to: "/dashboard", label: "Übersicht", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/objekte", label: "Objekte", icon: Building2 },
  { to: "/dashboard/miete", label: "Mieteingänge", icon: Coins },
  { to: "/dashboard/nebenkosten", label: "Nebenkosten", icon: ReceiptText },
  { to: "/dashboard/mieterportal", label: "Mieterportal", icon: QrCode },
  { to: "/dashboard/aufgaben", label: "Aufgaben", icon: ListChecks },
  { to: "/dashboard/portfolio", label: "Portfolio", icon: PieChart },
  { to: "/dashboard/mietanpassung", label: "Mietanpassung", icon: Calculator },
];

const navUnten: NavItem[] = [{ to: "/dashboard/account", label: "Mein Konto", icon: UserCircle }];

function ProfilMenu() {
  const profil = useStore((s) => s.profil);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initialen = `${profil.vorname?.[0] ?? ""}${profil.nachname?.[0] ?? ""}`.toUpperCase() || "?";
  const name = [profil.vorname, profil.nachname].filter(Boolean).join(" ") || user?.email || "Konto";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-2.5 text-sm outline-none transition hover:border-foreground/30">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">
          {initialen === "?" ? <UserCircle className="h-4 w-4" /> : initialen}
        </div>
        <span className="hidden max-w-[10rem] truncate font-medium sm:inline">{name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{profil.email || user?.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard/account">
            <UserCircle className="h-4 w-4" /> Mein Konto
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard/preise">Plan & Preise</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await signOut();
            navigate({ to: "/login" });
          }}
        >
          <LogOut className="h-4 w-4" /> Abmelden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DashboardLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { session, user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const redirectedRef = useRef(false);
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  useEffect(() => {
    if (!loading && !session && !redirectedRef.current) {
      redirectedRef.current = true;
      navigate({ to: "/login", search: { redirect: pathname } });
    }
  }, [loading, session, pathname, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const NavList = ({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {items.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          onClick={onNavigate}
          className={cn(
            "inline-flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground",
            isActive(n.to, n.exact) && "bg-accent font-medium text-foreground",
          )}
        >
          <n.icon className="h-4 w-4 shrink-0" />
          {n.label}
        </Link>
      ))}
    </nav>
  );

  const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col">
      <Link to="/" onClick={onNavigate} className="mb-4 flex items-center gap-2 px-2 font-semibold">
        <Logo className="h-7 w-7" />
        ImmoArchiv
      </Link>

      <div className="mb-4 px-0">
        <GlobalSearchTrigger />
      </div>

      <NavList items={nav} onNavigate={onNavigate} />

      {/* Bottom-Bereich */}
      <div className="mt-auto space-y-3 pt-6">
        <NavList items={navUnten} onNavigate={onNavigate} />
        <SupportButton />
        <div className="border-t pt-3">
          <ThemeToggle className="w-full justify-start" showLabel />
        </div>
        <div className="border-t pt-3">
          <div className="truncate px-3 text-xs text-muted-foreground" title={user?.email ?? undefined}>
            {user?.email}
          </div>
          <button
            onClick={async () => {
              await signOut();
              onNavigate?.();
              navigate({ to: "/login" });
            }}
            className="mt-1 inline-flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Abmelden
          </button>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 px-3 text-[11px] text-muted-foreground">
          <Link to="/impressum" onClick={onNavigate} className="hover:text-foreground">Impressum</Link>
          <Link to="/datenschutz" onClick={onNavigate} className="hover:text-foreground">Datenschutz</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Fixed left sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-sidebar px-3 py-4 md:flex">
        <Sidebar />
      </aside>

      {/* Desktop top bar: Profil oben rechts */}
      <header className="sticky top-0 z-30 hidden h-16 items-center justify-end gap-3 border-b bg-background/90 px-8 backdrop-blur md:ml-60 md:flex">
        <ProfilMenu />
      </header>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur md:hidden">
        <button
          aria-label="Menü"
          onClick={() => setOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-md hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Logo className="h-7 w-7" />
          ImmoArchiv
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle className="border-0 px-2" />
          <ProfilMenu />
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 border-r bg-sidebar px-3 py-4 shadow-xl">
            <div className="mb-2 flex justify-end">
              <button
                aria-label="Schließen"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Content */}
      <main className="px-4 pb-16 pt-6 md:ml-60 md:px-8 md:pt-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
