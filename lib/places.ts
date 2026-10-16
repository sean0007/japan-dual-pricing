// Dated dataset of Japanese tourist sites with resident vs non-resident ("dual") pricing.
// Every entry cites an official page (facility / municipality) or the Japan Tourism Agency's
// case list (観光庁「主な観光施設・サービス等の料金設定等の事例リスト」, 4th study-group meeting, 2026-07-14),
// plus dated news for plans that are announced but not yet in force.

export const DATA_AS_OF = "2026-10-16";

export const JTA_LIST = "https://www.mlit.go.jp/kankocho/content/002011640.pdf";
export const JTA_PAGE = "https://www.mlit.go.jp/kankocho/page08_00012.html";

/** Who a price tier is for. Tiers are checked in order; the first match wins; "everyone" must be last. */
export type Eligibility =
  | { kind: "municipality"; prefecture: string; city: string; aliases?: string[] }
  | { kind: "area"; prefecture: string; area: string; aliases: string[] }
  | { kind: "prefecture"; prefecture: string }
  | { kind: "japan" }
  | { kind: "overseas" }
  | { kind: "everyone" };

export type Tier = { who: Eligibility; label: string; priceJPY: number | null };

export type Status =
  | "live" // dual pricing in force
  | "announced" // officially planned, not yet in force
  | "under_review" // being studied, no decision
  | "not_adopted" // considered and dropped; one price for everyone
  | "flat"; // no resident distinction (listed because people ask)

export type Category = "castle" | "temple" | "museum" | "zoo_aquarium" | "theme_park" | "observation" | "garden" | "bath" | "transport" | "tax" | "boat";

export type Place = {
  id: string;
  name: string;
  nameJa: string;
  aliases: string[];
  prefecture: string; // slug, e.g. "hyogo"
  city: string; // municipality label
  category: Category;
  status: Status;
  /** Type A = surcharge aimed at visitors; B = resident discount; R = reverse (cheaper for foreign visitors). */
  type: "A" | "B" | "R" | "none";
  basis: string; // e.g. "registered address in Himeji City (not nationality)"
  ticket: string; // what the prices are for
  tiers: Tier[];
  effectiveFrom?: string; // YYYY-MM-DD, for live entries
  plannedFrom?: string; // text, e.g. "FY2027 (April 2027–March 2028)"
  /** Price everyone paid before dual pricing (or today, for announced plans). */
  previousPriceJPY?: number | null;
  /** Prices before a later change of the same scheme (e.g. Nanzoin ¥300 → ¥500). */
  priorTiers?: { until: string; tiers: Tier[] };
  freeUnderAge?: number; // admission free for ages below this
  adultFromAge?: number; // tier prices are adult prices from this age
  proof: string;
  foreignResidents: string;
  notes: string[];
  sources: string[];
};

const everyone = (priceJPY: number | null, label = "Everyone else (incl. visitors from abroad and from other parts of Japan)"): Tier => ({ who: { kind: "everyone" }, label, priceJPY });
const city = (prefecture: string, c: string, label: string, priceJPY: number | null, aliases: string[] = []): Tier => ({ who: { kind: "municipality", prefecture, city: c, aliases }, label, priceJPY });

const SAPPORO_WARDS = ["札幌", "chuo", "kita", "higashi", "shiroishi", "toyohira", "minami", "nishi", "atsubetsu", "teine", "kiyota", "中央区", "北区", "東区", "白石区", "豊平区", "南区", "西区", "厚別区", "手稲区", "清田区"];
const KITAKYUSHU_WARDS = ["北九州", "kokurakita", "kokuraminami", "moji", "yahatahigashi", "yahatanishi", "tobata", "wakamatsu", "小倉北区", "小倉南区", "門司区", "八幡東区", "八幡西区", "戸畑区", "若松区"];
const KAGOSHIMA_PDF = "https://www.city.kagoshima.lg.jp/kikakuzaisei/zaisei/zaisei/shise/yosan/jokyo/r7/documents/omonakoukyoshisetsu.pdf";
const KAGOSHIMA_PROOF = "Kagoshima City residents must show address proof (My Number card, driver's license, the city's digital resident ID app for ages 15+, etc.); without it the non-resident fee applies.";
const KITAKYUSHU_SRC = "https://www.city.kitakyushu.lg.jp/page/dayori/260315/topics/topics.html";
const KITAKYUSHU_PROOF = "Kitakyushu residents show official address proof (My Number card, driver's license, health insurance card, etc.).";
const CITY_RES = (c: string) => `Foreign residents with a registered address in ${c} pay the resident price; residents of other Japanese cities pay the same as tourists.`;

function kagoshima(id: string, name: string, nameJa: string, category: Category, ticket: string, resident: number, other: number, before: number, aliases: string[] = [], extraSources: string[] = []): Place {
  return {
    id, name, nameJa, aliases, prefecture: "kagoshima", city: "Kagoshima City", category, status: "live", type: "B",
    basis: "address in Kagoshima City (市内居住者) vs everyone else (市外); not nationality",
    ticket, tiers: [city("kagoshima", "kagoshima", "Kagoshima City residents", resident, ["鹿児島"]), everyone(other)],
    effectiveFrom: "2025-10-01", previousPriceJPY: before, proof: KAGOSHIMA_PROOF, foreignResidents: CITY_RES("Kagoshima City"),
    notes: ["One of 14 Kagoshima City facilities that added a non-resident (市外) fee on 2025-10-01 'for fairness with residents whose city taxes maintain the facilities'."],
    sources: [KAGOSHIMA_PDF, JTA_LIST, ...extraSources],
  };
}

function kitakyushu(id: string, name: string, nameJa: string, category: Category, resident: number, other: number, before: number, aliases: string[] = [], extra: string[] = []): Place {
  return {
    id, name, nameJa, aliases, prefecture: "fukuoka", city: "Kitakyushu", category, status: "live", type: "B",
    basis: "address in Kitakyushu City (市内居住者) vs everyone else (市外居住者); not nationality",
    ticket: "Adult individual admission", tiers: [city("fukuoka", "kitakyushu", "Kitakyushu residents", resident, KITAKYUSHU_WARDS), everyone(other)],
    effectiveFrom: "2026-04-01", previousPriceJPY: before, proof: KITAKYUSHU_PROOF, foreignResidents: CITY_RES("Kitakyushu"),
    notes: ["Children's and students' fees are the same for residents and non-residents.", ...extra],
    sources: [KITAKYUSHU_SRC, JTA_LIST],
  };
}

export const PLACES: Place[] = [
  {
    id: "himeji-castle", name: "Himeji Castle", nameJa: "姫路城", aliases: ["himeji", "himejijo", "姫路"],
    prefecture: "hyogo", city: "Himeji", category: "castle", status: "live", type: "A",
    basis: "registered address in Himeji City (not nationality)", ticket: "Admission, age 18+",
    tiers: [city("hyogo", "himeji", "Himeji City residents (18+)", 1000, ["姫路"]), everyone(2500, "Everyone else 18+ (tourists and all other Japan residents)")],
    effectiveFrom: "2026-03-01", previousPriceJPY: 1000, freeUnderAge: 18, adultFromAge: 18,
    proof: "Residents verify with a My Number card when buying a digital ticket, or show a My Number card, driver's license or other official ID at the ticket booth.",
    foreignResidents: CITY_RES("Himeji"),
    notes: ["Under-18s are free for everyone from March 2026.", "Groups of 30+: ¥800 residents / ¥2,000 others. Himeji Castle + Kōko-en combo ¥2,600; annual pass ¥5,000.", "Highest castle-keep admission in Japan; revenue funds stone-wall seismic work."],
    sources: ["https://visit-himeji.com/en/news/revision-of-himeji-castle-admission-fees/", JTA_LIST],
  },
  {
    id: "nijo-castle", name: "Nijō Castle (Nijo-jo)", nameJa: "二条城", aliases: ["nijo", "nijojo", "nijo-jo", "二条城", "元離宮二条城"],
    prefecture: "kyoto", city: "Kyoto", category: "castle", status: "announced", type: "A",
    basis: "Kyoto City residents vs everyone else (planned)", ticket: "Entry + Ninomaru Palace set ticket, adult",
    tiers: [city("kyoto", "kyoto", "Kyoto City residents (planned)", 1000, KYOTO_WARDS()), everyone(2000, "Everyone else (planned; incl. tourists and Osaka/Tokyo residents)")],
    plannedFrom: "FY2027 (April 2027–March 2028); ordinance planned for the November 2026 city council", previousPriceJPY: 1300,
    proof: "Not announced yet.", foreignResidents: "Expected to follow residence (Kyoto City address), as with the city bus plan; not confirmed.",
    notes: ["Announced by Mayor Matsui at the city council on 2026-10-01: the ¥1,300 set ticket becomes ¥1,000 for citizens and ¥2,000 for everyone else; extra revenue goes to Ninomaru Palace conservation.", "Today everyone pays ¥1,300."],
    sources: ["https://www.jiji.com/jc/article?g=eco&k=2026100100761", "https://www.yomiuri.co.jp/economy/20261001-GYT1T00232/"],
  },
  {
    id: "kyoto-city-bus", name: "Kyoto City Bus (flat-fare zone)", nameJa: "京都市バス 市民優先価格", aliases: ["kyoto bus", "kyoto city bus", "市バス", "京都市バス", "市民優先価格"],
    prefecture: "kyoto", city: "Kyoto", category: "transport", status: "announced", type: "A",
    basis: "residence registration (住民票) in Kyoto City, identified by linking a My Number card to an IC card (planned)", ticket: "Adult single fare, flat-fare zone",
    tiers: [city("kyoto", "kyoto", "Kyoto City residents (planned, IC card linked to My Number card)", 200, KYOTO_WARDS()), everyone(360, "Everyone else (planned)")],
    plannedFrom: "FY2027 (April 2027–March 2028), subject to national approval", previousPriceJPY: 230,
    proof: "Planned: link your My Number card to a transit IC card. Cash and coupon payments will not get the citizen fare.",
    foreignResidents: "Foreign residents registered in Kyoto City are 'citizens' (the test is 住民票, not nationality). Residents of nearby cities pay the higher fare.",
    notes: ["Mayor Matsui set the non-citizen fare at ¥360 on 2026-10-01 (the city's earlier outline said ¥350–400). Children pay half.", "The city is considering relief for frequent non-resident commuters.", "Separate from the ¥500 Sightseeing Express buses (観光特急バス), which anyone can choose."],
    sources: ["https://www.city.kyoto.lg.jp/kotsu/page/0000351261.html", "https://www.jiji.com/jc/article?g=eco&k=2026100100761", "https://www2.city.kyoto.lg.jp/kotsu/webguide/ja/fare/fare_bus.html"],
  },
  {
    id: "odawara-castle", name: "Odawara Castle keep", nameJa: "小田原城天守閣", aliases: ["odawara", "小田原城", "小田原"],
    prefecture: "kanagawa", city: "Odawara", category: "castle", status: "live", type: "B",
    basis: "address in Odawara City (小田原市に住所のある方)", ticket: "Castle keep (天守閣), adult (ticket includes SAMURAI-kan)",
    tiers: [city("kanagawa", "odawara", "Odawara City residents", 500, ["小田原"]), everyone(1000)],
    effectiveFrom: "2026-03-01", previousPriceJPY: 510,
    proof: "Address proof for Odawara residents.", foreignResidents: CITY_RES("Odawara"),
    notes: ["Elementary/junior-high: ¥200 residents / ¥300 others.", "Groups (30+): ¥400 residents / ¥800 others.", "Easy stop on the Tokaido line from Tokyo."],
    sources: ["https://odawaracastle.com/news/ryokin_kaitei-2026.html", "https://odawaracastle.com/ticket/", JTA_LIST],
  },
  {
    id: "nanzoin", name: "Nanzoin Temple (Reclining Buddha)", nameJa: "南蔵院", aliases: ["nanzoin", "nanzo-in", "南蔵院", "reclining buddha", "sasaguri"],
    prefecture: "fukuoka", city: "Sasaguri", category: "temple", status: "live", type: "A",
    basis: "living in Japan (日本在住) vs visitors from abroad", ticket: "Visit fee per person",
    tiers: [{ who: { kind: "japan" }, label: "People living in Japan (Japanese and residence-permit holders)", priceJPY: 0 }, everyone(500, "Visitors from abroad")],
    effectiveFrom: "2025-05-01",
    priorTiers: { until: "2026-02-28", tiers: [{ who: { kind: "japan" }, label: "People living in Japan", priceJPY: 0 }, everyone(300, "Visitors from abroad")] },
    previousPriceJPY: 0, freeUnderAge: 19,
    proof: "Documents showing residence in Japan (or age) may be requested.",
    foreignResidents: "Foreign residents of Japan (with a residence permit) are free.",
    notes: ["Fee for overseas visitors introduced in May 2025 at ¥300 (to curb nuisance behaviour; this tool uses 2025-05-01 as the start, exact day per the temple), raised to ¥500 on 2026-03-01.", "Under-19s free. Groups with an entry permit ¥200 each."],
    sources: ["https://nanzoin.net/event_guide/%e6%8b%9d%e8%a6%b3%e6%96%99%e3%81%ab%e3%81%a4%e3%81%84%e3%81%a6/", JTA_LIST],
  },
  {
    id: "junglia-okinawa", name: "JUNGLIA Okinawa (theme park)", nameJa: "ジャングリア沖縄", aliases: ["junglia", "ジャングリア"],
    prefecture: "okinawa", city: "Nakijin / Nago", category: "theme_park", status: "live", type: "A",
    basis: "living in Japan (国内在住者) vs general price", ticket: "1-Day ticket, adult (12+)",
    tiers: [{ who: { kind: "japan" }, label: "Japan residents", priceJPY: 6930 }, everyone(8800, "General (visitors from abroad)")],
    effectiveFrom: "2025-07-25", adultFromAge: 12,
    proof: "Japan-resident tickets need a Japanese address/phone at purchase; proof of residence may be checked at entry.",
    foreignResidents: "Foreign residents of Japan get the Japan-resident price (residence, not nationality).",
    notes: ["Children (4–11): ¥4,950 residents / ¥5,940 general. Under 4 free.", "Two-tier from opening day (first major private theme park in Japan to do so)."],
    sources: ["https://www.junglia.jp/ticket", JTA_LIST],
  },
  {
    id: "nara-prison-museum", name: "Nara Prison Museum by Hoshino Resorts", nameJa: "奈良監獄ミュージアム", aliases: ["nara prison", "nara prison museum", "奈良監獄"],
    prefecture: "nara", city: "Nara", category: "museum", status: "live", type: "A",
    basis: "three tiers by where you live: Nara Prefecture / elsewhere in Japan / abroad", ticket: "Adult admission",
    tiers: [{ who: { kind: "prefecture", prefecture: "nara" }, label: "Nara Prefecture residents", priceJPY: 2000 }, { who: { kind: "japan" }, label: "Japan residents", priceJPY: 2500 }, everyone(3500, "General admission (visitors from abroad)")],
    effectiveFrom: "2026-04-27",
    proof: "ID for residence verification may be requested at entry.",
    foreignResidents: "Residence-based: foreign residents of Japan pay the Japan-resident (or Nara) price.",
    notes: ["Students 15–22 ¥1,500, children 6–14 ¥700, 5 and under free (same for all).", "First museum in Japan with a three-tier residence price."],
    sources: ["https://hoshinoresorts.com/nara-prison-museum/en/visit/", JTA_LIST],
  },
  {
    id: "sapporo-tv-tower", name: "Sapporo TV Tower observation deck", nameJa: "さっぽろテレビ塔", aliases: ["sapporo tv tower", "tv tower", "テレビ塔"],
    prefecture: "hokkaido", city: "Sapporo", category: "observation", status: "live", type: "B",
    basis: "living in Sapporo City", ticket: "Observation deck, adult (high-school age+)",
    tiers: [city("hokkaido", "sapporo", "Sapporo City residents", 800, SAPPORO_WARDS), everyone(1200)],
    effectiveFrom: "2026-01-01", previousPriceJPY: 1000,
    proof: "Show something proving you live in Sapporo (driver's license, health insurance card, etc.).", foreignResidents: CITY_RES("Sapporo"),
    notes: ["Elementary/junior-high: ¥400 residents / ¥600 others."],
    sources: ["https://www.tv-tower.co.jp/news.html?n=164", JTA_LIST],
  },
  {
    id: "asahiyama-zoo", name: "Asahiyama Zoo", nameJa: "旭山動物園", aliases: ["asahiyama", "旭山"],
    prefecture: "hokkaido", city: "Asahikawa", category: "zoo_aquarium", status: "live", type: "B",
    basis: "Asahikawa City residents vs others (since 2008)", ticket: "Admission, high-school age+",
    tiers: [city("hokkaido", "asahikawa", "Asahikawa City residents", 700, ["旭川"]), everyone(1000)],
    effectiveFrom: "2008-04-28", proof: "Address proof for Asahikawa residents.", foreignResidents: CITY_RES("Asahikawa"),
    notes: ["One of the oldest resident/non-resident prices at a major Japanese attraction (introduced 2008 at ¥580 / ¥800)."],
    sources: [JTA_LIST],
  },
  {
    id: "takeshima-aquarium", name: "Takeshima Aquarium", nameJa: "竹島水族館", aliases: ["takeshima", "竹島水族館"],
    prefecture: "aichi", city: "Gamagori", category: "zoo_aquarium", status: "live", type: "B",
    basis: "Gamagori City residents vs others", ticket: "Admission, high-school age+",
    tiers: [city("aichi", "gamagori", "Gamagori City residents", 500, ["蒲郡"]), everyone(1200)],
    effectiveFrom: "2024-10-01", proof: "Address proof for Gamagori residents.", foreignResidents: CITY_RES("Gamagori"),
    notes: ["Introduced October 2024 (exact day per facility)."],
    sources: [JTA_LIST],
  },
  {
    id: "chidorigafuchi-boats", name: "Chidorigafuchi boat rental (cherry-blossom season)", nameJa: "千鳥ヶ淵ボート場", aliases: ["chidorigafuchi", "千鳥ヶ淵"],
    prefecture: "tokyo", city: "Chiyoda", category: "boat", status: "live", type: "B",
    basis: "Chiyoda City (ward) residents vs others", ticket: "One boat, 30 minutes, cherry-blossom period",
    tiers: [city("tokyo", "chiyoda", "Chiyoda ward residents", 800, ["千代田"]), everyone(1500)],
    effectiveFrom: "2026-03-01", previousPriceJPY: 800, proof: "Address proof for Chiyoda residents.", foreignResidents: CITY_RES("Chiyoda ward"),
    notes: ["Prices quoted for the cherry-blossom period; check off-season prices with the operator."],
    sources: [JTA_LIST],
  },
  {
    id: "hakoyu", name: "Hakoyu public bath (Shuzenji)", nameJa: "筥湯", aliases: ["hakoyu", "筥湯", "shuzenji"],
    prefecture: "shizuoka", city: "Izu", category: "bath", status: "live", type: "B",
    basis: "Izu City residents and workers vs others", ticket: "Adult (junior-high+)",
    tiers: [city("shizuoka", "izu", "Izu City residents and people working in Izu City", 350, ["伊豆"]), everyone(700)],
    proof: "Address or workplace proof.", foreignResidents: CITY_RES("Izu City"),
    notes: ["Start date not given in the JTA list."],
    sources: [JTA_LIST],
  },
  kitakyushu("kokura-castle", "Kokura Castle", "小倉城", "castle", 400, 500, 350, ["kokura", "小倉城"], ["Junior-high/high-school ¥300, elementary ¥150 for everyone."]),
  kitakyushu("kokura-castle-garden", "Kokura Castle Japanese Garden", "小倉城庭園", "garden", 400, 500, 350, ["kokura garden", "小倉城庭園"]),
  kitakyushu("mojiko-retro-observation", "Mojiko Retro Observation Room", "門司港レトロ展望室", "observation", 400, 600, 300, ["mojiko", "門司港"]),
  kitakyushu("kyushu-railway-museum", "Kyushu Railway History Museum", "九州鉄道記念館", "museum", 400, 500, 300, ["kyushu railway", "鉄道記念館"]),
  kagoshima("hirakawa-zoo", "Hirakawa Zoological Park", "平川動物公園", "zoo_aquarium", "Adult admission", 750, 1000, 500, ["hirakawa", "平川動物公園"], ["https://hirakawazoo.jp/importantinformation/20250901kakakukaitei/"]),
  kagoshima("io-world-aquarium", "Io World Kagoshima Aquarium", "いおワールドかごしま水族館", "zoo_aquarium", "Adult admission", 1500, 2000, 1500, ["io world", "kagoshima aquarium", "いおワールド", "かごしま水族館"], ["https://ioworld.jp/news/news-31476"]),
  kagoshima("ishin-furusato-kan", "Museum of the Meiji Restoration (Ishin Furusato-kan)", "維新ふるさと館", "museum", "Adult admission", 450, 600, 300, ["ishin furusato", "維新ふるさと館"]),
  kagoshima("saigo-nanshu-museum", "Saigo Nanshu Memorial Museum", "西郷南洲顕彰館", "museum", "Adult admission", 300, 400, 200, ["saigo", "西郷南洲顕彰館"]),
  kagoshima("kagoshima-science-hall", "Kagoshima City Science Hall", "鹿児島市立科学館", "museum", "Adult admission", 600, 800, 400, ["science hall", "科学館"]),
  kagoshima("kagoshima-art-museum", "Kagoshima City Museum of Art (permanent collection)", "鹿児島市立美術館", "museum", "Adult, permanent exhibition", 450, 600, 300, ["kagoshima art", "美術館"]),
  kagoshima("kagoshima-literature-museum", "Kagoshima Museum of Modern Literature", "かごしま近代文学館", "museum", "Adult, permanent exhibition", 450, 600, 300, ["literature museum", "近代文学館"]),
  kagoshima("kagoshima-marchen-kan", "Kagoshima Märchen-kan", "かごしまメルヘン館", "museum", "Adult, permanent exhibition", 450, 600, 300, ["marchen", "メルヘン館"]),
  kagoshima("ijinkan-kagoshima", "Former Kagoshima Spinning Mill Engineers' Residence (Ijinkan)", "旧鹿児島紡績所技師館（異人館）", "museum", "Adult admission", 300, 400, 200, ["ijinkan", "異人館", "技師館"]),
  kagoshima("tamazato-tea-house", "Former Shimazu Tamazato Residence garden tea house", "旧島津氏玉里邸庭園 茶室", "garden", "Tea-house use, per hour", 900, 1200, 600, ["tamazato", "玉里邸"]),
  kagoshima("kagoshima-craft-village", "Kagoshima Culture & Craft Village", "かごしま文化工芸村", "museum", "Adult ticket", 300, 400, 200, ["craft village", "文化工芸村"]),
  {
    id: "miyajima-visit-tax", name: "Miyajima Visit Tax (Itsukushima)", nameJa: "宮島訪問税", aliases: ["miyajima", "itsukushima", "宮島", "宮島訪問税"],
    prefecture: "hiroshima", city: "Hatsukaichi", category: "tax", status: "live", type: "A",
    basis: "residents of the Miyajima area and regular commuters/students are exempt; every other visitor pays (any nationality)", ticket: "Per person, per entry by ferry",
    tiers: [{ who: { kind: "area", prefecture: "hiroshima", area: "Miyajima-cho", aliases: ["miyajima", "miyajimacho", "宮島町", "宮島"] }, label: "Miyajima-area residents, commuters/students 48h+/month (certificate needed)", priceJPY: 0 }, everyone(100, "Everyone else (incl. other Hatsukaichi and Hiroshima residents)")],
    effectiveFrom: "2023-10-01",
    proof: "Exempt people need a certificate from Hatsukaichi City. Usually collected with the ferry fare.",
    foreignResidents: "Only Miyajima-area residents and qualifying commuters/students are exempt; other Japan residents pay like tourists.",
    notes: ["Annual option: ¥500 per person per year (apply by the 10th of the month before your first visit).", "Under-18s and some school trips are exempt."],
    sources: ["https://www.city.hatsukaichi.hiroshima.jp/soshiki/110/59551.html", JTA_LIST],
  },
  {
    id: "iwami-ginzan-center", name: "Iwami Ginzan World Heritage Center", nameJa: "石見銀山世界遺産センター", aliases: ["iwami ginzan", "石見銀山"],
    prefecture: "shimane", city: "Oda", category: "museum", status: "live", type: "R",
    basis: "reverse dual pricing: a cheaper 'foreigner' rate to attract overseas visitors", ticket: "General admission",
    tiers: [{ who: { kind: "overseas" }, label: "Foreign visitors (show passport at reception)", priceJPY: 300 }, everyone(400, "General")],
    proof: "Show a passport at reception.",
    foreignResidents: "The JTA list describes it as a 外国人 (foreigner) rate with passport check; ask at reception whether residents with a residence card qualify.",
    notes: ["A rare case where visitors from abroad pay LESS."],
    sources: [JTA_LIST],
  },
  {
    id: "national-museums", name: "Japan's national museums and art museums", nameJa: "国立博物館・国立美術館", aliases: ["tokyo national museum", "national museum", "国立博物館", "東京国立博物館", "国立美術館", "national museum of western art"],
    prefecture: "tokyo", city: "Tokyo, Kyoto, Nara, Dazaifu and others", category: "museum", status: "announced", type: "A",
    basis: "non-residents of Japan pay more; foreign residents of Japan are not targeted (government policy)", ticket: "General admission",
    tiers: [{ who: { kind: "japan" }, label: "Japan residents (current price)", priceJPY: null }, everyone(null, "Visitors from abroad (higher price, amount not set)")],
    plannedFrom: "by the end of FY2030 (March 2031); dates differ by museum",
    proof: "Not decided; verifying residence at the door is the main open issue.",
    foreignResidents: "Policy targets non-residents; foreign nationals living in Japan are not supposed to pay the higher price.",
    notes: ["Agency for Cultural Affairs policy (March 2026) for the national museums and art museums (Tokyo, Kyoto, Nara, Kyushu National Museums; National Museum of Western Art; National Museum of Modern Art, etc.).", "Reports mention up to ¥3,000 at the Tokyo National Museum (today ¥1,000), but no price is official."],
    sources: ["https://www.japantimes.co.jp/news/2026/03/05/japan/national-museums-dual-pricing/", "https://www.bunka.go.jp/bunkacho/shokan_hojin/94340601.html", JTA_LIST],
  },
  {
    id: "kenrokuen", name: "Kenrokuen Garden", nameJa: "兼六園", aliases: ["kenrokuen", "kenroku-en", "兼六園", "kanazawa"],
    prefecture: "ishikawa", city: "Kanazawa", category: "garden", status: "under_review", type: "A",
    basis: "Ishikawa Prefecture residents vs tourists (under discussion)", ticket: "Garden admission",
    tiers: [everyone(null, "Everyone (one price today)")],
    plannedFrom: "not decided; committee interim report around summer 2027, so not before summer 2027",
    proof: "n/a", foreignResidents: "n/a (no decision)",
    notes: ["Ishikawa's committee on Kenrokuen's future held its first meeting on 2026-10-14 to discuss whether to separate prefecture residents and tourists, funding and upkeep."],
    sources: ["https://newsdig.tbs.co.jp/articles/-/3011433"],
  },
  {
    id: "osaka-castle", name: "Osaka Castle Main Tower", nameJa: "大阪城天守閣", aliases: ["osaka castle", "大阪城", "osakajo"],
    prefecture: "osaka", city: "Osaka", category: "castle", status: "not_adopted", type: "none",
    basis: "one price for everyone", ticket: "Adult admission",
    tiers: [everyone(1200, "Everyone (adults)")],
    proof: "None needed (students show a student ID for ¥600).", foreignResidents: "Same price for everyone.",
    notes: ["Osaka Prefecture's expert panel advised against a foreigner levy / dual pricing in August 2025 and the governor dropped it; the castle charges ¥1,200 to every adult."],
    sources: ["https://www.osakacastle.net/guide/", "https://www.pref.osaka.lg.jp/documents/108411/dainijitousin.pdf"],
  },
];

function KYOTO_WARDS(): string[] {
  return ["kyoto-shi", "kyotoshi", "京都市", "kita-ku", "kamigyo", "sakyo", "nakagyo", "higashiyama", "shimogyo", "minami-ku", "ukyo", "fushimi", "yamashina", "nishikyo", "上京区", "左京区", "中京区", "東山区", "下京区", "右京区", "伏見区", "山科区", "西京区"];
}

export const PREFECTURES: Record<string, { en: string; ja: string }> = {
  hokkaido: { en: "Hokkaido", ja: "北海道" }, aomori: { en: "Aomori", ja: "青森県" }, iwate: { en: "Iwate", ja: "岩手県" }, miyagi: { en: "Miyagi", ja: "宮城県" },
  akita: { en: "Akita", ja: "秋田県" }, yamagata: { en: "Yamagata", ja: "山形県" }, fukushima: { en: "Fukushima", ja: "福島県" }, ibaraki: { en: "Ibaraki", ja: "茨城県" },
  tochigi: { en: "Tochigi", ja: "栃木県" }, gunma: { en: "Gunma", ja: "群馬県" }, saitama: { en: "Saitama", ja: "埼玉県" }, chiba: { en: "Chiba", ja: "千葉県" },
  tokyo: { en: "Tokyo", ja: "東京都" }, kanagawa: { en: "Kanagawa", ja: "神奈川県" }, niigata: { en: "Niigata", ja: "新潟県" }, toyama: { en: "Toyama", ja: "富山県" },
  ishikawa: { en: "Ishikawa", ja: "石川県" }, fukui: { en: "Fukui", ja: "福井県" }, yamanashi: { en: "Yamanashi", ja: "山梨県" }, nagano: { en: "Nagano", ja: "長野県" },
  gifu: { en: "Gifu", ja: "岐阜県" }, shizuoka: { en: "Shizuoka", ja: "静岡県" }, aichi: { en: "Aichi", ja: "愛知県" }, mie: { en: "Mie", ja: "三重県" },
  shiga: { en: "Shiga", ja: "滋賀県" }, kyoto: { en: "Kyoto", ja: "京都府" }, osaka: { en: "Osaka", ja: "大阪府" }, hyogo: { en: "Hyogo", ja: "兵庫県" },
  nara: { en: "Nara", ja: "奈良県" }, wakayama: { en: "Wakayama", ja: "和歌山県" }, tottori: { en: "Tottori", ja: "鳥取県" }, shimane: { en: "Shimane", ja: "島根県" },
  okayama: { en: "Okayama", ja: "岡山県" }, hiroshima: { en: "Hiroshima", ja: "広島県" }, yamaguchi: { en: "Yamaguchi", ja: "山口県" }, tokushima: { en: "Tokushima", ja: "徳島県" },
  kagawa: { en: "Kagawa", ja: "香川県" }, ehime: { en: "Ehime", ja: "愛媛県" }, kochi: { en: "Kochi", ja: "高知県" }, fukuoka: { en: "Fukuoka", ja: "福岡県" },
  saga: { en: "Saga", ja: "佐賀県" }, nagasaki: { en: "Nagasaki", ja: "長崎県" }, kumamoto: { en: "Kumamoto", ja: "熊本県" }, oita: { en: "Oita", ja: "大分県" },
  miyazaki: { en: "Miyazaki", ja: "宮崎県" }, kagoshima: { en: "Kagoshima", ja: "鹿児島県" }, okinawa: { en: "Okinawa", ja: "沖縄県" },
};
