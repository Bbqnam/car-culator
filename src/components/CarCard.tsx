import { CarInput, FuelType, FinancingMode, calculateResidualPercent } from "@/lib/car-types";
import { getBrands, getModels, findCarModel, getDefaultFuelPrice } from "@/lib/car-database";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X, Car, Copy } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { FuelBadge } from "@/components/FuelBadge";
import { FinancingSelector } from "@/components/FinancingSelector";
import { NumericInput, ReadonlyField } from "@/components/NumericInput";
import { useI18n } from "@/lib/i18n";

interface CarCardProps {
  car: CarInput;
  index: number;
  canRemove: boolean;
  canDuplicate: boolean;
  onChange: (car: CarInput) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </p>
      {children}
    </div>
  );
}

function FieldLabelWithHint({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-center gap-1.5 min-h-[16px]">
      <Label className="text-[11px] text-muted-foreground font-medium leading-tight">
        {label}
      </Label>
      {hint && (
        <TooltipProvider delayDuration={120}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border/70 text-[10px] font-bold leading-none text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                aria-label={`${label} help`}
              >
                ?
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[260px] text-[11px] leading-relaxed">
              {hint}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

export function CarCard({ car, index, canRemove, canDuplicate, onChange, onRemove, onDuplicate }: CarCardProps) {
  const { language, t } = useI18n();
  const compactGridClass = "grid gap-2.5 grid-cols-1 md:grid-cols-2";
  const formGridClass = "grid gap-2.5 grid-cols-1 md:grid-cols-2";

  const brands = getBrands();
  const models = car.brand ? getModels(car.brand) : [];

  const update = (partial: Partial<CarInput>) => onChange({ ...car, ...partial });
  const updateLoan = (partial: Partial<CarInput["loan"]>) =>
    update({ loan: { ...car.loan, ...partial } });
  const updateLeasing = (partial: Partial<CarInput["leasing"]>) =>
    update({ leasing: { ...car.leasing, ...partial } });

  const handleBrandChange = (brand: string) => {
    onChange({
      ...car,
      brand,
      model: "",
      name: "",
      purchasePrice: 0,
      fuelType: "petrol",
      fuelConsumption: 0,
      taxCost: 0,
      serviceCost: 0,
      isConfigured: false,
      loan: { ...car.loan, downPayment: 0, residualBalloon: 0 },
    });
  };

  const handleModelChange = (modelName: string) => {
    const carModel = findCarModel(car.brand, modelName);
    if (!carModel) return;
    onChange({
      ...car,
      model: modelName,
      name: `${car.brand} ${modelName}`,
      purchasePrice: carModel.purchasePrice,
      fuelType: carModel.fuelType,
      fuelConsumption: carModel.fuelConsumption,
      fuelPrice: getDefaultFuelPrice(carModel.fuelType),
      taxCost: carModel.taxCost,
      serviceCost: carModel.serviceCost,
      isConfigured: true,
      loan: { ...car.loan, downPayment: Math.round(carModel.purchasePrice * 0.2) },
    });
  };

  const handleFinancingModeChange = (mode: FinancingMode) => {
    update({ financingMode: mode });
  };

  const handleFuelTypeChange = (ft: FuelType) => {
    update({ fuelType: ft, fuelPrice: getDefaultFuelPrice(ft) });
  };

  const currencyUnit = language === "sv" ? "kr" : "SEK";
  const fuelLabel = car.fuelType === "electric" ? "kWh/100km" : "L/100km";
  const priceLabel = car.fuelType === "electric" ? `${currencyUnit}/kWh` : `${currencyUnit}/L`;
  const consumptionHint = car.fuelType === "electric"
    ? t({
      en: "Average energy use per 100 km (real-world estimate).",
      sv: "Genomsnittlig energiförbrukning per 100 km (realistisk uppskattning).",
    })
    : t({
      en: "Average fuel use per 100 km (real-world estimate).",
      sv: "Genomsnittlig bränsleförbrukning per 100 km (realistisk uppskattning).",
    });
  const fuelPriceHint = car.fuelType === "electric"
    ? t({ en: "Your expected electricity price per kWh.", sv: "Ditt förväntade elpris per kWh." })
    : t({ en: "Your expected fuel price per liter.", sv: "Ditt förväntade bränslepris per liter." });
  const currentModel = car.brand && car.model ? findCarModel(car.brand, car.model) : null;
  const hasSingleFuelType = !!currentModel;

  const residualPercent = calculateResidualPercent(car.ownershipYears, car.fuelType);
  const loanAmount = Math.max(0, car.purchasePrice - car.loan.downPayment);

  return (
    <div className="bg-card rounded-2xl border border-border/70 shadow-sm overflow-hidden relative group">

      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {canDuplicate && car.isConfigured && (
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1.5 rounded-full hover:bg-secondary/80 transition-colors"
            aria-label={t({ en: "Duplicate car", sv: "Duplicera bil" })}
            title={t({ en: "Duplicate car", sv: "Duplicera bil" })}
          >
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-full hover:bg-secondary/80 transition-colors"
            aria-label={t({ en: "Remove car", sv: "Ta bort bil" })}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        {car.isConfigured && car.name ? (
          <div className="flex items-center gap-2.5 pr-7 mb-4">
            <BrandLogo brand={car.brand} size="md" />
            <div className="min-w-0">
              <span className="font-semibold text-sm block truncate leading-snug">
                {car.name}
              </span>
              <div className="mt-0.5">
                <FuelBadge fuelType={car.fuelType} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-3">
            {car.brand && <BrandLogo brand={car.brand} />}
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              {t({ en: `Car ${index + 1}`, sv: `Bil ${index + 1}` })}
            </span>
          </div>
        )}

        {/* Brand + Model */}
        <div className={compactGridClass}>
          <div className="space-y-1 min-w-0">
            <Label className="text-[11px] text-muted-foreground font-medium">{t({ en: "Brand", sv: "Märke" })}</Label>
            <Select value={car.brand || undefined} onValueChange={handleBrandChange}>
              <SelectTrigger className="h-9 text-sm bg-card border border-border/70 hover:border-border shadow-none focus:ring-2 focus:ring-ring/10">
                <SelectValue placeholder={t({ en: "Select brand", sv: "Välj märke" })} />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>
                    <span className="flex items-center gap-2">
                      <BrandLogo brand={b} />
                      {b}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 min-w-0">
            <Label className="text-[11px] text-muted-foreground font-medium">{t({ en: "Model", sv: "Modell" })}</Label>
            <Select
              value={car.model || undefined}
              onValueChange={handleModelChange}
              disabled={!car.brand}
            >
              <SelectTrigger className="h-9 text-sm bg-card border border-border/70 hover:border-border shadow-none focus:ring-2 focus:ring-ring/10 disabled:opacity-50">
                <SelectValue
                  placeholder={car.brand
                    ? t({ en: "Select model", sv: "Välj modell" })
                    : t({ en: "Pick brand first", sv: "Välj märke först" })}
                />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.model} value={m.model}>
                    {m.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Unconfigured placeholder */}
      {!car.isConfigured && (
        <div className="mx-4 mb-5 flex flex-col items-center justify-center py-7 text-center rounded-xl bg-secondary/30 border border-dashed border-border/60">
          <div className="w-9 h-9 rounded-full bg-secondary/70 flex items-center justify-center mb-2.5">
            <Car className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {t({ en: "Select brand & model above", sv: "Välj märke och modell ovan" })}
          </p>
          <p className="text-[10px] text-muted-foreground/55 mt-0.5">
            {t({ en: "to start comparing costs", sv: "för att börja jämföra kostnader" })}
          </p>
        </div>
      )}

      {/* Configured state */}
      {car.isConfigured && (
        <>
          <div className="h-px bg-border/50" />

          {/* Financing mode toggle */}
          <div className="px-5 pt-3.5 pb-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Label className="text-[11px] text-muted-foreground font-medium">
                {t({ en: "Financing type", sv: "Finansieringstyp" })}
              </Label>
              <TooltipProvider delayDuration={120}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border/70 text-[10px] font-bold leading-none text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                      aria-label={t({ en: "Financing type help", sv: "Hjälp för finansieringstyp" })}
                    >
                      ?
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[260px] text-[11px] leading-relaxed">
                    {t({
                      en: "Pick how the car is paid for. Relevant financing fields update below.",
                      sv: "Välj hur bilen betalas. Relevanta finansieringsfält uppdateras nedan.",
                    })}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <FinancingSelector
              value={car.financingMode}
              onChange={handleFinancingModeChange}
            />
          </div>

          <div className="h-px bg-border/40 mx-5" />

          {/* Essential inputs */}
          <div className="px-5 py-4 space-y-5">

            {/* Vehicle basics */}
            <Section label={t({ en: "Vehicle", sv: "Bil" })}>
              <div className={formGridClass}>
                <NumericInput
                  label={t({ en: "Purchase price", sv: "Köpesumma" })}
                  unit={currencyUnit}
                  value={car.purchasePrice}
                  onChange={(v) => update({ purchasePrice: v })}
                  step={10000}
                  hint={t({
                    en: "Total purchase price before resale value is considered.",
                    sv: "Totalt inköpspris innan restvärde räknas in.",
                  })}
                  required
                />

                <div className="space-y-1 min-w-0">
                  <FieldLabelWithHint
                    label={t({ en: "Fuel type", sv: "Drivmedel" })}
                    hint={t({
                      en: "Default fuel type comes from the selected model.",
                      sv: "Standarddrivmedel hämtas från vald modell.",
                    })}
                  />
                  {hasSingleFuelType ? (
                    <div className="min-h-[2.25rem] h-auto py-2 flex items-center px-3 rounded-md bg-secondary/40 border border-border/40">
                      <FuelBadge fuelType={car.fuelType} />
                    </div>
                  ) : (
                    <Select
                      value={car.fuelType}
                      onValueChange={(v: FuelType) => handleFuelTypeChange(v)}
                    >
                      <SelectTrigger className="min-h-[2.25rem] h-auto py-2 text-sm bg-card border border-border/70">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="petrol">{t({ en: "Petrol", sv: "Bensin" })}</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="electric">{t({ en: "Electric", sv: "El" })}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <NumericInput
                  label={t({ en: "Consumption", sv: "Förbrukning" })}
                  unit={fuelLabel}
                  value={car.fuelConsumption}
                  onChange={(v) => update({ fuelConsumption: v })}
                  step={0.1}
                  hint={consumptionHint}
                  required
                />

                <NumericInput
                  label={t({ en: "Annual mileage", sv: "Årlig körsträcka" })}
                  unit="km"
                  value={car.annualMileage}
                  onChange={(v) => update({ annualMileage: v })}
                  step={1000}
                  hint={t({
                    en: "How many kilometers you expect to drive each year.",
                    sv: "Hur många kilometer du förväntar dig att köra varje år.",
                  })}
                  required
                />
              </div>
            </Section>

            {/* ── Ownership — always visible for cash and loan ──────────── */}
            {(car.financingMode === "cash" || car.financingMode === "loan") && (
              <Section label={t({ en: "Ownership", sv: "Ägande" })}>
                <div className={formGridClass}>
                  <NumericInput
                    label={t({ en: "Ownership period", sv: "Ägandetid" })}
                    unit={t({ en: "years", sv: "år" })}
                    value={car.ownershipYears}
                    onChange={(v) => update({ ownershipYears: Math.max(1, v) })}
                    min={1}
                    hint={t({
                      en: "How long you plan to keep the car.",
                      sv: "Hur länge du planerar att behålla bilen.",
                    })}
                    required
                  />
                  <ReadonlyField
                    label={t({ en: "Est. residual value", sv: "Beräknat restvärde" })}
                    value={`${residualPercent}%`}
                    hint={t({
                      en: "Estimated remaining value after your ownership period.",
                      sv: "Beräknat kvarvarande värde efter ägandeperioden.",
                    })}
                  />
                </div>
              </Section>
            )}

            {/* ── Loan main fields ─────────────────────────────────────── */}
            {car.financingMode === "loan" && (
              <Section label={t({ en: "Loan details", sv: "Lånedetaljer" })}>
                <div className={formGridClass}>
                  <NumericInput
                    label={t({ en: "Down payment", sv: "Kontantinsats" })}
                    unit={currencyUnit}
                    value={car.loan.downPayment}
                    onChange={(v) => updateLoan({ downPayment: v })}
                    step={10000}
                    hint={t({
                      en: "Amount paid upfront when the loan starts.",
                      sv: "Belopp som betalas direkt när lånet startar.",
                    })}
                  />
                  <ReadonlyField
                    label={t({ en: "Loan amount", sv: "Lånebelopp" })}
                    value={loanAmount.toLocaleString("sv-SE")}
                    unit={currencyUnit}
                    hint={t({
                      en: "Calculated as purchase price minus down payment.",
                      sv: "Beräknas som köpesumma minus kontantinsats.",
                    })}
                  />
                  <NumericInput
                    label={t({ en: "Interest rate", sv: "Ränta" })}
                    unit="%"
                    value={car.loan.interestRate}
                    onChange={(v) => updateLoan({ interestRate: v })}
                    step={0.1}
                    hint={t({
                      en: "Annual loan rate from your lender.",
                      sv: "Årlig låneränta från långivaren.",
                    })}
                  />
                  <NumericInput
                    label={t({ en: "Loan term", sv: "Löptid" })}
                    unit={t({ en: "months", sv: "månader" })}
                    value={car.loan.loanTermMonths}
                    onChange={(v) => updateLoan({ loanTermMonths: Math.max(1, v) })}
                    min={1}
                    hint={t({
                      en: "Number of monthly payments in the loan.",
                      sv: "Antal månadsbetalningar i lånet.",
                    })}
                    required
                  />
                </div>
              </Section>
            )}

            {/* ── Leasing main fields ──────────────────────────────────── */}
            {car.financingMode === "leasing" && (
              <Section label={t({ en: "Lease details", sv: "Leasingdetaljer" })}>
                <div className={formGridClass}>
                  <NumericInput
                    label={t({ en: "Monthly fee", sv: "Månadsavgift" })}
                    unit={`${currencyUnit}/${t({ en: "mo", sv: "mån" })}`}
                    value={car.leasing.monthlyLeaseCost}
                    onChange={(v) => updateLeasing({ monthlyLeaseCost: v })}
                    step={100}
                    hint={t({
                      en: "Base lease payment per month.",
                      sv: "Grundavgift för leasing per månad.",
                    })}
                    required
                  />
                  <NumericInput
                    label={t({ en: "Contract term", sv: "Avtalstid" })}
                    unit={t({ en: "months", sv: "månader" })}
                    value={car.leasing.leaseDurationMonths}
                    onChange={(v) => updateLeasing({ leaseDurationMonths: Math.max(1, v) })}
                    min={1}
                    hint={t({
                      en: "Lease duration in months.",
                      sv: "Leasingperiod i månader.",
                    })}
                    required
                  />
                  <NumericInput
                    label={t({ en: "First payment", sv: "Första betalning" })}
                    unit={currencyUnit}
                    value={car.leasing.downPayment}
                    onChange={(v) => updateLeasing({ downPayment: v })}
                    step={1000}
                    hint={t({
                      en: "One-time upfront payment at lease start.",
                      sv: "Engångsbetalning i början av avtalet.",
                    })}
                  />
                  <NumericInput
                    label={t({ en: "Included mileage", sv: "Inkluderad körsträcka" })}
                    unit="km/yr"
                    value={car.leasing.includedMileage}
                    onChange={(v) => updateLeasing({ includedMileage: v })}
                    step={1000}
                    hint={t({
                      en: "Annual mileage included before excess-km charges.",
                      sv: "Årlig körsträcka som ingår innan övermil debiteras.",
                    })}
                    required
                  />
                </div>
              </Section>
            )}

            {/* Running costs */}
            <Section label={t({ en: "Running costs", sv: "Löpande kostnader" })}>
              <div className={formGridClass}>
                <NumericInput
                  label={t({ en: "Fuel price", sv: "Bränslepris" })}
                  unit={priceLabel}
                  value={car.fuelPrice}
                  onChange={(v) => update({ fuelPrice: v })}
                  step={0.1}
                  hint={fuelPriceHint}
                  required
                />
                <NumericInput
                  label={t({ en: "Insurance", sv: "Försäkring" })}
                  unit={`${currencyUnit}/${t({ en: "yr", sv: "år" })}`}
                  value={car.insuranceCost}
                  onChange={(v) => update({ insuranceCost: v })}
                  step={100}
                  hint={t({
                    en: "Expected yearly insurance premium.",
                    sv: "Förväntad årlig försäkringskostnad.",
                  })}
                />
                <NumericInput
                  label={t({ en: "Road tax", sv: "Fordonsskatt" })}
                  unit={`${currencyUnit}/${t({ en: "yr", sv: "år" })}`}
                  value={car.taxCost}
                  onChange={(v) => update({ taxCost: v })}
                  step={100}
                  hint={t({
                    en: "Expected yearly vehicle tax.",
                    sv: "Förväntad årlig fordonsskatt.",
                  })}
                />
                <NumericInput
                  label={t({ en: "Service & maint.", sv: "Service & underhåll" })}
                  unit={`${currencyUnit}/${t({ en: "yr", sv: "år" })}`}
                  value={car.serviceCost}
                  onChange={(v) => update({ serviceCost: v })}
                  step={100}
                  hint={t({
                    en: "Expected yearly service and maintenance costs.",
                    sv: "Förväntade årliga service- och underhållskostnader.",
                  })}
                />
              </div>
            </Section>

            {/* Loan optional extras */}
            {car.financingMode === "loan" && (
              <Section label={t({ en: "Loan — optional", sv: "Lån — valfritt" })}>
                <div className={formGridClass}>
                  <NumericInput
                    label={t({ en: "Balloon payment", sv: "Restskuld" })}
                    unit={currencyUnit}
                    value={car.loan.residualBalloon}
                    onChange={(v) => updateLoan({ residualBalloon: v })}
                    hint={t({
                      en: "Optional lump sum paid at the end of the loan.",
                      sv: "Valfritt klumpsummebelopp som betalas vid lånets slut.",
                    })}
                  />
                  <NumericInput
                    label={t({ en: "Monthly admin fee", sv: "Månadsavgift admin" })}
                    unit={`${currencyUnit}/${t({ en: "mo", sv: "mån" })}`}
                    value={car.loan.monthlyAdminFee}
                    onChange={(v) => updateLoan({ monthlyAdminFee: v })}
                    hint={t({
                      en: "Extra monthly bank or administration fee.",
                      sv: "Extra månadsavgift för bank eller administration.",
                    })}
                  />
                </div>
              </Section>
            )}

            {/* Lease optional extras */}
            {car.financingMode === "leasing" && (
              <Section label={t({ en: "Lease — optional", sv: "Leasing — valfritt" })}>
                <div className={formGridClass}>
                  <NumericInput
                    label={t({ en: "Excess km cost", sv: "Övermilkostnad" })}
                    unit={`${currencyUnit}/km`}
                    value={car.leasing.excessMileageCostPerKm}
                    onChange={(v) => updateLeasing({ excessMileageCostPerKm: v })}
                    step={0.1}
                    hint={t({
                      en: "Fee charged per km above included mileage.",
                      sv: "Avgift per km över inkluderad körsträcka.",
                    })}
                  />
                  <NumericInput
                    label={t({ en: "End-of-term fee", sv: "Slutavgift" })}
                    unit={currencyUnit}
                    value={car.leasing.endOfTermFee}
                    onChange={(v) => updateLeasing({ endOfTermFee: v })}
                    hint={t({
                      en: "One-time fee charged when the lease ends.",
                      sv: "Engångsavgift när leasingperioden avslutas.",
                    })}
                  />
                </div>
              </Section>
            )}
          </div>
        </>
      )}
    </div>
  );
}
