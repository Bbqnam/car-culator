export const EU_EV_SOURCE_URL =
  "https://alternative-fuels-observatory.ec.europa.eu/markets-and-policy/market-and-consumer-insights/available-electric-vehicle-models";

export interface EuEvVariant {
  id: string;
  brand: string;
  title: string;
  modelHint: string;
  availableFrom: string;
  availableFromYear: number | null;
  efficiencyKwh100km: number;
  batteryKwh: number | null;
  rangeKm: number | null;
  priceEur: number | null;
  source: "eu-afo";
}

export interface EuEvModelCatalogEntry {
  model: string;
  fuelType: "electric";
  variantCount: number;
  averageEfficiencyKwh100km: number;
  averagePriceEur: number | null;
}

export async function fetchEuEvBrands(year: number): Promise<string[]> {
  const response = await fetch(`/api/eu-ev-brands?year=${year}`);
  if (!response.ok) {
    throw new Error("EU EV brand catalog is temporarily unavailable.");
  }

  const data = (await response.json()) as { brands?: string[] };
  return Array.isArray(data.brands) ? data.brands : [];
}

export async function fetchEuEvModels(
  brand: string,
  year: number,
): Promise<EuEvModelCatalogEntry[]> {
  const searchParams = new URLSearchParams({
    brand,
    year: String(year),
  });
  const response = await fetch(`/api/eu-ev-models?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error("EU EV model catalog is temporarily unavailable.");
  }

  const data = (await response.json()) as { models?: EuEvModelCatalogEntry[] };
  return Array.isArray(data.models) ? data.models : [];
}

export async function fetchEuEvVariants(
  brand: string,
  model: string,
  year: number,
): Promise<EuEvVariant[]> {
  const searchParams = new URLSearchParams({
    brand,
    model,
    year: String(year),
  });

  const response = await fetch(`/api/eu-ev-lookup?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error("EU EV lookup is temporarily unavailable.");
  }

  const data = (await response.json()) as { variants?: EuEvVariant[] };
  return Array.isArray(data.variants) ? data.variants : [];
}
