import { describe, expect, it } from "vitest";
import {
  estimatePurchasePrice,
  inferAvailableFuelTypes,
  inferFuelTypeFromText,
} from "./car-database";

describe("inferFuelTypeFromText", () => {
  it("detects electric models like Audi e-tron from the model name itself", () => {
    expect(inferFuelTypeFromText("A6 Sportback e-tron")).toBe("electric");
  });

  it("detects well-known plug-in hybrid supercars from the model name", () => {
    expect(inferFuelTypeFromText("Ferrari 296 GTB")).toBe("hybrid");
  });

  it("detects combustion-only FuelEconomy option labels as petrol when they expose engine specs", () => {
    expect(inferFuelTypeFromText("Auto 8-spd, 12 cyl, 5.2 L, Turbo")).toBe("petrol");
  });
});

describe("inferAvailableFuelTypes", () => {
  it("keeps exact hybrid models on hybrid only", () => {
    expect(inferAvailableFuelTypes("Toyota", "Corolla 1.8 Hybrid")).toEqual(["hybrid"]);
  });

  it("keeps explicit electric model names on electric only", () => {
    expect(inferAvailableFuelTypes("Audi", "A6 Sportback e-tron")).toEqual(["electric"]);
  });

  it("filters out electric when only petrol and diesel variants are hinted", () => {
    expect(inferAvailableFuelTypes("Audi", "A6", ["40 TDI quattro", "45 TFSI"])).toEqual([
      "petrol",
      "diesel",
    ]);
  });

  it("keeps combustion-only live variants from expanding to every fuel type", () => {
    expect(
      inferAvailableFuelTypes("Aston Martin", "Vanquish Volante", ["Auto 8-spd, 12 cyl, 5.2 L, Turbo"]),
    ).toEqual(["petrol"]);
  });
});

describe("estimatePurchasePrice", () => {
  const currentYear = new Date().getFullYear();

  it("keeps exact local models at their known price for the current model year", () => {
    expect(estimatePurchasePrice("Cupra", "Born", "electric", currentYear)).toMatchObject({
      priceSek: 400000,
      priceSource: "historical_average",
      basis: "local_model",
    });
  });

  it("reduces estimated prices for older model years", () => {
    const currentPrice = estimatePurchasePrice("Cupra", "Born", "electric", currentYear).priceSek;
    const olderPrice = estimatePurchasePrice("Cupra", "Born", "electric", currentYear - 4).priceSek;

    expect(olderPrice).toBeGreaterThan(0);
    expect(olderPrice).toBeLessThan(currentPrice);
  });

  it("falls back to a non-zero estimate for unknown models within known brands", () => {
    const estimate = estimatePurchasePrice("BMW", "X5", "petrol", currentYear);

    expect(estimate.priceSek).toBeGreaterThan(0);
    expect(estimate.priceSource).toBe("historical_average");
  });

  it("falls back to a non-zero estimate for brands that only exist in the live catalog", () => {
    const estimate = estimatePurchasePrice("Alfa Romeo", "Giulia", "petrol", currentYear);

    expect(estimate.priceSek).toBeGreaterThan(0);
    expect(estimate.priceSource).toBe("historical_average");
  });

  it("uses curated brand anchors for exotic brands instead of generic petrol averages", () => {
    const estimate = estimatePurchasePrice("Ferrari", "296 GTB", "hybrid", currentYear);

    expect(estimate.priceSek).toBeGreaterThan(3000000);
    expect(estimate.basis).toBe("brand_anchor");
  });

  it("normalizes Bugatti Rimac to the premium Bugatti electric anchor", () => {
    const estimate = estimatePurchasePrice("Bugatti Rimac", "Nevera R", "electric", currentYear);

    expect(estimate.priceSek).toBeGreaterThan(20000000);
    expect(estimate.basis).toBe("brand_anchor");
  });
});
