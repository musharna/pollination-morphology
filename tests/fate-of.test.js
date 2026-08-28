/*
 * Semantic tests for `fateOf`.
 *
 * ⚠️⚠️ THIS PREDICATE DECIDES EVERY HEADLINE IN ROADMAP B AND NOTHING ASSERTED
 * WHAT ITS ANSWERS MEAN. Swapping the HELD and FUSED return values left the
 * suite green at 186 of 187, and the single failure was the browser-bundle
 * STALENESS tripwire — which fires identically for an appended no-op comment.
 * A tripwire that cannot tell a semantic inversion from a whitespace change
 * carries zero semantic information about this function, so in effect the
 * function had no coverage at all: every experiment that classifies HELD /
 * FUSED / one lost / BOTH LOST was resting on a predicate no test could
 * contradict.
 *
 * The three live outcomes are OPPOSITE mechanisms, which is the whole reason the
 * ancestry tracer exists — fusion and exclusion both end at ancestry variance 0
 * and are the same row without it. So each is asserted BY NAME, on a population
 * constructed to be that case and no other.
 *
 * Populations are built by hand rather than run, because a run cannot be steered
 * to a chosen fate and a test that asserts whatever came out is not a test.
 */

const test = require("node:test");
const assert = require("node:assert");
const I = require("../sim/ibm.js");

/* `fateOf` reads only `anc`; the rest of an individual is irrelevant to it. */
const popWith = (ancs) => ancs.map((anc) => ({ anc }));

/* two lineages founded distinct: half at 0, half at 1 */
const FOUNDING = popWith([...new Array(20).fill(0), ...new Array(20).fill(1)]);
const ANC_VAR0 = I.ancestryVar(FOUNDING);

test("the founding population is the case the threshold is relative to", () => {
  /* ancVar0 is the yardstick for every HELD verdict below, so a wrong value
   * here would silently move all of them. Two equal groups at 0 and 1 have
   * variance 0.25 by construction. */
  assert.ok(
    Math.abs(ANC_VAR0 - 0.25) < 1e-9,
    `founding ancestry variance should be 0.25, got ${ANC_VAR0}`,
  );
});

/* ------------------------------------------------------- the three outcomes */

test("two lineages still distinct is HELD", () => {
  assert.strictEqual(I.fateOf(FOUNDING, ANC_VAR0, false), "HELD");
  /* and still HELD after real erosion, so long as most variance survives */
  const eroded = popWith([
    ...new Array(20).fill(0.1),
    ...new Array(20).fill(0.9),
  ]);
  assert.strictEqual(I.fateOf(eroded, ANC_VAR0, false), "HELD");
});

test("variance collapsed with the mean in the middle is FUSED", () => {
  const fused = popWith(new Array(40).fill(0.5));
  assert.strictEqual(I.fateOf(fused, ANC_VAR0, false), "FUSED");
  /* not exactly 0.5 — fusion is a cloud, not a point */
  const noisy = popWith(
    new Array(40).fill(0).map((_, i) => 0.5 + (i % 2 ? 0.02 : -0.02)),
  );
  assert.strictEqual(I.fateOf(noisy, ANC_VAR0, false), "FUSED");
});

test("the tracer gone to one end is one lost, at BOTH ends", () => {
  assert.strictEqual(
    I.fateOf(popWith(new Array(40).fill(0)), ANC_VAR0, false),
    "one lost",
  );
  assert.strictEqual(
    I.fateOf(popWith(new Array(40).fill(1)), ANC_VAR0, false),
    "one lost",
  );
  /* ⚠️ the asymmetric case is the one that matters: a survivor lineage that
   * kept a little of the other's ancestry is still a lineage lost, not a
   * fusion, and the two differ only in the MEAN */
  assert.strictEqual(
    I.fateOf(popWith(new Array(40).fill(0.08)), ANC_VAR0, false),
    "one lost",
  );
});

test("FUSED and one lost are told apart by the mean, at the same variance", () => {
  /* the pair that makes the tracer earn its keep: identical (zero) variance,
   * opposite mechanisms, distinguished only by where the mean sits */
  const fused = popWith(new Array(40).fill(0.5));
  const lost = popWith(new Array(40).fill(0.02));
  /* both are constant populations, so both variances are zero to within float
   * noise — 0.5 lands on exactly 0, 0.02 on 1.08e-34 */
  for (const p of [fused, lost])
    assert.ok(I.ancestryVar(p) < 1e-30, "a constant population had variance");
  assert.notStrictEqual(
    I.fateOf(fused, ANC_VAR0, false),
    I.fateOf(lost, ANC_VAR0, false),
    "two opposite mechanisms at identical variance returned the same fate",
  );
});

/* ------------------------------------------------------------- extinction */

test("extinction and a population too small to score are BOTH LOST", () => {
  assert.strictEqual(I.fateOf(FOUNDING, ANC_VAR0, true), "BOTH LOST");
  assert.strictEqual(I.fateOf(popWith([0]), ANC_VAR0, false), "BOTH LOST");
  assert.strictEqual(I.fateOf([], ANC_VAR0, false), "BOTH LOST");
  assert.strictEqual(I.fateOf(null, ANC_VAR0, false), "BOTH LOST");
  /* extinction wins over every other reading, including a held-looking one */
  assert.strictEqual(I.fateOf(FOUNDING, ANC_VAR0, true), "BOTH LOST");
});

/* -------------------------------------------------------------- thresholds */

test("HELD is relative to the FOUNDING variance, not to an absolute", () => {
  /* the same final population is HELD against a small founding variance and
   * FUSED against a large one — so a caller passing the wrong ancVar0 changes
   * the answer, and the parameter is load-bearing rather than decorative */
  const pop = popWith([
    ...new Array(20).fill(0.45),
    ...new Array(20).fill(0.55),
  ]);
  const v = I.ancestryVar(pop);
  assert.strictEqual(I.fateOf(pop, v / 2, false), "HELD");
  assert.strictEqual(I.fateOf(pop, v * 10, false), "FUSED");
});

test("the HELD threshold is STRICT: exactly 0.4 x founding variance is not held", () => {
  /*
   * ⚠️⚠️ THE FIRST VERSION OF THIS TEST COULD NOT SEE THE STRICTNESS IT NAMED,
   * and the mutation run said so: flipping `v > 0.4 * ancVar0` to `v >=`
   * SURVIVED (_scratch/fate-of-seen-to-fail.js). It built the boundary case as
   * `sqrt(0.4 * ancVar0)` squared, which does not round-trip, so the variance
   * landed NEAR the threshold and never ON it — and near the threshold `>` and
   * `>=` agree. A surviving mutant is the coverage report.
   *
   * The fix is arithmetic, not tolerance. `ancVar0` is a plain parameter, so it
   * can be CHOSEN rather than derived: 0.15625 = 5/32 is exactly representable
   * and 0.4 * 0.15625 is exactly 0.0625, with no rounding at all. A two-point
   * population at 0.5 +/- 0.25 has variance exactly 0.0625 — every value dyadic,
   * every intermediate exact. So v === threshold to the bit, and `>` and `>=`
   * finally disagree.
   *
   * ⚠️ Note 0.4 * 0.25 is NOT exact (0.10000000000000000555), which is why the
   * founding variance used everywhere else in this file cannot serve here.
   */
  const ANC_VAR0_EXACT = 0.15625;
  const threshold = 0.4 * ANC_VAR0_EXACT;
  assert.strictEqual(threshold, 0.0625, "the threshold is not exact");

  const exactly = popWith([
    ...new Array(20).fill(0.25),
    ...new Array(20).fill(0.75),
  ]);
  assert.strictEqual(
    I.ancestryVar(exactly),
    threshold,
    "the construction did not land exactly on the boundary, so this test " +
      "cannot distinguish > from >= and is not testing strictness",
  );
  assert.strictEqual(I.fateOf(exactly, ANC_VAR0_EXACT, false), "FUSED");

  /* the positive control: one bit above the boundary IS held */
  const above = popWith([
    ...new Array(20).fill(0.25 - Number.EPSILON),
    ...new Array(20).fill(0.75 + Number.EPSILON),
  ]);
  assert.ok(
    I.ancestryVar(above) > threshold,
    "the control did not clear the boundary",
  );
  assert.strictEqual(I.fateOf(above, ANC_VAR0_EXACT, false), "HELD");
});

test("the one-lost mean thresholds sit at 0.15 and 0.85", () => {
  const at = (m) => I.fateOf(popWith(new Array(40).fill(m)), ANC_VAR0, false);
  assert.strictEqual(at(0.14), "one lost");
  assert.strictEqual(at(0.16), "FUSED");
  assert.strictEqual(at(0.84), "FUSED");
  assert.strictEqual(at(0.86), "one lost");
});

test("⚠️ AT EXACTLY THE THRESHOLD THE ANSWER IS A FLOATING-POINT ACCIDENT", () => {
  /*
   * Both comparisons are strict (`m < 0.15`, `m > 0.85`), so the boundary case
   * turns on whether the computed mean lands a hair above or below the literal.
   * Summing 40 copies and dividing gives:
   *
   *   0.15 -> 0.15000000000000007772   NOT < 0.15  -> FUSED
   *   0.85 -> 0.85000000000000053291       > 0.85  -> one lost
   *
   * So the two thresholds behave OPPOSITELY at their own boundaries — 0.15
   * resolves inward and 0.85 outward — for no reason in the model, and the
   * direction depends on the population size and the summation order rather
   * than on any biology. This is pinned rather than fixed because a run landing
   * exactly on a threshold is measure-zero in practice and any "fix" would be a
   * tolerance nobody pre-declared. It is recorded so that a future reading of
   * "the thresholds are symmetric" is known to be false at the boundary.
   */
  const at = (m) => I.fateOf(popWith(new Array(40).fill(m)), ANC_VAR0, false);
  assert.strictEqual(at(0.15), "FUSED");
  assert.strictEqual(at(0.85), "one lost");
});

test("HELD wins over the mean test when both could apply", () => {
  /* a lopsided but still-variable population: mean below 0.15 AND variance
   * above the threshold. The code checks HELD first, so it is HELD — recorded
   * here because it is a real precedence decision rather than an accident, and
   * an edit that reorders the two branches must come and change this line. */
  /* ⚠️ THE WINDOW IS NARROW AND MY FIRST ATTEMPT MISSED IT. 38/2 has mean 0.05
   * but variance only 0.0475, BELOW the 0.1 threshold — a lopsided population
   * has LOW variance, so "mean says lost, variance says held" is not the easy
   * case it sounds like. Variance is maximised at m(1-m) by a two-point 0/1
   * distribution, so both conditions hold only for 0.113 < m < 0.15. 5 of 40 is
   * inside it: mean 0.125, variance 0.109. */
  const pop = popWith([...new Array(35).fill(0), ...new Array(5).fill(1)]);
  const m = pop.reduce((s, i) => s + i.anc, 0) / pop.length;
  assert.ok(m < 0.15, `precondition: mean should be below 0.15, got ${m}`);
  assert.ok(
    I.ancestryVar(pop) > 0.4 * ANC_VAR0,
    `precondition: variance should clear ${0.4 * ANC_VAR0}, got ${I.ancestryVar(pop)}`,
  );
  assert.strictEqual(I.fateOf(pop, ANC_VAR0, false), "HELD");
});

test("an individual with no anc field is read as 0 rather than crashing", () => {
  /* `anc` is undefined whenever the tracer is off, and fateOf coerces to 0 —
   * so an untraced run reports "one lost", not a throw and not HELD */
  const untraced = new Array(40).fill({});
  assert.strictEqual(I.fateOf(untraced, ANC_VAR0, false), "one lost");
});
