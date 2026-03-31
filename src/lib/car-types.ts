export type FuelType = "petrol" | "diesel" | "hybrid" | "electric";
export const FUEL_TYPE_ORDER: FuelType[] = ["petrol", "diesel", "hybrid", "electric"];
export type Currency = "SEK" | "EUR" | "USD" | "VND";
export type FinancingMode = "cash" | "loan" | "leasing";
export type TaxCostSource = "estimated" | "manual";
export type PriceSource = "market_listings" | "official_new" | "historical_average" | "manual" | "missing";

export interface LoanInputs {
  downPayment: number;
  interestRate: number;
  loanTermMonths: number;
  residualBalloon: number;
  monthlyAdminFee: number;
}

export interface LeasingInputs {
  monthlyLeaseCost: number;
  downPayment: number;
  leaseDurationMonths: number;
  includedMileage: number;
  excessMileageCostPerKm: number;
  endOfTermFee: number;
}

export interface CarInput {
  id: string;
  brand: string;
  model: string;
  name: string;
  modelYear: number;
  purchasePrice: number;
  priceSource: PriceSource;
  ownershipYears: number;
  annualMileage: number;
  fuelType: FuelType;
  fuelConsumption: number;
  estimatedCo2GKm: number | null;
  fuelPrice: number;
  insuranceCost: number;
  taxCost: number;
  taxCostSource: TaxCostSource;
  serviceCost: number;
  isConfigured: boolean;
  financingMode: FinancingMode;
  loan: LoanInputs;
  leasing: LeasingInputs;
}

export interface CostBreakdown {
  fuel: number;
  insurance: number;
  tax: number;
  service: number;
  depreciation: number;
  financingCost: number;
  leaseCost: number;
  downPayment: number;
  endOfTermFee: number;
  mileagePenalty: number;
}

export interface CarResult {
  id: string;
  name: string;
  brand?: string;
  fuelType?: FuelType;
  financingMode: FinancingMode;
  ownershipMonths: number;
  annualFuelCost: number;
  totalDepreciation: number;
  totalOwnershipCost: number;
  monthlyCost: number;
  yearlyCost: number;
  costPerKm: number;
  residualValuePercent: number;
  breakdown: CostBreakdown;
  verdict: string;
}

// ─── Residual value ──────────────────────────────────────────────────────────

export function calculateResidualPercent(years: number, fuelType: FuelType): number {
  if (years <= 0) return 100;
  const firstYearRetention = fuelType === "electric" ? 0.75 : 0.80;
  const annualRetention = fuelType === "electric" ? 0.88 : 0.87;
  if (years <= 1) {
    return Math.round((1 - (1 - firstYearRetention) * years) * 100);
  }
  const remainingYears = years - 1;
  const residual = firstYearRetention * Math.pow(annualRetention, remainingYears);
  return Math.round(Math.max(residual * 100, 5));
}

// ─── Loan monthly payment (annuity with optional balloon) ────────────────────

function calculateLoanMonthlyPayment(
  principal: number,
  annualRatePercent: number,
  months: number,
  balloon: number,
): number {
  if (months <= 0 || principal <= 0) return 0;
  const r = annualRatePercent / 100 / 12;
  if (r === 0) {
    return (principal - balloon) / months;
  }
  // PV of balloon at end of term
  const pvBalloon = balloon / Math.pow(1 + r, months);
  const amortized = principal - pvBalloon;
  return amortized * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

// ─── Main calculation ────────────────────────────────────────────────────────

export function calculateResults(car: CarInput): CarResult {
  const ownershipYears = Math.max(car.ownershipYears, 0.25);
  const ownershipMonths = Math.round(ownershipYears * 12);
  const totalKm = car.annualMileage * ownershipYears;

  const annualFuelCost = (car.annualMileage / 100) * car.fuelConsumption * car.fuelPrice;
  const totalFuel = annualFuelCost * ownershipYears;
  const totalInsurance = car.insuranceCost * ownershipYears;
  const totalTax = car.taxCost * ownershipYears;
  const totalService = car.serviceCost * ownershipYears;

  const emptyBreakdown: CostBreakdown = {
    fuel: 0, insurance: 0, tax: 0, service: 0, depreciation: 0,
    financingCost: 0, leaseCost: 0, downPayment: 0, endOfTermFee: 0, mileagePenalty: 0,
  };

  const runningCosts = { fuel: totalFuel, insurance: totalInsurance, tax: totalTax, service: totalService };

  const buildResult = (
    breakdown: CostBreakdown,
    totalOwnershipCost: number,
    residualPercent: number,
    totalDepreciation: number,
  ): CarResult => {
    const monthlyCost = totalOwnershipCost / ownershipMonths;
    const yearlyCost = totalOwnershipCost / ownershipYears;
    const costPerKm = totalKm > 0 ? totalOwnershipCost / totalKm : 0;
    return {
      id: car.id,
      name: car.name || "Namnlös bil",
      brand: car.brand,
      fuelType: car.fuelType,
      financingMode: car.financingMode,
      ownershipMonths,
      annualFuelCost: Math.round(annualFuelCost),
      totalDepreciation: Math.round(totalDepreciation),
      totalOwnershipCost: Math.round(totalOwnershipCost),
      monthlyCost: Math.round(monthlyCost),
      yearlyCost: Math.round(yearlyCost),
      costPerKm: Math.round(costPerKm * 100) / 100,
      residualValuePercent: residualPercent,
      breakdown: {
        fuel: Math.round(runningCosts.fuel),
        insurance: Math.round(runningCosts.insurance),
        tax: Math.round(runningCosts.tax),
        service: Math.round(runningCosts.service),
        depreciation: Math.round(breakdown.depreciation),
        financingCost: Math.round(breakdown.financingCost),
        leaseCost: Math.round(breakdown.leaseCost),
        downPayment: Math.round(breakdown.downPayment),
        endOfTermFee: Math.round(breakdown.endOfTermFee),
        mileagePenalty: Math.round(breakdown.mileagePenalty),
      },
      verdict: "",
    };
  };

  // ── Cash ───────────────────────────────────────────────────────────────────
  if (car.financingMode === "cash") {
    const residualPercent = calculateResidualPercent(ownershipYears, car.fuelType);
    const totalDepreciation = car.purchasePrice * (1 - residualPercent / 100);
    const totalOwnershipCost = totalDepreciation + totalFuel + totalInsurance + totalTax + totalService;

    return buildResult(
      { ...emptyBreakdown, depreciation: totalDepreciation },
      totalOwnershipCost,
      residualPercent,
      totalDepreciation,
    );
  }

  // ── Loan ───────────────────────────────────────────────────────────────────
  // Key principle: ownership cost = depreciation + financing cost (interest + fees) + running costs
  // Principal repayment is NOT an additional cost — it's captured by depreciation.
  if (car.financingMode === "loan") {
    const loan = car.loan;
    const loanAmount = Math.max(0, car.purchasePrice - loan.downPayment);
    const loanMonths = Math.max(1, loan.loanTermMonths);

    const monthlyPayment = calculateLoanMonthlyPayment(
      loanAmount, loan.interestRate, loanMonths, loan.residualBalloon,
    );
    const totalLoanPayments = monthlyPayment * loanMonths;
    const totalAdminFees = loan.monthlyAdminFee * loanMonths;

    // Interest cost = total payments + balloon - original loan amount
    const interestCost = Math.max(0, totalLoanPayments + loan.residualBalloon - loanAmount);
    const financingCost = interestCost + totalAdminFees;

    // Depreciation based on ownership years (not loan term)
    const residualPercent = calculateResidualPercent(ownershipYears, car.fuelType);
    const totalDepreciation = car.purchasePrice * (1 - residualPercent / 100);

    // Total = depreciation + financing cost + running costs
    // (depreciation covers the equity loss; financing cost covers the cost of borrowing)
    const totalOwnershipCost = totalDepreciation + financingCost + totalFuel + totalInsurance + totalTax + totalService;

    return buildResult(
      { ...emptyBreakdown, depreciation: totalDepreciation, financingCost },
      totalOwnershipCost,
      residualPercent,
      totalDepreciation,
    );
  }

  // ── Leasing ────────────────────────────────────────────────────────────────
  // For lease: cost = lease payments + upfront + fees + running costs
  // No separate depreciation — it's embedded in the lease rate.
  const lease = car.leasing;
  const leaseMonths = Math.max(1, lease.leaseDurationMonths);
  // Ownership duration for a lease defaults to the contract length
  const leaseYears = leaseMonths / 12;
  // Running costs are for the lease duration specifically
  const leaseFuel = annualFuelCost * leaseYears;
  const leaseInsurance = car.insuranceCost * leaseYears;
  const leaseTax = car.taxCost * leaseYears;
  const leaseService = car.serviceCost * leaseYears;

  const totalLease = lease.monthlyLeaseCost * leaseMonths;
  const excessMileage = Math.max(0, car.annualMileage - lease.includedMileage);
  const mileagePenalty = excessMileage * lease.excessMileageCostPerKm * leaseYears;

  const totalOwnershipCost =
    lease.downPayment + totalLease + mileagePenalty + lease.endOfTermFee +
    leaseFuel + leaseInsurance + leaseTax + leaseService;

  return {
    id: car.id,
    name: car.name || "Namnlös bil",
    brand: car.brand,
    fuelType: car.fuelType,
    financingMode: "leasing",
    ownershipMonths: leaseMonths,
    annualFuelCost: Math.round(annualFuelCost),
    totalDepreciation: 0,
    totalOwnershipCost: Math.round(totalOwnershipCost),
    monthlyCost: Math.round(totalOwnershipCost / leaseMonths),
    yearlyCost: Math.round(totalOwnershipCost / leaseYears),
    costPerKm: car.annualMileage * leaseYears > 0
      ? Math.round(totalOwnershipCost / (car.annualMileage * leaseYears) * 100) / 100
      : 0,
    residualValuePercent: 0,
    breakdown: {
      ...emptyBreakdown,
      fuel: Math.round(leaseFuel),
      insurance: Math.round(leaseInsurance),
      tax: Math.round(leaseTax),
      service: Math.round(leaseService),
      leaseCost: Math.round(totalLease),
      downPayment: Math.round(lease.downPayment),
      endOfTermFee: Math.round(lease.endOfTermFee),
      mileagePenalty: Math.round(mileagePenalty),
    },
    verdict: "",
  };
}

// ─── Defaults ────────────────────────────────────────────────────────────────

export function createEmptyCar(id: string): CarInput {
  return {
    id,
    brand: "",
    model: "",
    name: "",
    modelYear: new Date().getFullYear(),
    purchasePrice: 0,
    priceSource: "missing",
    ownershipYears: 5,
    annualMileage: 15000,
    fuelType: "petrol",
    fuelConsumption: 0,
    estimatedCo2GKm: null,
    fuelPrice: 18.5,
    insuranceCost: 6000,
    taxCost: 0,
    taxCostSource: "estimated",
    serviceCost: 0,
    isConfigured: false,
    financingMode: "cash",
    loan: {
      downPayment: 0,
      interestRate: 5.5,
      loanTermMonths: 60,
      residualBalloon: 0,
      monthlyAdminFee: 0,
    },
    leasing: {
      monthlyLeaseCost: 0,
      downPayment: 0,
      leaseDurationMonths: 36,
      includedMileage: 15000,
      excessMileageCostPerKm: 1.5,
      endOfTermFee: 0,
    },
  };
}

// ─── Currency ────────────────────────────────────────────────────────────────

export const SEK_TO_EUR = 0.088;
export const SEK_TO_USD = 0.094;
export const SEK_TO_VND = 2550;

export function convertSekToCurrency(value: number, currency: Currency): number {
  if (currency === "EUR") return value * SEK_TO_EUR;
  if (currency === "USD") return value * SEK_TO_USD;
  if (currency === "VND") return value * SEK_TO_VND;
  return value;
}

export function getCurrencyCode(currency: Currency): string {
  if (currency === "EUR") return "EUR";
  if (currency === "USD") return "USD";
  if (currency === "VND") return "VND";
  return "SEK";
}

export function formatCurrency(value: number, currency: Currency): string {
  if (currency === "EUR") {
    return `€${Math.round(convertSekToCurrency(value, currency)).toLocaleString("sv-SE")}`;
  }
  if (currency === "USD") {
    return `$${Math.round(convertSekToCurrency(value, currency)).toLocaleString("en-US")}`;
  }
  if (currency === "VND") {
    return `${Math.round(convertSekToCurrency(value, currency)).toLocaleString("vi-VN")} ₫`;
  }
  return `${Math.round(value).toLocaleString("sv-SE")} kr`;
}

// ─── Verdicts ────────────────────────────────────────────────────────────────

export function generateVerdict(result: CarResult, allResults: CarResult[]): string {
  if (allResults.length < 2) return "";

  const sortedMonthly = [...allResults].sort((a, b) => a.monthlyCost - b.monthlyCost);
  const sortedTotal = [...allResults].sort((a, b) => a.totalOwnershipCost - b.totalOwnershipCost);

  const isLowestMonthly = result.id === sortedMonthly[0].id;
  const isLowestTotal = result.id === sortedTotal[0].id;

  if (isLowestMonthly && isLowestTotal) return "Lägst månadskostnad och totalkostnad";
  if (isLowestMonthly) return "Lägst månadskostnad";
  if (isLowestTotal) return "Lägst totalkostnad";

  const b = result.breakdown;
  const total = result.totalOwnershipCost;
  if (total === 0) return "";

  const runningCosts = b.fuel + b.insurance + b.tax + b.service;
  const avgRunning = allResults.reduce((sum, r) => {
    const rb = r.breakdown;
    return sum + rb.fuel + rb.insurance + rb.tax + rb.service;
  }, 0) / allResults.length;

  if (runningCosts < avgRunning * 0.8) return "Låga löpande kostnader";
  if (b.depreciation / total > 0.45) return "Hög andel värdeminskning";
  if (b.financingCost / total > 0.15) return "Hög finansieringskostnad";
  if (b.fuel / total > 0.3) return "Hög andel bränslekostnad";
  if (result.financingMode === "leasing" && result.ownershipMonths <= 36) return "Leasing är billigare på kort sikt";
  if (result.costPerKm < sortedMonthly[0].costPerKm * 1.05) return "Konkurrenskraftig kostnad per km";

  return "Högre totalkostnad";
}
