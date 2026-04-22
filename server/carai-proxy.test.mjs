import { describe, expect, it } from "vitest";
import { evaluateBilwebListings, parseBilwebListings } from "./carai-proxy.mjs";

function buildBilwebCardHtml({ id, title, modelName, year, priceText }) {
  return `
    <div class="Card " id="${id}">
      <a class="go_to_detail" href="/bil/${id}">${title}</a>
      <div class="Card-mainPrice">${priceText}</div>
      <div data-model-name="${modelName}"></div>
      <dl class="Card-carData">
        <dt>År:</dt><dd>${year}</dd>
      </dl>
    </div>
  `;
}

describe("Bilweb marketplace guardrails", () => {
  it("rejects Golf R monthly teaser prices before they can influence purchase price", () => {
    const listings = parseBilwebListings(buildBilwebCardHtml({
      id: "101",
      title: "Volkswagen Golf R",
      modelName: "Golf R",
      year: 2025,
      priceText: "3 495 kr/mån",
    }));

    const evaluation = evaluateBilwebListings(listings, "Golf R", ["golfr"], 2025);

    expect(evaluation.status).toBe("rejected");
    expect(evaluation.rejectionReasons).toContain("monthly_teaser");
  });

  it("rejects Toyota Yaris teaser pricing with leasing language", () => {
    const listings = parseBilwebListings(buildBilwebCardHtml({
      id: "202",
      title: "Toyota Yaris 1.5 Hybrid",
      modelName: "Yaris 1.5 Hybrid",
      year: 2025,
      priceText: "Från 2 995 kr/mån leasing",
    }));

    const evaluation = evaluateBilwebListings(listings, "Yaris 1.5 Hybrid", ["yaris15hybrid"], 2025);

    expect(evaluation.status).toBe("rejected");
    expect(evaluation.rejectionReasons).toContain("monthly_teaser");
  });
});
