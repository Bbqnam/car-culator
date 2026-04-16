export interface VerifiedOfficialPrice {
  priceSek: number;
  providerName: string;
  sourceUrl: string;
  checkedAt: string;
  matchedModel: string;
  matchConfidence: "exact" | "family";
}

interface OfficialCarPriceSource {
  brand: string;
  model: string;
  priceSek: number;
  providerName: string;
  sourceUrl: string;
  checkedAt: string;
  matchAliases?: string[];
}

const OFFICIAL_CAR_PRICE_SOURCES: OfficialCarPriceSource[] = [
  {
    brand: "Volvo",
    model: "EX30 Cross Country",
    priceSek: 542000,
    providerName: "Volvo Cars Sverige",
    sourceUrl: "https://www.volvocars.com/se/cars/ex30-electric/",
    checkedAt: "2026-04-02",
  },
  {
    brand: "Volvo",
    model: "EX30",
    priceSek: 429000,
    providerName: "Volvo Cars Sverige",
    sourceUrl: "https://www.volvocars.com/se/cars/ex30-electric/",
    checkedAt: "2026-04-02",
  },
  {
    brand: "Volvo",
    model: "EX40",
    priceSek: 529900,
    providerName: "Volvo Cars Sverige",
    sourceUrl: "https://www.volvocars.com/se/cars/ex40-electric/specifications/",
    checkedAt: "2026-04-02",
  },
  {
    brand: "Volvo",
    model: "EX90",
    priceSek: 899000,
    providerName: "Volvo Cars Sverige",
    sourceUrl: "https://www.volvocars.com/se/cars/ex90-electric/specifications/",
    checkedAt: "2026-04-02",
  },
  {
    brand: "Volkswagen",
    model: "ID.3",
    priceSek: 382300,
    providerName: "Volkswagen Sverige",
    sourceUrl: "https://www.volkswagen.se/sv/elbilar/vara-elbilar/id3.html",
    checkedAt: "2026-04-02",
  },
  {
    brand: "Volkswagen",
    model: "ID.4",
    priceSek: 529700,
    providerName: "Volkswagen Sverige",
    sourceUrl: "https://www.volkswagen.se/sv/elbilar/vara-elbilar/id4.html",
    checkedAt: "2026-04-02",
  },
  {
    brand: "Volkswagen",
    model: "ID.7",
    priceSek: 589900,
    providerName: "Volkswagen Sverige",
    sourceUrl: "https://www.volkswagen.se/sv/elbilar/vara-elbilar/id7.html",
    checkedAt: "2026-04-02",
  },
  {
    brand: "Polestar",
    model: "Polestar 2",
    priceSek: 599000,
    providerName: "Polestar Sverige",
    sourceUrl: "https://www.polestar.com/se/polestar-2/upgrades/",
    checkedAt: "2026-04-02",
  },
  {
    brand: "Polestar",
    model: "Polestar 3",
    priceSek: 890000,
    providerName: "Polestar Sverige",
    sourceUrl: "https://www.polestar.com/se/polestar-3/",
    checkedAt: "2026-04-02",
  },
  {
    brand: "Polestar",
    model: "Polestar 4",
    priceSek: 692000,
    providerName: "Polestar Sverige",
    sourceUrl: "https://www.polestar.com/se/polestar-4/",
    checkedAt: "2026-04-02",
  },
  {
    brand: "Toyota",
    model: "bZ4X",
    priceSek: 479900,
    providerName: "Toyota Sverige",
    sourceUrl: "https://www.toyota.se/elbilar/batteribilar",
    checkedAt: "2026-04-02",
    matchAliases: ["Toyota bZ4X", "Nya Toyota bZ4X"],
  },
  {
    brand: "Hyundai",
    model: "Ioniq 5",
    priceSek: 549900,
    providerName: "Hyundai Sverige",
    sourceUrl: "https://www.hyundai.com/se/sv/kop/kop/konfigurator.html",
    checkedAt: "2026-04-02",
    matchAliases: ["IONIQ 5"],
  },
  {
    brand: "Kia",
    model: "EV6",
    priceSek: 596400,
    providerName: "Kia Sverige",
    sourceUrl: "https://www.kia.com/se/om-kia/kommande-modeller/ev6/",
    checkedAt: "2026-04-02",
    matchAliases: ["Kia EV6"],
  },
  {
    brand: "Kia",
    model: "EV9",
    priceSek: 689900,
    providerName: "Kia Sverige",
    sourceUrl: "https://www.kia.com/se/nya-bilar/ev9/reveal/",
    checkedAt: "2026-04-02",
    matchAliases: ["Kia EV9"],
  },
  {
    brand: "Renault",
    model: "Scenic E-Tech",
    priceSek: 479900,
    providerName: "Renault Sverige",
    sourceUrl: "https://www.renault.se/personbilar/elbilar/scenic-e-tech-electric/versioner-och-priser",
    checkedAt: "2026-04-02",
    matchAliases: ["Scenic E-Tech electric", "Scenic E-Tech Electric", "Scenic"],
  },
];

function normalizeSearchKey(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getModelMatchScore(source: OfficialCarPriceSource, model: string): number {
  const selectedModel = normalizeSearchKey(model);
  const candidates = [source.model, ...(source.matchAliases ?? [])];

  return candidates.reduce((bestScore, candidate) => {
    const normalizedCandidate = normalizeSearchKey(candidate);
    if (!normalizedCandidate) return bestScore;

    if (normalizedCandidate === selectedModel) {
      return Math.max(bestScore, 1000 + normalizedCandidate.length);
    }

    if (selectedModel.includes(normalizedCandidate)) {
      return Math.max(bestScore, 500 + normalizedCandidate.length);
    }

    if (normalizedCandidate.includes(selectedModel)) {
      return Math.max(bestScore, 300 + selectedModel.length);
    }

    return bestScore;
  }, 0);
}

function getMatchConfidence(score: number): "exact" | "family" {
  return score >= 1000 ? "exact" : "family";
}

export function findVerifiedOfficialPrice(
  brand?: string,
  model?: string,
  modelYear?: number,
  currentYear = new Date().getFullYear(),
): VerifiedOfficialPrice | null {
  if (!brand || !model) return null;
  if (typeof modelYear === "number" && modelYear < currentYear - 1) return null;

  const normalizedBrand = normalizeSearchKey(brand);
  const matches = OFFICIAL_CAR_PRICE_SOURCES
    .map((source) => ({
      source,
      score:
        normalizeSearchKey(source.brand) === normalizedBrand
          ? getModelMatchScore(source, model)
          : 0,
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (left.source.checkedAt !== right.source.checkedAt) {
        return right.source.checkedAt.localeCompare(left.source.checkedAt);
      }

      return left.source.priceSek - right.source.priceSek;
    });

  const bestMatch = matches[0]?.source;
  if (!bestMatch) return null;

  return {
    priceSek: bestMatch.priceSek,
    providerName: bestMatch.providerName,
    sourceUrl: bestMatch.sourceUrl,
    checkedAt: bestMatch.checkedAt,
    matchedModel: bestMatch.model,
    matchConfidence: getMatchConfidence(matches[0]?.score ?? 0),
  };
}
