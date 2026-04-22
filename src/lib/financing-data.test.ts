import { describe, expect, it } from "vitest";
import {
  formatRateLabel,
  getLeasingAvailabilities,
  getLeasingAvailability,
  getLoanBenchmarks,
  getPreferredLoanDefaults,
  getSuggestedLeaseDefaults,
} from "./financing-data";

describe("financing-data", () => {
  it("returns a verified current lease offer for Toyota bZ4X", () => {
    const availability = getLeasingAvailability("Toyota", "bZ4X", "2026-03-31");
    const defaults = getSuggestedLeaseDefaults("Toyota", "bZ4X", "2026-03-31");

    expect(availability.status).toBe("available");
    expect(availability.providerName).toBe("Toyota Financial Services");
    expect(defaults).toEqual({
      monthlyLeaseCost: 5895,
      downPayment: 0,
      leaseDurationMonths: 36,
      includedMileage: 15000,
      excessMileageCostPerKm: 1.5,
      endOfTermFee: 0,
    });
  });

  it("falls back to brand-level manual leasing support when no verified current model offer exists", () => {
    const availability = getLeasingAvailability("Volvo", "EX90", "2026-03-31");

    expect(availability.status).toBe("manual_only");
    expect(availability.providerName).toBe("Volvo Cars");
    expect(availability.sourceUrl).toContain("volvocars.com");
  });

  it("matches verified Volvo leasing offers even when the model name includes a trim", () => {
    const availability = getLeasingAvailability("Volvo", "EX30 Cross Country Ultra", "2026-04-02");
    const offers = getLeasingAvailabilities("Volvo", "EX30 Cross Country Ultra", "2026-04-02");

    expect(availability.status).toBe("available");
    expect(availability.providerName).toBe("Volvo Cars");
    expect(offers.length).toBeGreaterThan(0);
  });

  it("prefers the green benchmark for electric car loan defaults", () => {
    const suggestion = getPreferredLoanDefaults("electric", "2026-03-31");

    expect(suggestion.benchmark.providerName).toBe("Swedbank");
    expect(suggestion.interestRatePercent).toBe(5.19);
    expect(suggestion.loanTermMonths).toBe(60);
  });

  it("surfaces active Toyota campaign financing alongside bank benchmarks", () => {
    const benchmarks = getLoanBenchmarks("electric", "Toyota", "bZ4X", "2026-03-31");

    expect(benchmarks.some((item) => item.id === "toyota-bz4x-campaign")).toBe(true);
    expect(benchmarks.some((item) => item.id === "swedbank-gront-billan")).toBe(true);
  });

  it("drops expired Toyota campaign financing after 2026-03-31", () => {
    const benchmarks = getLoanBenchmarks("electric", "Toyota", "bZ4X", "2026-04-02");

    expect(benchmarks.some((item) => item.id === "toyota-bz4x-campaign")).toBe(false);
  });

  it("formats rate ranges cleanly for display", () => {
    const nordea = getLoanBenchmarks("petrol", "Volvo", "XC60 B5", "2026-03-31")
      .find((item) => item.id === "nordea-billan");

    expect(nordea).toBeDefined();
    expect(formatRateLabel(nordea!)).toBe("4.95% - 12.95%");
  });

  it("returns a broader verified lender list for testing the offers UI", () => {
    const benchmarks = getLoanBenchmarks("electric", "Volvo", "EX30", "2026-04-02")
      .filter((item) => item.benchmarkKind !== "policy_rate");

    expect(benchmarks.length).toBeGreaterThanOrEqual(6);
    expect(benchmarks.some((item) => item.id === "ica-elbilslan")).toBe(true);
    expect(benchmarks.some((item) => item.id === "seb-enkla-lanet")).toBe(true);
    expect(benchmarks.some((item) => item.id === "handelsbanken-privatlan")).toBe(true);
  });

  it("keeps Volvo EC40 leasing defaults consistent with the verified EX40 offer", () => {
    const availability = getLeasingAvailability("Volvo", "EC40", "2026-04-02");
    const defaults = getSuggestedLeaseDefaults("Volvo", "EC40", "2026-04-02");

    expect(availability).toMatchObject({
      status: "available",
      providerName: "Volvo Cars",
      monthlyCostSek: 5195,
    });
    expect(defaults).toEqual({
      monthlyLeaseCost: 5195,
      downPayment: 0,
      leaseDurationMonths: 36,
      includedMileage: 10000,
      excessMileageCostPerKm: 1.5,
      endOfTermFee: 0,
    });
  });
});
