import { FuelType } from "@/lib/car-types";

const FUEL_STYLES: Record<FuelType, string> = {
  electric: "bg-fuel-electric-soft text-fuel-electric",
  petrol: "bg-fuel-petrol-soft text-fuel-petrol",
  diesel: "bg-fuel-diesel-soft text-fuel-diesel",
};

const FUEL_LABELS: Record<FuelType, string> = {
  electric: "Electric",
  petrol: "Petrol",
  diesel: "Diesel",
};

export function FuelBadge({ fuelType }: { fuelType: FuelType }) {
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${FUEL_STYLES[fuelType]}`}>
      {FUEL_LABELS[fuelType]}
    </span>
  );
}
