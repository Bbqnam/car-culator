import { describe, expect, it } from "vitest";
import { findVerifiedOfficialPrice } from "./official-car-prices";

describe("official car prices", () => {
  it("returns a verified Swedish manufacturer price for a current model", () => {
    const price = findVerifiedOfficialPrice("Volvo", "EX40", 2026, 2026);

    expect(price).toMatchObject({
      priceSek: 529900,
      providerName: "Volvo Cars Sverige",
      matchConfidence: "exact",
    });
  });

  it("prefers the more specific official model match when multiple family entries exist", () => {
    const price = findVerifiedOfficialPrice("Volvo", "EX30 Cross Country", 2026, 2026);

    expect(price).toMatchObject({
      priceSek: 542000,
      matchedModel: "EX30 Cross Country",
      matchConfidence: "exact",
    });
  });

  it("supports family-level official matching for model naming variations", () => {
    const price = findVerifiedOfficialPrice("Toyota", "Toyota bZ4X", 2026, 2026);

    expect(price).toMatchObject({
      priceSek: 479900,
      matchedModel: "bZ4X",
      matchConfidence: "exact",
    });
  });

  it("downgrades broader family matches for more detailed trims", () => {
    const price = findVerifiedOfficialPrice("Volvo", "EX30 Twin Motor Performance Ultra", 2026, 2026);

    expect(price).toMatchObject({
      priceSek: 429000,
      matchedModel: "EX30",
      matchConfidence: "family",
    });
  });

  it("does not assign official new-car pricing to older model years", () => {
    const price = findVerifiedOfficialPrice("Volvo", "EX40", 2023, 2026);

    expect(price).toBeNull();
  });
});
