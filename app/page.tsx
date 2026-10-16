import type { Metadata } from "next";
import { Calculator } from "@/components/calculator";
import { FaqSection, type FaqItem } from "@/components/faq-section";
import { DATA_AS_OF, PLACES, STATUS_LABEL } from "@/lib/dual";
import { PUBLIC_URL, yen } from "@/lib/share";

const title = "Japan dual pricing 2026: do tourists pay more? Himeji Castle, Nijo Castle, Kyoto bus and more";
const description =
  "Free checker of Japan's dual pricing (二重価格): resident vs non-resident prices at Himeji Castle (¥1,000 / ¥2,500), Odawara Castle, Nanzoin, JUNGLIA Okinawa, Nara Prison Museum, Sapporo TV Tower, Kitakyushu and Kagoshima City, plus the planned Nijo Castle (¥1,000 / ¥2,000) and Kyoto City Bus (¥200 / ¥360) prices for FY2027. Residence, not nationality. Free JSON API for AI agents. Not advice.";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description },
  twitter: { title, description },
};

const live = PLACES.filter((p) => p.status === "live");
const webAppLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Japan Dual Pricing Check",
  alternateName: ["Japan tourist price checker", "二重価格 チェッカー", "Japan foreigner price list"],
  url: PUBLIC_URL,
  applicationCategory: "TravelApplication",
  operatingSystem: "Any",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
  inLanguage: ["en", "ja"],
  description:
    "Unofficial, free checker of resident vs non-resident (dual) prices at Japanese tourist sites, with dated official sources and a keyless JSON API. Educational guide, not legal, travel or financial advice.",
};

const faq: FaqItem[] = [
  {
    q: "Do tourists pay more in Japan?",
    a: `At a short but growing list of places, yes. As of ${DATA_AS_OF} this checker tracks ${live.length} places with dual pricing in force. The best known is Himeji Castle: since March 1, 2026 adults pay ¥2,500 unless they live in Himeji City (¥1,000), and under-18s are free. Most shops, restaurants, trains and temples still charge everyone the same price.`,
  },
  {
    q: "Is Japan's dual pricing based on nationality?",
    a: "Almost never. Japanese dual pricing is based on where you are registered as living: the city (Himeji, Odawara, Kitakyushu, Kagoshima, Sapporo), the prefecture (Nara Prison Museum's Nara rate) or Japan as a whole (JUNGLIA, Nanzoin, the planned national-museum prices). A Japanese visitor from Tokyo pays the same ¥2,500 at Himeji Castle as a tourist from abroad, and a foreign resident of Himeji pays ¥1,000.",
  },
  {
    q: "Do foreign residents of Japan pay the tourist price?",
    a: "Usually not. If you live in Japan with a residence card and a registered address, you get the resident price wherever the test is 'lives in Japan' (Nanzoin is free, JUNGLIA is ¥6,930 instead of ¥8,800, Nara Prison Museum ¥2,500 instead of ¥3,500). Where the test is a specific city, you need an address in that city, like any Japanese citizen. Carry your residence card or My Number card.",
  },
  {
    q: "How much is Himeji Castle for foreigners in 2026?",
    a: "¥2,500 for adults (18+) who do not live in Himeji City, which includes tourists from abroad and people from the rest of Japan. Himeji residents pay ¥1,000 and verify with a My Number card (digital ticket) or ID at the booth. Under-18s are free for everyone. Groups of 30+: ¥2,000 (non-residents). Himeji Castle + Kōko-en combo ¥2,600.",
  },
  {
    q: "Is Nijo Castle in Kyoto introducing dual pricing?",
    a: "Yes, it is planned. On October 1, 2026 Kyoto's mayor announced that the entry + Ninomaru Palace set ticket (¥1,300 today) will become ¥1,000 for Kyoto City residents and ¥2,000 for everyone else during FY2027 (April 2027 to March 2028). The ordinance goes to the city council in November 2026. Until then everyone pays ¥1,300.",
  },
  {
    q: "Will Kyoto city buses cost more for tourists?",
    a: "That is the plan. Kyoto City's 'citizen-priority fare' (市民優先価格) would make the flat-zone bus fare ¥200 for registered Kyoto City residents and ¥360 for everyone else (today ¥230 for all), from FY2027, subject to national approval. Residents would link a My Number card to an IC card; cash payers pay the non-resident fare. Residents of neighbouring cities would also pay ¥360.",
  },
  {
    q: "Which places in Japan have a foreigner price?",
    a: `In force: ${live.slice(0, 10).map((p) => p.name).join(", ")}, and more (see the checker). Announced: Nijo Castle and Kyoto City Bus (FY2027), national museums and art museums (by March 2031). Under review: Kenrokuen (committee from October 2026). Dropped: Osaka Castle (¥1,200 for everyone).`,
  },
  {
    q: "Do Japan's national museums charge foreigners more?",
    a: "Not yet. The Agency for Cultural Affairs decided in 2026 that national museums and art museums (Tokyo National Museum, Kyoto, Nara, Kyushu, the National Museum of Western Art and others) will introduce a higher price for visitors who do not live in Japan by the end of FY2030 (March 2031). No museum has set a price; reports of up to ¥3,000 at the Tokyo National Museum (¥1,000 today) are not official. Foreign residents are not supposed to pay the higher price.",
  },
  {
    q: "Do Japanese ski resorts or hotels charge foreigners more?",
    a: "This checker only lists places with an official, documented resident / non-resident price. Many 'foreigner price' stories online are really local-resident discounts (a lower price for people registered in the town) or seasonal pricing that applies to everyone. If a place is not listed here, assume one price and check the operator's current price list.",
  },
  {
    q: "What ID do I need for the resident price?",
    a: "Something showing your address: a My Number card, driver's license, health insurance card or residence card. Some places (Kagoshima City, Himeji) also accept a digital ID. Without proof you pay the general price, even if you live there.",
  },
  {
    q: "Is dual pricing legal in Japan?",
    a: "There is no law against it, and each facility decides. The Japan Tourism Agency set up a study group on tourist-site pricing in April 2026 and plans guidelines for public facilities by March 2027, so more places are expected to follow. Osaka Prefecture considered and dropped a foreigner levy in 2025.",
  },
  {
    q: "Is there a free API for Japan dual pricing?",
    a: `Yes. Free, no key, CORS open: GET ${PUBLIC_URL}/api/check?places=himeji-castle,odawara-castle,nanzoin&residence=overseas returns what you pay at each place, the cheapest resident price, the difference, planned prices, proof rules and sources. All data at ${PUBLIC_URL}/api/rules, OpenAPI at ${PUBLIC_URL}/openapi.json, and the japan_dual_pricing_check tool on https://free-agent-tools.vercel.app/mcp.`,
  },
  {
    q: "二重価格を導入している観光施設は？",
    a: "姫路城（姫路市民1,000円／市民以外2,500円、2026年3月〜）、小田原城（市民500円／市民以外1,000円）、南蔵院（日本在住者は無料／海外からの参拝者500円）、ジャングリア沖縄（国内在住者6,930円／一般8,800円）、奈良監獄ミュージアム（奈良県民2,000円／日本在住2,500円／海外在住3,500円）、さっぽろテレビ塔、北九州市の4施設、鹿児島市の14施設などです。二条城（市民1,000円／市民以外2,000円）と京都市バス（市民200円／市民以外360円）は2027年度の導入予定です。",
  },
  {
    q: "在日外国人も観光客料金になりますか？",
    a: "多くの施設は国籍ではなく住所（住民登録）で判定します。日本在住が条件の施設（南蔵院、ジャングリア沖縄など）では在留カード等で住所が確認できれば在住者料金、市民料金の施設（姫路城など）ではその市に住所がある人だけが市民料金です。他市に住む日本人も市民以外の料金になります。",
  },
];

export default function HomePage() {
  const rows = PLACES.filter((p) => p.status !== "flat").slice(0, 40);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <section className="max-w-3xl">
        <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Free · Japan · 二重価格 · data {DATA_AS_OF}</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">Do tourists pay more in Japan?</h1>
        <p className="mt-4 max-w-2xl text-lg font-medium text-foreground sm:text-xl">Japan dual pricing checker: resident vs non-resident prices</p>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          Himeji Castle now charges ¥2,500 to anyone who doesn&apos;t live in Himeji. Nijo Castle and Kyoto&apos;s buses plan the same for 2027. Pick the places on your trip, say where you live, and see what you pay, why, and what ID gets the local price.
        </p>
      </section>

      <section className="mt-8">
        <Calculator />
      </section>

      <section className="mt-16 max-w-4xl">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">All tracked places</h2>
        <div className="mt-5 overflow-x-auto rounded-3xl border border-line">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-panel/80 text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Place</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Prices (adult)</th>
                <th className="px-4 py-3 font-medium">Since / planned</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-line align-top">
                  <td className="px-4 py-3 text-foreground">
                    {p.name} <span className="text-muted">{p.nameJa}</span>
                    <div className="text-xs text-muted">{p.city}</div>
                  </td>
                  <td className="px-4 py-3 text-muted">{STATUS_LABEL[p.status]}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.tiers.map((t) => `${t.label.split(" (")[0]}: ${yen(t.priceJPY)}`).join(" · ")}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.effectiveFrom ?? p.plannedFrom ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted">
          Main source:{" "}
          <a className="underline underline-offset-2 hover:text-foreground" href="https://www.mlit.go.jp/kankocho/page08_00012.html" target="_blank" rel="noopener noreferrer">
            Japan Tourism Agency study group on tourist-site pricing
          </a>{" "}
          (case list PDF, 2026-07-14) plus each facility&apos;s or city&apos;s official page, linked per place in the checker and in{" "}
          <a className="underline underline-offset-2 hover:text-foreground" href="/api/rules">
            /api/rules
          </a>
          .
        </p>
      </section>

      <section className="mt-12 max-w-3xl rounded-3xl border border-line bg-panel/40 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">For AI agents and developers</h2>
        <p className="mt-2 text-sm text-muted">
          Keyless JSON, CORS open, GET or POST:{" "}
          <a className="font-mono text-foreground underline underline-offset-2" href="/api/check?places=himeji-castle,odawara-castle,nanzoin&residence=overseas">
            /api/check?places=himeji-castle,odawara-castle,nanzoin&amp;residence=overseas
          </a>
          . All places: <a className="font-mono text-foreground underline underline-offset-2" href="/api/rules">/api/rules</a>. Docs: <a className="underline underline-offset-2" href="/openapi.json">OpenAPI</a>,{" "}
          <a className="underline underline-offset-2" href="/llms.txt">llms.txt</a>, MCP tool <span className="font-mono text-foreground">japan_dual_pricing_check</span> on{" "}
          <a className="underline underline-offset-2" href="https://free-agent-tools.vercel.app" target="_blank" rel="noopener noreferrer">
            free-agent-tools
          </a>
          .
        </p>
      </section>

      <FaqSection items={faq} heading="Japan dual pricing questions" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
