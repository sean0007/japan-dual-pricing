# Japan Dual Pricing Check (二重価格)

Free checker of **Japan's dual pricing**: resident vs non-resident admission prices at Japanese tourist sites. Pick places, say where you live, get what you pay, the cheapest local price, the difference, planned prices, proof rules and official sources.

- Live: https://japan-dual-pricing.vercel.app
- API: `GET/POST /api/check`, `GET /api/rules`
- Agent docs: `/llms.txt`, `/openapi.json`, `/.well-known/ai-plugin.json`
- MCP tool: `japan_dual_pricing_check` on https://free-agent-tools.vercel.app/mcp

**Educational guide, not legal, travel or financial advice.** Each facility sets its prices and decides.

## Example

```
GET https://japan-dual-pricing.vercel.app/api/check?places=himeji-castle,odawara-castle,nanzoin&residence=overseas&date=2026-11-20
```
→ you pay ¥4,000, cheapest residents ¥1,500, extra ¥2,500.

## Data (as of 2026-10-16)

32 places: in force (Himeji Castle, Odawara Castle, Nanzoin, JUNGLIA Okinawa, Nara Prison Museum, Sapporo TV Tower, Asahiyama Zoo, Takeshima Aquarium, Chidorigafuchi boats, Hakoyu, 4 Kitakyushu facilities, 11 Kagoshima City facilities, Miyajima visitor tax, Iwami Ginzan centre), announced (Nijo Castle, Kyoto City Bus, national museums), under review (Kenrokuen), dropped (Osaka Castle).

Rule: residence (city / prefecture / Japan / overseas), not nationality. Before a scheme's start date the old single price applies; announced schemes show today's price plus the planned price.

Sources: Japan Tourism Agency study group page and case list PDF (2026-07-14), plus each facility's or city's official page (see `/api/rules`). Snapshots in the maker's research folder.

## Develop

```
npm install
npm test        # node:test via tsx
npm run build
```
