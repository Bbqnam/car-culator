import { describe, expect, it } from "vitest";
import { findVerifiedRetailerPrice } from "./commercial-trial";

describe("commercial trial retailer sources", () => {
  it("keeps aggregated marketplace overview pages out of the add-car price anchor", () => {
    const price = findVerifiedRetailerPrice("Volvo", "EX30");

    expect(price).toBeTruthy();
    expect(price?.providerName).not.toBe("Blocket");
  });

  it("matches broader dealer coverage for exact car families", () => {
    const price = findVerifiedRetailerPrice("Kia", "EV6");

    expect(price).toMatchObject({
      providerName: "Hedin Automotive",
      priceSek: 549900,
    });
  });

  it("prefers an exact trim listing over a broader family match", () => {
    const price = findVerifiedRetailerPrice("Volvo", "EX30 Twin Motor Performance Ultra");

    expect(price).toMatchObject({
      providerName: "Rejmes",
      offerLabel: "EX30 Twin Motor Performance Ultra",
      matchConfidence: "exact",
    });
  });
});
