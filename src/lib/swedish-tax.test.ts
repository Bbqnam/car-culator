import { describe, expect, it } from "vitest";
import { estimateSwedishVehicleTax } from "./swedish-tax";

describe("estimateSwedishVehicleTax", () => {
  it("keeps electric vehicles on the basic annual charge", () => {
    expect(
      estimateSwedishVehicleTax({
        fuelType: "electric",
        fuelConsumption: 16,
        modelYear: 2026,
        referenceYear: 2026,
      }),
    ).toEqual({
      annualTaxSek: 360,
      estimatedCo2GKm: 0,
      isMalus: false,
    });
  });

  it("estimates malus tax for newer petrol cars", () => {
    expect(
      estimateSwedishVehicleTax({
        fuelType: "petrol",
        fuelConsumption: 6,
        modelYear: 2026,
        referenceYear: 2026,
      }),
    ).toEqual({
      annualTaxSek: 7584,
      estimatedCo2GKm: 139.2,
      isMalus: true,
    });
  });

  it("falls back to standard CO2 tax for older petrol cars", () => {
    expect(
      estimateSwedishVehicleTax({
        fuelType: "petrol",
        fuelConsumption: 5,
        modelYear: 2021,
        referenceYear: 2026,
      }),
    ).toEqual({
      annualTaxSek: 470,
      estimatedCo2GKm: 116,
      isMalus: false,
    });
  });

  it("treats hybrids like petrol for CO2-based tax estimation", () => {
    expect(
      estimateSwedishVehicleTax({
        fuelType: "hybrid",
        fuelConsumption: 4.5,
        modelYear: 2021,
        referenceYear: 2026,
      }),
    ).toEqual({
      annualTaxSek: 360,
      estimatedCo2GKm: 104.4,
      isMalus: false,
    });
  });

  it("uses the diesel legacy factor for older diesel cars", () => {
    expect(
      estimateSwedishVehicleTax({
        fuelType: "diesel",
        fuelConsumption: 5.5,
        modelYear: 2016,
        referenceYear: 2026,
      }),
    ).toEqual({
      annualTaxSek: 2636,
      estimatedCo2GKm: 145.2,
      isMalus: false,
    });
  });
});
