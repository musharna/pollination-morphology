/*
 * Tests for independent pollinator budgets.
 *
 * The option is one line in `step()`, and the risk is the usual pair: it must be
 * INERT where the earlier results live (one animal, or the flag off) and it must
 * genuinely BITE with two animals. An option that were silently dropped would
 * make the split and independent arms the same arm, and the experiment would
 * report "the number of limiting factors does not matter" no matter what.
 */

const test = require("node:test");
const assert = require("node:assert");
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const C = require("../sim/carryover.js");
const P = require("../sim/placement.js");

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

/* Generated from commit 17cd60c, before independentBudgets existed. */
const PRE_INDEP = [
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

const scaleBee = (k, lenK) => ({
  ...P.DEFAULT_BEE,
  r: P.DEFAULT_BEE.r * k,
  len: P.DEFAULT_BEE.len * lenK,
});
const BEE_A = scaleBee(0.65, 0.8);
const BEE_B = scaleBee(1.35, 1.15);

/* ---------------------------------------------------------------- inertness */

test("the flag off reproduces the pre-option model bit-for-bit", () => {
  assert.deepStrictEqual(goldenRun(), PRE_INDEP);
});

test("independentBudgets is a no-op with a single animal", () => {
  /* nothing to divide, so both settings must be the identical run */
  assert.deepStrictEqual(goldenRun({ independentBudgets: true }), PRE_INDEP);
});

/* ------------------------------------------------------------- it must BITE */

/*
 * ⚠️ TOTAL DELIVERED POLLEN, READ OUT OF THE MODEL RATHER THAN RECOMPUTED.
 *
 * The first version of this helper reimplemented the budget rule — and a
 * deliberate mutant that made `step()` ignore the flag entirely left both tests
 * using it GREEN, because they were exercising the reimplementation instead of
 * the model. The surviving mutant was the coverage report.
 *
 * `history[].totalSeed` is the model's own sum of received pollen (it exists
 * because density dependence needs it), so reading that goes through the real
 * `step()`. The demography settings here are irrelevant to the quantity — they
 * only decide how many recruits the total is converted into.
 */
function delivered(pop, extra) {
  return I.run({
    n: pop.length,
    generations: 1,
    seed: 11,
    siteN: 60,
    visits: 6000,
    found: pop,
    demography: { seedsPerGrain: 1e-6, K: 1000 },
    ...extra,
  }).history[0].totalSeed;
}

/*
 * ⚠️ THE PAIRED NEGATIVE. The two inertness tests above are satisfied by an
 * option that does nothing at all, so on their own they are worthless. This is
 * the test that fails if the flag never reaches `step()`.
 */
test("with two animals, independent budgets deliver about twice the pollen", () => {
  const rng = E.makeRng(1);
  const srng = I.signalRng(1);
  const opts = { ...I.DEFAULTS, siteN: 60, visits: 6000 };
  const b = I.foundTwoLineages(20, rng, srng, 4, opts);
  const split = delivered(b.pop, { bees: [BEE_A, BEE_B] });
  const indep = delivered(b.pop, {
    bees: [BEE_A, BEE_B],
    independentBudgets: true,
  });
  assert.ok(split > 0 && indep > 0, "no pollen delivered at all");
  const ratio = indep / split;
  assert.ok(
    ratio > 1.6 && ratio < 2.4,
    `independent/split = ${ratio.toFixed(3)}, expected about 2`,
  );
});

test("independentBudgets changes the run itself, not just a probe", () => {
  /* the probe above reimplements the budget rule, so it would still pass if
   * step() ignored the flag — this asserts against the model's own output */
  const rng = E.makeRng(2);
  const srng = I.signalRng(2);
  const opts = { ...I.DEFAULTS, siteN: 60, visits: 6000 };
  const b = I.foundTwoLineages(20, rng, srng, 4, opts);
  const at = (extra) =>
    I.run({
      n: 20,
      generations: 4,
      seed: 2,
      siteN: 60,
      visits: 6000,
      found: b.pop,
      bees: [BEE_A, BEE_B],
      ...extra,
    }).history.map((h) => h.spread);
  assert.notDeepStrictEqual(at({}), at({ independentBudgets: true }));
});

/*
 * The volume-matched control is the whole basis of the experiment's decisive
 * contrast, so the equality it rests on is asserted here rather than assumed:
 * two animals with a full budget each must deliver about as much pollen in
 * total as one animal given a doubled budget. If these diverged, "two limiting
 * factors" and "more visits" could not be told apart.
 */
test("the double-budget control matches independent budgets in total volume", () => {
  const rng = E.makeRng(3);
  const srng = I.signalRng(3);
  const opts = { ...I.DEFAULTS, siteN: 60, visits: 6000 };
  const b = I.foundTwoLineages(20, rng, srng, 4, opts);
  const indep = delivered(b.pop, {
    bees: [BEE_A, BEE_B],
    independentBudgets: true,
  });
  const double = delivered(b.pop, { visits: 12000 });
  const m = double / indep;
  assert.ok(
    m > 0.7 && m < 1.4,
    `volume match ${m.toFixed(3)} is too far from 1`,
  );
});

/* ------------------------------------------- the ratio is scale-invariant */

/*
 * ⚠️ THE FACT THE EXPERIMENT TURNS ON, pinned so it cannot quietly change.
 * Doubling every animal's budget scales every plant's receipt together, so the
 * RATIO between two lineages is untouched. That is why more visits cannot relieve
 * frequency dependence, and it is worth an assertion rather than a sentence.
 */
test("doubling the budget leaves the between-lineage ratio unchanged", () => {
  const rng = E.makeRng(4);
  const srng = I.signalRng(4);
  const opts = { ...I.DEFAULTS, siteN: 60, visits: 6000 };
  const b = I.foundTwoLineages(20, rng, srng, 8, opts);
  if (!b) return;
  const nA = 10;
  const ratioAt = (visits) => {
    const o = { ...opts, visits };
    const n = b.pop.length;
    const ss = I.sitesOf(b.pop, o, 0);
    const rb = C.runBout(ss, new Array(n).fill(1 / n), { visits, seed: 7 });
    const rec = new Array(n).fill(0);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) if (i !== j) rec[j] += rb.T[i][j];
    return mean(rec.slice(nA)) / mean(rec.slice(0, nA));
  };
  const r1 = ratioAt(6000);
  const r2 = ratioAt(12000);
  assert.ok(r1 > 0 && r2 > 0, "a lineage received nothing");
  assert.ok(
    Math.abs(r2 / r1 - 1) < 0.2,
    `ratio moved from ${r1.toFixed(3)} to ${r2.toFixed(3)} on a pure volume change`,
  );
});
