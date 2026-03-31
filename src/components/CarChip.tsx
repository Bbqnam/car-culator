import { useState } from "react";
import { CarInput, CarResult, Currency, PriceSource, formatCurrency } from "@/lib/car-types";
import { getBrandAccent } from "@/lib/brand-logos";
import { BrandLogo } from "@/components/BrandLogo";
import { FuelBadge } from "@/components/FuelBadge";
import { ChevronDown, ChevronUp, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface CarChipProps {
  car: CarInput;
  index: number;
  currency: Currency;
  result?: CarResult;
  isWinner: boolean;
  canRemove: boolean;
  canDuplicate: boolean;
  onOpen: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

function getPriceSourceLabel(
  source: PriceSource,
  t: (text: { en: string; sv: string }) => string,
): string {
  switch (source) {
    case "market_listings":
      return t({ en: "Swedish market listings", sv: "Svenska marknadsannonser" });
    case "official_new":
      return t({ en: "Official new price", sv: "Officiellt nypris" });
    case "historical_average":
      return t({ en: "Historical / average", sv: "Historiskt / genomsnitt" });
    case "manual":
      return t({ en: "Manual", sv: "Manuellt" });
    default:
      return t({ en: "Missing", sv: "Saknas" });
  }
}

function splitDisplayName(name: string, brand: string) {
  const trimmedName = name.trim();
  const trimmedBrand = brand.trim();

  if (!trimmedName || !trimmedBrand) {
    return { brandPart: "", modelPart: trimmedName };
  }

  const normalizedName = trimmedName.toLowerCase();
  const normalizedBrand = trimmedBrand.toLowerCase();

  if (!normalizedName.startsWith(normalizedBrand)) {
    return { brandPart: "", modelPart: trimmedName };
  }

  const modelPart = trimmedName.slice(trimmedBrand.length).trim();
  if (!modelPart) {
    return { brandPart: "", modelPart: trimmedName };
  }

  return {
    brandPart: trimmedBrand,
    modelPart,
  };
}

export function CarChip({
  car,
  index,
  currency,
  result,
  isWinner,
  canRemove,
  canDuplicate,
  onOpen,
  onRemove,
  onDuplicate,
}: CarChipProps) {
  const { language, locale, t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const FINANCING_LABELS: Record<CarInput["financingMode"], string> = {
    cash: language === "sv" ? "Kontant" : "Cash",
    loan: language === "sv" ? "Lån" : "Loan",
    leasing: language === "sv" ? "Leasing" : "Lease",
  };
  const formatDecimal = (value: number) =>
    value.toLocaleString(locale, {
      minimumFractionDigits: value % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 1,
    });

  if (!car.isConfigured) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="w-full min-h-[176px] rounded-xl border border-dashed border-border bg-card/60 hover:bg-card p-3.5 text-left"
      >
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center mb-2.5">
          <Plus className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">{t({ en: `Car ${index + 1}`, sv: `Bil ${index + 1}` })}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {t({ en: "Tap to configure this car", sv: "Tryck för att konfigurera bilen" })}
        </p>
      </button>
    );
  }

  const fuelLabel = car.fuelType === "electric" ? "kWh/100km" : "L/100km";
  const fuelPriceLabel = language === "sv"
    ? car.fuelType === "electric" ? "kr/kWh" : "kr/L"
    : car.fuelType === "electric" ? "SEK/kWh" : "SEK/L";
  const fuelPriceRowLabel = car.fuelType === "electric"
    ? t({ en: "Energy price", sv: "Elpris" })
    : t({ en: "Fuel price", sv: "Bränslepris" });
  const durationLabel =
    car.financingMode === "leasing"
      ? t({ en: `${car.leasing.leaseDurationMonths} months`, sv: `${car.leasing.leaseDurationMonths} månader` })
      : t({ en: `${car.ownershipYears} years`, sv: `${car.ownershipYears} år` });
  const consumptionValue = `${formatDecimal(car.fuelConsumption)} ${fuelLabel}`;
  const fuelPriceValue = `${formatDecimal(car.fuelPrice)} ${fuelPriceLabel}`;
  const brandAccent = car.brand ? getBrandAccent(car.brand) : "#1f2937";
  const displayName = car.name || t({ en: `Car ${index + 1}`, sv: `Bil ${index + 1}` });
  const { brandPart, modelPart } = splitDisplayName(displayName, car.brand);

  return (
    <div className="w-full min-h-[176px] rounded-xl border border-border/70 bg-card relative group overflow-hidden">
      <div className="p-3.5">
        <div className="relative">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="min-w-0 w-full text-left"
            aria-expanded={expanded}
            aria-label={t({
              en: `Toggle details for ${car.name || `Car ${index + 1}`}`,
              sv: `Växla detaljer för ${car.name || `Bil ${index + 1}`}`,
            })}
          >
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              {car.brand && <BrandLogo brand={car.brand} size="md" />}
              {car.fuelType && <FuelBadge fuelType={car.fuelType} />}
              <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {FINANCING_LABELS[car.financingMode]}
              </span>
            </div>
            <div className="min-h-[2.9rem] pr-1">
              {brandPart ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
                    <span>{brandPart}</span>
                    <span className="inline-flex items-center gap-1.5" aria-hidden="true">
                      <span
                        className="block h-px w-5 rounded-full"
                        style={{ backgroundColor: brandAccent, opacity: 0.45 }}
                      />
                      <span
                        className="block h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: brandAccent, opacity: 0.75 }}
                      />
                    </span>
                  </div>
                  <p
                    className="text-[1.05rem] sm:text-[1.15rem] font-extrabold leading-snug line-clamp-3"
                    style={{ color: brandAccent }}
                  >
                    {modelPart}
                  </p>
                  <span
                    className="block h-0.5 max-w-full rounded-full"
                    style={{ backgroundColor: brandAccent, width: `${Math.min(Math.max(modelPart.length * 0.58, 3.5), 11)}rem` }}
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <p
                    className="text-[1.05rem] sm:text-[1.15rem] font-extrabold leading-snug line-clamp-3"
                    style={{ color: brandAccent }}
                  >
                    {displayName}
                  </p>
                  <span
                    className="block h-0.5 max-w-full rounded-full"
                    style={{ backgroundColor: brandAccent, width: `${Math.min(Math.max(displayName.length * 0.58, 3.5), 11)}rem` }}
                  />
                </div>
              )}
            </div>
          </button>

          <div className="mt-2.5 flex items-center justify-end gap-2 sm:absolute sm:top-0 sm:right-0 sm:z-[2] sm:mt-0 sm:gap-1 sm:rounded-full sm:bg-card/95 sm:px-1 sm:py-1 sm:shadow-sm sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity">
            <button
              type="button"
              onClick={onOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-background text-foreground hover:bg-secondary sm:h-7 sm:w-7 sm:rounded-md sm:border-transparent sm:bg-transparent"
              aria-label={t({ en: "Edit car", sv: "Redigera bil" })}
            >
              <Pencil className="w-4 h-4 sm:w-3 sm:h-3" />
            </button>
            {canDuplicate && (
              <button
                type="button"
                onClick={onDuplicate}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-background text-foreground hover:bg-secondary sm:h-7 sm:w-7 sm:rounded-md sm:border-transparent sm:bg-transparent"
                aria-label={t({ en: "Duplicate car", sv: "Duplicera bil" })}
              >
                <Copy className="w-4 h-4 sm:w-3 sm:h-3" />
              </button>
            )}
            {canRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-background text-foreground hover:bg-secondary sm:h-7 sm:w-7 sm:rounded-md sm:border-transparent sm:bg-transparent"
                aria-label={t({ en: "Remove car", sv: "Ta bort bil" })}
              >
                <Trash2 className="w-4 h-4 sm:w-3 sm:h-3" />
              </button>
            )}
          </div>
        </div>

        {result && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className={`w-full mt-2.5 text-left rounded-lg border px-3 py-2.5 transition-colors ${
              isWinner
                ? "border-highlight/35 bg-highlight/10 hover:bg-highlight/15"
                : "border-border/60 bg-secondary/25 hover:bg-secondary/40"
            }`}
            aria-expanded={expanded}
            aria-label={t({
              en: `Toggle details for ${car.name || `Car ${index + 1}`}`,
              sv: `Växla detaljer för ${car.name || `Bil ${index + 1}`}`,
            })}
          >
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <p
                className={`text-[1.12rem] sm:text-[1.22rem] font-bold leading-tight tabular-nums ${
                  isWinner ? "text-highlight" : "text-foreground"
                }`}
              >
                {formatCurrency(result.monthlyCost, currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t({ en: "/ month", sv: "/ månad" })}
              </p>
            </div>

            <div className="mt-1.5 flex items-end justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                {t({ en: "Total cost", sv: "Total kostnad" })}
              </p>
              <p
                className={`text-[0.95rem] sm:text-[1rem] font-semibold leading-none tabular-nums whitespace-nowrap ${
                  isWinner ? "text-highlight" : "text-foreground"
                }`}
              >
                {formatCurrency(result.totalOwnershipCost, currency)}
              </p>
            </div>

            <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>{expanded ? t({ en: "Hide details", sv: "Dölj detaljer" }) : t({ en: "Show details", sv: "Visa detaljer" })}</span>
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </div>
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-border/50 bg-secondary/20 px-4 py-3.5">
          <div className="space-y-0.5">
            <DetailRow label={t({ en: "Financing", sv: "Finansiering" })} value={FINANCING_LABELS[car.financingMode]} />
            <DetailRow label={t({ en: "Purchase price", sv: "Köpesumma" })} value={formatCurrency(car.purchasePrice, currency)} />
            <DetailRow label={t({ en: "Price source", sv: "Priskälla" })} value={getPriceSourceLabel(car.priceSource, t)} />
            <DetailRow label={t({ en: "Duration", sv: "Period" })} value={durationLabel} />
            <DetailRow
              label={t({ en: "Mileage", sv: "Körsträcka" })}
              value={t({
                en: `${car.annualMileage.toLocaleString(locale)} km/yr`,
                sv: `${car.annualMileage.toLocaleString(locale)} km/år`,
              })}
            />
            <DetailRow label={t({ en: "Consumption", sv: "Förbrukning" })} value={consumptionValue} />
            <DetailRow label={fuelPriceRowLabel} value={fuelPriceValue} />
            {car.financingMode === "loan" && (
              <>
                <DetailRow label={t({ en: "Down payment", sv: "Kontantinsats" })} value={formatCurrency(car.loan.downPayment, currency)} />
                <DetailRow label={t({ en: "Interest", sv: "Ränta" })} value={`${car.loan.interestRate}%`} />
              </>
            )}
            {car.financingMode === "leasing" && (
              <>
                <DetailRow label={t({ en: "Monthly lease", sv: "Månadsleasing" })} value={formatCurrency(car.leasing.monthlyLeaseCost, currency)} />
                <DetailRow
                  label={t({ en: "Included km", sv: "Inkluderad km" })}
                  value={t({
                    en: `${car.leasing.includedMileage.toLocaleString(locale)} km/yr`,
                    sv: `${car.leasing.includedMileage.toLocaleString(locale)} km/år`,
                  })}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-start gap-x-3 py-1.5">
      <span className="text-xs text-muted-foreground leading-tight">{label}</span>
      <span className="text-sm font-medium text-foreground text-right leading-snug tabular-nums whitespace-nowrap pl-2">
        {value}
      </span>
    </div>
  );
}
