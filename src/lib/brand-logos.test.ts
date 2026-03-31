import { describe, expect, it } from "vitest";
import { canonicalizeBrandName, getBrandAccent, getBrandLogo } from "./brand-logos";

describe("brand logos", () => {
  it("resolves ELARIS to the bundled logo asset", () => {
    expect(canonicalizeBrandName("ELARIS")).toBe("Elaris");
    expect(getBrandLogo("ELARIS")).toContain("elaris.svg");
    expect(getBrandAccent("ELARIS")).toBe("#ffb300");
  });
});
