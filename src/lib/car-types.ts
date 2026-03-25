export type FuelType = "petrol" | "diesel" | "electric";
export type Currency = "SEK" | "EUR";

export interface CarInput {
  id: string;
  name: string;
  purchasePrice: number;
  ownershipYears: number;
  annualMileage: number;
  fuelType: FuelType;
  fuelConsumption: number; // L/100km or kWh/100km
  fuelPrice: number; // SEK per L or kWh
  insuranceCost: number; // per year
  taxCost: number; // per year
  serviceCost: number; // per year
  residualValuePercent: number; // %
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
  // Rough depreciation curve
  if (years <= 1) return 75;
  if (years <= 2) return 60;
  if (years <= 3) return 50;
  if (years <= 5) return 35;
  if (years <= 7) return 25;
  return 15;
}

export function createDefaultCar(id: string, index: number): CarInput {
  const defaults: Partial<CarInput>[] = [
    {
      name: "Volvo XC40 T2",
      purchasePrice: 380000,
      fuelType: "petrol",
      fuelConsumption: 7.2,
      fuelPrice: 18.5,
      insuranceCost: 7200,
      taxCost: 1800,
      serviceCost: 5000,
    },
    {
      name: "Tesla Model 3",
      purchasePrice: 420000,
      fuelType: "electric",
      fuelConsumption: 15,
      fuelPrice: 2.2,
      insuranceCost: 8500,
      taxCost: 360,
      serviceCost: 3000,
    },
    {
      name: "VW Golf 1.5 TSI",
      purchasePrice: 310000,
      fuelType: "petrol",
      fuelConsumption: 6.0,
      fuelPrice: 18.5,
      insuranceCost: 5500,
      taxCost: 1400,
      serviceCost: 4500,
    },
  ];

  const d = defaults[index] || defaults[0]!;
  const years = 5;

  return {
    id,
    name: d.name || "New Car",
    purchasePrice: d.purchasePrice || 300000,
    ownershipYears: years,
    annualMileage: 15000,
    fuelType: d.fuelType || "petrol",
    fuelConsumption: d.fuelConsumption || 7,
    fuelPrice: d.fuelPrice || 18.5,
    insuranceCost: d.insuranceCost || 6000,
    taxCost: d.taxCost || 1500,
    serviceCost: d.serviceCost || 4000,
    residualValuePercent: getDefaultResidualPercent(years),
  };
}

export const SEK_TO_EUR = 0.088;

export function formatCurrency(value: number, currency: Currency): string {
  if (currency === "EUR") {
    return `€${Math.round(value * SEK_TO_EUR).toLocaleString("sv-SE")}`;
  }
  return `${Math.round(value).toLocaleString("sv-SE")} kr`;
}
