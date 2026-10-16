import { ImageResponse } from "next/og";
import { checkDualPricing } from "@/lib/dual";
import { EXAMPLE_SHARED, parseShared, toCheckInput, yen } from "@/lib/share";

export async function GET(req: Request) {
  const shared = parseShared(new URL(req.url).searchParams) ?? EXAMPLE_SHARED;
  const r = checkDualPricing(toCheckInput(shared));
  const stats = [
    { label: shared.residence === "overseas" ? "you pay (from abroad)" : "you pay (Japan resident)", value: yen(r.summary.totalYouPayJPY) },
    { label: "cheapest local price", value: yen(r.summary.totalCheapestResidentJPY) },
    { label: "difference", value: yen(r.summary.extraYouPayJPY) },
  ];
  const names = r.places.map((p) => p.name).slice(0, 4).join(" · ");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#07080c", color: "#f3efe4", padding: "56px 64px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: "0.24em", textTransform: "uppercase", color: "#f0b429" }}>Japan dual pricing</div>
          <div style={{ display: "flex", fontSize: 22, color: "#9b9588" }}>data as of {r.dataAsOf}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 34, color: "#c9c3b6" }}>{names}</div>
          <div style={{ display: "flex", marginTop: 10, fontSize: 72, fontWeight: 800, letterSpacing: "-0.03em", color: r.summary.extraYouPayJPY > 0 ? "#fda4af" : "#99f6e4", lineHeight: 1.05 }}>
            {r.summary.extraYouPayJPY > 0 ? `${yen(r.summary.extraYouPayJPY)} more than locals` : "Same price as locals"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", flex: 1, border: "2px solid #23252c", borderRadius: 24, padding: "14px 20px", background: "#101218" }}>
              <span style={{ fontSize: 40, fontWeight: 700, color: "#f3efe4" }}>{s.value}</span>
              <span style={{ fontSize: 20, color: "#9b9588" }}>{s.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#6f6a60" }}>
          <span>japan-dual-pricing.vercel.app · free, no login</span>
          <span>Not advice. The facility decides.</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable" } },
  );
}
