import http from "node:http";
import { pathToFileURL } from "node:url";

const PORT = Number(process.env.CARAI_PROXY_PORT ?? process.env.GROK_PROXY_PORT ?? 8787);
const XAI_API_URL = process.env.XAI_API_URL ?? "https://api.x.ai/v1/chat/completions";
const XAI_MODEL = process.env.XAI_MODEL ?? "grok-3-mini";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_REQUEST_SIZE_BYTES = 1_000_000;
const MAX_HISTORY_MESSAGES = 10;
const BILWEB_SEARCH_BASE_URL = "https://bilweb.se/sok";
const BILWEB_FILTER_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const EU_EV_CATALOG_URL =
  "https://alternative-fuels-observatory.ec.europa.eu/markets-and-policy/market-and-consumer-insights/available-electric-vehicle-models";
const EU_EV_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const EU_MODEL_SUFFIXES = [
  "allgrip",
  "standard range",
  "long range",
  "launch edition",
  "first edition",
  "single motor",
  "dual motor",
  "twin motor",
  "performance",
  "endurance",
  "excellence",
  "premium",
  "comfort",
  "luxury",
  "ultimate",
  "business",
  "touring",
  "tourer",
  "executive",
  "quattro",
  "xdrive",
  "4motion",
  "all-wheel drive",
  "rear-wheel drive",
  "front-wheel drive",
  "awd",
  "rwd",
  "fwd",
  "4wd",
  "4x4",
  "gtx",
  "gt",
  "vz",
  "pro",
  "plus",
  "max",
  "pure",
];
const EU_MULTI_WORD_BRANDS = [
  "Alfa Romeo",
  "Aston Martin",
  "Bugatti Rimac",
  "DS Automobiles",
  "Hongqi",
  "Land Rover",
  "Leapmotor",
  "Lynk & Co",
  "Mercedes-Benz",
  "Rolls-Royce",
];

let euEvCatalogCache = {
  expiresAt: 0,
  variants: [],
};
const bilwebBrandFilterCache = new Map();

function setJsonHeaders(res) {
  const allowOrigin = process.env.CARAI_ALLOWED_ORIGIN ?? process.env.GROK_ALLOWED_ORIGIN ?? "*";
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

function sendJson(res, statusCode, payload) {
  setJsonHeaders(res);
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

function buildSystemPrompt(comparisonContext) {
  const basePrompt = [
    "You are CarAI, an assistant that helps users compare car ownership costs.",
    "Be concise, practical, and transparent about uncertainty.",
    "Use the provided comparison context as the source of truth for numeric values.",
    "If data is missing, ask a short follow-up question instead of inventing numbers.",
  ].join(" ");

  if (!comparisonContext || !comparisonContext.trim()) {
    return `${basePrompt} No cars are configured yet, so provide general guidance until data is available.`;
  }

  return `${basePrompt}\n\nCurrent comparison context:\n${comparisonContext.trim()}`;
}

function normalizeAssistantContent(content) {
  if (typeof content === "string") return content.trim();

  if (Array.isArray(content)) {
    const textParts = content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          if (typeof item.text === "string") return item.text;
          if (typeof item.content === "string") return item.content;
        }
        return "";
      })
      .filter(Boolean);
    return textParts.join("\n").trim();
  }

  return "";
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .slice(-MAX_HISTORY_MESSAGES)
    .map((item) => {
      const role = item?.role === "assistant" ? "assistant" : "user";
      const content = typeof item?.content === "string" ? item.content.trim() : "";
      if (!content) return null;
      return { role, content };
    })
    .filter(Boolean);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_REQUEST_SIZE_BYTES) {
        reject(new Error("Request body too large."));
        req.destroy();
      }
    });

    req.on("end", () => resolve(body));
    req.on("error", (error) => reject(error));
  });
}

function normalizeLookupText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&euro;/g, "EUR")
    .replace(/&#x20;/g, " ")
    .replace(/&#(\d+);/g, (_, codePoint) => String.fromCharCode(Number(codePoint)))
    .replace(/&#x([0-9a-f]+);/gi, (_, codePoint) => String.fromCharCode(parseInt(codePoint, 16)));
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function parseLeadingNumber(value) {
  if (!value) return null;
  const match = value.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePriceNumber(value) {
  if (!value) return null;
  const digits = value.replace(/[^0-9]/g, "");
  if (!digits) return null;
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : null;
}

function slugifyMarketSegment(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildBilwebModelCandidates(model) {
  const trimTokens = new Set([
    "awd", "business", "comfort", "competition", "convertible", "coupe", "cross", "dual",
    "drive", "edition", "electric", "excellence", "fwd", "gdi", "grand", "gt", "gti", "gtx",
    "hev", "hybrid", "kwh", "long", "max", "mhev", "motor", "performance", "phev", "plus",
    "premium", "pro", "quattro", "range", "recharge", "rwd", "sedan", "single", "speciale",
    "sportback", "spider", "suv", "touring", "turbo", "ultimate", "wagon", "wltp", "xdrive",
  ]);
  const normalizedTokens = String(model || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const candidates = [];
  const pushCandidate = (tokens) => {
    const slug = slugifyMarketSegment(tokens.join(" "));
    if (slug && !candidates.includes(slug)) candidates.push(slug);
  };

  for (let length = normalizedTokens.length; length >= 1; length -= 1) {
    pushCandidate(normalizedTokens.slice(0, length));
  }

  const familyTokens = normalizedTokens.filter((token, index) => {
    if (index === 0) return true;
    if (/^\d+(?:[.,]\d+)?$/.test(token)) return false;
    return !trimTokens.has(token);
  });

  for (let length = familyTokens.length; length >= 1; length -= 1) {
    pushCandidate(familyTokens.slice(0, length));
  }

  return candidates.slice(0, 6);
}

function parseBilwebListings(html) {
  const cards = [...html.matchAll(/<div class="Card " id="(\d+)">([\s\S]*?)<dl class="Card-carData">([\s\S]*?)<\/dl>/g)];
  const listings = [];
  const seenIds = new Set();

  cards.forEach((match) => {
    const listingId = match[1];
    if (seenIds.has(listingId)) return;
    seenIds.add(listingId);

    const body = match[0];
    const priceMatch = body.match(/Card-mainPrice[^>]*>\s*([\d\s]+)\s*kr/i);
    const yearMatch = body.match(/<dt>År:<\/dt>\s*<dd>(\d{4})<\/dd>/i);
    const titleMatch = body.match(/go_to_detail"[^>]*>([^<]+)<\/a>/i);
    const detailUrlMatch = body.match(/<a class="go_to_detail" href="([^"]+)"/i);
    const modelNameMatch = body.match(/data-model-name="([^"]+)"/i);
    const priceSek = parsePriceNumber(priceMatch?.[1] ?? "");
    const year = yearMatch ? Number(yearMatch[1]) : null;
    const detailUrl = detailUrlMatch?.[1]?.trim() ?? "";
    const modelName = stripTags(modelNameMatch?.[1] ?? "");

    if (!priceSek || !year || !detailUrl) return;

    listings.push({
      id: listingId,
      title: stripTags(titleMatch?.[1] ?? ""),
      detailUrl,
      modelName,
      priceSek,
      year,
    });
  });

  return listings;
}

function parseBilwebSelectOptions(html, selectName) {
  const selectMatch = html.match(
    new RegExp(`<select[^>]*name="${selectName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>([\\s\\S]*?)<\\/select>`, "i"),
  );
  if (!selectMatch) return [];

  return [...selectMatch[1].matchAll(/<option value="([^"]*)"[^>]*>([\s\S]*?)<\/option>/gi)]
    .map((match) => ({
      value: match[1].trim(),
      label: stripTags(match[2]),
    }))
    .filter((option) => option.value && option.label);
}

function parseBilwebBrandFilters(html, brand) {
  const brandOptions = parseBilwebSelectOptions(html, "brand");
  const brandKey = normalizeLookupText(brand);
  const brandOption = brandOptions.find((option) => normalizeLookupText(option.label) === brandKey);
  if (!brandOption) return null;

  const modelOptions = parseBilwebSelectOptions(html, "model[]").map((option) => ({
    id: option.value,
    label: option.label,
    key: normalizeLookupText(option.label),
  }));

  return {
    brandId: brandOption.value,
    modelOptions,
  };
}

async function fetchBilwebBrandFilters(brand) {
  const brandKey = normalizeLookupText(brand);
  const cached = bilwebBrandFilterCache.get(brandKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const brandSlug = slugifyMarketSegment(brand);
  const response = await fetch(`${BILWEB_SEARCH_BASE_URL}/${brandSlug}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) return null;

  const html = await response.text();
  const filters = parseBilwebBrandFilters(html, brand);
  if (!filters) return null;

  bilwebBrandFilterCache.set(brandKey, {
    expiresAt: Date.now() + BILWEB_FILTER_CACHE_TTL_MS,
    value: filters,
  });
  return filters;
}

function buildBilwebModelKeys(model) {
  return buildBilwebModelCandidates(model)
    .map((candidate) => normalizeLookupText(candidate))
    .filter(Boolean);
}

function findBilwebModelFilter(modelOptions, model) {
  const modelKeys = buildBilwebModelKeys(model);
  let bestMatch = null;
  let bestScore = -1;

  modelOptions.forEach((option) => {
    modelKeys.forEach((modelKey) => {
      if (!modelKey || !option.key) return;

      let score = -1;
      if (option.key === modelKey) {
        score = 1000 + option.key.length;
      } else if (modelKey.includes(option.key)) {
        score = 500 + option.key.length;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = option;
      }
    });
  });

  return bestMatch;
}

function listingMatchesBilwebModel(listing, modelKeys) {
  if (modelKeys.length === 0) return true;

  const listingModelKey = normalizeLookupText(listing.modelName);
  const listingTitleKey = normalizeLookupText(listing.title);

  return modelKeys.some((modelKey) => {
    if (!modelKey) return false;
    if (listingModelKey === modelKey) return true;
    if (listingModelKey && (listingModelKey.includes(modelKey) || modelKey.includes(listingModelKey))) return true;
    return listingTitleKey.includes(modelKey);
  });
}

function getBilwebListingsForExactModel(listings, model) {
  const exactModelKey = normalizeLookupText(model);
  if (!exactModelKey) return [];

  return listings.filter((listing) => listingMatchesBilwebModel(listing, [exactModelKey]));
}

function roundToNearestThousand(value) {
  return Math.round(value / 1000) * 1000;
}

function averagePrice(listings) {
  if (listings.length === 0) return null;
  const total = listings.reduce((sum, listing) => sum + listing.priceSek, 0);
  return roundToNearestThousand(total / listings.length);
}

function buildBilwebFilteredSearchUrl(brandId, modelId, year) {
  const searchParams = new URLSearchParams({
    type: "1",
    brand: String(brandId),
    year_min: String(year),
    year_max: String(year),
    offset: "0",
    limit: "30",
    order_by: "timestamp",
    order: "desc",
  });
  searchParams.append("model[]", String(modelId));
  return `${BILWEB_SEARCH_BASE_URL}?${searchParams.toString()}`;
}

function buildBilwebModelOnlySearchUrl(brandId, modelId) {
  const searchParams = new URLSearchParams({
    type: "1",
    brand: String(brandId),
    offset: "0",
    limit: "30",
    order_by: "timestamp",
    order: "desc",
  });
  searchParams.append("model[]", String(modelId));
  return `${BILWEB_SEARCH_BASE_URL}?${searchParams.toString()}`;
}

async function fetchBilwebMarketPrice(brand, model, year) {
  const filters = await fetchBilwebBrandFilters(brand);
  if (!filters) return null;

  const selectedModelFilter = findBilwebModelFilter(filters.modelOptions, model);
  if (!selectedModelFilter) return null;

  const modelKeys = buildBilwebModelKeys(model);
  const candidateUrls = [
    buildBilwebFilteredSearchUrl(filters.brandId, selectedModelFilter.id, year),
    buildBilwebModelOnlySearchUrl(filters.brandId, selectedModelFilter.id),
  ];

  for (const url of candidateUrls) {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) continue;

    const html = await response.text();
    const listings = parseBilwebListings(html);
    if (listings.length === 0) continue;

    const exactModelListings = getBilwebListingsForExactModel(listings, model);
    const matchingListings = exactModelListings.length > 0
      ? exactModelListings
      : listings.filter((listing) => listingMatchesBilwebModel(listing, modelKeys));
    if (matchingListings.length === 0) continue;

    const exactYearListings = matchingListings.filter((listing) => listing.year === year);
    const nearbyYearListings = matchingListings.filter((listing) => Math.abs(listing.year - year) <= 1);
    const selectedListings =
      exactYearListings.length > 0
        ? exactYearListings
        : nearbyYearListings.length > 0
          ? nearbyYearListings
          : matchingListings;
    const matchType =
      exactModelListings.length === 0
        ? "model_family"
        : exactYearListings.length > 0
          ? "exact_year"
          : nearbyYearListings.length > 0
            ? "nearby_year"
            : "model_family";
    const priceSek = averagePrice(selectedListings);
    if (!priceSek) continue;

    return {
      priceSek,
      sampleSize: selectedListings.length,
      provider: "bilweb",
      providerLabel: "Bilweb",
      sourceUrl: url,
      matchType,
    };
  }

  return null;
}

async function handleMarketPrice(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const brand = url.searchParams.get("brand")?.trim() ?? "";
  const model = url.searchParams.get("model")?.trim() ?? "";
  const year = Number(url.searchParams.get("year") ?? "");

  if (!brand || !model || !Number.isFinite(year)) {
    sendJson(res, 400, { error: "`brand`, `model`, and `year` are required." });
    return;
  }

  try {
    const estimate = await fetchBilwebMarketPrice(brand, model, year);
    sendJson(res, 200, { estimate });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load Swedish market price listings.";
    sendJson(res, 502, { error: message });
  }
}

function parseEuEvPageCount(html) {
  const pageMatches = [...html.matchAll(/\?page=(\d+)/g)].map((match) => Number(match[1]));
  return pageMatches.length > 0 ? Math.max(...pageMatches) + 1 : 1;
}

function parseEuEvVariantsFromHtml(html) {
  const rows = [...html.matchAll(/<tr class="ecl-table__row">([\s\S]*?)<\/tr>/g)];

  return rows
    .map((match, index) => {
      const rowHtml = match[1];
      const getCell = (header) => {
        const cellMatch = rowHtml.match(
          new RegExp(`data-ecl-table-header="${header}">([\\s\\S]*?)<\\/td>`, "i"),
        );
        return cellMatch ? stripTags(cellMatch[1]) : "";
      };

      const title = getCell("Model");
      if (!title) return null;

      const availableFrom = getCell("Available from");
      const availableFromYear = availableFrom
        ? Number(availableFrom.slice(-4))
        : null;

      const brand =
        EU_MULTI_WORD_BRANDS.find((candidate) =>
          normalizeLookupText(title).startsWith(normalizeLookupText(candidate)),
        ) ??
        (title.split(/\s+/)[0] ?? "");

      return {
        id: `${normalizeLookupText(title)}-${index}`,
        brand,
        title,
        modelHint: title,
        availableFrom,
        availableFromYear: Number.isFinite(availableFromYear) ? availableFromYear : null,
        efficiencyKwh100km: parseLeadingNumber(getCell("Efficiency")) ?? 0,
        batteryKwh: parseLeadingNumber(getCell("Battery size")),
        rangeKm: parseLeadingNumber(getCell("Range")),
        priceEur: parsePriceNumber(getCell("Price (approx.)")),
        source: "eu-afo",
      };
    })
    .filter(Boolean);
}

function deriveEuBaseModel(brand, title) {
  let model = String(title || "").trim();
  const normalizedBrand = normalizeLookupText(brand);
  const normalizedTitle = normalizeLookupText(model);

  if (normalizedBrand && normalizedTitle.startsWith(normalizedBrand)) {
    model = model.slice(String(brand).length).trim();
  }

  return model.replace(/\s+/g, " ").trim() || String(title || "").trim();
}

async function loadEuEvCatalog() {
  if (euEvCatalogCache.expiresAt > Date.now() && euEvCatalogCache.variants.length > 0) {
    return euEvCatalogCache.variants;
  }

  const firstPageResponse = await fetch(EU_EV_CATALOG_URL, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!firstPageResponse.ok) {
    throw new Error("Failed to load EU EV catalog.");
  }

  const firstPageHtml = await firstPageResponse.text();
  const pageCount = parseEuEvPageCount(firstPageHtml);
  const variants = parseEuEvVariantsFromHtml(firstPageHtml);

  for (let page = 1; page < pageCount; page += 1) {
    const response = await fetch(`${EU_EV_CATALOG_URL}?page=${page}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) continue;

    variants.push(...parseEuEvVariantsFromHtml(await response.text()));
  }

  euEvCatalogCache = {
    expiresAt: Date.now() + EU_EV_CACHE_TTL_MS,
    variants,
  };

  return variants;
}

function filterEuEvVariants(variants, brand, model, year) {
  const normalizedBrand = normalizeLookupText(brand);
  const normalizedModel = normalizeLookupText(model);

  return variants.filter((variant) => {
    const normalizedTitle = normalizeLookupText(variant.title);
    const brandMatches =
      normalizeLookupText(variant.brand) === normalizedBrand ||
      normalizedTitle.startsWith(normalizedBrand);
    const modelMatches = normalizedModel
      ? normalizedTitle.includes(normalizedModel)
      : true;
    const yearMatches = variant.availableFromYear ? variant.availableFromYear <= year : true;

    return brandMatches && modelMatches && yearMatches;
  });
}

function listEuEvBrands(variants, year) {
  return [...new Set(
    variants
      .filter((variant) => (variant.availableFromYear ? variant.availableFromYear <= year : true))
      .map((variant) => variant.brand)
      .filter(Boolean),
  )].sort((a, b) => a.localeCompare(b));
}

function listEuEvModels(variants, brand, year) {
  const normalizedBrand = normalizeLookupText(brand);
  const detailedModels = new Map();

  variants.forEach((variant) => {
    const yearMatches = variant.availableFromYear ? variant.availableFromYear <= year : true;
    const brandMatches = normalizeLookupText(variant.brand) === normalizedBrand;
    if (!yearMatches || !brandMatches) return;

    const detailedModel = deriveEuBaseModel(variant.brand, variant.title);
    if (!detailedModel) return;

    const modelKey = normalizeLookupText(detailedModel);
    if (!modelKey) return;

    const existing = detailedModels.get(modelKey) ?? {
      model: detailedModel,
      fuelType: "electric",
      variantCount: 1,
      averageEfficiencyKwh100km: variant.efficiencyKwh100km,
      averagePriceEur: variant.priceEur ?? null,
    };

    if (
      existing.model !== detailedModel &&
      detailedModel.length > existing.model.length
    ) {
      existing.model = detailedModel;
    }
    if (!existing.averagePriceEur && variant.priceEur) {
      existing.averagePriceEur = variant.priceEur;
    }
    detailedModels.set(modelKey, existing);
  });

  return [...detailedModels.values()]
    .sort((a, b) => a.model.localeCompare(b.model));
}

async function handleEuEvBrands(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const year = Number(url.searchParams.get("year") ?? "") || new Date().getFullYear();

  try {
    const catalog = await loadEuEvCatalog();
    sendJson(res, 200, { brands: listEuEvBrands(catalog, year) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load EU EV brand catalog.";
    sendJson(res, 502, { error: message });
  }
}

async function handleEuEvModels(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const brand = url.searchParams.get("brand")?.trim() ?? "";
  const year = Number(url.searchParams.get("year") ?? "") || new Date().getFullYear();

  if (!brand) {
    sendJson(res, 400, { error: "`brand` is required." });
    return;
  }

  try {
    const catalog = await loadEuEvCatalog();
    sendJson(res, 200, { models: listEuEvModels(catalog, brand, year) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load EU EV model catalog.";
    sendJson(res, 502, { error: message });
  }
}

async function handleEuEvLookup(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const brand = url.searchParams.get("brand")?.trim() ?? "";
  const model = url.searchParams.get("model")?.trim() ?? "";
  const year = Number(url.searchParams.get("year") ?? "");

  if (!brand) {
    sendJson(res, 400, { error: "`brand` is required." });
    return;
  }

  try {
    const catalog = await loadEuEvCatalog();
    const variants = filterEuEvVariants(
      catalog,
      brand,
      model,
      Number.isFinite(year) ? year : new Date().getFullYear(),
    );

    sendJson(res, 200, { variants });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load EU EV lookup data.";
    sendJson(res, 502, { error: message });
  }
}

async function handleChat(req, res) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, {
      error: "Missing XAI_API_KEY on server.",
    });
    return;
  }

  let parsed;
  try {
    const body = await readBody(req);
    parsed = JSON.parse(body || "{}");
  } catch {
    sendJson(res, 400, { error: "Invalid JSON payload." });
    return;
  }

  const message = typeof parsed?.message === "string" ? parsed.message.trim() : "";
  const comparisonContext =
    typeof parsed?.comparisonContext === "string" ? parsed.comparisonContext : "";

  if (!message) {
    sendJson(res, 400, { error: "`message` is required." });
    return;
  }

  const messages = [
    {
      role: "system",
      content: buildSystemPrompt(comparisonContext),
    },
    ...sanitizeHistory(parsed?.history),
    {
      role: "user",
      content: message,
    },
  ];

  try {
    const response = await fetch(XAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: XAI_MODEL,
        temperature: 0.4,
        max_tokens: 700,
        messages,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const upstreamError =
        data?.error?.message || data?.message || "CarAI request failed at upstream API.";
      sendJson(res, response.status, { error: upstreamError });
      return;
    }

    const reply = normalizeAssistantContent(data?.choices?.[0]?.message?.content);

    if (!reply) {
      sendJson(res, 502, { error: "CarAI provider returned an empty response." });
      return;
    }

    sendJson(res, 200, {
      reply,
      model: data?.model || XAI_MODEL,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reach CarAI provider API.";
    sendJson(res, 502, { error: message });
  }
}

export async function handleCarAiRequest(req, res) {
  if (req.method === "OPTIONS") {
    setJsonHeaders(res);
    res.statusCode = 204;
    res.end();
    return;
  }

  const requestPath = new URL(req.url || "/", `http://${req.headers.host}`).pathname;

  const isChatPath = requestPath === "/api/carai-chat" || requestPath === "/api/grok-chat";
  const isEuEvPath = requestPath === "/api/eu-ev-lookup";
  const isEuEvBrandsPath = requestPath === "/api/eu-ev-brands";
  const isEuEvModelsPath = requestPath === "/api/eu-ev-models";
  const isMarketPricePath = requestPath === "/api/market-price";

  if (!isChatPath && !isEuEvPath && !isEuEvBrandsPath && !isEuEvModelsPath && !isMarketPricePath) {
    sendJson(res, 404, { error: "Not found." });
    return;
  }

  if (isEuEvPath || isEuEvBrandsPath || isEuEvModelsPath || isMarketPricePath) {
    if (req.method !== "GET") {
      sendJson(res, 405, { error: "Method not allowed." });
      return;
    }

    if (isEuEvPath) {
      await handleEuEvLookup(req, res);
      return;
    }

    if (isEuEvBrandsPath) {
      await handleEuEvBrands(req, res);
      return;
    }

    if (isMarketPricePath) {
      await handleMarketPrice(req, res);
      return;
    }

    await handleEuEvModels(req, res);
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  await handleChat(req, res);
}

const isDirectExecution =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
  const server = http.createServer(handleCarAiRequest);
  server.listen(PORT, () => {
    console.log(`CarAI proxy listening on http://localhost:${PORT}`);
  });
}
