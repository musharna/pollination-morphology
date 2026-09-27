/*
 * Critic round 2 fixes (sandbox intro, task 3c, 2026-09-27):
 *  - MAJOR 1: a phone-width heat is not crushed. The heat's logical height
 *    has a 300 px floor, so at a 320 px heat the variance strip is >= 50 px;
 *    at the 1400 px hero (566 px heat) the height is the aspect's, unchanged.
 *    tools/smoke-site.py checks the displayed height at 390 px, DPR 2.
 *  - MINOR 6: the lost win line reads "not won — <fate>; only HELD wins".
 * Seen failing on the pre-3c page (task-3c report).
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { runPage } = require("../tools/sandbox-drive.js");

const $ = (p, id) => p.page.document.getElementById(id);

/* the heat at a displayed width: the fake DOM has no layout, so the test
 * sets clientWidth and re-fits as a resize would */
const heatAt = (p, w) => {
  $(p, "heat").clientWidth = w;
  p.page.Sandbox.refit();
  return p.page.Sandbox.heatSize();
};

test("MAJOR 1: a 320 px heat is 300 px tall, and its variance strip is >= 50 px", () => {
  const p = runPage({ noRun: true });
  const S = heatAt(p, 320);
  assert.equal(S.W, 320, "control: the refit took the new width");
  assert.equal(S.H, 300);
  assert.deepEqual([...S.backing], [320, 300], "the backing store follows (dpr 1)");
  const lay = p.page.AncestryHeat.layout(p.page.ExampleHeat.model, 320, S.H);
  assert.ok(lay.stripBot - lay.stripTop >= 50, `strip ${lay.stripBot - lay.stripTop} px`);
});

test("MAJOR 1: the hero-width heat keeps the aspect's height", () => {
  const p = runPage({ noRun: true });
  const S = heatAt(p, 566);
  assert.equal(S.W, 566, "control: the refit took the new width");
  assert.equal(S.H, Math.round((566 * 420) / 760));
  assert.equal(S.H, 313);
});

test("MINOR 6: the lost win line reads 'not won — <fate>; only HELD wins'", () => {
  const p = runPage({ level: 2, seed: 3 });
  assert.equal(p.error, null);
  assert.equal(p.win, "lost", "control: the run lost");
  assert.equal(p.winText, "not won — one lost (lineage 2 lost); only HELD wins");
});
