export const SITE_NAME = "Japan Dual Pricing Check";

export const SITE_TAGLINE =
  "Do tourists pay more in Japan? Resident vs non-resident prices at Himeji Castle (¥2,500 vs ¥1,000), Nanzoin, JUNGLIA, Nara Prison Museum, Kitakyushu and Kagoshima, plus the planned Nijo Castle and Kyoto City Bus prices (FY2027). Pick places, say where you live, get what you pay and why.";

export const DISCLAIMER_SHORT = "Educational guide, not legal, travel or financial advice. Prices change and the ticket counter decides who gets a resident price; check the official source.";

export const HONESTY =
  "Data as of 2026-10-16 from official facility and city pages and the Japan Tourism Agency's case list (study group, 2026-07-14), plus dated news for announced plans. Not affiliated with any facility, city or the Japan Tourism Agency.";

export const SIBLING_TOOLS = [
  { href: "https://japan-tax-free-refund.vercel.app", label: "Japan Tax-Free Refund" },
  { href: "https://japan-customs-allowance.vercel.app", label: "Japan Customs Allowance" },
  { href: "https://japan-luggage.vercel.app", label: "Japan Luggage Check" },
  { href: "https://kyushu-travel-discount.vercel.app", label: "Kyushu Travel Discount" },
  { href: "https://japan-visa-fee.vercel.app", label: "Japan Visa Fee Calculator" },
  { href: "https://japan-tb-screening.vercel.app", label: "Japan TB Screening (JPETS)" },
  { href: "https://japan-alert-decoder.vercel.app", label: "Japan Alert Decoder" },
  { href: "https://japan-pr-check.vercel.app", label: "Japan PR Guideline Check" },
  { href: "https://japan-intl-postage.vercel.app", label: "Japan International Postage 2027" },
  { href: "https://japan-reentry-check.vercel.app", label: "Japan Re-entry Deadline Check" },
  { href: "https://japan-overseas-dependents.vercel.app", label: "Japan Overseas Dependents Check" },
  { href: "https://japan-parttime-check.vercel.app", label: "Japan Part-time Work Check" },
  { href: "https://japan-driving-check.vercel.app", label: "Japan Driving Check" },
  { href: "https://house-rules-check.vercel.app", label: "House Rules Check" },
  { href: "https://japan-mynumber-card-check.vercel.app", label: "Japan My Number Card Check" },
  { href: "https://japan-trip-brain.vercel.app", label: "Japan Trip Brain" },
  { href: "https://free-agent-tools.vercel.app", label: "Free Agent Tools MCP" },
] as const;

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production.replace(/^https?:\/\//, "")}`;
  return "https://japan-dual-pricing.vercel.app";
}
