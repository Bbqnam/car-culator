import { useMemo, useState, type ReactNode } from "react";
import { CarResult, Currency, formatCurrency } from "@/lib/car-types";
import {
  buildCommercialTrialData,
  CommercialOfferBase,
  FinancingOffer,
  LeasingOffer,
  RetailerOffer,
  SortMode,
} from "@/lib/commercial-trial";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface CommercialTrialSectionProps {
  winner: CarResult;
  currency: Currency;
}

type OfferView = "financing" | "leasing" | "retailer";

export function CommercialTrialSection({ winner, currency }: CommercialTrialSectionProps) {
  const { t, language } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [offerView, setOfferView] = useState<OfferView>("financing");
  const [sortMode, setSortMode] = useState<SortMode>("best");

  const sortOptions: { key: SortMode; label: string }[] = [
    { key: "best", label: t({ en: "Best offer first", sv: "Bästa erbjudande först" }) },
    { key: "lowest-monthly", label: t({ en: "Lowest monthly cost", sv: "Lägst månadskostnad" }) },
    { key: "lowest-total", label: t({ en: "Lowest total cost", sv: "Lägst totalkostnad" }) },
    { key: "lowest-upfront", label: t({ en: "Lowest upfront cost", sv: "Lägst kontantinsats" }) },
    { key: "fastest-approval", label: t({ en: "Fastest approval", sv: "Snabbast godkännande" }) },
  ];

  const offerTypeLabel: Record<string, string> = {
    bank_loan: t({ en: "Bank loan", sv: "Banklån" }),
    dealer_financing: t({ en: "Dealer financing", sv: "Återförsäljarfinansiering" }),
    private_leasing: t({ en: "Private leasing", sv: "Privatleasing" }),
    balloon_financing: t({ en: "Balloon financing", sv: "Ballongfinansiering" }),
    retailer_listing: t({ en: "Dealer listing", sv: "Återförsäljarannons" }),
  };

  const trialData = useMemo(() => buildCommercialTrialData(winner, language), [winner, language]);

  const sortedFinancing = useMemo(
    () => trialData.sortOffers(trialData.financingOffers, sortMode),
    [sortMode, trialData]
  );
  const sortedLeasing = useMemo(
    () => trialData.sortOffers(trialData.leasingOffers, sortMode),
    [sortMode, trialData]
  );
  const sortedRetailer = useMemo(
    () => trialData.sortRetailerOffers(trialData.retailerOffers, sortMode),
    [sortMode, trialData]
  );

  return (
    <section className="rounded-2xl border border-border/60 bg-background/80 p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
            {t({ en: "Financing & offers", sv: "Finansiering & erbjudanden" })}
          </p>
          <h3 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
            {t({ en: "Commercial trial mode", sv: "Kommersiellt testläge" })}
          </h3>
          <p className="text-xs text-muted-foreground max-w-[620px]">
            {t({
              en: "Concept preview focused on loans, leasing, and dealer offers. No live pricing or real-time partner API connections are used in this prototype.",
              sv: "Konceptförhandsvisning med fokus på lån, leasing och återförsäljarerbjudanden. Inga livepriser eller realtidskopplingar mot partner-API:er används i den här prototypen.",
            })}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className="bg-foreground/90 text-background border-transparent">
            {t({ en: "Prototype", sv: "Prototyp" })}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {t({ en: "Simulated partner data", sv: "Simulerad partnerdata" })}
          </Badge>
          <Button
            size="sm"
            variant={isExpanded ? "secondary" : "outline"}
            className="h-8"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            {isExpanded
              ? t({ en: "Hide offer details", sv: "Dölj erbjudandedetaljer" })
              : t({ en: "Show offer details", sv: "Visa erbjudandedetaljer" })}
          </Button>
        </div>
      </div>

      {!isExpanded && (
        <div className="rounded-xl border border-border/60 bg-card px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <p className="text-xs text-muted-foreground">
            {t({ en: "Best financing:", sv: "Bästa finansiering:" })}{" "}
            <span className="font-semibold text-foreground">
              {trialData.bestFinancing.providerName}
            </span>{" "}
            ({formatCurrency(trialData.bestFinancing.monthlyCost, currency)}{language === "sv" ? "/mån" : "/mo"})
          </p>
          <p className="text-xs text-muted-foreground">
            {t({ en: "Best dealer:", sv: "Bästa återförsäljare:" })}{" "}
            <span className="font-semibold text-foreground">
              {trialData.bestRetailer.providerName}
            </span>{" "}
            ({trialData.bestRetailer.availability})
          </p>
        </div>
      )}

      {isExpanded && (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
            <BestFinancingCard offer={trialData.bestFinancing} currency={currency} offerTypeLabel={offerTypeLabel} />
            <BestRetailerCard offer={trialData.bestRetailer} currency={currency} />
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-foreground">
                {t({ en: "Recommendation layer", sv: "Smart rekommendationslager" })}
              </h4>
              <Badge variant="secondary" className="text-[10px]">
                {t({ en: "Decision support", sv: "Beslutsstöd" })}
              </Badge>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {trialData.recommendations.map((reason) => (
                <div key={reason.id} className="rounded-lg border border-border/55 bg-background/70 p-3">
                  <p className="text-xs font-semibold text-foreground">{reason.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{reason.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/75">
            <div className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  {t({ en: "All offers", sv: "Alla erbjudanden" })}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {t({
                    en: "Expand to compare financing, leasing, and dealer options.",
                    sv: "Expandera för att jämföra finansiering, leasing och återförsäljaralternativ.",
                  })}
                </p>
              </div>

              <Button
                variant={showAllOffers ? "secondary" : "default"}
                size="sm"
                onClick={() => setShowAllOffers((prev) => !prev)}
                className="h-8"
              >
                {showAllOffers
                  ? t({ en: "Hide all offers", sv: "Dölj alla erbjudanden" })
                  : t({ en: "Compare all offers", sv: "Jämför alla erbjudanden" })}
              </Button>
            </div>

            {showAllOffers && (
              <div className="border-t border-border/60 p-3.5 sm:p-4 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="inline-flex rounded-lg bg-secondary/70 p-0.5">
                    {([
                      { key: "financing" as OfferView, label: t({ en: "Financing", sv: "Finansiering" }) },
                      { key: "leasing" as OfferView, label: t({ en: "Leasing", sv: "Leasing" }) },
                      { key: "retailer" as OfferView, label: t({ en: "Dealers", sv: "Återförsäljare" }) },
                    ]).map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setOfferView(item.key)}
                        className={cn(
                          "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors",
                          offerView === item.key
                            ? "bg-card text-foreground shadow-sm border border-border/40"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <label className="text-xs text-muted-foreground flex items-center gap-2">
                    {t({ en: "Sort by", sv: "Sortera efter" })}
                    <select
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value as SortMode)}
                      className="h-8 rounded-md border border-border/70 bg-background px-2 text-xs text-foreground"
                    >
                      {sortOptions.map((opt) => (
                        <option key={opt.key} value={opt.key}>{opt.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {offerView === "financing" && (
                  <OfferList
                    offers={sortedFinancing}
                    currency={currency}
                    renderExtra={(offer) => (
                      <>
                        <MiniField label={t({ en: "Rate", sv: "Ränta" })} value={`${offer.apr.toFixed(1)}% APR`} />
                        <MiniField label={t({ en: "Term", sv: "Löptid" })} value={`${offer.durationMonths} ${t({ en: "months", sv: "månader" })}`} />
                        <MiniField
                          label={t({ en: "Residual value / balloon", sv: "Restvärde / restskuld" })}
                          value={offer.residualValue ? formatCurrency(offer.residualValue, currency) : t({ en: "None", sv: "Ingen" })}
                        />
                      </>
                    )}
                  />
                )}

                {offerView === "leasing" && (
                  <LeasingList offers={sortedLeasing} currency={currency} />
                )}

                {offerView === "retailer" && (
                  <RetailerList offers={sortedRetailer} currency={currency} />
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-foreground">
                {t({ en: "Upcoming integrations", sv: "Kommande integrationer" })}
              </h4>
              <Badge variant="outline" className="text-[10px]">
                {t({ en: "Investor demo", sv: "Investerardemo" })}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t({
                en: "This layer is designed to connect to partner feeds for banks, leasing providers, and dealers, as well as insurance pricing, credit scoring, and marketplace inventory.",
                sv: "Lagret är utformat för att kunna kopplas till partnerflöden för banker, leasingbolag och återförsäljare, försäkringsprissättning, kreditbedömning och fordonsmarknadsplatsers lagerdata.",
              })}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                t({ en: "Banks", sv: "Banker" }),
                t({ en: "Leasing providers", sv: "Leasingbolag" }),
                t({ en: "Dealers", sv: "Återförsäljare" }),
                t({ en: "Insurance partners", sv: "Försäkringspartners" }),
                t({ en: "Credit scoring", sv: "Kreditbedömning" }),
                t({ en: "Vehicle marketplaces", sv: "Fordonsmarknadsplatser" }),
              ].map((item) => (
                <span key={item} className="text-[10px] font-medium px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function BestFinancingCard({
  offer,
  currency,
  offerTypeLabel,
}: {
  offer: FinancingOffer;
  currency: Currency;
  offerTypeLabel: Record<string, string>;
}) {
  const { t } = useI18n();
  return (
    <article className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <ProviderMark name={offer.providerName} />
          <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
            {t({ en: "Top financing match", sv: "Bästa finansieringsmatchning" })}
          </p>
          <h4 className="text-sm font-semibold text-foreground mt-1">{offer.providerName}</h4>
          <p className="text-[11px] text-muted-foreground">{offerTypeLabel[offer.offerType]}</p>
          </div>
        </div>
        <OfferBadgeGroup badge={offer.badge} sponsored={offer.isSponsored} />
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <MiniField label={t({ en: "Monthly cost", sv: "Månadskostnad" })} value={formatCurrency(offer.monthlyCost, currency)} strong />
        <MiniField label={t({ en: "Upfront payment", sv: "Kontantinsats" })} value={formatCurrency(offer.upfrontCost, currency)} />
        <MiniField label={t({ en: "Rate", sv: "Ränta" })} value={`${offer.apr.toFixed(1)}% APR`} />
        <MiniField label={t({ en: "Contract term", sv: "Avtalstid" })} value={`${offer.durationMonths} ${t({ en: "months", sv: "månader" })}`} />
        <MiniField label={t({ en: "Estimated total cost", sv: "Beräknad totalkostnad" })} value={formatCurrency(offer.totalCost, currency)} />
        <MiniField label={t({ en: "Approval speed", sv: "Godkännandetid" })} value={offer.approvalSpeed} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">{offer.availability}</p>
        <Button size="sm" className="h-8" asChild>
          <a href={offer.ctaUrl}>{offer.ctaLabel}</a>
        </Button>
      </div>
    </article>
  );
}

function BestRetailerCard({ offer, currency }: { offer: RetailerOffer; currency: Currency }) {
  const { t } = useI18n();
  return (
    <article className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <ProviderMark name={offer.providerName} />
          <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
            {t({ en: "Top dealer option", sv: "Bästa återförsäljaralternativ" })}
          </p>
          <h4 className="text-sm font-semibold text-foreground mt-1">{offer.providerName}</h4>
          <p className="text-[11px] text-muted-foreground">{offer.condition} - {offer.dealerLocation}</p>
          </div>
        </div>
        <OfferBadgeGroup badge={offer.badge} sponsored={offer.isSponsored} />
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <MiniField label={t({ en: "Estimated monthly cost", sv: "Beräknad månadskostnad" })} value={formatCurrency(offer.monthlyCost, currency)} strong />
        <MiniField label={t({ en: "Upfront payment", sv: "Kontantinsats" })} value={formatCurrency(offer.upfrontCost, currency)} />
        <MiniField label={t({ en: "Delivery", sv: "Leverans" })} value={offer.deliveryEstimate} />
        <MiniField label={t({ en: "Availability", sv: "Tillgänglighet" })} value={offer.availability} />
        <MiniField label={t({ en: "Warranty", sv: "Garanti" })} value={offer.warrantyInfo} />
        <MiniField label={t({ en: "Approval", sv: "Godkännande" })} value={offer.approvalSpeed} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          {t({ en: "Test area for dealer leads and referrals", sv: "Testyta för återförsäljarleads och hänvisningar" })}
        </p>
        <Button size="sm" variant="outline" className="h-8" asChild>
          <a href={offer.ctaUrl}>{offer.ctaLabel}</a>
        </Button>
      </div>
    </article>
  );
}

function OfferList({
  offers,
  currency,
  renderExtra,
}: {
  offers: CommercialOfferBase[];
  currency: Currency;
  renderExtra?: (offer: CommercialOfferBase) => ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      {offers.map((offer, index) => (
        <article
          key={offer.id}
          className={cn(
            "rounded-lg border bg-background p-3.5 space-y-2",
            index === 0 ? "border-highlight/35 ring-1 ring-highlight/20" : "border-border/60"
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <ProviderMark name={offer.providerName} small />
              <div>
                <p className="text-xs font-semibold text-foreground">{offer.providerName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {offer.offerType === "bank_loan" && t({ en: "Bank loan", sv: "Banklån" })}
                  {offer.offerType === "dealer_financing" && t({ en: "Dealer financing", sv: "Återförsäljarfinansiering" })}
                  {offer.offerType === "private_leasing" && t({ en: "Private leasing", sv: "Privatleasing" })}
                  {offer.offerType === "balloon_financing" && t({ en: "Balloon financing", sv: "Ballongfinansiering" })}
                  {offer.offerType === "retailer_listing" && t({ en: "Dealer listing", sv: "Återförsäljarannons" })}
                </p>
              </div>
            </div>
            <OfferBadgeGroup badge={offer.badge} sponsored={offer.isSponsored} compact />
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <MiniField label={t({ en: "Monthly", sv: "Månad" })} value={formatCurrency(offer.monthlyCost, currency)} strong />
            <MiniField label={t({ en: "Upfront", sv: "Kontantinsats" })} value={formatCurrency(offer.upfrontCost, currency)} />
            <MiniField label={t({ en: "Total", sv: "Totalt" })} value={formatCurrency(offer.totalCost, currency)} />
            <MiniField label={t({ en: "Approval", sv: "Godkännande" })} value={offer.approvalSpeed} />
            {renderExtra?.(offer)}
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">{offer.availability}</p>
            <Button size="sm" variant={index === 0 ? "default" : "outline"} className="h-8" asChild>
              <a href={offer.ctaUrl}>{offer.ctaLabel}</a>
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function LeasingList({ offers, currency }: { offers: LeasingOffer[]; currency: Currency }) {
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      {offers.map((offer, index) => (
        <article
          key={offer.id}
          className={cn(
            "rounded-lg border bg-background p-3.5 space-y-2",
            index === 0 ? "border-highlight/35 ring-1 ring-highlight/20" : "border-border/60"
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <ProviderMark name={offer.providerName} small />
              <div>
                <p className="text-xs font-semibold text-foreground">{offer.providerName}</p>
                <p className="text-[11px] text-muted-foreground">{t({ en: "Private leasing", sv: "Privatleasing" })}</p>
              </div>
            </div>
            <OfferBadgeGroup badge={offer.badge} sponsored={offer.isSponsored} compact />
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <MiniField label={t({ en: "Monthly fee", sv: "Månadsavgift" })} value={formatCurrency(offer.monthlyCost, currency)} strong />
            <MiniField label={t({ en: "Initial payment", sv: "Första betalning" })} value={formatCurrency(offer.initialPayment, currency)} />
            <MiniField label={t({ en: "Contract", sv: "Avtal" })} value={`${offer.durationMonths} ${t({ en: "months", sv: "månader" })}`} />
            <MiniField label={t({ en: "Annual mileage", sv: "Årlig körsträcka" })} value={`${offer.annualMileage.toLocaleString("sv-SE")} km`} />
            <MiniField label={t({ en: "Excess mileage", sv: "Övermil" })} value={`${formatCurrency(offer.excessMileageCost, currency)}/km`} />
            <MiniField label={t({ en: "Included services", sv: "Inkluderade tjänster" })} value={offer.includedServices.join(", ")} />
            <MiniField label={t({ en: "Wear and tear", sv: "Slitage" })} value={offer.wearAndTearNote} />
            <MiniField label={t({ en: "At contract end", sv: "Vid avtalsslut" })} value={offer.endOfContractCondition} />
            <MiniField label={t({ en: "Estimated total cost", sv: "Beräknad totalkostnad" })} value={formatCurrency(offer.totalCost, currency)} />
            <MiniField label={t({ en: "Approval", sv: "Godkännande" })} value={offer.approvalSpeed} />
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">{offer.availability}</p>
            <Button size="sm" variant={index === 0 ? "default" : "outline"} className="h-8" asChild>
              <a href={offer.ctaUrl}>{offer.ctaLabel}</a>
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function RetailerList({ offers, currency }: { offers: RetailerOffer[]; currency: Currency }) {
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      {offers.map((offer, index) => (
        <article
          key={offer.id}
          className={cn(
            "rounded-lg border bg-background p-3.5 space-y-2",
            index === 0 ? "border-highlight/35 ring-1 ring-highlight/20" : "border-border/60"
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <ProviderMark name={offer.providerName} small />
              <div>
                <p className="text-xs font-semibold text-foreground">{offer.providerName}</p>
                <p className="text-[11px] text-muted-foreground">{offer.condition} - {offer.dealerLocation}</p>
              </div>
            </div>
            <OfferBadgeGroup badge={offer.badge} sponsored={offer.isSponsored} compact />
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <MiniField label={t({ en: "Delivery", sv: "Leverans" })} value={offer.deliveryEstimate} />
            <MiniField label={t({ en: "Availability", sv: "Tillgänglighet" })} value={offer.availability} />
            <MiniField label={t({ en: "Warranty", sv: "Garanti" })} value={offer.warrantyInfo} />
            <MiniField label={t({ en: "Monthly", sv: "Månad" })} value={formatCurrency(offer.monthlyCost, currency)} strong />
            <MiniField label={t({ en: "Upfront", sv: "Kontantinsats" })} value={formatCurrency(offer.upfrontCost, currency)} />
            <MiniField label={t({ en: "Total", sv: "Totalt" })} value={formatCurrency(offer.totalCost, currency)} />
            <MiniField label="APR" value={`${offer.apr.toFixed(1)}%`} />
            <MiniField label={t({ en: "Term", sv: "Löptid" })} value={`${offer.durationMonths} ${t({ en: "months", sv: "månader" })}`} />
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">
              {t({ en: "Test area for lead generation and referrals", sv: "Testyta för leadgenerering och hänvisningar" })}
            </p>
            <Button size="sm" variant={index === 0 ? "default" : "outline"} className="h-8" asChild>
              <a href={offer.ctaUrl}>{offer.ctaLabel}</a>
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function MiniField({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="space-y-0.5 min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{label}</p>
      <p className={cn("text-xs leading-tight text-foreground break-words", strong && "font-semibold")}>{value}</p>
    </div>
  );
}

function OfferBadgeGroup({
  badge,
  sponsored,
  compact = false,
}: {
  badge?: string;
  sponsored: boolean;
  compact?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {badge && (
        <span className={cn(
          "rounded-full border border-highlight/30 bg-highlight/10 text-highlight text-[10px] font-semibold",
          compact ? "px-2 py-0.5" : "px-2.5 py-1"
        )}>
          {badge}
        </span>
      )}
      {sponsored && (
        <span className={cn(
          "rounded-full border border-border/70 bg-secondary text-muted-foreground text-[10px] font-medium",
          compact ? "px-2 py-0.5" : "px-2.5 py-1"
        )}>
          {t({ en: "Sponsored", sv: "Sponsrad" })}
        </span>
      )}
    </div>
  );
}

function ProviderMark({ name, small = false }: { name: string; small?: boolean }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-border/70 bg-secondary text-muted-foreground font-semibold",
        small ? "h-6 w-6 text-[9px]" : "h-8 w-8 text-[10px]"
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
