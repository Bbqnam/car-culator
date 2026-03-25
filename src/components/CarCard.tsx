import { CarInput, FuelType, getDefaultResidualPercent } from "@/lib/car-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

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
          className="h-9 text-sm pr-12 bg-secondary/50 border-0 focus-visible:ring-1"
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

export function CarCard({ car, index, canRemove, onChange, onRemove }: CarCardProps) {
  const update = (partial: Partial<CarInput>) => {
    const updated = { ...car, ...partial };
    onChange(updated);
  };

  const fuelLabel = car.fuelType === "electric" ? "kWh/100km" : "L/100km";
  const priceLabel = car.fuelType === "electric" ? "SEK/kWh" : "SEK/L";

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

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Car {index + 1}</Label>
        <Input
          value={car.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="Car name / model"
          className="h-10 text-base font-medium bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-foreground"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Purchase price" unit="SEK" value={car.purchasePrice} onChange={(v) => update({ purchasePrice: v })} step={10000} />
        <Field label="Ownership" unit="years" value={car.ownershipYears} onChange={(v) => update({ ownershipYears: v, residualValuePercent: getDefaultResidualPercent(v) })} min={1} />
        <Field label="Annual mileage" unit="km" value={car.annualMileage} onChange={(v) => update({ annualMileage: v })} step={1000} />
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Fuel type</Label>
          <Select value={car.fuelType} onValueChange={(v: FuelType) => update({ fuelType: v })}>
            <SelectTrigger className="h-9 text-sm bg-secondary/50 border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="petrol">Petrol</SelectItem>
              <SelectItem value="diesel">Diesel</SelectItem>
              <SelectItem value="electric">Electric</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Field label="Consumption" unit={fuelLabel} value={car.fuelConsumption} onChange={(v) => update({ fuelConsumption: v })} step={0.1} />
        <Field label="Fuel price" unit={priceLabel} value={car.fuelPrice} onChange={(v) => update({ fuelPrice: v })} step={0.1} />
        <Field label="Insurance" unit="SEK/yr" value={car.insuranceCost} onChange={(v) => update({ insuranceCost: v })} step={100} />
        <Field label="Tax" unit="SEK/yr" value={car.taxCost} onChange={(v) => update({ taxCost: v })} step={100} />
        <Field label="Service & maint." unit="SEK/yr" value={car.serviceCost} onChange={(v) => update({ serviceCost: v })} step={100} />
        <Field label="Residual value" unit="%" value={car.residualValuePercent} onChange={(v) => update({ residualValuePercent: v })} />
      </div>
    </div>
  );
}
