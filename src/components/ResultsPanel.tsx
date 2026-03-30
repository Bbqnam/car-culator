import { useEffect, useMemo, useState } from "react";
import { CarResult, Currency, formatCurrency, generateVerdict } from "@/lib/car-types";
import { getBrandLogo } from "@/lib/brand-logos";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Lightbulb } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { FuelBadge } from "@/components/FuelBadge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ResultsPanelProps {
  results: CarResult[];
  currency: Currency;
}

type Tab = "overview" | "breakdown" | "chart";
type BreakdownRowKey = keyof CarResult["breakdown"];

const FINANCING_LABELS: Record<string, string> = {
  cash: "Cash",
  loan: "Loan",
  leasing: "Lease",
};

const BREAKDOWN_ROWS: { key: BreakdownRowKey; label: string; color: string }[] = [
  { key: "depreciation", label: "Depreciation", color: "hsl(220,14%,40%)" },
  { key: "financingCost", label: "Financing", color: "hsl(0,65%,55%)" },
  { key: "leaseCost", label: "Lease payments", color: "hsl(200,60%,50%)" },
  { key: "fuel", label: "Fuel / Energy", color: "hsl(38,80%,50%)" },
  { key: "insurance", label: "Insurance", color: "hsl(215,55%,55%)" },
  { key: "tax", label: "Tax", color: "hsl(280,40%,55%)" },
  { key: "service", label: "Service", color: "hsl(152,45%,48%)" },
  { key: "downPayment", label: "Down payment", color: "hsl(30,50%,55%)" },
  { key: "mileagePenalty", label: "Mileage penalty", color: "hsl(15,70%,55%)" },
  { key: "endOfTermFee", label: "End-of-term fee", color: "hsl(340,40%,55%)" },
];

const CHART_COLORS = {
  cheapest: "hsl(152,45%,48%)",
  normal: "hsl(220,8%,78%)",
};

export function ResultsPanel({ results, currency }: ResultsPanelProps) {
  const [tab, setTab] = useState<Tab>("overview");

  if (results.length === 0) return null;

  const resultsWithVerdicts = results.map((r) => ({
    ...r,
    verdict: generateVerdict(r, results),
  }));

  const sorted = [...resultsWithVerdicts].sort((a, b) => a.monthlyCost - b.monthlyCost);
  const activeRows = BREAKDOWN_ROWS.filter((r) =>
    sorted.some((car) => (car.breakdown[r.key] ?? 0) > 0)
  );

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-border/60 bg-secondary/30">
        {([
          { key: "overview" as Tab, label: "Results" },
          { key: "breakdown" as Tab, label: "Breakdown" },
          { key: "chart" as Tab, label: "Chart" },
        ]).map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex-1 py-3 text-[11px] sm:text-xs font-semibold uppercase tracking-widest transition-colors ${
              tab === item.key
                ? "text-foreground border-b-2 border-foreground -mb-px bg-card"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-5 lg:p-6">
        {tab === "overview" && (
          <OverviewTab
            sorted={sorted}
            currency={currency}
          />
        )}
        {tab === "breakdown" && (
          <BreakdownTab sorted={sorted} activeRows={activeRows} currency={currency} />
        )}
        {tab === "chart" && (
          <ChartTab
            sorted={sorted}
            activeRows={activeRows}
            currency={currency}
          />
        )}
      </div>
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({
  sorted,
  currency,
}: {
  sorted: (CarResult & { verdict: string })[];
  currency: Currency;
}) {
  const cheapestMonthly = sorted[0]?.monthlyCost ?? 0;
  const isMulti = sorted.length > 1;
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const detailsCar = sorted.find((r) => r.id === detailsId) ?? null;

  return (
    <div className="space-y-3">
      {sorted.map((result, idx) => {
        const isCheapest = idx === 0 && isMulti;
        const diff = result.monthlyCost - cheapestMonthly;

        return (
          <div
            key={result.id}
            className={`rounded-xl p-4 border transition-all ${
              isCheapest
                ? "bg-highlight-soft border-highlight/25 ring-1 ring-highlight/15"
                : "bg-background border-border/60"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {result.brand && <BrandLogo brand={result.brand} size="md" />}
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{result.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {result.fuelType && <FuelBadge fuelType={result.fuelType} />}
                    <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                      {FINANCING_LABELS[result.financingMode]}
                    </span>
                    {isCheapest && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-highlight bg-highlight/12 px-2 py-0.5 rounded-full">
                        Best value
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-2xl font-bold tracking-tight tabular-nums">
                  {formatCurrency(result.monthlyCost, currency)}
                </div>
                <div className="text-[11px] text-muted-foreground">per month</div>
              </div>
            </div>

            <div
              className="mt-3 pt-3 border-t border-border/50 grid gap-x-2.5 gap-y-2"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(112px, 1fr))" }}
            >
              <MiniStat
                label="Total"
                value={formatCurrency(result.totalOwnershipCost, currency)}
              />
              <MiniStat
                label="Per year"
                value={formatCurrency(result.yearlyCost, currency)}
              />
              <MiniStat
                label="Per km"
                value={formatCurrency(result.costPerKm, currency)}
              />
              <MiniStat
                label={diff > 0 && isMulti ? "vs cheapest" : "Residual"}
                value={
                  diff > 0 && isMulti
                    ? `+${formatCurrency(diff, currency)}/mo`
                    : result.residualValuePercent > 0
                    ? `${result.residualValuePercent}%`
                    : "—"
                }
                accent={diff > 0 && isMulti ? "negative" : undefined}
              />
            </div>

            {result.verdict && (
              <div
                className={[
                  "mt-2 rounded-lg border px-2.5 py-1.5 flex items-center gap-2 transition-colors",
                  isCheapest
                    ? "border-highlight/35 bg-highlight/10"
                    : "border-border/60 bg-secondary/30",
                ].join(" ")}
              >
                <span
                  className={[
                    "shrink-0 rounded-full p-1",
                    isCheapest ? "bg-highlight/20 text-highlight" : "bg-secondary text-muted-foreground",
                  ].join(" ")}
                >
                  <Lightbulb className="w-3.5 h-3.5 animate-pulse" />
                </span>
                <p className="text-[11px] leading-relaxed text-foreground/90 italic">
                  {result.verdict}
                </p>
              </div>
            )}

            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailsId(result.id)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Financing details →
              </button>
            </div>
          </div>
        );
      })}

      {isMulti && (
        <div className="text-center text-xs text-muted-foreground pt-1">
          Choosing the cheapest option saves{" "}
          <span className="font-semibold text-highlight">
            {formatCurrency(
              sorted[sorted.length - 1].monthlyCost - sorted[0].monthlyCost,
              currency
            )}
            /mo
          </span>
        </div>
      )}

      <Dialog
        open={!!detailsCar}
        onOpenChange={(open) => {
          if (!open) setDetailsId(null);
        }}
      >
        {detailsCar && (
          <DialogContent className="max-w-lg">
            <DialogTitle className="text-sm">{detailsCar.name} financing details</DialogTitle>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {FINANCING_LABELS[detailsCar.financingMode]} · {formatCurrency(detailsCar.monthlyCost, currency)}/mo
              </p>
              <div className="space-y-1.5">
                {BREAKDOWN_ROWS.filter((row) => (detailsCar.breakdown[row.key] ?? 0) > 0).map((row) => (
                  <div key={row.key} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-semibold">
                      {formatCurrency(Math.round(detailsCar.breakdown[row.key]), currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "negative";
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] text-muted-foreground mb-0.5">{label}</div>
      <div
        className={`text-xs font-semibold tabular-nums leading-tight whitespace-nowrap ${
          accent === "negative" ? "text-destructive" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Breakdown Tab ───────────────────────────────────────────────────────────

type ViewMode = "monthly" | "yearly" | "total";

function BreakdownTab({
  sorted,
  activeRows,
  currency,
}: {
  sorted: CarResult[];
  activeRows: typeof BREAKDOWN_ROWS;
  currency: Currency;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");
  const isMulti = sorted.length > 1;

  function scale(totalVal: number, r: CarResult): number {
    const months = r.ownershipMonths;
    const years = months / 12;
    if (viewMode === "total") return totalVal;
    if (viewMode === "yearly") return totalVal / Math.max(1, years);
    return totalVal / Math.max(1, months);
  }

  const VIEW_MODES: { key: ViewMode; label: string }[] = [
    { key: "monthly", label: "Monthly" },
    { key: "yearly", label: "Yearly" },
    { key: "total", label: "Total" },
  ];

  return (
    <div className="space-y-4">
      {/* View-mode toggle */}
      <div className="flex rounded-lg bg-secondary/60 p-0.5 gap-0.5">
        {VIEW_MODES.map((m) => {
          const active = viewMode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setViewMode(m.key)}
              className={[
                "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 select-none",
                active
                  ? "bg-card text-foreground shadow-sm border border-border/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50",
              ].join(" ")}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Category table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs min-w-[260px]">
          <thead>
            <tr className="border-b border-border/60">
              <th className="text-left pb-2 pr-3 text-muted-foreground font-medium w-28">
                Category
              </th>
              {sorted.map((r) => (
                <th key={r.id} className="pb-2 px-2 text-right font-semibold text-foreground">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="truncate max-w-[90px] block">{r.name}</span>
                    <span className="font-normal text-muted-foreground text-[10px]">
                      {FINANCING_LABELS[r.financingMode]}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeRows.map((row) => {
              const scaledValues = sorted.map((r) => {
                const total = r.breakdown[row.key];
                return total > 0 ? Math.round(scale(total, r)) : 0;
              });
              const nonZero = scaledValues.filter((v) => v > 0);
              const minVal = nonZero.length > 0 ? Math.min(...nonZero) : -1;

              return (
                <tr key={row.key} className="border-b border-border/40 last:border-0">
                  <td className="py-2.5 pr-3 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: row.color }}
                      />
                      {row.label}
                    </div>
                  </td>
                  {scaledValues.map((val, i) => {
                    const isBest = isMulti && val > 0 && val === minVal;
                    return (
                      <td
                        key={sorted[i].id}
                        className={[
                          "py-2.5 px-2 text-right tabular-nums font-medium",
                          val === 0
                            ? "text-muted-foreground/35"
                            : isBest
                            ? "text-highlight font-semibold"
                            : "text-foreground",
                        ].join(" ")}
                      >
                        {val === 0 ? "—" : formatCurrency(val, currency)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Permanent summary footer */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div
          className="grid border-b border-border/50 bg-secondary/30"
          style={{ gridTemplateColumns: `1fr repeat(${sorted.length}, minmax(0,1fr))` }}
        >
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Summary
          </div>
          {sorted.map((r) => (
            <div
              key={r.id}
              className="px-2 py-2 text-right text-[10px] font-semibold text-muted-foreground truncate"
            >
              {r.name.length > 12 ? r.name.slice(0, 10) + "…" : r.name}
            </div>
          ))}
        </div>

        {([
          { key: "monthly" as ViewMode, label: "Per month", getValue: (r: CarResult) => r.monthlyCost },
          { key: "yearly" as ViewMode, label: "Per year", getValue: (r: CarResult) => r.yearlyCost },
          { key: "total" as ViewMode, label: "Total", getValue: (r: CarResult) => r.totalOwnershipCost },
        ]).map(({ key, label, getValue }) => {
          const isActive = viewMode === key;
          return (
            <div
              key={key}
              className={[
                "grid border-b border-border/40 last:border-0 transition-colors",
                isActive ? "bg-highlight/6" : "bg-transparent",
              ].join(" ")}
              style={{ gridTemplateColumns: `1fr repeat(${sorted.length}, minmax(0,1fr))` }}
            >
              <div
                className={[
                  "px-3 py-2.5 text-xs",
                  isActive ? "font-semibold text-foreground" : "font-medium text-muted-foreground",
                ].join(" ")}
              >
                <div className="flex items-center gap-1.5">
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-highlight shrink-0" />}
                  {label}
                </div>
              </div>
              {sorted.map((r) => (
                <div
                  key={r.id}
                  className={[
                    "px-2 py-2.5 text-right tabular-nums text-xs",
                    isActive ? "font-bold text-foreground" : "font-medium text-muted-foreground",
                  ].join(" ")}
                >
                  {formatCurrency(getValue(r), currency)}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {isMulti && (
        <p className="text-[10px] text-muted-foreground text-center">
          Green = lowest in category
        </p>
      )}
    </div>
  );
}

// ─── Chart Tab ───────────────────────────────────────────────────────────────

type ChartViewMode = "monthly" | "total";

// Custom YAxis tick that renders a brand logo + truncated name
function CarYAxisTick({
  x, y, payload, carMap,
}: {
  x?: number; y?: number; payload?: { value: string };
  carMap: Map<string, { car: CarResult; label: string }>;
}) {
  if (!payload || x === undefined || y === undefined) return null;
  const meta = carMap.get(payload.value);
  const logo = meta?.car.brand ? getBrandLogo(meta.car.brand) : null;
  const label = meta?.label ?? "Unnamed car";

  return (
    <foreignObject x={x - 156} y={y - 12} width={152} height={24}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          justifyContent: "flex-end",
          height: "24px",
          overflow: "hidden",
        }}
      >
        {logo && (
          <img
            src={logo}
            alt=""
            style={{ width: 16, height: 16, objectFit: "contain", flexShrink: 0 }}
          />
        )}
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "hsl(220,10%,42%)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: logo ? 126 : 144,
          }}
        >
          {label}
        </span>
      </div>
    </foreignObject>
  );
}
// Summary bar row with optional brand logo
function MetricBar({
  car,
  label,
  value,
  maxValue,
  isWinner,
  currency,
  suffix = "",
}: {
  car: CarResult;
  label: string;
  value: number;
  maxValue: number;
  isWinner: boolean;
  currency: Currency;
  suffix?: string;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const logo = car.brand ? getBrandLogo(car.brand) : null;

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-0.5 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {logo && (
            <img src={logo} alt="" className="w-3.5 h-3.5 object-contain shrink-0 opacity-80" />
          )}
          <span className={`truncate ${isWinner ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
            {label}
          </span>
          {isWinner && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-highlight bg-highlight/10 px-1.5 py-0.5 rounded-full">
              Best
            </span>
          )}
        </div>
        <span className={`font-semibold tabular-nums shrink-0 ${isWinner ? "text-highlight" : "text-foreground"}`}>
          {formatCurrency(value, currency)}{suffix}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: isWinner ? CHART_COLORS.cheapest : CHART_COLORS.normal }}
        />
      </div>
    </div>
  );
}

function ChartTab({
  sorted,
  activeRows,
  currency,
}: {
  sorted: CarResult[];
  activeRows: typeof BREAKDOWN_ROWS;
  currency: Currency;
}) {
  const chartCars = useMemo(
    () =>
      sorted.map((car, index) => ({
        ...car,
        entryKey: `${car.id}::${index}`,
        displayName: (car.name || "Unnamed car").trim() || "Unnamed car",
      })),
    [sorted]
  );

  const winner = chartCars[0];
  const isMulti = sorted.length > 1;
  const [chartMode, setChartMode] = useState<ChartViewMode>("monthly");
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [selectedEntryKeys, setSelectedEntryKeys] = useState<Set<string>>(
    () => new Set(chartCars.map((car) => car.entryKey))
  );

  useEffect(() => {
    setSelectedEntryKeys((prev) => {
      const next = new Set<string>();

      chartCars.forEach((car) => {
        if (prev.has(car.entryKey)) next.add(car.entryKey);
      });

      chartCars.forEach((car) => {
        if (!prev.has(car.entryKey)) next.add(car.entryKey);
      });

      if (next.size === 0 && chartCars[0]) next.add(chartCars[0].entryKey);
      return next;
    });
  }, [chartCars]);

  const toggleEntry = (entryKey: string) => {
    setSelectedEntryKeys((prev) => {
      const next = new Set(prev);
      if (next.has(entryKey)) {
        if (next.size === 1) return prev;
        next.delete(entryKey);
      } else {
        next.add(entryKey);
      }
      return next;
    });
  };

  // Graph uses slicer-selected cars.
  const visibleCars = chartCars.filter((car) => selectedEntryKeys.has(car.entryKey));
  const allCarsSelected = chartCars.length > 0 && selectedEntryKeys.size === chartCars.length;
  // Summary follows slicer selection:
  // - collapsed: best among currently visible cars
  // - expanded: all currently visible cars
  const summaryLeadCar = visibleCars[0] ?? winner;
  const summaryCars = isSummaryExpanded ? visibleCars : summaryLeadCar ? [summaryLeadCar] : [];

  // Legend: only rows with data in currently visible cars
  const visibleStackableRows = activeRows.filter((row) =>
    visibleCars.some((r) => (r.breakdown[row.key] ?? 0) > 0)
  );

  const scaleValue = (totalVal: number, r: CarResult) => {
    if (chartMode === "total") return totalVal;
    return totalVal / Math.max(1, r.ownershipMonths);
  };

  // Map unique row key → car metadata for stable Y-axis labels.
  const carByEntryKey = new Map<string, { car: CarResult; label: string }>();
  const chartData = visibleCars.map((r) => {
    const label = r.displayName.length > 24 ? r.displayName.slice(0, 22) + "…" : r.displayName;
    carByEntryKey.set(r.entryKey, { car: r, label });
    const entry: Record<string, number | string> = { entryKey: r.entryKey };
    visibleStackableRows.forEach((row) => {
      const raw = r.breakdown[row.key] ?? 0;
      entry[row.key] = raw > 0 ? Number(scaleValue(raw, r)) : 0;
    });
    return entry;
  });

  const chartHeight = Math.max(visibleCars.length * 52, 56);

  // Summary uses max across all sorted cars (not just visible) so bars stay proportional
  const maxMonthlyAll = Math.max(...sorted.map((r) => r.monthlyCost), 1);
  const maxPerKmAll = Math.max(...sorted.map((r) => r.costPerKm), 1);
  const maxTotalAll = Math.max(...sorted.map((r) => r.totalOwnershipCost), 1);

  return (
    <div className="space-y-3.5">

      {/* ── Mode toggle ── */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-foreground">Cost composition</p>
        <div className="flex rounded-lg bg-secondary/60 p-0.5 gap-0.5">
          {([
            { key: "monthly" as ChartViewMode, label: "Monthly" },
            { key: "total" as ChartViewMode, label: "Total" },
          ]).map((m) => {
            const active = chartMode === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setChartMode(m.key)}
                className={[
                  "min-w-[76px] px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150",
                  active
                    ? "bg-card text-foreground shadow-sm border border-border/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50",
                ].join(" ")}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Graph slicer chips ── */}
      {isMulti && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedEntryKeys(new Set(chartCars.map((car) => car.entryKey)))}
            disabled={allCarsSelected}
            className={[
              "px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors",
              allCarsSelected
                ? "bg-secondary/60 text-muted-foreground border-border/50 cursor-not-allowed"
                : "bg-card text-foreground border-border/70 hover:border-border hover:bg-secondary/40",
            ].join(" ")}
          >
            {allCarsSelected ? "All cars shown" : "Show all cars"}
          </button>

          {chartCars.map((car) => {
            const isSelected = selectedEntryKeys.has(car.entryKey);
            const isWinnerCar = winner?.entryKey === car.entryKey;
            const logo = car.brand ? getBrandLogo(car.brand) : null;
            return (
              <button
                key={car.entryKey}
                type="button"
                onClick={() => toggleEntry(car.entryKey)}
                className={[
                  "flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-150 select-none",
                  isSelected
                    ? isWinnerCar
                      ? "bg-highlight/15 text-highlight border border-highlight/30"
                      : "bg-foreground/8 text-foreground border border-foreground/20 hover:border-foreground/40"
                    : "bg-transparent text-muted-foreground border border-border/40 hover:text-foreground hover:border-border/70 opacity-60 hover:opacity-90",
                ].join(" ")}
              >
                {logo
                  ? <img src={logo} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />
                  : <span className="w-3.5 h-3.5 rounded-full bg-muted flex items-center justify-center text-[7px] font-bold text-muted-foreground shrink-0">{car.brand?.slice(0, 1) ?? "?"}</span>
                }
                <span className="truncate max-w-[120px]">{car.displayName}</span>
                {isWinnerCar && <span className="ml-0.5 text-highlight text-[9px]">★</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Compact legend — only active categories in visible cars ── */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {visibleStackableRows.map((row) => (
          <div key={row.key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: row.color }} />
            {row.label}
          </div>
        ))}
      </div>

      {/* ── Stacked bar chart ── */}
      <div className="rounded-xl border border-border/60 bg-background/50 px-2 pt-3 pb-2">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 2, right: 12, left: 4, bottom: 2 }}
            barCategoryGap={12}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="entryKey"
              width={160}
              tick={(props) => <CarYAxisTick {...props} carMap={carByEntryKey} />}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "hsl(220,10%,96%)" }}
              contentStyle={{
                background: "white",
                border: "1px solid hsl(220,13%,90%)",
                borderRadius: "10px",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.07)",
              }}
              formatter={(value: number, name: string) => {
                const row = BREAKDOWN_ROWS.find((r) => r.key === name);
                return [formatCurrency(value, currency), row?.label ?? name];
              }}
            />
            {visibleStackableRows.map((row) => (
              <Bar
                key={row.key}
                dataKey={row.key}
                stackId="cost"
                fill={row.color}
                radius={
                  row.key === visibleStackableRows[visibleStackableRows.length - 1]?.key
                    ? [0, 5, 5, 0]
                    : [0, 0, 0, 0]
                }
                barSize={20}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Summary ── */}
      {isMulti && summaryLeadCar && (
        <div className="space-y-2.5 border-t border-border/40 pt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Summary
            </p>
            <button
              type="button"
              onClick={() => setIsSummaryExpanded((v) => !v)}
              disabled={visibleCars.length <= 1}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              {visibleCars.length <= 1
                ? "Only one selected"
                : isSummaryExpanded
                ? "Winner only ▴"
                : "Show all cars ▾"}
            </button>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground font-medium">Monthly</p>
            <div className="space-y-1.5">
              {summaryCars.map((r) => (
                <MetricBar
                  key={`monthly-${r.entryKey}`}
                  car={r}
                  label={r.displayName}
                  value={r.monthlyCost}
                  maxValue={maxMonthlyAll}
                  isWinner={r.entryKey === winner?.entryKey}
                  currency={currency}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground font-medium">Per km</p>
            <div className="space-y-1.5">
              {summaryCars.map((r) => (
                <MetricBar
                  key={`perkm-${r.entryKey}`}
                  car={r}
                  label={r.displayName}
                  value={r.costPerKm}
                  maxValue={maxPerKmAll}
                  isWinner={r.entryKey === winner?.entryKey}
                  currency={currency}
                  suffix="/km"
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground font-medium">Total</p>
            <div className="space-y-1.5">
              {summaryCars.map((r) => (
                <MetricBar
                  key={`total-${r.entryKey}`}
                  car={r}
                  label={r.displayName}
                  value={r.totalOwnershipCost}
                  maxValue={maxTotalAll}
                  isWinner={r.entryKey === winner?.entryKey}
                  currency={currency}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
