import { useEffect, useState, type ReactNode } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { fmtEUR0 } from "@/lib/store";

/** Marken-Farbpalette (Schwarz/Rot/Weiß/Blau) – funktioniert in hell & dunkel. */
export const CHART_COLORS = [
  "#2563eb", // blau (Primär)
  "#dc2626", // rot
  "#0ea5e9", // hellblau
  "#1e3a8a", // dunkelblau
  "#64748b", // slate
  "#f59e0b", // amber (Akzent)
  "#0f172a", // fast schwarz
  "#94a3b8", // hellgrau
];

const AXIS = "#94a3b8"; // slate-400, neutral für beide Themes
const GRID = "rgba(148,163,184,0.2)";

/** Charts erst nach dem Mount rendern (recharts braucht das DOM, verhindert SSR-/Hydration-Probleme). */
function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

export interface Punkt {
  name: string;
  value: number;
  color?: string;
}

function CardShell({
  title,
  hint,
  children,
  action,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium">{title}</div>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function TooltipBox({
  label,
  value,
  formatValue,
}: {
  label: string;
  value: number;
  formatValue: (n: number) => string;
}) {
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="font-medium text-popover-foreground">{label}</div>
      <div className="tabular-nums text-muted-foreground">{formatValue(value)}</div>
    </div>
  );
}

/** Donut-/Kreisdiagramm mit Mittelwert und Legende. */
export function DonutCard({
  title,
  hint,
  data,
  height = 220,
  formatValue = fmtEUR0,
  centerLabel,
  centerValue,
}: {
  title: string;
  hint?: string;
  data: Punkt[];
  height?: number;
  formatValue?: (n: number) => string;
  centerLabel?: string;
  centerValue?: string;
}) {
  const mounted = useMounted();
  const gefiltert = data.filter((d) => d.value > 0);
  const total = gefiltert.reduce((s, d) => s + d.value, 0);
  const farbe = (d: Punkt, i: number) => d.color ?? CHART_COLORS[i % CHART_COLORS.length];

  return (
    <CardShell title={title} hint={hint}>
      {gefiltert.length === 0 ? (
        <div className="grid place-items-center text-sm text-muted-foreground" style={{ height }}>
          Keine Daten
        </div>
      ) : (
        <>
          <div className="relative" style={{ height }}>
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gefiltert}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="62%"
                    outerRadius="88%"
                    paddingAngle={2}
                    stroke="none"
                  >
                    {gefiltert.map((d, i) => (
                      <Cell key={i} fill={farbe(d, i)} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload && payload.length ? (
                        <TooltipBox
                          label={String(payload[0].name)}
                          value={Number(payload[0].value)}
                          formatValue={formatValue}
                        />
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[11px] text-muted-foreground">{centerLabel ?? "Gesamt"}</div>
              <div className="text-lg font-semibold tabular-nums">{centerValue ?? formatValue(total)}</div>
            </div>
          </div>
          <ul className="mt-4 space-y-1.5">
            {gefiltert.map((d, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: farbe(d, i) }} />
                <span className="flex-1 truncate text-muted-foreground">{d.name}</span>
                <span className="tabular-nums font-medium">{formatValue(d.value)}</span>
                <span className="w-10 text-right text-xs text-muted-foreground">
                  {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </CardShell>
  );
}

/** Flächendiagramm für Verläufe (z. B. Restschuld-Prognose). */
export function AreaCard({
  title,
  hint,
  data,
  height = 260,
  formatValue = fmtEUR0,
  color = CHART_COLORS[1],
}: {
  title: string;
  hint?: string;
  data: { label: string; value: number }[];
  height?: number;
  formatValue?: (n: number) => string;
  color?: string;
}) {
  const mounted = useMounted();
  return (
    <CardShell title={title} hint={hint}>
      <div style={{ height }}>
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={20} />
              <YAxis
                tick={{ fill: AXIS, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={64}
                tickFormatter={(v) => formatValue(Number(v))}
              />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload && payload.length ? (
                    <TooltipBox label={String(label)} value={Number(payload[0].value)} formatValue={formatValue} />
                  ) : null
                }
              />
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#areaFill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </CardShell>
  );
}

/** Balkendiagramm (z. B. Kaltmiete je Objekt). */
export function BarCard({
  title,
  hint,
  data,
  height = 260,
  formatValue = fmtEUR0,
  color = CHART_COLORS[0],
  action,
}: {
  title: string;
  hint?: string;
  data: { label: string; value: number }[];
  height?: number;
  formatValue?: (n: number) => string;
  color?: string;
  action?: ReactNode;
}) {
  const mounted = useMounted();
  return (
    <CardShell title={title} hint={hint} action={action}>
      <div style={{ height }}>
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} interval={0} />
              <YAxis
                tick={{ fill: AXIS, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={64}
                tickFormatter={(v) => formatValue(Number(v))}
              />
              <Tooltip
                cursor={{ fill: "rgba(148,163,184,0.12)" }}
                content={({ active, payload, label }) =>
                  active && payload && payload.length ? (
                    <TooltipBox label={String(label)} value={Number(payload[0].value)} formatValue={formatValue} />
                  ) : null
                }
              />
              <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} maxBarSize={64} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </CardShell>
  );
}
