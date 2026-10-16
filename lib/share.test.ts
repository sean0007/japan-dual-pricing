import assert from "node:assert/strict";
import test from "node:test";
import { checkDualPricing } from "./dual";
import { EXAMPLE_KYOTO, EXAMPLE_SHARED, isIndexable, parseShared, resultPath, sharedQuery, toCheckInput } from "./share";

test("example round-trips and is indexable", () => {
  assert.deepEqual(parseShared(new URLSearchParams(sharedQuery(EXAMPLE_SHARED))), EXAMPLE_SHARED);
  assert.ok(isIndexable(EXAMPLE_SHARED) && isIndexable(EXAMPLE_KYOTO));
  assert.equal(resultPath(EXAMPLE_SHARED), "/r?p=himeji-castle,odawara-castle,nanzoin&res=overseas");
});

test("share link → same totals as API", () => {
  const r = checkDualPricing({ ...toCheckInput(EXAMPLE_SHARED), date: "2026-11-20" });
  assert.equal(r.summary.extraYouPayJPY, 2500);
  const s = parseShared({ p: "nijo-castle,kyoto-city-bus", res: "overseas", pref: "kyoto", city: "Sakyo-ku", d: "2027-06-01" })!;
  assert.equal(s.residence, "japan");
  assert.deepEqual(parseShared(new URLSearchParams(sharedQuery(s))), s);
});

test("parseShared rejects junk", () => {
  assert.equal(parseShared({ p: "eiffel" }), null);
  assert.equal(parseShared({ p: "himeji-castle", res: "mars" }), null);
  assert.equal(parseShared({ p: "himeji-castle", pref: "atlantis" }), null);
  assert.equal(parseShared({}), null);
});
