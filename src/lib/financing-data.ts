import type { FuelType } from "@/lib/car-types";

export type FinancingAvailabilityStatus = "available" | "manual_only" | "unknown" | "unavailable";
export type FinancingRateType = "fixed" | "variable" | "range" | "policy" | "campaign";
export type LoanAmortizationModel = "annuity" | "straight";

export interface FinancingSourceMeta {
  providerName: string;
  providerLabel: string;
  sourceUrl: string;
  checkedAt: string;
  validUntil?: string;
  notes?: string;
}

export interface LoanBenchmarkRate extends FinancingSourceMeta {
  id: string;
  rateType: FinancingRateType;
  amortizationModel: LoanAmortizationModel;
  benchmarkKind: "policy_rate" | "bank_loan" | "green_car_loan" | "brand_campaign";
  nominalRatePercent?: number;
  effectiveRatePercent?: number;
  minRatePercent?: number;
  maxRatePercent?: number;
  exampleMonthlyCostSek?: number;
  setupFeeSek?: number;
  monthlyFeeSek?: number;
  minTermMonths?: number;
  maxTermMonths?: number;
  fixedTermMonths?: number;
  minDownPaymentPercent?: number;
  balloonPercent?: number;
}

export interface LeaseDefaults {
  monthlyLeaseCost: number;
  downPayment: number;
  leaseDurationMonths: number;
  includedMileage: number;
  excessMileageCostPerKm: number;
  endOfTermFee: number;
}

export interface LeasingAvailability extends FinancingSourceMeta {
  status: FinancingAvailabilityStatus;
  brand: string;
  model?: string;
  rateType?: FinancingRateType;
  monthlyCostSek?: number;
  durationMonths?: number;
  annualMileageKm?: number;
  downPaymentSek?: number;
  includedServices?: string[];
}

export interface LoanDefaultsSuggestion {
  benchmark: LoanBenchmarkRate;
  interestRatePercent: number;
  loanTermMonths: number;
  monthlyAdminFee: number;
  downPaymentPercent: number;
  residualBalloonPercent: number;
}

interface ModelKey {
  brand: string;
  model?: string;
}

const DEFAULT_EXCESS_MILEAGE_COST_PER_KM = 1.5;
const DEFAULT_REFERENCE_DATE = new Date().toISOString().slice(0, 10);

const LOAN_BENCHMARKS: LoanBenchmarkRate[] = [
  {
    id: "riksbank-policy-rate",
    providerName: "Sveriges Riksbank",
    providerLabel: "Riksbank policy rate",
    benchmarkKind: "policy_rate",
    rateType: "policy",
    amortizationModel: "annuity",
    nominalRatePercent: 1.75,
    sourceUrl: "https://www.riksbank.se/sv/penningpolitik/vad-ar-penningpolitik/vad-ar-styrrantan/",
    checkedAt: "2026-03-31",
    notes: "Policy rate 1.75%, effective from 2026-02-04 according to the official Riksbank page.",
  },
  {
    id: "swedbank-billan",
    providerName: "Swedbank",
    providerLabel: "Swedbank Billan",
    benchmarkKind: "bank_loan",
    rateType: "variable",
    amortizationModel: "straight",
    nominalRatePercent: 6.19,
    effectiveRatePercent: 7.07,
    setupFeeSek: 550,
    monthlyFeeSek: 0,
    minTermMonths: 12,
    maxTermMonths: 96,
    minDownPaymentPercent: 20,
    sourceUrl: "https://www.swedbank.se/privat/rantor-priser-och-kurser/lanetjanster.html",
    checkedAt: "2026-03-31",
    notes: "Published on Swedbank's official loan price list with rak amortering, 6.19% variable example rate, 550 kr setup fee, and a representative 60-month example.",
  },
  {
    id: "swedbank-gront-billan",
    providerName: "Swedbank",
    providerLabel: "Swedbank Gront Billan",
    benchmarkKind: "green_car_loan",
    rateType: "variable",
    amortizationModel: "straight",
    nominalRatePercent: 5.19,
    effectiveRatePercent: 6.01,
    setupFeeSek: 550,
    monthlyFeeSek: 0,
    minTermMonths: 12,
    maxTermMonths: 96,
    minDownPaymentPercent: 20,
    sourceUrl: "https://www.swedbank.se/privat/rantor-priser-och-kurser/lanetjanster.html",
    checkedAt: "2026-03-31",
    notes: "Published on Swedbank's official loan price list with rak amortering, 5.19% variable green car rate, 550 kr setup fee, and a representative 60-month example.",
  },
  {
    id: "nordea-billan",
    providerName: "Nordea",
    providerLabel: "Nordea Billan",
    benchmarkKind: "bank_loan",
    rateType: "range",
    amortizationModel: "straight",
    minRatePercent: 4.95,
    maxRatePercent: 12.95,
    effectiveRatePercent: 8.71,
    setupFeeSek: 525,
    monthlyFeeSek: 0,
    minTermMonths: 12,
    maxTermMonths: 84,
    sourceUrl: "https://www.nordea.se/privat/produkter/lan/billan.html",
    checkedAt: "2026-03-31",
    notes: "Nordea publishes an individual variable rate span, 525 kr setup fee, and a representative 84-month rak amortering example at 8.20% nominal (effective 8.71%) dated 2026-03-05.",
  },
  {
    id: "ica-billan",
    providerName: "ICA Banken",
    providerLabel: "ICA Banken Billan",
    benchmarkKind: "bank_loan",
    rateType: "range",
    amortizationModel: "annuity",
    minRatePercent: 5.84,
    maxRatePercent: 15.95,
    effectiveRatePercent: 8.19,
    setupFeeSek: 0,
    monthlyFeeSek: 0,
    minTermMonths: 36,
    maxTermMonths: 144,
    sourceUrl: "https://www.icabanken.se/lana/billan/",
    checkedAt: "2026-04-02",
    notes: "ICA Banken's billan page lists 5.84% - 15.95% variable rate, 0 kr aviavgift with Kivra or autogiro, and a representative effective rate of 8.19%. Paper invoice adds 35 kr/month.",
  },
  {
    id: "ica-elbilslan",
    providerName: "ICA Banken",
    providerLabel: "ICA Banken Elbilslan",
    benchmarkKind: "green_car_loan",
    rateType: "range",
    amortizationModel: "annuity",
    minRatePercent: 5.84,
    maxRatePercent: 15.95,
    effectiveRatePercent: 9.27,
    setupFeeSek: 0,
    monthlyFeeSek: 0,
    minTermMonths: 36,
    maxTermMonths: 144,
    sourceUrl: "https://www.icabanken.se/lana/billan/elbilslan/",
    checkedAt: "2026-04-02",
    notes: "ICA Banken's elbilslan page lists current rates from 2026-01-01 at 5.84% - 15.95%, 0 kr aviavgift with Kivra or autogiro, and a representative 9-year example at 8.90% nominal / 9.27% effective rate.",
  },
  {
    id: "seb-enkla-lanet",
    providerName: "SEB",
    providerLabel: "SEB Enkla lanet",
    benchmarkKind: "bank_loan",
    rateType: "range",
    amortizationModel: "straight",
    minRatePercent: 6.2,
    maxRatePercent: 13.65,
    effectiveRatePercent: 8.79,
    setupFeeSek: 300,
    monthlyFeeSek: 0,
    minTermMonths: 24,
    maxTermMonths: 120,
    sourceUrl: "https://seb.se/privat/privatlan-och-krediter/privatlan-enkla-lanet",
    checkedAt: "2026-04-02",
    notes: "SEB's Enkla lanet page lists a 6.20% - 13.65% rate span, rak amortering, and a representative 5-year example at 8.32% nominal / 8.79% effective with a 300 kr setup fee. This is shown as a general ownership benchmark rather than a secured billan.",
  },
  {
    id: "handelsbanken-privatlan",
    providerName: "Handelsbanken",
    providerLabel: "Handelsbanken Privatlan",
    benchmarkKind: "bank_loan",
    rateType: "variable",
    amortizationModel: "straight",
    nominalRatePercent: 7.45,
    effectiveRatePercent: 8.17,
    setupFeeSek: 500,
    monthlyFeeSek: 0,
    minTermMonths: 12,
    maxTermMonths: 120,
    sourceUrl: "https://www.handelsbanken.se/sv/om-oss/juridiska-dokument/prislistor-privat/prislista-lan/avgifter-och-ranta-for-privatlanet",
    checkedAt: "2026-04-02",
    notes: "Handelsbanken's published price list for Privatlan Direkt states rak amortering, 7.45% variable interest, 8.17% effective rate, 500 kr setup fee, and no monthly fee with debiteringskonto. This is shown as a general ownership benchmark rather than a secured billan.",
  },
  {
    id: "toyota-bz4x-campaign",
    providerName: "Toyota Financial Services",
    providerLabel: "Toyota Easy Billan",
    benchmarkKind: "brand_campaign",
    rateType: "campaign",
    amortizationModel: "annuity",
    nominalRatePercent: 0,
    exampleMonthlyCostSek: 3333,
    fixedTermMonths: 36,
    minDownPaymentPercent: 30,
    balloonPercent: 45,
    sourceUrl: "https://www.toyota.se/bilar/kampanjer/bz4x",
    checkedAt: "2026-03-31",
    validUntil: "2026-03-31",
    notes: "Toyota's official bZ4X campaign page listed 0% Easy Billan through 2026-03-31 with 30% down payment, 36 months, and 45% guaranteed future value.",
  },
];

const EXACT_LEASING_AVAILABILITY: LeasingAvailability[] = [
  {
    brand: "Volvo",
    model: "EX30",
    status: "available",
    providerName: "Volvo Cars",
    providerLabel: "Care by Volvo Privatleasing",
    rateType: "fixed",
    monthlyCostSek: 4195,
    durationMonths: 36,
    annualMileageKm: 15000,
    downPaymentSek: 0,
    includedServices: ["Financing", "Service agreement"],
    sourceUrl: "https://www.volvocars.com/se/build/private/operating-lease/ex30-electric/",
    checkedAt: "2026-04-02",
    notes: "Volvo Cars Sweden's EX30 private lease configurator lists EX30 Single Motor Plus from 4,195 kr/month with 36 months and no down payment.",
  },
  {
    brand: "Volvo",
    model: "EX40",
    status: "available",
    providerName: "Volvo Cars",
    providerLabel: "Care by Volvo Privatleasing",
    rateType: "fixed",
    monthlyCostSek: 5195,
    durationMonths: 36,
    annualMileageKm: 10000,
    downPaymentSek: 0,
    includedServices: ["Financing", "Service agreement"],
    sourceUrl: "https://www.volvocars.com/se/build/ex40-electric/?financing=private-lease",
    checkedAt: "2026-04-02",
    notes: "Volvo Cars Sweden's EX40 private lease configurator lists 5,195 kr/month with 36 months, 10,000 km/year, and no down payment.",
  },
  {
    brand: "Volvo",
    model: "EX60",
    status: "available",
    providerName: "Volvo Cars",
    providerLabel: "Care by Volvo Privatleasing",
    rateType: "fixed",
    monthlyCostSek: 8995,
    durationMonths: 36,
    annualMileageKm: 10000,
    downPaymentSek: 0,
    includedServices: ["Financing", "Service agreement"],
    sourceUrl: "https://www.volvocars.com/se/l/erbjudanden/ex90/",
    checkedAt: "2026-04-02",
    notes: "Volvo Cars Sweden's current offers page lists EX60 private lease from 8,995 kr/month with 36 months and 10,000 km/year.",
  },
  {
    brand: "Polestar",
    model: "Polestar 2",
    status: "available",
    providerName: "Polestar",
    providerLabel: "Polestar Privatleasing",
    rateType: "fixed",
    monthlyCostSek: 5495,
    durationMonths: 36,
    annualMileageKm: 15000,
    downPaymentSek: 0,
    includedServices: [],
    sourceUrl: "https://www.polestar.com/se/offers/polestar-2-business-edition-private-lease/",
    checkedAt: "2026-03-31",
    validUntil: "2026-03-31",
    notes: "Business edition private lease with fixed rate and 0 kr in first increased rent.",
  },
  {
    brand: "Polestar",
    model: "Polestar 3",
    status: "available",
    providerName: "Polestar",
    providerLabel: "Polestar Privatleasing",
    rateType: "fixed",
    monthlyCostSek: 9995,
    durationMonths: 36,
    annualMileageKm: 15000,
    downPaymentSek: 0,
    includedServices: ["Service up to 3 years / 5,000 mil"],
    sourceUrl: "https://www.polestar.com/se/offers/privatleasing-polestar-3-2025/",
    checkedAt: "2026-03-31",
    validUntil: "2026-03-31",
    notes: "Private lease for the Polestar 3 Business edition with fixed monthly cost.",
  },
  {
    brand: "Polestar",
    model: "Polestar 4",
    status: "available",
    providerName: "Polestar",
    providerLabel: "Polestar Privatleasing",
    rateType: "fixed",
    monthlyCostSek: 6995,
    durationMonths: 36,
    annualMileageKm: 15000,
    downPaymentSek: 0,
    includedServices: ["Pilot package", "Plus package", "Winter wheels"],
    sourceUrl: "https://www.polestar.com/se/offers/polestar-4-business-edition-private-lease/",
    checkedAt: "2026-03-31",
    validUntil: "2026-03-31",
    notes: "Current Polestar 4 Business edition private lease offer with 0 kr in first increased rent and fixed monthly price.",
  },
  {
    brand: "Toyota",
    model: "bZ4X",
    status: "available",
    providerName: "Toyota Financial Services",
    providerLabel: "Toyota Easy Privatleasing",
    rateType: "fixed",
    monthlyCostSek: 5895,
    durationMonths: 36,
    annualMileageKm: 15000,
    downPaymentSek: 0,
    includedServices: ["Service"],
    sourceUrl: "https://www.toyota.se/bilar/kampanjer/privatleasing-elbil",
    checkedAt: "2026-03-31",
    validUntil: "2026-03-31",
    notes: "Electric private lease campaign listed on Toyota's official Sweden offers page.",
  },
];

const BRAND_LEVEL_LEASING_SUPPORT: LeasingAvailability[] = [
  {
    brand: "Volvo",
    status: "manual_only",
    providerName: "Volvo Cars",
    providerLabel: "Care by Volvo Privatleasing",
    rateType: "variable",
    sourceUrl: "https://www.volvocars.com/se/privatleasing/",
    checkedAt: "2026-03-31",
    notes:
      "Volvo's Sweden private leasing page says all Volvo models can be requested for private lease. Pricing can vary with market rates and customer risk class, so the app keeps leasing editable unless a verified model offer is stored.",
  },
  {
    brand: "Polestar",
    status: "manual_only",
    providerName: "Polestar",
    providerLabel: "Polestar Privatleasing",
    rateType: "fixed",
    sourceUrl: "https://www.polestar.com/se/how-to-buy-a-polestar/finance/",
    checkedAt: "2026-03-31",
    notes:
      "Polestar's Sweden finance page confirms private leasing as a standard financing option, but the app only auto-fills current offers when a model-specific page is verified and still active.",
  },
  {
    brand: "Kia",
    status: "manual_only",
    providerName: "Kia Finans",
    providerLabel: "Kia Privatleasing",
    rateType: "variable",
    sourceUrl: "https://www.kia.com/se/kopa/privatleasing/",
    checkedAt: "2026-03-31",
    notes:
      "Kia Sweden publishes private leasing terms with variable monthly fees tied to the lessor's funding costs. The app currently stores the financing channel, but not live model-by-model Kia campaign prices yet.",
  },
];

function normalizeKey(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function matchesKey(candidate: ModelKey, brand: string, model?: string): boolean {
  if (normalizeKey(candidate.brand) !== normalizeKey(brand)) return false;
  if (!candidate.model) return true;
  if (!model) return false;
  const candidateModel = normalizeKey(candidate.model);
  const selectedModel = normalizeKey(model);

  return (
    candidateModel === selectedModel ||
    selectedModel.includes(candidateModel) ||
    candidateModel.includes(selectedModel)
  );
}

function isStillCurrent(validUntil: string | undefined, referenceDate: string): boolean {
  if (!validUntil) return true;
  return validUntil >= referenceDate;
}

export function getLoanBenchmarks(
  fuelType: FuelType,
  brand?: string,
  model?: string,
  referenceDate = DEFAULT_REFERENCE_DATE,
): LoanBenchmarkRate[] {
  const activeBenchmarks = LOAN_BENCHMARKS.filter((item) => isStillCurrent(item.validUntil, referenceDate));
  const preferredIds = new Set<string>([
    "riksbank-policy-rate",
    "nordea-billan",
    "ica-billan",
    "seb-enkla-lanet",
    "handelsbanken-privatlan",
  ]);

  if (fuelType === "electric") {
    preferredIds.add("swedbank-gront-billan");
    preferredIds.add("ica-elbilslan");
  } else {
    preferredIds.add("swedbank-billan");
  }

  if (brand && model && normalizeKey(brand) === "toyota" && normalizeKey(model) === "bz4x") {
    preferredIds.add("toyota-bz4x-campaign");
  }

  const preferred = activeBenchmarks.filter((item) => preferredIds.has(item.id));
  const remaining = activeBenchmarks.filter((item) => !preferredIds.has(item.id));
  return [...preferred, ...remaining];
}

export function getPreferredLoanDefaults(
  fuelType: FuelType,
  referenceDate = DEFAULT_REFERENCE_DATE,
): LoanDefaultsSuggestion {
  const benchmarkId = fuelType === "electric" ? "swedbank-gront-billan" : "swedbank-billan";
  const benchmark =
    LOAN_BENCHMARKS.find((item) => item.id === benchmarkId && isStillCurrent(item.validUntil, referenceDate)) ??
    LOAN_BENCHMARKS[0];

  return {
    benchmark,
    interestRatePercent: benchmark.nominalRatePercent ?? 5.5,
    loanTermMonths: 60,
    monthlyAdminFee: 0,
    downPaymentPercent: 20,
    residualBalloonPercent: 0,
  };
}

export function getLeasingAvailabilities(
  brand?: string,
  model?: string,
  referenceDate = DEFAULT_REFERENCE_DATE,
): LeasingAvailability[] {
  if (!brand) return [];

  const exact = EXACT_LEASING_AVAILABILITY.filter(
    (item) => matchesKey(item, brand, model) && isStillCurrent(item.validUntil, referenceDate),
  );

  if (exact.length > 0) {
    return exact;
  }

  const brandLevel = BRAND_LEVEL_LEASING_SUPPORT.find((item) => matchesKey(item, brand));
  return brandLevel ? [brandLevel] : [];
}

export function getLeasingAvailability(
  brand?: string,
  model?: string,
  referenceDate = DEFAULT_REFERENCE_DATE,
): LeasingAvailability {
  const availabilities = getLeasingAvailabilities(brand, model, referenceDate);
  if (availabilities.length > 0) {
    return availabilities[0];
  }

  if (!brand) {
    return {
      brand: "",
      status: "unknown",
      providerName: "Unknown",
      providerLabel: "Leasing data unavailable",
      sourceUrl: "",
      checkedAt: referenceDate,
    };
  }

  return {
    brand,
    model,
    status: "unknown",
    providerName: "Unknown",
    providerLabel: "Leasing data unavailable",
    sourceUrl: "",
    checkedAt: referenceDate,
    notes: "No verified leasing source has been added for this exact brand and model yet.",
  };
}

export function getSuggestedLeaseDefaults(
  brand?: string,
  model?: string,
  referenceDate = DEFAULT_REFERENCE_DATE,
): LeaseDefaults | null {
  const availability = getLeasingAvailability(brand, model, referenceDate);
  if (availability.status !== "available") return null;

  return {
    monthlyLeaseCost: availability.monthlyCostSek ?? 0,
    downPayment: availability.downPaymentSek ?? 0,
    leaseDurationMonths: availability.durationMonths ?? 36,
    includedMileage: availability.annualMileageKm ?? 15000,
    excessMileageCostPerKm: DEFAULT_EXCESS_MILEAGE_COST_PER_KM,
    endOfTermFee: 0,
  };
}

export function formatRateLabel(rate: LoanBenchmarkRate): string {
  if (typeof rate.nominalRatePercent === "number") {
    return `${rate.nominalRatePercent.toFixed(rate.nominalRatePercent % 1 === 0 ? 0 : 2)}%`;
  }
  if (typeof rate.minRatePercent === "number" && typeof rate.maxRatePercent === "number") {
    return `${rate.minRatePercent.toFixed(2)}% - ${rate.maxRatePercent.toFixed(2)}%`;
  }
  return "n/a";
}
