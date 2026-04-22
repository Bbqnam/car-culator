import { useEffect, useMemo, useState } from "react";
import { Handshake, Megaphone, Sparkles } from "lucide-react";
import { calculateResults, type CarInput, type CarResult, type Currency, formatCurrency } from "@/lib/car-types";
import {
  buildCommercialTrialData,
  type CommercialOfferBase,
  type LeasingOffer,
  type RetailerOffer,
  type SortMode,
} from "@/lib/commercial-trial";
import { formatRateLabel, getLoanBenchmarks, type LoanBenchmarkRate } from "@/lib/financing-data";
import type { Language } from "@/lib/i18n";
import { getProviderVisual } from "@/lib/provider-logos";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BrandLogo } from "@/components/BrandLogo";
import { tx } from "@/components/results/results-panel-copy";
import { toExternalUrl } from "@/lib/utils";

type OfferTab = "loans" | "leasing" | "retailers" | "insurance";
type ProviderMeta = {
  logoText: string;
  logoSrc?: string | null;
  accentColor?: string;
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
  "Bäst värde": "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-100 dark:border-emerald-400/25",
  "Lägst månadskostnad": "bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-500/15 dark:text-sky-100 dark:border-sky-400/25",
  "Snabbt godkännande": "bg-cyan-100 text-cyan-800 border border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-100 dark:border-cyan-400/25",
  "Låg kontantinsats": "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-100 dark:border-amber-400/25",
  "Flexibelt avtal": "bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-500/15 dark:text-slate-100 dark:border-slate-300/20",
  Partnererbjudande: "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-100 dark:border-blue-400/25",
  Sponsrad: "bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-100 dark:border-rose-400/25",
  Populär: "bg-teal-100 text-teal-800 border border-teal-200 dark:bg-teal-500/15 dark:text-teal-100 dark:border-teal-400/25",
  "Låg självrisk": "bg-lime-100 text-lime-800 border border-lime-200 dark:bg-lime-500/15 dark:text-lime-100 dark:border-lime-400/25",
  "Best value": "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-100 dark:border-emerald-400/25",
  "Lowest monthly cost": "bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-500/15 dark:text-sky-100 dark:border-sky-400/25",
  "Fast approval": "bg-cyan-100 text-cyan-800 border border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-100 dark:border-cyan-400/25",
  "Low upfront cost": "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-100 dark:border-amber-400/25",
  "Flexible contract": "bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-500/15 dark:text-slate-100 dark:border-slate-300/20",
  "Partner offer": "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-100 dark:border-blue-400/25",
  Sponsored: "bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-100 dark:border-rose-400/25",
  Popular: "bg-teal-100 text-teal-800 border border-teal-200 dark:bg-teal-500/15 dark:text-teal-100 dark:border-teal-400/25",
  "Low deductible": "bg-lime-100 text-lime-800 border border-lime-200 dark:bg-lime-500/15 dark:text-lime-100 dark:border-lime-400/25",
  "Officiell offert": "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-100 dark:border-emerald-400/25",
  "Official quote": "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-100 dark:border-emerald-400/25",
};

const SURFACE_PANEL = "border border-border/60 bg-white/80 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/72 dark:shadow-[0_20px_60px_rgba(0,0,0,0.28)]";
const SURFACE_RAISED = "border border-border/60 bg-background/90 shadow-sm dark:border-white/10 dark:bg-slate-950/78 dark:shadow-[0_12px_32px_rgba(0,0,0,0.25)]";
const OFFER_CARD_BASE = "rounded-xl border p-3.5 sm:p-4 space-y-3 overflow-hidden shadow-sm backdrop-blur-sm";
const OFFER_CARD_TOP = "border-emerald-300/60 bg-gradient-to-br from-emerald-50/85 to-background ring-1 ring-emerald-200/60 dark:border-emerald-400/20 dark:from-emerald-500/12 dark:to-slate-950 dark:ring-emerald-400/15 dark:shadow-[0_18px_48px_rgba(0,0,0,0.32)]";
const OFFER_CARD_DEFAULT = "border-border/60 bg-background/92 dark:border-white/10 dark:bg-slate-950/72 dark:shadow-[0_18px_40px_rgba(0,0,0,0.26)]";
const KPI_CHIP = "rounded-md border border-emerald-200/70 bg-emerald-50/70 px-2 py-1 text-left sm:text-right dark:border-emerald-400/20 dark:bg-emerald-500/10";
const KPI_LABEL = "text-[9px] uppercase tracking-wide text-emerald-700/80 font-semibold dark:text-emerald-200/75";
const KPI_VALUE = "text-[11px] font-semibold text-emerald-800 whitespace-nowrap dark:text-emerald-50";
const HIGHLIGHT_PANEL = "rounded-lg border border-emerald-200/70 bg-emerald-50/70 px-2.5 py-2.5 dark:border-emerald-400/20 dark:bg-emerald-500/10";
const HIGHLIGHT_LABEL = "text-[10px] uppercase tracking-wider text-emerald-700/80 font-semibold leading-tight dark:text-emerald-200/80";
const HIGHLIGHT_VALUE = "text-[23px] sm:text-[24px] leading-none font-extrabold text-emerald-800 tabular-nums dark:text-emerald-50";
const HIGHLIGHT_SUFFIX = "ml-1 text-sm font-semibold text-emerald-700 dark:text-emerald-200";
const VERIFIED_PILL = "inline-flex items-center rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-slate-300";
const PARTNER_PILL = "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-100 dark:border-blue-400/25";
const SPONSORED_PILL = "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-100 dark:border-rose-400/25";

interface CommercialOffersDialogProps {
  sorted: (CarResult & { car?: CarInput; verdict: string })[];
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
  const [loanTermMonths, setLoanTermMonths] = useState(60);
  const [loanDownPayment, setLoanDownPayment] = useState(0);

  useEffect(() => {
    if (!detailsId) return;
    setOfferTab("loans");
    setOfferSort("best");
  }, [detailsId]);

  useEffect(() => {
    if (!detailsCar?.car) return;
    setLoanTermMonths(Math.max(12, detailsCar.car.loan.loanTermMonths));
    setLoanDownPayment(Math.max(0, detailsCar.car.loan.downPayment));
  }, [detailsCar]);

  const effectiveCarInput = useMemo(() => {
    if (!detailsCar?.car) return null;
    return {
      ...detailsCar.car,
      loan: {
        ...detailsCar.car.loan,
        loanTermMonths,
        downPayment: Math.max(0, Math.min(loanDownPayment, detailsCar.car.purchasePrice)),
      },
    } satisfies CarInput;
  }, [detailsCar, loanDownPayment, loanTermMonths]);

  const effectiveCarResult = useMemo(
    () => (effectiveCarInput ? calculateResults(effectiveCarInput) : detailsCar),
    [detailsCar, effectiveCarInput]
  );

  const detailsData = useMemo(
    () => (effectiveCarResult ? buildCommercialTrialData(effectiveCarResult, language, effectiveCarInput ?? detailsCar?.car) : null),
    [detailsCar, effectiveCarInput, effectiveCarResult, language]
  );
  const providerMetaById = useMemo(
    () =>
      new Map(
        (detailsData?.providers ?? []).map((provider) => [
          provider.id,
          {
            logoText: provider.logoText,
            logoSrc: provider.logoSrc,
            accentColor: provider.accentColor,
            isPartner: provider.isPartner,
            isSponsored: provider.isSponsored,
          } satisfies ProviderMeta,
        ])
      ),
    [detailsData]
  );
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
  const primaryLoanBenchmark = useMemo(
    () =>
      effectiveCarInput
        ? getLoanBenchmarks(effectiveCarInput.fuelType, effectiveCarInput.brand, effectiveCarInput.model).find(
            (item) => item.benchmarkKind !== "policy_rate"
          ) ?? null
        : null,
    [effectiveCarInput]
  );
  const insuranceOffers = useMemo(
    () =>
      detailsCar
        ? sortInsuranceOffers(buildInsuranceOffers(detailsCar, detailsCar.car, language), offerSort)
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
        <DialogContent className="left-0 top-0 h-[100dvh] max-h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none border-x-0 border-b-0 bg-background/95 p-4 backdrop-blur-xl sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-h-[82vh] sm:w-[92vw] sm:max-w-4xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border sm:p-5 dark:bg-slate-950/95 dark:border-white/10">
          <TooltipProvider delayDuration={120}>
            <DialogTitle className="text-sm uppercase tracking-[0.22em] font-extrabold text-emerald-700">
              {tx(language, "Finansieringserbjudanden")}
            </DialogTitle>
            <div className="space-y-3">
              <div className={`rounded-xl px-3 py-2.5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center ${SURFACE_PANEL}`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  {detailsCar.brand && <BrandLogo brand={detailsCar.brand} size="md" />}
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
                      className="mt-0.5 min-h-11 rounded-md border border-border/70 bg-background px-2.5 text-sm font-semibold text-foreground max-w-[260px] truncate shadow-sm focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-border/70 sm:min-h-8 dark:border-white/10 dark:bg-slate-950/78"
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
                    {formatCurrency(effectiveCarResult?.monthlyCost ?? detailsCar.monthlyCost, currency)}
                  </p>
                </div>
              </div>

              <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="grid grid-cols-2 sm:grid-cols-4 rounded-lg bg-secondary/70 p-1 gap-1 dark:bg-slate-900/78 dark:ring-1 dark:ring-white/6">
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
                          ? "bg-card text-foreground shadow-sm border border-border/40 dark:bg-slate-800 dark:border-white/10 dark:shadow-[0_8px_20px_rgba(0,0,0,0.22)]"
                          : "text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-slate-100",
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
                    className="min-h-11 w-full rounded-md border border-border/70 bg-background px-2 text-xs text-foreground shadow-sm sm:min-h-8 sm:min-w-[170px] sm:w-auto focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-border/70 dark:border-white/10 dark:bg-slate-950/78"
                  >
                    {OFFER_SORT_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>{tx(language, opt.label)}</option>
                    ))}
                  </select>
                </label>
              </div>

              {offerTab === "loans" && (
                <div className="space-y-2.5">
                  {effectiveCarInput && (
                    <LoanScenarioPanel
                      language={language}
                      currency={currency}
                      purchasePrice={effectiveCarInput.purchasePrice}
                      annualMileage={effectiveCarInput.annualMileage}
                      ownershipYears={effectiveCarInput.ownershipYears}
                      downPayment={loanDownPayment}
                      onDownPaymentChange={setLoanDownPayment}
                      termMonths={loanTermMonths}
                      onTermMonthsChange={setLoanTermMonths}
                      benchmark={primaryLoanBenchmark}
                    />
                  )}
                  {loanOffers.length > 0 ? (
                    loanOffers.map((offer, index) => (
                      <div key={offer.id} className="space-y-2.5">
                        {index > 0 && (
                          <div className="h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />
                        )}
                        <CommercialOfferCard
                          offer={offer}
                          currency={currency}
                          language={language}
                          baseMonthlyCost={effectiveCarResult?.monthlyCost ?? detailsCar.monthlyCost}
                          rank={index}
                          recommendationLabel={recommendationLabel}
                          providerMeta={providerMetaById.get(offer.providerId)}
                          extraRows={[
                            { label: tx(language, "Löptid"), value: `${offer.durationMonths} ${language === "sv" ? "månader" : "months"}` },
                            ...(offer.setupFee
                              ? [{ label: language === "sv" ? "Uppläggningsavgift" : "Setup fee", value: formatCurrency(offer.setupFee, currency) }]
                              : []),
                            ...(offer.monthlyFee
                              ? [{ label: language === "sv" ? "Månadsavgift" : "Monthly fee", value: `${formatCurrency(offer.monthlyFee, currency)}/${language === "sv" ? "mån" : "mo"}` }]
                              : []),
                            ...(offer.firstMonthlyPayment && offer.lastMonthlyPayment && offer.firstMonthlyPayment !== offer.lastMonthlyPayment
                              ? [{ label: language === "sv" ? "Betalintervall" : "Payment range", value: `${formatCurrency(offer.firstMonthlyPayment, currency)} - ${formatCurrency(offer.lastMonthlyPayment, currency)}` }]
                              : []),
                            ...(offer.residualValue
                              ? [{ label: tx(language, "Restskuld"), value: formatCurrency(offer.residualValue, currency) }]
                              : []),
                            { label: tx(language, "Beräknad totalkostnad"), value: formatCurrency(offer.totalCost, currency) },
                          ]}
                        />
                      </div>
                    ))
                  ) : (
                    <OfferEmptyState
                      title={language === "sv" ? "Inga verifierade låneerbjudanden ännu" : "No verified loan offers yet"}
                      description={
                        language === "sv"
                          ? "Vi har ännu inte kopplat en verifierad bank- eller märkeskampanj till den här bilen."
                          : "We have not linked a verified bank or brand financing offer to this car yet."
                      }
                    />
                  )}
                </div>
              )}

              {offerTab === "leasing" && (
                <div className="space-y-2.5">
                  {leaseOffers.length > 0 ? (
                    leaseOffers.map((offer, index) => (
                      <div key={offer.id} className="space-y-2.5">
                        {index > 0 && (
                          <div className="h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />
                        )}
                        <CommercialOfferCard
                          offer={offer}
                          currency={currency}
                          language={language}
                          baseMonthlyCost={effectiveCarResult?.monthlyCost ?? detailsCar.monthlyCost}
                          rank={index}
                          recommendationLabel={recommendationLabel}
                          providerMeta={providerMetaById.get(offer.providerId)}
                          metaPills={[getLeasingAudienceLabel(offer, language)]}
                          displayMonthlyCost={offer.officialMonthlyPayment}
                          comparisonMonthlyCost={offer.estimatedOwnershipMonthlyCost}
                          primaryLabelOverride={language === "sv" ? "Officiell leasingavgift" : "Official lease payment"}
                          secondaryHighlightText={
                            language === "sv"
                              ? `Beräknad ägandekostnad med drift: ${formatCurrency(offer.estimatedOwnershipMonthlyCost, currency)}/mån`
                              : `Estimated ownership cost with running costs: ${formatCurrency(offer.estimatedOwnershipMonthlyCost, currency)}/mo`
                          }
                          extraRows={[
                            { label: tx(language, "Löptid"), value: `${offer.durationMonths} ${language === "sv" ? "månader" : "months"}` },
                            { label: tx(language, "Körsträcka"), value: `${offer.annualMileage.toLocaleString("sv-SE")} ${language === "sv" ? "km/år" : "km/year"}` },
                            { label: tx(language, "Övermil"), value: `${formatCurrency(offer.excessMileageCost, currency)}/km` },
                            { label: language === "sv" ? "Beräknad ägandekostnad totalt" : "Estimated ownership total", value: formatCurrency(offer.totalCost, currency) },
                          ]}
                        />
                      </div>
                    ))
                  ) : (
                    <OfferEmptyState
                      title={
                        detailsData?.leasingAvailability.status === "manual_only"
                          ? (language === "sv" ? "Leasing stöds men saknar aktiv modellkampanj" : "Leasing is supported but no live model campaign is stored")
                          : (language === "sv" ? "Ingen verifierad leasingkampanj för modellen" : "No verified lease campaign for this model")
                      }
                      description={
                        detailsData?.leasingAvailability.notes ||
                        (language === "sv"
                          ? "Vi visar inte påhittade leasingavgifter. När vi har en verifierad modellspecifik kampanj visas den här."
                          : "We do not show invented lease fees. Once we have a verified model-specific campaign, it will appear here.")
                      }
                      href={detailsData?.leasingAvailability.sourceUrl}
                      ctaLabel={detailsData?.leasingAvailability.sourceUrl ? (language === "sv" ? "Öppna officiell sida" : "Open official page") : undefined}
                    />
                  )}
                </div>
              )}

              {offerTab === "retailers" && (
                <div className="space-y-2.5">
                  {retailerOffers.length > 0 ? (
                    retailerOffers.map((offer, index) => (
                      <div key={offer.id} className="space-y-2.5">
                        {index > 0 && (
                          <div className="h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />
                        )}
                        <RetailerOfferCard
                          offer={offer}
                          currency={currency}
                          language={language}
                          baseMonthlyCost={effectiveCarResult?.monthlyCost ?? detailsCar.monthlyCost}
                          rank={index}
                          recommendationLabel={recommendationLabel}
                          providerMeta={providerMetaById.get(offer.providerId)}
                        />
                      </div>
                    ))
                  ) : (
                    <OfferEmptyState
                      title={language === "sv" ? "Ingen verifierad återförsäljarinventering hittades för bilen" : "No verified dealer inventory found for this car"}
                      description={
                        language === "sv"
                          ? "Den här fliken visar bara verifierade återförsäljarannonser för exakt bilmatch."
                          : "This tab only shows verified dealer listings for the exact car."
                      }
                    />
                  )}
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

function LoanScenarioPanel({
  language,
  currency,
  purchasePrice,
  annualMileage,
  ownershipYears,
  downPayment,
  onDownPaymentChange,
  termMonths,
  onTermMonthsChange,
  benchmark,
}: {
  language: Language;
  currency: Currency;
  purchasePrice: number;
  annualMileage: number;
  ownershipYears: number;
  downPayment: number;
  onDownPaymentChange: (value: number) => void;
  termMonths: number;
  onTermMonthsChange: (value: number) => void;
  benchmark: LoanBenchmarkRate | null;
}) {
  const clampedDownPayment = Math.max(0, Math.min(downPayment, purchasePrice));
  const downPaymentPercent = purchasePrice > 0 ? Math.round((clampedDownPayment / purchasePrice) * 100) : 0;
  const loanAmount = Math.max(0, purchasePrice - clampedDownPayment);
  const rateLabel = benchmark ? formatRateLabel(benchmark) : null;
  const rateTypeLabel = benchmark ? getRateTypeLabel(benchmark, language) : null;
  const rateBehaviorHint = benchmark ? getRateBehaviorHint(benchmark, language) : null;
  const termBehaviorHint = benchmark ? getTermBehaviorHint(benchmark, language) : null;

  return (
    <div className={`rounded-xl px-3 py-3 space-y-3 ${SURFACE_PANEL}`}>
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-foreground">
            {language === "sv" ? "Låneinställningar" : "Loan settings"}
          </p>
          <HelpHint
            label={language === "sv" ? "Mer information om låneinställningar" : "More information about loan settings"}
            content={
              language === "sv"
                ? "Bilpris, körsträcka och ägandetid hämtas från bilen. Här justerar du bara kontantinsats och löptid."
                : "Car price, mileage, and ownership period come from the selected car. Here you only adjust down payment and term."
            }
          />
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-[10px] sm:text-[11px]">
          <CompactMetric label={language === "sv" ? "Bilpris" : "Car price"} value={formatCurrency(purchasePrice, currency)} />
          <CompactMetric label={language === "sv" ? "Körsträcka" : "Mileage"} value={`${annualMileage.toLocaleString("sv-SE")} km/${language === "sv" ? "år" : "yr"}`} />
          <CompactMetric label={language === "sv" ? "Ägandetid" : "Ownership"} value={`${ownershipYears} ${language === "sv" ? "år" : "yr"}`} />
        </div>
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        <RangeField
          label={language === "sv" ? "Kontantinsats" : "Down payment"}
          value={clampedDownPayment}
          min={0}
          max={purchasePrice}
          step={10000}
          onChange={onDownPaymentChange}
          displayValue={`${formatCurrency(clampedDownPayment, currency)} • ${downPaymentPercent}%`}
          hint={
            language === "sv"
              ? "Vissa officiella billån kräver högre minsta kontantinsats. Kortet justerar upp den automatiskt när källan kräver det."
              : "Some official car loans require a higher minimum down payment. The offer card raises it automatically when the source requires it."
          }
        />
        <RangeField
          label={language === "sv" ? "Löptid" : "Term"}
          value={termMonths}
          min={12}
          max={96}
          step={12}
          onChange={onTermMonthsChange}
          displayValue={`${termMonths} ${language === "sv" ? "månader" : "months"}`}
          hint={
            language === "sv"
              ? "Längre löptid sänker normalt månadsbetalningen men ökar ofta den totala finansieringskostnaden."
              : "A longer term usually lowers the monthly payment but often increases the total financing cost."
          }
        />
      </div>

      <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground sm:text-[11px]">
        <span className="rounded-full border border-border/60 bg-background px-2 py-1 dark:border-white/10 dark:bg-slate-950/70">
          {language === "sv" ? "Lånebelopp" : "Loan amount"}: <span className="font-semibold text-foreground">{formatCurrency(loanAmount, currency)}</span>
        </span>
        {benchmark && rateLabel && rateTypeLabel && (
          <>
            <span className="rounded-full border border-border/60 bg-background px-2 py-1 dark:border-white/10 dark:bg-slate-950/70">
              {language === "sv" ? "Referensränta" : "Reference rate"}: <span className="font-semibold text-foreground">{benchmark.providerName} {rateLabel}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2 py-1 dark:border-white/10 dark:bg-slate-950/70">
              <span>{language === "sv" ? "Räntemodell" : "Rate model"}: <span className="font-semibold text-foreground">{rateTypeLabel}</span></span>
              {rateBehaviorHint && <HelpHint label={language === "sv" ? "Hur räntemodellen fungerar" : "How the rate model works"} content={rateBehaviorHint} />}
            </span>
          </>
        )}
        {termBehaviorHint && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2 py-1 dark:border-white/10 dark:bg-slate-950/70">
            <span>{language === "sv" ? "Löptidseffekt" : "Term effect"}: <span className="font-semibold text-foreground">{language === "sv" ? "påverkar betalningen" : "changes payment"}</span></span>
            <HelpHint label={language === "sv" ? "Hur löptiden påverkar" : "How the term affects the loan"} content={termBehaviorHint} />
          </span>
        )}
      </div>
    </div>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  displayValue,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  displayValue: string;
  hint: string;
}) {
  return (
    <div className={`rounded-xl p-3 space-y-2 ${SURFACE_RAISED}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
            <HelpHint label={`${label} info`} content={hint} side="top" />
          </div>
          <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">{displayValue}</p>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(max, Math.max(min, value))}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-emerald-600"
      />
    </div>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className={`rounded-lg px-2 py-1.5 ${SURFACE_RAISED}`}>
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

interface InsuranceOffer {
  id: string;
  providerName: string;
  logoSrc?: string | null;
  accentColor?: string;
  monthlyPremium?: number | null;
  yearlyPremium?: number | null;
  deductible: number;
  coverage: string;
  approvalSpeed: string;
  badge?: string;
  availability: string;
  ctaLabel: string;
  ctaUrl: string;
  checkedAt: string;
  notes?: string;
  quoteRequired?: boolean;
  baselineMonthlyPremium?: number | null;
}

function buildInsuranceOffers(
  car: CarResult,
  carInput: CarInput | undefined,
  language: Language,
): InsuranceOffer[] {
  const baselineMonthlyPremium =
    typeof carInput?.insuranceCost === "number" && carInput.insuranceCost > 0
      ? Math.round(carInput.insuranceCost / 12)
      : null;
  const quoteNote =
    language === "sv"
      ? "Slutpriset sätts först efter registreringsnummer, förare och adress. Därför visar appen ingen påhittad premie här."
      : "The final price is set only after registration number, driver, and address details. The app therefore does not show an invented premium here.";
  const offers: InsuranceOffer[] = [
    {
      id: `${car.id}-ins-1`,
      providerName: "If",
      ...getProviderVisual("If"),
      monthlyPremium: null,
      yearlyPremium: null,
      deductible: 3500,
      coverage: language === "sv" ? "Helförsäkring med maskinskada och vägassistans" : "Comprehensive with machine cover and roadside assistance",
      approvalSpeed: language === "sv" ? "Direkt" : "Instant",
      badge: language === "sv" ? "Officiell offert" : "Official quote",
      availability: language === "sv" ? "Officiell onlineoffert hos If, kontrollerad 2026-04-02" : "Official online quote at If, checked 2026-04-02",
      ctaLabel: language === "sv" ? "Se offert hos If" : "Quote with If",
      ctaUrl: "https://www.if.se/privat/forsakringar/bilforsakring/helforsakring",
      checkedAt: "2026-04-02",
      notes: quoteNote,
      quoteRequired: true,
      baselineMonthlyPremium,
    },
    {
      id: `${car.id}-ins-4`,
      providerName: "Hedvig",
      ...getProviderVisual("Hedvig"),
      monthlyPremium: null,
      yearlyPremium: null,
      deductible: 3000,
      coverage: language === "sv" ? "Digital bilforsakring med prisberakning online" : "Digital car insurance with online quote flow",
      approvalSpeed: language === "sv" ? "< 2 minuter" : "< 2 minutes",
      badge: language === "sv" ? "Officiell offert" : "Official quote",
      availability: language === "sv" ? "Officiell onlineoffert hos Hedvig, kontrollerad 2026-04-02" : "Official online quote at Hedvig, checked 2026-04-02",
      ctaLabel: language === "sv" ? "Se offert hos Hedvig" : "Quote with Hedvig",
      ctaUrl: "https://www.hedvig.com/se/forsakringar/bilforsakring",
      checkedAt: "2026-04-02",
      notes: quoteNote,
      quoteRequired: true,
      baselineMonthlyPremium,
    },
    {
      id: `${car.id}-ins-2`,
      providerName: "Folksam",
      ...getProviderVisual("Folksam"),
      monthlyPremium: null,
      yearlyPremium: null,
      deductible: 4500,
      coverage: language === "sv" ? "Helförsäkring med hyrbil och rättsskydd" : "Comprehensive with rental car and legal cover",
      approvalSpeed: language === "sv" ? "Direkt" : "Instant",
      badge: language === "sv" ? "Officiell offert" : "Official quote",
      availability: language === "sv" ? "Officiell digital offert hos Folksam, kontrollerad 2026-04-02" : "Official digital quote at Folksam, checked 2026-04-02",
      ctaLabel: language === "sv" ? "Se offert hos Folksam" : "Quote with Folksam",
      ctaUrl: "https://www.folksam.se/forsakringar/bilforsakring",
      checkedAt: "2026-04-02",
      notes: quoteNote,
      quoteRequired: true,
      baselineMonthlyPremium,
    },
    {
      id: `${car.id}-ins-5`,
      providerName: "Dina Forsakringar",
      ...getProviderVisual("Dina Forsakringar"),
      monthlyPremium: null,
      yearlyPremium: null,
      deductible: 2500,
      coverage: language === "sv" ? "Halv- eller helforsakring beroende pa fordon och ort" : "Half or comprehensive cover depending on car and region",
      approvalSpeed: language === "sv" ? "Inom 24 h" : "Within 24h",
      badge: language === "sv" ? "Officiell offert" : "Official quote",
      availability: language === "sv" ? "Officiell bilforsakringssida hos Dina, kontrollerad 2026-04-02" : "Official car insurance page at Dina, checked 2026-04-02",
      ctaLabel: language === "sv" ? "Se pris hos Dina" : "Quote with Dina",
      ctaUrl: "https://www.dina.se/forsakringar/bilforsakring/halvforsakring.html",
      checkedAt: "2026-04-02",
      notes: quoteNote,
      quoteRequired: true,
      baselineMonthlyPremium,
    },
    {
      id: `${car.id}-ins-3`,
      providerName: "Trygg-Hansa",
      ...getProviderVisual("Trygg-Hansa"),
      monthlyPremium: null,
      yearlyPremium: null,
      deductible: 2500,
      coverage: language === "sv" ? "Helförsäkring med hyrbil och självriskrabatt" : "Comprehensive with rental car and deductible protection",
      approvalSpeed: language === "sv" ? "Inom 24 h" : "Within 24h",
      badge: language === "sv" ? "Officiell offert" : "Official quote",
      availability: language === "sv" ? "Officiell offert via webben, kontrollerad 2026-04-02" : "Official quote via web, checked 2026-04-02",
      ctaLabel: language === "sv" ? "Se offert hos Trygg-Hansa" : "Quote with Trygg-Hansa",
      ctaUrl: "https://www.trygghansa.se/forsakringar/bilforsakring",
      checkedAt: "2026-04-02",
      notes: quoteNote,
      quoteRequired: true,
      baselineMonthlyPremium,
    },
  ];

  if (car.brand === "Volvo") {
    offers.unshift({
      id: `${car.id}-ins-0`,
      providerName: "Volvia",
      ...getProviderVisual("Volvia"),
      monthlyPremium: null,
      yearlyPremium: null,
      deductible: 3000,
      coverage: language === "sv" ? "Volvoanpassad bilforsakring med pris per registreringsnummer" : "Volvo-focused car insurance priced by registration number",
      approvalSpeed: language === "sv" ? "Direkt" : "Instant",
      badge: language === "sv" ? "Officiell offert" : "Official quote",
      availability: language === "sv" ? "Officiell Volvia-sida for Volvo, kontrollerad 2026-04-02" : "Official Volvia page for Volvo, checked 2026-04-02",
      ctaLabel: language === "sv" ? "Se pris hos Volvia" : "Quote with Volvia",
      ctaUrl: "https://www.volvia.se/bilforsakring/innehall/trafikforsakring",
      checkedAt: "2026-04-02",
      notes: quoteNote,
      quoteRequired: true,
      baselineMonthlyPremium,
    });
  }

  return offers;
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
      return sorted;
    case "lowest-total":
      return sorted;
    case "lowest-upfront":
      return sorted.sort((a, b) => a.deductible - b.deductible);
    case "fastest-approval":
      return sorted.sort((a, b) => speedScore(a.approvalSpeed) - speedScore(b.approvalSpeed));
    case "best":
    default:
      return sorted.sort((a, b) => speedScore(a.approvalSpeed) - speedScore(b.approvalSpeed));
  }
}

function ProviderAvatar({
  providerName,
  providerMeta,
}: {
  providerName: string;
  providerMeta?: ProviderMeta;
}) {
  const providerInitials = getProviderInitials(providerName, providerMeta?.logoText);
  const borderColor = providerMeta?.accentColor ? `${providerMeta.accentColor}33` : undefined;

  return (
    <span
      className="flex h-10 w-14 shrink-0 items-center justify-center rounded-xl border bg-white p-1.5 shadow-sm ring-1 ring-black/5 dark:border-white/12 dark:bg-slate-50 dark:ring-white/8 dark:shadow-[0_14px_34px_rgba(0,0,0,0.35)]"
      style={borderColor ? { borderColor } : undefined}
      aria-hidden="true"
    >
      {providerMeta?.logoSrc ? (
        <img src={providerMeta.logoSrc} alt="" className="max-h-full max-w-full object-contain" />
      ) : (
        <span className="text-[11px] font-bold text-foreground">{providerInitials}</span>
      )}
    </span>
  );
}

function OfferEmptyState({
  title,
  description,
  href,
  ctaLabel,
}: {
  title: string;
  description: string;
  href?: string;
  ctaLabel?: string;
}) {
  const externalHref = toExternalUrl(href);

  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-secondary/20 p-4 dark:border-white/10 dark:bg-slate-900/62 dark:shadow-[0_18px_38px_rgba(0,0,0,0.24)]">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      {externalHref && ctaLabel && (
        <a
          href={externalHref}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md border border-border/70 bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary dark:border-white/10 dark:bg-slate-950/75 dark:hover:bg-slate-900"
        >
          {ctaLabel}
        </a>
      )}
    </div>
  );
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
  displayMonthlyCost,
  comparisonMonthlyCost,
  primaryLabelOverride,
  secondaryHighlightText,
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
  displayMonthlyCost?: number;
  comparisonMonthlyCost?: number;
  primaryLabelOverride?: string;
  secondaryHighlightText?: string;
}) {
  const isTop = rank === 0;
  const badgeTone = getBadgeToneClass(offer.badge);
  const showPrimaryBadge = Boolean(offer.badge) && !(isPartnerBadge(offer.badge) && providerMeta?.isPartner);
  const primaryBadgeLabel = offer.badge ? getDisplayBadgeLabel(offer.badge, language) : "";
  const monthlyHeadline = primaryLabelOverride ?? getMonthlyHeadline(offer.badge, recommendationLabel, isTop, "payment");
  const aprLabel = offer.apr > 0 ? `${offer.apr.toFixed(1)}% APR` : tx(language, "Leasingvillkor");
  const ctaClasses = isTop
    ? "inline-flex min-h-11 w-full items-center justify-center rounded-md bg-indigo-600 text-white text-xs font-bold px-3 py-2 shadow-sm ring-2 ring-indigo-200 hover:bg-indigo-500 hover:shadow-md transition-all sm:min-h-0 sm:w-auto sm:py-1.5 dark:bg-indigo-500 dark:ring-indigo-300/30 dark:hover:bg-indigo-400"
    : "inline-flex min-h-11 w-full items-center justify-center rounded-md bg-slate-900 text-white text-xs font-bold px-3 py-2 shadow-sm hover:bg-slate-800 hover:shadow-md transition-all sm:min-h-0 sm:w-auto sm:py-1.5 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700";
  const metrics = [
    { label: tx(language, "Kontantinsats"), value: formatCurrency(offer.upfrontCost, currency) },
    ...extraRows,
  ];
  const sourceDetails = [offer.availability, offer.notes].filter(Boolean).join(" ");
  const visibleMonthlyCost = displayMonthlyCost ?? offer.monthlyCost;
  const deltaMonthlyCost = comparisonMonthlyCost ?? offer.monthlyCost;
  const sourceLabel = getCommercialSourceLabel(offer, language);
  const monthlyDelta = deltaMonthlyCost - baseMonthlyCost;
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
      ? "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-100 dark:border-emerald-400/25"
      : monthlyDelta > 0
      ? "bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-100 dark:border-rose-400/25"
      : "bg-secondary text-muted-foreground border border-border/60 dark:bg-white/5 dark:text-slate-300 dark:border-white/10";

  return (
    <article
      className={[OFFER_CARD_BASE, isTop ? OFFER_CARD_TOP : OFFER_CARD_DEFAULT].join(" ")}
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex items-start gap-2.5 min-w-0">
          <ProviderAvatar providerName={offer.providerName} providerMeta={providerMeta} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground">{offer.providerName}</p>
              {sourceDetails && (
                <>
                  <span className={VERIFIED_PILL}>
                    {language === "sv" ? "Verifierad" : "Verified"}
                  </span>
                  <HelpHint
                    label={`${offer.providerName} ${language === "sv" ? "källinfo" : "source info"}`}
                    content={sourceDetails}
                  />
                </>
              )}
            </div>
            {offer.offerLabel && offer.offerLabel !== offer.providerName && (
              <p className="mt-0.5 truncate text-[12px] text-foreground/80 dark:text-slate-300">{offer.offerLabel}</p>
            )}
            <div className="mt-1 flex flex-wrap gap-1.5">
              {metaPills?.map((pill) => (
                <span
                  key={`${offer.id}-${pill}`}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getMetaPillToneClass(pill, language)}`}
                >
                  {pill}
                </span>
              ))}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getMetaPillToneClass(sourceLabel, language)}`}>
                {sourceLabel}
              </span>
              {showPrimaryBadge && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeTone}`}>
                  {primaryBadgeLabel}
                </span>
              )}
              {providerMeta?.isPartner && (
                <span className={PARTNER_PILL}>
                  <Handshake className="w-3 h-3" />
                  {language === "sv" ? "Partner" : "Partner"}
                </span>
              )}
              {(offer.isSponsored || providerMeta?.isSponsored) && (
                <span className={SPONSORED_PILL}>
                  <Megaphone className="w-3 h-3" />
                  {tx(language, "Sponsrad")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          {isTop && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950">
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
                className={KPI_CHIP}
              >
                <p className={KPI_LABEL}>{item.label}</p>
                <p className={KPI_VALUE}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={HIGHLIGHT_PANEL}>
        <div className="flex items-start justify-between gap-1.5">
          <p className={HIGHLIGHT_LABEL}>{tx(language, monthlyHeadline)}</p>
          {(isTop || monthlyDelta !== 0) && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full leading-tight ${monthlyDeltaTone}`}>
              {monthlyDeltaLabel}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <p className={HIGHLIGHT_VALUE}>
            {formatCurrency(visibleMonthlyCost, currency)}
            <span className={HIGHLIGHT_SUFFIX}>{language === "sv" ? "/mån" : "/mo"}</span>
          </p>
          <a href={offer.ctaUrl} className={ctaClasses}>
            {offer.ctaLabel}
          </a>
        </div>
        {secondaryHighlightText && (
          <p className="mt-1 text-[11px] text-foreground/70 dark:text-slate-300">
            {secondaryHighlightText}
          </p>
        )}
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
  const badgeTone = getBadgeToneClass(offer.badge);
  const showPrimaryBadge = Boolean(offer.badge) && !(isPartnerBadge(offer.badge) && providerMeta?.isPartner);
  const primaryBadgeLabel = offer.badge ? getDisplayBadgeLabel(offer.badge, language) : "";
  const monthlyHeadline = getMonthlyHeadline(offer.badge, recommendationLabel, isTop, "estimate");
  const ctaClasses = isTop
    ? "inline-flex min-h-11 w-full items-center justify-center rounded-md bg-indigo-600 text-white text-xs font-bold px-3 py-2 shadow-sm ring-2 ring-indigo-200 hover:bg-indigo-500 hover:shadow-md transition-all sm:min-h-0 sm:w-auto sm:py-1.5 dark:bg-indigo-500 dark:ring-indigo-300/30 dark:hover:bg-indigo-400"
    : "inline-flex min-h-11 w-full items-center justify-center rounded-md bg-slate-900 text-white text-xs font-bold px-3 py-2 shadow-sm hover:bg-slate-800 hover:shadow-md transition-all sm:min-h-0 sm:w-auto sm:py-1.5 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700";
  const sourceLabel = getRetailerSourceLabel(offer, language);
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
      ? "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-100 dark:border-emerald-400/25"
      : monthlyDelta > 0
      ? "bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-100 dark:border-rose-400/25"
      : "bg-secondary text-muted-foreground border border-border/60 dark:bg-white/5 dark:text-slate-300 dark:border-white/10";

  return (
    <article
      className={[OFFER_CARD_BASE, isTop ? OFFER_CARD_TOP : OFFER_CARD_DEFAULT].join(" ")}
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex items-start gap-2.5 min-w-0">
          <ProviderAvatar providerName={offer.providerName} providerMeta={providerMeta} />
          <div className="min-w-0">
            <p className="min-w-0 truncate text-[15px] font-semibold text-foreground">{offer.providerName}</p>
            {offer.offerLabel && offer.offerLabel !== offer.providerName && (
              <p className="mt-0.5 truncate text-[12px] text-foreground/80 dark:text-slate-300">{offer.offerLabel}</p>
            )}
            <div className="mt-0.5 flex items-center gap-1.5">
              <p className="text-[11px] text-muted-foreground">{offer.dealerLocation}</p>
              <HelpHint
                label={`${offer.providerName} ${language === "sv" ? "källinfo" : "source info"}`}
                content={offer.availability}
              />
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getMetaPillToneClass(offer.condition, language)}`}>
                {offer.condition}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getMetaPillToneClass(sourceLabel, language)}`}>
                {sourceLabel}
              </span>
              {showPrimaryBadge && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeTone}`}>
                  {primaryBadgeLabel}
                </span>
              )}
              {providerMeta?.isPartner && (
                <span className={PARTNER_PILL}>
                  <Handshake className="w-3 h-3" />
                  {language === "sv" ? "Partner" : "Partner"}
                </span>
              )}
              {(offer.isSponsored || providerMeta?.isSponsored) && (
                <span className={SPONSORED_PILL}>
                  <Megaphone className="w-3 h-3" />
                  {tx(language, "Sponsrad")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          {isTop && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950">
              <Sparkles className="w-3 h-3" />
              {tx(language, recommendationLabel)}
            </span>
          )}
          <div className="flex flex-wrap gap-1.5 sm:justify-end">
            {[
              {
                label: offer.apr > 0 ? "APR" : (language === "sv" ? "Källa" : "Source"),
                value: offer.apr > 0 ? `${offer.apr.toFixed(1)}% APR` : sourceLabel,
              },
              { label: tx(language, "Godkännande"), value: offer.approvalSpeed },
            ].map((item) => (
              <div
                key={`${offer.id}-${item.label}`}
                className={KPI_CHIP}
              >
                <p className={KPI_LABEL}>{item.label}</p>
                <p className={KPI_VALUE}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={HIGHLIGHT_PANEL}>
        <div className="flex items-start justify-between gap-1.5">
          <p className={HIGHLIGHT_LABEL}>{tx(language, monthlyHeadline)}</p>
          {(isTop || monthlyDelta !== 0) && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full leading-tight ${monthlyDeltaTone}`}>
              {monthlyDeltaLabel}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <p className={HIGHLIGHT_VALUE}>
            {formatCurrency(offer.monthlyCost, currency)}
            <span className={HIGHLIGHT_SUFFIX}>{language === "sv" ? "/mån" : "/mo"}</span>
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
  const quoteValue = offer.quoteRequired
    ? (language === "sv" ? "Pris efter offert" : "Price after quote")
    : formatCurrency(offer.monthlyPremium ?? 0, currency);
  const yearlyValue = offer.quoteRequired
    ? (language === "sv" ? "Registreringsnummer krävs" : "Registration number required")
    : `${formatCurrency(offer.yearlyPremium ?? 0, currency)}${language === "sv" ? "/år" : "/year"}`;
  const ctaClasses = isTop
    ? "inline-flex min-h-11 w-full items-center justify-center rounded-md bg-indigo-600 text-white text-xs font-bold px-3 py-2 shadow-sm ring-2 ring-indigo-200 hover:bg-indigo-500 hover:shadow-md transition-all sm:min-h-0 sm:w-auto sm:py-1.5 dark:bg-indigo-500 dark:ring-indigo-300/30 dark:hover:bg-indigo-400"
    : "inline-flex min-h-11 w-full items-center justify-center rounded-md bg-slate-900 text-white text-xs font-bold px-3 py-2 shadow-sm hover:bg-slate-800 hover:shadow-md transition-all sm:min-h-0 sm:w-auto sm:py-1.5 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700";
  const sourceDetails = [offer.availability, offer.notes].filter(Boolean).join(" ");

  return (
    <article
      className={[OFFER_CARD_BASE, isTop ? OFFER_CARD_TOP : OFFER_CARD_DEFAULT].join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2.5 min-w-0">
          <ProviderAvatar
            providerName={offer.providerName}
            providerMeta={{
              logoText: "",
              logoSrc: offer.logoSrc,
              accentColor: offer.accentColor,
              isPartner: false,
              isSponsored: false,
            }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground">{offer.providerName}</p>
              {sourceDetails && (
                <>
                  <span className={VERIFIED_PILL}>
                    {language === "sv" ? "Verifierad" : "Verified"}
                  </span>
                  <HelpHint
                    label={`${offer.providerName} ${language === "sv" ? "källinfo" : "source info"}`}
                    content={sourceDetails}
                  />
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          {isTop && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950">
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

      <div className={HIGHLIGHT_PANEL}>
        <div className="flex items-start justify-between gap-1.5">
          <p className={HIGHLIGHT_LABEL}>{tx(language, monthlyHeadline)}</p>
          <p className="text-[11px] font-semibold text-emerald-700 whitespace-nowrap dark:text-emerald-200">
            {yearlyValue}
          </p>
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <p className={HIGHLIGHT_VALUE}>
            {quoteValue}
            {!offer.quoteRequired && (
              <span className={HIGHLIGHT_SUFFIX}>{language === "sv" ? "/mån" : "/mo"}</span>
            )}
          </p>
          <a href={offer.ctaUrl} className={ctaClasses}>
            {offer.ctaLabel}
          </a>
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
          <HelpHint
            label={`${tx(language, "Mer information om")} ${label}`}
            content={helpText}
          />
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

function HelpHint({
  label,
  content,
  side = "top",
}: {
  label: string;
  content: string;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <UiTooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background text-[10px] font-semibold text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground dark:border-white/10 dark:bg-slate-950/82 dark:text-slate-400 dark:hover:border-white/25 dark:hover:text-slate-100"
          aria-label={label}
        >
          ?
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-[min(18rem,calc(100vw-1rem))] text-[11px] leading-relaxed whitespace-pre-line break-words">
        {content}
      </TooltipContent>
    </UiTooltip>
  );
}

function getRateTypeLabel(rate: LoanBenchmarkRate, language: Language): string {
  switch (rate.rateType) {
    case "fixed":
      return language === "sv" ? "Fast" : "Fixed";
    case "range":
      return language === "sv" ? "Individuell / spann" : "Individual / range";
    case "campaign":
      return language === "sv" ? "Kampanj" : "Campaign";
    case "policy":
      return language === "sv" ? "Styrränta" : "Policy rate";
    case "variable":
    default:
      return language === "sv" ? "Rörlig" : "Variable";
  }
}

function getRateBehaviorHint(rate: LoanBenchmarkRate, language: Language): string {
  switch (rate.rateType) {
    case "fixed":
      return language === "sv"
        ? `${rate.providerName} visas som fast ränta i den verifierade publikationen. Den ändras normalt inte under den publicerade avtalsperioden, men ett nytt erbjudande kan ha andra villkor.`
        : `${rate.providerName} is shown as a fixed rate in the verified publication. It normally does not change during the published contract period, but a new offer may use different terms.`;
    case "range":
      return language === "sv"
        ? `${rate.providerName} publicerar ett spann i stället för en enda ränta. Din faktiska ränta sätts individuellt inom spannet och är normalt rörlig efter utbetalning.`
        : `${rate.providerName} publishes a range instead of a single rate. Your actual rate is set individually within that range and is normally variable after payout.`;
    case "campaign":
      return language === "sv"
        ? `${rate.providerName} visas som en kampanj för ett specifikt upplägg. Ändrar du löptid, kontantinsats eller restvärde kan du hamna utanför kampanjvillkoren.`
        : `${rate.providerName} is shown as a campaign for a specific setup. If you change term, down payment, or balloon value you may move outside the campaign conditions.`;
    case "variable":
    default:
      return language === "sv"
        ? `${rate.providerName} publicerar räntan som rörlig. Banken kan alltså höja eller sänka den över tid även om lånebeloppet är oförändrat.`
        : `${rate.providerName} publishes the rate as variable. The bank can therefore raise or lower it over time even if the loan amount stays the same.`;
  }
}

function getTermBehaviorHint(rate: LoanBenchmarkRate, language: Language): string {
  if (rate.fixedTermMonths) {
    return language === "sv"
      ? `Den verifierade publiceringen bygger på ${rate.fixedTermMonths} månader. I appen räknas månadskostnaden om när du flyttar löptiden, men det betyder inte att banken automatiskt erbjuder samma kampanjränta för en annan löptid.`
      : `The verified publication is based on ${rate.fixedTermMonths} months. In the app the monthly cost is recalculated when you move the term, but that does not mean the lender automatically offers the same campaign rate for a different term.`;
  }

  return language === "sv"
    ? `I appen ändrar löptidsreglaget främst månadsbetalning och total kostnad. Den lagrade referensräntan hålls oförändrad här. I verkligheten kan banken fortfarande sätta individuell ränta beroende på kreditprofil, produkt och ibland återbetalningstid.`
    : `In the app the term slider mainly changes monthly payment and total cost. The stored benchmark rate stays unchanged here. In reality the lender can still set an individual rate depending on credit profile, product, and sometimes repayment length.`;
}

function getOfferFieldHelp(label: string, language: Language): string | undefined {
  const helpSv: Record<string, string> = {
    Kontantinsats: "Belopp som betalas vid avtalets start.",
    Uppläggningsavgift: "Engångsavgift som långivaren tar ut när lånet läggs upp.",
    Månadsavgift: "Administrativ avgift som debiteras varje månad utöver räntan.",
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
    "Setup fee": "One-time lender fee charged when the loan is created.",
    "Monthly fee": "Administrative fee charged each month in addition to interest.",
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
  if (!badge) return "bg-secondary text-muted-foreground border border-border/50 dark:bg-white/5 dark:text-slate-300 dark:border-white/10";
  return BADGE_TONE_CLASSES[badge] ?? "bg-secondary text-muted-foreground border border-border/50 dark:bg-white/5 dark:text-slate-300 dark:border-white/10";
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

  if (isNew) return "bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-500/15 dark:text-sky-100 dark:border-sky-400/25";
  if (isUsed) return "bg-stone-100 text-stone-800 border border-stone-200 dark:bg-stone-500/15 dark:text-stone-100 dark:border-stone-300/20";
  if (isPrivate) return "bg-cyan-100 text-cyan-800 border border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-100 dark:border-cyan-400/25";
  if (isBusiness) return "bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-500/15 dark:text-slate-100 dark:border-slate-300/20";

  return language === "sv"
    ? "bg-secondary text-foreground border border-border/60 dark:bg-white/5 dark:text-slate-100 dark:border-white/10"
    : "bg-secondary text-foreground border border-border/60 dark:bg-white/5 dark:text-slate-100 dark:border-white/10";
}

function isPartnerBadge(badge?: string): boolean {
  return badge === "Partnererbjudande" || badge === "Partner offer";
}

function getDisplayBadgeLabel(badge: string, language: Language): string {
  if (badge === "Låg kontantinsats") return language === "sv" ? "Låg startkostnad" : "Low start cost";
  if (badge === "Low upfront cost") return language === "sv" ? "Låg startkostnad" : "Low start cost";
  return badge;
}

function getCommercialSourceLabel(offer: CommercialOfferBase, language: Language): string {
  if (offer.offerType === "bank_loan") {
    return language === "sv" ? "Källstödd benchmark" : "Source-backed benchmark";
  }

  if (offer.offerType === "dealer_financing" || offer.offerType === "balloon_financing") {
    return language === "sv" ? "Lagrad kampanj" : "Stored campaign";
  }

  if (offer.offerType === "private_leasing") {
    return language === "sv" ? "Lagrad verifierad offert" : "Stored verified offer";
  }

  return language === "sv" ? "Lagrad källa" : "Stored source";
}

function getRetailerSourceLabel(offer: RetailerOffer, language: Language): string {
  if (offer.linkKind === "dealer_direct") {
    return language === "sv" ? "Handlarsida" : "Dealer page";
  }

  if (offer.linkKind === "marketplace_listing") {
    return language === "sv" ? "Marknadsannons" : "Marketplace listing";
  }

  return language === "sv" ? "Marknadssokning" : "Marketplace search";
}
