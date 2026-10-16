import type { Metadata } from "next";
import { RULES_AS_OF, SOURCES } from "@/lib/dual";
import { DISCLAIMER_SHORT, HONESTY } from "@/lib/site";

export const metadata: Metadata = { title: "Disclaimer", description: DISCLAIMER_SHORT };

export default function DisclaimerPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Read this</p>
      <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">Disclaimer</h1>
      <p className="mt-4 text-lg text-foreground">{DISCLAIMER_SHORT}</p>
      <p className="mt-2 text-muted">{HONESTY}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-semibold text-foreground">What this is</h2>
          <p className="mt-2">
            A free, unofficial educational checker. It applies a dated copy (as of {RULES_AS_OF}) of resident / non-resident admission prices at Japanese tourist sites, taken from the Japan Tourism Agency&apos;s study-group case list (2026-07-14) and each facility&apos;s or city&apos;s official page, to the places you pick, where you live and your visit date. It is not affiliated with any facility, city or government agency.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">What it is not</h2>
          <p className="mt-2">
            It is not legal, travel or financial advice, and it does not sell tickets. Each facility sets and can change its prices, discounts, age bands and proof rules at any time; announced plans (Nijo Castle, Kyoto City Bus, national museums) still need ordinances or approvals and can change or be dropped. Totals are adult admission only and ignore groups, combos, passes, disability discounts and seasonal prices. Always check the facility&apos;s official page before you go. The list is not complete: a place not listed may still have a resident price.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Residence, not nationality</h2>
          <p className="mt-2">
            The schemes listed here use where you are registered as living (a city, a prefecture or Japan), not your nationality or appearance. Where a page says &quot;foreign residents pay the resident price&quot;, that is our reading of the facility&apos;s published rule; staff decide at the gate based on the ID you show.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Sources</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 break-all">
            {SOURCES.map((s) => (
              <li key={s}>
                <a href={s} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Your data</h2>
          <p className="mt-2">Choices you make stay in your browser (or in a share link you create). No login, no ID numbers, no database. Anonymous page-view analytics only.</p>
        </section>
      </div>
    </div>
  );
}
