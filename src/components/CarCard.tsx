import { CarInput, FuelType, FinancingMode, calculateResidualPercent } from "@/lib/car-types";
import { getBrands, getModels, findCarModel, getDefaultFuelPrice } from "@/lib/car-database";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Car } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { FuelBadge } from "@/components/FuelBadge";
import { FinancingSelector } from "@/components/FinancingSelector";
import { NumericInput, ReadonlyField } from "@/components/NumericInput";

interface CarCardProps {
  car: CarInput;
  index: number;
  canRemove: boolean;
  onChange: (car: CarInput) => void;
  onRemove: () => void;
}

export function CarCard({ car, index, canRemove, onChange, onRemove }: CarCardProps) {
  const brands = getBrands();
  const models = car.brand ? getModels(car.brand) : [];

  const handleBrandChange = (brand: string) => {
    onChange({
      ...car, brand, model: "", name: "", purchasePrice: 0,
      fuelType: "petrol", fuelConsumption: 0, taxCost: 0, serviceCost: 0, isConfigured: false,
    });
  };

  const handleModelChange = (modelName: string) => {
    const carModel = findCarModel(car.brand, modelName);
    if (!carModel) return;
    onChange({
      ...car, model: modelName, name: `${car.brand} ${modelName}`,
      purchasePrice: carModel.purchasePrice, fuelType: carModel.fuelType,
      fuelConsumption: carModel.fuelConsumption, fuelPrice: getDefaultFuelPrice(carModel.fuelType),
      taxCost: carModel.taxCost, serviceCost: carModel.serviceCost, isConfigured: true,
      loan: { ...car.loan, downPayment: Math.round(carModel.purchasePrice * 0.2) },
    });
  };

  const update = (partial: Partial<CarInput>) => onChange({ ...car, ...partial });
  const updateLoan = (partial: Partial<CarInput["loan"]>) => update({ loan: { ...car.loan, ...partial } });
  const updateLeasing = (partial: Partial<CarInput["leasing"]>) => update({ leasing: { ...car.leasing, ...partial } });

  const handleFuelTypeChange = (ft: FuelType) => {
    update({ fuelType: ft, fuelPrice: getDefaultFuelPrice(ft) });
  };

  const fuelLabel = car.fuelType === "electric" ? "kWh/100km" : "L/100km";
  const priceLabel = car.fuelType === "electric" ? "SEK/kWh" : "SEK/L";
  const currentModel = car.brand && car.model ? findCarModel(car.brand, car.model) : null;
  const hasSingleFuelType = !!currentModel;

  const ownershipYears = car.financingMode === "loan"
    ? car.loan.loanTermMonths / 12
    : car.financingMode === "leasing"
    ? car.leasing.leaseDurationMonths / 12
    : car.ownershipYears;

  const residualPercent = calculateResidualPercent(ownershipYears, car.fuelType);

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/60 space-y-4 relative group">
      {canRemove && (
        <button onClick={onRemove}
          className="absolute top-3 right-3 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary"
          aria-label="Remove car">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      <div className="space-y-3">
        {car.isConfigured && car.name ? (
          <div className="flex items-center gap-2.5">
            <BrandLogo brand={car.brand} size="md" />
            <div className="min-w-0">
              <span className="font-semibold text-sm block truncate">{car.name}</span>
              <FuelBadge fuelType={car.fuelType} />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {car.brand && <BrandLogo brand={car.brand} />}
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Car {index + 1}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Brand</Label>
            <Select value={car.brand || undefined} onValueChange={handleBrandChange}>
              <SelectTrigger className="h-10 text-sm bg-secondary/50 border-0">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>
                    <span className="flex items-center gap-2"><BrandLogo brand={b} />{b}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Model</Label>
            <Select value={car.model || undefined} onValueChange={handleModelChange} disabled={!car.brand}>
              <SelectTrigger className="h-10 text-sm bg-secondary/50 border-0">
                <SelectValue placeholder={car.brand ? "Select model" : "Pick brand first"} />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.model} value={m.model}>{m.model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {!car.isConfigured && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
            <Car className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Select a brand and model to get started</p>
        </div>
      )}

      {car.isConfigured && (
        <div className="space-y-3 pt-1">
          <div className="h-px bg-border/60" />

          <FinancingSelector value={car.financingMode} onChange={(m) => update({ financingMode: m })} />

          <div className="grid grid-cols-2 gap-3">
            {/* Common fields */}
            <NumericInput label="Purchase price" unit="SEK" value={car.purchasePrice} onChange={(v) => update({ purchasePrice: v })} step={10000} />
            <NumericInput label="Annual mileage" unit="km" value={car.annualMileage} onChange={(v) => update({ annualMileage: v })} step={1000} />

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Fuel type</Label>
              {hasSingleFuelType ? (
                <div className="h-9 flex items-center px-3 rounded-md bg-secondary/30">
                  <FuelBadge fuelType={car.fuelType} />
                </div>
              ) : (
                <Select value={car.fuelType} onValueChange={(v: FuelType) => handleFuelTypeChange(v)}>
                  <SelectTrigger className="h-9 text-sm bg-secondary/50 border-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="petrol">Petrol</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <NumericInput label="Consumption" unit={fuelLabel} value={car.fuelConsumption} onChange={(v) => update({ fuelConsumption: v })} step={0.1} />
            <NumericInput label="Fuel price" unit={priceLabel} value={car.fuelPrice} onChange={(v) => update({ fuelPrice: v })} step={0.1} />
            <NumericInput label="Insurance" unit="SEK/yr" value={car.insuranceCost} onChange={(v) => update({ insuranceCost: v })} step={100} />
            <NumericInput label="Tax" unit="SEK/yr" value={car.taxCost} onChange={(v) => update({ taxCost: v })} step={100} />
            <NumericInput label="Service & maint." unit="SEK/yr" value={car.serviceCost} onChange={(v) => update({ serviceCost: v })} step={100} />

            {/* Mode-specific fields */}
            {car.financingMode === "cash" && (
              <>
                <NumericInput label="Ownership" unit="years" value={car.ownershipYears} onChange={(v) => update({ ownershipYears: Math.max(1, v) })} min={1} />
                <ReadonlyField label="Residual value" value={`${residualPercent}%`} />
              </>
            )}

            {car.financingMode === "loan" && (
              <>
                <NumericInput label="Down payment" unit="SEK" value={car.loan.downPayment} onChange={(v) => updateLoan({ downPayment: v })} step={10000} />
                <ReadonlyField label="Loan amount" value={(car.purchasePrice - car.loan.downPayment).toLocaleString("sv-SE")} unit="SEK" />
                <NumericInput label="Interest rate" unit="%" value={car.loan.interestRate} onChange={(v) => updateLoan({ interestRate: v })} step={0.1} />
                <NumericInput label="Loan term" unit="months" value={car.loan.loanTermMonths} onChange={(v) => updateLoan({ loanTermMonths: Math.max(1, v) })} min={1} />
                <NumericInput label="Balloon / residual" unit="SEK" value={car.loan.residualBalloon} onChange={(v) => updateLoan({ residualBalloon: v })} />
                <NumericInput label="Admin fee" unit="SEK/mo" value={car.loan.monthlyAdminFee} onChange={(v) => updateLoan({ monthlyAdminFee: v })} />
              </>
            )}

            {car.financingMode === "leasing" && (
              <>
                <NumericInput label="Monthly lease" unit="SEK/mo" value={car.leasing.monthlyLeaseCost} onChange={(v) => updateLeasing({ monthlyLeaseCost: v })} step={100} />
                <NumericInput label="First payment" unit="SEK" value={car.leasing.downPayment} onChange={(v) => updateLeasing({ downPayment: v })} step={1000} />
                <NumericInput label="Lease duration" unit="months" value={car.leasing.leaseDurationMonths} onChange={(v) => updateLeasing({ leaseDurationMonths: Math.max(1, v) })} min={1} />
                <NumericInput label="Included mileage" unit="km/yr" value={car.leasing.includedMileage} onChange={(v) => updateLeasing({ includedMileage: v })} step={1000} />
                <NumericInput label="Excess km cost" unit="SEK/km" value={car.leasing.excessMileageCostPerKm} onChange={(v) => updateLeasing({ excessMileageCostPerKm: v })} step={0.1} />
                <NumericInput label="End-of-term fee" unit="SEK" value={car.leasing.endOfTermFee} onChange={(v) => updateLeasing({ endOfTermFee: v })} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
