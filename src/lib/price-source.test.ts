import { describe, expect, it } from "vitest";
import { choosePreferredPriceCandidate, getAutomaticPriceSourcePriority, isFallbackPriceSource } from "./price-source";

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
});
