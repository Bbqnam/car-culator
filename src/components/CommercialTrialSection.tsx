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

interface CommercialTrialSectionProps {
  winner: CarResult;
  currency: Currency;
}

type OfferView = "financing" | "leasing" | "retailer";

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: "best", label: "Best offer first" },
  { key: "lowest-monthly", label: "Lowest monthly cost" },
  { key: "lowest-total", label: "Lowest total cost" },
  { key: "lowest-upfront", label: "Lowest upfront cost" },
  { key: "fastest-approval", label: "Fastest approval" },
];

const OFFER_TYPE_LABEL: Record<string, string> = {
  bank_loan: "Bank loan",
  dealer_financing: "Dealer financing",
  private_leasing: "Private leasing",
  balloon_financing: "Balloon financing",
  retailer_listing: "Retailer listing",
};

export function CommercialTrialSection({ winner, currency }: CommercialTrialSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [offerView, setOfferView] = useState<OfferView>("financing");
  const [sortMode, setSortMode] = useState<SortMode>("best");

  const trialData = useMemo(() => buildCommercialTrialData(winner), [winner]);

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
            Financing & deals
          </p>
          <h3 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
            Commercialization trial mode
          </h3>
          <p className="text-xs text-muted-foreground max-w-[620px]">
            Concept preview with realistic mock offers from future bank, leasing, and retailer integrations.
            No live pricing or real-time partner APIs are used in this prototype.
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className="bg-foreground/90 text-background border-transparent">Prototype</Badge>
          <Badge variant="secondary" className="text-[10px]">Mock partner data</Badge>
          <Button
            size="sm"
            variant={isExpanded ? "secondary" : "outline"}
            className="h-8"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            {isExpanded ? "Hide details" : "Show financing details"}
          </Button>
        </div>
      </div>

      {!isExpanded && (
        <div className="rounded-xl border border-border/60 bg-card px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <p className="text-xs text-muted-foreground">
            Best financing:{" "}
            <span className="font-semibold text-foreground">
              {trialData.bestFinancing.providerName}
            </span>{" "}
            ({formatCurrency(trialData.bestFinancing.monthlyCost, currency)}/mo)
          </p>
          <p className="text-xs text-muted-foreground">
            Best retailer:{" "}
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
            <BestFinancingCard offer={trialData.bestFinancing} currency={currency} />
            <BestRetailerCard offer={trialData.bestRetailer} currency={currency} />
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-foreground">Smart recommendation layer</h4>
              <Badge variant="secondary" className="text-[10px]">Decision support</Badge>
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
                <h4 className="text-sm font-semibold text-foreground">All offers</h4>
                <p className="text-[11px] text-muted-foreground">
                  Expand to compare financing, leasing, and retailer options.
                </p>
              </div>

              <Button
                variant={showAllOffers ? "secondary" : "default"}
                size="sm"
                onClick={() => setShowAllOffers((prev) => !prev)}
                className="h-8"
              >
                {showAllOffers ? "Hide all offers" : "Compare all offers"}
              </Button>
            </div>

            {showAllOffers && (
              <div className="border-t border-border/60 p-3.5 sm:p-4 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="inline-flex rounded-lg bg-secondary/70 p-0.5">
                    {([
                      { key: "financing" as OfferView, label: "Financing" },
                      { key: "leasing" as OfferView, label: "Leasing" },
                      { key: "retailer" as OfferView, label: "Retailers" },
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
                    Sort by
                    <select
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value as SortMode)}
                      className="h-8 rounded-md border border-border/70 bg-background px-2 text-xs text-foreground"
                    >
                      {SORT_OPTIONS.map((opt) => (
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
                        <MiniField label="Interest" value={`${offer.apr.toFixed(1)}% APR`} />
                        <MiniField label="Term" value={`${offer.durationMonths} months`} />
                        <MiniField
                          label="Residual / balloon"
                          value={offer.residualValue ? formatCurrency(offer.residualValue, currency) : "None"}
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
              <h4 className="text-sm font-semibold text-foreground">Future integrations</h4>
              <Badge variant="outline" className="text-[10px]">Investor demo</Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This layer is designed to connect with partner feeds for banks, leasing providers, retailers,
              insurance quoting, credit assessment, and vehicle marketplace inventory.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Banks",
                "Leasing companies",
                "Dealers",
                "Insurance partners",
                "Credit assessment",
                "Vehicle marketplaces",
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

function BestFinancingCard({ offer, currency }: { offer: FinancingOffer; currency: Currency }) {
  return (
    <article className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <ProviderMark name={offer.providerName} />
          <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
            Best financing match
          </p>
          <h4 className="text-sm font-semibold text-foreground mt-1">{offer.providerName}</h4>
          <p className="text-[11px] text-muted-foreground">{OFFER_TYPE_LABEL[offer.offerType]}</p>
          </div>
        </div>
        <OfferBadgeGroup badge={offer.badge} sponsored={offer.isSponsored} />
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <MiniField label="Monthly cost" value={formatCurrency(offer.monthlyCost, currency)} strong />
        <MiniField label="Down payment" value={formatCurrency(offer.upfrontCost, currency)} />
        <MiniField label="Interest" value={`${offer.apr.toFixed(1)}% APR`} />
        <MiniField label="Contract term" value={`${offer.durationMonths} months`} />
        <MiniField label="Total estimate" value={formatCurrency(offer.totalCost, currency)} />
        <MiniField label="Approval speed" value={offer.approvalSpeed} />
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
  return (
    <article className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <ProviderMark name={offer.providerName} />
          <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
            Best retailer option
          </p>
          <h4 className="text-sm font-semibold text-foreground mt-1">{offer.providerName}</h4>
          <p className="text-[11px] text-muted-foreground">{offer.condition} - {offer.dealerLocation}</p>
          </div>
        </div>
        <OfferBadgeGroup badge={offer.badge} sponsored={offer.isSponsored} />
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <MiniField label="Monthly estimate" value={formatCurrency(offer.monthlyCost, currency)} strong />
        <MiniField label="Upfront" value={formatCurrency(offer.upfrontCost, currency)} />
        <MiniField label="Delivery" value={offer.deliveryEstimate} />
        <MiniField label="Availability" value={offer.availability} />
        <MiniField label="Warranty" value={offer.warrantyInfo} />
        <MiniField label="Approval" value={offer.approvalSpeed} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">Retailer lead / referral trial</p>
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
                <p className="text-[11px] text-muted-foreground">{OFFER_TYPE_LABEL[offer.offerType]}</p>
              </div>
            </div>
            <OfferBadgeGroup badge={offer.badge} sponsored={offer.isSponsored} compact />
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <MiniField label="Monthly" value={formatCurrency(offer.monthlyCost, currency)} strong />
            <MiniField label="Upfront" value={formatCurrency(offer.upfrontCost, currency)} />
            <MiniField label="Total" value={formatCurrency(offer.totalCost, currency)} />
            <MiniField label="Approval" value={offer.approvalSpeed} />
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
                <p className="text-[11px] text-muted-foreground">Private leasing</p>
              </div>
            </div>
            <OfferBadgeGroup badge={offer.badge} sponsored={offer.isSponsored} compact />
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <MiniField label="Monthly fee" value={formatCurrency(offer.monthlyCost, currency)} strong />
            <MiniField label="Initial payment" value={formatCurrency(offer.initialPayment, currency)} />
            <MiniField label="Contract" value={`${offer.durationMonths} months`} />
            <MiniField label="Annual mileage" value={`${offer.annualMileage.toLocaleString("sv-SE")} km`} />
            <MiniField label="Excess mileage" value={`${formatCurrency(offer.excessMileageCost, currency)}/km`} />
            <MiniField label="Included services" value={offer.includedServices.join(", ")} />
            <MiniField label="Wear & tear" value={offer.wearAndTearNote} />
            <MiniField label="End of contract" value={offer.endOfContractCondition} />
            <MiniField label="Total estimate" value={formatCurrency(offer.totalCost, currency)} />
            <MiniField label="Approval" value={offer.approvalSpeed} />
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
            <MiniField label="Delivery" value={offer.deliveryEstimate} />
            <MiniField label="Availability" value={offer.availability} />
            <MiniField label="Warranty" value={offer.warrantyInfo} />
            <MiniField label="Monthly" value={formatCurrency(offer.monthlyCost, currency)} strong />
            <MiniField label="Upfront" value={formatCurrency(offer.upfrontCost, currency)} />
            <MiniField label="Total" value={formatCurrency(offer.totalCost, currency)} />
            <MiniField label="APR" value={`${offer.apr.toFixed(1)}%`} />
            <MiniField label="Term" value={`${offer.durationMonths} months`} />
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">Lead generation / referral placement</p>
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
          Sponsored
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
