/*
 * One body map: before a run it shows the sliders' founders; after a run
 * founded at target d it shows THAT run's founders and its plants; moving a
 * shape hides the run's plants with a reason, and restoring the shape brings
 * them back. Seen failing: the page exposed no Sandbox.bodyLayers.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { runPage } = require("../tools/sandbox-drive.js");

test("before any run: the sliders' founders, no overlay", () => {
  const p = runPage({ noRun: true });
  const L = p.page.Sandbox.bodyLayers();
  assert.equal(L.source, "sliders");
  assert.equal(L.overlay, "none");
  assert.equal(L.dots, 0);
});

test("a run founded at target d draws that run's founders and its plants", () => {
  const p = runPage({ level: 2, seed: 3 });
  const L = p.page.Sandbox.bodyLayers();
  const R = p.page.Sandbox.result();
  assert.equal(L.source, "run");
  /* JSON round trip on both sides: the page's arrays and objects come from the
   * vm realm, and strict deepEqual compares prototypes across realms (the T3 ruling) */
  const plain = (x) => JSON.parse(JSON.stringify(x));
  assert.deepEqual(plain(L.founders), plain([R.p1, R.p2]));
  assert.ok(R.p1 && R.p2, "control: the run has two founders");
  assert.equal(L.overlay, "shown");
  /* a run ends on its last generation (Task 7b): the body map shows its plants */
  assert.equal(L.dots, R.gens.at(-1).places.filter(Boolean).length);
});

test("hand-set run: moving a lineage hides the plants; restoring it shows them", () => {
  const p = runPage({ seed: 3 }); // free sandbox, hand-set founding
  const S = p.page.Sandbox;
  assert.equal(S.bodyLayers().source, "sliders");
  assert.equal(S.bodyLayers().overlay, "shown");
  const g0 = { ...S.lineage(0) };
  S.setLineage(0, { ...g0, antherT: g0.antherT - 0.05 });
  assert.equal(S.bodyLayers().overlay, "hidden: shapes changed since the run");
  assert.equal(S.bodyLayers().dots, 0);
  S.setLineage(0, g0);
  assert.equal(S.bodyLayers().overlay, "shown"); // control
});

test("target-d run: a slider does not hide the plants, the bee does", () => {
  const p = runPage({ level: 2, seed: 3 });
  const S = p.page.Sandbox;
  const g0 = { ...S.lineage(0) };
  S.setLineage(0, { ...g0, antherT: g0.antherT - 0.05 });
  assert.equal(S.bodyLayers().overlay, "shown", "the sliders did not found this run");
  const reach = S.bee().reach;
  S.setBee({ reach: reach + 0.1 });
  assert.equal(S.bodyLayers().overlay, "hidden: shapes changed since the run");
  S.setBee({ reach });
  assert.equal(S.bodyLayers().overlay, "shown"); // control
});

/* Addendum A4 (Task 3 minor M3): a level change clears the whole run, not just
 * the verdict — no stale field left to scrub or play beside the example heat.
 * Positive control in the same test: right after the run (before the level
 * change) the overlay is shown and the scrubber is live. */
test("a level change after a run clears the run: no overlay, scrub and play disabled", () => {
  const p0 = runPage({ level: 2, seed: 3 });
  const d0 = p0.page.document;
  assert.equal(p0.page.Sandbox.bodyLayers().overlay, "shown", "control: the run is shown");
  assert.equal(d0.getElementById("scrub").disabled, false, "control: #scrub live after a run");
  const p = runPage({ level: 2, seed: 3, thenLevel: 3 });
  const L = p.page.Sandbox.bodyLayers();
  const d = p.page.document;
  assert.equal(p.error, null);
  assert.equal(L.overlay, "none");
  assert.equal(L.dots, 0);
  assert.equal(L.source, "sliders");
  assert.equal(d.getElementById("scrub").disabled, true, "#scrub still live after a level change");
  assert.equal(d.getElementById("play").disabled, true, "#play still live after a level change");
});
