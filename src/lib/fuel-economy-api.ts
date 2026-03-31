import { FuelType } from "./car-types";

const BASE_URL = "https://www.fueleconomy.gov/ws/rest/vehicle";
const KM_PER_MILE = 1.609344;
const LITERS_PER_100KM_FROM_MPG = 235.214583;
const KWH_PER_GALLON_EQUIVALENT = 33.705;

export interface FuelEconomyOption {
  id: string;
  label: string;
}

export interface FuelEconomyVehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  optionLabel: string;
  rawFuelType: string;
  fuelType: FuelType;
  fuelConsumption: number;
  estimatedCo2GKm: number;
}

function normalizeLookupText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function parseXml(xml: string): Document {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error("Failed to parse live vehicle data.");
  }
  return doc;
}

function getText(parent: ParentNode, tagName: string): string {
  return parent.querySelector(tagName)?.textContent?.trim() ?? "";
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function mpgToL100Km(mpg: number): number {
  if (!Number.isFinite(mpg) || mpg <= 0) return 0;
  return roundToOneDecimal(LITERS_PER_100KM_FROM_MPG / mpg);
}

function kwhPer100MilesToKwhPer100Km(kwhPer100Miles: number): number {
  if (!Number.isFinite(kwhPer100Miles) || kwhPer100Miles <= 0) return 0;
  return roundToOneDecimal(kwhPer100Miles / KM_PER_MILE);
}

function mpgeToKwhPer100Miles(mpge: number): number {
  if (!Number.isFinite(mpge) || mpge <= 0) return 0;
  return (100 / mpge) * KWH_PER_GALLON_EQUIVALENT;
}

function gramsPerMileToGramsPerKm(gramsPerMile: number): number {
  if (!Number.isFinite(gramsPerMile) || gramsPerMile <= 0) return 0;
  return roundToOneDecimal(gramsPerMile / KM_PER_MILE);
}

function normalizeFuelType(
  rawFuelType: string,
  atvType: string,
  combinedElectricUse: number,
  fuelType1: string,
  fuelType2: string,
  engineDescription: string,
): FuelType {
  const normalized = [rawFuelType, fuelType1, fuelType2, atvType, engineDescription]
    .join(" ")
    .toLowerCase();
  const normalizedAtvType = atvType.toLowerCase();
  const hasElectricity = normalized.includes("electric");
  const hasCombustionFuel = /(gasoline|petrol|premium|diesel|ethanol|cng|natural gas)/.test(normalized);

  if (
    normalized.includes("hybrid") ||
    normalized.includes("plug-in") ||
    normalized.includes("phev") ||
    (hasElectricity && hasCombustionFuel)
  ) {
    return "hybrid";
  }

  if (
    normalizedAtvType.includes("ev") ||
    (hasElectricity && !hasCombustionFuel) ||
    combinedElectricUse > 0
  ) {
    return "electric";
  }

  if (normalized.includes("diesel")) return "diesel";
  return "petrol";
}

async function fetchXml(path: string, params: Record<string, string | number>): Promise<Document> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, String(value));
  });

  const response = await fetch(`${BASE_URL}/${path}?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error("Live vehicle source is temporarily unavailable.");
  }

  return parseXml(await response.text());
}

export async function fetchFuelEconomyModels(year: number, make: string): Promise<string[]> {
  const doc = await fetchXml("menu/model", { year, make });
  return Array.from(doc.querySelectorAll("menuItem"))
    .map((item) => getText(item, "text"))
    .filter(Boolean);
}

export async function fetchFuelEconomyMakes(year: number): Promise<string[]> {
  const doc = await fetchXml("menu/make", { year });
  return Array.from(doc.querySelectorAll("menuItem"))
    .map((item) => getText(item, "text"))
    .filter(Boolean);
}

export async function fetchFuelEconomyOptions(
  year: number,
  make: string,
  model: string,
): Promise<FuelEconomyOption[]> {
  const doc = await fetchXml("menu/options", { year, make, model });
  return Array.from(doc.querySelectorAll("menuItem"))
    .map((item) => ({
      id: getText(item, "value"),
      label: getText(item, "text"),
    }))
    .filter((item) => item.id && item.label);
}

export async function fetchFuelEconomyModelYears(
  make: string,
  model: string,
  minYear: number,
  maxYear: number,
): Promise<number[]> {
  if (!make.trim() || !model.trim() || minYear > maxYear) return [];

  const normalizedModel = normalizeLookupText(model);
  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, index) => maxYear - index,
  );

  const matches = await Promise.allSettled(
    years.map(async (year) => {
      const models = await fetchFuelEconomyModels(year, make);
      const hasMatch = models.some((candidate) => {
        const normalizedCandidate = normalizeLookupText(candidate);
        return (
          normalizedCandidate === normalizedModel ||
          normalizedCandidate.includes(normalizedModel) ||
          normalizedModel.includes(normalizedCandidate)
        );
      });
      return hasMatch ? year : null;
    }),
  );

  return matches
    .filter((result): result is PromiseFulfilledResult<number | null> => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((year): year is number => typeof year === "number")
    .sort((a, b) => b - a);
}

export async function fetchFuelEconomyVehicle(
  id: string,
  optionLabel: string,
): Promise<FuelEconomyVehicle> {
  const response = await fetch(`${BASE_URL}/${id}`);
  if (!response.ok) {
    throw new Error("Could not load official fuel data.");
  }

  const doc = parseXml(await response.text());
  const vehicle = doc.querySelector("vehicle");

  if (!vehicle) {
    throw new Error("Official fuel data response was empty.");
  }

  const rawFuelType = getText(vehicle, "fuelType") || getText(vehicle, "fuelType1");
  const fuelType1 = getText(vehicle, "fuelType1");
  const fuelType2 = getText(vehicle, "fuelType2");
  const combinedMpg = Number(getText(vehicle, "comb08"));
  const combinedElectricUse = Number(getText(vehicle, "combE"));
  const atvType = getText(vehicle, "atvType");
  const engineDescription = getText(vehicle, "eng_dscr");
  const phevCombinedMpg = Number(getText(vehicle, "phevComb"));
  const fuelType = normalizeFuelType(
    rawFuelType,
    atvType,
    combinedElectricUse,
    fuelType1,
    fuelType2,
    engineDescription,
  );
  const co2TailpipeGpm = Number(getText(vehicle, "co2TailpipeGpm"));

  const fuelConsumption =
    fuelType === "electric"
      ? kwhPer100MilesToKwhPer100Km(
          combinedElectricUse > 0 ? combinedElectricUse : mpgeToKwhPer100Miles(combinedMpg),
        )
      : mpgToL100Km(
          fuelType === "hybrid" && phevCombinedMpg > 0
            ? phevCombinedMpg
            : combinedMpg,
        );

  return {
    id,
    year: Number(getText(vehicle, "year")),
    make: getText(vehicle, "make"),
    model: getText(vehicle, "model"),
    optionLabel,
    rawFuelType,
    fuelType,
    fuelConsumption,
    estimatedCo2GKm: gramsPerMileToGramsPerKm(co2TailpipeGpm),
  };
}
