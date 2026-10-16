"use client";

import { useState } from "react";
import { CardDisclaimer } from "@/components/card-disclaimer";
import { ShareBar } from "@/components/share-bar";
import { PLACES, PREFECTURES, STATUS_LABEL, checkDualPricing, type Residence } from "@/lib/dual";
import { EXAMPLE_SHARED, PUBLIC_URL, fmtDate, resultPath, toCheckInput, yen, type Shared } from "@/lib/share";

const field = "mt-2 w-full rounded-xl border border-line bg-black/40 px-3 py-2 text-sm text-foreground focus:border-amber";

const GROUPS: { status: string; label: string }[] = [
  { status: "live", label: "Dual pricing in force" },
  { status: "announced", label: "Announced (not in force yet)" },
  { status: "under_review", label: "Under review" },
  { status: "not_adopted", label: "Dropped: one price" },
];

const TONE: Record<string, string> = {
  in_force: "text-rose-300",
  not_yet_in_force: "text-muted",
  planned: "text-amber",
  under_review: "text-muted",
  one_price: "text-teal-200",
};

export function Calculator({ initial }: { initial?: Shared }) {
  const start = initial ?? EXAMPLE_SHARED;
  const [places, setPlaces] = useState<string[]>(start.places);
  const [residence, setResidence] = useState<Residence>(start.residence);
  const [prefecture, setPrefecture] = useState<string>(start.prefecture ?? "");
  const [city, setCity] = useState<string>(start.city ?? "");
  const [date, setDate] = useState<string>(start.date ?? "");

  const shared: Shared = {
    places: places.length ? places : ["himeji-castle"],
    residence,
    prefecture: residence === "japan" && prefecture ? prefecture : null,
    city: residence === "japan" && city.trim() ? city.trim() : null,
    date: date || null,
  };
  const result = (() => {
    try {
      return checkDualPricing(toCheckInput(shared));
    } catch {
      return null;
    }
  })();
  const shareUrl = `${PUBLIC_URL}${resultPath(shared)}`;
  const toggle = (id: string) => setPlaces((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="rounded-3xl border border-line bg-panel/60 p-5 sm:p-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">Your trip</p>

        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-foreground">Where do you live?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ["overseas", "Abroad (visiting Japan)"],
                ["japan", "In Japan (any nationality)"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setResidence(v)}
                className={`rounded-full border px-3 py-1.5 text-sm ${residence === v ? "border-amber bg-amber/15 text-foreground" : "border-line text-muted hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        {residence === "japan" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-foreground">Prefecture of your address</span>
              <select value={prefecture} onChange={(e) => setPrefecture(e.target.value)} className={field}>
                <option value="">(any / not sure)</option>
                {Object.entries(PREFECTURES).map(([slug, p]) => (
                  <option key={slug} value={slug}>
                    {p.en} {p.ja}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">City / ward</span>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Himeji, Sakyo-ku, Kagoshima" className={field} />
            </label>
          </div>
        ) : null}

        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">Visit date (optional)</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
        </label>

        <div className="mt-5">
          <p className="text-sm font-medium text-foreground">Places ({places.length} picked)</p>
          {GROUPS.map((g) => (
            <div key={g.status} className="mt-3">
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">{g.label}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {PLACES.filter((p) => p.status === g.status).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    data-place={p.id}
                    onClick={() => toggle(p.id)}
                    className={`rounded-full border px-2.5 py-1 text-xs ${places.includes(p.id) ? "border-amber bg-amber/15 text-foreground" : "border-line text-muted hover:text-foreground"}`}
                    title={`${p.nameJa} · ${p.city}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-3xl border border-line bg-black/40">
        <div className="flex-1 p-5 sm:p-7">
          {result ? (
            <>
              <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">What you pay · {fmtDate(result.input.date)}</p>
              <p data-testid="headline" className="mt-3 text-lg font-semibold leading-snug text-foreground sm:text-xl">
                {result.headline}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl border border-line p-3">
                  <p className="font-mono text-xl text-foreground">{yen(result.summary.totalYouPayJPY)}</p>
                  <p className="text-[11px] text-muted">you pay</p>
                </div>
                <div className="rounded-2xl border border-line p-3">
                  <p className="font-mono text-xl text-foreground">{yen(result.summary.totalCheapestResidentJPY)}</p>
                  <p className="text-[11px] text-muted">cheapest resident</p>
                </div>
                <div className="rounded-2xl border border-line p-3">
                  <p className="font-mono text-xl text-rose-300">{yen(result.summary.extraYouPayJPY)}</p>
                  <p className="text-[11px] text-muted">extra</p>
                </div>
              </div>
              <ul className="mt-5 space-y-3">
                {result.places.map((r) => (
                  <li key={r.id} className="rounded-2xl border border-line p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-medium text-foreground">
                        {r.name} <span className="text-muted">{r.nameJa}</span>
                      </p>
                      <p className={`font-mono text-sm ${TONE[r.onDate]}`}>{STATUS_LABEL[r.status]}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      You: <span className="text-foreground">{yen(r.yourPriceJPY)}</span> ({r.yourTier})
                      {r.plannedYourPriceJPY !== null && r.onDate !== "in_force" ? (
                        <>
                          {" "}→ planned <span className="text-amber">{yen(r.plannedYourPriceJPY)}</span>
                        </>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-muted">{r.tiers.map((t) => `${t.label}: ${yen(t.priceJPY)}`).join(" · ")}</p>
                    <p className="mt-1 text-xs text-muted">
                      {r.ticket}. {r.effectiveFrom ? `Since ${r.effectiveFrom}. ` : ""}
                      {r.plannedFrom ? `Planned: ${r.plannedFrom}. ` : ""}Proof: {r.proof}
                    </p>
                    {r.warnings.length ? <p className="mt-1 text-xs text-amber/90">{r.warnings.join(" ")}</p> : null}
                    <p className="mt-1 text-xs">
                      {r.sources.slice(0, 2).map((s, i) => (
                        <a key={s} href={s} target="_blank" rel="noopener noreferrer" className="mr-3 text-muted underline underline-offset-2 hover:text-foreground">
                          source {i + 1}
                        </a>
                      ))}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted">{result.summary.basisNote}</p>
              <div className="mt-5">
                <ShareBar url={shareUrl} text={`Japan dual pricing: ${result.headline}`} />
              </div>
            </>
          ) : (
            <p className="text-muted">Pick at least one place.</p>
          )}
        </div>
        <CardDisclaimer />
      </div>
    </div>
  );
}
