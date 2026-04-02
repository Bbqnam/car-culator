import { calculateResidualPercent, type CarInput, type CarResult } from "@/lib/car-types";
import {
  getLeasingAvailabilities,
  getLeasingAvailability,
  getLoanBenchmarks,
  type LoanAmortizationModel,
  type LeasingAvailability,
  type LoanBenchmarkRate,
} from "@/lib/financing-data";
import type { Language } from "@/lib/i18n";
import { getProviderVisual } from "@/lib/provider-logos";

export type ProviderType =
  | "bank"
  | "finance_company"
  | "dealer_financing"
  | "leasing_company"
  | "retailer"
  | "marketplace";

export type OfferType =
  | "bank_loan"
  | "dealer_financing"
  | "private_leasing"
  | "balloon_financing"
  | "retailer_listing";

export type SourceType = "mock" | "partner_feed" | "manual";

export type ApprovalSpeed =
  | "Varierar"
  | "Direkt"
  | "< 2 minuter"
  | "Inom 24 h"
  | "1-2 arbetsdagar"
  | "Återförsäljare ringer upp"
  | "Varies"
  | "Instant"
  | "< 2 minutes"
  | "Within 24h"
  | "1-2 business days"
  | "Dealer calls back";

export type OfferBadge =
  | "Bäst värde"
  | "Lägst månadskostnad"
  | "Snabbt godkännande"
  | "Låg kontantinsats"
  | "Flexibelt avtal"
  | "Partnererbjudande"
  | "Sponsrad"
  | "Popular"
  | "Best value"
  | "Lowest monthly cost"
  | "Fast approval"
  | "Low upfront cost"
  | "Flexible contract"
  | "Partner offer"
  | "Sponsored"
  | "Popular";

export type RecommendationCategory =
  | "lowest-monthly"
  | "long-term-ownership"
  | "low-upfront"
  | "flexibility"
  | "predictable-monthly";

export type SortMode =
  | "best"
  | "lowest-monthly"
  | "lowest-total"
  | "lowest-upfront"
  | "fastest-approval";

export interface CarCommercialProfile {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  fuelType?: string;
  monthlyCost: number;
  totalCost: number;
  annualMileageEstimate: number;
  purchasePriceEstimate: number;
}

export interface Provider {
  id: string;
  providerName: string;
  providerType: ProviderType;
  logoText: string;
  logoSrc?: string | null;
  accentColor?: string;
  isPartner: boolean;
  isSponsored: boolean;
  trustSignals: string[];
  sourceUrl?: string;
  checkedAt?: string;
}

export interface CommercialOfferBase {
  id: string;
  providerId: string;
  providerName: string;
  offerLabel?: string;
  providerType: ProviderType;
  offerType: OfferType;
  apr: number;
  nominalRate: number;
  effectiveRate: number;
  monthlyCost: number;
  upfrontCost: number;
  totalCost: number;
  durationMonths: number;
  mileagePerYear?: number;
  residualValue?: number;
  approvalSpeed: ApprovalSpeed;
  isSponsored: boolean;
  badge?: OfferBadge;
  ctaLabel: string;
  ctaUrl: string;
  availability: string;
  sourceType: SourceType;
  checkedAt?: string;
  validUntil?: string;
  notes?: string;
}

export interface FinancingOffer extends CommercialOfferBase {
  offerType: "bank_loan" | "dealer_financing" | "balloon_financing";
  amortizationModel: LoanAmortizationModel;
  firstMonthlyPayment?: number;
  lastMonthlyPayment?: number;
  minimumDownPayment?: number;
  setupFee?: number;
  monthlyFee?: number;
}

export interface LeasingOffer extends CommercialOfferBase {
  offerType: "private_leasing";
  customerType: "private" | "business";
  officialMonthlyPayment: number;
  estimatedOwnershipMonthlyCost: number;
  initialPayment: number;
  annualMileage: number;
  excessMileageCost: number;
  includedServices: string[];
  wearAndTearNote: string;
  endOfContractCondition: string;
}

export interface RetailerOffer {
  id: string;
  providerId: string;
  providerName: string;
  offerLabel?: string;
  providerType: "retailer" | "marketplace";
  offerType: "retailer_listing";
  monthlyCost: number;
  upfrontCost: number;
  totalCost: number;
  apr: number;
  nominalRate: number;
  effectiveRate: number;
  durationMonths: number;
  approvalSpeed: ApprovalSpeed;
  isSponsored: boolean;
  badge?: OfferBadge;
  ctaLabel: string;
  ctaUrl: string;
  availability: string;
  sourceType: SourceType;
  condition: string;
  deliveryEstimate: string;
  dealerLocation: string;
  warrantyInfo: string;
}

export interface RecommendationReason {
  id: string;
  category: RecommendationCategory;
  title: string;
  explanation: string;
  offerId: string;
  sourceType: SourceType;
}

export interface CommercialTrialData {
  car: CarCommercialProfile;
  providers: Provider[];
  loanBenchmarks: LoanBenchmarkRate[];
  leasingAvailability: LeasingAvailability;
  bestFinancing: FinancingOffer;
  bestLeasing: LeasingOffer | null;
  bestRetailer: RetailerOffer | null;
  financingOffers: FinancingOffer[];
  leasingOffers: LeasingOffer[];
  retailerOffers: RetailerOffer[];
  recommendations: RecommendationReason[];
  sortOffers: <T extends CommercialOfferBase>(offers: T[], mode: SortMode) => T[];
  sortRetailerOffers: (offers: RetailerOffer[], mode: SortMode) => RetailerOffer[];
}

interface CommercialContext {
  annualFuelCost: number;
  annualInsuranceCost: number;
  annualTaxCost: number;
  annualServiceCost: number;
  annualMileage: number;
  ownershipYears: number;
  ownershipMonths: number;
  purchasePrice: number;
  residualPercent: number;
  downPayment: number;
  loanTermMonths: number;
  loanResidualBalloon: number;
  monthlyAdminFee: number;
}

interface RetailerListingSource {
  brand: string;
  model: string;
  providerName: string;
  offerLabel: string;
  providerType?: "retailer" | "marketplace";
  listingPrice: number;
  ctaUrl: string;
  checkedAt: string;
  condition: "Ny" | "Begagnad";
  priceAnchorEligible?: boolean;
  dealerLocationSv: string;
  dealerLocationEn: string;
  deliveryEstimateSv: string;
  deliveryEstimateEn: string;
  warrantyInfoSv: string;
  warrantyInfoEn: string;
}

export interface VerifiedRetailerPrice {
  priceSek: number;
  providerName: string;
  offerLabel: string;
  sourceUrl: string;
  checkedAt: string;
  condition: "Ny" | "Begagnad";
}

const SPEED_SCORE: Record<ApprovalSpeed, number> = {
  Varierar: 4,
  Direkt: 1,
  "< 2 minuter": 2,
  "Inom 24 h": 3,
  "1-2 arbetsdagar": 4,
  "Återförsäljare ringer upp": 5,
  Varies: 4,
  Instant: 1,
  "< 2 minutes": 2,
  "Within 24h": 3,
  "1-2 business days": 4,
  "Dealer calls back": 5,
};

const RETAILER_LISTING_SOURCES: RetailerListingSource[] = [
  {
    brand: "Volvo",
    model: "EX30",
    providerName: "Rejmes",
    offerLabel: "EX30 Single Motor Extended Range Plus",
    listingPrice: 519900,
    ctaUrl: "https://rejmes.se/bilar/volvo-ex30-single-motor-extended-range-plus-rce66g/",
    checkedAt: "2026-04-02",
    condition: "Ny",
    dealerLocationSv: "Linkoping",
    dealerLocationEn: "Linkoping",
    deliveryEstimateSv: "Kontakta handlare samma dag",
    deliveryEstimateEn: "Dealer replies the same day",
    warrantyInfoSv: "Volvos nybilsgaranti",
    warrantyInfoEn: "Volvo new-car warranty",
  },
  {
    brand: "Volvo",
    model: "EX30",
    providerName: "Rejmes",
    offerLabel: "EX30 Twin Motor Performance Ultra",
    listingPrice: 379900,
    ctaUrl: "https://rejmes.se/bil/volvo-ex30-twin-motor-performance-ultra-fom36b/",
    checkedAt: "2026-04-02",
    condition: "Begagnad",
    dealerLocationSv: "Linkoping",
    dealerLocationEn: "Linkoping",
    deliveryEstimateSv: "Kontakta handlare samma dag",
    deliveryEstimateEn: "Dealer replies the same day",
    warrantyInfoSv: "Garanti enligt Rejmes annons",
    warrantyInfoEn: "Warranty included per Rejmes listing",
  },
  {
    brand: "Volvo",
    model: "EX30",
    providerName: "Bilia Volvo",
    offerLabel: "EX30 Single Motor Core",
    listingPrice: 355000,
    ctaUrl: "https://www.bilia.se/bilar/sok-bil/volvo/ex30/thn99n/",
    checkedAt: "2026-04-02",
    condition: "Begagnad",
    dealerLocationSv: "Haninge",
    dealerLocationEn: "Haninge",
    deliveryEstimateSv: "Lagerbil hos Bilia Haninge",
    deliveryEstimateEn: "In stock at Bilia Haninge",
    warrantyInfoSv: "Kvalitetssakrad Bilia-bil",
    warrantyInfoEn: "Quality-checked Bilia car",
  },
  {
    brand: "Volvo",
    model: "EX30",
    providerName: "Bilia Volvo",
    offerLabel: "EX30 Twin Motor Performance Ultra",
    listingPrice: 449900,
    ctaUrl: "https://www.bilia.se/bilar/sok-bil/volvo/ex30/kgp04t/",
    checkedAt: "2026-04-02",
    condition: "Begagnad",
    dealerLocationSv: "Sisjon, Goteborg",
    dealerLocationEn: "Sisjon, Gothenburg",
    deliveryEstimateSv: "I lager hos Bilia Sisjon",
    deliveryEstimateEn: "In stock at Bilia Sisjon",
    warrantyInfoSv: "Kvalitetssakrad Bilia-bil",
    warrantyInfoEn: "Quality-checked Bilia car",
  },
  {
    brand: "Volvo",
    model: "EX30",
    providerName: "Riddermark Bil",
    offerLabel: "EX30 Single Motor Extended Range 2024",
    listingPrice: 379900,
    ctaUrl: "https://www.riddermarkbil.se/kopa-bil/volvo/wbc64s/",
    checkedAt: "2026-04-02",
    condition: "Begagnad",
    dealerLocationSv: "Stockholm",
    dealerLocationEn: "Stockholm",
    deliveryEstimateSv: "Snabb reservation online hos Riddermark",
    deliveryEstimateEn: "Quick online reservation at Riddermark",
    warrantyInfoSv: "12-60 manaders garanti enligt annons",
    warrantyInfoEn: "12-60 month warranty per listing",
  },
  {
    brand: "Volvo",
    model: "EX30",
    providerName: "Blocket",
    offerLabel: "EX30 marknadsoversikt",
    providerType: "marketplace",
    listingPrice: 344900,
    ctaUrl: "https://www.blocket.se/mobility/discover/cars/volvo/ex30",
    checkedAt: "2026-04-02",
    condition: "Begagnad",
    priceAnchorEligible: false,
    dealerLocationSv: "Sverige, flera handlare",
    dealerLocationEn: "Sweden, multiple dealers",
    deliveryEstimateSv: "Direkt till Blockets EX30-sokning",
    deliveryEstimateEn: "Direct to Blocket EX30 search",
    warrantyInfoSv: "Villkor varierar mellan handlare",
    warrantyInfoEn: "Warranty terms vary by dealer",
  },
  {
    brand: "Volvo",
    model: "XC60",
    providerName: "Handla Bil",
    offerLabel: "XC60 D4 AWD Classic Summum 2017",
    listingPrice: 244900,
    ctaUrl: "https://www.handlabil.se/handlabil/2017-volvo-xc60-d4-awd-classic-summum-pano-hk-drag-voc-polestar-220hk-jse161-18796388/",
    checkedAt: "2026-04-02",
    condition: "Begagnad",
    dealerLocationSv: "Uppsala",
    dealerLocationEn: "Uppsala",
    deliveryEstimateSv: "Hemleverans i hela Sverige enligt annons",
    deliveryEstimateEn: "Nationwide home delivery per listing",
    warrantyInfoSv: "Dack, forsakring och garanti enligt annons",
    warrantyInfoEn: "Tyres, insurance, and warranty per listing",
  },
  {
    brand: "Audi",
    model: "A8",
    providerName: "Bilia Audi",
    offerLabel: "A8 55 TFSI quattro 3.0 V6",
    listingPrice: 449900,
    ctaUrl: "https://www.bilia.se/bilar/sok-bil/audi/a8/ctc004/",
    checkedAt: "2026-04-02",
    condition: "Begagnad",
    dealerLocationSv: "Nykoping",
    dealerLocationEn: "Nykoping",
    deliveryEstimateSv: "Kontakta säljare for leveransplan",
    deliveryEstimateEn: "Contact the dealer for delivery plan",
    warrantyInfoSv: "Kvalitetssakrad Bilia-bil",
    warrantyInfoEn: "Quality-checked Bilia car",
  },
  {
    brand: "Audi",
    model: "A8",
    providerName: "Blocket",
    offerLabel: "A8 marknadsoversikt",
    providerType: "marketplace",
    listingPrice: 579900,
    ctaUrl: "https://www.blocket.se/mobility/discover/cars/audi/a8",
    checkedAt: "2026-04-02",
    condition: "Begagnad",
    priceAnchorEligible: false,
    dealerLocationSv: "Sverige, flera handlare",
    dealerLocationEn: "Sweden, multiple dealers",
    deliveryEstimateSv: "Direkt till Blockets A8-sokning",
    deliveryEstimateEn: "Direct to Blocket A8 search",
    warrantyInfoSv: "Villkor varierar mellan handlare",
    warrantyInfoEn: "Warranty terms vary by dealer",
  },
  {
    brand: "BYD",
    model: "Dolphin",
    providerName: "Hedin Automotive",
    offerLabel: "Dolphin Comfort 2023",
    listingPrice: 429900,
    ctaUrl: "https://www.blocket.se/mobility/item/13380753",
    checkedAt: "2026-04-02",
    condition: "Ny",
    dealerLocationSv: "Jarfalla",
    dealerLocationEn: "Jarfalla",
    deliveryEstimateSv: "Provkorning och kontakt via Hedin Staket",
    deliveryEstimateEn: "Test drive and contact via Hedin Staket",
    warrantyInfoSv: "Nybilsvillkor via Hedin Automotive",
    warrantyInfoEn: "New-car terms via Hedin Automotive",
  },
  {
    brand: "BYD",
    model: "Dolphin",
    providerName: "Blocket",
    offerLabel: "BYD Dolphin marknadsoversikt",
    providerType: "marketplace",
    listingPrice: 244700,
    ctaUrl: "https://www.blocket.se/mobility/discover/cars/byd/dolphin",
    checkedAt: "2026-04-02",
    condition: "Begagnad",
    priceAnchorEligible: false,
    dealerLocationSv: "Sverige, flera handlare",
    dealerLocationEn: "Sweden, multiple dealers",
    deliveryEstimateSv: "Direkt till Blockets Dolphin-sokning",
    deliveryEstimateEn: "Direct to Blocket Dolphin search",
    warrantyInfoSv: "Villkor varierar mellan handlare",
    warrantyInfoEn: "Warranty terms vary by dealer",
  },
  {
    brand: "Kia",
    model: "EV6",
    providerName: "Hedin Automotive",
    offerLabel: "EV6 Plus AWD Long Range 2025",
    listingPrice: 549900,
    ctaUrl: "https://hedinautomotive.se/kop-bil/172505/pc-nc-kia-ev6-2026",
    checkedAt: "2026-04-02",
    condition: "Ny",
    dealerLocationSv: "Alingsas",
    dealerLocationEn: "Alingsas",
    deliveryEstimateSv: "I lager hos Hedin Automotive Alingsas Ost",
    deliveryEstimateEn: "In stock at Hedin Automotive Alingsas East",
    warrantyInfoSv: "Nybilsgaranti och kampanjvillkor enligt Hedin",
    warrantyInfoEn: "New-car warranty and campaign terms per Hedin",
  },
  {
    brand: "Kia",
    model: "EV6",
    providerName: "Blocket",
    offerLabel: "Kia EV6 marknadsoversikt",
    providerType: "marketplace",
    listingPrice: 279800,
    ctaUrl: "https://www.blocket.se/mobility/discover/cars/kia/ev6",
    checkedAt: "2026-04-02",
    condition: "Begagnad",
    priceAnchorEligible: false,
    dealerLocationSv: "Sverige, flera handlare",
    dealerLocationEn: "Sweden, multiple dealers",
    deliveryEstimateSv: "Direkt till Blockets EV6-sokning",
    deliveryEstimateEn: "Direct to Blocket EV6 search",
    warrantyInfoSv: "Villkor varierar mellan handlare",
    warrantyInfoEn: "Warranty terms vary by dealer",
  },
  {
    brand: "Kia",
    model: "EV9",
    providerName: "Hedin Automotive",
    offerLabel: "EV9 GT-Line 7 sits 2025",
    listingPrice: 799900,
    ctaUrl: "https://hedinautomotive.se/kop-bil/212350/pc-nc-kia-ev9-2025",
    checkedAt: "2026-04-02",
    condition: "Ny",
    dealerLocationSv: "Alingsas",
    dealerLocationEn: "Alingsas",
    deliveryEstimateSv: "I lager hos Hedin Automotive Alingsas Ost",
    deliveryEstimateEn: "In stock at Hedin Automotive Alingsas East",
    warrantyInfoSv: "Nybilsvillkor och Kia-kampanj enligt annons",
    warrantyInfoEn: "New-car terms and Kia campaign per listing",
  },
  {
    brand: "Volkswagen",
    model: "ID.3",
    providerName: "Aften Bil",
    offerLabel: "ID.3 Pro Performance 58kWh 2023",
    listingPrice: 278900,
    ctaUrl: "https://www.aftenbil.se/volkswagen/bilar/volkswagen-id3-58kwh-pro-performance-204hk-kamera-vrmare-just-nu-284000kr-18788709",
    checkedAt: "2026-04-02",
    condition: "Begagnad",
    dealerLocationSv: "Upplands Vasby",
    dealerLocationEn: "Upplands Vasby",
    deliveryEstimateSv: "Kontakta Aften Bil samma dag",
    deliveryEstimateEn: "Contact Aften Bil the same day",
    warrantyInfoSv: "Vagnskadegaranti och batterigaranti enligt annons",
    warrantyInfoEn: "Vehicle damage and battery warranty per listing",
  },
  {
    brand: "Volkswagen",
    model: "ID.4",
    providerName: "Blocket",
    offerLabel: "ID.4 Pro 4M Edition 77kWh 2025",
    providerType: "marketplace",
    listingPrice: 587300,
    ctaUrl: "https://www.blocket.se/mobility/item/14620550",
    checkedAt: "2026-04-02",
    condition: "Ny",
    dealerLocationSv: "Askim",
    dealerLocationEn: "Askim",
    deliveryEstimateSv: "Annons via Din Bil / Volkswagen Sisjon",
    deliveryEstimateEn: "Listing via Din Bil / Volkswagen Sisjon",
    warrantyInfoSv: "Volkswagen-villkor enligt annons",
    warrantyInfoEn: "Volkswagen terms per listing",
  },
  {
    brand: "Mazda",
    model: "MX-30",
    providerName: "RA Motor",
    offerLabel: "MX-30 Makoto Premium Industrial R-EV 2024",
    listingPrice: 358900,
    ctaUrl: "https://ramotor.se/lagerbilar/mazda-mx-30-18130198/",
    checkedAt: "2026-04-02",
    condition: "Ny",
    dealerLocationSv: "Kungsangen",
    dealerLocationEn: "Kungsangen",
    deliveryEstimateSv: "Omgående leverans enligt RA Motor",
    deliveryEstimateEn: "Immediate delivery per RA Motor",
    warrantyInfoSv: "Kampanjvillkor och finansiering enligt RA Motor",
    warrantyInfoEn: "Campaign and financing terms per RA Motor",
  },
];

function l(language: Language, en: string, sv: string): string {
  return language === "sv" ? sv : en;
}

function scoreOffer(offer: CommercialOfferBase): number {
  return (
    offer.monthlyCost * 1.2 +
    offer.totalCost * 0.6 +
    offer.upfrontCost * 0.2 +
    SPEED_SCORE[offer.approvalSpeed] * 120
  );
}

function sortOffers<T extends CommercialOfferBase>(offers: T[], mode: SortMode): T[] {
  const sorted = [...offers];

  switch (mode) {
    case "lowest-monthly":
      return sorted.sort((a, b) => a.monthlyCost - b.monthlyCost);
    case "lowest-total":
      return sorted.sort((a, b) => a.totalCost - b.totalCost);
    case "lowest-upfront":
      return sorted.sort((a, b) => a.upfrontCost - b.upfrontCost);
    case "fastest-approval":
      return sorted.sort((a, b) => SPEED_SCORE[a.approvalSpeed] - SPEED_SCORE[b.approvalSpeed]);
    case "best":
    default:
      return sorted.sort((a, b) => scoreOffer(a) - scoreOffer(b));
  }
}

function sortRetailerOffers(offers: RetailerOffer[], mode: SortMode): RetailerOffer[] {
  return sortOffers(offers, mode);
}

function normalizeSearchKey(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function matchesSourceModel(source: { brand: string; model: string }, brand?: string, model?: string): boolean {
  if (!brand || !model) return false;
  if (normalizeSearchKey(source.brand) !== normalizeSearchKey(brand)) return false;

  const sourceModel = normalizeSearchKey(source.model);
  const selectedModel = normalizeSearchKey(model);

  return (
    sourceModel === selectedModel ||
    selectedModel.includes(sourceModel) ||
    sourceModel.includes(selectedModel)
  );
}

export function findVerifiedRetailerPrice(brand?: string, model?: string): VerifiedRetailerPrice | null {
  const matches = RETAILER_LISTING_SOURCES
    .filter((source) => source.priceAnchorEligible !== false)
    .filter((source) => matchesSourceModel(source, brand, model))
    .sort((left, right) => {
      const conditionDifference =
        (left.condition === "Ny" ? 0 : 1) - (right.condition === "Ny" ? 0 : 1);
      if (conditionDifference !== 0) return conditionDifference;

      if (left.checkedAt !== right.checkedAt) {
        return right.checkedAt.localeCompare(left.checkedAt);
      }

      return left.listingPrice - right.listingPrice;
    });

  const bestMatch = matches[0];
  if (!bestMatch) return null;

  return {
    priceSek: bestMatch.listingPrice,
    providerName: bestMatch.providerName,
    offerLabel: bestMatch.offerLabel,
    sourceUrl: bestMatch.ctaUrl,
    checkedAt: bestMatch.checkedAt,
    condition: bestMatch.condition,
  };
}

function calculateLoanMonthlyPayment(
  principal: number,
  annualRatePercent: number,
  months: number,
  balloon: number,
): number {
  if (months <= 0 || principal <= 0) return 0;

  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) {
    return (principal - balloon) / months;
  }

  const discountedBalloon = balloon / Math.pow(1 + monthlyRate, months);
  const financedAmount = principal - discountedBalloon;
  return (
    financedAmount *
    ((monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1))
  );
}

function calculateStraightAmortizationSummary(
  principal: number,
  annualRatePercent: number,
  months: number,
): {
  firstMonthlyPayment: number;
  lastMonthlyPayment: number;
  averageMonthlyPayment: number;
  totalPayments: number;
} {
  if (principal <= 0 || months <= 0) {
    return {
      firstMonthlyPayment: 0,
      lastMonthlyPayment: 0,
      averageMonthlyPayment: 0,
      totalPayments: 0,
    };
  }

  const monthlyAmortization = principal / months;
  const monthlyRate = annualRatePercent / 100 / 12;
  let remainingPrincipal = principal;
  let totalPayments = 0;
  let firstMonthlyPayment = 0;
  let lastMonthlyPayment = 0;

  for (let month = 0; month < months; month += 1) {
    const interest = remainingPrincipal * monthlyRate;
    const payment = monthlyAmortization + interest;
    if (month === 0) {
      firstMonthlyPayment = payment;
    }
    lastMonthlyPayment = payment;
    totalPayments += payment;
    remainingPrincipal = Math.max(0, remainingPrincipal - monthlyAmortization);
  }

  return {
    firstMonthlyPayment,
    lastMonthlyPayment,
    averageMonthlyPayment: totalPayments / months,
    totalPayments,
  };
}

function estimatePurchasePrice(car: CarResult, ownershipYears: number): number {
  const residualPercent =
    car.residualValuePercent > 0
      ? car.residualValuePercent
      : calculateResidualPercent(ownershipYears, car.fuelType ?? "petrol");

  if (car.totalDepreciation > 0 && residualPercent < 100) {
    return Math.round(car.totalDepreciation / (1 - residualPercent / 100));
  }

  return Math.max(250000, Math.round(car.totalOwnershipCost * 0.9));
}

function deriveAnnualCost(totalCost: number, ownershipMonths: number, fallback: number): number {
  if (totalCost > 0 && ownershipMonths > 0) {
    return Math.round(totalCost / (ownershipMonths / 12));
  }
  return fallback;
}

function buildCommercialContext(car: CarResult, carInput?: CarInput): CommercialContext {
  const ownershipYears = carInput?.ownershipYears ?? Math.max(car.ownershipMonths / 12, 3);
  const ownershipMonths = Math.max(12, Math.round(ownershipYears * 12));
  const purchasePrice = carInput?.purchasePrice ?? estimatePurchasePrice(car, ownershipYears);
  const residualPercent = calculateResidualPercent(
    ownershipYears,
    car.fuelType ?? "petrol",
    carInput?.modelYear,
  );
  const defaultDownPayment = Math.round(purchasePrice * 0.2);

  return {
    annualFuelCost: car.annualFuelCost,
    annualInsuranceCost: carInput?.insuranceCost ?? deriveAnnualCost(car.breakdown.insurance, car.ownershipMonths, 6000),
    annualTaxCost: carInput?.taxCost ?? deriveAnnualCost(car.breakdown.tax, car.ownershipMonths, 0),
    annualServiceCost: carInput?.serviceCost ?? deriveAnnualCost(car.breakdown.service, car.ownershipMonths, 3000),
    annualMileage: carInput?.annualMileage ?? 15000,
    ownershipYears,
    ownershipMonths,
    purchasePrice,
    residualPercent,
    downPayment: carInput?.loan.downPayment ?? defaultDownPayment,
    loanTermMonths: carInput?.loan.loanTermMonths ?? 60,
    loanResidualBalloon: carInput?.loan.residualBalloon ?? 0,
    monthlyAdminFee: carInput?.loan.monthlyAdminFee ?? 0,
  };
}

function createProvider(
  id: string,
  providerName: string,
  providerType: ProviderType,
  language: Language,
  options: {
    isPartner?: boolean;
    isSponsored?: boolean;
    trustSignals?: string[];
    sourceUrl?: string;
    checkedAt?: string;
  } = {},
): Provider {
  const visual = getProviderVisual(providerName);
  return {
    id,
    providerName,
    providerType,
    logoText: "",
    logoSrc: visual.logoSrc,
    accentColor: visual.accentColor,
    isPartner: options.isPartner ?? false,
    isSponsored: options.isSponsored ?? false,
    trustSignals:
      options.trustSignals ??
      [
        l(language, "Official Swedish source", "Officiell svensk källa"),
        l(language, "Checked manually", "Kontrollerad manuellt"),
      ],
    sourceUrl: options.sourceUrl,
    checkedAt: options.checkedAt,
  };
}

function getRepresentativeNominalRate(benchmark: LoanBenchmarkRate): number {
  if (typeof benchmark.nominalRatePercent === "number") return benchmark.nominalRatePercent;
  if (typeof benchmark.minRatePercent === "number" && typeof benchmark.maxRatePercent === "number") {
    return Number(((benchmark.minRatePercent + benchmark.maxRatePercent) / 2).toFixed(2));
  }
  return benchmark.effectiveRatePercent ?? 0;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function estimateOwnershipCostForListing(
  listingPrice: number,
  context: CommercialContext,
  referenceRatePercent: number,
): {
  monthlyCost: number;
  totalCost: number;
  upfrontCost: number;
} {
  const upfrontCost = Math.max(0, Math.min(context.downPayment, listingPrice));
  const principal = Math.max(0, listingPrice - upfrontCost);
  const monthlyLoanPayment = calculateLoanMonthlyPayment(
    principal,
    referenceRatePercent,
    Math.max(12, context.loanTermMonths),
    0,
  );
  const totalLoanPayments = monthlyLoanPayment * Math.max(12, context.loanTermMonths);
  const financingCost = Math.max(0, totalLoanPayments - principal);
  const runningCosts =
    (context.annualFuelCost + context.annualInsuranceCost + context.annualTaxCost + context.annualServiceCost) *
    context.ownershipYears;
  const depreciation = listingPrice * (1 - context.residualPercent / 100);
  const totalCost = depreciation + runningCosts + financingCost;

  return {
    monthlyCost: Math.round(totalCost / context.ownershipMonths),
    totalCost: Math.round(totalCost),
    upfrontCost,
  };
}

function buildAvailabilityLabel(
  language: Language,
  checkedAt: string,
  validUntil?: string,
): string {
  if (validUntil) {
    return l(
      language,
      `Official offer checked ${checkedAt}, valid through ${validUntil}`,
      `Officiellt erbjudande kontrollerat ${checkedAt}, giltigt till ${validUntil}`,
    );
  }

  return l(
    language,
    `Official source checked ${checkedAt}`,
    `Officiell källa kontrollerad ${checkedAt}`,
  );
}

function buildLoanOfferFromBenchmark(
  benchmark: LoanBenchmarkRate,
  context: CommercialContext,
  language: Language,
  badge?: OfferBadge,
): FinancingOffer {
  const nominalRate = getRepresentativeNominalRate(benchmark);
  const rawDurationMonths = benchmark.fixedTermMonths ?? context.loanTermMonths;
  const minTermMonths = benchmark.minTermMonths ?? 12;
  const maxTermMonths = benchmark.maxTermMonths ?? 96;
  const durationMonths = Math.min(maxTermMonths, Math.max(minTermMonths, rawDurationMonths));
  const minimumDownPayment = Math.round(
    context.purchasePrice * ((benchmark.minDownPaymentPercent ?? 0) / 100)
  );
  const effectiveDownPayment = Math.max(context.downPayment, minimumDownPayment);
  const principal = Math.max(0, context.purchasePrice - effectiveDownPayment);
  const balloon =
    benchmark.benchmarkKind === "brand_campaign"
      ? Math.round(context.purchasePrice * ((benchmark.balloonPercent ?? 0) / 100))
      : context.loanResidualBalloon;

  const totalAdminFees =
    (context.monthlyAdminFee + (benchmark.monthlyFeeSek ?? 0)) * durationMonths + (benchmark.setupFeeSek ?? 0);
  const financingSummary =
    benchmark.amortizationModel === "straight"
      ? calculateStraightAmortizationSummary(principal, nominalRate, durationMonths)
      : null;
  const monthlyLoanPayment =
    benchmark.amortizationModel === "straight"
      ? financingSummary?.averageMonthlyPayment ?? 0
      : calculateLoanMonthlyPayment(principal, nominalRate, durationMonths, balloon);
  const totalLoanPayments =
    benchmark.amortizationModel === "straight"
      ? financingSummary?.totalPayments ?? 0
      : monthlyLoanPayment * durationMonths;
  const financingCost = Math.max(0, totalLoanPayments + balloon - principal) + totalAdminFees;
  const runningCosts =
    (context.annualFuelCost + context.annualInsuranceCost + context.annualTaxCost + context.annualServiceCost) *
    context.ownershipYears;
  const depreciation = context.purchasePrice * (1 - context.residualPercent / 100);
  const totalCost = depreciation + runningCosts + financingCost;

  return {
    id: benchmark.id,
    providerId: benchmark.id.replace(/-campaign$/, "").replace(/-billan$/, ""),
    providerName: benchmark.providerName,
    offerLabel: benchmark.providerLabel,
    providerType: benchmark.benchmarkKind === "brand_campaign" ? "dealer_financing" : "bank",
    offerType: benchmark.benchmarkKind === "brand_campaign" ? "dealer_financing" : "bank_loan",
    apr: benchmark.effectiveRatePercent ?? nominalRate,
    nominalRate,
    effectiveRate: benchmark.effectiveRatePercent ?? nominalRate,
    monthlyCost: Math.round(totalCost / context.ownershipMonths),
    upfrontCost: effectiveDownPayment,
    totalCost: Math.round(totalCost),
    durationMonths,
    mileagePerYear: context.annualMileage,
    residualValue: balloon > 0 ? balloon : 0,
    approvalSpeed: language === "sv" ? "Varierar" : "Varies",
    isSponsored: false,
    badge,
    ctaLabel: l(language, "Open official rate page", "Öppna officiell räntesida"),
    ctaUrl: benchmark.sourceUrl,
    availability: buildAvailabilityLabel(language, benchmark.checkedAt, benchmark.validUntil),
    sourceType: "manual",
    checkedAt: benchmark.checkedAt,
    validUntil: benchmark.validUntil,
    notes: benchmark.notes,
    amortizationModel: benchmark.amortizationModel,
    firstMonthlyPayment:
      benchmark.amortizationModel === "straight"
        ? Math.round(financingSummary?.firstMonthlyPayment ?? 0)
        : Math.round(monthlyLoanPayment),
    lastMonthlyPayment:
      benchmark.amortizationModel === "straight"
        ? Math.round(financingSummary?.lastMonthlyPayment ?? 0)
        : Math.round(monthlyLoanPayment),
    minimumDownPayment,
    setupFee: benchmark.setupFeeSek ?? 0,
    monthlyFee: benchmark.monthlyFeeSek ?? 0,
  };
}

function buildLeasingOffer(
  availability: LeasingAvailability,
  context: CommercialContext,
  language: Language,
): LeasingOffer | null {
  if (availability.status !== "available" || !availability.monthlyCostSek) {
    return null;
  }

  const durationMonths = availability.durationMonths ?? 36;
  const annualMileage = availability.annualMileageKm ?? context.annualMileage;
  const leaseYears = durationMonths / 12;
  const excessMileage = Math.max(0, context.annualMileage - annualMileage);
  const excessMileageCost = 1.5;
  const totalRunningCosts =
    (context.annualFuelCost + context.annualInsuranceCost + context.annualTaxCost + context.annualServiceCost) *
    leaseYears;
  const mileagePenalty = excessMileage * excessMileageCost * leaseYears;
  const upfrontCost = availability.downPaymentSek ?? 0;
  const totalCost =
    upfrontCost + availability.monthlyCostSek * durationMonths + totalRunningCosts + mileagePenalty;
  const estimatedOwnershipMonthlyCost = Math.round(totalCost / durationMonths);

  return {
    id: `${availability.brand.toLowerCase()}-${(availability.model ?? "lease").toLowerCase()}-lease`,
    providerId: availability.providerName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    providerName: availability.providerName,
    offerLabel: availability.providerLabel,
    providerType: "leasing_company",
    offerType: "private_leasing",
    apr: 0,
    nominalRate: 0,
    effectiveRate: 0,
    monthlyCost: estimatedOwnershipMonthlyCost,
    upfrontCost,
    totalCost: Math.round(totalCost),
    durationMonths,
    mileagePerYear: annualMileage,
    residualValue: 0,
    approvalSpeed: language === "sv" ? "Varierar" : "Varies",
    isSponsored: false,
    badge:
      availability.downPaymentSek
        ? (language === "sv" ? "Flexibelt avtal" : "Flexible contract")
        : (language === "sv" ? "Låg kontantinsats" : "Low upfront cost"),
    ctaLabel: l(language, "Open official lease page", "Öppna officiell leasingsida"),
    ctaUrl: availability.sourceUrl,
    availability: buildAvailabilityLabel(language, availability.checkedAt, availability.validUntil),
    sourceType: "manual",
    checkedAt: availability.checkedAt,
    validUntil: availability.validUntil,
    notes: availability.notes,
    customerType: "private",
    officialMonthlyPayment: availability.monthlyCostSek,
    estimatedOwnershipMonthlyCost,
    initialPayment: upfrontCost,
    annualMileage,
    excessMileageCost,
    includedServices: availability.includedServices ?? [],
    wearAndTearNote: l(
      language,
      "Normal wear is assessed according to the lessor's return rules.",
      "Normalt slitage bedöms enligt leasegivarens återlämningsregler.",
    ),
    endOfContractCondition: l(language, "Return or replace the car", "Återlämna eller byt bil"),
  };
}

function buildRetailerOffers(
  car: CarResult,
  context: CommercialContext,
  language: Language,
  loanBenchmarks: LoanBenchmarkRate[],
): RetailerOffer[] {
  const referenceBenchmark = loanBenchmarks[0];
  const referenceRatePercent = referenceBenchmark ? getRepresentativeNominalRate(referenceBenchmark) : 0;

  return RETAILER_LISTING_SOURCES
    .filter((source) => matchesSourceModel(source, car.brand, car.name))
    .map((source, index) => {
      const ownershipEstimate = estimateOwnershipCostForListing(
        source.listingPrice,
        context,
        referenceRatePercent,
      );

      return {
        id: `${slugify(source.providerName)}-${slugify(source.offerLabel)}-${index}`,
        providerId: slugify(source.providerName),
        providerName: source.providerName,
        offerLabel: source.offerLabel,
        providerType: source.providerType ?? "retailer",
        offerType: "retailer_listing",
        monthlyCost: ownershipEstimate.monthlyCost,
        upfrontCost: ownershipEstimate.upfrontCost,
        totalCost: ownershipEstimate.totalCost,
        apr: 0,
        nominalRate: 0,
        effectiveRate: 0,
        durationMonths: context.loanTermMonths,
        approvalSpeed: language === "sv" ? "Återförsäljare ringer upp" : "Dealer calls back",
        isSponsored: false,
        badge: index === 0 ? (language === "sv" ? "Bäst värde" : "Best value") : undefined,
        ctaLabel:
          (source.providerType ?? "retailer") === "marketplace"
            ? l(language, "Open marketplace listing", "Oppna marknadsannons")
            : l(language, "Open dealer listing", "Oppna annons"),
        ctaUrl: source.ctaUrl,
        availability: l(
          language,
          (source.providerType ?? "retailer") === "marketplace"
            ? `Verified marketplace page checked ${source.checkedAt}. Ownership estimate recalculated from the advertised market price.`
            : `Official dealer listing checked ${source.checkedAt}. Ownership estimate recalculated from the listing price.`,
          (source.providerType ?? "retailer") === "marketplace"
            ? `Verifierad marknadssida kontrollerad ${source.checkedAt}. Agandekalkylen raknas om utifran annonserat marknadspris.`
            : `Officiell handlarannons kontrollerad ${source.checkedAt}. Agandekalkylen raknas om utifran annonspriset.`,
        ),
        sourceType: "manual",
        condition: source.condition,
        deliveryEstimate: language === "sv" ? source.deliveryEstimateSv : source.deliveryEstimateEn,
        dealerLocation: language === "sv" ? source.dealerLocationSv : source.dealerLocationEn,
        warrantyInfo: language === "sv" ? source.warrantyInfoSv : source.warrantyInfoEn,
      };
    });
}

function buildRecommendations(
  financingOffers: FinancingOffer[],
  leasingOffers: LeasingOffer[],
  language: Language,
): RecommendationReason[] {
  const reasons: RecommendationReason[] = [];
  const bestFinancing = sortOffers(financingOffers, "best")[0];
  const lowestMonthlyFinancing = sortOffers(financingOffers, "lowest-monthly")[0];
  const lowestUpfrontFinancing = sortOffers(financingOffers, "lowest-upfront")[0];

  reasons.push(
    {
      id: "rec-1",
      category: "lowest-monthly",
      title: l(language, "Best for lowest monthly cost", "Bäst för lägsta månadskostnad"),
      explanation:
        language === "sv"
          ? `${lowestMonthlyFinancing.providerName} ger lägst beräknad månadskostnad utifrån vald bil, kontantinsats och officiell ränteinformation.`
          : `${lowestMonthlyFinancing.providerName} gives the lowest estimated monthly ownership cost based on the selected car, upfront payment, and official rate data.`,
      offerId: lowestMonthlyFinancing.id,
      sourceType: "manual",
    },
    {
      id: "rec-2",
      category: "long-term-ownership",
      title: l(language, "Best if you plan to own long-term", "Bäst om du vill äga bilen länge"),
      explanation:
        language === "sv"
          ? `${bestFinancing.providerName} ger starkast ägandekalkyl med dagens verifierade ränteläge.`
          : `${bestFinancing.providerName} gives the strongest long-term ownership case against today's verified rate inputs.`,
      offerId: bestFinancing.id,
      sourceType: "manual",
    },
    {
      id: "rec-3",
      category: "low-upfront",
      title: l(language, "Best for low upfront cost", "Bäst om du vill ha låg kontantinsats"),
      explanation:
        language === "sv"
          ? `${lowestUpfrontFinancing.providerName} kräver lägst startkostnad av de verifierade lågalternativen.`
          : `${lowestUpfrontFinancing.providerName} requires the lowest upfront amount among the verified loan offers.`,
      offerId: lowestUpfrontFinancing.id,
      sourceType: "manual",
    },
  );

  if (leasingOffers.length > 0) {
    const bestLeasing = sortOffers(leasingOffers, "best")[0];
    reasons.push(
      {
        id: "rec-4",
        category: "flexibility",
        title: l(language, "Best for flexibility", "Bäst för flexibilitet"),
        explanation:
          language === "sv"
            ? `${bestLeasing.providerName} är det verifierade leasingalternativet med tydligast månadsvillkor för den här modellen.`
            : `${bestLeasing.providerName} is the verified leasing option with the clearest monthly terms for this model.`,
        offerId: bestLeasing.id,
        sourceType: "manual",
      },
      {
        id: "rec-5",
        category: "predictable-monthly",
        title: l(language, "Best for predictable monthly costs", "Bäst för förutsägbar månadskostnad"),
        explanation:
          language === "sv"
            ? `${bestLeasing.providerName} ger en fast månadsstruktur med verifierade kampanjvillkor från officiell källa.`
            : `${bestLeasing.providerName} gives a fixed monthly structure backed by a verified official campaign source.`,
        offerId: bestLeasing.id,
        sourceType: "manual",
      },
    );
  }

  return reasons;
}

export function buildCommercialTrialData(
  car: CarResult,
  language: Language = "en",
  carInput?: CarInput,
): CommercialTrialData {
  const context = buildCommercialContext(car, carInput);
  const loanBenchmarks = getLoanBenchmarks(car.fuelType ?? "petrol", car.brand, carInput?.model ?? car.name).filter(
    (item) => item.benchmarkKind !== "policy_rate",
  );
  const leasingAvailabilities = getLeasingAvailabilities(car.brand, carInput?.model ?? car.name);
  const leasingAvailability =
    leasingAvailabilities[0] ?? getLeasingAvailability(car.brand, carInput?.model ?? car.name);

  const financingOffers = loanBenchmarks.map((benchmark, index) =>
    buildLoanOfferFromBenchmark(
      benchmark,
      context,
      language,
      benchmark.benchmarkKind === "brand_campaign"
        ? (language === "sv" ? "Lägst månadskostnad" : "Lowest monthly cost")
        : index === 0
        ? (language === "sv" ? "Bäst värde" : "Best value")
        : "Popular",
    ),
  );

  const leasingOffers = leasingAvailabilities.map((availability) => buildLeasingOffer(availability, context, language)).filter(
    (offer): offer is LeasingOffer => Boolean(offer),
  );

  const retailerOffers = buildRetailerOffers(car, context, language, loanBenchmarks);
  const providers = [
    ...financingOffers.map((offer) =>
      createProvider(offer.providerId, offer.providerName, offer.providerType, language, {
        sourceUrl: offer.ctaUrl,
        checkedAt: offer.checkedAt,
      }),
    ),
    ...leasingOffers.map((offer) =>
      createProvider(offer.providerId, offer.providerName, offer.providerType, language, {
        sourceUrl: offer.ctaUrl,
        checkedAt: offer.checkedAt,
      }),
    ),
    ...retailerOffers.map((offer) =>
      createProvider(offer.providerId, offer.providerName, offer.providerType, language, {
        sourceUrl: offer.ctaUrl,
      }),
    ),
  ];

  const bestFinancing = sortOffers(financingOffers, "best")[0];
  const bestLeasing = leasingOffers.length > 0 ? sortOffers(leasingOffers, "best")[0] : null;
  const bestRetailer = retailerOffers.length > 0 ? sortRetailerOffers(retailerOffers, "best")[0] : null;
  const recommendations = buildRecommendations(financingOffers, leasingOffers, language);

  return {
    car: {
      id: car.id,
      name: car.name,
      brand: car.brand,
      model: carInput?.model,
      fuelType: car.fuelType,
      monthlyCost: car.monthlyCost,
      totalCost: car.totalOwnershipCost,
      annualMileageEstimate: context.annualMileage,
      purchasePriceEstimate: context.purchasePrice,
    },
    providers,
    loanBenchmarks,
    leasingAvailability,
    bestFinancing,
    bestLeasing,
    bestRetailer,
    financingOffers,
    leasingOffers,
    retailerOffers,
    recommendations,
    sortOffers,
    sortRetailerOffers,
  };
}
