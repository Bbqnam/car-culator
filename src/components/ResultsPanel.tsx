import { CarResult, Currency, formatCurrency, FuelType } from "@/lib/car-types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";
import { BrandLogo } from "@/components/BrandLogo";
import { FuelBadge } from "@/components/FuelBadge";

interface ResultsPanelProps {
  results: (CarResult & { brand?: string; fuelType?: FuelType })[];
  currency: Currency;
}

const CHART_COLORS = {
  cheapest: "hsl(152, 45%, 48%)",
  normal: "hsl(220, 8%, 75%)",
};

const BREAKDOWN_COLORS = {
  depreciation: "hsl(220, 14%, 40%)",
  fuel: "hsl(38, 80%, 50%)",
  insurance: "hsl(215, 55%, 55%)",
  tax: "hsl(280, 40%, 55%)",
  service: "hsl(152, 45%, 48%)",
};

const STAT_COLORS: Record<string, string> = {
  Yearly: "text-primary",
  Total: "text-primary",
  Depreciation: "text-[hsl(220,14%,40%)]",
  Fuel: "text-[hsl(38,80%,50%)]",
  Insurance: "text-[hsl(215,55%,55%)]",
  Tax: "text-[hsl(280,40%,55%)]",
  Service: "text-[hsl(152,45%,48%)]",
  Residual: "text-accent",
};

export function ResultsPanel({ results, currency }: ResultsPanelProps) {
  if (results.length === 0) return null;

  const cheapestMonthly = Math.min(...results.map((r) => r.monthlyCost));
  const maxMonthly = Math.max(...results.map((r) => r.monthlyCost));

  const chartData = results.map((r) => ({
    name: r.name.length > 14 ? r.name.slice(0, 12) + "…" : r.name,
    fullName: r.name,
    monthly: r.monthlyCost,
    isCheapest: r.monthlyCost === cheapestMonthly && results.length > 1,
  }));

  // Cost breakdown chart data
  const breakdownData = results.map((r) => ({
    name: r.name.length > 14 ? r.name.slice(0, 12) + "…" : r.name,
    depreciation: r.breakdown.depreciation,
    fuel: r.breakdown.fuel,
    insurance: r.breakdown.insurance,
    tax: r.breakdown.tax,
    service: r.breakdown.service,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold tracking-tight">Comparison</h2>

      {/* Monthly cost chart */}
      {results.length >= 2 && (
        <div className="rounded-2xl bg-card border border-border/60 p-4 sm:p-5">
          <p className="text-xs text-muted-foreground mb-3">Monthly cost</p>
          <ResponsiveContainer width="100%" height={results.length * 56 + 16}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fontSize: 11, fill: "hsl(220, 8%, 55%)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "hsl(220, 10%, 94%, 0.5)" }}
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(220, 13%, 90%)",
                  borderRadius: "12px",
                  fontSize: "13px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                formatter={(value: number) => [formatCurrency(value, currency), "Monthly"]}
              />
              <Bar dataKey="monthly" radius={[0, 6, 6, 0]} barSize={28}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.isCheapest ? CHART_COLORS.cheapest : CHART_COLORS.normal} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cost breakdown stacked chart */}
      <div className="rounded-2xl bg-card border border-border/60 p-4 sm:p-5">
        <p className="text-xs text-muted-foreground mb-3">Cost breakdown (total)</p>
        <ResponsiveContainer width="100%" height={results.length * 56 + 40}>
          <BarChart data={breakdownData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tick={{ fontSize: 11, fill: "hsl(220, 8%, 55%)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(220, 13%, 90%)",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
              formatter={(value: number, name: string) => [formatCurrency(value, currency), name.charAt(0).toUpperCase() + name.slice(1)]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
            />
            <Bar dataKey="depreciation" stackId="a" fill={BREAKDOWN_COLORS.depreciation} radius={[0, 0, 0, 0]} barSize={24} />
            <Bar dataKey="fuel" stackId="a" fill={BREAKDOWN_COLORS.fuel} />
            <Bar dataKey="insurance" stackId="a" fill={BREAKDOWN_COLORS.insurance} />
            <Bar dataKey="tax" stackId="a" fill={BREAKDOWN_COLORS.tax} />
            <Bar dataKey="service" stackId="a" fill={BREAKDOWN_COLORS.service} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Result cards */}
      <div className="grid gap-4">
        {results.map((result) => {
          const isCheapest = result.monthlyCost === cheapestMonthly && results.length > 1;
          const barWidth = maxMonthly > 0 ? (result.monthlyCost / maxMonthly) * 100 : 0;

          return (
            <div
              key={result.id}
              className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                isCheapest
                  ? "bg-highlight-soft border-highlight/30 ring-1 ring-highlight/20"
                  : "bg-card border-border/60"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    {result.brand && <BrandLogo brand={result.brand} size="md" />}
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base">{result.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {result.fuelType && <FuelBadge fuelType={result.fuelType} />}
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
                </div>
              </div>

              <div className="h-2 rounded-full bg-secondary overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCheapest ? "bg-highlight" : "bg-muted-foreground/30"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <Stat label="Yearly" value={formatCurrency(result.yearlyCost, currency)} />
                <Stat label="Total" value={formatCurrency(result.totalOwnershipCost, currency)} />
                <Stat label="Depreciation" value={formatCurrency(result.breakdown.depreciation, currency)} />
                <Stat label="Fuel" value={formatCurrency(result.breakdown.fuel, currency)} />
                <Stat label="Insurance" value={formatCurrency(result.breakdown.insurance, currency)} />
                <Stat label="Tax" value={formatCurrency(result.breakdown.tax, currency)} />
                <Stat label="Service" value={formatCurrency(result.breakdown.service, currency)} />
                <Stat label="Residual" value={`${result.residualValuePercent}%`} />
              </div>
            </div>
          );
        })}
      </div>

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
