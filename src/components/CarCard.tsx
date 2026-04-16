import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CarInput,
  FuelType,
  FinancingMode,
  FUEL_TYPE_ORDER,
  PriceSource,
  calculateResidualPercent,
} from "@/lib/car-types";
import {
  getBrands,
  getModels,
  findCarModel,
  getDefaultFuelPrice,
  estimatePurchasePrice,
  getDisplayModelName,
  inferFuelTypeFromText,
  inferAvailableFuelTypes,
} from "@/lib/car-database";
import { canonicalizeBrandName } from "@/lib/brand-logos";
import {
  fetchFuelEconomyMakes,
  FuelEconomyOption,
  fetchFuelEconomyModels,
  fetchFuelEconomyModelYears,
  fetchFuelEconomyOptions,
  fetchFuelEconomyVehicle,
} from "@/lib/fuel-economy-api";
import {
  EuEvModelCatalogEntry,
  EuEvVariant,
  EU_EV_SOURCE_URL,
  fetchEuEvBrands,
  fetchEuEvModels,
  fetchEuEvVariants,
} from "@/lib/eu-ev-api";
import { convertEurToSek } from "@/lib/currency-api";
import {
  formatRateLabel,
  getLeasingAvailability,
  getLoanBenchmarks,
  getPreferredLoanDefaults,
  getSuggestedLeaseDefaults,
} from "@/lib/financing-data";
import {
  fetchMarketPriceEstimate,
  shouldPreferMarketPriceEstimate,
} from "@/lib/market-price-api";
import { findVerifiedRetailerPrice } from "@/lib/commercial-trial";
import { findVerifiedOfficialPrice } from "@/lib/official-car-prices";
import { choosePreferredPriceCandidate, type PriceCandidate } from "@/lib/price-source";
import { estimateSwedishVehicleTax } from "@/lib/swedish-tax";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X, Car, Copy } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { FuelBadge } from "@/components/FuelBadge";
import { FinancingSelector } from "@/components/FinancingSelector";
import { NumericInput, ReadonlyField } from "@/components/NumericInput";
import { useI18n } from "@/lib/i18n";

interface CarCardProps {
  car: CarInput;
  index: number;
  canRemove: boolean;
  canDuplicate: boolean;
  onChange: (car: CarInput) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

const MIN_TAX_ESTIMATE_YEAR = 2006;
const MAX_MODEL_YEAR = new Date().getFullYear();
const EMPTY_LIVE_MODELS: string[] = [];
const EMPTY_LIVE_OPTIONS: FuelEconomyOption[] = [];
const EMPTY_EU_EV_VARIANTS: EuEvVariant[] = [];
const EMPTY_EU_EV_MODELS: EuEvModelCatalogEntry[] = [];

function normalizeLookupText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function toAutomaticPriceCandidate(
  priceSek: number,
  priceSource: PriceSource,
): PriceCandidate | null {
  if (priceSek <= 0 || priceSource === "manual" || priceSource === "missing") {
    return null;
  }

  return {
    priceSek,
    priceSource,
  };
}

function applyEstimatedTax(car: CarInput, co2Override?: number | null): CarInput {
  const estimate = estimateSwedishVehicleTax({
    fuelType: car.fuelType,
    fuelConsumption: car.fuelConsumption,
    modelYear: car.modelYear,
    co2GKm: co2Override ?? undefined,
  });

  return {
    ...car,
    taxCost: estimate.annualTaxSek,
    estimatedCo2GKm: estimate.estimatedCo2GKm,
    taxCostSource: "estimated",
  };
}

function getPriceSourceMeta(
  source: PriceSource,
  t: (text: { en: string; sv: string }) => string,
): { label: string; toneClass: string } {
  switch (source) {
    case "official_new":
      return {
        label: t({ en: "Official manufacturer price", sv: "Officiellt tillverkarpris" }),
        toneClass: "text-emerald-700",
      };
    case "retailer_listing":
      return {
        label: t({ en: "Retailer price", sv: "Pris från återförsäljare" }),
        toneClass: "text-indigo-700",
      };
    case "market_listings":
      return {
        label: t({ en: "Marketplace price", sv: "Pris från marknadsannonser" }),
        toneClass: "text-sky-700",
      };
    case "catalog_reference":
      return {
        label: t({ en: "Fallback reference price", sv: "Reservpris från referensdata" }),
        toneClass: "text-amber-700",
      };
    case "historical_average":
      return {
        label: t({ en: "Fallback historical / average price", sv: "Reservpris från historik / genomsnitt" }),
        toneClass: "text-muted-foreground",
      };
    case "manual":
      return {
        label: t({ en: "Manual price", sv: "Manuellt pris" }),
        toneClass: "text-foreground",
      };
    default:
      return {
        label: t({ en: "No price found yet", sv: "Inget pris hittat ännu" }),
        toneClass: "text-amber-700",
      };
  }
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </p>
      {children}
    </div>
  );
}

function FieldLabelWithHint({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-center gap-1.5 min-h-[16px]">
      <Label className="text-[11px] text-muted-foreground font-medium leading-tight">
        {label}
      </Label>
      {hint && (
        <TooltipProvider delayDuration={120}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border/70 text-[10px] font-bold leading-none text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                aria-label={`${label} help`}
              >
                ?
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[260px] text-[11px] leading-relaxed">
              {hint}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

function formatIsoDate(
  value: string | undefined,
  locale: string,
): string | null {
  if (!value) return null;

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsed);
}

export function CarCard({ car, index, canRemove, canDuplicate, onChange, onRemove, onDuplicate }: CarCardProps) {
  const { language, t } = useI18n();
  const formGridClass = "grid gap-2.5 grid-cols-1 md:grid-cols-2";
  const locale = language === "sv" ? "sv-SE" : "en-GB";
  const [lookupModel, setLookupModel] = useState("");
  const [lookupOptionId, setLookupOptionId] = useState("");
  const [lookupMessage, setLookupMessage] = useState("");
  const [isImportingOfficialData, setIsImportingOfficialData] = useState(false);
  const lastAutoImportKeyRef = useRef("");
  const lastOfficialPriceKeyRef = useRef("");
  const lastRetailerPriceKeyRef = useRef("");
  const lastEuModelPriceKeyRef = useRef("");
  const lastMarketPriceKeyRef = useRef("");
  const currentYear = new Date().getFullYear();
  const isCurrentGenerationModel = car.modelYear >= currentYear - 1;

  const localBrands = useMemo(() => getBrands(), []);
  const localModels = useMemo(() => (car.brand ? getModels(car.brand) : []), [car.brand]);
  const localModelMatch = useMemo(
    () => (car.brand && car.model ? findCarModel(car.brand, car.model) : undefined),
    [car.brand, car.model],
  );
  const estimatedTaxLabel = t({
    en: "Tax is estimated.",
    sv: "Skatt är uppskattad.",
  });
  const buildSuggestedLoanInputs = useCallback(
    (fuelType: FuelType, purchasePrice: number, currentLoan: CarInput["loan"]) => {
      const suggestion = getPreferredLoanDefaults(fuelType);
      return {
        ...currentLoan,
        interestRate: suggestion.interestRatePercent,
        loanTermMonths: suggestion.loanTermMonths,
        monthlyAdminFee: suggestion.monthlyAdminFee,
        downPayment: purchasePrice > 0
          ? Math.round((purchasePrice * suggestion.downPaymentPercent) / 100)
          : 0,
        residualBalloon: purchasePrice > 0
          ? Math.round((purchasePrice * suggestion.residualBalloonPercent) / 100)
          : 0,
      };
    },
    [],
  );
  const buildSuggestedLeasingInputs = useCallback(
    (
      brand: string,
      model: string,
      annualMileage: number,
      currentLeasing: CarInput["leasing"],
    ) => {
      const defaults = getSuggestedLeaseDefaults(brand, model);
      if (!defaults) {
        return {
          ...currentLeasing,
          monthlyLeaseCost: 0,
          downPayment: 0,
          leaseDurationMonths: currentLeasing.leaseDurationMonths || 36,
          includedMileage: currentLeasing.includedMileage || annualMileage || 15000,
          excessMileageCostPerKm: currentLeasing.excessMileageCostPerKm || 1.5,
          endOfTermFee: 0,
        };
      }

      return {
        ...currentLeasing,
        ...defaults,
      };
    },
    [],
  );

  const fuelEconomyBrandsQuery = useQuery({
    queryKey: ["fuel-economy-brands", car.modelYear],
    queryFn: () => fetchFuelEconomyMakes(car.modelYear),
    enabled: car.modelYear >= MIN_TAX_ESTIMATE_YEAR,
    staleTime: 5 * 60 * 1000,
  });

  const euEvBrandsQuery = useQuery({
    queryKey: ["eu-ev-brands", car.modelYear],
    queryFn: () => fetchEuEvBrands(car.modelYear),
    enabled: car.modelYear >= MIN_TAX_ESTIMATE_YEAR,
    staleTime: 30 * 60 * 1000,
  });

  const liveModelsQuery = useQuery({
    queryKey: ["fuel-economy-models", car.brand, car.modelYear],
    queryFn: () => fetchFuelEconomyModels(car.modelYear, car.brand),
    enabled: Boolean(car.brand) && car.modelYear >= MIN_TAX_ESTIMATE_YEAR,
    staleTime: 5 * 60 * 1000,
  });

  const euEvModelsQuery = useQuery({
    queryKey: ["eu-ev-models", car.brand, car.modelYear],
    queryFn: () => fetchEuEvModels(car.brand, car.modelYear),
    enabled: Boolean(car.brand) && car.modelYear >= MIN_TAX_ESTIMATE_YEAR,
    staleTime: 30 * 60 * 1000,
  });

  const fuelEconomyModelYearsQuery = useQuery({
    queryKey: ["fuel-economy-model-years", car.brand, car.model],
    queryFn: () => fetchFuelEconomyModelYears(car.brand, car.model, MIN_TAX_ESTIMATE_YEAR, MAX_MODEL_YEAR),
    enabled: Boolean(car.brand) && Boolean(car.model) && !localModelMatch,
    staleTime: 60 * 60 * 1000,
  });

  const euEvModelYearsQuery = useQuery({
    queryKey: ["eu-ev-model-years", car.brand, car.model],
    queryFn: () => fetchEuEvVariants(car.brand, car.model, MAX_MODEL_YEAR),
    enabled: Boolean(car.brand) && Boolean(car.model) && !localModelMatch,
    staleTime: 60 * 60 * 1000,
  });

  const liveOptionsQuery = useQuery({
    queryKey: ["fuel-economy-options", car.brand, car.modelYear, lookupModel],
    queryFn: () => fetchFuelEconomyOptions(car.modelYear, car.brand, lookupModel),
    enabled:
      car.isConfigured &&
      Boolean(car.brand) &&
      car.modelYear >= MIN_TAX_ESTIMATE_YEAR &&
      Boolean(lookupModel) &&
      liveModelsQuery.data !== undefined &&
      liveModelsQuery.data.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const euEvVariantsQuery = useQuery({
    queryKey: ["eu-ev-variants", car.brand, car.model, car.modelYear],
    queryFn: () => fetchEuEvVariants(car.brand, car.model, car.modelYear),
    enabled:
      car.isConfigured &&
      Boolean(car.brand) &&
      Boolean(car.model) &&
      car.modelYear >= MIN_TAX_ESTIMATE_YEAR &&
      car.fuelType === "electric",
    staleTime: 30 * 60 * 1000,
  });

  const marketPriceQuery = useQuery({
    queryKey: ["market-price", car.brand, car.model, car.modelYear],
    queryFn: () => fetchMarketPriceEstimate(car.brand, car.model, car.modelYear),
    enabled: car.isConfigured && Boolean(car.brand) && Boolean(car.model),
    staleTime: 15 * 60 * 1000,
    retry: false,
  });

  const liveModels = liveModelsQuery.data ?? EMPTY_LIVE_MODELS;
  const liveOptions = liveOptionsQuery.data ?? EMPTY_LIVE_OPTIONS;
  const euEvVariants = euEvVariantsQuery.data ?? EMPTY_EU_EV_VARIANTS;
  const euEvModels = euEvModelsQuery.data ?? EMPTY_EU_EV_MODELS;
  const usingEuEvFallback = liveModels.length === 0 && euEvVariants.length > 0;
  const selectedModelFamily = car.model ? getDisplayModelName(car.brand, car.model) : "";
  const localVariantOptions = useMemo(
    () =>
      selectedModelFamily
        ? localModels
            .filter((item) => getDisplayModelName(car.brand, item.model) === selectedModelFamily)
            .map((item) => ({
              id: `local:${item.model}`,
              label: item.model,
            }))
        : [],
    [car.brand, localModels, selectedModelFamily],
  );
  const lookupModelOptions = usingEuEvFallback ? [selectedModelFamily || car.model] : liveModels;
  const lookupVariantOptions = usingEuEvFallback
    ? euEvVariants.map((variant) => ({
        id: variant.id,
        label: variant.title,
      }))
    : liveOptions.length > 0
      ? liveOptions
      : localVariantOptions;

  const brands = useMemo(
    () => {
      const brandMap = new Map<string, string>();
      [
        ...localBrands,
        ...(fuelEconomyBrandsQuery.data ?? EMPTY_LIVE_MODELS),
        ...(euEvBrandsQuery.data ?? EMPTY_LIVE_MODELS),
      ].forEach((brandName) => {
        const canonicalBrand = canonicalizeBrandName(brandName);
        if (!canonicalBrand) return;
        brandMap.set(canonicalBrand.toLowerCase(), canonicalBrand);
      });

      return [...brandMap.values()].sort((a, b) => a.localeCompare(b));
    },
    [euEvBrandsQuery.data, fuelEconomyBrandsQuery.data, localBrands],
  );

  const modelNames = useMemo(
    () =>
      [...new Set([
        ...(car.model ? [getDisplayModelName(car.brand, car.model)] : []),
        ...localModels.map((item) => getDisplayModelName(car.brand, item.model)),
        ...liveModels.map((item) => getDisplayModelName(car.brand, item)),
        ...euEvModels.map((item) => getDisplayModelName(car.brand, item.model)),
      ])].sort((a, b) => a.localeCompare(b)),
    [car.brand, car.model, euEvModels, liveModels, localModels],
  );

  const modelYearOptions = useMemo(
    () =>
      Array.from(
        { length: MAX_MODEL_YEAR - MIN_TAX_ESTIMATE_YEAR + 1 },
        (_, index) => MAX_MODEL_YEAR - index,
      ),
    [],
  );

  const euEvAvailableYears = useMemo(() => {
    const variants = euEvModelYearsQuery.data ?? EMPTY_EU_EV_VARIANTS;
    const minYear = variants.reduce<number | null>((lowest, variant) => {
      if (!variant.availableFromYear) return lowest;
      if (lowest === null) return variant.availableFromYear;
      return Math.min(lowest, variant.availableFromYear);
    }, null);

    if (!minYear) return [];
    return modelYearOptions.filter((year) => year >= minYear);
  }, [euEvModelYearsQuery.data, modelYearOptions]);

  const availableModelYears = useMemo(() => {
    if (!car.model) return modelYearOptions;

    if (localModelMatch) return modelYearOptions;

    const availableYears = new Set<number>([
      ...(fuelEconomyModelYearsQuery.data ?? []),
      ...euEvAvailableYears,
    ]);

    return availableYears.size > 0
      ? modelYearOptions.filter((year) => availableYears.has(year))
      : modelYearOptions;
  }, [
    car.model,
    euEvAvailableYears,
    fuelEconomyModelYearsQuery.data,
    localModelMatch,
    modelYearOptions,
  ]);

  const isModelYearAvailable = useMemo(
    () => new Set(availableModelYears),
    [availableModelYears],
  );

  const update = useCallback((partial: Partial<CarInput>) => {
    let nextCar = { ...car, ...partial };
    const touchedFuelInputs =
      Object.prototype.hasOwnProperty.call(partial, "fuelType") ||
      Object.prototype.hasOwnProperty.call(partial, "fuelConsumption");
    const touchedModelYear = Object.prototype.hasOwnProperty.call(partial, "modelYear");
    const touchedPurchasePrice = Object.prototype.hasOwnProperty.call(partial, "purchasePrice");

    if (touchedPurchasePrice && !Object.prototype.hasOwnProperty.call(partial, "priceSource")) {
      nextCar = {
        ...nextCar,
        priceSource: (partial.purchasePrice ?? 0) > 0 ? "manual" : "missing",
        priceSourceLabel: undefined,
        priceSourceUrl: undefined,
        priceSourceCheckedAt: undefined,
      };
    }

    if (
      touchedModelYear &&
      nextCar.isConfigured &&
      nextCar.brand &&
      nextCar.model &&
      nextCar.priceSource !== "manual" &&
      !Object.prototype.hasOwnProperty.call(partial, "purchasePrice")
    ) {
      const refreshedPriceEstimate = estimatePurchasePrice(
        nextCar.brand,
        nextCar.model,
        nextCar.fuelType,
        nextCar.modelYear,
      );

      nextCar = {
        ...nextCar,
        purchasePrice: refreshedPriceEstimate.priceSek,
        priceSource: refreshedPriceEstimate.priceSource,
        priceSourceLabel: undefined,
        priceSourceUrl: undefined,
        priceSourceCheckedAt: undefined,
      };
    }

    if (car.taxCostSource === "estimated" && (touchedFuelInputs || touchedModelYear)) {
      nextCar = applyEstimatedTax(nextCar, touchedFuelInputs ? null : nextCar.estimatedCo2GKm);
    }

    onChange(nextCar);
  }, [car, onChange]);

  useEffect(() => {
    if (!car.model) return;
    if (isModelYearAvailable.has(car.modelYear)) return;
    if (availableModelYears.length === 0) return;

    update({ modelYear: availableModelYears[0] });
  }, [availableModelYears, car.model, car.modelYear, isModelYearAvailable, update]);

  const updateLoan = (partial: Partial<CarInput["loan"]>) =>
    update({ loan: { ...car.loan, ...partial } });
  const updateLeasing = (partial: Partial<CarInput["leasing"]>) =>
    update({ leasing: { ...car.leasing, ...partial } });
  const getFuelTypeLabel = useCallback((fuelType: FuelType) => {
    switch (fuelType) {
      case "petrol":
        return t({ en: "Petrol", sv: "Bensin" });
      case "diesel":
        return "Diesel";
      case "hybrid":
        return t({ en: "Hybrid", sv: "Hybrid" });
      case "electric":
        return t({ en: "Electric", sv: "El" });
    }
  }, [t]);

  const handleBrandChange = (brand: string) => {
    setLookupModel("");
    setLookupOptionId("");
    setLookupMessage("");
    onChange({
      ...car,
      brand,
      model: "",
      name: "",
      modelYear: car.modelYear,
      purchasePrice: 0,
      priceSource: "missing",
      priceSourceLabel: undefined,
      priceSourceUrl: undefined,
      priceSourceCheckedAt: undefined,
      fuelType: "petrol",
      fuelConsumption: 0,
      estimatedCo2GKm: null,
      taxCost: 0,
      taxCostSource: "estimated",
      serviceCost: 0,
      isConfigured: false,
      loan: { ...car.loan, downPayment: 0, residualBalloon: 0 },
    });
  };

  const handleModelChange = async (modelName: string) => {
    setLookupModel(modelName);
    setLookupOptionId("");
    setLookupMessage("");

    const localModel = findCarModel(car.brand, modelName);
    const euEvModel = euEvModels.find((item) => getDisplayModelName(car.brand, item.model) === modelName);
    const inferredFuelType = inferFuelTypeFromText(modelName);
    const liveFuelType: FuelType =
      localModel?.fuelType ??
      (euEvModel ? "electric" : inferredFuelType ?? "petrol");
    const liveFuelConsumption =
      localModel?.fuelConsumption ??
      euEvModel?.averageEfficiencyKwh100km ??
      0;
    const priceEstimate = estimatePurchasePrice(
      car.brand,
      modelName,
      liveFuelType,
      car.modelYear,
    );
    let purchasePrice = priceEstimate.priceSek;
    let priceSource = priceEstimate.priceSource;
    let priceSourceLabel: string | undefined;
    let priceSourceUrl: string | undefined;
    let priceSourceCheckedAt: string | undefined;
    const officialPrice = isCurrentGenerationModel
      ? findVerifiedOfficialPrice(car.brand, modelName, car.modelYear, currentYear)
      : null;
    const officialCandidate = officialPrice
      ? {
          priceSek: officialPrice.priceSek,
          priceSource: "official_new" as const,
          sourceLabel: officialPrice.providerName,
          sourceUrl: officialPrice.sourceUrl,
          sourceCheckedAt: officialPrice.checkedAt,
        }
      : null;
    const retailerListing = isCurrentGenerationModel ? findVerifiedRetailerPrice(car.brand, modelName) : null;
    const retailerCandidate = retailerListing
      ? {
          priceSek: retailerListing.priceSek,
          priceSource: "retailer_listing" as const,
          sourceLabel: retailerListing.providerName,
          sourceUrl: retailerListing.sourceUrl,
          sourceCheckedAt: retailerListing.checkedAt,
        }
      : null;
    let fallbackCandidate = toAutomaticPriceCandidate(priceEstimate.priceSek, priceEstimate.priceSource);

    if (euEvModel?.averagePriceEur && isCurrentGenerationModel) {
      try {
        const euEvCatalogPrice = await convertEurToSek(euEvModel.averagePriceEur);
        if (euEvCatalogPrice > 0) {
          fallbackCandidate = {
            priceSek: euEvCatalogPrice,
            priceSource: "catalog_reference",
            sourceLabel: "EU EV catalog",
            sourceUrl: EU_EV_SOURCE_URL,
          };
        }
      } catch {
        fallbackCandidate ??= toAutomaticPriceCandidate(priceEstimate.priceSek, priceEstimate.priceSource);
      }
    }

    let marketCandidate = null;
    try {
      const marketEstimate = await fetchMarketPriceEstimate(car.brand, modelName, car.modelYear);
      const fallbackPriceSource = fallbackCandidate?.priceSource ?? "missing";
      const fallbackPurchasePrice = fallbackCandidate?.priceSek ?? 0;

      if (
        marketEstimate?.priceSek &&
        shouldPreferMarketPriceEstimate({
          currentPriceSource: fallbackPriceSource,
          currentPurchasePrice: fallbackPurchasePrice,
          hasLocalModelMatch: Boolean(localModel),
          modelYear: car.modelYear,
          estimate: marketEstimate,
          currentYear,
        })
      ) {
        marketCandidate = {
          priceSek: marketEstimate.priceSek,
          priceSource: "market_listings" as const,
          sourceLabel: marketEstimate.providerLabel,
          sourceUrl: marketEstimate.sourceUrl,
        };
      }
    } catch {
      // Keep retailer and fallback prices if marketplace lookup fails.
    }

    const selectedPriceCandidate = choosePreferredPriceCandidate([
      officialCandidate,
      retailerCandidate,
      marketCandidate,
      fallbackCandidate,
    ]);

    if (selectedPriceCandidate) {
      purchasePrice = selectedPriceCandidate.priceSek;
      priceSource = selectedPriceCandidate.priceSource;
      priceSourceLabel = selectedPriceCandidate.sourceLabel;
      priceSourceUrl = selectedPriceCandidate.sourceUrl;
      priceSourceCheckedAt = selectedPriceCandidate.sourceCheckedAt;
    } else {
      purchasePrice = 0;
      priceSource = "missing";
    }

    const serviceCost = localModel?.serviceCost ?? car.serviceCost;
    const suggestedLoan = buildSuggestedLoanInputs(liveFuelType, purchasePrice, car.loan);
    const suggestedLeasing = buildSuggestedLeasingInputs(car.brand, modelName, car.annualMileage, car.leasing);
    const leasingAvailabilityForModel = getLeasingAvailability(car.brand, modelName);
    const nextFinancingMode =
      car.financingMode === "leasing" && leasingAvailabilityForModel.status === "unavailable"
        ? "loan"
        : car.financingMode;

    onChange(applyEstimatedTax({
      ...car,
      model: modelName,
      name: `${car.brand} ${modelName}`,
      purchasePrice,
      priceSource,
      priceSourceLabel,
      priceSourceUrl,
      priceSourceCheckedAt,
      fuelType: liveFuelType,
      fuelConsumption: liveFuelConsumption,
      estimatedCo2GKm: euEvModel ? 0 : null,
      fuelPrice: getDefaultFuelPrice(liveFuelType),
      taxCost: euEvModel ? 360 : 0,
      taxCostSource: "estimated",
      serviceCost,
      isConfigured: true,
      financingMode: nextFinancingMode,
      loan: suggestedLoan,
      leasing: suggestedLeasing,
    }, euEvModel ? 0 : null));
  };

  const handleFinancingModeChange = (mode: FinancingMode) => {
    const leasingAvailability = getLeasingAvailability(car.brand, car.model);
    if (mode === "leasing" && leasingAvailability.status === "unavailable") return;

    if (mode === "loan") {
      update({
        financingMode: mode,
        loan: buildSuggestedLoanInputs(car.fuelType, car.purchasePrice, car.loan),
      });
      return;
    }

    if (mode === "leasing") {
      update({
        financingMode: mode,
        leasing: buildSuggestedLeasingInputs(car.brand, car.model, car.annualMileage, car.leasing),
      });
      return;
    }

    update({ financingMode: mode });
  };

  const handleFuelTypeChange = (ft: FuelType) => {
    if (!availableFuelTypes.includes(ft)) return;

    setLookupMessage("");

    const nextPartial: Partial<CarInput> = {
      fuelType: ft,
      fuelConsumption: 0,
      fuelPrice: getDefaultFuelPrice(ft),
      estimatedCo2GKm: null,
    };

    if (car.financingMode === "loan") {
      nextPartial.loan = buildSuggestedLoanInputs(ft, car.purchasePrice, car.loan);
    }

    update(nextPartial);
  };

  const currencyUnit = language === "sv" ? "kr" : "SEK";
  const fuelLabel = car.fuelType === "electric" ? "kWh/100km" : "L/100km";
  const priceLabel = car.fuelType === "electric" ? `${currencyUnit}/kWh` : `${currencyUnit}/L`;
  const consumptionHint = car.fuelType === "electric"
    ? t({
      en: "Average energy use per 100 km (real-world estimate).",
      sv: "Genomsnittlig energiförbrukning per 100 km (realistisk uppskattning).",
    })
    : t({
      en: "Average fuel use per 100 km (real-world estimate).",
      sv: "Genomsnittlig bränsleförbrukning per 100 km (realistisk uppskattning).",
    });
  const fuelPriceHint = car.fuelType === "electric"
    ? t({ en: "Your expected electricity price per kWh.", sv: "Ditt förväntade elpris per kWh." })
    : t({ en: "Your expected fuel price per liter.", sv: "Ditt förväntade bränslepris per liter." });
  const exactEuEvModel = euEvModels.find(
    (item) => getDisplayModelName(car.brand, item.model) === getDisplayModelName(car.brand, car.model),
  );
  const availableFuelTypes = useMemo<FuelType[]>(
    () => {
      if (!car.brand || !car.model) return FUEL_TYPE_ORDER;
      if (exactEuEvModel) return ["electric"];

      const inferredFuelTypes = inferAvailableFuelTypes(
        car.brand,
        car.model,
        lookupVariantOptions.map((option) => option.label),
      );

      const inferenceWasUnknown =
        inferredFuelTypes.length === FUEL_TYPE_ORDER.length &&
        lookupVariantOptions.length > 0;

      if (inferenceWasUnknown && (lookupOptionId || lookupMessage)) {
        return [car.fuelType];
      }

      return inferredFuelTypes;
    },
    [car.brand, car.fuelType, car.model, exactEuEvModel, lookupMessage, lookupOptionId, lookupVariantOptions],
  );
  const hasSingleFuelType = availableFuelTypes.length <= 1;
  const availableFuelTypeSummary = availableFuelTypes.map(getFuelTypeLabel).join(", ");

  const residualPercent = calculateResidualPercent(car.ownershipYears, car.fuelType, car.modelYear);
  const loanAmount = Math.max(0, car.purchasePrice - car.loan.downPayment);
  const selectedLiveOption =
    !lookupOptionId.startsWith("local:")
      ? lookupVariantOptions.find((option) => option.id === lookupOptionId)
      : undefined;
  const selectedLocalModel = lookupOptionId.startsWith("local:")
    ? localModels.find((item) => `local:${item.model}` === lookupOptionId) ?? null
    : null;
  const selectedEuEvVariant = euEvVariants.find((variant) => variant.id === lookupOptionId);
  const selectedLookupKey = lookupOptionId
    ? [usingEuEvFallback ? "eu-ev" : "fuel-economy", car.brand, car.model, car.modelYear, lookupModel, lookupOptionId].join("|")
    : "";
  const priceSourceMeta = getPriceSourceMeta(car.priceSource, t);
  const priceSourceCheckedAtLabel = formatIsoDate(car.priceSourceCheckedAt, locale);
  const marketSourceLink =
    car.priceSource === "market_listings" && marketPriceQuery.data?.sourceUrl
      ? marketPriceQuery.data
      : null;
  const directSourceLink =
    !marketSourceLink && car.priceSourceUrl
      ? {
          sourceUrl: car.priceSourceUrl,
          label: car.priceSourceLabel ?? priceSourceMeta.label,
          checkedAtLabel: priceSourceCheckedAtLabel,
        }
      : null;
  const leasingAvailability = getLeasingAvailability(car.brand, car.model);
  const suggestedLeasingDefaults = getSuggestedLeaseDefaults(car.brand, car.model);
  const loanBenchmarks = getLoanBenchmarks(car.fuelType, car.brand, car.model);
  const primaryLoanBenchmark = loanBenchmarks.find((item) => item.benchmarkKind !== "policy_rate") ?? null;
  const loanSelectorHint =
    primaryLoanBenchmark && primaryLoanBenchmark.rateType === "range"
      ? t({
        en: `${primaryLoanBenchmark.providerName} currently publishes ${formatRateLabel(primaryLoanBenchmark)} for car loans.`,
        sv: `${primaryLoanBenchmark.providerName} publicerar just nu ${formatRateLabel(primaryLoanBenchmark)} för billån.`,
      })
      : primaryLoanBenchmark && primaryLoanBenchmark.nominalRatePercent !== undefined
        ? t({
          en: `${primaryLoanBenchmark.providerName} benchmark: ${formatRateLabel(primaryLoanBenchmark)} ${primaryLoanBenchmark.rateType}.`,
          sv: `${primaryLoanBenchmark.providerName} referens: ${formatRateLabel(primaryLoanBenchmark)} ${primaryLoanBenchmark.rateType === "fixed" ? "fast" : primaryLoanBenchmark.rateType === "campaign" ? "kampanj" : "rörlig"}.`,
        })
        : undefined;
  const leasingSelectorHint =
    leasingAvailability.status === "available"
      ? t({
        en: `${leasingAvailability.providerName} has a verified lease offer for this model.`,
        sv: `${leasingAvailability.providerName} har ett verifierat leasingerbjudande för modellen.`,
      })
      : leasingAvailability.status === "manual_only"
        ? t({
          en: `${leasingAvailability.providerName} supports leasing, but this exact model still needs a verified live offer.`,
          sv: `${leasingAvailability.providerName} erbjuder leasing, men den här exakta modellen saknar ännu ett verifierat live-erbjudande.`,
        })
        : leasingAvailability.status === "unavailable"
          ? t({
            en: "Leasing is verified as unavailable for this model.",
            sv: "Leasing är verifierat som otillgängligt för den här modellen.",
          })
          : t({
            en: "No verified leasing source has been added for this model yet.",
            sv: "Ingen verifierad leasingkälla har lagts till för modellen ännu.",
          });
  const selectorStates = {
    loan: { hint: loanSelectorHint },
    leasing: {
      disabled: leasingAvailability.status === "unavailable",
      hint: leasingSelectorHint,
    },
  } satisfies Partial<Record<FinancingMode, { disabled?: boolean; hint?: string }>>;
  const checkedAtLabel = formatIsoDate(
    car.financingMode === "leasing" ? leasingAvailability.checkedAt : primaryLoanBenchmark?.checkedAt,
    locale,
  );
  const validUntilLabel = formatIsoDate(
    car.financingMode === "leasing" ? leasingAvailability.validUntil : primaryLoanBenchmark?.validUntil,
    locale,
  );

  useEffect(() => {
    setLookupModel("");
    setLookupOptionId("");
    setLookupMessage("");
  }, [car.brand, car.modelYear]);

  useEffect(() => {
    const availableModelOptions = usingEuEvFallback
      ? [selectedModelFamily || car.model]
      : liveModels.length > 0
        ? liveModels
        : localVariantOptions.length > 0
          ? [selectedModelFamily]
          : [];

    if (!car.isConfigured || lookupModel || availableModelOptions.length === 0) return;

    if (usingEuEvFallback || localVariantOptions.length > 0) {
      setLookupModel(selectedModelFamily || car.model);
      return;
    }

    const localModelKey = normalizeLookupText(car.model);
    const preferredModel =
      availableModelOptions.find((modelName) => normalizeLookupText(modelName) === localModelKey) ??
      availableModelOptions.find((modelName) => normalizeLookupText(modelName).includes(localModelKey)) ??
      availableModelOptions.find((modelName) => localModelKey.includes(normalizeLookupText(modelName)));

    if (preferredModel) {
      setLookupModel(preferredModel);
    }
  }, [car.isConfigured, car.model, liveModels, localVariantOptions.length, lookupModel, selectedModelFamily, usingEuEvFallback]);

  useEffect(() => {
    setLookupOptionId("");
    setLookupMessage("");
  }, [lookupModel]);

  useEffect(() => {
    if (!lookupModel || lookupOptionId || lookupVariantOptions.length !== 1) return;
    setLookupOptionId(lookupVariantOptions[0].id);
  }, [lookupModel, lookupOptionId, lookupVariantOptions]);

  const importOfficialFuelData = useCallback(async () => {
    if (!lookupOptionId) return;

    setLookupMessage("");
    setIsImportingOfficialData(true);

    try {
      if (selectedLocalModel) {
        const priceEstimate = estimatePurchasePrice(
          car.brand,
          selectedLocalModel.model,
          selectedLocalModel.fuelType,
          car.modelYear,
        );
        const purchasePrice = priceEstimate.priceSek;

        onChange(applyEstimatedTax({
          ...car,
          model: selectedLocalModel.model,
          name: `${car.brand} ${selectedLocalModel.model}`,
          purchasePrice,
          priceSource: priceEstimate.priceSource,
          priceSourceLabel: undefined,
          priceSourceUrl: undefined,
          priceSourceCheckedAt: undefined,
          fuelType: selectedLocalModel.fuelType,
          fuelConsumption: selectedLocalModel.fuelConsumption,
          fuelPrice: getDefaultFuelPrice(selectedLocalModel.fuelType),
          serviceCost: selectedLocalModel.serviceCost,
          loan: buildSuggestedLoanInputs(selectedLocalModel.fuelType, purchasePrice, car.loan),
          leasing: buildSuggestedLeasingInputs(car.brand, selectedLocalModel.model, car.annualMileage, car.leasing),
        }));
        setLookupMessage(t({
          en: "Version selected from local catalog data.",
          sv: "Version vald från lokal katalogdata.",
        }));
        return;
      }

      if (!selectedLiveOption) return;

      if (usingEuEvFallback && selectedEuEvVariant) {
        const shouldUseCatalogPrice =
          Boolean(selectedEuEvVariant.priceEur) &&
          car.priceSource !== "manual" &&
          isCurrentGenerationModel;
        const nextPurchasePrice = shouldUseCatalogPrice
          ? await convertEurToSek(selectedEuEvVariant.priceEur ?? 0)
          : car.purchasePrice;
        const nextLoan =
          nextPurchasePrice > 0 && car.loan.downPayment <= 0
            ? { ...car.loan, downPayment: Math.round(nextPurchasePrice * 0.2) }
            : car.loan;

        const nextCar = applyEstimatedTax({
          ...car,
          name: selectedEuEvVariant.title,
          purchasePrice: nextPurchasePrice,
          priceSource: shouldUseCatalogPrice ? "catalog_reference" : car.priceSource,
          priceSourceLabel: shouldUseCatalogPrice ? "EU EV catalog" : car.priceSourceLabel,
          priceSourceUrl: shouldUseCatalogPrice ? EU_EV_SOURCE_URL : car.priceSourceUrl,
          priceSourceCheckedAt: shouldUseCatalogPrice ? undefined : car.priceSourceCheckedAt,
          fuelType: "electric",
          fuelConsumption: selectedEuEvVariant.efficiencyKwh100km,
          estimatedCo2GKm: 0,
          fuelPrice: getDefaultFuelPrice("electric"),
          loan: nextLoan,
        }, 0);

        onChange(nextCar);
        setLookupMessage(t({
          en:
            nextPurchasePrice > 0 && selectedEuEvVariant.priceEur
              ? "EU EV data imported. Reference price and tax updated."
              : "EU EV data imported. Enter purchase price manually.",
          sv:
            nextPurchasePrice > 0 && selectedEuEvVariant.priceEur
              ? "EU EV-data importerad. Referenspris och skatt uppdaterade."
              : "EU EV-data importerad. Ange köpesumma manuellt.",
        }));
        return;
      }

      const vehicle = await fetchFuelEconomyVehicle(lookupOptionId, selectedLiveOption.label);
      const fallbackPriceEstimate = estimatePurchasePrice(
        car.brand,
        car.model,
        vehicle.fuelType,
        vehicle.year || car.modelYear,
      );
      const shouldRefreshEstimatedPrice =
        car.priceSource !== "manual" &&
        car.priceSource !== "official_new" &&
        (car.purchasePrice <= 0 || car.priceSource === "missing");
        const nextCar = applyEstimatedTax({
          ...car,
          name: `${car.brand} ${vehicle.model}`,
          modelYear: vehicle.year || car.modelYear,
          purchasePrice: shouldRefreshEstimatedPrice ? fallbackPriceEstimate.priceSek : car.purchasePrice,
          priceSource: shouldRefreshEstimatedPrice ? fallbackPriceEstimate.priceSource : car.priceSource,
          priceSourceLabel: shouldRefreshEstimatedPrice ? undefined : car.priceSourceLabel,
          priceSourceUrl: shouldRefreshEstimatedPrice ? undefined : car.priceSourceUrl,
          priceSourceCheckedAt: shouldRefreshEstimatedPrice ? undefined : car.priceSourceCheckedAt,
          fuelType: vehicle.fuelType,
          fuelConsumption: vehicle.fuelConsumption,
        estimatedCo2GKm: vehicle.estimatedCo2GKm,
        fuelPrice: getDefaultFuelPrice(vehicle.fuelType),
      }, vehicle.estimatedCo2GKm);

      onChange(nextCar);
      setLookupMessage(t({
        en:
          shouldRefreshEstimatedPrice
            ? "Official data imported. Price estimated."
            : "Official data imported.",
        sv:
          shouldRefreshEstimatedPrice
            ? "Officiell data importerad. Pris uppskattat."
            : "Officiell data importerad.",
      }));
    } catch (error) {
      setLookupMessage(
        error instanceof Error
          ? error.message
          : t({
              en: "Official data is unavailable right now.",
              sv: "Officiell data är otillgänglig just nu.",
            }),
      );
    } finally {
      setIsImportingOfficialData(false);
    }
  }, [
    car,
    buildSuggestedLeasingInputs,
    buildSuggestedLoanInputs,
    lookupOptionId,
    onChange,
    selectedLocalModel,
    selectedEuEvVariant,
    selectedLiveOption,
    t,
    usingEuEvFallback,
  ]);

  useEffect(() => {
    if (!selectedLookupKey || (!selectedLiveOption && !selectedLocalModel) || isImportingOfficialData) return;
    if (lastAutoImportKeyRef.current === selectedLookupKey) return;

    lastAutoImportKeyRef.current = selectedLookupKey;
    void importOfficialFuelData();
  }, [importOfficialFuelData, isImportingOfficialData, selectedLocalModel, selectedLiveOption, selectedLookupKey]);

  useEffect(() => {
    if (!car.isConfigured || !isCurrentGenerationModel) return;

    const verifiedOfficialPrice = findVerifiedOfficialPrice(car.brand, car.model, car.modelYear, currentYear);
    if (!verifiedOfficialPrice) return;
    if (car.priceSource === "manual" || car.priceSource === "official_new") {
      return;
    }

    const effectKey = [
      car.brand,
      car.model,
      car.modelYear,
      verifiedOfficialPrice.providerName,
      verifiedOfficialPrice.matchedModel,
      verifiedOfficialPrice.priceSek,
      verifiedOfficialPrice.checkedAt,
    ].join("|");

    if (lastOfficialPriceKeyRef.current === effectKey && car.purchasePrice === verifiedOfficialPrice.priceSek) {
      return;
    }

    lastOfficialPriceKeyRef.current = effectKey;

    onChange({
      ...car,
      purchasePrice: verifiedOfficialPrice.priceSek,
      priceSource: "official_new",
      priceSourceLabel: verifiedOfficialPrice.providerName,
      priceSourceUrl: verifiedOfficialPrice.sourceUrl,
      priceSourceCheckedAt: verifiedOfficialPrice.checkedAt,
      loan: {
        ...car.loan,
        downPayment:
          car.loan.downPayment > 0 ? car.loan.downPayment : Math.round(verifiedOfficialPrice.priceSek * 0.2),
      },
    });
  }, [car, currentYear, isCurrentGenerationModel, onChange]);

  useEffect(() => {
    if (!car.isConfigured || !isCurrentGenerationModel) return;

    const verifiedOfficialPrice = findVerifiedOfficialPrice(car.brand, car.model, car.modelYear, currentYear);
    if (verifiedOfficialPrice) return;

    const verifiedRetailerPrice = findVerifiedRetailerPrice(car.brand, car.model);
    if (!verifiedRetailerPrice) return;
    if (
      car.priceSource === "manual" ||
      car.priceSource === "official_new" ||
      car.priceSource === "retailer_listing"
    ) {
      return;
    }

    const effectKey = [
      car.brand,
      car.model,
      car.modelYear,
      verifiedRetailerPrice.providerName,
      verifiedRetailerPrice.condition,
      verifiedRetailerPrice.priceSek,
      verifiedRetailerPrice.checkedAt,
    ].join("|");

    if (lastRetailerPriceKeyRef.current === effectKey && car.purchasePrice === verifiedRetailerPrice.priceSek) {
      return;
    }

    lastRetailerPriceKeyRef.current = effectKey;

    onChange({
      ...car,
      purchasePrice: verifiedRetailerPrice.priceSek,
      priceSource: "retailer_listing",
      priceSourceLabel: verifiedRetailerPrice.providerName,
      priceSourceUrl: verifiedRetailerPrice.sourceUrl,
      priceSourceCheckedAt: verifiedRetailerPrice.checkedAt,
      loan: {
        ...car.loan,
        downPayment:
          car.loan.downPayment > 0 ? car.loan.downPayment : Math.round(verifiedRetailerPrice.priceSek * 0.2),
      },
    });
  }, [car, currentYear, isCurrentGenerationModel, onChange]);

  useEffect(() => {
    if (!car.isConfigured || !exactEuEvModel?.averagePriceEur) return;
    if (!isCurrentGenerationModel) return;
    if (
      car.priceSource === "manual" ||
      car.priceSource === "official_new" ||
      car.priceSource === "retailer_listing" ||
      car.priceSource === "market_listings"
    ) {
      return;
    }

    const effectKey = [car.brand, car.model, car.modelYear, exactEuEvModel.averagePriceEur].join("|");
    if (lastEuModelPriceKeyRef.current === effectKey) return;

    lastEuModelPriceKeyRef.current = effectKey;

    void (async () => {
      try {
        const officialPriceSek = await convertEurToSek(exactEuEvModel.averagePriceEur ?? 0);
        if (officialPriceSek <= 0) return;

        onChange({
          ...car,
          purchasePrice: officialPriceSek,
          priceSource: "catalog_reference",
          priceSourceLabel: "EU EV catalog",
          priceSourceUrl: EU_EV_SOURCE_URL,
          priceSourceCheckedAt: undefined,
          loan: {
            ...car.loan,
            downPayment: car.loan.downPayment > 0 ? car.loan.downPayment : Math.round(officialPriceSek * 0.2),
          },
        });
      } catch {
        // Keep the historical estimate when conversion or fetch fails.
      }
    })();
  }, [car, exactEuEvModel, onChange]);

  useEffect(() => {
    if (!car.isConfigured || !marketPriceQuery.data?.priceSek) return;
    const marketEstimate = marketPriceQuery.data;
    if (!shouldPreferMarketPriceEstimate({
      currentPriceSource: car.priceSource,
      currentPurchasePrice: car.purchasePrice,
      hasLocalModelMatch: Boolean(localModelMatch),
      modelYear: car.modelYear,
      estimate: marketEstimate,
    })) {
      return;
    }

    const effectKey = [
      car.brand,
      car.model,
      car.modelYear,
      marketEstimate.provider,
      marketEstimate.matchType,
      marketEstimate.priceSek,
      marketEstimate.sampleSize,
    ].join("|");

    if (
      lastMarketPriceKeyRef.current === effectKey &&
      car.priceSource === "market_listings" &&
      car.purchasePrice === marketEstimate.priceSek
    ) {
      return;
    }

    lastMarketPriceKeyRef.current = effectKey;

    onChange({
      ...car,
      purchasePrice: marketEstimate.priceSek,
      priceSource: "market_listings",
      priceSourceLabel: marketEstimate.providerLabel,
      priceSourceUrl: marketEstimate.sourceUrl,
      priceSourceCheckedAt: undefined,
      loan: {
        ...car.loan,
        downPayment: car.loan.downPayment > 0 ? car.loan.downPayment : Math.round(marketEstimate.priceSek * 0.2),
      },
    });
  }, [car, localModelMatch, marketPriceQuery.data, onChange]);

  useEffect(() => {
    if (!car.isConfigured || availableFuelTypes.length === 0 || availableFuelTypes.includes(car.fuelType)) return;

    update({
      fuelType: availableFuelTypes[0],
      fuelPrice: getDefaultFuelPrice(availableFuelTypes[0]),
      estimatedCo2GKm: null,
    });
  }, [availableFuelTypes, car.fuelType, car.isConfigured, update]);

  return (
    <div className="bg-card rounded-2xl border border-border/70 shadow-sm overflow-hidden relative group">

      {/* Action buttons */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2 opacity-100 sm:gap-1 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity">
        {canDuplicate && car.isConfigured && (
          <button
            type="button"
            onClick={onDuplicate}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background shadow-sm hover:bg-secondary/80 transition-colors sm:h-auto sm:w-auto sm:border-transparent sm:bg-transparent sm:shadow-none"
            aria-label={t({ en: "Duplicate car", sv: "Duplicera bil" })}
            title={t({ en: "Duplicate car", sv: "Duplicera bil" })}
          >
            <Copy className="w-4 h-4 text-muted-foreground sm:w-3.5 sm:h-3.5" />
          </button>
        )}
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background shadow-sm hover:bg-secondary/80 transition-colors sm:h-auto sm:w-auto sm:border-transparent sm:bg-transparent sm:shadow-none"
            aria-label={t({ en: "Remove car", sv: "Ta bort bil" })}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        {car.isConfigured && car.name ? (
          <div className="flex items-center gap-2.5 pr-20 sm:pr-7 mb-4">
            <BrandLogo brand={car.brand} size="md" />
            <div className="min-w-0">
              <span className="font-semibold text-sm block truncate leading-snug">
                {car.name}
              </span>
              <div className="mt-0.5">
                <FuelBadge fuelType={car.fuelType} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-3">
            {car.brand && <BrandLogo brand={car.brand} />}
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              {t({ en: `Car ${index + 1}`, sv: `Bil ${index + 1}` })}
            </span>
          </div>
        )}

        {/* Brand + Model + Version */}
        <div className="grid gap-2 md:grid-cols-3">
          <div className="space-y-1 min-w-0">
            <Label className="text-[11px] text-muted-foreground font-medium">{t({ en: "Brand", sv: "Märke" })}</Label>
            <Select value={car.brand || undefined} onValueChange={handleBrandChange}>
              <SelectTrigger className="min-h-11 text-[13px] bg-card border border-border/70 hover:border-border shadow-none focus:ring-2 focus:ring-ring/10 sm:h-8 sm:min-h-0">
                <SelectValue placeholder={t({ en: "Select brand", sv: "Välj märke" })} />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>
                    <span className="flex items-center gap-2">
                      <BrandLogo brand={b} />
                      {b}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 min-w-0">
            <Label className="text-[11px] text-muted-foreground font-medium">{t({ en: "Model", sv: "Modell" })}</Label>
            <Select
              value={(car.model ? getDisplayModelName(car.brand, car.model) : undefined)}
              onValueChange={handleModelChange}
              disabled={!car.brand}
            >
              <SelectTrigger className="min-h-11 text-[13px] bg-card border border-border/70 hover:border-border shadow-none focus:ring-2 focus:ring-ring/10 disabled:opacity-50 sm:h-8 sm:min-h-0">
                <SelectValue
                  placeholder={car.brand
                    ? t({ en: "Select model", sv: "Välj modell" })
                    : t({ en: "Pick brand first", sv: "Välj märke först" })}
                />
              </SelectTrigger>
              <SelectContent>
                {modelNames.map((modelName) => (
                  <SelectItem key={modelName} value={modelName}>
                    {modelName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 min-w-0">
            <Label className="text-[11px] text-muted-foreground font-medium">
              {t({ en: "Version / drivetrain", sv: "Version / drivlina" })}
            </Label>
            <Select
              value={lookupOptionId || undefined}
              onValueChange={setLookupOptionId}
              disabled={
                !car.isConfigured ||
                !lookupModel ||
                (!usingEuEvFallback && liveOptionsQuery.isLoading) ||
                lookupVariantOptions.length === 0
              }
            >
              <SelectTrigger className="min-h-11 text-[13px] bg-card border border-border/70 hover:border-border shadow-none focus:ring-2 focus:ring-ring/10 disabled:opacity-50 sm:h-8 sm:min-h-0">
                <SelectValue
                  placeholder={
                    !car.model
                      ? t({ en: "Pick model first", sv: "Välj modell först" })
                      : liveOptionsQuery.isLoading
                        ? t({ en: "Loading versions...", sv: "Laddar versioner..." })
                        : t({ en: "Choose version", sv: "Välj version" })
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {lookupVariantOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Unconfigured placeholder */}
      {!car.isConfigured && (
        <div className="mx-4 mb-5 flex flex-col items-center justify-center py-7 text-center rounded-xl bg-secondary/30 border border-dashed border-border/60">
          <div className="w-9 h-9 rounded-full bg-secondary/70 flex items-center justify-center mb-2.5">
            <Car className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {t({ en: "Select brand & model above", sv: "Välj märke och modell ovan" })}
          </p>
          <p className="text-[10px] text-muted-foreground/55 mt-0.5">
            {t({ en: "to start comparing costs", sv: "för att börja jämföra kostnader" })}
          </p>
        </div>
      )}

      {/* Configured state */}
      {car.isConfigured && (
        <>
          <div className="h-px bg-border/50" />

          {/* Financing mode toggle */}
          <div className="px-5 pt-3.5 pb-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Label className="text-[11px] text-muted-foreground font-medium">
                {t({ en: "Financing type", sv: "Finansieringstyp" })}
              </Label>
              <TooltipProvider delayDuration={120}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border/70 text-[10px] font-bold leading-none text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                      aria-label={t({ en: "Financing type help", sv: "Hjälp för finansieringstyp" })}
                    >
                      ?
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[260px] text-[11px] leading-relaxed">
                    {t({
                      en: "Pick how the car is paid for. Relevant financing fields update below.",
                      sv: "Välj hur bilen betalas. Relevanta finansieringsfält uppdateras nedan.",
                    })}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <FinancingSelector
              value={car.financingMode}
              onChange={handleFinancingModeChange}
              optionStates={selectorStates}
            />
            <div className="mt-2.5 rounded-lg border border-border/60 bg-secondary/25 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
              {car.financingMode === "leasing" && leasingAvailability.status === "available" && suggestedLeasingDefaults && (
                <>
                  <p>
                    {t({
                      en: `Verified lease loaded from ${leasingAvailability.providerName}: from ${suggestedLeasingDefaults.monthlyLeaseCost.toLocaleString(locale)} ${currencyUnit}/mo, ${suggestedLeasingDefaults.leaseDurationMonths} months, ${suggestedLeasingDefaults.includedMileage.toLocaleString(locale)} km/year, ${suggestedLeasingDefaults.downPayment.toLocaleString(locale)} ${currencyUnit} upfront.`,
                      sv: `Verifierad leasing laddad från ${leasingAvailability.providerName}: från ${suggestedLeasingDefaults.monthlyLeaseCost.toLocaleString(locale)} ${currencyUnit}/mån, ${suggestedLeasingDefaults.leaseDurationMonths} månader, ${suggestedLeasingDefaults.includedMileage.toLocaleString(locale)} km/år och ${suggestedLeasingDefaults.downPayment.toLocaleString(locale)} ${currencyUnit} i första betalning.`,
                    })}
                  </p>
                  {leasingAvailability.notes && (
                    <p className="mt-1">{leasingAvailability.notes}</p>
                  )}
                </>
              )}
              {car.financingMode === "leasing" && leasingAvailability.status === "manual_only" && (
                <>
                  <p>
                    {t({
                      en: "This brand supports private leasing, but we have not stored an active model-specific price yet. Leasing stays editable and you can enter the monthly fee manually.",
                      sv: "Det här märket erbjuder privatleasing, men vi har ännu inte lagrat ett aktivt modellspecifikt pris. Leasing är fortfarande redigerbart så att du kan ange månadsavgiften manuellt.",
                    })}
                  </p>
                  {leasingAvailability.notes && (
                    <p className="mt-1">{leasingAvailability.notes}</p>
                  )}
                </>
              )}
              {car.financingMode === "leasing" && leasingAvailability.status === "unknown" && (
                <p>
                  {t({
                    en: "No verified leasing source has been linked to this exact model yet. You can still compare it by entering the lease terms manually.",
                    sv: "Ingen verifierad leasingkälla är kopplad till den här exakta modellen ännu. Du kan fortfarande jämföra bilen genom att ange leasingvillkoren manuellt.",
                  })}
                </p>
              )}
              {car.financingMode === "loan" && (
                <div className="space-y-1">
                  {primaryLoanBenchmark && (
                    <p>
                      {t({
                        en: `Default loan benchmark: ${primaryLoanBenchmark.providerName} ${formatRateLabel(primaryLoanBenchmark)} ${primaryLoanBenchmark.rateType === "campaign" ? "campaign" : primaryLoanBenchmark.rateType}.`,
                        sv: `Standardreferens för lån: ${primaryLoanBenchmark.providerName} ${formatRateLabel(primaryLoanBenchmark)} ${primaryLoanBenchmark.rateType === "campaign" ? "kampanj" : primaryLoanBenchmark.rateType === "fixed" ? "fast" : primaryLoanBenchmark.rateType === "range" ? "spann" : "rörlig"}.`,
                      })}
                    </p>
                  )}
                  {loanBenchmarks.length > 1 && (
                    <p>
                      {t({
                        en: `Also tracked: ${loanBenchmarks.slice(1, 3).map((item) => `${item.providerName} ${formatRateLabel(item)}`).join(" · ")}.`,
                        sv: `Fler bevakade referenser: ${loanBenchmarks.slice(1, 3).map((item) => `${item.providerName} ${formatRateLabel(item)}`).join(" · ")}.`,
                      })}
                    </p>
                  )}
                  {primaryLoanBenchmark?.notes && (
                    <p>{primaryLoanBenchmark.notes}</p>
                  )}
                </div>
              )}
              {car.financingMode === "cash" && (
                <p>
                  {t({
                    en: `Reference financing rates are still loaded in the background, starting with ${primaryLoanBenchmark?.providerName ?? "official sources"} ${primaryLoanBenchmark ? formatRateLabel(primaryLoanBenchmark) : ""}.`,
                    sv: `Referensräntor för finansiering laddas fortfarande i bakgrunden, med ${primaryLoanBenchmark?.providerName ?? "officiella källor"} ${primaryLoanBenchmark ? formatRateLabel(primaryLoanBenchmark) : ""} som första benchmark.`,
                  })}
                </p>
              )}
              {((car.financingMode === "leasing" && leasingAvailability.sourceUrl) ||
                (car.financingMode !== "leasing" && primaryLoanBenchmark?.sourceUrl)) && (
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground/90">
                  <a
                    href={car.financingMode === "leasing" ? leasingAvailability.sourceUrl : primaryLoanBenchmark?.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-700 underline underline-offset-2 hover:text-sky-800"
                  >
                    {t({ en: "Official source", sv: "Officiell källa" })}
                  </a>
                  {checkedAtLabel && (
                    <span>
                      {t({ en: `Checked ${checkedAtLabel}`, sv: `Kontrollerad ${checkedAtLabel}` })}
                    </span>
                  )}
                  {validUntilLabel && (
                    <span>
                      {t({ en: `Valid until ${validUntilLabel}`, sv: `Gäller till ${validUntilLabel}` })}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-border/40 mx-5" />

          {/* Essential inputs */}
          <div className="px-5 py-4 space-y-5">

            {/* Vehicle basics */}
            <Section label={t({ en: "Vehicle", sv: "Bil" })}>
              <div className={formGridClass}>
                <div className="space-y-1.5">
                  <NumericInput
                    label={t({ en: "Purchase price", sv: "Köpesumma" })}
                    unit={currencyUnit}
                    value={car.purchasePrice}
                    onChange={(v) => update({ purchasePrice: v })}
                    step={10000}
                    hint={t({
                      en: "Total purchase price before resale value is considered.",
                      sv: "Totalt inköpspris innan restvärde räknas in.",
                    })}
                    required
                  />
                  <div className="space-y-0.5">
                    <p className={`text-[11px] ${priceSourceMeta.toneClass}`}>
                      {priceSourceMeta.label}
                    </p>
                    {marketSourceLink && (
                      <a
                        href={marketSourceLink.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-sky-700 underline underline-offset-2 hover:text-sky-800"
                      >
                        {t({ en: "Filtered results", sv: "Filtrerade resultat" })}: {marketSourceLink.providerLabel}
                        <span className="text-muted-foreground">
                          {t({
                            en: `(${marketSourceLink.sampleSize} matched listings)`,
                            sv: `(${marketSourceLink.sampleSize} matchade annonser)`,
                          })}
                        </span>
                      </a>
                    )}
                    {directSourceLink && (
                      <a
                        href={directSourceLink.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-sky-700 underline underline-offset-2 hover:text-sky-800"
                      >
                        {t({ en: "Source", sv: "Källa" })}: {directSourceLink.label}
                        {directSourceLink.checkedAtLabel && (
                          <span className="text-muted-foreground">
                            {t({
                              en: `(checked ${directSourceLink.checkedAtLabel})`,
                              sv: `(kontrollerad ${directSourceLink.checkedAtLabel})`,
                            })}
                          </span>
                        )}
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-1 min-w-0">
                  <FieldLabelWithHint
                    label={t({ en: "Model year", sv: "Årsmodell" })}
                    hint={t({
                      en: "Used for Swedish tax estimate, market price checks, and official fuel lookup.",
                      sv: "Används för svensk skatteuppskattning, marknadspriskontroll och officiell förbrukningssökning.",
                    })}
                  />
                  <Select
                    value={String(car.modelYear)}
                    onValueChange={(value) => update({ modelYear: Number(value) })}
                    disabled={!car.model}
                  >
                    <SelectTrigger className="min-h-11 h-auto py-2.5 text-sm bg-card border border-border/70 disabled:opacity-50 sm:min-h-[2.5rem]">
                      <SelectValue
                        placeholder={
                          !car.model
                            ? t({ en: "Pick model first", sv: "Välj modell först" })
                            : t({ en: "Select model year", sv: "Välj årsmodell" })
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {modelYearOptions.map((year) => {
                        const isAvailable = isModelYearAvailable.has(year);
                        return (
                          <SelectItem key={year} value={String(year)} disabled={!isAvailable}>
                            <div className="flex w-full items-center justify-between gap-3">
                              <span>{year}</span>
                              {!isAvailable && (
                                <span className="text-[10px] text-muted-foreground">
                                  {t({ en: "Unavailable", sv: "Inte tillgänglig" })}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {car.model && !localModelMatch && (fuelEconomyModelYearsQuery.isLoading || euEvModelYearsQuery.isLoading) && (
                    <p className="text-[10px] text-muted-foreground">
                      {t({ en: "Checking available years for this model...", sv: "Kontrollerar tillgängliga årsmodeller för modellen..." })}
                    </p>
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <FieldLabelWithHint
                    label={t({ en: "Fuel type", sv: "Drivmedel" })}
                    hint={t({
                      en: "Default fuel type comes from the selected model.",
                      sv: "Standarddrivmedel hämtas från vald modell.",
                    })}
                  />
                  {hasSingleFuelType ? (
                    <div className="min-h-11 h-auto py-2.5 flex items-center px-3 rounded-md bg-secondary/40 border border-border/40 sm:min-h-[2.5rem]">
                      <FuelBadge fuelType={car.fuelType} />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Select
                        value={car.fuelType}
                        onValueChange={(value) => handleFuelTypeChange(value as FuelType)}
                      >
                        <SelectTrigger className="min-h-11 h-auto py-2.5 text-sm bg-card border border-border/70 sm:min-h-[2.5rem]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FUEL_TYPE_ORDER.map((fuelType) => {
                            const isAvailable = availableFuelTypes.includes(fuelType);

                            return (
                              <SelectItem key={fuelType} value={fuelType} disabled={!isAvailable}>
                                <div className="flex w-full items-center justify-between gap-3">
                                  <span>{getFuelTypeLabel(fuelType)}</span>
                                  {!isAvailable && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {t({ en: "Unavailable", sv: "Inte tillgänglig" })}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {availableFuelTypes.length < FUEL_TYPE_ORDER.length && (
                        <p className="text-[10px] leading-relaxed text-muted-foreground">
                          {t({
                            en: `Available for this model: ${availableFuelTypeSummary}.`,
                            sv: `Tillgängligt för den här modellen: ${availableFuelTypeSummary}.`,
                          })}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <NumericInput
                  label={t({ en: "Consumption", sv: "Förbrukning" })}
                  unit={fuelLabel}
                  value={car.fuelConsumption}
                  onChange={(v) => update({ fuelConsumption: v, estimatedCo2GKm: null })}
                  step={0.1}
                  hint={consumptionHint}
                  required
                />

                <NumericInput
                  label={t({ en: "Annual mileage", sv: "Årlig körsträcka" })}
                  unit="km"
                  value={car.annualMileage}
                  onChange={(v) => update({ annualMileage: v })}
                  step={1000}
                  hint={t({
                    en: "How many kilometers you expect to drive each year.",
                    sv: "Hur många kilometer du förväntar dig att köra varje år.",
                  })}
                  required
                />
              </div>

              {(lookupMessage ||
                (car.brand &&
                  !liveModelsQuery.isLoading &&
                  !euEvVariantsQuery.isLoading &&
                  lookupModelOptions.length === 0 &&
                  !liveModelsQuery.error &&
                  !euEvVariantsQuery.error) ||
                liveModelsQuery.error ||
                euEvVariantsQuery.error) && (
                <div className="space-y-1">
                  {car.brand &&
                    !liveModelsQuery.isLoading &&
                    !euEvVariantsQuery.isLoading &&
                    lookupModelOptions.length === 0 &&
                    !liveModelsQuery.error &&
                    !euEvVariantsQuery.error && (
                    <p className="text-[11px] text-muted-foreground">
                      {t({
                        en: `No free live match was found for ${car.brand} ${car.modelYear}.`,
                        sv: `Ingen gratis live-träff hittades för ${car.brand} ${car.modelYear}.`,
                      })}
                    </p>
                  )}

                  {(liveModelsQuery.error || euEvVariantsQuery.error) && (
                    <p className="text-[11px] text-amber-700">
                      {t({
                        en: "A live lookup source is temporarily unavailable. Your local car data still works.",
                        sv: "En live-källa för uppslag är tillfälligt otillgänglig. Din lokala bildata fungerar fortfarande.",
                      })}
                    </p>
                  )}

                  {lookupMessage && (
                    <p className="text-[10px] text-muted-foreground/80 whitespace-nowrap overflow-x-auto">
                      {lookupMessage}
                    </p>
                  )}
                </div>
              )}
            </Section>

            {/* ── Ownership — always visible for cash and loan ──────────── */}
            {(car.financingMode === "cash" || car.financingMode === "loan") && (
              <Section label={t({ en: "Ownership", sv: "Ägande" })}>
                <div className={formGridClass}>
                  <NumericInput
                    label={t({ en: "Ownership period", sv: "Ägandetid" })}
                    unit={t({ en: "years", sv: "år" })}
                    value={car.ownershipYears}
                    onChange={(v) => update({ ownershipYears: Math.max(1, v) })}
                    min={1}
                    hint={t({
                      en: "How long you plan to keep the car.",
                      sv: "Hur länge du planerar att behålla bilen.",
                    })}
                    required
                  />
                  <ReadonlyField
                    label={t({ en: "Est. residual value", sv: "Beräknat restvärde" })}
                    value={`${residualPercent}%`}
                    hint={t({
                      en: "Estimated remaining value after your ownership period.",
                      sv: "Beräknat kvarvarande värde efter ägandeperioden.",
                    })}
                  />
                </div>
              </Section>
            )}

            {/* ── Loan main fields ─────────────────────────────────────── */}
            {car.financingMode === "loan" && (
              <Section label={t({ en: "Loan details", sv: "Lånedetaljer" })}>
                <div className={formGridClass}>
                  <NumericInput
                    label={t({ en: "Down payment", sv: "Kontantinsats" })}
                    unit={currencyUnit}
                    value={car.loan.downPayment}
                    onChange={(v) => updateLoan({ downPayment: v })}
                    step={10000}
                    hint={t({
                      en: "Amount paid upfront when the loan starts.",
                      sv: "Belopp som betalas direkt när lånet startar.",
                    })}
                  />
                  <ReadonlyField
                    label={t({ en: "Loan amount", sv: "Lånebelopp" })}
                    value={loanAmount.toLocaleString("sv-SE")}
                    unit={currencyUnit}
                    hint={t({
                      en: "Calculated as purchase price minus down payment.",
                      sv: "Beräknas som köpesumma minus kontantinsats.",
                    })}
                  />
                  <NumericInput
                    label={t({ en: "Interest rate", sv: "Ränta" })}
                    unit="%"
                    value={car.loan.interestRate}
                    onChange={(v) => updateLoan({ interestRate: v })}
                    step={0.1}
                    hint={t({
                      en: "Annual loan rate from your lender.",
                      sv: "Årlig låneränta från långivaren.",
                    })}
                  />
                  <NumericInput
                    label={t({ en: "Loan term", sv: "Löptid" })}
                    unit={t({ en: "months", sv: "månader" })}
                    value={car.loan.loanTermMonths}
                    onChange={(v) => updateLoan({ loanTermMonths: Math.max(1, v) })}
                    min={1}
                    hint={t({
                      en: "Number of monthly payments in the loan.",
                      sv: "Antal månadsbetalningar i lånet.",
                    })}
                    required
                  />
                </div>
              </Section>
            )}

            {/* ── Leasing main fields ──────────────────────────────────── */}
            {car.financingMode === "leasing" && (
              <Section label={t({ en: "Lease details", sv: "Leasingdetaljer" })}>
                <div className={formGridClass}>
                  <NumericInput
                    label={t({ en: "Monthly fee", sv: "Månadsavgift" })}
                    unit={`${currencyUnit}/${t({ en: "mo", sv: "mån" })}`}
                    value={car.leasing.monthlyLeaseCost}
                    onChange={(v) => updateLeasing({ monthlyLeaseCost: v })}
                    step={100}
                    hint={t({
                      en: "Base lease payment per month.",
                      sv: "Grundavgift för leasing per månad.",
                    })}
                    required
                  />
                  <NumericInput
                    label={t({ en: "Contract term", sv: "Avtalstid" })}
                    unit={t({ en: "months", sv: "månader" })}
                    value={car.leasing.leaseDurationMonths}
                    onChange={(v) => updateLeasing({ leaseDurationMonths: Math.max(1, v) })}
                    min={1}
                    hint={t({
                      en: "Lease duration in months.",
                      sv: "Leasingperiod i månader.",
                    })}
                    required
                  />
                  <NumericInput
                    label={t({ en: "First payment", sv: "Första betalning" })}
                    unit={currencyUnit}
                    value={car.leasing.downPayment}
                    onChange={(v) => updateLeasing({ downPayment: v })}
                    step={1000}
                    hint={t({
                      en: "One-time upfront payment at lease start.",
                      sv: "Engångsbetalning i början av avtalet.",
                    })}
                  />
                  <NumericInput
                    label={t({ en: "Included mileage", sv: "Inkluderad körsträcka" })}
                    unit="km/yr"
                    value={car.leasing.includedMileage}
                    onChange={(v) => updateLeasing({ includedMileage: v })}
                    step={1000}
                    hint={t({
                      en: "Annual mileage included before excess-km charges.",
                      sv: "Årlig körsträcka som ingår innan övermil debiteras.",
                    })}
                    required
                  />
                </div>
              </Section>
            )}

            {/* Running costs */}
            <Section label={t({ en: "Running costs", sv: "Löpande kostnader" })}>
              <div className={formGridClass}>
                <NumericInput
                  label={t({ en: "Fuel price", sv: "Bränslepris" })}
                  unit={priceLabel}
                  value={car.fuelPrice}
                  onChange={(v) => update({ fuelPrice: v })}
                  step={0.1}
                  hint={fuelPriceHint}
                  required
                />
                <NumericInput
                  label={t({ en: "Insurance", sv: "Försäkring" })}
                  unit={`${currencyUnit}/${t({ en: "yr", sv: "år" })}`}
                  value={car.insuranceCost}
                  onChange={(v) => update({ insuranceCost: v })}
                  step={100}
                  hint={t({
                    en: "Expected yearly insurance premium.",
                    sv: "Förväntad årlig försäkringskostnad.",
                  })}
                />
                <div className="space-y-2">
                  <NumericInput
                    label={t({ en: "Road tax", sv: "Fordonsskatt" })}
                    unit={`${currencyUnit}/${t({ en: "yr", sv: "år" })}`}
                    value={car.taxCost}
                    onChange={(v) => onChange({ ...car, taxCost: v, taxCostSource: "manual" })}
                    step={100}
                    hint={t({
                      en: "Estimated yearly Swedish vehicle tax. You can override it manually.",
                      sv: "Uppskattad årlig svensk fordonsskatt. Du kan justera den manuellt.",
                    })}
                  />
                  {car.taxCostSource === "estimated" && (
                    <p className="text-[9px] text-muted-foreground/80 whitespace-nowrap overflow-x-auto">
                      {estimatedTaxLabel}
                    </p>
                  )}
                </div>
                <NumericInput
                  label={t({ en: "Service & maint.", sv: "Service & underhåll" })}
                  unit={`${currencyUnit}/${t({ en: "yr", sv: "år" })}`}
                  value={car.serviceCost}
                  onChange={(v) => update({ serviceCost: v })}
                  step={100}
                  hint={t({
                    en: "Expected yearly service and maintenance costs.",
                    sv: "Förväntade årliga service- och underhållskostnader.",
                  })}
                />
              </div>
            </Section>

            {/* Loan optional extras */}
            {car.financingMode === "loan" && (
              <Section label={t({ en: "Loan — optional", sv: "Lån — valfritt" })}>
                <div className={formGridClass}>
                  <NumericInput
                    label={t({ en: "Balloon payment", sv: "Restskuld" })}
                    unit={currencyUnit}
                    value={car.loan.residualBalloon}
                    onChange={(v) => updateLoan({ residualBalloon: v })}
                    hint={t({
                      en: "Optional lump sum paid at the end of the loan.",
                      sv: "Valfritt klumpsummebelopp som betalas vid lånets slut.",
                    })}
                  />
                  <NumericInput
                    label={t({ en: "Monthly admin fee", sv: "Månadsavgift admin" })}
                    unit={`${currencyUnit}/${t({ en: "mo", sv: "mån" })}`}
                    value={car.loan.monthlyAdminFee}
                    onChange={(v) => updateLoan({ monthlyAdminFee: v })}
                    hint={t({
                      en: "Extra monthly bank or administration fee.",
                      sv: "Extra månadsavgift för bank eller administration.",
                    })}
                  />
                </div>
              </Section>
            )}

            {/* Lease optional extras */}
            {car.financingMode === "leasing" && (
              <Section label={t({ en: "Lease — optional", sv: "Leasing — valfritt" })}>
                <div className={formGridClass}>
                  <NumericInput
                    label={t({ en: "Excess km cost", sv: "Övermilkostnad" })}
                    unit={`${currencyUnit}/km`}
                    value={car.leasing.excessMileageCostPerKm}
                    onChange={(v) => updateLeasing({ excessMileageCostPerKm: v })}
                    step={0.1}
                    hint={t({
                      en: "Fee charged per km above included mileage.",
                      sv: "Avgift per km över inkluderad körsträcka.",
                    })}
                  />
                  <NumericInput
                    label={t({ en: "End-of-term fee", sv: "Slutavgift" })}
                    unit={currencyUnit}
                    value={car.leasing.endOfTermFee}
                    onChange={(v) => updateLeasing({ endOfTermFee: v })}
                    hint={t({
                      en: "One-time fee charged when the lease ends.",
                      sv: "Engångsavgift när leasingperioden avslutas.",
                    })}
                  />
                </div>
              </Section>
            )}
          </div>
        </>
      )}
    </div>
  );
}
