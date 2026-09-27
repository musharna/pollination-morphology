/*
 * The page tells its story (sandbox intro, 2026-09-27, plan Task 3): the
 * header states the premise and the question; #sFateSub answers it for the
 * run (or the example) in story()'s authored caption; the heat's live text
 * carries the caption; the blank stat tiles say they wait for Run.
 * Seen failing: the lede was "Pick a level and press Run ..." and #sFateSub
 * held "fate (...)" (task-3 report).
 */
const test = require("node:test");
const fs = require("fs");
const path = require("path");
const assert = require("node:assert/strict");
const { runPage } = require("../tools/sandbox-drive.js");
const E = require("../sim/evolve.js");

const $ = (p, id) => p.page.document.getElementById(id);
/* Static text: tools/fake-dom.js stubs only id'd elements and keeps no
 * source text (it is not a browser), so the lede and the hint's words are
 * read off the page source, which is what a browser shows for static HTML.
 * Everything the script writes is read through the fake DOM below. */
const SRC = fs.readFileSync(
  process.env.SANDBOX_PAGE || path.join(__dirname, "..", "sandbox.html"), "utf8");
const staticText = (re) => {
  const m = SRC.match(re);
  assert.ok(m, `no match for ${re} in the page source`);
  return m[1].replace(/\s+/g, " ").trim();
};
const LEVEL = { seed: 1, n: 30, gens: 35, siteN: 160, useD: false };
const pair = (antherT) => {
  const g = { ...E.randomGenome(E.makeRng(4)), antherT };
  return [g, { ...g }];
};
const STALL = runPage({ ...LEVEL, lineages: pair(0.825) });
const CTRL = runPage({ ...LEVEL, lineages: pair(0.8) }); // FUSED, no stall

test("the header states the premise and the question before any run", () => {
  const p = runPage({ noRun: true });
  const lede = staticText(/<header>[\s\S]*?<p class="lede">([^<]*)<\/p>/);
  assert.equal(lede, "In nature, two orchids can share one bee and still never cross-pollinate, when one puts its pollen on the bee's back and the other on its belly. Here two flower lineages start with their pollen in different places on the bee. Press Run and watch the generations: do they stay two kinds, or blend into one?");
  assert.equal($(p, "about").hasAttribute("open"), false, "about stays collapsed");
});

test("on load the caption answers for the example, and the stats say they wait for Run", () => {
  const p = runPage({ noRun: true });
  assert.equal($(p, "sFateSub").textContent,
    "example run's answer: No — lineage 2 was lost: the last plants' ancestry is over 85% lineage 1.");
  assert.equal($(p, "statsHint").hidden, false);
  assert.equal(staticText(/<p id="statsHint" class="note">([^<]*)<\/p>/), "These fill in when you press Run.");
  assert.ok(SRC.indexOf('id="statsHint"') < SRC.indexOf('<div class="stats">'), "the hint sits before the tiles");
});

test("a run's caption is its fate's, and the hint hides", () => {
  assert.equal(STALL.fate, "STALLED", "control: the fixture stalls");
  assert.equal(CTRL.fate, "FUSED", "control: the fixture fuses");
  assert.match($(STALL, "sFateSub").textContent, /^No — it stalled: 35 of 35 generations made no new plants/);
  assert.equal($(CTRL, "sFateSub").textContent,
    "No — they blended: the last plants' ancestry mixes both lineages, and the split between them has collapsed.");
  assert.equal($(STALL, "statsHint").hidden, true);
  assert.equal($(CTRL, "statsHint").hidden, true);
});

test("a level change after a run restores the example's caption and the hint", () => {
  const p = runPage({ level: 2, seed: 3, thenLevel: 3 });
  assert.match($(p, "sFateSub").textContent, /^example run's answer: /);
  assert.equal($(p, "statsHint").hidden, false);
});

test("the heat's live text carries the caption", () => {
  assert.match($(STALL, "heatLive").textContent, /No — it stalled/);
  assert.match($(CTRL, "heatLive").textContent, /No — they blended/);
  const p = runPage({ noRun: true });
  assert.match($(p, "heatLive").textContent, /No — lineage 2 was lost/);
});
