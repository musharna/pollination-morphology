/*
 * Tests for density dependence in the IBM.
 *
 * Two things need protecting and they pull in opposite directions. The new
 * demography must be INERT when off — every result published before it existed
 * has to still reproduce — and it must be genuinely ACTIVE when on, because an
 * arm that silently reproduces fixed N would report "the assumption did not
 * matter" no matter what the assumption was.
 *
 * ⚠️ The inertness half is the one that can pass for the wrong reason: a test
 * that only checks two settings against each other is satisfied by a change that
 * broke both. So the goldens here are EXTERNAL, generated from commit 3089e77
 * before any of this existed.
 */

const test = require("node:test");
const assert = require("node:assert");
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

/* ---------------------------------------------------------------- inertness */

/* Generated from commit 3089e77, BEFORE demography existed. */
const PRE_DEMOG = [
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

test("demography off reproduces the pre-demography model bit-for-bit", () => {
  assert.deepStrictEqual(goldenRun(), PRE_DEMOG);
});

/*
 * ⚠️ THE RESCALING MUST BE A NO-OP AT THE FOUNDING SIZE. visitsPerPlant * n is
 * the same budget as a constant total exactly when n has not moved, and that is
 * what makes the 2x2 readable: any difference the per-plant arms show has to come
 * from the population CHANGING SIZE, not from a different budget on generation
 * zero. With demography off n never moves, so the whole run must match.
 */
test("constant per-plant service is identical to the constant total at n = n0", () => {
  assert.deepStrictEqual(goldenRun({ visitsPerPlant: 6000 / 12 }), PRE_DEMOG);
});

test("a different per-plant rate really does change the run", () => {
  /* the paired negative: if the previous test passed because visitsPerPlant is
   * ignored outright, this one passes too and the pair is worthless */
  assert.notDeepStrictEqual(goldenRun({ visitsPerPlant: 200 }), PRE_DEMOG);
});

/* ------------------------------------------------------------- the Poisson */

test("poisson has the right mean and variance in both branches", () => {
  /* the sampler switches at 30, so both sides need checking — a normal
   * approximation wired to the wrong branch would be silently biased */
  for (const lam of [3, 25, 120]) {
    const rng = E.makeRng(lam);
    const xs = Array.from({ length: 4000 }, () => I.poisson(rng, lam));
    const m = mean(xs);
    const v = mean(xs.map((x) => (x - m) * (x - m)));
    assert.ok(Math.abs(m - lam) < 0.12 * lam, `mean ${m} off for lam ${lam}`);
    assert.ok(Math.abs(v - lam) < 0.35 * lam, `var ${v} off for lam ${lam}`);
    assert.ok(
      xs.every((x) => x >= 0 && Number.isInteger(x)),
      "poisson produced a non-negative-integer",
    );
  }
});

test("poisson of a non-positive mean is zero, not NaN", () => {
  const rng = E.makeRng(1);
  assert.strictEqual(I.poisson(rng, 0), 0);
  assert.strictEqual(I.poisson(rng, -1), 0);
});

/* ------------------------------------------------------- demography is ACTIVE */

const twoLineages = (n, seed, d, siteN) => {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  return I.foundTwoLineages(n, rng, srng, d, { ...I.DEFAULTS, siteN });
};

test("with demography on the population size actually moves", () => {
  const b = twoLineages(20, 1, 4, 60);
  const out = I.run({
    n: 20,
    generations: 12,
    seed: 1,
    siteN: 60,
    visits: 6000,
    found: b.pop,
    demography: { seedsPerGrain: 20 / 12000, K: 40 },
  });
  const sizes = out.history.map((h) => h.popN);
  assert.ok(
    new Set(sizes).size > 2,
    `population never changed size: ${sizes.join(",")}`,
  );
});

/*
 * ⚠️ THE INERTNESS TRAP, INVERTED. A population pinned to its ceiling every
 * generation is fixed N with extra steps. This asserts the two ends behave
 * differently: a huge fecundity must saturate at K, a tiny one must collapse.
 * If both did the same thing, `seedsPerGrain` would not be reaching the model.
 */
test("fecundity controls the outcome: saturating pins at K, starving collapses", () => {
  const b = twoLineages(20, 2, 4, 60);
  const at = (c, K) =>
    I.run({
      n: 20,
      generations: 8,
      seed: 2,
      siteN: 60,
      visits: 6000,
      found: b.pop,
      demography: { seedsPerGrain: c, K },
    });
  const rich = at(1, 25);
  const poor = at(1e-7, 25);
  assert.ok(
    rich.history.slice(2).every((h) => h.popN === 25),
    "a saturating fecundity did not pin the population at K",
  );
  assert.ok(poor.extinct, "a starving fecundity did not drive extinction");
});

test("the shared ceiling is never exceeded", () => {
  const b = twoLineages(20, 3, 4, 60);
  const out = I.run({
    n: 20,
    generations: 10,
    seed: 3,
    siteN: 60,
    visits: 6000,
    found: b.pop,
    demography: { seedsPerGrain: 1, K: 22 },
  });
  assert.ok(
    out.history.every((h) => h.popN <= 22),
    "population exceeded the shared ceiling",
  );
});

/*
 * Extinction has to STOP the run rather than crash it or be silently rescued.
 * step() suppresses the fall-back-to-parents behaviour under demography for
 * exactly this reason — carrying the parents forward would rescue the decline the
 * arm exists to measure.
 */
test("extinction terminates the run and is reported", () => {
  const b = twoLineages(20, 4, 4, 60);
  const out = I.run({
    n: 20,
    generations: 30,
    seed: 4,
    siteN: 60,
    visits: 6000,
    found: b.pop,
    demography: { seedsPerGrain: 1e-9, K: 40 },
  });
  assert.strictEqual(out.extinct, true);
  assert.ok(out.history.length < 30, "the run continued past extinction");
});

test("a shrinking generation is not misreported as a stall", () => {
  /* `stalled` means "could not produce the offspring it was entitled to". Under
   * demography the entitlement is the recruit count, not the parent count, so a
   * population that legitimately halves must not raise the flag. */
  const b = twoLineages(20, 5, 4, 60);
  const out = I.run({
    n: 20,
    generations: 6,
    seed: 5,
    siteN: 60,
    visits: 6000,
    found: b.pop,
    /* sized against the seed total MEASURED at this configuration (11585
     * grains), not against the experiment's 24000-visit scale — the first
     * version used the latter, shrank nothing at all, and was caught by its own
     * guard below rather than passing vacuously */
    demography: { seedsPerGrain: 20 / 12000, K: 40 },
  });
  const shrank = out.history.filter((h, i) => i > 0 && h.popN < 20);
  assert.ok(
    shrank.length > 0,
    "nothing shrank — the test is not exercising it",
  );
  assert.ok(
    shrank.every((h) => !h.stalled || h.unmated > 0),
    "a shrinking generation reported itself frozen with no unmated mothers",
  );
});

/* ------------------------------------------------ the tracer stays neutral */

/*
 * The whole design rests on the model never knowing which lineage an individual
 * belongs to — a per-lineage quota would assume coexistence. `anc` must remain a
 * label that decides nothing, and the cheapest way to break that would be to let
 * it reach the phenotype.
 */
test("the ancestry tracer still reaches nothing", () => {
  const rng = E.makeRng(9);
  const ind = I.randomIndividual(rng);
  const withAnc = { ...ind, anc: 0.37 };
  assert.deepStrictEqual(I.shapeOf(withAnc), I.shapeOf(ind));
  assert.ok(!("anc" in I.gamete(withAnc, E.makeRng(1), 0)));
});
