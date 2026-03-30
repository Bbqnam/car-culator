import {
  CarInput,
  CarResult,
  Currency,
  convertSekToCurrency,
  getCurrencyCode,
} from "@/lib/car-types";

const FINANCING_LABELS: Record<string, string> = {
  cash: "cash",
  loan: "loan",
  leasing: "leasing",
};

function formatForPrompt(valueSek: number, currency: Currency): string {
  const converted = Math.round(convertSekToCurrency(valueSek, currency));
  const code = getCurrencyCode(currency);
  return `${converted.toLocaleString("sv-SE")} ${code}`;
}

function formatConsumption(car: CarInput): string {
  const unit = car.fuelType === "electric" ? "kWh/100km" : "L/100km";
  return `${car.fuelConsumption.toLocaleString("sv-SE")} ${unit}`;
}

function formatPerKm(valueSekPerKm: number, currency: Currency): string {
  const converted = Math.round(convertSekToCurrency(valueSekPerKm, currency) * 100) / 100;
  return `${converted.toLocaleString("sv-SE")} ${currency}/km`;
}

export function buildComparisonContext(
  cars: CarInput[],
  results: CarResult[],
  currency: Currency,
): string {
  if (results.length === 0) {
    return [
      "No cars are configured yet.",
      "The user may ask general questions about costs, financing, and what data to fill in.",
    ].join("\n");
  }

  const carsById = new Map(cars.map((car) => [car.id, car]));
  const sorted = [...results].sort((a, b) => a.monthlyCost - b.monthlyCost);

  const lines = [
    `Comparison currency: ${currency}`,
    `Cars compared: ${sorted.length}`,
    `Lowest monthly cost: ${sorted[0].name} (${formatForPrompt(sorted[0].monthlyCost, currency)}/month)`,
    "",
    "Comparison details:",
  ];

  sorted.forEach((result, index) => {
    const car = carsById.get(result.id);
    const financingMode = FINANCING_LABELS[result.financingMode] ?? result.financingMode;

    lines.push(`${index + 1}. ${result.name}`);
    lines.push(`- Brand: ${result.brand || "Unknown"}`);
    lines.push(`- Financing mode: ${financingMode}`);
    lines.push(`- Monthly cost: ${formatForPrompt(result.monthlyCost, currency)}`);
    lines.push(`- Total ownership cost: ${formatForPrompt(result.totalOwnershipCost, currency)}`);
    lines.push(`- Ownership duration: ${result.ownershipMonths} months`);
    lines.push(`- Cost per km: ${formatPerKm(result.costPerKm, currency)}`);

    if (car) {
      lines.push(`- Purchase price: ${formatForPrompt(car.purchasePrice, currency)}`);
      lines.push(`- Annual mileage: ${car.annualMileage.toLocaleString("sv-SE")} km`);
      lines.push(`- Fuel type: ${car.fuelType}`);
      lines.push(`- Fuel/energy consumption: ${formatConsumption(car)}`);
    }

    lines.push("");
  });

  return lines.join("\n").trim();
}
