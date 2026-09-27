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
    "example run's answer: No — lineage\u00a02 was lost: the last plants' ancestry is over 85% lineage\u00a01.");
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

const pickLevel = (p, lv) => {
  const sel = $(p, "level");
  sel.value = String(lv);
  sel.onchange({ target: sel });
};

test("a level change after a run restores the example's caption and the hint", () => {
  const p = runPage({ level: 2, seed: 3 });
  /* control: the run happened — no error, a fate of its own, a heat model */
  assert.equal(p.error, null, `the run errored: ${p.status}`);
  assert.ok(["HELD", "FUSED", "one lost", "BOTH LOST", "STALLED"].includes(p.fate), `run fate ${p.fate}`);
  assert.ok(p.page.Sandbox.heat(), "the run built a heat model");
  assert.equal($(p, "statsHint").hidden, true, "control: the run hid the hint");
  assert.doesNotMatch($(p, "sFateSub").textContent, /^example run's answer: /, "control: the run's own caption");
  pickLevel(p, 3);
  assert.match($(p, "sFateSub").textContent, /^example run's answer: /);
  assert.equal($(p, "statsHint").hidden, false);
});

/* the page wires story()'s marks into the heat (fix round 1): a spy on
 * AncestryHeat.drawHeat records the options each redraw passes */
const spyHeat = (p) => {
  const A = p.page.AncestryHeat;
  const seen = [];
  const orig = A.drawHeat;
  A.drawHeat = (ctx, m, o) => (seen.push({ m, o }), orig(ctx, m, o));
  return { seen, restore: () => (A.drawHeat = orig) };
};

test("the example heat is drawn with the example's story marks", () => {
  const p = runPage({ noRun: true });
  const A = p.page.AncestryHeat;
  const X = p.page.ExampleHeat;
  const want = A.story(X.model, X.fate).marks;
  assert.ok(want.length > 0, "control: the example's story has marks");
  const spy = spyHeat(p);
  pickLevel(p, 3); // clearResult redraws the example heat
  spy.restore();
  assert.ok(spy.seen.length >= 1, "control: the level change redrew the heat");
  const last = spy.seen.at(-1);
  assert.equal(last.m, X.model, "control: the example model was drawn");
  assert.deepEqual(last.o.marks, want);
});

test("a run's heat is drawn with its story's marks", () => {
  const H = STALL.page.Sandbox.heat();
  assert.ok(H, "control: the stall run built a heat model");
  const want = STALL.page.AncestryHeat.story(H, "STALLED").marks;
  assert.ok(want.length > 0, "control: the stall story has marks");
  const spy = spyHeat(STALL);
  const scrub = $(STALL, "scrub");
  scrub.oninput({ target: scrub });
  spy.restore();
  assert.ok(spy.seen.length >= 1, "control: a scrub redrew the heat");
  const last = spy.seen.at(-1);
  assert.equal(last.m, H, "control: the run's model was drawn");
  assert.deepEqual(last.o.marks, want);
});

test("the heat's live text carries the caption", () => {
  assert.match($(STALL, "heatLive").textContent, /No — it stalled/);
  assert.match($(CTRL, "heatLive").textContent, /No — they blended/);
  const p = runPage({ noRun: true });
  assert.match($(p, "heatLive").textContent, /No — lineage\u00a02 was lost/);
});
