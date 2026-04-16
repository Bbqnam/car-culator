import { describe, expect, it } from "vitest";
import { estimatePurchasePrice, findCarModel, getDisplayModelName, getModels } from "./car-database";

describe("car-database coverage and pricing", () => {
  it("includes a seeded Dacia catalog beyond the EV-only live fallback", () => {
    const daciaModels = getModels("Dacia").map((item) => item.model);

    expect(daciaModels).toContain("Sandero TCe 90");
    expect(daciaModels).toContain("Duster Hybrid 140");
    expect(daciaModels).toContain("Spring Electric 65");
    expect(daciaModels.length).toBeGreaterThan(5);
  });

  it("treats exact current-generation seeded prices as catalog references", () => {
    const currentYear = new Date().getFullYear();
    const estimate = estimatePurchasePrice("Jeep", "Wagoneer S", "electric", currentYear - 1);

    expect(estimate.priceSource).toBe("catalog_reference");
    expect(estimate.basis).toBe("local_model");
    expect(estimate.priceSek).toBeGreaterThan(600000);
  });

  it("keeps older exact seeded prices as historical averages", () => {
    const estimate = estimatePurchasePrice("Jeep", "Wagoneer S", "electric", 2022);

    expect(estimate.priceSource).toBe("historical_average");
  });

  it("keeps detailed model labels instead of collapsing them into generic families", () => {
    expect(getDisplayModelName("Volvo", "EX90 Twin Motor Performance (21 Inch Wheels)")).toBe("EX90 Twin Motor Performance (21 Inch Wheels)");
    expect(getDisplayModelName("Volkswagen", "ID.4 PRO 4M EDITION 77kWh 286hk")).toBe("ID.4 PRO 4M EDITION 77kWh 286hk");
    expect(getDisplayModelName("Toyota", "Toyota bZ4X AWD Executive")).toBe("bZ4X AWD Executive");
  });

  it("resolves a local database model when the detailed model label matches", () => {
    const model = findCarModel("Volvo", "XC60 B5");

    expect(model?.model).toBe("XC60 B5");
  });
});
