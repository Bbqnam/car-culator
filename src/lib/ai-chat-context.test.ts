import { describe, expect, it } from "vitest";
import { buildComparisonContext } from "@/lib/ai-chat-context";
import { calculateResults, createEmptyCar } from "@/lib/car-types";

describe("buildComparisonContext", () => {
  it("builds a ranked context from configured cars", () => {
    const niro = {
      ...createEmptyCar("1"),
      isConfigured: true,
      brand: "Kia",
      model: "Niro EV",
      name: "Kia Niro EV",
      purchasePrice: 420000,
      ownershipYears: 5,
      annualMileage: 15000,
      fuelType: "electric" as const,
      fuelConsumption: 17,
      fuelPrice: 2.5,
      insuranceCost: 6500,
      taxCost: 360,
      serviceCost: 2800,
      financingMode: "cash" as const,
    };

    const bmw = {
      ...createEmptyCar("2"),
      isConfigured: true,
      brand: "BMW",
      model: "330e",
      name: "BMW 330e",
      purchasePrice: 580000,
      ownershipYears: 5,
      annualMileage: 15000,
      fuelType: "petrol" as const,
      fuelConsumption: 6.6,
      fuelPrice: 19.8,
      insuranceCost: 9200,
      taxCost: 2400,
      serviceCost: 5100,
      financingMode: "loan" as const,
      loan: {
        downPayment: 116000,
        interestRate: 5.4,
        loanTermMonths: 60,
        residualBalloon: 90000,
        monthlyAdminFee: 45,
      },
    };

    const context = buildComparisonContext(
      [niro, bmw],
      [calculateResults(niro), calculateResults(bmw)],
      "SEK",
    );

    expect(context).toContain("Antal jämförda bilar: 2");
    expect(context).toContain("Lägst månadskostnad: Kia Niro EV");
    expect(context).toContain("1. Kia Niro EV");
    expect(context).toContain("2. BMW 330e");
    expect(context).toContain("- Kostnad per km:");
  });

  it("falls back to general-mode guidance when no cars are configured", () => {
    const context = buildComparisonContext([], [], "SEK");

    expect(context).toContain("Inga bilar är konfigurerade ännu.");
    expect(context).toContain("allmänna frågor");
  });

  it("supports VND conversion in the generated context", () => {
    const car = {
      ...createEmptyCar("3"),
      isConfigured: true,
      brand: "Kia",
      model: "Niro EV",
      name: "Kia Niro EV",
      purchasePrice: 420000,
      ownershipYears: 5,
      annualMileage: 15000,
      fuelType: "electric" as const,
      fuelConsumption: 17,
      fuelPrice: 2.5,
      financingMode: "cash" as const,
    };

    const context = buildComparisonContext([car], [calculateResults(car)], "VND");

    expect(context).toContain("Jämförelsevaluta: VND");
    expect(context).toContain("VND");
  });
});
