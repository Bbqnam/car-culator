import { describe, expect, it } from "vitest";
import { estimatePurchasePrice, getModels } from "./car-database";

describe("car-database coverage and pricing", () => {
  it("includes a seeded Dacia catalog beyond the EV-only live fallback", () => {
    const daciaModels = getModels("Dacia").map((item) => item.model);

    expect(daciaModels).toContain("Sandero TCe 90");
    expect(daciaModels).toContain("Duster Hybrid 140");
    expect(daciaModels).toContain("Spring Electric 65");
    expect(daciaModels.length).toBeGreaterThan(5);
  });

  it("treats exact current-generation seeded prices as official new pricing", () => {
    const currentYear = new Date().getFullYear();
    const estimate = estimatePurchasePrice("Jeep", "Wagoneer S", "electric", currentYear - 1);

    expect(estimate.priceSource).toBe("official_new");
    expect(estimate.basis).toBe("local_model");
    expect(estimate.priceSek).toBeGreaterThan(600000);
  });

  it("keeps older exact seeded prices as historical averages", () => {
    const estimate = estimatePurchasePrice("Jeep", "Wagoneer S", "electric", 2022);

    expect(estimate.priceSource).toBe("historical_average");
  });
});
