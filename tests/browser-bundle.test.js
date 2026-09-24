/*
 * Tests for the browser bundle that population.html loads.
 *
 * ⚠️ THE SUITE CANNOT SEE THIS BUG WITHOUT THESE TESTS. Node always defines
 * `require` and `module`, so every other test in this repo runs on a code path
 * the browser never takes. The first version of the renderer loaded the six sim
 * files as plain <script> tags and would have died on load with
 * "Identifier 'S_BINS' has already been declared" — classic scripts share one
 * global lexical scope, and the modules collide on TWELVE top-level names. The
 * page would have been blank with an error only in the devtools console.
 *
 * So test 1 evaluates the bundle with require/module ABSENT, which is the actual
 * browser condition, and test 2 stops the committed bundle from drifting away
 * from sim/*.js and silently rendering old biology.
 */

const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const { build, OUT } = require("../tools/build-browser-bundle.js");

/* ------------------------------------------------------- it cannot go stale */

test("the committed bundle matches the current sim sources", () => {
  const onDisk = fs.readFileSync(OUT, "utf8");
  assert.equal(
    onDisk,
    build(),
    "sim/browser-bundle.js is stale — run `node tools/build-browser-bundle.js`",
  );
});

/* --------------------------------------------- it loads the way a browser does */

function loadInFakeBrowser() {
  const src = fs.readFileSync(OUT, "utf8");
  const win = {};
  /* NO require, NO module in this context — that is the whole point */
  const ctx = vm.createContext({ window: win, console, Math, JSON, Date });
  vm.runInContext(src, ctx, { filename: "browser-bundle.js" });
  return win;
}

test("the bundle loads with require and module absent", () => {
  const win = loadInFakeBrowser();
  for (const k of [
    "Placement",
    "Packing",
    "Carryover",
    "Evolve",
    "Deception",
    "IBM",
  ])
    assert.ok(win[k], `window.${k} missing after bundle load`);
  assert.equal(typeof win.IBM.run, "function");
  assert.ok(win.Placement.DEFAULT_BEE.regions.length > 0);
});

/* ------------------------------------- the data the renderer actually draws */

test("a traced run gives the renderer aligned, in-range points to draw", () => {
  const win = loadInFakeBrowser();
  const I = win.IBM;
  const E = win.Evolve;

  const n = 24;
  const seed = 3;
  const built = I.foundTwoLineages(
    n,
    E.makeRng(seed),
    I.signalRng(seed),
    8,
    I.DEFAULTS,
  );
  assert.ok(
    built,
    "could not found two lineages — fixture failed, not the code",
  );

  const out = I.run({
    n,
    generations: 12,
    seed,
    found: built.pop,
    trace: true,
  });

  let drawnMin = Infinity;
  for (const h of out.history) {
    const places = h.places || [];
    const anc = h.anc || [];
    /* ⚠️ The renderer colours places[i] using anc[i]. If these ever differ in
     * length the picture is still drawn, just wrong — every point coloured by
     * somebody else's ancestry. That failure is invisible by eye, which is
     * exactly why it is asserted rather than looked at. */
    assert.equal(
      places.length,
      anc.length,
      "places and anc are not index-aligned — colours would be wrong, silently",
    );
    for (const a of anc)
      assert.ok(a >= 0 && a <= 1, `ancestry out of range: ${a}`);
    for (const p of places) {
      if (!p) continue; // a plant the animal never touched; legitimately undrawn
      assert.ok(
        p.s >= -0.2 && p.s <= 1.2,
        `s outside the drawn window: ${p.s}`,
      );
      assert.ok(
        p.phi >= -Math.PI - 1e-9 && p.phi <= Math.PI + 1e-9,
        `phi outside [-pi,pi]: ${p.phi}`,
      );
    }
    drawnMin = Math.min(drawnMin, places.filter(Boolean).length);
  }
  assert.ok(drawnMin > 0, "some generation had nothing to draw at all");
});

/* ------------------------------------------- the page's own script parses */

/* ⚠️ A syntax error in population.html's inline script is a BLANK PAGE with the
 * message only in the devtools console — the exact failure mode that shipped
 * twice already. `new Function` parses without executing, so this catches it
 * without needing a browser or a DOM. */
test("sandbox.html's inline script parses", () => {
  const html = fs.readFileSync(
    path.join(__dirname, "..", "sandbox.html"),
    "utf8",
  );
  const blocks = [
    ...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g),
  ];
  assert.ok(
    blocks.length > 0,
    "no inline script found — did the page change shape?",
  );
  for (const [, src] of blocks) {
    assert.doesNotThrow(
      () => new Function(src),
      "sandbox.html's inline script does not parse — the page would be blank",
    );
  }
});

/* ------------------- the page's OWN loop, executed, against the null tables */

/* ⚠️ THE OLD VERSION OF THIS TEST COULD NOT FAIL ON THE PAGE. The page's loop
 * lived inline in population.html, so the test hand-copied it ("verbatim in
 * structure") and compared the copy to run(). That proves the copy matches
 * run(); it proves nothing whatever about the page, and a copy drifting from
 * the page is the exact defect the test exists to catch.
 *
 * The loop now lives in population-run.js, which the page loads by <script src>.
 * This test loads THAT FILE into the same fake-browser context as the bundle and
 * EXECUTES it. It also drives the PAGE'S protocol: rng and srng made once,
 * shared with the founding, then every generation stepped with the same two —
 * which is why the numbers below are the null tables' numbers and not run()'s.
 * `IBM.run({found})` makes fresh streams (sim/ibm.js:2373-2376) and is a
 * different run at the same seed.
 *
 * Rows: docs/2026-09-13-northstar-null-tables.md:93 and :157, produced by
 * `node tools/northstar-null-tables.js card14 page 1 15` / `16 30`. */

function loadPageScripts() {
  const win = loadInFakeBrowser();
  const ctx = vm.createContext({ window: win, console, Math, JSON, Date });
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "..", "population-run.js"), "utf8"),
    ctx,
    { filename: "population-run.js" },
  );
  return win;
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
/* hybrid = ancestry strictly in (0.15, 0.85); experiments/hybrids-or-balance.js:87 */
const isHybrid = (a) => a > 0.15 && a < 0.85;

const NULL_TABLE_ROWS = [
  { seed: 1, d: 8, realised: 8.124, fate: "one lost", hybGens: 0, ratio: null },
  {
    seed: 16,
    d: 4,
    realised: 3.849,
    fate: "one lost",
    hybGens: 1,
    ratio: 0.111,
  },
];

for (const row of NULL_TABLE_ROWS) {
  test(`population-run.js reproduces the null table: target ${row.d}, seed ${row.seed}`, () => {
    const win = loadPageScripts();
    const I = win.IBM;
    const E = win.Evolve;
    assert.equal(
      typeof win.SandboxRun.runGenerations,
      "function",
      "population-run.js did not expose window.SandboxRun.runGenerations",
    );

    /* the page configuration: population.html's n, generations and siteN */
    const n = 18,
      gens = 24;
    const opts = { ...I.DEFAULTS, siteN: 90 };

    /* the page protocol: BOTH streams made once, founding first, then stepped */
    const rng = E.makeRng(row.seed);
    const srng = I.signalRng(row.seed);
    const built = I.foundTwoLineages(n, rng, srng, row.d, opts);
    assert.ok(built, "fixture failed: nothing founded at that target");
    const v0 = I.ancestryVar(built.pop);

    const out = win.SandboxRun.runGenerations(built.pop, opts, rng, srng, gens);

    assert.equal(
      +built.realised.toFixed(3),
      row.realised,
      "realised separation differs from the null table",
    );
    assert.equal(out.frames.length, gens, "generation count differs");
    assert.equal(
      out.stalledGens,
      0,
      "population-run.js counts stalled generations the tool does not",
    );
    assert.equal(
      I.fateOf(out.final, v0, out.extinct, out.stalledGens > 0),
      row.fate,
      "fate differs from the null table — the page has drifted from the numbers",
    );

    let hybGens = 0;
    let ratio = null;
    for (const f of out.frames) {
      const hyb = [],
        rest = [];
      f.anc.forEach((a, i) => (isHybrid(a) ? hyb : rest).push(f.received[i]));
      if (hyb.length) hybGens++;
      if (hyb.length && rest.length) ratio = mean(hyb) / mean(rest);
    }
    assert.equal(hybGens, row.hybGens, "hybrid generations differ");
    if (row.ratio === null)
      assert.equal(ratio, null, "a receipt ratio appeared where there is none");
    else
      assert.equal(
        +ratio.toFixed(3),
        row.ratio,
        "receipt ratio differs from the null table",
      );
  });
}

/* M3b: the three other streams (spec §9, "The three other streams"). `run()`
 * makes `brng` when phenology is set, `wrng` when widthLocus is set and `crng`
 * when selfing.cover is set; the page builds them from the seed the same way
 * (SandboxRun.streamsFor) and passes them to step as its sixth to eighth
 * arguments. One case per stream, against the null tables' card-5 and card-6
 * rows (docs/2026-09-13-northstar-null-tables.md: `card5 seed 8`, `card6 seed
 * 13`), under the page protocol at the level configuration, founded at d = 8. */
function streamRun(win, seed, extra) {
  const I = win.IBM,
    E = win.Evolve,
    SR = win.SandboxRun;
  const opts = { ...I.DEFAULTS, siteN: 160, ...extra };
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const built = I.foundTwoLineages(30, rng, srng, 8, opts);
  assert.ok(built, "fixture failed: nothing founded");
  const v0 = I.ancestryVar(built.pop);
  const out = SR.runGenerations(built.pop, opts, rng, srng, 35, SR.streamsFor(seed, opts));
  return { out, fate: I.fateOf(out.final, v0, out.extinct, out.stalledGens > 0) };
}
const REG5 = { phenology: { slices: 8, width: 0.12 }, visitsPerPlant: 800 };

test("streams: brng + crng reproduce card 5 seed 8 (q = 0.85 one lost; flat q = 0 HELD)", () => {
  const win = loadPageScripts();
  assert.equal(typeof win.SandboxRun.streamsFor, "function", "no SandboxRun.streamsFor");
  const s = win.SandboxRun.streamsFor(8, { ...REG5, selfing: { rate: 2, cost: 0, cover: 0.85 } });
  assert.ok(s.brng && s.crng && !s.wrng, "streams built for the wrong options");
  assert.equal(streamRun(win, 8, { ...REG5, selfing: { rate: 2, cost: 0, cover: 0.85 } }).fate, "one lost");
  assert.equal(streamRun(win, 8, { ...REG5, selfing: { rate: 2, cost: 0, cover: 0 } }).fate, "HELD");
});

test("streams: brng + wrng reproduce card 6 seed 13 (treatment 0.878, shuffled 0.110)", () => {
  const win = loadPageScripts();
  const phen = { slices: 8, widthLocus: true, widthMut: 0.03, conserveDisplay: true };
  const t = streamRun(win, 13, { phenology: phen });
  const sh = streamRun(win, 13, { phenology: { ...phen, shuffleWidth: true } });
  const w = (r) => win.SandboxRun.widthStat(r.out.frames);
  assert.equal(w(t).toFixed(3), "0.878");
  assert.equal(w(sh).toFixed(3), "0.110");
});

/* ⚠️ THE CHECK THAT KEEPS THIS TEST HONEST. A loop written into the test file
 * is the defect the test exists to catch, so the file may not call step() at
 * all: the only loop here is the page's own. */
test("this test file drives no loop of its own", () => {
  const src = fs.readFileSync(__filename, "utf8");
  const calls = [...src.matchAll(/\bI\.step\s*\(/g)];
  assert.equal(
    calls.length,
    0,
    "browser-bundle.test.js calls I.step — it is asserting against a copy of the page's loop again",
  );
});

/* --------------------- the flowers the page draws are the model's own flowers */

test("every individual yields a drawable flower with real organ positions", () => {
  const win = loadInFakeBrowser();
  const I = win.IBM;
  const E = win.Evolve;
  const P = win.Placement;

  const seed = 5;
  const built = I.foundTwoLineages(
    18,
    E.makeRng(seed),
    I.signalRng(seed),
    8,
    I.DEFAULTS,
  );
  assert.ok(built, "fixture failed");

  /* ⚠️ A flower that fails to build renders as nothing, and one missing flower
   * in a field of eighteen is not noticeable by eye. */
  for (const ind of built.pop) {
    const f = E.toFlower(I.shapeOf(ind));
    const a = P.antherPoint(f);
    const s = P.stigmaPoint(f);
    const surf = P.surfacePoint(f, 0.5, 0.7);
    for (const [name, v] of [
      ["anther", a],
      ["stigma", s],
      ["surface", surf],
    ]) {
      assert.ok(
        Array.isArray(v) && v.length === 3,
        `${name} is not a 3-vector`,
      );
      for (const c of v)
        assert.ok(Number.isFinite(c), `${name} has a non-finite coordinate`);
    }
    assert.ok(
      P.bodyRadius(I.DEFAULTS.bee, 0.3) > 0,
      "bee body radius is not positive — pollen would draw at the centreline",
    );
  }
});

/* ⚠️ A renderer showing a population that never changes is indistinguishable
 * from a renderer that is not stepping the model. This asserts the thing the
 * page exists to show actually moves. */
test("the traced run visibly changes, so a frozen picture means a broken page", () => {
  const win = loadInFakeBrowser();
  const I = win.IBM;
  const E = win.Evolve;
  const n = 24;
  const seed = 3;
  const built = I.foundTwoLineages(
    n,
    E.makeRng(seed),
    I.signalRng(seed),
    8,
    I.DEFAULTS,
  );
  const out = I.run({
    n,
    generations: 20,
    seed,
    found: built.pop,
    trace: true,
  });

  const first = out.history[0];
  const last = out.history[out.history.length - 1];
  assert.notDeepStrictEqual(
    first.places,
    last.places,
    "placements never moved across 20 generations",
  );
  assert.ok(
    Math.abs(last.ancVar - first.ancVar) > 1e-9,
    "ancestry variance never changed — the tracer is not being updated",
  );
});
