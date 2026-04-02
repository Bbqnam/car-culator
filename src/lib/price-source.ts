import type { PriceSource } from "./car-types";

export interface PriceCandidate {
  priceSek: number;
  priceSource: Exclude<PriceSource, "manual" | "missing">;
  sourceLabel?: string;
  sourceUrl?: string;
  sourceCheckedAt?: string;
}

const AUTO_PRICE_SOURCE_PRIORITY: Record<PriceCandidate["priceSource"], number> = {
  official_new: 4,
  retailer_listing: 3,
  market_listings: 2,
  catalog_reference: 1,
  historical_average: 0,
};

export function getAutomaticPriceSourcePriority(source: PriceSource): number {
  if (source === "manual") return 99;
  if (source === "missing") return -1;
  return AUTO_PRICE_SOURCE_PRIORITY[source];
}

export function isFallbackPriceSource(source: PriceSource): boolean {
  return source === "catalog_reference" || source === "historical_average" || source === "missing";
}

export function choosePreferredPriceCandidate(
  candidates: Array<PriceCandidate | null | undefined>,
): PriceCandidate | null {
  const validCandidates = candidates.filter(
    (candidate): candidate is PriceCandidate => Boolean(candidate && candidate.priceSek > 0),
  );

  if (validCandidates.length === 0) return null;

  return [...validCandidates].sort((left, right) => {
    const priorityDifference =
      getAutomaticPriceSourcePriority(right.priceSource) - getAutomaticPriceSourcePriority(left.priceSource);
    if (priorityDifference !== 0) return priorityDifference;

    return right.priceSek - left.priceSek;
  })[0];
}
