import { CarResult, Currency, formatCurrency, generateVerdict } from "@/lib/car-types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, LabelList,
} from "recharts";
import { BrandLogo } from "@/components/BrandLogo";
import { FuelBadge } from "@/components/FuelBadge";

interface ResultsPanelProps {
  results: CarResult[];
  currency: Currency;
}

const CHART_COLORS = {
  cheapest: "hsl(152, 45%, 48%)",
  normal: "hsl(220, 8%, 75%)",
};

const BREAKDOWN_COLORS: Record<string, string> = {
  depreciation: "hsl(220, 14%, 40%)",
  fuel: "hsl(38, 80%, 50%)",
  insurance: "hsl(215, 55%, 55%)",
  tax: "hsl(280, 40%, 55%)",
  service: "hsl(152, 45%, 48%)",
  financingCost: "hsl(0, 65%, 55%)",
  leaseCost: "hsl(200, 60%, 50%)",
  downPayment: "hsl(30, 50%, 55%)",
  endOfTermFee: "hsl(340, 40%, 55%)",
  mileagePenalty: "hsl(15, 70%, 55%)",
};

const CATEGORY_LABELS: Record<string, string> = {
  depreciation: "Depreciation",
  fuel: "Fuel / Energy",
  insurance: "Insurance",
  tax: "Tax",
  service: "Service",
  financingCost: "Financing cost",
  leaseCost: "Lease payments",
  downPayment: "Down payment",
  endOfTermFee: "End-of-term fee",
  mileagePenalty: "Mileage penalty",
};

const FINANCING_LABELS: Record<string, string> = {
  cash: "Cash purchase",
  loan: "Loan / Financing",
  leasing: "Leasing",
};

const STAT_COLORS: Record<string, string> = {
  Yearly: "text-primary",
  Total: "text-primary",
  Depreciation: "text-[hsl(220,14%,40%)]",
  Fuel: "text-[hsl(38,80%,50%)]",
  Insurance: "text-[hsl(215,55%,55%)]",
  Tax: "text-[hsl(280,40%,55%)]",
  Service: "text-[hsl(152,45%,48%)]",
  Financing: "text-[hsl(0,65%,55%)]",
  Lease: "text-[hsl(200,60%,50%)]",
  Residual: "text-accent",
};

export function ResultsPanel({ results, currency }: ResultsPanelProps) {
  if (results.length === 0) return null;

  // Add verdicts
  const resultsWithVerdicts = results.map((r) => ({
    ...r,
    verdict: generateVerdict(r, results),
  }));

  // Sort by monthly cost
  const sorted = [...resultsWithVerdicts].sort((a, b) => a.monthlyCost - b.monthlyCost);
  const cheapestMonthly = sorted[0]?.monthlyCost ?? 0;
  const maxMonthly = sorted[sorted.length - 1]?.monthlyCost ?? 0;

  const chartData = sorted.map((r) => ({
    name: r.name.length > 14 ? r.name.slice(0, 12) + "…" : r.name,
    fullName: r.name,
    monthly: r.monthlyCost,
    isCheapest: r.monthlyCost === cheapestMonthly && results.length > 1,
  }));

  // Active breakdown categories (non-zero across all results)
  const breakdownKeys = ["depreciation", "fuel", "insurance", "tax", "service", "financingCost", "leaseCost", "downPayment", "endOfTermFee", "mileagePenalty"] as const;
  const activeKeys = breakdownKeys.filter((k) => sorted.some((r) => (r.breakdown as any)[k] > 0));

  const breakdownData = sorted.map((r) => {
    const d: any = { name: r.name.length > 14 ? r.name.slice(0, 12) + "…" : r.name };
    activeKeys.forEach((k) => { d[k] = (r.breakdown as any)[k]; });
    return d;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold tracking-tight">Comparison</h2>

      {/* Summary cards - sorted cheapest first */}
      <div className="grid gap-3">
        {sorted.map((result, idx) => {
          const isCheapest = idx === 0 && results.length > 1;
          const diff = result.monthlyCost - cheapestMonthly;
          const barWidth = maxMonthly > 0 ? (result.monthlyCost / maxMonthly) * 100 : 0;

          return (
            <div key={result.id}
              className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                isCheapest ? "bg-highlight-soft border-highlight/30 ring-1 ring-highlight/20" : "bg-card border-border/60"
              }`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    {result.brand && <BrandLogo brand={result.brand} size="md" />}
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base">{result.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {result.fuelType && <FuelBadge fuelType={result.fuelType} />}
                        <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                          {FINANCING_LABELS[result.financingMode]}
                        </span>
                        {isCheapest && (
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-highlight bg-highlight/10 px-2 py-0.5 rounded-full">
                            Cheapest
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-bold tracking-tight">
                    {formatCurrency(result.monthlyCost, currency)}
                  </div>
                  <div className="text-xs text-muted-foreground">per month</div>
                  {diff > 0 && results.length > 1 && (
                    <div className="text-xs text-destructive mt-0.5">
                      +{formatCurrency(diff, currency)}/mo
                    </div>
                  )}
                </div>
              </div>

              <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-all duration-500 ${
                  isCheapest ? "bg-highlight" : "bg-muted-foreground/30"
                }`} style={{ width: `${barWidth}%` }} />
              </div>

              {/* Verdict */}
              {result.verdict && (
                <p className="text-xs font-medium text-muted-foreground mb-3 italic">
                  💡 {result.verdict}
                </p>
              )}

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <Stat label="Yearly" value={formatCurrency(result.yearlyCost, currency)} />
                <Stat label="Total" value={formatCurrency(result.totalOwnershipCost, currency)} />
                {result.breakdown.depreciation > 0 && <Stat label="Depreciation" value={formatCurrency(result.breakdown.depreciation, currency)} />}
                <Stat label="Fuel" value={formatCurrency(result.breakdown.fuel, currency)} />
                <Stat label="Insurance" value={formatCurrency(result.breakdown.insurance, currency)} />
                <Stat label="Tax" value={formatCurrency(result.breakdown.tax, currency)} />
                <Stat label="Service" value={formatCurrency(result.breakdown.service, currency)} />
                {result.breakdown.financingCost > 0 && <Stat label="Financing" value={formatCurrency(result.breakdown.financingCost, currency)} />}
                {result.breakdown.leaseCost > 0 && <Stat label="Lease" value={formatCurrency(result.breakdown.leaseCost, currency)} />}
                {result.breakdown.downPayment > 0 && <Stat label="Down payment" value={formatCurrency(result.breakdown.downPayment, currency)} />}
                {result.breakdown.mileagePenalty > 0 && <Stat label="Mileage penalty" value={formatCurrency(result.breakdown.mileagePenalty, currency)} />}
                {result.residualValuePercent > 0 && <Stat label="Residual" value={`${result.residualValuePercent}%`} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly cost chart */}
      {results.length >= 2 && (
        <div className="rounded-2xl bg-card border border-border/60 p-4 sm:p-5">
          <p className="text-xs text-muted-foreground mb-3">Monthly cost comparison</p>
          <ResponsiveContainer width="100%" height={sorted.length * 52 + 16}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 60, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={90}
                tick={{ fontSize: 11, fill: "hsl(220, 8%, 55%)" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "hsl(220, 10%, 94%, 0.5)" }}
                contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(220,13%,90%)", borderRadius: "12px", fontSize: "13px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                formatter={(value: number) => [formatCurrency(value, currency), "Monthly"]} />
              <Bar dataKey="monthly" radius={[0, 6, 6, 0]} barSize={28}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.isCheapest ? CHART_COLORS.cheapest : CHART_COLORS.normal} />
                ))}
                <LabelList dataKey="monthly" position="right"
                  formatter={(v: number) => formatCurrency(v, currency)}
                  style={{ fontSize: 11, fill: "hsl(220, 8%, 45%)" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cost breakdown stacked chart */}
      {activeKeys.length > 0 && (
        <div className="rounded-2xl bg-card border border-border/60 p-4 sm:p-5">
          <p className="text-xs text-muted-foreground mb-3">Cost breakdown (total)</p>
          <ResponsiveContainer width="100%" height={sorted.length * 52 + 48}>
            <BarChart data={breakdownData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={90}
                tick={{ fontSize: 11, fill: "hsl(220, 8%, 55%)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(220,13%,90%)", borderRadius: "12px", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                formatter={(value: number, name: string) => [formatCurrency(value, currency), CATEGORY_LABELS[name] || name]} />
              <Legend iconType="circle" iconSize={8}
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                formatter={(value) => CATEGORY_LABELS[value] || value} />
              {activeKeys.map((key, i) => (
                <Bar key={key} dataKey={key} stackId="a"
                  fill={BREAKDOWN_COLORS[key]}
                  radius={i === activeKeys.length - 1 ? [0, 6, 6, 0] : undefined}
                  barSize={24} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {results.length > 1 && (
        <div className="text-center text-sm text-muted-foreground">
          You save{" "}
          <span className="font-semibold text-highlight">
            {formatCurrency(maxMonthly - cheapestMonthly, currency)}/mo
          </span>{" "}
          by choosing the cheapest option.
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const colorClass = STAT_COLORS[label] || "text-foreground";
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-semibold ${colorClass}`}>{value}</div>
    </div>
  );
}
