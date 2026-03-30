export interface MarketPriceEstimate {
  priceSek: number;
  sampleSize: number;
  provider: string;
  providerLabel: string;
  sourceUrl: string;
  matchType: "exact_year" | "nearby_year" | "model_family";
}

export async function fetchMarketPriceEstimate(
  brand: string,
  model: string,
  year: number,
): Promise<MarketPriceEstimate | null> {
  const searchParams = new URLSearchParams({
    brand,
    model,
    year: String(year),
  });

  const response = await fetch(`/api/market-price?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error("Swedish market price lookup is temporarily unavailable.");
  }

  const data = (await response.json()) as { estimate?: MarketPriceEstimate | null };
  return data.estimate ?? null;
}
