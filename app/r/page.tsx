import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Calculator } from "@/components/calculator";
import { checkDualPricing } from "@/lib/dual";
import { EXAMPLE_SHARED, PUBLIC_URL, fmtDate, isIndexable, ogPath, parseShared, resultPath, toCheckInput, yen } from "@/lib/share";
import { DISCLAIMER_SHORT, HONESTY } from "@/lib/site";

type SP = Promise<Record<string, string | string[] | undefined>>;

function who(res: string, pref: string | null, city: string | null) {
  if (res === "overseas") return "a visitor from abroad";
  return `a Japan resident${city ? ` (${city})` : pref ? ` (${pref})` : ""}`;
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const shared = parseShared(await searchParams);
  if (!shared) return { title: "Your result", robots: { index: false, follow: true } };
  const r = checkDualPricing(toCheckInput(shared));
  const names = r.places.map((p) => p.name).slice(0, 4).join(", ");
  const title = `${names}: ${yen(r.summary.totalYouPayJPY)} for ${who(shared.residence, shared.prefecture, shared.city)}`;
  const description = `${r.headline} Japan dual pricing (二重価格) data as of ${r.dataAsOf}. Educational guide; the facility decides.`;
  const url = `${PUBLIC_URL}${resultPath(shared)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: isIndexable(shared) ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title: `Japan Dual Pricing · ${title}`, description, type: "website", url, images: [{ url: ogPath(shared), width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title: `Japan Dual Pricing · ${title}`, description, images: [ogPath(shared)] },
  };
}

export default async function ResultPage({ searchParams }: { searchParams: SP }) {
  const shared = parseShared(await searchParams);
  if (!shared) redirect("/");
  const r = checkDualPricing(toCheckInput(shared));
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <section className="max-w-3xl">
        <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Shared result · Japan dual pricing</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">
          {yen(r.summary.totalYouPayJPY)} for {who(shared.residence, shared.prefecture, shared.city)}
          {r.summary.extraYouPayJPY > 0 ? <span className="text-rose-300"> · {yen(r.summary.extraYouPayJPY)} more than locals</span> : null}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          {r.headline} · {fmtDate(r.input.date)} · data as of {r.dataAsOf}
        </p>
        <p className="mt-4 text-sm">
          <Link href="/" className="text-muted underline underline-offset-2 hover:text-foreground">
            ← Start over
          </Link>
          {resultPath(shared) === resultPath(EXAMPLE_SHARED) ? null : (
            <>
              {" · "}
              <Link href={resultPath(EXAMPLE_SHARED)} className="text-muted underline underline-offset-2 hover:text-foreground">
                Open the example
              </Link>
            </>
          )}
        </p>
      </section>
      <section className="mt-8">
        <Calculator initial={shared} />
      </section>
      <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted">
        {DISCLAIMER_SHORT} {HONESTY}
      </p>
    </div>
  );
}
