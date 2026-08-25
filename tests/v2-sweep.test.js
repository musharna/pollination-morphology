/*
 * Tests for the v2 budget sweep.
 *
 * Two things are pinned here, and both exist because the v2 result document
 * shipped numbers that no committed code could produce.
 *
 *   1. WHICH INTERVAL. docs/2026-08-01-v2-result.md publishes intervals that
 *      are normal-approximation z-intervals on n = 8. At n = 8 that is the
 *      wrong estimator — Student's t with 7 df is required — and the choice is
 *      not cosmetic: it is the entire difference between the document's
 *      Round-3 narrative ("at 6,000 visits the interval excluded zero by
 *      0.02") and the truth, which is that it never excluded zero at all.
 *      Both estimators are computed so the published numbers stay checkable
 *      against their own source, and so this cannot silently regress.
 *
 *   2. THAT THE BUDGET GUARD CAN ACTUALLY FIRE. The sweep runs the mean-field
 *      reference once per seed instead of once per (seed, budget), which is
 *      only sound because MEANFIELD never reads params.visits. A guard that
 *      merely never throws is indistinguishable from a guard that cannot
 *      throw, so the guard is driven here in BOTH directions: the carryover
 *      arm must trip it, and the mean-field arm must not. The positive half is
 *      the point — without it, a guard broken into permanent silence would
 *      still show green.
 */

const test = require("node:test");
const assert = require("node:assert");
const S = require("../experiments/v2-sweep.js");
const P = require("../sim/placement.js");

/* The eight paired differences exactly as printed in the result document. */
const PUBLISHED = {
  6000: [-2, 0, -1, -2, 2, -1, -2, -2],
  18000: [-2, 1, -2, -2, 0, 0, 0, -1],
};

test("the published intervals are z-intervals, and z is the wrong estimator at n=8", () => {
  const a = S.interval(PUBLISHED[6000]);
  const b = S.interval(PUBLISHED[18000]);

  /* Means are quoted in the document as -1.00 and -0.75. */
  assert.strictEqual(a.mean, -1);
  assert.strictEqual(b.mean, -0.75);
  assert.strictEqual(a.n, 8);

  /* The document prints [-1.98, -0.02] and [-1.56, 0.06]. Reproducing those
   * from the z branch is what identifies the estimator that was used. */
  assert.deepStrictEqual(
    a.z.map((x) => Number(x.toFixed(2))),
    [-1.98, -0.02],
  );
  assert.deepStrictEqual(
    b.z.map((x) => Number(x.toFixed(2))),
    [-1.56, 0.06],
  );

  /* The correction. Under z the 6,000 interval excludes zero, which is the
   * document's headline near-miss; under the correct t it does not, so the
   * near-miss never happened. */
  assert.ok(a.z[1] < 0, "z-interval at 6000 excludes zero (as published)");
  assert.ok(a.t[0] < 0 && a.t[1] > 0, "t-interval at 6000 INCLUDES zero");
  assert.ok(b.t[0] < 0 && b.t[1] > 0, "t-interval at 18000 includes zero");

  /* t is always the wider of the two — a guard against silently swapping the
   * critical value back. */
  assert.ok(a.t[1] - a.t[0] > a.z[1] - a.z[0]);
  assert.ok(b.t[1] - b.t[0] > b.z[1] - b.z[0]);
});

test("interval() refuses a df it has no tabulated critical value for", () => {
  const tooMany = new Array(64).fill(1).map((_, i) => i % 3);
  assert.throws(() => S.interval(tooMany), /no t critical value tabulated/);
});

/*
 * The guard, driven in both directions against the real model. Slow, because
 * it runs four full evolution loops, but a synthetic stub here would only
 * prove that a stub can be made to differ.
 */
test("the budget guard fires on a budget-sensitive arm and not on the reference", () => {
  const ctx = { bee: P.DEFAULT_BEE, nSamp: S.N_SAMP, ...S.precision() };
  const GENS = 120;
  const BUDGETS = [300, 1500];

  /* POSITIVE CONTROL — carryover genuinely reads the budget, so the guard has
   * to trip. If this stops throwing, the guard has gone blind and the
   * mean-field assertion below is worthless. */
  assert.throws(
    () => S.checkArmIgnoresBudget(ctx, 1, BUDGETS, "carryover", GENS),
    /carryover arm is budget-sensitive/,
    "guard failed to fire on an arm that IS budget-sensitive",
  );

  /* NEGATIVE — the reference arm ignores the budget, so the same guard on the
   * same seeds and budgets must pass and return a survivor count. */
  const n = S.checkArmIgnoresBudget(ctx, 1, BUDGETS, "meanfield", GENS);
  assert.ok(
    Number.isInteger(n) && n > 0,
    `expected a survivor count, got ${n}`,
  );
});
