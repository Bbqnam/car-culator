const FRANKFURTER_API_BASE_URL = "https://api.frankfurter.dev/v2";

interface FrankfurterRateResponse {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

export async function fetchExchangeRate(base: string, quote: string): Promise<number> {
  const response = await fetch(`${FRANKFURTER_API_BASE_URL}/rate/${base}/${quote}`);
  if (!response.ok) {
    throw new Error("Could not load the latest exchange rate.");
  }

  const data = (await response.json()) as FrankfurterRateResponse;
  if (!Number.isFinite(data.rate) || data.rate <= 0) {
    throw new Error("Exchange rate data was unavailable.");
  }

  return data.rate;
}

export async function convertEurToSek(amountEur: number): Promise<number> {
  if (!Number.isFinite(amountEur) || amountEur <= 0) return 0;
  const eurToSek = await fetchExchangeRate("EUR", "SEK");
  return Math.round((amountEur * eurToSek) / 1000) * 1000;
}
