import { Link } from "@tanstack/react-router";
import { Bell, User, AlertTriangle, Coins, ShieldAlert, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { useBenachrichtigungen, type BenachrichtigungAnsicht } from "@/lib/benachrichtigungen";
import { useStore } from "@/lib/store";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const TYP_ICON: Record<BenachrichtigungAnsicht["typ"], typeof AlertTriangle> = {
  schaden: AlertTriangle,
  miete: Coins,
  frist: ShieldAlert,
  system: Bell,
};

function Avatar({ item }: { item: BenachrichtigungAnsicht }) {
  if (item.quelle === "mieter") {
    return (
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary">
        <User className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-500/10">
      <Logo className="h-5 w-5" />
    </div>
  );
}

function Eintrag({ item }: { item: BenachrichtigungAnsicht }) {
  const Icon = TYP_ICON[item.typ];
  const inhalt = (
    <div
      className={cn(
        "flex gap-3 rounded-lg p-2.5 text-left transition hover:bg-accent",
        !item.gelesen && "bg-accent/40",
      )}
    >
      <Avatar item={item} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className={cn("truncate text-sm", !item.gelesen && "font-semibold")}>
            {item.titel}
          </span>
          {!item.gelesen && <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
        </div>
        {item.text && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.text}</p>
        )}
        <div className="mt-1 text-[11px] text-muted-foreground">
          {formatDistanceToNow(new Date(item.datum), { locale: de, addSuffix: true })}
        </div>
      </div>
    </div>
  );

  if (item.link) {
    return (
      <Link
        to={item.link.to}
        params={item.link.params}
        onClick={item.markiereGelesen}
        className="block"
      >
        {inhalt}
      </Link>
    );
  }
  return (
    <button onClick={item.markiereGelesen} className="block w-full">
      {inhalt}
    </button>
  );
}

export function NotificationBell() {
  const eintraege = useBenachrichtigungen();
  const markiereAlleBenachrichtigungenGelesen = useStore(
    (s) => s.markiereAlleBenachrichtigungenGelesen,
  );
  const ungelesen = eintraege.filter((e) => !e.gelesen).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Benachrichtigungen"
          className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border bg-card outline-none transition hover:border-foreground/30"
        >
          <Bell className="h-4 w-4" />
          {ungelesen > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-medium text-white">
              {ungelesen > 9 ? "9+" : ungelesen}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-sm font-medium">Benachrichtigungen</span>
          {ungelesen > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground"
              onClick={markiereAlleBenachrichtigungenGelesen}
            >
              <CheckCheck className="h-3.5 w-3.5" /> Alle gelesen
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-96 space-y-0.5 overflow-y-auto p-1.5">
          {eintraege.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Keine Benachrichtigungen.
            </p>
          ) : (
            eintraege.map((item) => <Eintrag key={item.id} item={item} />)
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
