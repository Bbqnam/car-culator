import { describe, expect, it } from "vitest";
import { toExternalUrl } from "./utils";

describe("toExternalUrl", () => {
  it("keeps absolute http and https URLs", () => {
    expect(toExternalUrl("https://www.handlabil.se/car")).toBe("https://www.handlabil.se/car");
    expect(toExternalUrl("http://example.com/test")).toBe("http://example.com/test");
  });

  it("adds https to bare domains", () => {
    expect(toExternalUrl("www.handlabil.se/car")).toBe("https://www.handlabil.se/car");
    expect(toExternalUrl("handlabil.se/car")).toBe("https://handlabil.se/car");
  });

  it("rejects app-relative paths", () => {
    expect(toExternalUrl("/cars/123")).toBeUndefined();
    expect(toExternalUrl("cars/123")).toBeUndefined();
  });
});
