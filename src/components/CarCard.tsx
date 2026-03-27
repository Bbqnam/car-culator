import { useState } from "react";
import { CarInput, FuelType, FinancingMode, calculateResidualPercent } from "@/lib/car-types";
import { getBrands, getModels, findCarModel, getDefaultFuelPrice } from "@/lib/car-database";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { X, Car, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { FuelBadge } from "@/components/FuelBadge";
import { FinancingSelector } from "@/components/FinancingSelector";
import { NumericInput, ReadonlyField } from "@/components/NumericInput";

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

export function CarCard({ car, index, canRemove, canDuplicate, onChange, onRemove, onDuplicate }: CarCardProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const brands = getBrands();
  const models = car.brand ? getModels(car.brand) : [];

  const update = (partial: Partial<CarInput>) => onChange({ ...car, ...partial });
  const updateLoan = (partial: Partial<CarInput["loan"]>) =>
    update({ loan: { ...car.loan, ...partial } });
  const updateLeasing = (partial: Partial<CarInput["leasing"]>) =>
    update({ leasing: { ...car.leasing, ...partial } });

  const handleBrandChange = (brand: string) => {
    setAdvancedOpen(false);
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
    setAdvancedOpen(false);
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
    setAdvancedOpen(false);
    update({ financingMode: mode });
  };

  const handleFuelTypeChange = (ft: FuelType) => {
    update({ fuelType: ft, fuelPrice: getDefaultFuelPrice(ft) });
  };

  const fuelLabel = car.fuelType === "electric" ? "kWh/100km" : "L/100km";
  const priceLabel = car.fuelType === "electric" ? "SEK/kWh" : "SEK/L";
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
            aria-label="Duplicate car"
            title="Duplicate car"
          >
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-full hover:bg-secondary/80 transition-colors"
            aria-label="Remove car"
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
              Car {index + 1}
            </span>
          </div>
        )}

        {/* Brand + Model */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground font-medium">Brand</Label>
            <Select value={car.brand || undefined} onValueChange={handleBrandChange}>
              <SelectTrigger className="h-9 text-sm bg-card border border-border/70 hover:border-border shadow-none focus:ring-2 focus:ring-ring/10">
                <SelectValue placeholder="Select brand" />
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

          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground font-medium">Model</Label>
            <Select
              value={car.model || undefined}
              onValueChange={handleModelChange}
              disabled={!car.brand}
            >
              <SelectTrigger className="h-9 text-sm bg-card border border-border/70 hover:border-border shadow-none focus:ring-2 focus:ring-ring/10 disabled:opacity-50">
                <SelectValue placeholder={car.brand ? "Select model" : "Pick brand first"} />
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
          <p className="text-xs font-medium text-muted-foreground">Select brand &amp; model above</p>
          <p className="text-[10px] text-muted-foreground/55 mt-0.5">to start comparing costs</p>
        </div>
      )}

      {/* Configured state */}
      {car.isConfigured && (
        <>
          <div className="h-px bg-border/50" />

          {/* Financing mode toggle */}
          <div className="px-5 pt-3.5 pb-3">
            <Label className="text-[11px] text-muted-foreground font-medium block mb-1.5">
              Financing type
            </Label>
            <FinancingSelector
              value={car.financingMode}
              onChange={handleFinancingModeChange}
            />
          </div>

          <div className="h-px bg-border/40 mx-5" />

          {/* Essential inputs */}
          <div className="px-5 py-4 space-y-5">

            {/* Vehicle basics */}
            <Section label="Vehicle">
              <div className="grid grid-cols-2 gap-2.5">
                <NumericInput
                  label="Purchase price"
                  unit="SEK"
                  value={car.purchasePrice}
                  onChange={(v) => update({ purchasePrice: v })}
                  step={10000}
                  required
                />

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-medium">
                    Fuel type
                  </Label>
                  {hasSingleFuelType ? (
                    <div className="h-9 flex items-center px-3 rounded-md bg-secondary/40 border border-border/40">
                      <FuelBadge fuelType={car.fuelType} />
                    </div>
                  ) : (
                    <Select
                      value={car.fuelType}
                      onValueChange={(v: FuelType) => handleFuelTypeChange(v)}
                    >
                      <SelectTrigger className="h-9 text-sm bg-card border border-border/70">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="petrol">Petrol</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <NumericInput
                  label="Consumption"
                  unit={fuelLabel}
                  value={car.fuelConsumption}
                  onChange={(v) => update({ fuelConsumption: v })}
                  step={0.1}
                />

                <NumericInput
                  label="Annual mileage"
                  unit="km"
                  value={car.annualMileage}
                  onChange={(v) => update({ annualMileage: v })}
                  step={1000}
                />
              </div>
            </Section>

            {/* ── Ownership — always visible for cash and loan ──────────── */}
            {(car.financingMode === "cash" || car.financingMode === "loan") && (
              <Section label="Ownership">
                <div className="grid grid-cols-2 gap-2.5">
                  <NumericInput
                    label="Ownership period"
                    unit="years"
                    value={car.ownershipYears}
                    onChange={(v) => update({ ownershipYears: Math.max(1, v) })}
                    min={1}
                    hint="How long you plan to keep the car"
                  />
                  <ReadonlyField
                    label="Est. residual value"
                    value={`${residualPercent}%`}
                  />
                </div>
              </Section>
            )}

            {/* ── Loan main fields ─────────────────────────────────────── */}
            {car.financingMode === "loan" && (
              <Section label="Loan details">
                <div className="grid grid-cols-2 gap-2.5">
                  <NumericInput
                    label="Down payment"
                    unit="SEK"
                    value={car.loan.downPayment}
                    onChange={(v) => updateLoan({ downPayment: v })}
                    step={10000}
                    required
                    hint="Amount paid upfront"
                  />
                  <ReadonlyField
                    label="Loan amount"
                    value={loanAmount.toLocaleString("sv-SE")}
                    unit="SEK"
                  />
                  <NumericInput
                    label="Interest rate"
                    unit="%"
                    value={car.loan.interestRate}
                    onChange={(v) => updateLoan({ interestRate: v })}
                    step={0.1}
                    required
                    hint="Annual rate from your bank"
                  />
                  <NumericInput
                    label="Loan term"
                    unit="months"
                    value={car.loan.loanTermMonths}
                    onChange={(v) => updateLoan({ loanTermMonths: Math.max(1, v) })}
                    min={1}
                    required
                  />
                </div>
              </Section>
            )}

            {/* ── Leasing main fields ──────────────────────────────────── */}
            {car.financingMode === "leasing" && (
              <Section label="Lease details">
                <div className="grid grid-cols-2 gap-2.5">
                  <NumericInput
                    label="Monthly lease fee"
                    unit="SEK/mo"
                    value={car.leasing.monthlyLeaseCost}
                    onChange={(v) => updateLeasing({ monthlyLeaseCost: v })}
                    step={100}
                    required
                    hint="Monthly payment to dealer"
                  />
                  <NumericInput
                    label="Contract length"
                    unit="months"
                    value={car.leasing.leaseDurationMonths}
                    onChange={(v) => updateLeasing({ leaseDurationMonths: Math.max(1, v) })}
                    min={1}
                    required
                  />
                  <NumericInput
                    label="First payment"
                    unit="SEK"
                    value={car.leasing.downPayment}
                    onChange={(v) => updateLeasing({ downPayment: v })}
                    step={1000}
                    hint="Upfront / deposit payment"
                  />
                  <NumericInput
                    label="Included mileage"
                    unit="km/yr"
                    value={car.leasing.includedMileage}
                    onChange={(v) => updateLeasing({ includedMileage: v })}
                    step={1000}
                  />
                </div>
              </Section>
            )}
          </div>

          {/* ── Advanced toggle + panel ──────────────────────────────────── */}
          <div className="border-t border-border/40">
            <button
              type="button"
              onClick={() => setAdvancedOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary/20 transition-colors"
            >
              <span>Advanced settings</span>
              {advancedOpen
                ? <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                : <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              }
            </button>

            {advancedOpen && (
              <div className="px-5 pb-5 pt-4 space-y-5 bg-secondary/10 border-t border-border/30">

                {/* Running costs */}
                <Section label="Running costs">
                  <div className="grid grid-cols-2 gap-2.5">
                    <NumericInput
                      label="Fuel price"
                      unit={priceLabel}
                      value={car.fuelPrice}
                      onChange={(v) => update({ fuelPrice: v })}
                      step={0.1}
                    />
                    <NumericInput
                      label="Insurance"
                      unit="SEK/yr"
                      value={car.insuranceCost}
                      onChange={(v) => update({ insuranceCost: v })}
                      step={100}
                    />
                    <NumericInput
                      label="Road tax"
                      unit="SEK/yr"
                      value={car.taxCost}
                      onChange={(v) => update({ taxCost: v })}
                      step={100}
                    />
                    <NumericInput
                      label="Service & maint."
                      unit="SEK/yr"
                      value={car.serviceCost}
                      onChange={(v) => update({ serviceCost: v })}
                      step={100}
                    />
                  </div>
                </Section>

                {/* Loan optional extras */}
                {car.financingMode === "loan" && (
                  <Section label="Loan — optional">
                    <div className="grid grid-cols-2 gap-2.5">
                      <NumericInput
                        label="Balloon payment"
                        unit="SEK"
                        value={car.loan.residualBalloon}
                        onChange={(v) => updateLoan({ residualBalloon: v })}
                        hint="Optional residual at term end"
                      />
                      <NumericInput
                        label="Monthly admin fee"
                        unit="SEK/mo"
                        value={car.loan.monthlyAdminFee}
                        onChange={(v) => updateLoan({ monthlyAdminFee: v })}
                      />
                    </div>
                  </Section>
                )}

                {/* Lease optional extras */}
                {car.financingMode === "leasing" && (
                  <Section label="Lease — optional">
                    <div className="grid grid-cols-2 gap-2.5">
                      <NumericInput
                        label="Excess km cost"
                        unit="SEK/km"
                        value={car.leasing.excessMileageCostPerKm}
                        onChange={(v) => updateLeasing({ excessMileageCostPerKm: v })}
                        step={0.1}
                        hint="Cost per km over limit"
                      />
                      <NumericInput
                        label="End-of-term fee"
                        unit="SEK"
                        value={car.leasing.endOfTermFee}
                        onChange={(v) => updateLeasing({ endOfTermFee: v })}
                      />
                    </div>
                  </Section>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
