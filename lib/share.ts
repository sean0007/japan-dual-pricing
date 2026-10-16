import { PLACES, RESIDENCES, checkDualPricing, resolvePrefecture, validDate, type CheckInput, type Residence } from "./dual";

export const PUBLIC_URL = "https://japan-dual-pricing.vercel.app";

/** Share links: /r?p=himeji-castle,nijo-castle&res=overseas[&pref=kyoto&city=Kyoto][&d=YYYY-MM-DD] */
type Params = URLSearchParams | Record<string, string | string[] | undefined>;
function one(p: Params, key: string): string | undefined {
  if (p instanceof URLSearchParams) return p.get(key) ?? undefined;
  const v = p[key];
  return Array.isArray(v) ? v[0] : v;
}

export type Shared = { places: string[]; residence: Residence; prefecture: string | null; city: string | null; date: string | null };

export const EXAMPLE_SHARED: Shared = { places: ["himeji-castle", "odawara-castle", "nanzoin"], residence: "overseas", prefecture: null, city: null, date: null };
export const EXAMPLE_KYOTO: Shared = { places: ["nijo-castle", "kyoto-city-bus", "himeji-castle"], residence: "overseas", prefecture: null, city: null, date: null };

const IDS = new Set(PLACES.map((p) => p.id));

export function parseShared(p: Params): Shared | null {
  const raw = one(p, "p") ?? one(p, "places");
  if (!raw) return null;
  const places = [...new Set(raw.split(",").map((s) => s.trim()).filter((s) => IDS.has(s)))].slice(0, 20);
  if (!places.length) return null;
  const res = one(p, "res") ?? "overseas";
  if (!(RESIDENCES as readonly string[]).includes(res)) return null;
  let prefecture: string | null = null;
  const pref = one(p, "pref");
  if (pref) {
    try {
      prefecture = resolvePrefecture(pref);
    } catch {
      return null;
    }
  }
  const cityRaw = one(p, "city");
  const city = cityRaw ? cityRaw.slice(0, 40) : null;
  const d = one(p, "d");
  const date = d && validDate(d) && d >= "2024-01-01" && d <= "2031-12-31" ? d : null;
  return { places, residence: prefecture || city ? "japan" : (res as Residence), prefecture, city, date };
}

export function sharedQuery(s: Shared): string {
  const q = new URLSearchParams();
  q.set("p", s.places.join(","));
  q.set("res", s.residence);
  if (s.prefecture) q.set("pref", s.prefecture);
  if (s.city) q.set("city", s.city);
  if (s.date) q.set("d", s.date);
  return q.toString().replace(/%2C/g, ",");
}

export function toCheckInput(s: Shared): CheckInput {
  return { places: s.places, residence: s.residence, prefecture: s.prefecture, city: s.city, date: s.date };
}

export function sharedResult(s: Shared) {
  return checkDualPricing(toCheckInput(s));
}

export const resultPath = (s: Shared) => `/r?${sharedQuery(s)}`;
export const ogPath = (s: Shared) => `/og?${sharedQuery(s)}`;
export const isIndexable = (s: Shared) => [EXAMPLE_SHARED, EXAMPLE_KYOTO].some((e) => sharedQuery(e) === sharedQuery(s));

export const yen = (n: number | null | undefined) => (typeof n === "number" ? `¥${n.toLocaleString("en-US")}` : "—");

export function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}
