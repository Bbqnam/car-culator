import { CarResult } from "@/lib/car-types";
import type { Language } from "@/lib/i18n";

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
  | "Direkt"
  | "< 2 minuter"
  | "Inom 24 h"
  | "1-2 arbetsdagar"
  | "Återförsäljare ringer upp"
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
  | "Populär"
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
  customerType: "private" | "business";
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
  Direkt: 1,
  "< 2 minuter": 2,
  "Inom 24 h": 3,
  "1-2 arbetsdagar": 4,
  "Återförsäljare ringer upp": 5,
  Instant: 1,
  "< 2 minutes": 2,
  "Within 24h": 3,
  "1-2 business days": 4,
  "Dealer calls back": 5,
};

function l(language: Language, en: string, sv: string): string {
  return language === "sv" ? sv : en;
}

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

export function buildCommercialTrialData(car: CarResult, language: Language = "en"): CommercialTrialData {
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
      trustSignals: [
        l(language, "Regulated financial institution", "FI-reglerad"),
        l(language, "Digital signing", "Digital signering"),
      ],
    },
    {
      id: "scandia-credit",
      providerName: "Scandia Credit",
      providerType: "finance_company",
      logoText: "SC",
      isPartner: true,
      isSponsored: false,
      trustSignals: [
        l(language, "Fast approval", "Snabbt godkännande"),
        l(language, "No setup fee", "Ingen uppläggningsavgift"),
      ],
    },
    {
      id: "dealer-flow",
      providerName: "DealerFlow Finance",
      providerType: "dealer_financing",
      logoText: "DF",
      isPartner: true,
      isSponsored: true,
      trustSignals: [
        l(language, "Dealer-integrated", "Återförsäljarintegrerad"),
        l(language, "Campaign rate", "Kampanjränta"),
      ],
    },
    {
      id: "flexi-lease",
      providerName: l(language, "FlexiLease Sweden", "FlexiLease Sverige"),
      providerType: "leasing_company",
      logoText: "FL",
      isPartner: true,
      isSponsored: false,
      trustSignals: [
        l(language, "Service included", "Service ingår"),
        l(language, "Mileage coverage", "Körsträckeskydd"),
      ],
    },
    {
      id: "auto-market",
      providerName: "AutoMarket Nordics",
      providerType: "marketplace",
      logoText: "AM",
      isPartner: false,
      isSponsored: false,
      trustSignals: [
        l(language, "Marketplace feed", "Marknadsplatsflöde"),
        l(language, "Verified listings", "Verifierade annonser"),
      ],
    },
    {
      id: "city-auto",
      providerName: "City Auto Stockholm",
      providerType: "retailer",
      logoText: "CA",
      isPartner: true,
      isSponsored: true,
      trustSignals: [
        l(language, "Partner showroom", "Partnerhall"),
        l(language, "Trade-in support", "Inbytesstöd"),
      ],
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
      approvalSpeed: l(language, "Within 24h", "Inom 24 h") as ApprovalSpeed,
      isSponsored: false,
      badge: l(language, "Best value", "Bäst värde") as OfferBadge,
      ctaLabel: l(language, "Apply now", "Ansök nu"),
      ctaUrl: "#apply-nordic-bank",
      availability: l(language, "Open for applications", "Öppen för ansökan"),
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
      approvalSpeed: l(language, "< 2 minutes", "< 2 minuter") as ApprovalSpeed,
      isSponsored: false,
      badge: l(language, "Lowest monthly cost", "Lägst månadskostnad") as OfferBadge,
      ctaLabel: l(language, "Check eligibility", "Kontrollera behörighet"),
      ctaUrl: "#check-scandia",
      availability: l(language, "Pre-check available", "Förhandskontroll tillgänglig"),
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
      approvalSpeed: l(language, "Instant", "Direkt") as ApprovalSpeed,
      isSponsored: true,
      badge: l(language, "Low upfront cost", "Låg kontantinsats") as OfferBadge,
      ctaLabel: l(language, "View offer", "Visa erbjudande"),
      ctaUrl: "#view-dealerflow",
      availability: l(language, "Campaign this month", "Kampanj denna månad"),
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
      approvalSpeed: l(language, "Dealer calls back", "Återförsäljare ringer upp") as ApprovalSpeed,
      isSponsored: true,
      badge: l(language, "Partner offer", "Partnererbjudande") as OfferBadge,
      ctaLabel: l(language, "See details", "Se detaljer"),
      ctaUrl: "#details-dealer-plan",
      availability: l(language, "Available via partner dealers", "Tillgängligt hos partneråterförsäljare"),
      sourceType: "mock",
    },
  ];

  const leasingOffers: LeasingOffer[] = [
    {
      id: "lease-1",
      providerId: "flexi-lease",
      providerName: l(language, "FlexiLease Sweden", "FlexiLease Sverige"),
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
      approvalSpeed: l(language, "Within 24h", "Inom 24 h") as ApprovalSpeed,
      isSponsored: false,
      badge: l(language, "Popular", "Populär") as OfferBadge,
      ctaLabel: l(language, "View lease offer", "Visa leasingerbjudande"),
      ctaUrl: "#lease-flexi",
      availability: l(language, "Available nationwide", "Tillgängligt i hela landet"),
      sourceType: "mock",
      customerType: "private",
      initialPayment: 20000,
      annualMileage: 15000,
      excessMileageCost: 1.8,
      includedServices: [
        l(language, "Service", "Service"),
        l(language, "Roadside assistance", "Vägassistans"),
        l(language, "Winter tires", "Vinterdäck"),
      ],
      wearAndTearNote: l(language, "Normal use is included; cosmetic damage may be charged.", "Normalt bruk ingår; kosmetiska skador kan debiteras."),
      endOfContractCondition: l(language, "Return or upgrade", "Återlämna eller uppgradera"),
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
      approvalSpeed: l(language, "Instant", "Direkt") as ApprovalSpeed,
      isSponsored: true,
      badge: l(language, "Fast approval", "Snabbt godkännande") as OfferBadge,
      ctaLabel: l(language, "See details", "Se detaljer"),
      ctaUrl: "#lease-dealerflow",
      availability: l(language, "Limited campaign inventory", "Begränsat kampanjlager"),
      sourceType: "mock",
      customerType: "business",
      initialPayment: 39000,
      annualMileage: 12000,
      excessMileageCost: 2.1,
      includedServices: [
        l(language, "Service", "Service"),
        l(language, "Extended warranty", "Förlängd garanti"),
      ],
      wearAndTearNote: l(language, "Interior wear beyond normal use is charged.", "Invändigt slitage över normal nivå debiteras."),
      endOfContractCondition: l(language, "Return only", "Endast återlämning"),
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
      approvalSpeed: l(language, "< 2 minutes", "< 2 minuter") as ApprovalSpeed,
      isSponsored: false,
      badge: l(language, "Flexible contract", "Flexibelt avtal") as OfferBadge,
      ctaLabel: l(language, "Check eligibility", "Kontrollera behörighet"),
      ctaUrl: "#lease-scandia",
      availability: l(language, "Open for digital contracts", "Öppen för digitala avtal"),
      sourceType: "mock",
      customerType: "private",
      initialPayment: 12000,
      annualMileage: 18000,
      excessMileageCost: 1.4,
      includedServices: [
        l(language, "Service", "Service"),
        l(language, "Tire change", "Däckskifte"),
        l(language, "Roadside assistance", "Vägassistans"),
      ],
      wearAndTearNote: l(language, "Normal wear is accepted according to partner policy.", "Normalt slitage accepteras enligt partnerpolicy."),
      endOfContractCondition: l(language, "Return, extend, or buy out", "Återlämna, förläng eller köp loss"),
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
      approvalSpeed: l(language, "Within 24h", "Inom 24 h") as ApprovalSpeed,
      isSponsored: true,
      badge: l(language, "Partner offer", "Partnererbjudande") as OfferBadge,
      ctaLabel: l(language, "Contact dealer", "Kontakta återförsäljare"),
      ctaUrl: "#contact-city-auto",
      availability: l(language, "In stock", "I lager"),
      sourceType: "mock",
      condition: l(language, "New", "Ny") as "Ny" | "Begagnad",
      deliveryEstimate: l(language, "Delivery within 3-5 days", "Leverans inom 3-5 dagar"),
      dealerLocation: "Stockholm",
      warrantyInfo: l(language, "5 years / 100,000 km", "5 år / 100 000 km"),
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
      approvalSpeed: l(language, "< 2 minutes", "< 2 minuter") as ApprovalSpeed,
      isSponsored: false,
      badge: l(language, "Best value", "Bäst värde") as OfferBadge,
      ctaLabel: l(language, "View listing", "Visa annons"),
      ctaUrl: "#view-automarket",
      availability: l(language, "Few left", "Få kvar"),
      sourceType: "mock",
      condition: l(language, "Used", "Begagnad") as "Ny" | "Begagnad",
      deliveryEstimate: l(language, "Pickup/Delivery in 7 days", "Hämtning/Leverans inom 7 dagar"),
      dealerLocation: "Göteborg",
      warrantyInfo: l(language, "12-month dealer warranty", "12 månaders återförsäljargaranti"),
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
      approvalSpeed: l(language, "Dealer calls back", "Återförsäljare ringer upp") as ApprovalSpeed,
      isSponsored: true,
      badge: l(language, "Sponsored", "Sponsrad") as OfferBadge,
      ctaLabel: l(language, "See dealers", "Se återförsäljare"),
      ctaUrl: "#retailer-dealerflow",
      availability: l(language, "Factory order", "Beställningsvara"),
      sourceType: "mock",
      condition: l(language, "New", "Ny") as "Ny" | "Begagnad",
      deliveryEstimate: l(language, "Factory order 6-10 weeks", "Fabriksbeställning 6-10 veckor"),
      dealerLocation: "Malmö",
      warrantyInfo: l(language, "3 years / 100,000 km", "3 år / 100 000 km"),
    },
  ];

  const bestFinancing = sortOffers(financingOffers, "best")[0];
  const bestLeasing = sortOffers(leasingOffers, "best")[0];
  const bestRetailer = sortRetailerOffers(retailerOffers, "best")[0];

  const recommendations: RecommendationReason[] = [
    {
      id: "rec-1",
      category: "lowest-monthly",
      title: l(language, "Best for lowest monthly cost", "Bäst för lägsta månadskostnad"),
      explanation: language === "sv"
        ? `${sortOffers(financingOffers, "lowest-monthly")[0].providerName} håller månadskostnaden nere med längre löptid och lägre inledande kontantinsats.`
        : `${sortOffers(financingOffers, "lowest-monthly")[0].providerName} keeps monthly payments low through a longer term and lower upfront payment.`,
      offerId: sortOffers(financingOffers, "lowest-monthly")[0].id,
      sourceType: "mock",
    },
    {
      id: "rec-2",
      category: "long-term-ownership",
      title: l(language, "Best if you plan to own long-term", "Bäst om du vill äga bilen länge"),
      explanation: language === "sv"
        ? `${bestFinancing.providerName} ger den starkaste ägandekalkylen utifrån beräknad totalkostnad och ränteprofil.`
        : `${bestFinancing.providerName} gives the strongest ownership case based on projected total cost and rate profile.`,
      offerId: bestFinancing.id,
      sourceType: "mock",
    },
    {
      id: "rec-3",
      category: "low-upfront",
      title: l(language, "Best for low upfront cost", "Bäst om du vill ha låg kontantinsats"),
      explanation: language === "sv"
        ? `${sortOffers(financingOffers, "lowest-upfront")[0].providerName} erbjuder lägst kontantinsats bland ägaralternativen.`
        : `${sortOffers(financingOffers, "lowest-upfront")[0].providerName} offers the lowest upfront payment among ownership options.`,
      offerId: sortOffers(financingOffers, "lowest-upfront")[0].id,
      sourceType: "mock",
    },
    {
      id: "rec-4",
      category: "flexibility",
      title: l(language, "Best for flexibility", "Bäst för flexibilitet"),
      explanation: language === "sv"
        ? `${sortOffers(leasingOffers, "best")[0].providerName} ger smidigare val vid avtalsslut för uppgradering eller förlängning.`
        : `${sortOffers(leasingOffers, "best")[0].providerName} gives more flexibility at contract end for upgrade or extension.`,
      offerId: sortOffers(leasingOffers, "best")[0].id,
      sourceType: "mock",
    },
    {
      id: "rec-5",
      category: "predictable-monthly",
      title: l(language, "Best for predictable monthly costs", "Bäst för förutsägbar månadskostnad"),
      explanation: language === "sv"
        ? `${bestLeasing.providerName} samlar fler tjänster i en fast månadsplan och minskar risken för oväntade ägandekostnader.`
        : `${bestLeasing.providerName} bundles more services into a fixed monthly plan and reduces the risk of unexpected ownership costs.`,
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
