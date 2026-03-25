export type FuelType = "petrol" | "diesel" | "electric";
export type Currency = "SEK" | "EUR";

export interface CarInput {
  id: string;
  brand: string;
  model: string;
  name: string;
  purchasePrice: number;
  ownershipYears: number;
  annualMileage: number;
  fuelType: FuelType;
  fuelConsumption: number;
  fuelPrice: number;
  insuranceCost: number;
  taxCost: number;
  serviceCost: number;
  residualValuePercent: number;
  isConfigured: boolean;
}

export interface CarResult {
  id: string;
  name: string;
  annualFuelCost: number;
  totalDepreciation: number;
  totalOwnershipCost: number;
  monthlyCost: number;
  yearlyCost: number;
}

export function calculateResults(car: CarInput): CarResult {
  const annualFuelCost = (car.annualMileage / 100) * car.fuelConsumption * car.fuelPrice;
  const residualValue = car.purchasePrice * (car.residualValuePercent / 100);
  const totalDepreciation = car.purchasePrice - residualValue;
  const totalOwnershipCost =
    totalDepreciation +
    (annualFuelCost + car.insuranceCost + car.taxCost + car.serviceCost) * car.ownershipYears;
  const monthlyCost = totalOwnershipCost / (car.ownershipYears * 12);
  const yearlyCost = totalOwnershipCost / car.ownershipYears;

  return {
    id: car.id,
    name: car.name || "Unnamed Car",
    annualFuelCost: Math.round(annualFuelCost),
    totalDepreciation: Math.round(totalDepreciation),
    totalOwnershipCost: Math.round(totalOwnershipCost),
    monthlyCost: Math.round(monthlyCost),
    yearlyCost: Math.round(yearlyCost),
  };
}

export function getDefaultResidualPercent(years: number): number {
  if (years <= 1) return 75;
  if (years <= 2) return 60;
  if (years <= 3) return 50;
  if (years <= 5) return 35;
  if (years <= 7) return 25;
  return 15;
}

export function createEmptyCar(id: string): CarInput {
  return {
    id,
    brand: "",
    model: "",
    name: "",
    purchasePrice: 0,
    ownershipYears: 5,
    annualMileage: 15000,
    fuelType: "petrol",
    fuelConsumption: 0,
    fuelPrice: 18.5,
    insuranceCost: 6000,
    taxCost: 0,
    serviceCost: 0,
    residualValuePercent: 35,
    isConfigured: false,
  };
}

export const SEK_TO_EUR = 0.088;

export function formatCurrency(value: number, currency: Currency): string {
  if (currency === "EUR") {
    return `€${Math.round(value * SEK_TO_EUR).toLocaleString("sv-SE")}`;
  }
  return `${Math.round(value).toLocaleString("sv-SE")} kr`;
}
