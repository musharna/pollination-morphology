/*
 * Tests for rare-biased visit allocation (`allocExponent`).
 *
 * The risk is the usual pair: the option must be INERT where every earlier
 * result lives, and it must genuinely BITE when set. An option silently dropped
 * would make every arm of experiments/rare-biased-visits.js the same arm, and
 * the run would report "rare-bias changes nothing" no matter what was true.
 *
 * ⚠️ The bias reads rarity off PLACEMENT, never off `anc` — ancestry is
 * bookkeeping the pollinator cannot perceive. Test 4 is what checks that the
 * label-free version actually reproduces the labelled allocation the single-bout
 * screen uses; without it the two halves of the experiment could silently be
 * measuring different mechanisms.
 */

const test = require("node:test");
const assert = require("node:assert");
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const C = require("../sim/carryover.js");

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

/* Generated from commit 17cd60c, before allocExponent existed. */
const PRE_ALLOC = [
  [0.6426076918656048, 3.0637323268730365, 0, 0],
  [0.8843517599890253, 3.6807972859897253, 0, 0],
  [0.8257455458521449, 3.61632994537921, 0, 0],
  [0.49249979315034653, 2.269042873658907, 0, 0],
  [0.6023262955018738, 2.172879959409133, 0, 0],
];
const goldenRun = (extra = {}) =>
  I.run({
    n: 12,
    generations: 5,
    seed: 3,
    siteN: 60,
    visits: 6000,
    ...extra,
  }).history.map((r) => [r.spread, r.separation, r.ancVar, r.unmated]);

/* ---------------------------------------------------------------- inertness */

test("the option absent reproduces the pre-option model bit-for-bit", () => {
  assert.deepStrictEqual(goldenRun(), PRE_ALLOC);
});

test("allocExponent = 1 is bit-identical to the option being absent", () => {
  assert.deepStrictEqual(goldenRun({ allocExponent: 1 }), PRE_ALLOC);
});

/* ------------------------------------------------------------- it must BITE */

/*
 * ⚠️ THE PAIRED NEGATIVE. The two tests above are satisfied by an option that
 * does nothing whatsoever, so on their own they are worthless. This is the one
 * that fails if allocExponent never reaches step(). Verified by mutation: with
 * step() ignoring the flag, this test fails and the two above still pass.
 */
test("allocExponent = 0.5 changes the run", () => {
  assert.notDeepStrictEqual(goldenRun({ allocExponent: 0.5 }), PRE_ALLOC);
});

/* --------------------------------------- label-free rarity == labelled rarity */

/*
 * The single-bout screen knows which plant belongs to which morph and allocates
 * f^a exactly. The dynamical model must not know, so it reads rarity off the
 * placement cloud. These have to agree or the experiment's two halves are not
 * measuring the same thing.
 */
test("placement-derived rarity reproduces the labelled f^a allocation", () => {
  const opts = { ...I.DEFAULTS, siteN: 60 };
  const rng = E.makeRng(1);
  const srng = I.signalRng(1);
  const b = I.foundTwoLineages(20, rng, srng, 8, opts);
  if (!b) return;
  const nB = 5;
  const nA = 20 - nB;
  const pop = [
    ...I.foundPopulation(nA, rng, { spread: 0.02, srng, base: b.gA, anc: 0 }),
    ...I.foundPopulation(nB, rng, { spread: 0.02, srng, base: b.gB, anc: 1 }),
  ];
  const n = pop.length;
  const f = nB / n;
  const ss = I.sitesOf(pop, opts, 0);
  for (const a of [0.5, 0.35]) {
    const w = I.allocWeights(ss, a, n);
    const shareB = w.slice(nA).reduce((x, y) => x + y, 0);
    const pred = Math.pow(f, a) / (Math.pow(f, a) + Math.pow(1 - f, a));
    assert.ok(
      Math.abs(shareB - pred) < 0.08,
      `a=${a}: rare cluster took ${shareB.toFixed(3)}, expected about ${pred.toFixed(3)}`,
    );
  }
});

test("allocExponent = 1 returns an exactly uniform vector", () => {
  const opts = { ...I.DEFAULTS, siteN: 60 };
  const rng = E.makeRng(2);
  const srng = I.signalRng(2);
  const b = I.foundTwoLineages(12, rng, srng, 4, opts);
  if (!b) return;
  const ss = I.sitesOf(b.pop, opts, 0);
  const n = b.pop.length;
  assert.deepStrictEqual(I.allocWeights(ss, 1, n), new Array(n).fill(1 / n));
  assert.deepStrictEqual(I.allocWeights(ss, null, n), new Array(n).fill(1 / n));
});

/* ------------------------------------------------- the leak statistic itself */

/*
 * experiments/rare-biased-visits.js concludes that d=8 leaks EXACTLY zero, and a
 * statistic that returned zero because it was broken would look identical. So
 * the ceiling gets its own assertion: one lineage wearing both labels has no
 * placement difference at all and must read ~0.5, and a close separation must
 * read high. A negative result needs a positive control in the same test.
 */
function crossShare(targetD, same) {
  const opts = { ...I.DEFAULTS, siteN: 60, visits: 6000 };
  const rng = E.makeRng(3);
  const srng = I.signalRng(3);
  const b = I.foundTwoLineages(20, rng, srng, targetD, opts);
  if (!b) return null;
  const half = 10;
  const pop = [
    ...I.foundPopulation(half, rng, { spread: 0.02, srng, base: b.gA, anc: 0 }),
    ...I.foundPopulation(half, rng, {
      spread: 0.02,
      srng,
      base: same ? b.gA : b.gB,
      anc: 1,
    }),
  ];
  const n = pop.length;
  const ss = I.sitesOf(pop, opts, 0);
  const rb = C.runBout(ss, new Array(n).fill(1 / n), {
    visits: 6000,
    seed: 7,
  });
  let within = 0;
  let cross = 0;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      if (i < half === j < half) within += rb.T[i][j];
      else cross += rb.T[i][j];
    }
  return within + cross > 0 ? cross / (within + cross) : null;
}

test("the cross-lineage statistic reads ~0.5 when there is nothing to separate", () => {
  const m = crossShare(8, true);
  assert.ok(m !== null, "no pollen moved at all");
  assert.ok(
    Math.abs(m - 0.5) < 0.08,
    `one lineage wearing both labels read ${m.toFixed(3)}, must be about 0.5`,
  );
});

test("a close separation leaks and the exclusion separation does not", () => {
  const near = crossShare(1, false);
  const far = crossShare(8, false);
  assert.ok(near !== null && far !== null, "no pollen moved at all");
  /* the positive control: without this, "far is isolating" could be reported by
   * a statistic that always returns zero */
  assert.ok(near > 0.2, `d=1 should leak heavily, read ${near.toFixed(3)}`);
  assert.ok(far < 0.01, `d=8 should be isolating, read ${far.toFixed(3)}`);
});

/* ------------------------------------------- the mechanism the doc turns on */

/*
 * ⚠️ THE FINDING, PINNED. Weight goes as dens^(a-1), so the lowest-density
 * placement draws the most visits — and in a two-cluster population that is the
 * gap between the clusters. This is why strong rare-bias FUSES lineages that are
 * otherwise perfectly isolated, and it is worth an assertion rather than only a
 * sentence in the write-up.
 */
test("rare-bias subsidises the intermediate placement", () => {
  const opts = { ...I.DEFAULTS, siteN: 60 };
  const rng = E.makeRng(4);
  const srng = I.signalRng(4);
  const b = I.foundTwoLineages(20, rng, srng, 8, opts);
  if (!b) return;
  const half = 10;
  const pop = [
    ...I.foundPopulation(half, rng, { spread: 0.02, srng, base: b.gA, anc: 0 }),
    ...I.foundPopulation(half, rng, { spread: 0.02, srng, base: b.gB, anc: 1 }),
  ];
  const ss = I.sitesOf(pop, opts, 0);
  const places = ss.map(I.placementOf).filter(Boolean);
  if (places.length < 20) return;
  const dens = (p) =>
    places.reduce((t, q) => {
      const x = I.dist(p, q);
      return t + Math.exp(-0.5 * x * x);
    }, 0) / places.length;
  const cluster = mean(places.map(dens));
  const mid = {
    s: (places[0].s + places[places.length - 1].s) / 2,
    phi: Math.atan2(
      (Math.sin(places[0].phi) + Math.sin(places[places.length - 1].phi)) / 2,
      (Math.cos(places[0].phi) + Math.cos(places[places.length - 1].phi)) / 2,
    ),
  };
  const gap = dens(mid);
  assert.ok(gap < cluster, "the gap must be rarer than a cluster");
  /* at a = 0.25 the intermediate should draw many times a normal plant's visits */
  const ratio = Math.pow(gap / cluster, 0.25 - 1);
  assert.ok(
    ratio > 5,
    `intermediate draws only ${ratio.toFixed(1)}x — the subsidy the doc reports is absent`,
  );
});
