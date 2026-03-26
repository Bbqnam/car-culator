export type FuelType = "petrol" | "diesel" | "electric";
export type Currency = "SEK" | "EUR";
export type FinancingMode = "cash" | "loan" | "leasing";

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
  purchasePrice: number;
  ownershipYears: number;
  annualMileage: number;
  fuelType: FuelType;
  fuelConsumption: number;
  fuelPrice: number;
  insuranceCost: number;
  taxCost: number;
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
  annualFuelCost: number;
  totalDepreciation: number;
  totalOwnershipCost: number;
  monthlyCost: number;
  yearlyCost: number;
  residualValuePercent: number;
  breakdown: CostBreakdown;
  verdict: string;
}

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

function calculateLoanMonthlyPayment(principal: number, annualRate: number, months: number, balloon: number): number {
  if (months <= 0 || principal <= 0) return 0;
  const adjustedPrincipal = principal - balloon / Math.pow(1 + annualRate / 12, months);
  if (annualRate === 0) return adjustedPrincipal / months;
  const r = annualRate / 100 / 12;
  return adjustedPrincipal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

export function calculateResults(car: CarInput): CarResult {
  const annualFuelCost = (car.annualMileage / 100) * car.fuelConsumption * car.fuelPrice;

  const emptyBreakdown: CostBreakdown = {
    fuel: 0, insurance: 0, tax: 0, service: 0, depreciation: 0,
    financingCost: 0, leaseCost: 0, downPayment: 0, endOfTermFee: 0, mileagePenalty: 0,
  };

  if (car.financingMode === "cash") {
    const residualPercent = calculateResidualPercent(car.ownershipYears, car.fuelType);
    const residualValue = car.purchasePrice * (residualPercent / 100);
    const totalDepreciation = car.purchasePrice - residualValue;
    const totalFuel = annualFuelCost * car.ownershipYears;
    const totalInsurance = car.insuranceCost * car.ownershipYears;
    const totalTax = car.taxCost * car.ownershipYears;
    const totalService = car.serviceCost * car.ownershipYears;
    const totalOwnershipCost = totalDepreciation + totalFuel + totalInsurance + totalTax + totalService;
    const monthlyCost = totalOwnershipCost / (car.ownershipYears * 12);

    return {
      id: car.id, name: car.name || "Unnamed Car", brand: car.brand, fuelType: car.fuelType,
      financingMode: "cash",
      annualFuelCost: Math.round(annualFuelCost),
      totalDepreciation: Math.round(totalDepreciation),
      totalOwnershipCost: Math.round(totalOwnershipCost),
      monthlyCost: Math.round(monthlyCost),
      yearlyCost: Math.round(totalOwnershipCost / car.ownershipYears),
      residualValuePercent: residualPercent,
      breakdown: {
        ...emptyBreakdown,
        fuel: Math.round(totalFuel), insurance: Math.round(totalInsurance),
        tax: Math.round(totalTax), service: Math.round(totalService),
        depreciation: Math.round(totalDepreciation),
      },
      verdict: "",
    };
  }

  if (car.financingMode === "loan") {
    const loan = car.loan;
    const loanAmount = car.purchasePrice - loan.downPayment;
    const months = loan.loanTermMonths || 60;
    const years = months / 12;
    const monthlyPayment = calculateLoanMonthlyPayment(loanAmount, loan.interestRate, months, loan.residualBalloon);
    const totalLoanPayments = monthlyPayment * months;
    const totalAdminFees = loan.monthlyAdminFee * months;
    const financingCost = totalLoanPayments + totalAdminFees + loan.residualBalloon - loanAmount;

    const totalFuel = annualFuelCost * years;
    const totalInsurance = car.insuranceCost * years;
    const totalTax = car.taxCost * years;
    const totalService = car.serviceCost * years;

    const residualPercent = calculateResidualPercent(years, car.fuelType);
    const residualValue = car.purchasePrice * (residualPercent / 100);
    const totalDepreciation = car.purchasePrice - residualValue;

    const totalOwnershipCost = loan.downPayment + totalLoanPayments + totalAdminFees + loan.residualBalloon + totalFuel + totalInsurance + totalTax + totalService;
    const monthlyCost = totalOwnershipCost / months;

    return {
      id: car.id, name: car.name || "Unnamed Car", brand: car.brand, fuelType: car.fuelType,
      financingMode: "loan",
      annualFuelCost: Math.round(annualFuelCost),
      totalDepreciation: Math.round(totalDepreciation),
      totalOwnershipCost: Math.round(totalOwnershipCost),
      monthlyCost: Math.round(monthlyCost),
      yearlyCost: Math.round(totalOwnershipCost / years),
      residualValuePercent: residualPercent,
      breakdown: {
        ...emptyBreakdown,
        fuel: Math.round(totalFuel), insurance: Math.round(totalInsurance),
        tax: Math.round(totalTax), service: Math.round(totalService),
        depreciation: Math.round(totalDepreciation),
        financingCost: Math.round(financingCost),
        downPayment: Math.round(loan.downPayment),
      },
      verdict: "",
    };
  }

  // Leasing
  const lease = car.leasing;
  const months = lease.leaseDurationMonths || 36;
  const years = months / 12;
  const totalLease = lease.monthlyLeaseCost * months;
  const excessMileage = Math.max(0, car.annualMileage - lease.includedMileage);
  const mileagePenalty = excessMileage * lease.excessMileageCostPerKm * years;

  const totalFuel = annualFuelCost * years;
  const totalInsurance = car.insuranceCost * years;
  const totalTax = car.taxCost * years;
  const totalService = car.serviceCost * years;

  const totalOwnershipCost = lease.downPayment + totalLease + mileagePenalty + lease.endOfTermFee + totalFuel + totalInsurance + totalTax + totalService;
  const monthlyCost = totalOwnershipCost / months;

  return {
    id: car.id, name: car.name || "Unnamed Car", brand: car.brand, fuelType: car.fuelType,
    financingMode: "leasing",
    annualFuelCost: Math.round(annualFuelCost),
    totalDepreciation: 0,
    totalOwnershipCost: Math.round(totalOwnershipCost),
    monthlyCost: Math.round(monthlyCost),
    yearlyCost: Math.round(totalOwnershipCost / years),
    residualValuePercent: 0,
    breakdown: {
      ...emptyBreakdown,
      fuel: Math.round(totalFuel), insurance: Math.round(totalInsurance),
      tax: Math.round(totalTax), service: Math.round(totalService),
      leaseCost: Math.round(totalLease),
      downPayment: Math.round(lease.downPayment),
      endOfTermFee: Math.round(lease.endOfTermFee),
      mileagePenalty: Math.round(mileagePenalty),
    },
    verdict: "",
  };
}

export function createEmptyCar(id: string): CarInput {
  return {
    id,
    brand: "",
    model: "",
    name: "",
    purchasePrice: 0,
    ownershipYears: 5,
    annualMileage: 15000,
    fuelType: "petrol",
    fuelConsumption: 0,
    fuelPrice: 18.5,
    insuranceCost: 6000,
    taxCost: 0,
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

export const SEK_TO_EUR = 0.088;

export function formatCurrency(value: number, currency: Currency): string {
  if (currency === "EUR") {
    return `€${Math.round(value * SEK_TO_EUR).toLocaleString("sv-SE")}`;
  }
  return `${Math.round(value).toLocaleString("sv-SE")} kr`;
}

export function generateVerdict(result: CarResult, allResults: CarResult[]): string {
  if (allResults.length < 2) return "";
  const sorted = [...allResults].sort((a, b) => a.monthlyCost - b.monthlyCost);
  if (result.id === sorted[0].id) return "Best value";

  const b = result.breakdown;
  const total = result.totalOwnershipCost;
  if (total === 0) return "";

  if (b.depreciation / total > 0.45) return "High depreciation";
  if (b.financingCost / total > 0.2) return "High financing cost";
  if (b.fuel / total > 0.3) return "High fuel cost";
  if (result.financingMode === "leasing") return "Lease convenience";

  const years = result.financingMode === "loan"
    ? (result.breakdown.financingCost > 0 ? 5 : result.totalOwnershipCost / result.yearlyCost)
    : result.totalOwnershipCost / result.yearlyCost;

  if (years <= 3) return "Better for short-term";
  return "Better for long-term";
}
