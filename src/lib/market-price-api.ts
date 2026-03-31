import type { PriceSource } from "./car-types";

export interface MarketPriceEstimate {
  priceSek: number;
  sampleSize: number;
  provider: string;
  providerLabel: string;
  sourceUrl: string;
  matchType: "exact_year" | "nearby_year" | "model_family";
}

export function isStrongMarketPriceEstimate(estimate: MarketPriceEstimate | null | undefined): boolean {
  if (!estimate) return false;
  return estimate.matchType !== "model_family" && estimate.sampleSize >= 2;
}

export function shouldPreferMarketPriceEstimate({
  currentPriceSource,
  currentPurchasePrice,
  hasLocalModelMatch,
  modelYear,
  estimate,
  currentYear = new Date().getFullYear(),
}: {
  currentPriceSource: PriceSource;
  currentPurchasePrice: number;
  hasLocalModelMatch: boolean;
  modelYear: number;
  estimate: MarketPriceEstimate | null | undefined;
  currentYear?: number;
}): boolean {
  if (!estimate) return false;
  if (currentPriceSource === "manual" || currentPriceSource === "official_new") return false;
  if (modelYear > currentYear) return false;

  const strongEstimate = isStrongMarketPriceEstimate(estimate);
  if (hasLocalModelMatch && !strongEstimate) return false;

  if (currentPriceSource === "market_listings") return true;
  if (currentPriceSource === "missing" || currentPurchasePrice <= 0) return true;
  if (currentPriceSource === "historical_average" && strongEstimate) return true;

  return false;
}

export async function fetchMarketPriceEstimate(
  brand: string,
  model: string,
  year: number,
): Promise<MarketPriceEstimate | null> {
  const searchParams = new URLSearchParams({
    brand,
    model,
    year: String(year),
  });

  const response = await fetch(`/api/market-price?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error("Swedish market price lookup is temporarily unavailable.");
  }

  const data = (await response.json()) as { estimate?: MarketPriceEstimate | null };
  return data.estimate ?? null;
}
