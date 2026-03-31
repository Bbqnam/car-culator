import { useEffect, useMemo, useState } from "react";
import { CircleHelp, Handshake, Megaphone, Sparkles } from "lucide-react";
import { getBrandLogo } from "@/lib/brand-logos";
import { type CarResult, type Currency, formatCurrency } from "@/lib/car-types";
import {
  buildCommercialTrialData,
  type CommercialOfferBase,
  type LeasingOffer,
  type RetailerOffer,
  type SortMode,
} from "@/lib/commercial-trial";
import type { Language } from "@/lib/i18n";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { tx } from "@/components/results/results-panel-copy";

type OfferTab = "loans" | "leasing" | "retailers" | "insurance";
type ProviderMeta = {
  logoText: string;
  isPartner: boolean;
  isSponsored: boolean;
};

const OFFER_SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: "best", label: "Bästa erbjudande först" },
  { key: "lowest-monthly", label: "Lägst månadskostnad" },
  { key: "lowest-total", label: "Lägst totalkostnad" },
  { key: "lowest-upfront", label: "Lägst kontantinsats" },
  { key: "fastest-approval", label: "Snabbast godkännande" },
];

const OFFER_TYPE_LABELS: Record<string, string> = {
  bank_loan: "Banklån",
  dealer_financing: "Återförsäljarfinansiering",
  balloon_financing: "Ballongfinansiering",
  private_leasing: "Privatleasing",
  retailer_listing: "Återförsäljarannons",
};

const BADGE_TONE_CLASSES: Record<string, string> = {
  "Bäst värde": "bg-emerald-100 text-emerald-800 border border-emerald-200",
  "Lägst månadskostnad": "bg-sky-100 text-sky-800 border border-sky-200",
  "Snabbt godkännande": "bg-cyan-100 text-cyan-800 border border-cyan-200",
  "Låg kontantinsats": "bg-amber-100 text-amber-800 border border-amber-200",
  "Flexibelt avtal": "bg-slate-100 text-slate-800 border border-slate-200",
  Partnererbjudande: "bg-blue-100 text-blue-800 border border-blue-200",
  Sponsrad: "bg-rose-100 text-rose-800 border border-rose-200",
  Populär: "bg-teal-100 text-teal-800 border border-teal-200",
  "Låg självrisk": "bg-lime-100 text-lime-800 border border-lime-200",
  "Best value": "bg-emerald-100 text-emerald-800 border border-emerald-200",
  "Lowest monthly cost": "bg-sky-100 text-sky-800 border border-sky-200",
  "Fast approval": "bg-cyan-100 text-cyan-800 border border-cyan-200",
  "Low upfront cost": "bg-amber-100 text-amber-800 border border-amber-200",
  "Flexible contract": "bg-slate-100 text-slate-800 border border-slate-200",
  "Partner offer": "bg-blue-100 text-blue-800 border border-blue-200",
  Sponsored: "bg-rose-100 text-rose-800 border border-rose-200",
  Popular: "bg-teal-100 text-teal-800 border border-teal-200",
  "Low deductible": "bg-lime-100 text-lime-800 border border-lime-200",
};

interface CommercialOffersDialogProps {
  sorted: (CarResult & { verdict: string })[];
  currency: Currency;
  language: Language;
  detailsId: string | null;
  setDetailsId: (value: string | null) => void;
}

export function CommercialOffersDialog({
  sorted,
  currency,
  language,
  detailsId,
  setDetailsId,
}: CommercialOffersDialogProps) {
  const [offerTab, setOfferTab] = useState<OfferTab>("loans");
  const [offerSort, setOfferSort] = useState<SortMode>("best");
  const detailsCar = sorted.find((r) => r.id === detailsId) ?? null;

  useEffect(() => {
    if (!detailsId) return;
    setOfferTab("loans");
    setOfferSort("best");
  }, [detailsId]);

  const detailsData = useMemo(
    () => (detailsCar ? buildCommercialTrialData(detailsCar, language) : null),
    [detailsCar, language]
  );
  const providerMetaById = useMemo(
    () =>
      new Map(
        (detailsData?.providers ?? []).map((provider) => [
          provider.id,
          {
            logoText: provider.logoText,
            isPartner: provider.isPartner,
            isSponsored: provider.isSponsored,
          } satisfies ProviderMeta,
        ])
      ),
    [detailsData]
  );
  const detailsCarLogo = detailsCar?.brand ? getBrandLogo(detailsCar.brand) : null;
  const recommendationLabel = getRecommendationLabel(offerSort);

  const loanOffers = useMemo(
    () => (detailsData ? detailsData.sortOffers(detailsData.financingOffers, offerSort) : []),
    [detailsData, offerSort]
  );
  const leaseOffers = useMemo(
    () => (detailsData ? detailsData.sortOffers(detailsData.leasingOffers, offerSort) : []),
    [detailsData, offerSort]
  );
  const retailerOffers = useMemo(
    () => (detailsData ? detailsData.sortRetailerOffers(detailsData.retailerOffers, offerSort) : []),
    [detailsData, offerSort]
  );
  const insuranceOffers = useMemo(
    () =>
      detailsCar
        ? sortInsuranceOffers(buildInsuranceOffers(detailsCar, language), offerSort)
        : [],
    [detailsCar, offerSort, language]
  );

  return (
    <Dialog
      open={!!detailsCar}
      onOpenChange={(open) => {
        if (!open) setDetailsId(null);
      }}
    >
      {detailsCar && (
        <DialogContent className="left-0 top-0 h-[100dvh] max-h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none border-x-0 border-b-0 p-4 sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-h-[82vh] sm:w-[92vw] sm:max-w-4xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border sm:p-5">
          <TooltipProvider delayDuration={120}>
            <DialogTitle className="text-sm uppercase tracking-[0.22em] font-extrabold text-emerald-700">
              {tx(language, "Finansieringserbjudanden")}
            </DialogTitle>
            <div className="space-y-3">
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                {language === "sv"
                  ? "Förenklad vy: jämför månadskostnad, kontantinsats och total kostnad först."
                  : "Simplified view: compare monthly cost, upfront payment, and total cost first."}
              </p>
              <div className="rounded-xl border border-border/60 bg-secondary/20 px-3 py-2.5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="flex items-center gap-2.5 min-w-0">
                  {detailsCarLogo && (
                    <img src={detailsCarLogo} alt="" className="w-9 h-9 object-contain shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                      {tx(language, "Vald bil")}
                    </p>
                    <select
                      value={detailsCar.id}
                      onChange={(e) => {
                        setDetailsId(e.target.value);
                        e.currentTarget.blur();
                      }}
                      className="mt-0.5 min-h-11 rounded-md border border-border/70 bg-background px-2.5 text-sm font-semibold text-foreground max-w-[260px] truncate focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-border/70 sm:min-h-8"
                      aria-label={tx(language, "Välj bil för finansieringserbjudanden")}
                    >
                      {sorted.map((car) => (
                        <option key={car.id} value={car.id}>
                          {car.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                    {tx(language, "Basnivå per månad")}
                  </p>
                  <p className="text-lg font-bold tabular-nums">
                    {formatCurrency(detailsCar.monthlyCost, currency)}
                  </p>
                </div>
              </div>

              <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="grid grid-cols-2 sm:grid-cols-4 rounded-lg bg-secondary/70 p-1 gap-1">
                  {([
                    { key: "loans" as OfferTab, label: tx(language, "Lån") },
                    { key: "leasing" as OfferTab, label: "Leasing" },
                    { key: "retailers" as OfferTab, label: language === "sv" ? "Handlare" : tx(language, "Återförsäljare") },
                    { key: "insurance" as OfferTab, label: tx(language, "Försäkring") },
                  ]).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setOfferTab(item.key)}
                      className={[
                        "min-h-11 px-2 py-1.5 text-[11px] sm:text-xs font-semibold rounded-md transition-colors text-center leading-tight sm:min-h-8",
                        offerTab === item.key
                          ? "bg-card text-foreground shadow-sm border border-border/40"
                          : "text-muted-foreground hover:text-foreground",
                      ].join(" ")}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <label className="text-xs text-muted-foreground flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-end sm:whitespace-nowrap">
                  <span>{tx(language, "Sortera efter")}</span>
                  <select
                    value={offerSort}
                    onChange={(e) => {
                      setOfferSort(e.target.value as SortMode);
                      e.currentTarget.blur();
                    }}
                    className="min-h-11 w-full rounded-md border border-border/70 bg-background px-2 text-xs text-foreground sm:min-h-8 sm:min-w-[170px] sm:w-auto focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-border/70"
                  >
                    {OFFER_SORT_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>{tx(language, opt.label)}</option>
                    ))}
                  </select>
                </label>
              </div>

              {offerTab === "loans" && (
                <div className="space-y-2.5">
                  {loanOffers.map((offer, index) => (
                    <div key={offer.id} className="space-y-2.5">
                      {index > 0 && (
                        <div className="h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />
                      )}
                      <CommercialOfferCard
                        offer={offer}
                        currency={currency}
                        language={language}
                        baseMonthlyCost={detailsCar.monthlyCost}
                        rank={index}
                        recommendationLabel={recommendationLabel}
                        providerMeta={providerMetaById.get(offer.providerId)}
                        extraRows={[
                          { label: tx(language, "Löptid"), value: `${offer.durationMonths} ${language === "sv" ? "månader" : "months"}` },
                          ...(offer.residualValue
                            ? [{ label: tx(language, "Restskuld"), value: formatCurrency(offer.residualValue, currency) }]
                            : []),
                          { label: tx(language, "Beräknad totalkostnad"), value: formatCurrency(offer.totalCost, currency) },
                        ]}
                      />
                    </div>
                  ))}
                </div>
              )}

              {offerTab === "leasing" && (
                <div className="space-y-2.5">
                  {leaseOffers.map((offer, index) => (
                    <div key={offer.id} className="space-y-2.5">
                      {index > 0 && (
                        <div className="h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />
                      )}
                      <CommercialOfferCard
                        offer={offer}
                        currency={currency}
                        language={language}
                        baseMonthlyCost={detailsCar.monthlyCost}
                        rank={index}
                        recommendationLabel={recommendationLabel}
                        providerMeta={providerMetaById.get(offer.providerId)}
                        metaPills={[getLeasingAudienceLabel(offer, language)]}
                        extraRows={[
                          { label: tx(language, "Löptid"), value: `${offer.durationMonths} ${language === "sv" ? "månader" : "months"}` },
                          { label: tx(language, "Körsträcka"), value: `${offer.annualMileage.toLocaleString("sv-SE")} ${language === "sv" ? "km/år" : "km/year"}` },
                          { label: tx(language, "Övermil"), value: `${formatCurrency(offer.excessMileageCost, currency)}/km` },
                          { label: tx(language, "Beräknad totalkostnad"), value: formatCurrency(offer.totalCost, currency) },
                        ]}
                      />
                    </div>
                  ))}
                </div>
              )}

              {offerTab === "retailers" && (
                <div className="space-y-2.5">
                  {retailerOffers.map((offer, index) => (
                    <div key={offer.id} className="space-y-2.5">
                      {index > 0 && (
                        <div className="h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />
                      )}
                      <RetailerOfferCard
                        offer={offer}
                        currency={currency}
                        language={language}
                        baseMonthlyCost={detailsCar.monthlyCost}
                        rank={index}
                        recommendationLabel={recommendationLabel}
                        providerMeta={providerMetaById.get(offer.providerId)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {offerTab === "insurance" && (
                <div className="space-y-2.5">
                  {insuranceOffers.map((offer, index) => (
                    <div key={offer.id} className="space-y-2.5">
                      {index > 0 && (
                        <div className="h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />
                      )}
                      <InsuranceOfferCard
                        offer={offer}
                        currency={currency}
                        language={language}
                        rank={index}
                        recommendationLabel={recommendationLabel}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TooltipProvider>
        </DialogContent>
      )}
    </Dialog>
  );
}

interface InsuranceOffer {
  id: string;
  providerName: string;
  monthlyPremium: number;
  yearlyPremium: number;
  deductible: number;
  coverage: string;
  approvalSpeed: string;
  badge?: string;
  availability: string;
  ctaLabel: string;
}

function buildInsuranceOffers(car: CarResult, language: Language): InsuranceOffer[] {
  const basePremium = Math.max(320, Math.round(car.monthlyCost * 0.11));
  const fuelFactor = car.fuelType === "electric" ? 0.92 : 1;

  return [
    {
      id: `${car.id}-ins-1`,
      providerName: "Trygg Mobility",
      monthlyPremium: Math.round(basePremium * fuelFactor),
      yearlyPremium: Math.round(basePremium * fuelFactor * 12),
      deductible: 3500,
      coverage: language === "sv" ? "Helförsäkring + vägassistans" : "Comprehensive + roadside assistance",
      approvalSpeed: language === "sv" ? "< 2 minuter" : "< 2 minutes",
      badge: language === "sv" ? "Bäst värde" : "Best value",
      availability: language === "sv" ? "Digital offert direkt" : "Instant digital quote",
      ctaLabel: language === "sv" ? "Se offert" : "Get quote",
    },
    {
      id: `${car.id}-ins-2`,
      providerName: "Nordic Auto Protect",
      monthlyPremium: Math.round(basePremium * 0.92 * fuelFactor),
      yearlyPremium: Math.round(basePremium * 0.92 * fuelFactor * 12),
      deductible: 6000,
      coverage: language === "sv" ? "Helförsäkring" : "Comprehensive",
      approvalSpeed: language === "sv" ? "Direkt" : "Instant",
      badge: language === "sv" ? "Lägst månadskostnad" : "Lowest monthly cost",
      availability: language === "sv" ? "Direkt offert online" : "Instant online quote",
      ctaLabel: language === "sv" ? "Se villkor" : "See policy",
    },
    {
      id: `${car.id}-ins-3`,
      providerName: language === "sv" ? "Svea Försäkring" : "Svea Insurance",
      monthlyPremium: Math.round(basePremium * 1.05 * fuelFactor),
      yearlyPremium: Math.round(basePremium * 1.05 * fuelFactor * 12),
      deductible: 2500,
      coverage: language === "sv" ? "Premium + hyrbil" : "Premium + rental car",
      approvalSpeed: language === "sv" ? "Inom 24 h" : "Within 24h",
      badge: language === "sv" ? "Låg självrisk" : "Low deductible",
      availability: language === "sv" ? "Telefon- och webbsupport" : "Phone + web support",
      ctaLabel: language === "sv" ? "Granska erbjudande" : "Review offer",
    },
  ];
}

function sortInsuranceOffers(offers: InsuranceOffer[], mode: SortMode): InsuranceOffer[] {
  const speedScore = (speed: string) => {
    if (speed === "Direkt" || speed === "Instant") return 1;
    if (speed === "< 2 minuter" || speed === "< 2 minutes") return 2;
    if (speed === "Inom 24 h" || speed === "Within 24h") return 3;
    if (speed === "1-2 arbetsdagar" || speed === "1-2 business days") return 4;
    return 5;
  };

  const sorted = [...offers];
  switch (mode) {
    case "lowest-monthly":
      return sorted.sort((a, b) => a.monthlyPremium - b.monthlyPremium);
    case "lowest-total":
      return sorted.sort((a, b) => a.yearlyPremium - b.yearlyPremium);
    case "lowest-upfront":
      return sorted.sort((a, b) => a.deductible - b.deductible);
    case "fastest-approval":
      return sorted.sort((a, b) => speedScore(a.approvalSpeed) - speedScore(b.approvalSpeed));
    case "best":
    default:
      return sorted.sort(
        (a, b) =>
          a.monthlyPremium * 1.15 + a.deductible * 0.04 + speedScore(a.approvalSpeed) * 35 -
          (b.monthlyPremium * 1.15 + b.deductible * 0.04 + speedScore(b.approvalSpeed) * 35)
      );
  }
}

function CommercialOfferCard({
  offer,
  currency,
  language,
  baseMonthlyCost,
  rank,
  recommendationLabel,
  providerMeta,
  metaPills,
  extraRows,
}: {
  offer: CommercialOfferBase;
  currency: Currency;
  language: Language;
  baseMonthlyCost: number;
  rank: number;
  recommendationLabel: string;
  providerMeta?: ProviderMeta;
  metaPills?: string[];
  extraRows: { label: string; value: string }[];
}) {
  const isTop = rank === 0;
  const providerInitials = getProviderInitials(offer.providerName, providerMeta?.logoText);
  const badgeTone = getBadgeToneClass(offer.badge);
  const showPrimaryBadge = Boolean(offer.badge) && !(isPartnerBadge(offer.badge) && providerMeta?.isPartner);
  const primaryBadgeLabel = offer.badge ? getDisplayBadgeLabel(offer.badge, language) : "";
  const monthlyHeadline = getMonthlyHeadline(offer.badge, recommendationLabel, isTop, "payment");
  const aprLabel = offer.apr > 0 ? `${offer.apr.toFixed(1)}% APR` : tx(language, "Leasingvillkor");
  const ctaClasses = isTop
    ? "inline-flex min-h-11 w-full items-center justify-center rounded-md bg-indigo-600 text-white text-xs font-bold px-3 py-2 shadow-sm ring-2 ring-indigo-200 hover:bg-indigo-500 hover:shadow-md transition-all sm:min-h-0 sm:w-auto sm:py-1.5"
    : "inline-flex min-h-11 w-full items-center justify-center rounded-md bg-slate-900 text-white text-xs font-bold px-3 py-2 shadow-sm hover:bg-slate-800 hover:shadow-md transition-all sm:min-h-0 sm:w-auto sm:py-1.5";
  const metrics = [
    { label: tx(language, "Kontantinsats"), value: formatCurrency(offer.upfrontCost, currency) },
    ...extraRows,
  ];
  const monthlyDelta = offer.monthlyCost - baseMonthlyCost;
  const monthlyDeltaLabel =
    monthlyDelta < 0
      ? (language === "sv"
          ? `−${formatCurrency(Math.abs(monthlyDelta), currency)}/mån mot bas`
          : `Save ${formatCurrency(Math.abs(monthlyDelta), currency)}/mo`)
      : monthlyDelta > 0
      ? (language === "sv"
          ? `+${formatCurrency(monthlyDelta, currency)}/mån mot bas`
          : `+${formatCurrency(monthlyDelta, currency)}/mo vs baseline`)
      : (language === "sv" ? "Samma som bas" : tx(language, "Samma nivå som bilens grundkostnad"));
  const monthlyDeltaTone =
    monthlyDelta < 0
      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
      : monthlyDelta > 0
      ? "bg-rose-100 text-rose-800 border border-rose-200"
      : "bg-secondary text-muted-foreground border border-border/60";

  return (
    <article
      className={[
        "rounded-xl border p-3.5 sm:p-4 space-y-3 overflow-hidden",
        isTop
          ? "border-emerald-300/60 bg-gradient-to-br from-emerald-50/70 to-background ring-1 ring-emerald-200/60"
          : "border-border/60 bg-background",
      ].join(" ")}
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[11px] font-bold text-foreground shrink-0">
            {providerInitials}
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-foreground truncate">{offer.providerName}</p>
            <p className="text-[11px] text-muted-foreground">{offer.availability}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {metaPills?.map((pill) => (
                <span
                  key={`${offer.id}-${pill}`}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getMetaPillToneClass(pill, language)}`}
                >
                  {pill}
                </span>
              ))}
              {showPrimaryBadge && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeTone}`}>
                  {primaryBadgeLabel}
                </span>
              )}
              {providerMeta?.isPartner && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  <Handshake className="w-3 h-3" />
                  {language === "sv" ? "Partner" : "Partner"}
                </span>
              )}
              {(offer.isSponsored || providerMeta?.isSponsored) && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  <Megaphone className="w-3 h-3" />
                  {tx(language, "Sponsrad")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          {isTop && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-600 text-white">
              <Sparkles className="w-3 h-3" />
              {tx(language, recommendationLabel)}
            </span>
          )}
          <div className="flex flex-wrap gap-1.5 sm:justify-end">
            {[
              { label: "APR", value: aprLabel },
              { label: tx(language, "Godkännande"), value: offer.approvalSpeed },
            ].map((item) => (
              <div
                key={`${offer.id}-${item.label}`}
                className="rounded-md border border-emerald-200/70 bg-emerald-50/70 px-2 py-1 text-left sm:text-right"
              >
                <p className="text-[9px] uppercase tracking-wide text-emerald-700/80 font-semibold">{item.label}</p>
                <p className="text-[11px] font-semibold text-emerald-800 whitespace-nowrap">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/70 px-2.5 py-2.5">
        <div className="flex items-start justify-between gap-1.5">
          <p className="text-[10px] uppercase tracking-wider text-emerald-700/80 font-semibold leading-tight">{tx(language, monthlyHeadline)}</p>
          {(isTop || monthlyDelta !== 0) && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full leading-tight ${monthlyDeltaTone}`}>
              {monthlyDeltaLabel}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-[23px] sm:text-[24px] leading-none font-extrabold text-emerald-800 tabular-nums">
            {formatCurrency(offer.monthlyCost, currency)}
            <span className="ml-1 text-sm font-semibold text-emerald-700">{language === "sv" ? "/mån" : "/mo"}</span>
          </p>
          <a href={offer.ctaUrl} className={ctaClasses}>
            {offer.ctaLabel}
          </a>
        </div>
      </div>

      <div
        className="grid gap-x-3 gap-y-2 pt-1 text-xs"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(132px, 1fr))` }}
      >
        {metrics.map((row) => (
          <OfferField
            key={`${offer.id}-${row.label}`}
            label={row.label}
            value={row.value}
            compact
            mutedValue={row.label === tx(language, "Beräknad totalkostnad")}
            helpText={getOfferFieldHelp(row.label, language)}
            language={language}
          />
        ))}
      </div>
    </article>
  );
}

function RetailerOfferCard({
  offer,
  currency,
  language,
  baseMonthlyCost,
  rank,
  recommendationLabel,
  providerMeta,
}: {
  offer: RetailerOffer;
  currency: Currency;
  language: Language;
  baseMonthlyCost: number;
  rank: number;
  recommendationLabel: string;
  providerMeta?: ProviderMeta;
}) {
  const isTop = rank === 0;
  const providerInitials = getProviderInitials(offer.providerName, providerMeta?.logoText);
  const badgeTone = getBadgeToneClass(offer.badge);
  const showPrimaryBadge = Boolean(offer.badge) && !(isPartnerBadge(offer.badge) && providerMeta?.isPartner);
  const primaryBadgeLabel = offer.badge ? getDisplayBadgeLabel(offer.badge, language) : "";
  const monthlyHeadline = getMonthlyHeadline(offer.badge, recommendationLabel, isTop, "estimate");
  const ctaClasses = isTop
    ? "inline-flex min-h-11 w-full items-center justify-center rounded-md bg-indigo-600 text-white text-xs font-bold px-3 py-2 shadow-sm ring-2 ring-indigo-200 hover:bg-indigo-500 hover:shadow-md transition-all sm:min-h-0 sm:w-auto sm:py-1.5"
    : "inline-flex min-h-11 w-full items-center justify-center rounded-md bg-slate-900 text-white text-xs font-bold px-3 py-2 shadow-sm hover:bg-slate-800 hover:shadow-md transition-all sm:min-h-0 sm:w-auto sm:py-1.5";
  const monthlyDelta = offer.monthlyCost - baseMonthlyCost;
  const monthlyDeltaLabel =
    monthlyDelta < 0
      ? (language === "sv"
          ? `−${formatCurrency(Math.abs(monthlyDelta), currency)}/mån mot bas`
          : `Save ${formatCurrency(Math.abs(monthlyDelta), currency)}/mo`)
      : monthlyDelta > 0
      ? (language === "sv"
          ? `+${formatCurrency(monthlyDelta, currency)}/mån mot bas`
          : `+${formatCurrency(monthlyDelta, currency)}/mo vs baseline`)
      : (language === "sv" ? "Samma som bas" : tx(language, "Samma nivå som bilens grundkostnad"));
  const monthlyDeltaTone =
    monthlyDelta < 0
      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
      : monthlyDelta > 0
      ? "bg-rose-100 text-rose-800 border border-rose-200"
      : "bg-secondary text-muted-foreground border border-border/60";

  return (
    <article
      className={[
        "rounded-xl border p-3.5 sm:p-4 space-y-3 overflow-hidden",
        isTop
          ? "border-emerald-300/60 bg-gradient-to-br from-emerald-50/70 to-background ring-1 ring-emerald-200/60"
          : "border-border/60 bg-background",
      ].join(" ")}
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[11px] font-bold text-foreground shrink-0">
            {providerInitials}
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-foreground truncate">{offer.providerName}</p>
            <p className="text-[11px] text-muted-foreground">{offer.dealerLocation} · {offer.availability}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getMetaPillToneClass(offer.condition, language)}`}>
                {offer.condition}
              </span>
              {showPrimaryBadge && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeTone}`}>
                  {primaryBadgeLabel}
                </span>
              )}
              {providerMeta?.isPartner && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  <Handshake className="w-3 h-3" />
                  {language === "sv" ? "Partner" : "Partner"}
                </span>
              )}
              {(offer.isSponsored || providerMeta?.isSponsored) && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  <Megaphone className="w-3 h-3" />
                  {tx(language, "Sponsrad")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          {isTop && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-600 text-white">
              <Sparkles className="w-3 h-3" />
              {tx(language, recommendationLabel)}
            </span>
          )}
          <div className="flex flex-wrap gap-1.5 sm:justify-end">
            {[
              { label: "APR", value: `${offer.apr.toFixed(1)}% APR` },
              { label: tx(language, "Godkännande"), value: offer.approvalSpeed },
            ].map((item) => (
              <div
                key={`${offer.id}-${item.label}`}
                className="rounded-md border border-emerald-200/70 bg-emerald-50/70 px-2 py-1 text-left sm:text-right"
              >
                <p className="text-[9px] uppercase tracking-wide text-emerald-700/80 font-semibold">{item.label}</p>
                <p className="text-[11px] font-semibold text-emerald-800 whitespace-nowrap">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/70 px-2.5 py-2.5">
        <div className="flex items-start justify-between gap-1.5">
          <p className="text-[10px] uppercase tracking-wider text-emerald-700/80 font-semibold leading-tight">{tx(language, monthlyHeadline)}</p>
          {(isTop || monthlyDelta !== 0) && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full leading-tight ${monthlyDeltaTone}`}>
              {monthlyDeltaLabel}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-[23px] sm:text-[24px] leading-none font-extrabold text-emerald-800 tabular-nums">
            {formatCurrency(offer.monthlyCost, currency)}
            <span className="ml-1 text-sm font-semibold text-emerald-700">{language === "sv" ? "/mån" : "/mo"}</span>
          </p>
          <a href={offer.ctaUrl} className={ctaClasses}>
            {offer.ctaLabel}
          </a>
        </div>
      </div>

      <div className="grid gap-x-3 gap-y-2 pt-1 text-xs grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <OfferField label={tx(language, "Kontantinsats")} value={formatCurrency(offer.upfrontCost, currency)} helpText={getOfferFieldHelp(tx(language, "Kontantinsats"), language)} language={language} />
        <OfferField label={tx(language, "Leverans")} value={offer.deliveryEstimate} compact helpText={getOfferFieldHelp(tx(language, "Leverans"), language)} language={language} />
        <OfferField label={tx(language, "Garanti")} value={offer.warrantyInfo} compact helpText={getOfferFieldHelp(tx(language, "Garanti"), language)} language={language} />
        <OfferField
          label={tx(language, "Beräknad totalkostnad")}
          value={formatCurrency(offer.totalCost, currency)}
          mutedValue
          compact
          helpText={getOfferFieldHelp(tx(language, "Beräknad totalkostnad"), language)}
          language={language}
        />
      </div>
    </article>
  );
}

function InsuranceOfferCard({
  offer,
  currency,
  language,
  rank,
  recommendationLabel,
}: {
  offer: InsuranceOffer;
  currency: Currency;
  language: Language;
  rank: number;
  recommendationLabel: string;
}) {
  const isTop = rank === 0;
  const badgeTone = getBadgeToneClass(offer.badge);
  const monthlyHeadline = getMonthlyHeadline(offer.badge, recommendationLabel, isTop, "premium");
  const ctaClasses = isTop
    ? "inline-flex min-h-11 w-full items-center justify-center rounded-md bg-indigo-600 text-white text-xs font-bold px-3 py-2 shadow-sm ring-2 ring-indigo-200 hover:bg-indigo-500 hover:shadow-md transition-all sm:min-h-0 sm:w-auto sm:py-1.5"
    : "inline-flex min-h-11 w-full items-center justify-center rounded-md bg-slate-900 text-white text-xs font-bold px-3 py-2 shadow-sm hover:bg-slate-800 hover:shadow-md transition-all sm:min-h-0 sm:w-auto sm:py-1.5";

  return (
    <article
      className={[
        "rounded-xl border p-3.5 sm:p-4 space-y-3 overflow-hidden",
        isTop
          ? "border-emerald-300/60 bg-gradient-to-br from-emerald-50/70 to-background ring-1 ring-emerald-200/60"
          : "border-border/60 bg-background",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[11px] font-bold text-foreground shrink-0">
            {getProviderInitials(offer.providerName)}
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-foreground truncate">{offer.providerName}</p>
            <p className="text-[11px] text-muted-foreground">{offer.availability}</p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          {isTop && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-600 text-white">
              <Sparkles className="w-3 h-3" />
              {tx(language, recommendationLabel)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {offer.badge && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeTone}`}>
              {offer.badge}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/70 px-2.5 py-2.5">
        <div className="flex items-start justify-between gap-1.5">
          <p className="text-[10px] uppercase tracking-wider text-emerald-700/80 font-semibold leading-tight">{tx(language, monthlyHeadline)}</p>
          <p className="text-[11px] font-semibold text-emerald-700 whitespace-nowrap">
              {formatCurrency(offer.yearlyPremium, currency)}{language === "sv" ? "/år" : "/year"}
          </p>
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-[23px] sm:text-[24px] leading-none font-extrabold text-emerald-800 tabular-nums">
            {formatCurrency(offer.monthlyPremium, currency)}
            <span className="ml-1 text-sm font-semibold text-emerald-700">{language === "sv" ? "/mån" : "/mo"}</span>
          </p>
          <button type="button" className={ctaClasses}>
            {offer.ctaLabel}
          </button>
        </div>
      </div>

      <div className="grid gap-x-3 gap-y-2 pt-1 text-xs grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <OfferField
          label={tx(language, "Självrisk")}
          value={formatCurrency(offer.deductible, currency)}
          helpText={getOfferFieldHelp(tx(language, "Självrisk"), language)}
          language={language}
        />
        <OfferField
          label={tx(language, "Godkännande")}
          value={offer.approvalSpeed}
          compact
          helpText={getOfferFieldHelp(tx(language, "Godkännande"), language)}
          language={language}
        />
        <OfferField
          label={tx(language, "Omfattning")}
          value={offer.coverage}
          compact
          helpText={getOfferFieldHelp(tx(language, "Omfattning"), language)}
          language={language}
        />
      </div>
    </article>
  );
}

function OfferField({
  label,
  value,
  compact,
  mutedValue,
  helpText,
  language,
}: {
  label: string;
  value: string;
  compact?: boolean;
  mutedValue?: boolean;
  helpText?: string;
  language: Language;
}) {
  const labelClass = language === "sv"
    ? "text-[10px] text-muted-foreground font-semibold leading-tight"
    : "text-[10px] uppercase tracking-wide text-muted-foreground font-semibold";

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1">
        <p className={labelClass}>{label}</p>
        {helpText && (
          <UiTooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center text-muted-foreground/80 hover:text-foreground transition-colors"
                aria-label={`${tx(language, "Mer information om")} ${label}`}
              >
                <CircleHelp className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[240px] text-[11px] leading-relaxed">
              {helpText}
            </TooltipContent>
          </UiTooltip>
        )}
      </div>
      <p
        className={[
          compact ? "text-[12px]" : "text-[13px]",
          mutedValue ? "font-medium text-muted-foreground" : "font-semibold text-foreground",
          "leading-snug break-words",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function getOfferFieldHelp(label: string, language: Language): string | undefined {
  const helpSv: Record<string, string> = {
    Kontantinsats: "Belopp som betalas vid avtalets start.",
    "Beräknad totalkostnad": "Beräknad totalkostnad för hela avtalstiden.",
    Godkännande: "Vanlig tid tills du får besked om kreditprövningen.",
    Typ: "Erbjudandets upplägg, till exempel banklån eller återförsäljarfinansiering.",
    APR: "Effektiv ränta inklusive avgifter och ränta.",
    Löptid: "Avtalets längd i månader.",
    Restskuld: "Valfri slutbetalning när avtalet löper ut.",
    Körsträcka: "Årlig körsträcka som ingår innan övermil debiteras.",
    Övermil: "Avgift per kilometer över inkluderad körsträcka.",
    Leverans: "Uppskattad tid till leverans av bilen.",
    Garanti: "Garantins längd och max körsträcka som omfattas.",
    Självrisk: "Beloppet du betalar själv innan försäkringen träder in.",
    Omfattning: "Vad som ingår i försäkringsplanen.",
  };
  const helpEn: Record<string, string> = {
    "Upfront payment": "One-time payment due at the start of the contract.",
    "Estimated total cost": "Estimated total cost for the full contract period.",
    Approval: "Typical time to receive a financing or underwriting decision.",
    Type: "Offer structure, such as bank loan or dealer financing.",
    APR: "Effective annual rate including fees and interest.",
    Term: "Contract length in months.",
    Balloon: "Optional final payment due at contract end.",
    Mileage: "Annual mileage included before excess charges apply.",
    "Excess mileage": "Cost per kilometer above included mileage.",
    Delivery: "Estimated delivery timeline for the vehicle.",
    Warranty: "Warranty duration and covered maximum mileage.",
    Deductible: "Amount you pay before insurance coverage applies.",
    Coverage: "What is included in the insurance plan.",
  };
  return language === "sv" ? helpSv[label] : helpEn[label];
}

function getRecommendationLabel(sortMode: SortMode): string {
  switch (sortMode) {
    case "lowest-monthly":
      return "Lägst månadskostnad";
    case "lowest-total":
      return "Lägst totalkostnad";
    case "lowest-upfront":
      return "Lägst kontantinsats";
    case "fastest-approval":
      return "Snabbast godkännande";
    case "best":
    default:
      return "Bäst totalt";
  }
}

function getMonthlyHeadline(
  badge: string | undefined,
  recommendationLabel: string,
  isTop: boolean,
  variant: "payment" | "estimate" | "premium"
): string {
  if (isTop) {
    if (recommendationLabel === "Lägst månadskostnad") return "Bästa månadsalternativ";
    if (recommendationLabel === "Snabbast godkännande") return "Alternativ med snabbast godkännande";
    if (recommendationLabel === "Lägst kontantinsats") return "Alternativ med lägst kontantinsats";
    if (recommendationLabel === "Lägst totalkostnad") return "Alternativ med lägst totalkostnad";
    return "Bästa helhetsalternativ";
  }

  if (badge === "Lägst månadskostnad") return "Lägre månadsalternativ";
  if (badge === "Snabbt godkännande") return "Alternativ med snabbt godkännande";
  if (badge === "Låg kontantinsats") return "Alternativ med lägre kontantinsats";
  if (badge === "Bäst värde") return "Värdefokuserat erbjudande";

  if (variant === "premium") return "Uppskattad månadspremie";
  if (variant === "estimate") return "Uppskattad månadskostnad";
  return "Uppskattad månadsbetalning";
}

function getBadgeToneClass(badge?: string) {
  if (!badge) return "bg-secondary text-muted-foreground border border-border/50";
  return BADGE_TONE_CLASSES[badge] ?? "bg-secondary text-muted-foreground border border-border/50";
}

function getProviderInitials(providerName: string, fallback?: string) {
  if (fallback?.trim()) return fallback.trim();
  const parts = providerName.split(" ").filter(Boolean);
  if (parts.length === 0) return "OF";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getLeasingAudienceLabel(offer: LeasingOffer, language: Language): string {
  return offer.customerType === "business"
    ? (language === "sv" ? "Företag" : "Business")
    : (language === "sv" ? "Privat" : "Private");
}

function getLeasingTypeLabel(offer: LeasingOffer, language: Language): string {
  return offer.customerType === "business"
    ? (language === "sv" ? "Företagsleasing" : "Business leasing")
    : (language === "sv" ? "Privatleasing" : "Private leasing");
}

function getMetaPillToneClass(label: string, language: Language): string {
  const isNew = label === "Ny" || label === "New";
  const isUsed = label === "Begagnad" || label === "Used";
  const isPrivate = label === "Privat" || label === "Private";
  const isBusiness = label === "Företag" || label === "Business";

  if (isNew) return "bg-sky-100 text-sky-800 border border-sky-200";
  if (isUsed) return "bg-stone-100 text-stone-800 border border-stone-200";
  if (isPrivate) return "bg-cyan-100 text-cyan-800 border border-cyan-200";
  if (isBusiness) return "bg-slate-100 text-slate-800 border border-slate-200";

  return language === "sv"
    ? "bg-secondary text-foreground border border-border/60"
    : "bg-secondary text-foreground border border-border/60";
}

function isPartnerBadge(badge?: string): boolean {
  return badge === "Partnererbjudande" || badge === "Partner offer";
}

function getDisplayBadgeLabel(badge: string, language: Language): string {
  if (badge === "Låg kontantinsats") return language === "sv" ? "Låg startkostnad" : "Low start cost";
  if (badge === "Low upfront cost") return language === "sv" ? "Låg startkostnad" : "Low start cost";
  return badge;
}
