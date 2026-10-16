import { openapiDoc, preflight, staticJson } from "@/lib/agent-api";
import { API_INFO, ENDPOINTS, PUBLIC_URL } from "@/lib/api";

export function GET() {
  const base = openapiDoc(API_INFO, PUBLIC_URL, Object.values(ENDPOINTS)) as {
    paths: Record<string, unknown>;
    [k: string]: unknown;
  };
  base.paths["/api/rules"] = {
    get: {
      operationId: "japanDualPricingRules",
      summary: "All tracked places with resident / non-resident prices, status, dates, proof rules and sources",
      description: "Returns every tracked Japanese tourist site with dual pricing (live, announced, under review, dropped): price tiers by residence (city, prefecture, Japan, overseas), effective / planned dates, previous price, proof of residence, foreign-resident note, sources, the 47 prefecture slugs, key facts and disclaimer. No inputs.",
      responses: {
        "200": {
          description: "Rules JSON with dataAsOf and sources.",
          content: { "application/json": { schema: { type: "object", additionalProperties: true } } },
        },
      },
    },
  };
  return staticJson(base);
}
export const OPTIONS = preflight;
