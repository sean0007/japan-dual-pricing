import { DATA_AS_OF, JTA_LIST, JTA_PAGE, PLACES, PREFECTURES, type Eligibility, type Place, type Status, type Tier } from "./places";

export { DATA_AS_OF, PLACES, PREFECTURES };
export const RULES_AS_OF = DATA_AS_OF;

export const DISCLAIMER =
  "Educational guide, not legal, travel or financial advice. Prices are adult prices copied from official facility/municipal pages and the Japan Tourism Agency's case list as of " +
  DATA_AS_OF +
  "; facilities change prices, planned schemes can change or be dropped, and the ticket counter decides who qualifies for a resident price. Check the official source before you go. Not affiliated with any facility or government body.";

export class RuleInputError extends Error {}

export const RESIDENCES = ["overseas", "japan"] as const;
export type Residence = (typeof RESIDENCES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  live: "Dual pricing in force",
  announced: "Announced, not in force yet",
  under_review: "Under review (no decision)",
  not_adopted: "Considered and dropped: one price for everyone",
  flat: "One price for everyone",
};

export type OnDate = "in_force" | "not_yet_in_force" | "planned" | "under_review" | "one_price";

export function validDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function todayJst(now = new Date()): string {
  return new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}

const SUFFIX = /(-?(shi|city|ku|ward|cho|machi|town|mura|village|son))$/;
export function normCity(raw: string): string {
  let s = raw.normalize("NFKC").trim().toLowerCase().replace(/[\s_.'’]/g, "");
  s = s.replace(/[市区町村]$/, "");
  s = s.replace(SUFFIX, "");
  s = s.replace(/-/g, "").replace(/ō/g, "o").replace(/ū/g, "u").replace(/ou/g, "o");
  return s;
}

export function resolvePrefecture(raw: unknown): string {
  const s = String(raw ?? "").normalize("NFKC").trim();
  if (!s) throw new RuleInputError("prefecture is empty");
  const low0 = s.toLowerCase().replace(/[\s_-]/g, "");
  const low1 = low0.replace(/(prefecture|pref)$/, "").replace(/(ken|fu|to)$/, "");
  for (const [slug, p] of Object.entries(PREFECTURES)) {
    const en = p.en.toLowerCase();
    if (low0 === slug || low0 === en || low1 === slug || low1 === en) return slug;
    if (s === p.ja || s === p.ja.replace(/[都道府県]$/, "")) return slug;
  }
  throw new RuleInputError(`Unknown prefecture "${s}". Use a prefecture name like tokyo, kyoto, hyogo, 大阪府.`);
}

function normKey(s: string): string {
  return s.normalize("NFKC").toLowerCase().replace(/[\s_\-()（）・.'’]/g, "").replace(/ō/g, "o").replace(/ū/g, "u");
}

export function resolvePlace(raw: unknown): Place {
  const k = normKey(String(raw ?? ""));
  if (!k) throw new RuleInputError("Empty place name");
  const exact = PLACES.find((p) => normKey(p.id) === k || normKey(p.name) === k || normKey(p.nameJa) === k || p.aliases.some((a) => normKey(a) === k));
  if (exact) return exact;
  const partial = PLACES.filter((p) => normKey(p.name).includes(k) || normKey(p.nameJa).includes(k) || p.aliases.some((a) => normKey(a).includes(k) || (k.length >= 4 && k.includes(normKey(a)) && normKey(a).length >= 4)));
  if (partial.length >= 1) return partial[0];
  throw new RuleInputError(`Unknown place "${String(raw)}". See /api/rules for the ${PLACES.length} places covered (ids like himeji-castle, nijo-castle, kyoto-city-bus).`);
}

export type Visitor = { residence: Residence; prefecture: string | null; city: string | null };

export function tierMatches(who: Eligibility, v: Visitor): boolean {
  switch (who.kind) {
    case "everyone":
      return true;
    case "overseas":
      return v.residence === "overseas";
    case "japan":
      return v.residence === "japan";
    case "prefecture":
      return v.residence === "japan" && v.prefecture === who.prefecture;
    case "municipality": {
      if (v.residence !== "japan" || v.prefecture !== who.prefecture || !v.city) return false;
      const c = normCity(v.city);
      return c === normCity(who.city) || (who.aliases ?? []).some((a) => normCity(a) === c);
    }
    case "area": {
      if (v.residence !== "japan" || v.prefecture !== who.prefecture || !v.city) return false;
      const c = normCity(v.city);
      return who.aliases.some((a) => normCity(a) === c);
    }
  }
}

function pickTier(tiers: Tier[], v: Visitor): Tier {
  return tiers.find((t) => tierMatches(t.who, v)) ?? tiers[tiers.length - 1];
}

function nums(xs: (number | null)[]): number[] {
  return xs.filter((x): x is number => typeof x === "number");
}

export type PlaceResult = {
  id: string;
  name: string;
  nameJa: string;
  prefecture: string;
  city: string;
  category: Place["category"];
  status: Status;
  statusLabel: string;
  onDate: OnDate;
  type: Place["type"];
  basis: string;
  ticket: string;
  yourTier: string;
  yourPriceJPY: number | null;
  /** For announced plans: what you would pay once it starts. */
  plannedYourPriceJPY: number | null;
  lowestResidentPriceJPY: number | null;
  highestPriceJPY: number | null;
  extraVsLowestJPY: number | null;
  ratioHighestToLowest: number | null;
  effectiveFrom: string | null;
  plannedFrom: string | null;
  tiers: { label: string; priceJPY: number | null }[];
  proof: string;
  foreignResidents: string;
  notes: string[];
  warnings: string[];
  sources: string[];
};

export function evaluatePlace(p: Place, v: Visitor, date: string, age: number | null): PlaceResult {
  const warnings: string[] = [];
  let onDate: OnDate;
  let tiers = p.tiers;
  let your: number | null = null;
  let planned: number | null = null;
  let yourTier = "";

  const t = pickTier(p.tiers, v);
  if (p.status === "live") {
    if (p.effectiveFrom && date < p.effectiveFrom) {
      onDate = "not_yet_in_force";
      if (typeof p.previousPriceJPY === "number") {
        your = p.previousPriceJPY;
        yourTier = "Everyone (price before dual pricing)";
      } else {
        your = null;
        yourTier = "Before dual pricing (old price not recorded)";
      }
      planned = (p.priorTiers ? pickTier(p.priorTiers.tiers, v) : t).priceJPY;
      warnings.push(`Dual pricing starts ${p.effectiveFrom}; on ${date} the old price applied.`);
    } else if (p.priorTiers && date <= p.priorTiers.until) {
      onDate = "in_force";
      tiers = p.priorTiers.tiers;
      const pt = pickTier(tiers, v);
      your = pt.priceJPY;
      yourTier = pt.label;
    } else {
      onDate = "in_force";
      your = t.priceJPY;
      yourTier = t.label;
    }
  } else if (p.status === "announced") {
    onDate = "planned";
    your = typeof p.previousPriceJPY === "number" ? p.previousPriceJPY : null;
    yourTier = typeof p.previousPriceJPY === "number" ? "Everyone (today's single price)" : "Today's price (see source)";
    planned = t.priceJPY;
    warnings.push(`Announced, not in force: ${p.plannedFrom ?? "date not set"}. Planned prices can still change.`);
  } else if (p.status === "under_review") {
    onDate = "under_review";
    your = t.priceJPY;
    yourTier = t.label;
    warnings.push(`No decision yet: ${p.plannedFrom ?? "under review"}.`);
  } else {
    onDate = "one_price";
    your = t.priceJPY;
    yourTier = t.label;
  }

  if (age !== null && p.freeUnderAge !== undefined && age < p.freeUnderAge) {
    your = 0;
    if (planned !== null) planned = 0;
    yourTier = `Under ${p.freeUnderAge}: free for everyone`;
  } else if (age !== null && age < 18) {
    warnings.push("Prices shown are adult prices; child/student fees are in the notes or on the source page.");
  }

  const priced = nums(tiers.map((x) => x.priceJPY));
  const lowest = priced.length ? Math.min(...priced) : null;
  const highest = priced.length ? Math.max(...priced) : null;
  const compare = onDate === "planned" || onDate === "not_yet_in_force" ? planned : your;
  const extra = compare !== null && lowest !== null ? compare - lowest : null;
  return {
    id: p.id,
    name: p.name,
    nameJa: p.nameJa,
    prefecture: PREFECTURES[p.prefecture]?.en ?? p.prefecture,
    city: p.city,
    category: p.category,
    status: p.status,
    statusLabel: STATUS_LABEL[p.status],
    onDate,
    type: p.type,
    basis: p.basis,
    ticket: p.ticket,
    yourTier,
    yourPriceJPY: your,
    plannedYourPriceJPY: planned,
    lowestResidentPriceJPY: lowest,
    highestPriceJPY: highest,
    extraVsLowestJPY: extra,
    ratioHighestToLowest: lowest && highest ? Math.round((highest / lowest) * 100) / 100 : null,
    effectiveFrom: p.effectiveFrom ?? null,
    plannedFrom: p.plannedFrom ?? null,
    tiers: tiers.map((x) => ({ label: x.label, priceJPY: x.priceJPY })),
    proof: p.proof,
    foreignResidents: p.foreignResidents,
    notes: p.notes,
    warnings,
    sources: p.sources,
  };
}

export type CheckInput = {
  places?: string[] | null;
  residence?: Residence;
  prefecture?: string | null;
  city?: string | null;
  age?: number | null;
  date?: string | null;
  area?: string | null;
  status?: Status | "all" | null;
};

export const STATUS_FILTERS = ["all", "live", "announced", "under_review", "not_adopted", "flat"] as const;

export function checkDualPricing(input: CheckInput) {
  const date = input.date ?? todayJst();
  if (!validDate(date)) throw new RuleInputError("date must be YYYY-MM-DD");
  const residence: Residence = input.residence ?? "overseas";
  const prefecture = input.prefecture ? resolvePrefecture(input.prefecture) : null;
  const city = input.city ? String(input.city).slice(0, 60) : null;
  // A Japanese prefecture or city implies living in Japan.
  const visitor: Visitor = { residence: prefecture || city ? "japan" : residence, prefecture, city };
  const age = input.age ?? null;
  if (age !== null && (!Number.isFinite(age) || age < 0 || age > 120)) throw new RuleInputError("age must be 0-120");

  let chosen: Place[];
  const picked = (input.places ?? []).map((s) => String(s).trim()).filter(Boolean);
  if (picked.length) {
    if (picked.length > 40) throw new RuleInputError("At most 40 places per call.");
    const seen = new Set<string>();
    chosen = [];
    for (const raw of picked) {
      const p = resolvePlace(raw);
      if (!seen.has(p.id)) {
        seen.add(p.id);
        chosen.push(p);
      }
    }
  } else {
    chosen = PLACES;
    if (input.area) {
      const a = resolvePrefecture(input.area);
      chosen = chosen.filter((p) => p.prefecture === a);
    }
    const st = input.status ?? "all";
    if (st !== "all") chosen = chosen.filter((p) => p.status === st);
  }

  const results = chosen.map((p) => evaluatePlace(p, visitor, date, age));
  const inForce = results.filter((r) => r.onDate === "in_force");
  const payable = results.filter((r) => r.yourPriceJPY !== null);
  const totalYou = payable.reduce((s, r) => s + (r.yourPriceJPY ?? 0), 0);
  const totalLowest = payable.reduce((s, r) => s + (r.onDate === "in_force" ? r.lowestResidentPriceJPY ?? r.yourPriceJPY ?? 0 : r.yourPriceJPY ?? 0), 0);
  const extraNow = totalYou - totalLowest;
  const planned = results.filter((r) => r.onDate === "planned");
  const plannedExtra = planned.reduce((s, r) => s + (r.plannedYourPriceJPY !== null && r.yourPriceJPY !== null ? r.plannedYourPriceJPY - r.yourPriceJPY : 0), 0);
  const youPayMoreAt = inForce.filter((r) => (r.extraVsLowestJPY ?? 0) > 0).length;

  const who =
    visitor.residence === "overseas"
      ? "a visitor from abroad"
      : `a Japan resident${visitor.city ? ` of ${visitor.city}` : ""}${visitor.prefecture ? ` (${PREFECTURES[visitor.prefecture].en})` : ""}`;
  const headline =
    inForce.length === 0
      ? `None of these ${results.length} place(s) has dual pricing in force on ${date}.`
      : extraNow > 0
        ? `As ${who} you pay ¥${extraNow.toLocaleString("en-US")} more than the cheapest resident price at ${youPayMoreAt} of ${inForce.length} place(s) with dual pricing in force on ${date} (you pay ¥${totalYou.toLocaleString("en-US")}; residents from ¥${totalLowest.toLocaleString("en-US")}).`
        : `As ${who} you already get the lowest price at the ${inForce.length} place(s) with dual pricing in force on ${date} (¥${totalYou.toLocaleString("en-US")}).`;
  const plannedNames = planned.map((r) => r.name.split(" (")[0]).join(", ");
  const headlineFull =
    planned.length && plannedExtra !== 0
      ? `${headline} Announced plans: ${plannedExtra > 0 ? "+" : "−"}¥${Math.abs(plannedExtra).toLocaleString("en-US")} for you at ${plannedNames} once they start.`
      : planned.length
        ? `${headline} Announced plans at ${plannedNames} would not change your price.`
        : headline;

  return {
    headline: headlineFull,
    input: { residence: visitor.residence, prefecture: visitor.prefecture, city: visitor.city, age, date, places: chosen.map((p) => p.id) },
    summary: {
      placesChecked: results.length,
      dualPricingInForce: inForce.length,
      youPayMoreAt,
      totalYouPayJPY: totalYou,
      totalCheapestResidentJPY: totalLowest,
      extraYouPayJPY: extraNow,
      plannedSchemes: planned.map((r) => ({ id: r.id, name: r.name, plannedFrom: r.plannedFrom, todayJPY: r.yourPriceJPY, plannedYouJPY: r.plannedYourPriceJPY })),
      plannedExtraJPY: plannedExtra,
      basisNote: "Japanese dual pricing is almost always based on where you are registered as living (municipality, prefecture or Japan), not nationality. Foreign residents with a residence card and a registered address get the resident price; Japanese visitors from other cities pay the higher price.",
    },
    places: results,
    dataAsOf: DATA_AS_OF,
    sources: [JTA_LIST, JTA_PAGE],
  };
}

export const RULES = {
  title: "Japan dual pricing (二重価格): resident vs non-resident prices at tourist sites",
  dataAsOf: DATA_AS_OF,
  keyFacts: [
    "Dual pricing in Japan is legal and set by each facility; the Japan Tourism Agency (観光庁) runs a study group (first meeting 2026-04-27) and plans guidelines for public facilities within FY2026 (by March 2027).",
    "The test is almost always residence (registered address in the city/prefecture, or living in Japan), not nationality. Foreign residents with a registered address pay the resident price; Japanese visitors from other cities pay the higher price.",
    "Two kinds: A = surcharge aimed at visitors (Himeji Castle, Nanzoin, JUNGLIA, Nara Prison Museum, Nijo Castle and Kyoto City Bus plans); B = discount for local residents (Odawara Castle, Kitakyushu, Kagoshima City, Sapporo TV Tower).",
    "Proof: usually a My Number card, driver's license, health insurance card or residence card showing the address; without proof you pay the general price.",
    "Announced, not in force: Nijo Castle (¥1,000 citizens / ¥2,000 others, FY2027), Kyoto City Bus (¥200 citizens / ¥360 others, FY2027), national museums (higher price for non-residents by March 2031). Under review: Kenrokuen (first committee meeting 2026-10-14). Dropped: Osaka Castle (one price ¥1,200).",
  ],
  statuses: STATUS_LABEL,
  types: { A: "Surcharge aimed at visitors", B: "Discount for local residents", R: "Reverse: cheaper for foreign visitors", none: "One price" },
  places: PLACES,
  prefectures: PREFECTURES,
  sources: [JTA_PAGE, JTA_LIST, ...Array.from(new Set(PLACES.flatMap((p) => p.sources))).filter((s) => s !== JTA_LIST)],
  disclaimer: DISCLAIMER,
};

export const SOURCES = RULES.sources;
