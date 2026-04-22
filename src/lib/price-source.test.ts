import { describe, expect, it } from "vitest";
import {
  canAutoApplyPriceSource,
  choosePreferredPriceCandidate,
  getAutomaticPriceSourcePriority,
  isFallbackPriceSource,
  resolveAutomaticPriceCandidates,
} from "./price-source";

describe("price-source priority", () => {
  it("keeps the requested automatic source order", () => {
    expect(getAutomaticPriceSourcePriority("official_new")).toBeGreaterThan(getAutomaticPriceSourcePriority("retailer_listing"));
    expect(getAutomaticPriceSourcePriority("retailer_listing")).toBeGreaterThan(getAutomaticPriceSourcePriority("market_listings"));
    expect(getAutomaticPriceSourcePriority("market_listings")).toBeGreaterThan(getAutomaticPriceSourcePriority("catalog_reference"));
    expect(getAutomaticPriceSourcePriority("catalog_reference")).toBeGreaterThan(getAutomaticPriceSourcePriority("historical_average"));
  });

  it("prefers retailer and marketplace prices over fallback values", () => {
    const chosen = choosePreferredPriceCandidate([
      { priceSek: 420000, priceSource: "catalog_reference" },
      { priceSek: 398000, priceSource: "historical_average" },
      { priceSek: 405000, priceSource: "market_listings" },
      { priceSek: 415000, priceSource: "retailer_listing" },
    ]);

    expect(chosen?.priceSource).toBe("retailer_listing");
    expect(chosen?.priceSek).toBe(415000);
  });

  it("prefers verified official prices over retailer listings for the add-car baseline", () => {
    const chosen = choosePreferredPriceCandidate([
      { priceSek: 429000, priceSource: "official_new" },
      { priceSek: 472000, priceSource: "retailer_listing" },
      { priceSek: 455000, priceSource: "market_listings" },
    ]);

    expect(chosen?.priceSource).toBe("official_new");
    expect(chosen?.priceSek).toBe(429000);
  });

  it("marks only missing, catalog, and historical prices as fallback", () => {
    expect(isFallbackPriceSource("missing")).toBe(true);
    expect(isFallbackPriceSource("catalog_reference")).toBe(true);
    expect(isFallbackPriceSource("historical_average")).toBe(true);
    expect(isFallbackPriceSource("retailer_listing")).toBe(false);
    expect(isFallbackPriceSource("market_listings")).toBe(false);
  });

  it("keeps low-confidence fallback prices from auto-applying over stronger sources", () => {
    expect(canAutoApplyPriceSource("official_new")).toBe(true);
    expect(canAutoApplyPriceSource("retailer_listing")).toBe(true);
    expect(canAutoApplyPriceSource("market_listings")).toBe(true);
    expect(canAutoApplyPriceSource("catalog_reference")).toBe(false);
    expect(canAutoApplyPriceSource("historical_average")).toBe(false);
  });

  it("rejects an invalid marketplace teaser before ranking for Tiguan", () => {
    const resolution = resolveAutomaticPriceCandidates([
      { priceSek: 420000, priceSource: "catalog_reference", sourceLabel: "Fallback reference" },
      { priceSek: 3495, priceSource: "market_listings", sourceLabel: "Bilweb", isValidated: false },
    ]);

    expect(resolution.selected).toMatchObject({
      priceSek: 420000,
      priceSource: "catalog_reference",
    });
    expect(resolution.rejected).toContainEqual(expect.objectContaining({
      priceSource: "market_listings",
      reason: "marketplace_unvalidated",
    }));
  });

  it("keeps the official manufacturer price on top for Mercedes EQA when marketplace data also exists", () => {
    const resolution = resolveAutomaticPriceCandidates([
      { priceSek: 489900, priceSource: "official_new", sourceLabel: "Mercedes-Benz Sverige" },
      { priceSek: 471000, priceSource: "market_listings", sourceLabel: "Bilweb", isValidated: true },
      { priceSek: 455000, priceSource: "catalog_reference", sourceLabel: "Fallback reference" },
    ]);

    expect(resolution.selected).toMatchObject({
      priceSek: 489900,
      priceSource: "official_new",
    });
  });
});
