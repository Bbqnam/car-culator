import { CarResult } from "@/lib/car-types";

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
  | "Instant"
  | "< 2 minutes"
  | "Within 24h"
  | "1-2 business days"
  | "Dealer callback";

export type OfferBadge =
  | "Best value"
  | "Lowest monthly cost"
  | "Fast approval"
  | "Low upfront"
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
  fuelType?: string;
  monthlyCost: number;
  totalCost: number;
  annualMileageEstimate: number;
}

export interface Provider {
  id: string;
  providerName: string;
  providerType: ProviderType;
  logoText: string;
  isPartner: boolean;
  isSponsored: boolean;
  trustSignals: string[];
}

export interface CommercialOfferBase {
  id: string;
  providerId: string;
  providerName: string;
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
}

export interface FinancingOffer extends CommercialOfferBase {
  offerType: "bank_loan" | "dealer_financing" | "balloon_financing";
}

export interface LeasingOffer extends CommercialOfferBase {
  offerType: "private_leasing";
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
  availability: "In stock" | "Few left" | "Order only";
  sourceType: SourceType;
  condition: "New" | "Used";
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
  bestFinancing: FinancingOffer;
  bestLeasing: LeasingOffer;
  bestRetailer: RetailerOffer;
  financingOffers: FinancingOffer[];
  leasingOffers: LeasingOffer[];
  retailerOffers: RetailerOffer[];
  recommendations: RecommendationReason[];
  sortOffers: <T extends CommercialOfferBase>(offers: T[], mode: SortMode) => T[];
  sortRetailerOffers: (offers: RetailerOffer[], mode: SortMode) => RetailerOffer[];
}

const SPEED_SCORE: Record<ApprovalSpeed, number> = {
  Instant: 1,
  "< 2 minutes": 2,
  "Within 24h": 3,
  "1-2 business days": 4,
  "Dealer callback": 5,
};

function scoreOffer(offer: CommercialOfferBase): number {
  return offer.monthlyCost * 1.2 + offer.totalCost * 0.6 + offer.upfrontCost * 0.2 + SPEED_SCORE[offer.approvalSpeed] * 120;
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

export function buildCommercialTrialData(car: CarResult): CommercialTrialData {
  const monthlyBase = Math.max(car.monthlyCost, 3200);
  const totalBase = Math.max(car.totalOwnershipCost, monthlyBase * 60);
  const annualMileageEstimate = 15000;

  const providers: Provider[] = [
    {
      id: "nordic-bank",
      providerName: "Nordic Bank Auto",
      providerType: "bank",
      logoText: "NB",
      isPartner: true,
      isSponsored: false,
      trustSignals: ["FSA regulated", "Digital signing"],
    },
    {
      id: "scandia-credit",
      providerName: "Scandia Credit",
      providerType: "finance_company",
      logoText: "SC",
      isPartner: true,
      isSponsored: false,
      trustSignals: ["Fast approval", "No setup fee"],
    },
    {
      id: "dealer-flow",
      providerName: "DealerFlow Finance",
      providerType: "dealer_financing",
      logoText: "DF",
      isPartner: true,
      isSponsored: true,
      trustSignals: ["Dealer integrated", "Campaign APR"],
    },
    {
      id: "flexi-lease",
      providerName: "FlexiLease Sverige",
      providerType: "leasing_company",
      logoText: "FL",
      isPartner: true,
      isSponsored: false,
      trustSignals: ["Service included", "Mileage protection"],
    },
    {
      id: "auto-market",
      providerName: "AutoMarket Nordics",
      providerType: "marketplace",
      logoText: "AM",
      isPartner: false,
      isSponsored: false,
      trustSignals: ["Marketplace feed", "Verified listings"],
    },
    {
      id: "city-auto",
      providerName: "City Auto Stockholm",
      providerType: "retailer",
      logoText: "CA",
      isPartner: true,
      isSponsored: true,
      trustSignals: ["Partner showroom", "Trade-in support"],
    },
  ];

  const financingOffers: FinancingOffer[] = [
    {
      id: "fin-1",
      providerId: "nordic-bank",
      providerName: "Nordic Bank Auto",
      providerType: "bank",
      offerType: "bank_loan",
      apr: 5.3,
      nominalRate: 4.7,
      effectiveRate: 5.3,
      monthlyCost: Math.round(monthlyBase * 0.96),
      upfrontCost: 35000,
      totalCost: Math.round(totalBase * 0.94),
      durationMonths: 60,
      mileagePerYear: annualMileageEstimate,
      residualValue: 0,
      approvalSpeed: "Within 24h",
      isSponsored: false,
      badge: "Best value",
      ctaLabel: "Apply now",
      ctaUrl: "#apply-nordic-bank",
      availability: "Open for applications",
      sourceType: "mock",
    },
    {
      id: "fin-2",
      providerId: "scandia-credit",
      providerName: "Scandia Credit",
      providerType: "finance_company",
      offerType: "bank_loan",
      apr: 5.8,
      nominalRate: 4.9,
      effectiveRate: 5.8,
      monthlyCost: Math.round(monthlyBase * 0.91),
      upfrontCost: 49000,
      totalCost: Math.round(totalBase * 0.98),
      durationMonths: 72,
      mileagePerYear: annualMileageEstimate,
      residualValue: 0,
      approvalSpeed: "< 2 minutes",
      isSponsored: false,
      badge: "Lowest monthly cost",
      ctaLabel: "Check eligibility",
      ctaUrl: "#check-scandia",
      availability: "Pre-check available",
      sourceType: "mock",
    },
    {
      id: "fin-3",
      providerId: "dealer-flow",
      providerName: "DealerFlow Finance",
      providerType: "dealer_financing",
      offerType: "balloon_financing",
      apr: 4.9,
      nominalRate: 4.2,
      effectiveRate: 4.9,
      monthlyCost: Math.round(monthlyBase * 0.87),
      upfrontCost: 24000,
      totalCost: Math.round(totalBase * 1.02),
      durationMonths: 48,
      mileagePerYear: annualMileageEstimate,
      residualValue: 130000,
      approvalSpeed: "Instant",
      isSponsored: true,
      badge: "Low upfront",
      ctaLabel: "View offer",
      ctaUrl: "#view-dealerflow",
      availability: "Campaign this month",
      sourceType: "mock",
    },
    {
      id: "fin-4",
      providerId: "dealer-flow",
      providerName: "DealerFlow Finance",
      providerType: "dealer_financing",
      offerType: "dealer_financing",
      apr: 6.2,
      nominalRate: 5.5,
      effectiveRate: 6.2,
      monthlyCost: Math.round(monthlyBase * 0.95),
      upfrontCost: 22000,
      totalCost: Math.round(totalBase * 1.01),
      durationMonths: 60,
      mileagePerYear: annualMileageEstimate,
      residualValue: 0,
      approvalSpeed: "Dealer callback",
      isSponsored: true,
      badge: "Partner offer",
      ctaLabel: "See details",
      ctaUrl: "#details-dealer-plan",
      availability: "Available at partner dealers",
      sourceType: "mock",
    },
  ];

  const leasingOffers: LeasingOffer[] = [
    {
      id: "lease-1",
      providerId: "flexi-lease",
      providerName: "FlexiLease Sverige",
      providerType: "leasing_company",
      offerType: "private_leasing",
      apr: 0,
      nominalRate: 0,
      effectiveRate: 0,
      monthlyCost: Math.round(monthlyBase * 0.9),
      upfrontCost: 20000,
      totalCost: Math.round(monthlyBase * 0.9 * 36 + 20000),
      durationMonths: 36,
      mileagePerYear: 15000,
      residualValue: 0,
      approvalSpeed: "Within 24h",
      isSponsored: false,
      badge: "Popular",
      ctaLabel: "View leasing offer",
      ctaUrl: "#lease-flexi",
      availability: "Available nationwide",
      sourceType: "mock",
      initialPayment: 20000,
      annualMileage: 15000,
      excessMileageCost: 1.8,
      includedServices: ["Service", "Road assistance", "Winter tyres"],
      wearAndTearNote: "Normal usage included; cosmetic marks may be charged.",
      endOfContractCondition: "Return or upgrade",
    },
    {
      id: "lease-2",
      providerId: "dealer-flow",
      providerName: "DealerFlow Finance",
      providerType: "dealer_financing",
      offerType: "private_leasing",
      apr: 0,
      nominalRate: 0,
      effectiveRate: 0,
      monthlyCost: Math.round(monthlyBase * 0.86),
      upfrontCost: 39000,
      totalCost: Math.round(monthlyBase * 0.86 * 36 + 39000),
      durationMonths: 36,
      mileagePerYear: 12000,
      residualValue: 0,
      approvalSpeed: "Instant",
      isSponsored: true,
      badge: "Fast approval",
      ctaLabel: "See details",
      ctaUrl: "#lease-dealerflow",
      availability: "Limited campaign stock",
      sourceType: "mock",
      initialPayment: 39000,
      annualMileage: 12000,
      excessMileageCost: 2.1,
      includedServices: ["Service", "Warranty extension"],
      wearAndTearNote: "Interior wear above normal standard is chargeable.",
      endOfContractCondition: "Return only",
    },
    {
      id: "lease-3",
      providerId: "scandia-credit",
      providerName: "Scandia Credit",
      providerType: "finance_company",
      offerType: "private_leasing",
      apr: 0,
      nominalRate: 0,
      effectiveRate: 0,
      monthlyCost: Math.round(monthlyBase * 0.93),
      upfrontCost: 12000,
      totalCost: Math.round(monthlyBase * 0.93 * 48 + 12000),
      durationMonths: 48,
      mileagePerYear: 18000,
      residualValue: 0,
      approvalSpeed: "< 2 minutes",
      isSponsored: false,
      badge: "Flexible contract",
      ctaLabel: "Check eligibility",
      ctaUrl: "#lease-scandia",
      availability: "Open for digital contracts",
      sourceType: "mock",
      initialPayment: 12000,
      annualMileage: 18000,
      excessMileageCost: 1.4,
      includedServices: ["Service", "Tyre swap", "Road assistance"],
      wearAndTearNote: "Fair wear accepted under partner policy.",
      endOfContractCondition: "Return, extend, or buy-out",
    },
  ];

  const retailerOffers: RetailerOffer[] = [
    {
      id: "ret-1",
      providerId: "city-auto",
      providerName: "City Auto Stockholm",
      providerType: "retailer",
      offerType: "retailer_listing",
      monthlyCost: Math.round(monthlyBase * 0.92),
      upfrontCost: 30000,
      totalCost: Math.round(totalBase * 0.97),
      apr: 5.2,
      nominalRate: 4.8,
      effectiveRate: 5.2,
      durationMonths: 60,
      approvalSpeed: "Within 24h",
      isSponsored: true,
      badge: "Partner offer",
      ctaLabel: "Contact dealer",
      ctaUrl: "#contact-city-auto",
      availability: "In stock",
      sourceType: "mock",
      condition: "New",
      deliveryEstimate: "Delivery in 3-5 days",
      dealerLocation: "Stockholm",
      warrantyInfo: "5 years / 100,000 km",
    },
    {
      id: "ret-2",
      providerId: "auto-market",
      providerName: "AutoMarket Nordics",
      providerType: "marketplace",
      offerType: "retailer_listing",
      monthlyCost: Math.round(monthlyBase * 0.9),
      upfrontCost: 28000,
      totalCost: Math.round(totalBase * 0.96),
      apr: 5,
      nominalRate: 4.5,
      effectiveRate: 5,
      durationMonths: 60,
      approvalSpeed: "< 2 minutes",
      isSponsored: false,
      badge: "Best value",
      ctaLabel: "View listing",
      ctaUrl: "#view-automarket",
      availability: "Few left",
      sourceType: "mock",
      condition: "Used",
      deliveryEstimate: "Pickup or delivery in 7 days",
      dealerLocation: "Gothenburg",
      warrantyInfo: "12-month dealer warranty",
    },
    {
      id: "ret-3",
      providerId: "dealer-flow",
      providerName: "DealerFlow Marketplace",
      providerType: "marketplace",
      offerType: "retailer_listing",
      monthlyCost: Math.round(monthlyBase * 0.94),
      upfrontCost: 18000,
      totalCost: Math.round(totalBase * 0.99),
      apr: 5.9,
      nominalRate: 5.1,
      effectiveRate: 5.9,
      durationMonths: 72,
      approvalSpeed: "Dealer callback",
      isSponsored: true,
      badge: "Sponsored",
      ctaLabel: "See retailer",
      ctaUrl: "#retailer-dealerflow",
      availability: "Order only",
      sourceType: "mock",
      condition: "New",
      deliveryEstimate: "Factory order 6-10 weeks",
      dealerLocation: "Malmo",
      warrantyInfo: "3 years / 100,000 km",
    },
  ];

  const bestFinancing = sortOffers(financingOffers, "best")[0];
  const bestLeasing = sortOffers(leasingOffers, "best")[0];
  const bestRetailer = sortRetailerOffers(retailerOffers, "best")[0];

  const recommendations: RecommendationReason[] = [
    {
      id: "rec-1",
      category: "lowest-monthly",
      title: "Best for lowest monthly payment",
      explanation: `${sortOffers(financingOffers, "lowest-monthly")[0].providerName} keeps the monthly commitment low with longer duration and lower cash pressure upfront.`,
      offerId: sortOffers(financingOffers, "lowest-monthly")[0].id,
      sourceType: "mock",
    },
    {
      id: "rec-2",
      category: "long-term-ownership",
      title: "Best if you want long-term ownership",
      explanation: `${bestFinancing.providerName} has the strongest ownership economics based on projected total cost and rate profile.`,
      offerId: bestFinancing.id,
      sourceType: "mock",
    },
    {
      id: "rec-3",
      category: "low-upfront",
      title: "Best for low upfront cash",
      explanation: `${sortOffers(financingOffers, "lowest-upfront")[0].providerName} offers the lowest initial payment among ownership options.`,
      offerId: sortOffers(financingOffers, "lowest-upfront")[0].id,
      sourceType: "mock",
    },
    {
      id: "rec-4",
      category: "flexibility",
      title: "Best for flexibility",
      explanation: `${sortOffers(leasingOffers, "best")[0].providerName} allows easier end-of-term choices for upgrading or extending.`,
      offerId: sortOffers(leasingOffers, "best")[0].id,
      sourceType: "mock",
    },
    {
      id: "rec-5",
      category: "predictable-monthly",
      title: "Best for predictable monthly cost",
      explanation: `${bestLeasing.providerName} includes more services in one fixed monthly plan for fewer ownership surprises.`,
      offerId: bestLeasing.id,
      sourceType: "mock",
    },
  ];

  return {
    car: {
      id: car.id,
      name: car.name,
      brand: car.brand,
      fuelType: car.fuelType,
      monthlyCost: car.monthlyCost,
      totalCost: car.totalOwnershipCost,
      annualMileageEstimate,
    },
    providers,
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
