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
  isConfigured: boolean;
}

export interface CostBreakdown {
  fuel: number;
  insurance: number;
  tax: number;
  service: number;
  depreciation: number;
}

export interface CarResult {
  id: string;
  name: string;
  annualFuelCost: number;
  totalDepreciation: number;
  totalOwnershipCost: number;
  monthlyCost: number;
  yearlyCost: number;
  residualValuePercent: number;
  breakdown: CostBreakdown;
}

export function calculateResidualPercent(years: number, fuelType: FuelType): number {
  if (years <= 0) return 100;
  const firstYearRetention = fuelType === "electric" ? 0.75 : 0.80;
  const annualRetention = fuelType === "electric" ? 0.88 : 0.87;
  if (years <= 1) {
    return Math.round((1 - (1 - firstYearRetention) * years) * 100);
  }
  const remainingYears = years - 1;
  const residual = firstYearRetention * Math.pow(annualRetention, remainingYears);
  return Math.round(Math.max(residual * 100, 5));
}

export function calculateResults(car: CarInput): CarResult {
  const residualPercent = calculateResidualPercent(car.ownershipYears, car.fuelType);
  const annualFuelCost = (car.annualMileage / 100) * car.fuelConsumption * car.fuelPrice;
  const residualValue = car.purchasePrice * (residualPercent / 100);
  const totalDepreciation = car.purchasePrice - residualValue;
  const totalFuel = annualFuelCost * car.ownershipYears;
  const totalInsurance = car.insuranceCost * car.ownershipYears;
  const totalTax = car.taxCost * car.ownershipYears;
  const totalService = car.serviceCost * car.ownershipYears;
  const totalOwnershipCost = totalDepreciation + totalFuel + totalInsurance + totalTax + totalService;
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
    residualValuePercent: residualPercent,
    breakdown: {
      fuel: Math.round(totalFuel),
      insurance: Math.round(totalInsurance),
      tax: Math.round(totalTax),
      service: Math.round(totalService),
      depreciation: Math.round(totalDepreciation),
    },
  };
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
