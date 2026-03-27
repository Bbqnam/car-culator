import { useState } from "react";
import { CarResult, Currency, formatCurrency, generateVerdict } from "@/lib/car-types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BrandLogo } from "@/components/BrandLogo";
import { FuelBadge } from "@/components/FuelBadge";

interface ResultsPanelProps {
  results: CarResult[];
  currency: Currency;
}

type Tab = "overview" | "breakdown" | "chart";

const FINANCING_LABELS: Record<string, string> = {
  cash: "Cash",
  loan: "Loan",
  leasing: "Lease",
};

const BREAKDOWN_ROWS: { key: string; label: string; color: string }[] = [
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
  const cheapestMonthly = sorted[0]?.monthlyCost ?? 0;
  const maxMonthly = sorted[sorted.length - 1]?.monthlyCost ?? 0;

  const activeRows = BREAKDOWN_ROWS.filter((r) =>
    sorted.some((car) => ((car.breakdown as any)?.[r.key] ?? 0) > 0)
  );

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-border/60 bg-secondary/30">
        {(["overview", "breakdown", "chart"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-widest transition-colors ${
              tab === t
                ? "text-foreground border-b-2 border-foreground -mb-px bg-card"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-5">
        {tab === "overview" && (
          <OverviewTab
            sorted={sorted}
            cheapestMonthly={cheapestMonthly}
            currency={currency}
            results={results}
          />
        )}
        {tab === "breakdown" && (
          <BreakdownTab sorted={sorted} activeRows={activeRows} currency={currency} />
        )}
        {tab === "chart" && (
          <ChartTab
            sorted={sorted}
            activeRows={activeRows}
            cheapestMonthly={cheapestMonthly}
            maxMonthly={maxMonthly}
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
  cheapestMonthly,
  currency,
  results,
}: {
  sorted: (CarResult & { verdict: string })[];
  cheapestMonthly: number;
  currency: Currency;
  results: CarResult[];
}) {
  return (
    <div className="space-y-3">
      {sorted.map((result, idx) => {
        const isCheapest = idx === 0 && results.length > 1;
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
            {/* Top row: identity + monthly cost */}
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

              {/* Monthly cost — the hero number */}
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold tracking-tight tabular-nums">
                  {formatCurrency(result.monthlyCost, currency)}
                </div>
                <div className="text-[11px] text-muted-foreground">per month</div>
              </div>
            </div>

            {/* Secondary stats row */}
            <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-4 gap-2">
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
                label={diff > 0 && results.length > 1 ? "vs cheapest" : "Residual"}
                value={
                  diff > 0 && results.length > 1
                    ? `+${formatCurrency(diff, currency)}/mo`
                    : result.residualValuePercent > 0
                    ? `${result.residualValuePercent}%`
                    : "—"
                }
                accent={diff > 0 && results.length > 1 ? "negative" : undefined}
              />
            </div>

            {/* Verdict */}
            {result.verdict && (
              <p className="mt-2 text-[11px] text-muted-foreground italic">
                💡 {result.verdict}
              </p>
            )}
          </div>
        );
      })}

      {sorted.length > 1 && (
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
    <div>
      <div className="text-[10px] text-muted-foreground mb-0.5">{label}</div>
      <div
        className={`text-xs font-semibold tabular-nums ${
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
                const total = (r.breakdown as any)[row.key] as number;
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

function MetricBar({
  label,
  value,
  maxValue,
  isWinner,
  currency,
  suffix = "",
}: {
  label: string;
  value: number;
  maxValue: number;
  isWinner: boolean;
  currency: Currency;
  suffix?: string;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-muted-foreground truncate max-w-[60%]">{label}</span>
        <span className={`font-semibold tabular-nums ${isWinner ? "text-highlight" : "text-foreground"}`}>
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
  cheapestMonthly: number;
  maxMonthly: number;
  currency: Currency;
}) {
  const winner = sorted[0];
  const isMulti = sorted.length > 1;

  // Slicer state: set of visible car IDs in the main graph. Winner always included.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set([winner.id]));
  const [chartMode, setChartMode] = useState<ChartViewMode>("monthly");
  const [lowerExpanded, setLowerExpanded] = useState(false);

  // Keep winner always selected; toggle others
  const toggleCar = (id: string) => {
    if (id === winner.id) return; // winner is pinned
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Cars visible in the main graph, in sorted order, max 4
  const visibleCars = sorted.filter((r) => selectedIds.has(r.id)).slice(0, 4);

  // Only show legend rows used by currently visible cars
  const visibleStackableRows = activeRows.filter((row) =>
    visibleCars.some((r) => ((r.breakdown as any)?.[row.key] ?? 0) > 0)
  );

  const scaleValue = (totalVal: number, r: CarResult) => {
    if (chartMode === "total") return totalVal;
    return totalVal / Math.max(1, r.ownershipMonths);
  };

  // Build recharts data: one entry per visible car
  const chartData = visibleCars.map((r) => {
    const entry: Record<string, number | string> = {
      name: r.name.length > 16 ? r.name.slice(0, 14) + "…" : r.name,
    };
    visibleStackableRows.forEach((row) => {
      const raw = (r.breakdown as any)?.[row.key] ?? 0;
      entry[row.key] = raw > 0 ? Number(scaleValue(raw, r)) : 0;
    });
    return entry;
  });

  const chartHeight = Math.max(visibleCars.length * 52, 60);

  // Lower sections: all-cars max for proportional bars
  const maxMonthlyAll = Math.max(...sorted.map((r) => r.monthlyCost), 1);
  const maxPerKmAll = Math.max(...sorted.map((r) => r.costPerKm), 1);
  const maxTotalAll = Math.max(...sorted.map((r) => r.totalOwnershipCost), 1);

  const lowerCars = lowerExpanded ? sorted : [winner];

  return (
    <div className="space-y-4">

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

      {/* ── Slicer chips (only when multiple cars) ── */}
      {isMulti && (
        <div className="flex flex-wrap gap-1.5">
          {sorted.map((car) => {
            const isSelected = selectedIds.has(car.id);
            const isWinnerCar = car.id === winner.id;
            return (
              <button
                key={car.id}
                type="button"
                onClick={() => toggleCar(car.id)}
                className={[
                  "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-150 select-none",
                  isSelected
                    ? isWinnerCar
                      ? "bg-highlight text-white ring-1 ring-highlight/50 cursor-default"
                      : "bg-foreground text-background ring-1 ring-foreground/20"
                    : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border/40",
                ].join(" ")}
              >
                {car.name.length > 18 ? car.name.slice(0, 16) + "…" : car.name}
                {isWinnerCar && (
                  <span className="ml-1 opacity-70 text-[9px] uppercase tracking-wider">★</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Compact legend ── */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {visibleStackableRows.map((row) => (
          <div key={row.key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: row.color }} />
            {row.label}
          </div>
        ))}
      </div>

      {/* ── Single stacked bar chart ── */}
      <div className="rounded-xl border border-border/60 bg-background/50 px-3 pt-3 pb-2">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
            barCategoryGap={14}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 11, fill: "hsl(220,8%,50%)" }}
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

      {/* ── Lower metric sections: winner only by default, expand to reveal all ── */}
      <div className="space-y-3 pt-0.5">

        {/* Section header with expand toggle */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Summary
          </p>
          {isMulti && (
            <button
              type="button"
              onClick={() => setLowerExpanded((v) => !v)}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {lowerExpanded ? "Show less ▲" : `Show all ${sorted.length} cars ▼`}
            </button>
          )}
        </div>

        {/* Monthly */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">Monthly</p>
            {isMulti && !lowerExpanded && (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                <span className="font-semibold text-highlight">{formatCurrency(winner.monthlyCost, currency)}</span>
                <span className="text-muted-foreground/60"> / best</span>
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            {lowerCars.map((r, i) => (
              <MetricBar
                key={r.id}
                label={r.name}
                value={r.monthlyCost}
                maxValue={maxMonthlyAll}
                isWinner={i === 0}
                currency={currency}
              />
            ))}
          </div>
        </div>

        {/* Per km */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Per km</p>
          <div className="space-y-1.5">
            {lowerCars.map((r, i) => (
              <MetricBar
                key={r.id}
                label={r.name}
                value={r.costPerKm}
                maxValue={maxPerKmAll}
                isWinner={i === 0}
                currency={currency}
                suffix="/km"
              />
            ))}
          </div>
        </div>

        {/* Total */}
        {isMulti && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">Total</p>
            <div className="space-y-1.5">
              {lowerCars.map((r, i) => (
                <MetricBar
                  key={r.id}
                  label={r.name}
                  value={r.totalOwnershipCost}
                  maxValue={maxTotalAll}
                  isWinner={i === 0}
                  currency={currency}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
