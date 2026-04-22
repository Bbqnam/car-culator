import type { PriceSource } from "./car-types";

export interface MarketPriceEstimate {
  priceSek: number;
  sampleSize: number;
  provider: string;
  providerLabel: string;
  sourceUrl: string;
  matchType: "exact_year" | "nearby_year" | "model_family";
}

export type MarketPriceCoverageStatus = "queried" | "not_implemented";
export type MarketPriceAttemptStatus =
  | "success"
  | "request_failed"
  | "filter_missing"
  | "no_listings"
  | "match_failed"
  | "no_price"
  | "rejected";

export interface MarketPriceRejectedSource {
  provider: string;
  strategy: string;
  listingId: string;
  title: string;
  priceSek: number | null;
  reason: string;
  detail: string;
  sourceUrl: string;
}

export interface MarketPriceAttempt {
  provider: string;
  strategy: string;
  status: MarketPriceAttemptStatus;
  url?: string;
  detail?: string;
  listingCount?: number;
  matchedCount?: number;
  sampleSize?: number;
  matchType?: MarketPriceEstimate["matchType"];
  rejectedCount?: number;
  rejectionReasons?: string[];
}

export interface MarketPriceDiagnostics {
  requested: {
    brand: string;
    model: string;
    year: number;
  };
  coverage: {
    bilweb: MarketPriceCoverageStatus;
    blocket: MarketPriceCoverageStatus;
    dealerPages: MarketPriceCoverageStatus;
  };
  selectedProvider?: string;
  selectedStrategy?: string;
  fallbackReason?: string;
  rejectedSources: MarketPriceRejectedSource[];
  attempts: MarketPriceAttempt[];
}

export interface MarketPriceLookupResult {
  estimate: MarketPriceEstimate | null;
  diagnostics?: MarketPriceDiagnostics;
}

export function isStrongMarketPriceEstimate(estimate: MarketPriceEstimate | null | undefined): boolean {
  if (!estimate) return false;
  return estimate.matchType !== "model_family" && estimate.sampleSize >= 2;
}

export function isActionableMarketPriceEstimate(estimate: MarketPriceEstimate | null | undefined): boolean {
  if (!estimate) return false;

  if (estimate.matchType === "exact_year") return estimate.sampleSize >= 1;
  if (estimate.matchType === "nearby_year") return estimate.sampleSize >= 2;
  return estimate.sampleSize >= 3;
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
  const actionableEstimate = isActionableMarketPriceEstimate(estimate);

  if (currentPriceSource === "market_listings") return true;

  if (currentPriceSource === "missing" || currentPurchasePrice <= 0) {
    return actionableEstimate;
  }

  if (hasLocalModelMatch) {
    if (currentPriceSource === "historical_average" || currentPriceSource === "catalog_reference") {
      return actionableEstimate;
    }

    return strongEstimate;
  }

  if (currentPriceSource === "historical_average" || currentPriceSource === "catalog_reference") {
    return actionableEstimate;
  }

  return actionableEstimate;
}

export async function fetchMarketPriceLookup(
  brand: string,
  model: string,
  year: number,
): Promise<MarketPriceLookupResult> {
  const searchParams = new URLSearchParams({
    brand,
    model,
    year: String(year),
  });

  const response = await fetch(`/api/market-price?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error("Swedish market price lookup is temporarily unavailable.");
  }

  const data = (await response.json()) as MarketPriceLookupResult;
  return {
    estimate: data.estimate ?? null,
    diagnostics: data.diagnostics
      ? {
          ...data.diagnostics,
          rejectedSources: data.diagnostics.rejectedSources ?? [],
        }
      : undefined,
  };
}

export async function fetchMarketPriceEstimate(
  brand: string,
  model: string,
  year: number,
): Promise<MarketPriceEstimate | null> {
  const lookup = await fetchMarketPriceLookup(brand, model, year);
  return lookup.estimate;
}
