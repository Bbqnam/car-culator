import { CarResult, Currency, formatCurrency } from "@/lib/car-types";

interface ResultsPanelProps {
  results: CarResult[];
  currency: Currency;
}

export function ResultsPanel({ results, currency }: ResultsPanelProps) {
  if (results.length === 0) return null;

  const cheapestMonthly = Math.min(...results.map((r) => r.monthlyCost));
  const maxMonthly = Math.max(...results.map((r) => r.monthlyCost));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold tracking-tight">Comparison</h2>

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
                    <h3 className="font-semibold">{result.name}</h3>
                    {isCheapest && (
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-highlight bg-highlight/10 px-2 py-0.5 rounded-full">
                        Cheapest
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold tracking-tight">
                    {formatCurrency(result.monthlyCost, currency)}
                  </div>
                  <div className="text-xs text-muted-foreground">per month</div>
                </div>
              </div>

              {/* Cost bar */}
              <div className="h-2 rounded-full bg-secondary overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCheapest ? "bg-highlight" : "bg-muted-foreground/30"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <Stat label="Yearly" value={formatCurrency(result.yearlyCost, currency)} />
                <Stat label="Total" value={formatCurrency(result.totalOwnershipCost, currency)} />
                <Stat label="Depreciation" value={formatCurrency(result.totalDepreciation, currency)} />
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
