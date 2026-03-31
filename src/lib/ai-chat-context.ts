import {
  CarInput,
  CarResult,
  Currency,
  convertSekToCurrency,
  getCurrencyCode,
} from "@/lib/car-types";
import type { Language } from "@/lib/i18n";

function formatForPrompt(valueSek: number, currency: Currency, locale: string): string {
  const converted = Math.round(convertSekToCurrency(valueSek, currency));
  const code = getCurrencyCode(currency);
  return `${converted.toLocaleString(locale)} ${code}`;
}

function formatConsumption(car: CarInput, locale: string): string {
  const unit = car.fuelType === "electric" ? "kWh/100 km" : "L/100 km";
  return `${car.fuelConsumption.toLocaleString(locale)} ${unit}`;
}

function formatPerKm(valueSekPerKm: number, currency: Currency, locale: string): string {
  const converted = Math.round(convertSekToCurrency(valueSekPerKm, currency) * 100) / 100;
  return `${converted.toLocaleString(locale)} ${currency}/km`;
}

export function buildComparisonContext(
  cars: CarInput[],
  results: CarResult[],
  currency: Currency,
  language: Language = "sv",
): string {
  const locale = language === "sv" ? "sv-SE" : "en-US";
  const isSv = language === "sv";
  const financingLabels: Record<string, string> = isSv
    ? { cash: "kontant", loan: "lån", leasing: "leasing" }
    : { cash: "cash", loan: "loan", leasing: "leasing" };
  const fuelLabels: Record<string, string> = isSv
    ? { electric: "el", petrol: "bensin", diesel: "diesel", hybrid: "hybrid" }
    : { electric: "electric", petrol: "petrol", diesel: "diesel", hybrid: "hybrid" };

  if (results.length === 0) {
    return isSv
      ? [
          "Inga bilar är konfigurerade ännu.",
          "Användaren kan ställa allmänna frågor om kostnader, finansiering och vilka uppgifter som behöver fyllas i.",
        ].join("\n")
      : [
          "No cars are configured yet.",
          "The user can ask general questions about costs, financing, and which inputs need to be filled in.",
        ].join("\n");
  }

  const carsById = new Map(cars.map((car) => [car.id, car]));
  const sorted = [...results].sort((a, b) => a.monthlyCost - b.monthlyCost);

  const lines = [
    `${isSv ? "Jämförelsevaluta" : "Comparison currency"}: ${currency}`,
    `${isSv ? "Antal jämförda bilar" : "Number of compared cars"}: ${sorted.length}`,
    `${isSv ? "Lägst månadskostnad" : "Lowest monthly cost"}: ${sorted[0].name} (${formatForPrompt(sorted[0].monthlyCost, currency, locale)}${isSv ? "/månad" : "/month"})`,
    "",
    isSv ? "Jämförelsedetaljer:" : "Comparison details:",
  ];

  sorted.forEach((result, index) => {
    const car = carsById.get(result.id);
    const financingMode = financingLabels[result.financingMode] ?? result.financingMode;

    lines.push(`${index + 1}. ${result.name}`);
    lines.push(`- ${isSv ? "Märke" : "Brand"}: ${result.brand || (isSv ? "Okänt" : "Unknown")}`);
    lines.push(`- ${isSv ? "Finansiering" : "Financing"}: ${financingMode}`);
    lines.push(`- ${isSv ? "Månadskostnad" : "Monthly cost"}: ${formatForPrompt(result.monthlyCost, currency, locale)}`);
    lines.push(`- ${isSv ? "Total ägandekostnad" : "Total ownership cost"}: ${formatForPrompt(result.totalOwnershipCost, currency, locale)}`);
    lines.push(`- ${isSv ? "Ägandetid" : "Ownership duration"}: ${result.ownershipMonths} ${isSv ? "månader" : "months"}`);
    lines.push(`- ${isSv ? "Kostnad per km" : "Cost per km"}: ${formatPerKm(result.costPerKm, currency, locale)}`);

    if (car) {
      lines.push(`- ${isSv ? "Köpesumma" : "Purchase price"}: ${formatForPrompt(car.purchasePrice, currency, locale)}`);
      lines.push(`- ${isSv ? "Årlig körsträcka" : "Annual mileage"}: ${car.annualMileage.toLocaleString(locale)} km`);
      lines.push(`- ${isSv ? "Drivmedel" : "Fuel type"}: ${fuelLabels[car.fuelType] ?? car.fuelType}`);
      lines.push(`- ${isSv ? "Bränsle-/energiförbrukning" : "Fuel/energy consumption"}: ${formatConsumption(car, locale)}`);
    }

    lines.push("");
  });

  return lines.join("\n").trim();
}
