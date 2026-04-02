import { describe, expect, it } from "vitest";
import { calculateResidualPercent } from "./car-types";

describe("car-types residual value", () => {
  it("keeps the existing residual curve for a current model year", () => {
    expect(calculateResidualPercent(5, "petrol", 2026, 2026)).toBe(46);
    expect(calculateResidualPercent(5, "electric", 2026, 2026)).toBe(45);
  });

  it("gives an older car a higher residual share of today's purchase price", () => {
    const newerCarResidual = calculateResidualPercent(5, "petrol", 2026, 2026);
    const olderCarResidual = calculateResidualPercent(5, "petrol", 2022, 2026);

    expect(olderCarResidual).toBeGreaterThan(newerCarResidual);
    expect(olderCarResidual).toBe(50);
  });
});
