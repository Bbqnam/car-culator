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

function SingleCarChart({
  car,
  stackableRows,
  scaleValue,
  currency,
  isWinner,
}: {
  car: CarResult;
  stackableRows: typeof BREAKDOWN_ROWS;
  scaleValue: (val: number, r: CarResult) => number;
  currency: Currency;
  isWinner: boolean;
}) {
  const chartData = [{
    id: car.id,
    name: car.name.length > 18 ? car.name.slice(0, 16) + "…" : car.name,
    fullName: car.name,
    ...Object.fromEntries(
      stackableRows.map((row) => {
        const raw = (car.breakdown as any)?.[row.key] ?? 0;
        return [row.key, raw > 0 ? Number(scaleValue(raw, car)) : 0];
      })
    ),
  }];

  return (
    <div className={`rounded-xl border p-3 ${isWinner ? "border-highlight/30 bg-highlight/4" : "border-border/50 bg-background/40"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground truncate max-w-[70%]">{car.name}</span>
        <span className={`text-xs font-bold tabular-nums ${isWinner ? "text-highlight" : "text-foreground"}`}>
          {formatCurrency(car.monthlyCost, currency)}/mo
        </span>
      </div>
      <ResponsiveContainer width="100%" height={40}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 4, left: 0, bottom: 0 }}
          barCategoryGap={0}
        >
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" hide width={0} />
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
          {stackableRows.map((row) => (
            <Bar
              key={row.key}
              dataKey={row.key}
              stackId="cost"
              fill={row.color}
              radius={row.key === stackableRows[stackableRows.length - 1]?.key ? [0, 6, 6, 0] : [0, 0, 0, 0]}
              barSize={22}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ComparisonBar({
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
  cheapestMonthly,
  currency,
}: {
  sorted: CarResult[];
  activeRows: typeof BREAKDOWN_ROWS;
  cheapestMonthly: number;
  maxMonthly: number;
  currency: Currency;
}) {
  const [chartMode, setChartMode] = useState<ChartViewMode>("monthly");
  const [othersExpanded, setOthersExpanded] = useState(false);
  const [compareId, setCompareId] = useState<string | null>(
    sorted.length > 1 ? sorted[1].id : null
  );
  const isMulti = sorted.length > 1;

  const winner = sorted[0];
  const others = sorted.slice(1);

  // Keep compareId valid when sorted changes
  const compareCarId = compareId && sorted.find((r) => r.id === compareId) ? compareId : (others[0]?.id ?? null);
  const compareCar = compareCarId ? sorted.find((r) => r.id === compareCarId) ?? null : null;

  // Active stackable rows across the currently visible cars
  const visibleCars = compareCar ? [winner, compareCar] : [winner];
  const stackableRows = activeRows.filter((row) =>
    visibleCars.some((r) => ((r.breakdown as any)?.[row.key] ?? 0) > 0)
  );

  const scaleValue = (totalVal: number, r: CarResult) => {
    if (chartMode === "total") return totalVal;
    return totalVal / Math.max(1, r.ownershipMonths);
  };

  // Comparison metrics between winner and selected car
  const maxMonthly = Math.max(winner.monthlyCost, compareCar?.monthlyCost ?? 0);
  const maxPerKm = Math.max(winner.costPerKm, compareCar?.costPerKm ?? 0);
  const maxTotal = Math.max(winner.totalOwnershipCost, compareCar?.totalOwnershipCost ?? 0);

  const monthlyDiff = compareCar ? Math.abs(compareCar.monthlyCost - winner.monthlyCost) : 0;

  // Biggest differences between winner and selected compare car
  const largestDiffs = compareCar
    ? stackableRows
        .map((row) => {
          const wVal = scaleValue(Number((winner.breakdown as any)?.[row.key] ?? 0), winner);
          const cVal = scaleValue(Number((compareCar.breakdown as any)?.[row.key] ?? 0), compareCar);
          return { ...row, diff: cVal - wVal, wVal, cVal };
        })
        .filter((x) => Math.abs(x.diff) > 0.5)
        .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
        .slice(0, 3)
    : [];

  return (
    <div className="space-y-4">
      {/* Header row: mode toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
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
                  "min-w-[80px] px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150",
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

      {/* Compact legend — only rows used in visible cars */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {stackableRows.map((row) => (
          <div key={row.key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }} />
            {row.label}
          </div>
        ))}
      </div>

      {/* Winner — always shown */}
      <div>
        {isMulti && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-highlight">Best value</span>
            <span className="h-px flex-1 bg-highlight/20" />
          </div>
        )}
        <SingleCarChart
          car={winner}
          stackableRows={stackableRows}
          scaleValue={scaleValue}
          currency={currency}
          isWinner={isMulti}
        />
      </div>

      {/* Compare dropdown + chart (only when multiple cars) */}
      {isMulti && (
        <div>
          {/* Compare selector */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest shrink-0">Compare with</span>
            <span className="h-px flex-1 bg-border/60" />
            <select
              value={compareCarId ?? ""}
              onChange={(e) => setCompareId(e.target.value)}
              className="text-xs font-medium px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 border border-border/40 transition-colors max-w-[180px] truncate"
            >
              {others.map((car) => (
                <option key={car.id} value={car.id}>{car.name}</option>
              ))}
            </select>
          </div>

          {/* Compare car chart */}
          {compareCar && (
            <SingleCarChart
              car={compareCar}
              stackableRows={stackableRows}
              scaleValue={scaleValue}
              currency={currency}
              isWinner={false}
            />
          )}
        </div>
      )}

      {/* Show all cars toggle */}
      {others.length > 1 && (
        <div>
          <button
            type="button"
            onClick={() => setOthersExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full py-0.5"
          >
            <span className="h-px flex-1 bg-border/40" />
            <span className="font-medium whitespace-nowrap text-[11px]">
              {othersExpanded ? "Hide all cars ▲" : `Show all ${sorted.length} cars ▼`}
            </span>
            <span className="h-px flex-1 bg-border/40" />
          </button>

          {othersExpanded && (
            <div className="mt-2 space-y-2">
              {others
                .filter((car) => car.id !== compareCarId)
                .map((car) => (
                  <SingleCarChart
                    key={car.id}
                    car={car}
                    stackableRows={activeRows.filter((row) =>
                      sorted.some((r) => ((r.breakdown as any)?.[row.key] ?? 0) > 0)
                    )}
                    scaleValue={scaleValue}
                    currency={currency}
                    isWinner={false}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* Biggest differences (winner vs selected) */}
      {largestDiffs.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 space-y-1.5">
          <div className="text-xs font-semibold text-foreground">Biggest differences</div>
          <div className="space-y-1.5">
            {largestDiffs.map((item) => {
              const diffText =
                item.diff > 0
                  ? `${compareCar!.name} spends ${formatCurrency(item.diff, currency)} more on ${item.label.toLowerCase()}`
                  : `${winner.name} spends ${formatCurrency(Math.abs(item.diff), currency)} more on ${item.label.toLowerCase()}`;
              return (
                <div key={item.key} className="flex items-start gap-2 text-[11px]">
                  <span className="w-2 h-2 rounded-full mt-0.5 shrink-0" style={{ background: item.color }} />
                  <span className="text-muted-foreground">{diffText}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Focused comparison bars: winner vs selected only ── */}
      <div className="space-y-3 pt-0.5">
        {/* Monthly */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">Monthly</p>
            {compareCar && (
              <span className="text-[11px] text-muted-foreground">
                Δ <span className="font-semibold text-highlight">{formatCurrency(monthlyDiff, currency)}/mo</span>
              </span>
            )}
          </div>
          <ComparisonBar label={winner.name} value={winner.monthlyCost} maxValue={maxMonthly} isWinner={true} currency={currency} />
          {compareCar && (
            <ComparisonBar label={compareCar.name} value={compareCar.monthlyCost} maxValue={maxMonthly} isWinner={false} currency={currency} />
          )}
        </div>

        {/* Per km */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Per km</p>
          <ComparisonBar label={winner.name} value={winner.costPerKm} maxValue={maxPerKm} isWinner={true} currency={currency} suffix="/km" />
          {compareCar && (
            <ComparisonBar label={compareCar.name} value={compareCar.costPerKm} maxValue={maxPerKm} isWinner={false} currency={currency} suffix="/km" />
          )}
        </div>

        {/* Total */}
        {isMulti && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">Total</p>
            <ComparisonBar label={winner.name} value={winner.totalOwnershipCost} maxValue={maxTotal} isWinner={true} currency={currency} />
            {compareCar && (
              <ComparisonBar label={compareCar.name} value={compareCar.totalOwnershipCost} maxValue={maxTotal} isWinner={false} currency={currency} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
