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

/* --------------------------------------------------- gapMembers (indices) */

/*
 * `gapMembers` is the predicate; `gapOccupancy` counts what it returns. It used
 * to be reimplemented inside `experiments/fusion-vs-exclusion.js`, guarded by a
 * runtime anchor that compared the two on real clouds — a check that could only
 * DETECT drift, and only when that experiment ran. These tests cover the thing
 * the fractions structurally cannot: WHICH plant.
 */

/*
 * ⚠️ THE NEGATIVE AND ITS POSITIVE CONTROL IN ONE TEST. "nobody is in the gap"
 * is a candidate ANSWER of the experiment this feeds, so asserting an empty gap
 * alone would pass on a predicate wired to classify nothing. Naming the exact
 * indices makes a predicate that classifies EVERYTHING fail just as loudly.
 */
test("gapMembers names exactly which plants sit in the gap and the cores", () => {
  const places = [
    { s: 0, phi: 0 } /* 0 — on pA */,
    { s: 8, phi: 0 } /* 1 — on pB */,
    { s: 4, phi: 0 } /* 2 — midway, inside the ellipse */,
    { s: 20, phi: 0 } /* 3 — far past pB, outside every class */,
  ];
  const m = I.gapMembers(places, pA, pB);
  assert.deepStrictEqual(m.coreA, [0]);
  assert.deepStrictEqual(m.coreB, [1]);
  assert.deepStrictEqual(m.gap, [2]);
  assert.equal(m.n, 4, "every placed plant counts toward n, classified or not");
});

/*
 * ⚠️⚠️ THE BUG THIS EXISTS TO CATCH, AND THE FRACTIONS CANNOT SEE IT. `places`
 * runs parallel to the traced `anc` array and the experiment reads `anc[i]` for
 * each returned index. An implementation that filtered out unplaced plants
 * before indexing would return indices into the FILTERED array, shifting every
 * index past the first null and crossing gap membership with the WRONG plant's
 * ancestry. `gapOccupancy` only ever counts, so it would report identical
 * numbers while the experiment's headline quietly changed.
 */
test("indices are into the original array, so nulls do not shift them", () => {
  const places = [
    null,
    { s: 0, phi: 0 },
    null,
    { s: 8, phi: 0 },
    { s: 4, phi: 0 },
  ];
  const m = I.gapMembers(places, pA, pB);
  assert.deepStrictEqual(m.coreA, [1]);
  assert.deepStrictEqual(m.coreB, [3]);
  assert.deepStrictEqual(m.gap, [4]);
  assert.equal(m.n, 3, "n counts placed plants, not array slots");
  for (const i of [...m.gap, ...m.coreA, ...m.coreB])
    assert.ok(places[i], `index ${i} must point at a placed plant`);
});

/*
 * `gapOccupancy` is a thin count over `gapMembers` now, so this asserts the
 * wrapper rather than a second predicate — but it can still fail, and that is
 * the point: giving either one its own loop again would reopen exactly the drift
 * the old runtime anchor was watching for. Run on REAL traced clouds, because
 * that is where the two implementations used to be compared.
 */
test("gapOccupancy is exactly the membership counts, on real traced clouds", () => {
  const opts = { ...I.DEFAULTS, siteN: 60 };
  const rng = E.makeRng(4);
  const srng = I.signalRng(4);
  const built = I.foundTwoLineages(20, rng, srng, 8, opts);
  assert.ok(built, "founding failed");
  const place = (g) =>
    I.sitesOf([{ h1: g, h2: g }], opts, 0).map(I.placementOf)[0];
  const a = place(built.gA);
  const b = place(built.gB);
  assert.ok(a && b, "reference placements missing");
  const h = I.run({
    n: 20,
    generations: 5,
    seed: 4,
    siteN: 60,
    found: built.pop,
    trace: true,
  }).history;
  let checked = 0;
  let classified = 0;
  for (const r of h) {
    if (!r.places) continue;
    const m = I.gapMembers(r.places, a, b);
    const g = I.gapOccupancy(r.places, a, b);
    assert.equal(g.n, m.n);
    assert.equal(g.gap, m.gap.length / m.n);
    assert.equal(g.coreA, m.coreA.length / m.n);
    assert.equal(g.coreB, m.coreB.length / m.n);
    const idx = [...m.gap, ...m.coreA, ...m.coreB];
    assert.equal(new Set(idx).size, idx.length, "a plant was classified twice");
    for (const i of idx) assert.ok(r.places[i], "index misses a placed plant");
    checked++;
    classified += idx.length;
  }
  assert.ok(checked >= 3, "not enough traced clouds to judge");
  /* ⚠️ without this the whole loop passes vacuously on a run that classified nobody */
  assert.ok(
    classified > 0,
    "nothing was classified — the check proved nothing",
  );
});

/*
 * Coincident reference points cannot define a gap. ⚠️ `n` must still report the
 * cloud size: returning 0 here would make `gapOccupancy` divide by zero and
 * publish NaN instead of an honest empty classification.
 */
test("coincident reference points classify nobody but still count the cloud", () => {
  const places = [{ s: 0, phi: 0 }, { s: 4, phi: 0 }, null];
  const m = I.gapMembers(places, pA, pA);
  assert.deepStrictEqual([m.gap, m.coreA, m.coreB], [[], [], []]);
  assert.equal(m.n, 2);
  const g = I.gapOccupancy(places, pA, pA);
  assert.equal(g.n, 2);
  assert.equal(g.gap, 0);
  assert.ok(Number.isFinite(g.coreA) && Number.isFinite(g.coreB));
});

/*
 * The three classes are tested in order, so a plant inside BOTH cores is
 * attributed to A. It takes overlapping cores to arise, but the tie has to
 * resolve the same way every time or the two core counts stop being comparable
 * across runs — and a bridge-vs-merge call is made on exactly that comparison.
 */
test("a plant inside both cores is attributed to A, deterministically", () => {
  const m = I.gapMembers([{ s: 4, phi: 0 }], pA, pB, { core: 0.6 });
  assert.deepStrictEqual(m.coreA, [0]);
  assert.deepStrictEqual(m.coreB, []);
  assert.deepStrictEqual(m.gap, []);
});

/*
 * ⚠️⚠️ WRITTEN BECAUSE A MUTANT SURVIVED. Re-splitting `gapOccupancy` back into
 * its own loop with `<=` where the predicate uses `<` failed NO test: on real
 * clouds and on ordinary fixtures no plant ever sits exactly on a threshold, so
 * the drift was invisible. A surviving mutant is the coverage report, and the
 * uncovered thing was the boundary itself.
 *
 * The midpoint of pA..pB sits at EXACTLY half the separation, and halving a
 * float is exact in binary, so `core: 0.5` puts it precisely on the core
 * threshold and `ell: 1.0` puts it precisely on the ellipse. The equalities are
 * asserted here rather than assumed, because if the arithmetic ever stopped
 * being exact this test would silently go back to testing nothing.
 *
 * Documented semantics, now pinned: the core is STRICT (`a < core*d0`, so the
 * boundary is NOT in the core) and the ellipse is INCLUSIVE (`a+b <= ell*d0`,
 * so the boundary IS in the gap).
 */
test("the classification boundaries are exact, and strict on the core", () => {
  const mid = { s: 4, phi: 0 };
  const d0 = I.dist(pA, pB);
  assert.equal(I.dist(mid, pA), 0.5 * d0, "fixture is not on the core edge");
  assert.equal(
    I.dist(mid, pA) + I.dist(mid, pB),
    1.0 * d0,
    "fixture is not on the ellipse edge",
  );

  /* exactly on the core threshold — strict `<` keeps it OUT of the core, and it
   * falls through to the gap, which the default ellipse admits */
  const onCore = I.gapMembers([mid], pA, pB, { core: 0.5 });
  assert.deepStrictEqual(onCore.coreA, [], "core must be strict");
  assert.deepStrictEqual(onCore.coreB, []);
  assert.deepStrictEqual(onCore.gap, [0]);

  /* ⚠️ AND `gapOccupancy` MUST AGREE HERE, which is the whole point. The
   * surviving mutant re-split it into its own loop differing only at the
   * boundary; every other test compares the two away from a threshold, where
   * such a split is invisible. This is the one comparison that can see it. */
  const gOnCore = I.gapOccupancy([mid], pA, pB, { core: 0.5 });
  assert.equal(gOnCore.coreA, 0, "gapOccupancy drifted from the strict core");
  assert.equal(gOnCore.gap, 1, "gapOccupancy drifted from the membership");

  /* exactly on the ellipse threshold — inclusive `<=` keeps it IN the gap */
  const onEll = I.gapMembers([mid], pA, pB, { core: 0.1, ell: 1.0 });
  assert.deepStrictEqual(onEll.gap, [0], "ellipse must be inclusive");
  assert.equal(I.gapOccupancy([mid], pA, pB, { core: 0.1, ell: 1.0 }).gap, 1);

  /* ⚠️ the positive control for the sentence above: a hair outside the ellipse
   * must fall out of the gap, or "inclusive" is indistinguishable from "always" */
  const outside = I.gapMembers([mid], pA, pB, { core: 0.1, ell: 0.999 });
  assert.deepStrictEqual(outside.gap, []);
});
