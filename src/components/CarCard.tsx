import { CarInput, FuelType, calculateResidualPercent } from "@/lib/car-types";
import { getBrands, getModels, findCarModel, getDefaultFuelPrice } from "@/lib/car-database";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Car } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { FuelBadge } from "@/components/FuelBadge";

interface CarCardProps {
  car: CarInput;
  index: number;
  canRemove: boolean;
  onChange: (car: CarInput) => void;
  onRemove: () => void;
}

function Field({ label, unit, value, onChange, min = 0, step = 1 }: {
  label: string; unit?: string; value: number; onChange: (v: number) => void; min?: number; step?: number;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          step={step}
          className="h-9 text-sm pr-12 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-accent/40"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function ReadonlyField({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="h-9 flex items-center text-sm text-muted-foreground px-3 rounded-md bg-secondary/30">
        {value}{unit ? ` ${unit}` : ""}
      </div>
    </div>
  );
}

export function CarCard({ car, index, canRemove, onChange, onRemove }: CarCardProps) {
  const brands = getBrands();
  const models = car.brand ? getModels(car.brand) : [];

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
    });
  };

  const update = (partial: Partial<CarInput>) => {
    onChange({ ...car, ...partial });
  };

  const handleFuelTypeChange = (ft: FuelType) => {
    update({
      fuelType: ft,
      fuelPrice: getDefaultFuelPrice(ft),
    });
  };

  const fuelLabel = car.fuelType === "electric" ? "kWh/100km" : "L/100km";
  const priceLabel = car.fuelType === "electric" ? "SEK/kWh" : "SEK/L";
  const residualPercent = calculateResidualPercent(car.ownershipYears, car.fuelType);

  const currentModel = car.brand && car.model ? findCarModel(car.brand, car.model) : null;
  const hasSingleFuelType = !!currentModel;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/60 space-y-4 relative group">
      {canRemove && (
        <button
          onClick={onRemove}
          className="absolute top-3 right-3 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary"
          aria-label="Remove car"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      <div className="space-y-3">
        {/* Header: show car name after config, otherwise show "Car N" placeholder */}
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
            <Label className="text-xs text-muted-foreground">Model</Label>
            <Select
              value={car.model || undefined}
              onValueChange={handleModelChange}
              disabled={!car.brand}
            >
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Purchase price" unit="SEK" value={car.purchasePrice} onChange={(v) => update({ purchasePrice: v })} step={10000} />
            <Field label="Ownership" unit="years" value={car.ownershipYears} onChange={(v) => update({ ownershipYears: Math.max(1, v) })} min={1} />
            <Field label="Annual mileage" unit="km" value={car.annualMileage} onChange={(v) => update({ annualMileage: v })} step={1000} />

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Fuel type</Label>
              {hasSingleFuelType ? (
                <div className="h-9 flex items-center px-3 rounded-md bg-secondary/30">
                  <FuelBadge fuelType={car.fuelType} />
                </div>
              ) : (
                <Select value={car.fuelType} onValueChange={(v: FuelType) => handleFuelTypeChange(v)}>
                  <SelectTrigger className="h-9 text-sm bg-secondary/50 border-0">
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

            <Field label="Consumption" unit={fuelLabel} value={car.fuelConsumption} onChange={(v) => update({ fuelConsumption: v })} step={0.1} />
            <Field label="Fuel price" unit={priceLabel} value={car.fuelPrice} onChange={(v) => update({ fuelPrice: v })} step={0.1} />
            <Field label="Insurance" unit="SEK/yr" value={car.insuranceCost} onChange={(v) => update({ insuranceCost: v })} step={100} />
            <Field label="Tax" unit="SEK/yr" value={car.taxCost} onChange={(v) => update({ taxCost: v })} step={100} />
            <Field label="Service & maint." unit="SEK/yr" value={car.serviceCost} onChange={(v) => update({ serviceCost: v })} step={100} />
            <ReadonlyField label="Residual value" value={`${residualPercent}%`} />
          </div>
        </div>
      )}
    </div>
  );
}
