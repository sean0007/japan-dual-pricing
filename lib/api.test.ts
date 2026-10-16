import assert from "node:assert/strict";
import test from "node:test";
import { apiHandler, openapiDoc, preflight } from "./agent-api";
import { API_DISCLAIMER, API_INFO, ENDPOINTS, EXAMPLE_GET, PUBLIC_URL } from "./api";

const e = ENDPOINTS.check;
const handler = apiHandler(e.compute, { disclaimer: API_DISCLAIMER, docs: `${PUBLIC_URL}/openapi.json`, example: `${PUBLIC_URL}${e.example}` });

test(`GET ${EXAMPLE_GET} → ¥2,500 extra, CORS, disclaimer`, async () => {
  const res = await handler(new Request(`${PUBLIC_URL}${EXAMPLE_GET}`));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
  const body = await res.json();
  assert.equal(body.disclaimer, API_DISCLAIMER);
  assert.equal(body.summary.totalYouPayJPY, 4000);
  assert.equal(body.summary.extraYouPayJPY, 2500);
  assert.equal(body.places[0].id, "himeji-castle");
  assert.ok(body.sources.length);
});

test("POST JSON body (array places) matches GET", async () => {
  const get = await (await handler(new Request(`${PUBLIC_URL}${EXAMPLE_GET}`))).json();
  const post = await handler(new Request(`${PUBLIC_URL}${e.path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ places: ["himeji-castle", "odawara-castle", "nanzoin"], residence: "overseas", date: "2026-11-20" }) }));
  assert.equal(post.status, 200);
  assert.deepEqual(await post.json(), get);
});

test("Japan resident with prefecture + city, Japanese names", async () => {
  const b = await (await handler(new Request(`${PUBLIC_URL}${e.path}?places=${encodeURIComponent("姫路城,二条城")}&prefecture=hyogo&city=Himeji&date=2026-11-20`))).json();
  assert.equal(b.input.residence, "japan");
  assert.equal(b.places[0].yourPriceJPY, 1000);
  assert.equal(b.places[1].plannedYourPriceJPY, 2000);
});

test("bad inputs → 400", async () => {
  for (const q of ["places=eiffel-tower", "residence=mars", "date=2026-13-01", "prefecture=atlantis", "age=-3", "status=maybe"]) {
    const res = await handler(new Request(`${PUBLIC_URL}${e.path}?${q}`));
    assert.equal(res.status, 400, q);
    const body = await res.json();
    assert.equal(body.disclaimer, API_DISCLAIMER);
  }
});

test("no params → all places (200)", async () => {
  const res = await handler(new Request(`${PUBLIC_URL}${e.path}`));
  assert.equal(res.status, 200);
  const b = await res.json();
  assert.ok(b.places.length >= 30);
});

test("malformed JSON body → 400", async () => {
  const res = await handler(new Request(`${PUBLIC_URL}${e.path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{nope" }));
  assert.equal(res.status, 400);
});

test("OPTIONS preflight is CORS open", () => {
  const res = preflight();
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
});

test("OpenAPI lists /api/check GET and POST", () => {
  const spec = openapiDoc(API_INFO, PUBLIC_URL, [e]) as { openapi: string; paths: Record<string, { get: { parameters: { name: string }[] }; post: unknown }> };
  assert.ok(spec.openapi.startsWith("3."));
  assert.ok(spec.paths["/api/check"]?.post);
  assert.ok(spec.paths["/api/check"].get.parameters.find((p) => p.name === "places"));
});
