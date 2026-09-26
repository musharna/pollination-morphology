/*
 * The heat model the PAGE draws, read back through window.Sandbox.heat():
 * built from the run's own frames and final offspring, consistent with the fate
 * the page prints, stalled columns flagged on the stall fixture, cleared when a
 * level is loaded. Seen failing: the page exposed no Sandbox.heat.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { runPage } = require("../tools/sandbox-drive.js");
const E = require("../sim/evolve.js");

test("level 2 seed 3: a column per generation plus the final, fate-consistent", () => {
  const p = runPage({ level: 2, seed: 3 });
  assert.equal(p.error, null, p.error);
  const H = p.page.Sandbox.heat();
  assert.ok(H, "no heat model after a run");
  const R = p.page.Sandbox.result();
  assert.equal(H.cols.length, R.gens.length + 1);
  assert.equal(H.cols.at(-1).final, true);
  assert.equal(H.cols.at(-1).n, R.final.length);
  for (const c of H.cols) assert.equal(c.counts.reduce((a, b) => a + b, 0), c.n);
  assert.equal(H.heldLine, 0.4 * R.v0);
  if (p.fate === "HELD") assert.ok(H.cols.at(-1).ancVar > H.heldLine);
  if (p.fate === "FUSED" || p.fate === "one lost") assert.ok(H.cols.at(-1).ancVar <= H.heldLine);
});

test("stall fixture: 35 stalled columns and STALLED; control antherT 0.80 has none", () => {
  const LEVEL = { seed: 1, n: 30, gens: 35, siteN: 160, useD: false };
  const pair = (antherT) => {
    const g = { ...E.randomGenome(E.makeRng(4)), antherT };
    return [g, { ...g }];
  };
  const s = runPage({ ...LEVEL, lineages: pair(0.825) });
  assert.equal(s.fate, "STALLED");
  assert.equal(s.page.Sandbox.heat().cols.filter((c) => c.stalled).length, 35);
  const c = runPage({ ...LEVEL, lineages: pair(0.8) });
  assert.equal(c.fate, "FUSED");
  assert.equal(c.page.Sandbox.heat().cols.filter((x) => x.stalled).length, 0);
});

test("loading a level clears the heat; the run before it had one", () => {
  const p = runPage({ level: 2, seed: 3, thenLevel: 3 });
  assert.equal(p.error, null, p.error); // a thrown run must not pass as "cleared"
  assert.equal(p.page.Sandbox.heat(), null);
  assert.ok(runPage({ level: 2, seed: 3 }).page.Sandbox.heat()); // control
});
