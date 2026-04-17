import type { PriceSource } from "./car-types";

export type MarketProviderCategory = "marketplace" | "dealer_inventory";

export interface MarketPriceEstimate {
  priceSek: number;
  sampleSize: number;
  provider: string;
  providerLabel: string;
  providerCategory?: MarketProviderCategory;
  sourceUrl: string;
  matchType: "exact_year" | "nearby_year" | "model_family";
}

export interface MarketPriceProviderAttempt {
  provider: string;
  providerLabel: string;
  providerCategory: MarketProviderCategory;
  realisticInProduction: boolean;
  attemptedUrls: string[];
  candidateCount: number;
  rejectionReasons: string[];
  notes?: string;
  durationMs?: number;
  hadEstimate: boolean;
  matchType: "exact_year" | "nearby_year" | "model_family" | null;
  sampleSize: number;
}

export interface MarketPriceDiagnostics {
  requestedAt: string;
  query: { brand: string; model: string; year: number };
  providersAttempted: MarketPriceProviderAttempt[];
  selectedProvider: {
    provider: string;
    providerLabel: string;
    providerCategory: MarketProviderCategory;
    matchType: MarketPriceEstimate["matchType"];
    sampleSize: number;
  } | null;
  fallbackReason: string | null;
  coverageSummary: {
    marketplaceProviders: number;
    dealerInventoryProviders: number;
    providersWithEstimate: number;
  };
}

export interface MarketPriceResponse {
  estimate: MarketPriceEstimate | null;
  diagnostics: MarketPriceDiagnostics | null;
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
  if (
    currentPriceSource === "manual" ||
    currentPriceSource === "official_new" ||
    currentPriceSource === "retailer_listing"
  ) {
    return false;
  }
  if (modelYear > currentYear) return false;

  const strongEstimate = isStrongMarketPriceEstimate(estimate);
  if (hasLocalModelMatch && !strongEstimate) return false;

  if (currentPriceSource === "market_listings") return true;
  if (currentPriceSource === "missing" || currentPurchasePrice <= 0) return true;
  if ((currentPriceSource === "historical_average" || currentPriceSource === "catalog_reference") && strongEstimate) {
    return true;
  }

  return false;
}

export async function fetchMarketPriceEstimate(
  brand: string,
  model: string,
  year: number,
): Promise<MarketPriceEstimate | null> {
  const result = await fetchMarketPriceResponse(brand, model, year);
  return result.estimate;
}

export async function fetchMarketPriceResponse(
  brand: string,
  model: string,
  year: number,
): Promise<MarketPriceResponse> {
  const searchParams = new URLSearchParams({
    brand,
    model,
    year: String(year),
  });

  const response = await fetch(`/api/market-price?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error("Swedish market price lookup is temporarily unavailable.");
  }

  const data = (await response.json()) as Partial<MarketPriceResponse>;
  return {
    estimate: data.estimate ?? null,
    diagnostics: data.diagnostics ?? null,
  };
}
