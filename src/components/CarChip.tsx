import { CarInput, CarResult, Currency, formatCurrency } from "@/lib/car-types";
import { BrandLogo } from "@/components/BrandLogo";
import { FuelBadge } from "@/components/FuelBadge";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";

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
  if (!car.isConfigured) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="w-[220px] h-[140px] shrink-0 rounded-xl border border-dashed border-border bg-card/60 hover:bg-card p-3 text-left"
      >
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center mb-2">
          <Plus className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">Car {index + 1}</p>
        <p className="text-xs text-muted-foreground mt-1">Tap to configure this car</p>
      </button>
    );
  }

  return (
    <div className="w-[220px] h-[140px] shrink-0 rounded-xl border border-border/70 bg-card p-3 relative group">
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0"
        aria-label={`Edit ${car.name || `Car ${index + 1}`}`}
      />

      <div className="relative z-[1] flex justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {car.brand && <BrandLogo brand={car.brand} size="sm" />}
            {car.fuelType && <FuelBadge fuelType={car.fuelType} />}
          </div>
          <p className="text-xs font-semibold truncate">{car.name || `Car ${index + 1}`}</p>
        </div>

        <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity relative z-[2] flex gap-1">
          <button type="button" onClick={onOpen} className="p-1 rounded hover:bg-secondary" aria-label="Edit car">
            <Pencil className="w-3 h-3" />
          </button>
          {canDuplicate && (
            <button type="button" onClick={onDuplicate} className="p-1 rounded hover:bg-secondary" aria-label="Duplicate car">
              <Copy className="w-3 h-3" />
            </button>
          )}
          {canRemove && (
            <button type="button" onClick={onRemove} className="p-1 rounded hover:bg-secondary" aria-label="Remove car">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className="relative z-[1] mt-3 space-y-0.5">
          <p className={`text-lg font-bold leading-none ${isWinner ? "text-highlight" : "text-foreground"}`}>
            {formatCurrency(result.monthlyCost, currency)}
          </p>
          <p className="text-[10px] text-muted-foreground">per month</p>
          <p className="text-[11px] text-muted-foreground">Total: {formatCurrency(result.totalOwnershipCost, currency)}</p>
        </div>
      )}
    </div>
  );
}
