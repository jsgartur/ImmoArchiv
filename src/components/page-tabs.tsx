import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export interface TabItem {
  to: string;
  label: string;
  exact?: boolean;
}

/** Reiter-Navigation, die zwischen verwandten Seiten umschaltet. */
export function PageTabs({ tabs }: { tabs: TabItem[] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex gap-1 border-b">
      {tabs.map((t) => {
        const active = t.exact ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + "/");
        return (
          <Link
            key={t.to}
            to={t.to}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm transition",
              active
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

export const PORTFOLIO_TABS: TabItem[] = [
  { to: "/dashboard/portfolio", label: "Portfolio" },
  { to: "/dashboard/finanzierung", label: "Restschuld" },
];

export const AUFGABEN_TABS: TabItem[] = [
  { to: "/dashboard/aufgaben", label: "Aufgaben" },
  { to: "/dashboard/maengel", label: "Mängel" },
  { to: "/dashboard/uebergabe", label: "Übergabeprotokolle" },
];
