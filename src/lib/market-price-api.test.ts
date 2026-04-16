import { describe, expect, it } from "vitest";
import { shouldPreferMarketPriceEstimate, type MarketPriceEstimate } from "./market-price-api";

const strongExactEstimate: MarketPriceEstimate = {
  priceSek: 412000,
  sampleSize: 3,
  provider: "bilweb",
  providerLabel: "Bilweb",
  sourceUrl: "https://bilweb.se/sok/test",
  matchType: "exact_year",
};

describe("shouldPreferMarketPriceEstimate", () => {
  it("prefers strong market prices over historical fallback", () => {
    expect(shouldPreferMarketPriceEstimate({
      currentPriceSource: "historical_average",
      currentPurchasePrice: 334000,
      hasLocalModelMatch: false,
      modelYear: 2025,
      estimate: strongExactEstimate,
      currentYear: 2026,
    })).toBe(true);
  });

  it("allows a single exact-year live listing to replace a seeded fallback", () => {
    expect(shouldPreferMarketPriceEstimate({
      currentPriceSource: "catalog_reference",
      currentPurchasePrice: 429000,
      hasLocalModelMatch: true,
      modelYear: 2025,
      estimate: {
        ...strongExactEstimate,
        sampleSize: 1,
      },
      currentYear: 2026,
    })).toBe(true);
  });

  it("prefers strong market prices over seeded catalog references", () => {
    expect(shouldPreferMarketPriceEstimate({
      currentPriceSource: "catalog_reference",
      currentPurchasePrice: 429000,
      hasLocalModelMatch: true,
      modelYear: 2025,
      estimate: strongExactEstimate,
      currentYear: 2026,
    })).toBe(true);
  });

  it("does not replace official new pricing with market listings", () => {
    expect(shouldPreferMarketPriceEstimate({
      currentPriceSource: "official_new",
      currentPurchasePrice: 685000,
      hasLocalModelMatch: true,
      modelYear: 2025,
      estimate: strongExactEstimate,
      currentYear: 2026,
    })).toBe(false);
  });

  it("does not replace a verified retailer price with marketplace listings", () => {
    expect(shouldPreferMarketPriceEstimate({
      currentPriceSource: "retailer_listing",
      currentPurchasePrice: 415000,
      hasLocalModelMatch: true,
      modelYear: 2025,
      estimate: strongExactEstimate,
      currentYear: 2026,
    })).toBe(false);
  });

  it("rejects weak model-family matches for seeded local models", () => {
    expect(shouldPreferMarketPriceEstimate({
      currentPriceSource: "historical_average",
      currentPurchasePrice: 299000,
      hasLocalModelMatch: true,
      modelYear: 2022,
      estimate: {
        ...strongExactEstimate,
        sampleSize: 1,
        matchType: "model_family",
      },
      currentYear: 2026,
    })).toBe(false);
  });
});
