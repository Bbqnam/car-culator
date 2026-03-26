import { useState } from "react";
import { CarResult, Currency, formatCurrency, generateVerdict } from "@/lib/car-types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
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
  { key: "depreciation", label: "Depreciation",   color: "hsl(220,14%,40%)" },
  { key: "financingCost", label: "Financing",      color: "hsl(0,65%,55%)" },
  { key: "leaseCost",     label: "Lease payments", color: "hsl(200,60%,50%)" },
  { key: "fuel",          label: "Fuel / Energy",  color: "hsl(38,80%,50%)" },
  { key: "insurance",     label: "Insurance",      color: "hsl(215,55%,55%)" },
  { key: "tax",           label: "Tax",            color: "hsl(280,40%,55%)" },
  { key: "service",       label: "Service",        color: "hsl(152,45%,48%)" },
  { key: "downPayment",   label: "Down payment",   color: "hsl(30,50%,55%)" },
  { key: "mileagePenalty",label: "Mileage penalty",color: "hsl(15,70%,55%)" },
  { key: "endOfTermFee",  label: "End-of-term fee",color: "hsl(340,40%,55%)" },
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

  // Active breakdown rows — only show rows that have a value in at least one car
  const activeRows = BREAKDOWN_ROWS.filter((r) =>
    sorted.some((car) => (car.breakdown as any)[r.key] > 0)
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
          <OverviewTab sorted={sorted} cheapestMonthly={cheapestMonthly} currency={currency} results={results} />
        )}
        {tab === "breakdown" && (
          <BreakdownTab sorted={sorted} activeRows={activeRows} currency={currency} />
        )}
        {tab === "chart" && (
          <ChartTab sorted={sorted} cheapestMonthly={cheapestMonthly} maxMonthly={maxMonthly} currency={currency} />
        )}
      </div>
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({
  sorted, cheapestMonthly, currency, results,
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
            <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-2">
              <MiniStat
                label="Total"
                value={formatCurrency(result.totalOwnershipCost, currency)}
              />
              <MiniStat
                label="Per year"
                value={formatCurrency(result.yearlyCost, currency)}
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
  label, value, accent,
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

function BreakdownTab({
  sorted, activeRows, currency,
}: {
  sorted: CarResult[];
  activeRows: typeof BREAKDOWN_ROWS;
  currency: Currency;
}) {
  const isMulti = sorted.length > 1;

  return (
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
            const values = sorted.map((r) => (r.breakdown as any)[row.key] as number);
            const minVal = Math.min(...values.filter((v) => v > 0));
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
                {sorted.map((r, i) => {
                  const val = (r.breakdown as any)[row.key] as number;
                  const isBest = isMulti && val > 0 && val === minVal;
                  return (
                    <td
                      key={r.id}
                      className={`py-2.5 px-2 text-right tabular-nums font-medium ${
                        val === 0
                          ? "text-muted-foreground/40"
                          : isBest
                          ? "text-highlight font-semibold"
                          : "text-foreground"
                      }`}
                    >
                      {val === 0 ? "—" : formatCurrency(val, currency)}
                    </td>
                  );
                })}
              </tr>
            );
          })}

          {/* Total row */}
          <tr className="border-t-2 border-border bg-secondary/20">
            <td className="py-2.5 pr-3 font-semibold text-foreground">Total cost</td>
            {sorted.map((r) => (
              <td key={r.id} className="py-2.5 px-2 text-right font-bold tabular-nums text-foreground">
                {formatCurrency(r.totalOwnershipCost, currency)}
              </td>
            ))}
          </tr>
          <tr className="bg-secondary/20">
            <td className="pb-2.5 pr-3 text-muted-foreground">Per month</td>
            {sorted.map((r) => (
              <td key={r.id} className="pb-2.5 px-2 text-right tabular-nums text-muted-foreground font-medium">
                {formatCurrency(r.monthlyCost, currency)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {sorted.length > 1 && (
        <p className="text-[10px] text-muted-foreground mt-3 text-center">
          Green = lowest in category
        </p>
      )}
    </div>
  );
}

// ─── Chart Tab ───────────────────────────────────────────────────────────────

function ChartTab({
  sorted, cheapestMonthly, maxMonthly, currency,
}: {
  sorted: CarResult[];
  cheapestMonthly: number;
  maxMonthly: number;
  currency: Currency;
}) {
  const chartData = sorted.map((r) => ({
    name: r.name.length > 16 ? r.name.slice(0, 14) + "…" : r.name,
    monthly: r.monthlyCost,
    isCheapest: r.monthlyCost === cheapestMonthly && sorted.length > 1,
  }));

  const barHeight = 40;
  const chartHeight = Math.max(sorted.length * (barHeight + 16) + 16, 80);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium">Monthly cost</p>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 0, right: 64, top: 4, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={96}
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
            formatter={(value: number) => [formatCurrency(value, currency), "Monthly"]}
          />
          <Bar dataKey="monthly" radius={[0, 6, 6, 0]} barSize={barHeight}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.isCheapest ? CHART_COLORS.cheapest : CHART_COLORS.normal}
              />
            ))}
            <LabelList
              dataKey="monthly"
              position="right"
              formatter={(v: number) => formatCurrency(v, currency)}
              style={{ fontSize: 11, fill: "hsl(220,8%,45%)", fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {sorted.length > 1 && (
        <div className="mt-4 pt-3 border-t border-border/50 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Total ownership cost</p>
          <div className="space-y-2">
            {sorted.map((r, i) => {
              const maxTotal = Math.max(...sorted.map((x) => x.totalOwnershipCost));
              const pct = maxTotal > 0 ? (r.totalOwnershipCost / maxTotal) * 100 : 0;
              const isCheapest = i === 0;
              return (
                <div key={r.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground truncate max-w-[60%]">{r.name}</span>
                    <span className={`font-semibold tabular-nums ${isCheapest ? "text-highlight" : "text-foreground"}`}>
                      {formatCurrency(r.totalOwnershipCost, currency)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: isCheapest ? CHART_COLORS.cheapest : CHART_COLORS.normal,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
