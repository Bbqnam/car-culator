import { FuelType } from "@/lib/car-types";
import { useI18n } from "@/lib/i18n";

const FUEL_STYLES: Record<FuelType, string> = {
  electric: "bg-fuel-electric-soft text-fuel-electric",
  petrol: "bg-fuel-petrol-soft text-fuel-petrol",
  diesel: "bg-fuel-diesel-soft text-fuel-diesel",
};

export function FuelBadge({ fuelType }: { fuelType: FuelType }) {
  const { language } = useI18n();
  const FUEL_LABELS: Record<FuelType, string> = {
    electric: language === "sv" ? "El" : "Electric",
    petrol: language === "sv" ? "Bensin" : "Petrol",
    diesel: "Diesel",
  };

  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${FUEL_STYLES[fuelType]}`}>
      {FUEL_LABELS[fuelType]}
    </span>
  );
}
