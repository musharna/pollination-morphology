/*
 * Tests for the per-generation `trace` and for `gapOccupancy`.
 *
 * Two different risks, and they need different tests.
 *
 * `trace` has the usual inert/bite pair: it must not perturb any published run,
 * and it must actually carry the model's own state out. An inert trace that
 * never populated anything would pass every "nothing moved" test while making
 * the experiment read a permanently empty gap — which is one of the candidate
 * ANSWERS, so that failure mode would look exactly like a result.
 *
 * ⚠️ `gapOccupancy` carries the heavier risk, because the interesting outcome is
 * "the gap read EMPTY" and a statistic that always returned zero would produce
 * it on every input. So the negative is never asserted alone: each test that
 * asserts an empty gap also asserts a filled one, on a population built to have
 * that property. And the reference points must be FIXED by the founding
 * geometry — a version that re-derived the midpoint from the current cloud would
 * report a fused population as an empty gap forever, which is the specific way
 * this statistic could confirm the hypothesis it exists to test.
 */

const test = require("node:test");
const assert = require("node:assert");
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");

/* Generated from commit 17cd60c, before allocExponent or trace existed. */
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

/* ------------------------------------------------------- trace is inert ... */

test("trace absent still reproduces the pre-trace model bit-for-bit", () => {
  assert.deepStrictEqual(goldenRun(), PRE_ALLOC);
});

test("trace = true does not perturb the run it observes", () => {
  assert.deepStrictEqual(goldenRun({ trace: true }), PRE_ALLOC);
});

test("trace absent adds no fields to history", () => {
  const h = I.run({ n: 12, generations: 3, seed: 3, siteN: 60 }).history;
  assert.ok(h.every((r) => r.places === undefined && r.anc === undefined));
});

/* ------------------------------------------------------- ... and it BITES */

/*
 * ⚠️ THE PAIRED NEGATIVE for the trace. The three tests above are all satisfied
 * by a `trace` option that does nothing at all — which would leave the
 * experiment reading an empty gap in every generation of every arm and
 * reporting it as a finding.
 */
test("trace = true actually carries the per-generation state out", () => {
  const h = I.run({
    n: 12,
    generations: 3,
    seed: 3,
    siteN: 60,
    trace: true,
  }).history;
  assert.equal(h.length, 3);
  for (const r of h) {
    assert.ok(Array.isArray(r.places), "places missing");
    assert.ok(Array.isArray(r.anc), "anc missing");
    assert.equal(r.anc.length, r.popN);
    assert.equal(r.places.length, r.popN);
  }
});

/*
 * ⚠️ The ancestry labels must belong to the PARENTS of each generation, not to
 * their offspring — `places` and `ancVar` are both measured on the parents, so
 * a trace capturing the children would be silently misaligned with every other
 * column by exactly one generation. Capturing after step() instead of before
 * fails here and nowhere else.
 */
test("traced ancestry labels are the parents', not the offspring's", () => {
  const rng = E.makeRng(4);
  const srng = I.signalRng(4);
  const built = I.foundTwoLineages(20, rng, srng, 8, {
    ...I.DEFAULTS,
    siteN: 60,
  });
  assert.ok(built, "founding failed");
  const h = I.run({
    n: 20,
    generations: 3,
    seed: 4,
    siteN: 60,
    found: built.pop,
    trace: true,
  }).history;
  assert.deepStrictEqual(
    h[0].anc,
    built.pop.map((i) => i.anc),
  );
});

/* -------------------------------------------------------- gapOccupancy */

const pA = { s: 0, phi: 0 };
const pB = { s: 8, phi: 0 };
const cluster = (at, k = 15) =>
  Array.from({ length: k }, (_, i) => ({ s: at + 0.02 * i, phi: 0 }));

/*
 * ⚠️ THE NEGATIVE AND ITS POSITIVE CONTROL, DELIBERATELY IN ONE TEST. "The gap
 * is empty" is a candidate result of the experiment, so asserting it alone would
 * pass on a statistic hard-wired to zero. The second assertion is what makes the
 * first one worth anything.
 */
test("an unbridged pair reads an empty gap AND a bridged one reads a full gap", () => {
  const unbridged = cluster(0).concat(cluster(7.7));
  const bridged = cluster(0, 10)
    .concat(cluster(7.7, 10))
    .concat(Array.from({ length: 10 }, (_, i) => ({ s: 3 + 0.2 * i, phi: 0 })));
  assert.ok(
    I.gapOccupancy(unbridged, pA, pB).gap < 0.02,
    "unbridged should read ~0",
  );
  assert.ok(
    I.gapOccupancy(bridged, pA, pB).gap > 0.25,
    "bridged should read high — the statistic cannot see intermediates",
  );
});

/*
 * ⚠️ THE CIRCULARITY GUARD. A version that re-derived its reference points from
 * the current cloud would put the midpoint inside a fused population and report
 * an empty gap forever — confirming the hypothesis under test by construction.
 * A cloud sitting entirely in the middle must read as a FULL gap.
 */
test("reference points are fixed, so a merged cloud reads as a FULL gap", () => {
  const merged = Array.from({ length: 30 }, (_, i) => ({
    s: 3.9 + 0.007 * i,
    phi: 0,
  }));
  assert.ok(I.gapOccupancy(merged, pA, pB).gap > 0.9);
});

/*
 * A bridge and a merge must be DISTINGUISHABLE, because they are the two
 * hypotheses the experiment has to separate. Same gap occupancy, opposite core
 * occupancy.
 */
test("cores separate a bridge from a merge", () => {
  const bridge = cluster(0, 10)
    .concat(cluster(7.7, 10))
    .concat(Array.from({ length: 10 }, (_, i) => ({ s: 3 + 0.2 * i, phi: 0 })));
  const merge = Array.from({ length: 30 }, (_, i) => ({
    s: 3 + 0.06 * i,
    phi: 0,
  }));
  const b = I.gapOccupancy(bridge, pA, pB);
  const m = I.gapOccupancy(merge, pA, pB);
  assert.ok(b.coreA + b.coreB > 0.5, "a bridge keeps both cores occupied");
  assert.ok(m.coreA + m.coreB < 0.1, "a merge drains them");
});

test("fractions are well-formed and an empty cloud is safe", () => {
  const o = I.gapOccupancy(cluster(0).concat(cluster(7.7)), pA, pB);
  assert.ok(o.gap + o.coreA + o.coreB <= 1 + 1e-9);
  assert.equal(o.n, 30);
  const e = I.gapOccupancy([], pA, pB);
  assert.equal(e.n, 0);
  assert.equal(e.gap, 0);
  /* coincident reference points cannot define a gap and must not divide by zero */
  const z = I.gapOccupancy(cluster(0), pA, pA);
  assert.ok(Number.isFinite(z.gap));
});

/*
 * The real founding geometry is the baseline the dynamical arm starts from: two
 * near-clonal lineages at the exclusion separation have nothing in between them,
 * so any gap occupancy later in a run is something the run PRODUCED.
 */
test("real founding populations start with an empty gap", () => {
  const opts = { ...I.DEFAULTS, siteN: 60 };
  const gaps = [];
  for (const seed of [1, 2, 3, 4, 5]) {
    const rng = E.makeRng(seed);
    const srng = I.signalRng(seed);
    const built = I.foundTwoLineages(30, rng, srng, 8, opts);
    if (!built) continue;
    const place = (g) =>
      I.sitesOf([{ h1: g, h2: g }], opts, 0).map(I.placementOf)[0];
    const a = place(built.gA);
    const b = place(built.gB);
    if (!a || !b) continue;
    const places = I.sitesOf(built.pop, opts, 0).map(I.placementOf);
    gaps.push(I.gapOccupancy(places, a, b).gap);
  }
  assert.ok(gaps.length >= 3, "not enough foundings succeeded to judge");
  assert.ok(
    gaps.reduce((x, y) => x + y, 0) / gaps.length < 0.05,
    "founding populations should have an empty gap",
  );
});
