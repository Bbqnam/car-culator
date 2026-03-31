import { describe, expect, it } from "vitest";
import { createEmptyCar } from "@/lib/car-types";
import { getMissingRequiredFields, isCarReadyToSave } from "@/lib/car-validation";

const t = ({ en }: { en: string; sv: string }) => en;

describe("car validation", () => {
  it("requires a monthly lease fee before a leasing car can be saved", () => {
    const car = {
      ...createEmptyCar("lease-1"),
      brand: "Tesla",
      model: "Model Y",
      purchasePrice: 685000,
      fuelType: "electric" as const,
      fuelConsumption: 22.5,
      financingMode: "leasing" as const,
    };

    expect(getMissingRequiredFields(car, t)).toContain("Monthly fee");
    expect(isCarReadyToSave(car, t)).toBe(false);
  });

  it("accepts a leasing car once the monthly fee is provided", () => {
    const car = {
      ...createEmptyCar("lease-2"),
      brand: "Tesla",
      model: "Model Y",
      purchasePrice: 685000,
      fuelType: "electric" as const,
      fuelConsumption: 22.5,
      financingMode: "leasing" as const,
      leasing: {
        ...createEmptyCar("template").leasing,
        monthlyLeaseCost: 6495,
        leaseDurationMonths: 36,
        includedMileage: 15000,
      },
    };

    expect(getMissingRequiredFields(car, t)).not.toContain("Monthly fee");
    expect(isCarReadyToSave(car, t)).toBe(true);
  });
});
