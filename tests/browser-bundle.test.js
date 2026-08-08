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
test("population.html's inline script parses", () => {
  const html = fs.readFileSync(
    path.join(__dirname, "..", "population.html"),
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
      "population.html's inline script does not parse — the page would be blank",
    );
  }
});

/* ------------------------------- the page drives step() — prove it IS run() */

/* ⚠️ population.html cannot use run(): it needs every generation's GENOMES to
 * draw the flowers, and run() returns only summary history. So it drives step()
 * in its own loop — which means the picture could quietly diverge from every
 * published number in docs/. This asserts the two loops are the same loop.
 *
 * The renderer's claim is that you are watching the model the experiments
 * measured. That claim is only worth what this test is worth. */
test("the page's own generation loop reproduces run() exactly", () => {
  const win = loadInFakeBrowser();
  const I = win.IBM;
  const E = win.Evolve;

  const n = 20;
  const seed = 5;
  const gens = 10;
  const opts = { ...I.DEFAULTS };

  const built = I.foundTwoLineages(
    n,
    E.makeRng(seed),
    I.signalRng(seed),
    8,
    opts,
  );
  assert.ok(built, "fixture failed");

  /* the page's loop, verbatim in structure */
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  let pop = built.pop;
  const mine = [];
  for (let g = 0; g < gens; g++) {
    if (pop.length < 2) break;
    const res = I.step(pop, opts, rng, g, srng);
    mine.push({
      sep: res.cluster ? res.cluster.separation : null,
      ancVar: res.ancVar,
      spread: res.spread,
    });
    pop = res.pop;
  }

  /* the published path */
  const out = I.run({ n, generations: gens, seed, found: built.pop });

  assert.equal(mine.length, out.history.length, "generation counts differ");
  out.history.forEach((h, i) => {
    assert.equal(mine[i].ancVar, h.ancVar, `ancVar differs at generation ${i}`);
    assert.equal(mine[i].spread, h.spread, `spread differs at generation ${i}`);
    assert.equal(
      mine[i].sep,
      h.separation,
      `separation differs at generation ${i} — the picture has drifted from the numbers`,
    );
  });
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
