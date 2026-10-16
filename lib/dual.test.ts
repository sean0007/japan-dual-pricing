import assert from "node:assert/strict";
import test from "node:test";
import { PLACES, RULES, checkDualPricing, evaluatePlace, normCity, resolvePlace, resolvePrefecture, todayJst } from "./dual";

const D = "2026-11-20";
const price = (id: string, o: Parameters<typeof checkDualPricing>[0]) => checkDualPricing({ date: D, ...o, places: [id] }).places[0];

test("dataset integrity: unique ids, last tier is everyone, live entries have start dates, all have sources", () => {
  const ids = new Set<string>();
  for (const p of PLACES) {
    assert.ok(!ids.has(p.id), p.id);
    ids.add(p.id);
    assert.equal(p.tiers[p.tiers.length - 1].who.kind, "everyone", p.id);
    assert.ok(p.sources.length > 0 && p.sources.every((s) => s.startsWith("https://")), p.id);
    if (p.status === "live" && p.id !== "hakoyu" && p.id !== "iwami-ginzan-center") assert.ok(p.effectiveFrom, `${p.id} effectiveFrom`);
    if (p.status === "announced") assert.ok(p.plannedFrom, `${p.id} plannedFrom`);
  }
  assert.ok(PLACES.length >= 30);
});

test("Himeji Castle: ¥2,500 for tourists, ¥2,500 for other Japan residents, ¥1,000 for Himeji residents, free under 18", () => {
  assert.equal(price("himeji-castle", { residence: "overseas" }).yourPriceJPY, 2500);
  assert.equal(price("himeji-castle", { prefecture: "tokyo", city: "Shinjuku" }).yourPriceJPY, 2500);
  assert.equal(price("himeji-castle", { prefecture: "hyogo", city: "Himeji" }).yourPriceJPY, 1000);
  assert.equal(price("himeji-castle", { prefecture: "兵庫県", city: "姫路市" }).yourPriceJPY, 1000);
  assert.equal(price("himeji-castle", { residence: "overseas", age: 17 }).yourPriceJPY, 0);
  const r = price("himeji-castle", { residence: "overseas" });
  assert.equal(r.extraVsLowestJPY, 1500);
  assert.equal(r.ratioHighestToLowest, 2.5);
  assert.equal(r.onDate, "in_force");
});

test("before the start date the old single price applies", () => {
  const r = checkDualPricing({ places: ["himeji-castle"], residence: "overseas", date: "2026-02-28" }).places[0];
  assert.equal(r.onDate, "not_yet_in_force");
  assert.equal(r.yourPriceJPY, 1000);
  assert.equal(r.plannedYourPriceJPY, 2500);
});

test("Nanzoin: free for people living in Japan (any nationality), ¥500 overseas from 2026-03-01, ¥300 before, under-19 free", () => {
  assert.equal(price("nanzoin", { residence: "japan" }).yourPriceJPY, 0);
  assert.equal(price("nanzoin", { residence: "overseas" }).yourPriceJPY, 500);
  assert.equal(checkDualPricing({ places: ["nanzoin"], residence: "overseas", date: "2026-01-10" }).places[0].yourPriceJPY, 300);
  assert.equal(price("nanzoin", { residence: "overseas", age: 18 }).yourPriceJPY, 0);
});

test("Nara Prison Museum three tiers", () => {
  assert.equal(price("nara-prison-museum", { prefecture: "nara", city: "Ikoma" }).yourPriceJPY, 2000);
  assert.equal(price("nara-prison-museum", { prefecture: "osaka" }).yourPriceJPY, 2500);
  assert.equal(price("nara-prison-museum", { residence: "japan" }).yourPriceJPY, 2500);
  assert.equal(price("nara-prison-museum", { residence: "overseas" }).yourPriceJPY, 3500);
});

test("JUNGLIA, Odawara, Sapporo TV Tower, Kitakyushu, Kagoshima", () => {
  assert.equal(price("junglia-okinawa", { residence: "japan" }).yourPriceJPY, 6930);
  assert.equal(price("junglia-okinawa", { residence: "overseas" }).yourPriceJPY, 8800);
  assert.equal(price("odawara-castle", { prefecture: "kanagawa", city: "Odawara-shi" }).yourPriceJPY, 500);
  assert.equal(price("odawara-castle", { residence: "overseas" }).yourPriceJPY, 1000);
  assert.equal(price("sapporo-tv-tower", { prefecture: "hokkaido", city: "Sapporo" }).yourPriceJPY, 800);
  assert.equal(price("mojiko-retro-observation", { residence: "overseas" }).yourPriceJPY, 600);
  assert.equal(price("kokura-castle", { prefecture: "fukuoka", city: "Kitakyushu" }).yourPriceJPY, 400);
  assert.equal(price("kokura-castle", { prefecture: "fukuoka", city: "Fukuoka" }).yourPriceJPY, 500);
  assert.equal(price("io-world-aquarium", { prefecture: "kagoshima", city: "鹿児島市" }).yourPriceJPY, 1500);
  assert.equal(price("io-world-aquarium", { residence: "overseas" }).yourPriceJPY, 2000);
  assert.equal(checkDualPricing({ places: ["kokura-castle"], residence: "overseas", date: "2026-03-31" }).places[0].yourPriceJPY, 350);
});

test("Kyoto plans: Nijo Castle and City Bus are announced (today ¥1,300 / ¥230), planned ¥2,000 / ¥360 for non-citizens, ward names count as Kyoto City", () => {
  const nijo = price("nijo-castle", { residence: "overseas" });
  assert.equal(nijo.onDate, "planned");
  assert.equal(nijo.yourPriceJPY, 1300);
  assert.equal(nijo.plannedYourPriceJPY, 2000);
  assert.equal(price("nijo-castle", { prefecture: "kyoto", city: "Sakyo-ku" }).plannedYourPriceJPY, 1000);
  assert.equal(price("nijo-castle", { prefecture: "kyoto", city: "Uji" }).plannedYourPriceJPY, 2000);
  const bus = price("kyoto-city-bus", { residence: "overseas" });
  assert.equal(bus.yourPriceJPY, 230);
  assert.equal(bus.plannedYourPriceJPY, 360);
  assert.equal(price("kyoto-city-bus", { prefecture: "京都府", city: "京都市" }).plannedYourPriceJPY, 200);
});

test("Miyajima tax exempts only Miyajima-area residents; Iwami Ginzan is cheaper for foreign visitors; Osaka Castle one price", () => {
  assert.equal(price("miyajima-visit-tax", { prefecture: "hiroshima", city: "Miyajima" }).yourPriceJPY, 0);
  assert.equal(price("miyajima-visit-tax", { prefecture: "hiroshima", city: "Hatsukaichi" }).yourPriceJPY, 100);
  assert.equal(price("iwami-ginzan-center", { residence: "overseas" }).yourPriceJPY, 300);
  assert.equal(price("iwami-ginzan-center", { residence: "japan" }).yourPriceJPY, 400);
  const o = price("osaka-castle", { residence: "overseas" });
  assert.equal(o.onDate, "one_price");
  assert.equal(o.yourPriceJPY, 1200);
  assert.equal(o.extraVsLowestJPY, 0);
  assert.equal(price("kenrokuen", { residence: "overseas" }).onDate, "under_review");
  assert.equal(price("national-museums", { residence: "overseas" }).plannedYourPriceJPY, null);
});

test("totals and headline", () => {
  const r = checkDualPricing({ places: ["himeji-castle", "odawara-castle", "nanzoin"], residence: "overseas", date: D });
  assert.equal(r.summary.totalYouPayJPY, 4000);
  assert.equal(r.summary.totalCheapestResidentJPY, 1500);
  assert.equal(r.summary.extraYouPayJPY, 2500);
  assert.equal(r.summary.youPayMoreAt, 3);
  assert.match(r.headline, /¥2,500 more/);
  const k = checkDualPricing({ places: ["nijo", "kyoto bus"], residence: "overseas", date: D });
  assert.equal(k.summary.plannedExtraJPY, 700 + 130);
  assert.match(k.headline, /None of these/);
  const local = checkDualPricing({ places: ["himeji-castle"], prefecture: "hyogo", city: "Himeji", date: D });
  assert.match(local.headline, /already get the lowest price/);
});

test("no places = all, with area and status filters", () => {
  assert.equal(checkDualPricing({ date: D }).places.length, PLACES.length);
  const kago = checkDualPricing({ area: "kagoshima", date: D });
  assert.equal(kago.places.length, 11);
  assert.ok(checkDualPricing({ status: "announced", date: D }).places.every((p) => p.status === "announced"));
});

test("resolvers: names, Japanese, aliases, prefectures, cities", () => {
  assert.equal(resolvePlace("姫路城").id, "himeji-castle");
  assert.equal(resolvePlace("Nijo Castle").id, "nijo-castle");
  assert.equal(resolvePlace("kyoto bus").id, "kyoto-city-bus");
  assert.equal(resolvePlace("Tokyo National Museum").id, "national-museums");
  assert.throws(() => resolvePlace("Eiffel Tower"));
  assert.equal(resolvePrefecture("Kyoto-fu"), "kyoto");
  assert.equal(resolvePrefecture("東京都"), "tokyo");
  assert.throws(() => resolvePrefecture("Atlantis"));
  assert.equal(normCity("Himeji-shi"), normCity("姫路") === "姫路" ? "himeji" : "himeji");
  assert.equal(normCity("Kitakyushu City"), "kitakyushu");
  assert.throws(() => checkDualPricing({ date: "2026-02-30" }));
  assert.match(todayJst(new Date("2026-10-16T20:00:00Z")), /^2026-10-17$/);
});

test("evaluatePlace exposes proof, foreign-resident rule and sources; RULES lists all", () => {
  const r = evaluatePlace(PLACES[0], { residence: "overseas", prefecture: null, city: null }, D, null);
  assert.ok(r.proof && r.foreignResidents && r.sources.length);
  assert.equal(RULES.places.length, PLACES.length);
  assert.ok(RULES.sources.includes("https://www.mlit.go.jp/kankocho/content/002011640.pdf"));
});
