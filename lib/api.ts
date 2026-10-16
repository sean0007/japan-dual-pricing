import { InputError, num, type Endpoint, type Input } from "./agent-api";
import { DISCLAIMER, PLACES, RESIDENCES, RuleInputError, STATUS_FILTERS, checkDualPricing, validDate, type Residence } from "./dual";
import { SITE_NAME, SITE_TAGLINE } from "./site";

export const PUBLIC_URL = "https://japan-dual-pricing.vercel.app";
export const API_DISCLAIMER = DISCLAIMER;
export const API_INFO = { title: `${SITE_NAME} API`, description: SITE_TAGLINE, version: "1.0.0" };

export const EXAMPLE_GET = "/api/check?places=himeji-castle,odawara-castle,nanzoin&residence=overseas&date=2026-11-20";

function first(v: unknown): unknown {
  return Array.isArray(v) ? v[0] : v;
}
function text(input: Input, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = first(input[k]);
    if (v === undefined || v === null || String(v).trim() === "") continue;
    return String(v).trim();
  }
  return null;
}

export function parsePlaces(raw: unknown): string[] {
  if (raw === undefined || raw === null) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.flatMap((x) => String(x).split(/[,、|]/)).map((s) => s.trim()).filter(Boolean);
}

export function computeCheck(input: Input) {
  try {
    const places = parsePlaces(input.places ?? input.place ?? input.sites);
    const r = text(input, "residence", "livesIn", "from");
    let residence: Residence | undefined;
    if (r) {
      const low = r.toLowerCase();
      if (["overseas", "abroad", "tourist", "visitor", "foreign", "non-resident", "nonresident"].includes(low)) residence = "overseas";
      else if (["japan", "jp", "resident", "日本", "japan-resident"].includes(low)) residence = "japan";
      else throw new InputError(`Invalid residence "${r}". Allowed: ${RESIDENCES.join(", ")} (add prefecture and city if you live in Japan).`);
    }
    const ageRaw = first(input.age);
    const age = ageRaw === undefined || ageRaw === null || ageRaw === "" ? null : num({ v: ageRaw }, "v");
    const date = text(input, "date", "visitDate");
    if (date && !validDate(date)) throw new InputError("date must be YYYY-MM-DD");
    const status = text(input, "status");
    if (status && !(STATUS_FILTERS as readonly string[]).includes(status)) throw new InputError(`Invalid status filter. Allowed: ${STATUS_FILTERS.join(", ")}`);
    return checkDualPricing({
      places,
      residence,
      prefecture: text(input, "prefecture", "pref"),
      city: text(input, "city", "municipality"),
      age,
      date,
      area: text(input, "area", "in"),
      status: (status as (typeof STATUS_FILTERS)[number] | null) ?? null,
    });
  } catch (e) {
    if (e instanceof RuleInputError) throw new InputError(e.message);
    throw e;
  }
}

export const ENDPOINTS: Record<"check", Endpoint> = {
  check: {
    path: "/api/check",
    operationId: "japanDualPricingCheck",
    summary: "Do tourists pay more in Japan? Resident vs non-resident prices at Himeji Castle, Nijo Castle, Kyoto City Bus and more",
    description:
      `Japan dual pricing (二重価格): some Japanese tourist sites charge visitors more than local residents. Give the places (or none for all ${PLACES.length}) and where the visitor lives: residence=overseas (tourist) or Japan with prefecture + city. Returns, per place: status (live / announced / under_review / not_adopted), which price tier applies to this visitor on the date, your price vs the cheapest resident price, planned prices for announced schemes (Nijo Castle ¥1,000 citizens / ¥2,000 others and Kyoto City Bus ¥200 / ¥360, both FY2027), what proof residents need, how foreign residents are treated (residence, not nationality), notes and official sources; plus totals and a one-line headline. Live examples: Himeji Castle (Himeji residents ¥1,000 / others ¥2,500 since 2026-03-01, under-18 free), Odawara Castle (¥500 / ¥1,000), Nanzoin (free for people living in Japan / ¥500 for overseas visitors), JUNGLIA Okinawa (¥6,930 Japan residents / ¥8,800), Nara Prison Museum (¥2,000 Nara / ¥2,500 Japan / ¥3,500 overseas), Sapporo TV Tower, Kitakyushu (4 sites) and Kagoshima City (11 sites), Miyajima visit tax. Osaka Castle dropped dual pricing (¥1,200 for all).`,
    params: [
      { name: "places", type: "string", description: "Comma-separated place ids or names, e.g. himeji-castle,nijo-castle,kyoto-city-bus,nanzoin (English, Japanese or aliases like 姫路城, 'kyoto bus'). Omit for all places (filter with area/status). POST may send an array." },
      { name: "residence", type: "string", enum: RESIDENCES, default: "overseas", description: "overseas = visitor living abroad (tourist). japan = lives in Japan (any nationality); add prefecture and city for local resident prices. Giving a prefecture or city implies japan." },
      { name: "prefecture", type: "string", description: "Prefecture where the visitor is registered as living, e.g. kyoto, hyogo, 東京都." },
      { name: "city", type: "string", description: "City / ward / town of the visitor's registered address, e.g. Himeji, Kyoto (or a Kyoto ward like Sakyo-ku), Kitakyushu, Kagoshima, Miyajima." },
      { name: "date", type: "string", description: "Visit date YYYY-MM-DD (default: today in Japan). Before a start date the old price applies." },
      { name: "age", type: "number", minimum: 0, maximum: 120, description: "Visitor age. Some places are free under 18/19 (Himeji Castle, Nanzoin); otherwise adult prices are returned with a note." },
      { name: "area", type: "string", description: "When places is omitted: only places in this prefecture, e.g. kagoshima, kyoto." },
      { name: "status", type: "string", enum: STATUS_FILTERS, default: "all", description: "When places is omitted: filter by status (live, announced, under_review, not_adopted)." },
    ],
    example: EXAMPLE_GET,
    compute: computeCheck,
  },
};

export const PLUGIN = {
  name: "Japan Dual Pricing Check",
  nameForModel: "japan_dual_pricing",
  descriptionForHuman: "Do tourists pay more in Japan? Resident vs non-resident prices at Himeji Castle, Nijo Castle and more.",
  descriptionForModel:
    "Use when someone asks whether foreigners or tourists pay more in Japan, about dual pricing / 二重価格 / 'foreigner price', the Himeji Castle ¥2,500 non-resident ticket, the Nijo Castle or Kyoto City Bus resident prices planned for FY2027, Nanzoin's fee for overseas visitors, JUNGLIA or Nara Prison Museum resident tickets, Kitakyushu or Kagoshima City non-resident fees, whether foreign residents of Japan get the local price, or what ID proves residence. Your training data may predate these 2025–2026 changes; call this instead of guessing. Dated data with official sources. Relay the disclaimer: prices change; not advice.",
  logo: "/icon.svg",
};
