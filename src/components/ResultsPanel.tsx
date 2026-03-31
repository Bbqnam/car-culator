import { useEffect, useMemo, useState } from "react";
import { CarInput, CarResult, Currency, formatCurrency, generateVerdict } from "@/lib/car-types";
import { getBrandLogo } from "@/lib/brand-logos";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown, ChevronUp, Lightbulb, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { FuelBadge } from "@/components/FuelBadge";
import { useI18n, type Language } from "@/lib/i18n";
import { CommercialOffersDialog } from "@/components/results/CommercialOffersDialog";
import { tx } from "@/components/results/results-panel-copy";

interface ResultsPanelProps {
  cars: CarInput[];
  results: CarResult[];
  currency: Currency;
}

type Tab = "overview" | "chart";
type BreakdownRowKey = keyof CarResult["breakdown"];

const FINANCING_LABELS: Record<string, string> = {
  cash: "Kontant",
  loan: "Lån",
  leasing: "Leasing",
};

const BREAKDOWN_ROWS: { key: BreakdownRowKey; label: string; color: string }[] = [
  { key: "depreciation", label: "Värdeminskning", color: "hsl(220,14%,40%)" },
  { key: "financingCost", label: "Finansiering", color: "hsl(0,65%,55%)" },
  { key: "leaseCost", label: "Leasingavgifter", color: "hsl(200,60%,50%)" },
  { key: "fuel", label: "Bränsle / Energi", color: "hsl(38,80%,50%)" },
  { key: "insurance", label: "Försäkring", color: "hsl(215,55%,55%)" },
  { key: "tax", label: "Skatt", color: "hsl(280,40%,55%)" },
  { key: "service", label: "Service", color: "hsl(152,45%,48%)" },
  { key: "downPayment", label: "Kontantinsats", color: "hsl(30,50%,55%)" },
  { key: "mileagePenalty", label: "Övermilsavgift", color: "hsl(15,70%,55%)" },
  { key: "endOfTermFee", label: "Slutavgift", color: "hsl(340,40%,55%)" },
];

const CHART_COLORS = {
  cheapest: "hsl(152,45%,48%)",
  normal: "hsl(220,8%,78%)",
};

export function ResultsPanel({ cars, results, currency }: ResultsPanelProps) {
  const { language } = useI18n();
  const [tab, setTab] = useState<Tab>("overview");

  if (results.length === 0) return null;

  const carById = new Map(cars.map((car) => [car.id, car]));
  const resultsWithVerdicts = results.map((r) => ({
    ...r,
    car: carById.get(r.id),
    verdict: generateVerdict(r, results),
  }));

  const sorted = [...resultsWithVerdicts].sort((a, b) => a.monthlyCost - b.monthlyCost);
  const activeRows = BREAKDOWN_ROWS.filter((r) =>
    sorted.some((car) => (car.breakdown[r.key] ?? 0) > 0)
  );

  return (
    <div className="h-full rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-border/60 bg-secondary/30">
        {([
          { key: "overview" as Tab, label: tx(language, "Resultat") },
          { key: "chart" as Tab, label: tx(language, "Diagram") },
        ]).map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex-1 py-3.5 text-[11px] sm:text-xs font-semibold uppercase tracking-widest transition-colors ${
              tab === item.key
                ? "text-foreground border-b-2 border-foreground -mb-px bg-card"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-5 sm:p-6 lg:p-7">
        {tab === "overview" && (
          <OverviewTab
            sorted={sorted}
            currency={currency}
            language={language}
          />
        )}
        {tab === "chart" && (
          <DiagramTab
            sorted={sorted}
            activeRows={activeRows}
            currency={currency}
            language={language}
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
  language,
}: {
  sorted: (CarResult & { car?: CarInput; verdict: string })[];
  currency: Currency;
  language: Language;
}) {
  const cheapestMånad = sorted[0]?.monthlyCost ?? 0;
  const isMulti = sorted.length > 1;
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [showMobileCompare, setShowMobileCompare] = useState(false);
  const leadResult = sorted[0] ?? null;
  const maxMonthlySpread = isMulti
    ? sorted[sorted.length - 1].monthlyCost - sorted[0].monthlyCost
    : 0;

  return (
    <div className="space-y-3.5">
      <div className="space-y-3 md:hidden">
        {leadResult && (
          <>
            <div className="rounded-xl border border-highlight/25 bg-highlight-soft px-4 py-3 ring-1 ring-highlight/15">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-highlight">
                {tx(language, "Bäst värde")}
              </p>
              <div className="mt-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-foreground truncate">{leadResult.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {leadResult.fuelType && <FuelBadge fuelType={leadResult.fuelType} />}
                    <span className="rounded bg-white/70 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {tx(language, FINANCING_LABELS[leadResult.financingMode])}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-bold tracking-tight text-highlight tabular-nums">
                    {formatCurrency(leadResult.monthlyCost, currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">{language === "sv" ? "/mån" : "/mo"}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {isMulti
                  ? `${tx(language, "Billigaste alternativet sparar")} ${formatCurrency(maxMonthlySpread, currency)}${language === "sv" ? "/mån" : "/mo"}`
                  : tx(language, "Basnivå per månad")}
              </p>
            </div>

            <OverviewResultCard
              result={leadResult}
              isCheapest={isMulti}
              currency={currency}
              language={language}
              onOpenOffers={() => setDetailsId(leadResult.id)}
            />
          </>
        )}

        {isMulti && sorted.length > 1 && (
          <div className="rounded-xl border border-border/60 bg-background px-4 py-3">
            <button
              type="button"
              onClick={() => setShowMobileCompare((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 text-left"
              aria-expanded={showMobileCompare}
            >
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {language === "sv" ? "Jämför övriga bilar" : "Compare other cars"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === "sv"
                    ? "Öppna när du vill se resten av alternativen."
                    : "Open this when you want to inspect the remaining options."}
                </p>
              </div>
              {showMobileCompare ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
            </button>

            {showMobileCompare && (
              <div className="mt-3 space-y-3 border-t border-border/50 pt-3">
                {sorted.slice(1).map((result) => (
                  <OverviewResultCard
                    key={result.id}
                    result={result}
                    isCheapest={false}
                    currency={currency}
                    language={language}
                    onOpenOffers={() => setDetailsId(result.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="hidden md:block space-y-3.5">
        {sorted.map((result, idx) => (
          <OverviewResultCard
            key={result.id}
            result={result}
            isCheapest={idx === 0 && isMulti}
            currency={currency}
            language={language}
            onOpenOffers={() => setDetailsId(result.id)}
          />
        ))}

        {isMulti && (
          <div className="text-center text-xs text-muted-foreground pt-1">
            {tx(language, "Billigaste alternativet sparar")}{" "}
            <span className="font-semibold text-highlight">
              {formatCurrency(maxMonthlySpread, currency)}
              {language === "sv" ? "/mån" : "/mo"}
            </span>
          </div>
        )}
      </div>

      <CommercialOffersDialog
        sorted={sorted}
        currency={currency}
        language={language}
        detailsId={detailsId}
        setDetailsId={setDetailsId}
      />
    </div>
  );
}

function OverviewResultCard({
  result,
  isCheapest,
  currency,
  language,
  onOpenOffers,
}: {
  result: CarResult & { car?: CarInput; verdict: string };
  isCheapest: boolean;
  currency: Currency;
  language: Language;
  onOpenOffers: () => void;
}) {
  const decisionStats = getDecisionStats(result, currency, language);

  return (
    <div
      className={`rounded-xl border p-3.5 sm:p-4 transition-all ${
        isCheapest
          ? "bg-highlight-soft border-highlight/25 ring-1 ring-highlight/15"
          : "bg-background border-border/60"
      }`}
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {result.brand && <BrandLogo brand={result.brand} size="md" />}
          <div className="min-w-0">
            <div className="font-semibold text-[15px] truncate">{result.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {result.fuelType && <FuelBadge fuelType={result.fuelType} />}
              <span className="text-[11px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                {tx(language, FINANCING_LABELS[result.financingMode])}
              </span>
              {isCheapest && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-highlight bg-highlight/12 px-2 py-0.5 rounded-full">
                  {tx(language, "Bäst värde")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right shrink-0 sm:pt-0.5">
          <div className="text-[1.5rem] sm:text-[1.8rem] font-bold tracking-tight tabular-nums leading-none">
            {formatCurrency(result.monthlyCost, currency)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{language === "sv" ? "/mån" : "/mo"}</div>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-1 gap-x-3 gap-y-2.5 border-t border-border/50 pt-2.5 sm:grid-cols-3">
        {decisionStats.map((stat) => (
          <MiniStat
            key={stat.label}
            label={stat.label}
            value={stat.value}
            accent={stat.accent}
          />
        ))}
      </div>

      <div
        className={[
          "mt-2 flex flex-col gap-2 lg:flex-row lg:items-center",
          result.verdict ? "lg:justify-between" : "lg:justify-end",
        ].join(" ")}
      >
        {result.verdict ? (
          <div
            className={[
              "rounded-lg border px-2.5 py-1.5 flex items-center gap-2 transition-colors min-w-0 lg:flex-1",
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
            <p className="text-[11px] leading-relaxed text-foreground/90 italic min-w-0">
              {tx(language, result.verdict)}
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onOpenOffers}
          className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 px-3.5 py-2 text-[12px] font-semibold text-white shadow-sm ring-1 ring-emerald-300/60 transition-all hover:from-emerald-500 hover:to-emerald-400 hover:shadow-md lg:min-h-0 lg:w-auto shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {language === "sv" ? "Se erbjudanden" : tx(language, "Finansieringserbjudanden")}
          <span aria-hidden="true">→</span>
        </button>
      </div>
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
  accent?: "negative" | "positive";
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-muted-foreground mb-1">{label}</div>
      <div
        className={`text-[14px] font-semibold tabular-nums leading-tight ${
          accent === "negative"
            ? "text-destructive"
            : accent === "positive"
            ? "text-highlight"
            : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function getDecisionStats(
  result: CarResult & { car?: CarInput },
  currency: Currency,
  language: Language,
): Array<{ label: string; value: string; accent?: "negative" | "positive" }> {
  const car = result.car;
  const durationMonths = result.ownershipMonths;
  const durationLabel = formatDuration(durationMonths, language);

  if (result.financingMode === "cash") {
    const purchasePrice = car?.purchasePrice ?? estimatePurchasePriceFromResult(result);
    const residualValue = purchasePrice > 0
      ? Math.round(purchasePrice * (result.residualValuePercent / 100))
      : 0;

    return [
      {
        label: language === "sv" ? "Direkt idag" : "Upfront today",
        value: purchasePrice > 0 ? formatCurrency(purchasePrice, currency) : "—",
      },
      {
        label: language === "sv" ? "Vid periodens slut" : "End of term",
        value: language === "sv" ? "Du behåller bilen" : "You still own the car",
        accent: "positive",
      },
      {
        label: language === "sv" ? "Beräknat restvärde" : "Estimated resale value",
        value: residualValue > 0 ? formatCurrency(residualValue, currency) : "—",
      },
    ];
  }

  if (result.financingMode === "loan") {
    return [
      {
        label: language === "sv" ? "Direkt idag" : "Upfront today",
        value: formatCurrency(car?.loan.downPayment ?? result.breakdown.downPayment, currency),
      },
      {
        label: language === "sv" ? "Vid periodens slut" : "End of term",
        value: language === "sv" ? `Du äger bilen om ${durationLabel}` : `Own it after ${durationLabel}`,
        accent: "positive",
      },
      {
        label: language === "sv" ? "Ränta och avgifter" : "Interest and fees",
        value: formatCurrency(result.breakdown.financingCost, currency),
      },
    ];
  }

  const mileagePenalty = result.breakdown.mileagePenalty;
  const includedMileage = car?.leasing.includedMileage ?? 0;

  return [
    {
      label: language === "sv" ? "Direkt idag" : "Upfront today",
      value: formatCurrency(car?.leasing.downPayment ?? result.breakdown.downPayment, currency),
    },
    {
      label: language === "sv" ? "Vid periodens slut" : "End of term",
      value: language === "sv" ? `Lämnas tillbaka efter ${durationLabel}` : `Return it after ${durationLabel}`,
    },
    mileagePenalty > 0
      ? {
          label: language === "sv" ? "Beräknad övermilskostnad" : "Projected over-mile fee",
          value: formatCurrency(mileagePenalty, currency),
          accent: "negative",
        }
      : {
          label: language === "sv" ? "Inkluderad körsträcka" : "Included mileage",
          value: includedMileage > 0
            ? (language === "sv"
              ? `${includedMileage.toLocaleString("sv-SE")} km/år`
              : `${includedMileage.toLocaleString("en-US")} km/yr`)
            : "—",
        },
  ];
}

function formatDuration(months: number, language: Language): string {
  return language === "sv" ? `${months} månader` : `${months} months`;
}

function estimatePurchasePriceFromResult(result: CarResult): number {
  const retainedShare = 1 - result.residualValuePercent / 100;
  if (retainedShare <= 0) return 0;
  return Math.round(result.totalDepreciation / retainedShare);
}

// ─── Breakdown Tab ───────────────────────────────────────────────────────────

type ViewMode = "monthly" | "yearly" | "total";

function BreakdownTab({
  sorted,
  activeRows,
  currency,
  language,
}: {
  sorted: CarResult[];
  activeRows: typeof BREAKDOWN_ROWS;
  currency: Currency;
  language: Language;
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
    { key: "monthly", label: tx(language, "Månad") },
    { key: "yearly", label: tx(language, "År") },
    { key: "total", label: tx(language, "Totalt") },
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

      {/* Kategori table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs min-w-[260px]">
          <thead>
            <tr className="border-b border-border/60">
              <th className="text-left pb-2 pr-3 text-muted-foreground font-medium w-28">
                {tx(language, "Kategori")}
              </th>
              {sorted.map((r) => (
                <th key={r.id} className="pb-2 px-2 text-right font-semibold text-foreground">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="truncate max-w-[90px] block">{r.name}</span>
                    <span className="font-normal text-muted-foreground text-[10px]">
                      {tx(language, FINANCING_LABELS[r.financingMode])}
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
                      {tx(language, row.label)}
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
            {tx(language, "Sammanfattning")}
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
          { key: "monthly" as ViewMode, label: language === "sv" ? "Per månad" : "Per month", getValue: (r: CarResult) => r.monthlyCost },
          { key: "yearly" as ViewMode, label: tx(language, "Per år"), getValue: (r: CarResult) => r.yearlyCost },
          { key: "total" as ViewMode, label: tx(language, "Totalt"), getValue: (r: CarResult) => r.totalOwnershipCost },
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
          {tx(language, "Grönt = lägst i kategorin")}
        </p>
      )}
    </div>
  );
}

// ─── Diagram Tab ───────────────────────────────────────────────────────────────

type ChartViewMode = "monthly" | "total";
const CAR_Y_AXIS_LABEL_WIDTH = 124;
const CAR_Y_AXIS_WIDTH = CAR_Y_AXIS_LABEL_WIDTH + 8;

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
    <foreignObject x={x - CAR_Y_AXIS_LABEL_WIDTH - 4} y={y - 12} width={CAR_Y_AXIS_LABEL_WIDTH} height={24}>
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
            maxWidth: logo ? CAR_Y_AXIS_LABEL_WIDTH - 26 : CAR_Y_AXIS_LABEL_WIDTH - 8,
          }}
        >
          {label}
        </span>
      </div>
    </foreignObject>
  );
}
// Sammanfattning bar row with optional brand logo
function MetricBar({
  car,
  label,
  value,
  baselineValue,
  maxValue,
  isWinner,
  currency,
  language,
  metricLabel,
  suffix = "",
}: {
  car: CarResult;
  label: string;
  value: number;
  baselineValue: number;
  maxValue: number;
  isWinner: boolean;
  currency: Currency;
  language: Language;
  metricLabel: string;
  suffix?: string;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const logo = car.brand ? getBrandLogo(car.brand) : null;
  const delta = Math.max(0, value - baselineValue);
  const deltaLabel = getSummaryDeltaLabel(delta, metricLabel, currency, language);

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${isWinner ? "border-emerald-200 bg-emerald-50/60" : "border-border/60 bg-background/70"}`}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          {logo && (
            <img src={logo} alt="" className="w-4 h-4 object-contain shrink-0 opacity-90" />
          )}
          <span className={`truncate text-sm ${isWinner ? "text-foreground font-semibold" : "text-foreground/85 font-medium"}`}>
            {label}
          </span>
          {isWinner && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-highlight bg-highlight/10 px-1.5 py-0.5 rounded-full">
              {tx(language, "Bäst")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isWinner && deltaLabel && (
            <span className="hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 whitespace-nowrap">
              {deltaLabel}
            </span>
          )}
          <span className={`text-[1.05rem] font-bold tabular-nums ${isWinner ? "text-highlight" : "text-foreground"}`}>
            {formatCurrency(value, currency)}{suffix}
          </span>
        </div>
      </div>
      {!isWinner && deltaLabel && (
        <div className="mb-1.5 sm:hidden">
          <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
            {deltaLabel}
          </span>
        </div>
      )}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {metricLabel}
          </span>
          {isWinner && (
            <span className="text-[10px] font-semibold text-highlight">
              {language === "sv" ? "Lägst kostnad" : "Lowest cost"}
            </span>
          )}
        </div>
        <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: isWinner ? CHART_COLORS.cheapest : "hsl(220,10%,74%)" }}
          />
        </div>
      </div>
    </div>
  );
}

function getSummaryDeltaLabel(
  delta: number,
  metricLabel: string,
  currency: Currency,
  language: Language
): string | null {
  if (delta <= 0) return null;
  if (metricLabel === tx(language, "Månad")) {
    return `${language === "sv" ? "+" : "+"}${formatCurrency(delta, currency)}${language === "sv" ? "/mån" : "/mo"}`;
  }
  if (metricLabel === tx(language, "Per km")) {
    return `${language === "sv" ? "+" : "+"}${formatCurrency(delta, currency)}/km`;
  }
  return `${language === "sv" ? "+" : "+"}${formatCurrency(delta, currency)}`;
}

function DiagramTab({
  sorted,
  activeRows,
  currency,
  language,
}: {
  sorted: CarResult[];
  activeRows: typeof BREAKDOWN_ROWS;
  currency: Currency;
  language: Language;
}) {
  const chartCars = useMemo(
    () =>
      sorted.map((car, index) => ({
        ...car,
        entryKey: `${car.id}::${index}`,
        displayName: (car.name || tx(language, "Namnlös bil")).trim() || tx(language, "Namnlös bil"),
      })),
    [sorted, language]
  );

  const winner = chartCars[0];
  const isMulti = sorted.length > 1;
  const [chartMode, setChartMode] = useState<ChartViewMode>("monthly");
  const [isSammanfattningExpanded, setIsSammanfattningExpanded] = useState(false);
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
  // Sammanfattning follows slicer selection:
  // - collapsed: best among currently visible cars
  // - expanded: all currently visible cars
  const summaryLeadCar = visibleCars[0] ?? winner;
  const summaryCars = isSammanfattningExpanded ? visibleCars : summaryLeadCar ? [summaryLeadCar] : [];

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

  const chartHeight = Math.max(visibleCars.length * 72, 220);

  // Sammanfattning uses max across all sorted cars (not just visible) so bars stay proportional
  const maxMonthlyAll = Math.max(...sorted.map((r) => r.monthlyCost), 1);
  const maxPerKmAll = Math.max(...sorted.map((r) => r.costPerKm), 1);
  const maxTotalAll = Math.max(...sorted.map((r) => r.totalOwnershipCost), 1);

  return (
    <div className="space-y-3.5">

      {/* ── Mode toggle ── */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-foreground">{tx(language, "Kostnadsfördelning")}</p>
        <div className="flex rounded-lg bg-secondary/60 p-0.5 gap-0.5">
          {([
            { key: "monthly" as ChartViewMode, label: tx(language, "Månad") },
            { key: "total" as ChartViewMode, label: tx(language, "Totalt") },
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
            {allCarsSelected ? tx(language, "Alla bilar visas") : tx(language, "Visa alla bilar")}
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
                {logo && <img src={logo} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />}
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
            {tx(language, row.label)}
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
              width={CAR_Y_AXIS_WIDTH}
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
              labelFormatter={(entryKey) => {
                const meta = carByEntryKey.get(String(entryKey));
                return meta?.car.name || meta?.label || tx(language, "Namnlös bil");
              }}
              formatter={(value: number | string, name: string) => {
                const numericValue = typeof value === "number" ? value : Number(value);
                const row = BREAKDOWN_ROWS.find((r) => r.key === name);
                return [formatCurrency(Number.isFinite(numericValue) ? numericValue : 0, currency), tx(language, row?.label ?? name)];
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

      {/* ── Sammanfattning ── */}
      {isMulti && summaryLeadCar && (
        <div className="space-y-2.5 border-t border-border/40 pt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              {tx(language, "Sammanfattning")}
            </p>
            <button
              type="button"
              onClick={() => setIsSammanfattningExpanded((v) => !v)}
              disabled={visibleCars.length <= 1}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              {visibleCars.length <= 1
                ? tx(language, "Endast en vald")
                : isSammanfattningExpanded
                ? tx(language, "Bara vinnaren ▴")
                : tx(language, "Visa alla bilar ▾")}
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/75">{tx(language, "Månad")}</p>
              <p className="text-[10px] text-muted-foreground">{language === "sv" ? "Jämför mot bästa värdet" : "Compared to the winner"}</p>
            </div>
            <div className="space-y-1.5">
              {summaryCars.map((r) => (
                <MetricBar
                  key={`monthly-${r.entryKey}`}
                  car={r}
                  label={r.displayName}
                  value={r.monthlyCost}
                  baselineValue={winner?.monthlyCost ?? r.monthlyCost}
                  maxValue={maxMonthlyAll}
                  isWinner={r.entryKey === winner?.entryKey}
                  currency={currency}
                  language={language}
                  metricLabel={tx(language, "Månad")}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/75">{tx(language, "Per km")}</p>
              <p className="text-[10px] text-muted-foreground">{language === "sv" ? "Lägre är bättre" : "Lower is better"}</p>
            </div>
            <div className="space-y-1.5">
              {summaryCars.map((r) => (
                <MetricBar
                  key={`perkm-${r.entryKey}`}
                  car={r}
                  label={r.displayName}
                  value={r.costPerKm}
                  baselineValue={winner?.costPerKm ?? r.costPerKm}
                  maxValue={maxPerKmAll}
                  isWinner={r.entryKey === winner?.entryKey}
                  currency={currency}
                  language={language}
                  metricLabel={tx(language, "Per km")}
                  suffix="/km"
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/75">{tx(language, "Totalt")}</p>
              <p className="text-[10px] text-muted-foreground">{language === "sv" ? "Ägandekostnad totalt" : "Full ownership cost"}</p>
            </div>
            <div className="space-y-1.5">
              {summaryCars.map((r) => (
                <MetricBar
                  key={`total-${r.entryKey}`}
                  car={r}
                  label={r.displayName}
                  value={r.totalOwnershipCost}
                  baselineValue={winner?.totalOwnershipCost ?? r.totalOwnershipCost}
                  maxValue={maxTotalAll}
                  isWinner={r.entryKey === winner?.entryKey}
                  currency={currency}
                  language={language}
                  metricLabel={tx(language, "Totalt")}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
