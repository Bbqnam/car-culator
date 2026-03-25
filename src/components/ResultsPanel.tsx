import { CarResult, Currency, formatCurrency } from "@/lib/car-types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BrandLogo } from "@/components/BrandLogo";
import { FuelBadge } from "@/components/FuelBadge";
import { FuelType } from "@/lib/car-types";

interface ResultsPanelProps {
  results: (CarResult & { brand?: string; fuelType?: FuelType })[];
  currency: Currency;
}

const CHART_COLORS = {
  cheapest: "hsl(152, 45%, 48%)",
  normal: "hsl(220, 8%, 75%)",
};

export function ResultsPanel({ results, currency }: ResultsPanelProps) {
  if (results.length === 0) return null;

  const cheapestMonthly = Math.min(...results.map((r) => r.monthlyCost));
  const maxMonthly = Math.max(...results.map((r) => r.monthlyCost));

  const chartData = results.map((r) => ({
    name: r.name.length > 18 ? r.name.slice(0, 16) + "…" : r.name,
    fullName: r.name,
    monthly: r.monthlyCost,
    isCheapest: r.monthlyCost === cheapestMonthly && results.length > 1,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold tracking-tight">Comparison</h2>

      {results.length >= 2 && (
        <div className="rounded-2xl bg-card border border-border/60 p-5">
          <p className="text-xs text-muted-foreground mb-3">Monthly cost</p>
          <ResponsiveContainer width="100%" height={results.length * 56 + 16}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 12, fill: "hsl(220, 8%, 55%)" }}
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
                formatter={(value: number) => [
                  formatCurrency(value, currency),
                  "Monthly",
                ]}
              />
              <Bar dataKey="monthly" radius={[0, 6, 6, 0]} barSize={28}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.isCheapest ? CHART_COLORS.cheapest : CHART_COLORS.normal}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid gap-4">
        {results.map((result) => {
          const isCheapest = result.monthlyCost === cheapestMonthly && results.length > 1;
          const barWidth = maxMonthly > 0 ? (result.monthlyCost / maxMonthly) * 100 : 0;

          return (
            <div
              key={result.id}
              className={`rounded-2xl p-5 border transition-all ${
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
                      <h3 className="font-semibold">{result.name}</h3>
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
                  <div className="text-2xl font-bold tracking-tight">
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
                <Stat label="Depreciation" value={formatCurrency(result.totalDepreciation, currency)} />
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
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
