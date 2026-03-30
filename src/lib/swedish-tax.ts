import { FuelType } from "./car-types";

export interface SwedishTaxEstimateInput {
  fuelType: FuelType;
  fuelConsumption: number;
  modelYear?: number | null;
  co2GKm?: number | null;
  referenceYear?: number;
}

export interface SwedishTaxEstimate {
  annualTaxSek: number;
  estimatedCo2GKm: number;
  isMalus: boolean;
}

const BASIC_CHARGE = 360;
const STANDARD_CO2_THRESHOLD = 111;
const STANDARD_CO2_RATE = 22;
const MALUS_LOW_THRESHOLD = 75;
const MALUS_HIGH_THRESHOLD = 125;
const MALUS_LOW_RATE = 107;
const MALUS_HIGH_RATE = 132;
const DIESEL_ENVIRONMENTAL_CHARGE = 250;
const DIESEL_FUEL_CHARGE_RATE = 13.52;
const LEGACY_DIESEL_FACTOR = 2.37;
const PETROL_CO2_PER_L100KM = 23.2;
const DIESEL_CO2_PER_L100KM = 26.4;

export function estimateCo2GKmFromConsumption(
  fuelType: FuelType,
  fuelConsumption: number,
): number {
  if (fuelType === "electric" || fuelConsumption <= 0) return 0;
  const factor = fuelType === "diesel" ? DIESEL_CO2_PER_L100KM : PETROL_CO2_PER_L100KM;
  return Math.round(fuelConsumption * factor * 10) / 10;
}

function estimateStandardCo2Charge(co2GKm: number): number {
  return Math.max(0, co2GKm - STANDARD_CO2_THRESHOLD) * STANDARD_CO2_RATE;
}

function estimateMalusCo2Charge(co2GKm: number): number {
  if (co2GKm <= MALUS_LOW_THRESHOLD) return 0;
  if (co2GKm <= MALUS_HIGH_THRESHOLD) {
    return (co2GKm - MALUS_LOW_THRESHOLD) * MALUS_LOW_RATE;
  }
  return (
    (MALUS_HIGH_THRESHOLD - MALUS_LOW_THRESHOLD) * MALUS_LOW_RATE +
    (co2GKm - MALUS_HIGH_THRESHOLD) * MALUS_HIGH_RATE
  );
}

function isLikelyMalusVehicle(modelYear: number | null | undefined, referenceYear: number): boolean {
  if (!modelYear || modelYear < 2018) return false;
  return modelYear >= referenceYear - 3;
}

export function estimateSwedishVehicleTax({
  fuelType,
  fuelConsumption,
  modelYear,
  co2GKm,
  referenceYear = new Date().getFullYear(),
}: SwedishTaxEstimateInput): SwedishTaxEstimate {
  const estimatedCo2GKm = Math.max(
    0,
    Math.round((co2GKm ?? estimateCo2GKmFromConsumption(fuelType, fuelConsumption)) * 10) / 10,
  );

  if (fuelType === "electric") {
    return {
      annualTaxSek: BASIC_CHARGE,
      estimatedCo2GKm: 0,
      isMalus: false,
    };
  }

  const isMalus = isLikelyMalusVehicle(modelYear, referenceYear);

  if (isMalus) {
    const annualTaxSek = BASIC_CHARGE + estimateMalusCo2Charge(estimatedCo2GKm);
    const dieselCharges =
      fuelType === "diesel"
        ? DIESEL_ENVIRONMENTAL_CHARGE + estimatedCo2GKm * DIESEL_FUEL_CHARGE_RATE
        : 0;

    return {
      annualTaxSek: Math.round(annualTaxSek + dieselCharges),
      estimatedCo2GKm,
      isMalus: true,
    };
  }

  const standardTax = BASIC_CHARGE + estimateStandardCo2Charge(estimatedCo2GKm);

  if (fuelType === "diesel") {
    if (modelYear && modelYear < 2018) {
      return {
        annualTaxSek: Math.round(standardTax * LEGACY_DIESEL_FACTOR),
        estimatedCo2GKm,
        isMalus: false,
      };
    }

    return {
      annualTaxSek: Math.round(
        standardTax +
          DIESEL_ENVIRONMENTAL_CHARGE +
          estimatedCo2GKm * DIESEL_FUEL_CHARGE_RATE,
      ),
      estimatedCo2GKm,
      isMalus: false,
    };
  }

  return {
    annualTaxSek: Math.round(standardTax),
    estimatedCo2GKm,
    isMalus: false,
  };
}
