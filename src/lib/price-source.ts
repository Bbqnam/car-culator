import type { PriceSource } from "./car-types";

export type PriceSourceConfidence = "high" | "medium" | "low";

export interface PriceCandidate {
  priceSek: number;
  priceSource: Exclude<PriceSource, "manual" | "missing">;
  sourceLabel?: string;
  sourceUrl?: string;
  sourceCheckedAt?: string;
  isValidated?: boolean;
}

export interface RejectedPriceCandidate {
  priceSek: number;
  priceSource: PriceCandidate["priceSource"];
  sourceLabel?: string;
  reason: "invalid_price" | "marketplace_unvalidated";
}

export interface PriceCandidateResolution {
  selected: PriceCandidate | null;
  eligible: PriceCandidate[];
  rejected: RejectedPriceCandidate[];
}

const AUTO_PRICE_SOURCE_PRIORITY: Record<PriceCandidate["priceSource"], number> = {
  official_new: 4,
  retailer_listing: 3,
  market_listings: 2,
  catalog_reference: 1,
  historical_average: 0,
};

const AUTO_PRICE_SOURCE_CONFIDENCE: Record<PriceCandidate["priceSource"], PriceSourceConfidence> = {
  official_new: "high",
  retailer_listing: "high",
  market_listings: "medium",
  catalog_reference: "low",
  historical_average: "low",
};

export function getAutomaticPriceSourcePriority(source: PriceSource): number {
  if (source === "manual") return 99;
  if (source === "missing") return -1;
  return AUTO_PRICE_SOURCE_PRIORITY[source];
}

export function getAutomaticPriceSourceConfidence(source: PriceSource): PriceSourceConfidence | null {
  if (source === "manual" || source === "missing") return null;
  return AUTO_PRICE_SOURCE_CONFIDENCE[source];
}

export function isFallbackPriceSource(source: PriceSource): boolean {
  return source === "catalog_reference" || source === "historical_average" || source === "missing";
}

export function resolveAutomaticPriceCandidates(
  candidates: Array<PriceCandidate | null | undefined>,
): PriceCandidateResolution {
  const rejected: RejectedPriceCandidate[] = [];
  const eligible = candidates.filter((candidate): candidate is PriceCandidate => {
    if (!candidate || candidate.priceSek <= 0) {
      if (candidate) {
        rejected.push({
          priceSek: candidate.priceSek,
          priceSource: candidate.priceSource,
          sourceLabel: candidate.sourceLabel,
          reason: "invalid_price",
        });
      }
      return false;
    }

    if (candidate.priceSource === "market_listings" && candidate.isValidated === false) {
      rejected.push({
        priceSek: candidate.priceSek,
        priceSource: candidate.priceSource,
        sourceLabel: candidate.sourceLabel,
        reason: "marketplace_unvalidated",
      });
      return false;
    }

    return true;
  });

  if (eligible.length === 0) {
    return {
      selected: null,
      eligible: [],
      rejected,
    };
  }

  return {
    selected: [...eligible].sort((left, right) => {
      const priorityDifference =
        getAutomaticPriceSourcePriority(right.priceSource) - getAutomaticPriceSourcePriority(left.priceSource);
      if (priorityDifference !== 0) return priorityDifference;

      return right.priceSek - left.priceSek;
    })[0],
    eligible,
    rejected,
  };
}

export function choosePreferredPriceCandidate(
  candidates: Array<PriceCandidate | null | undefined>,
): PriceCandidate | null {
  return resolveAutomaticPriceCandidates(candidates).selected;
}

export function canAutoApplyPriceSource(source: PriceSource): boolean {
  const confidence = getAutomaticPriceSourceConfidence(source);
  return confidence === "high" || confidence === "medium";
}
