/*
 * Tests for the advertisement locus and its wiring into the IBM.
 *
 * The founding constraint of the project is that PLACEMENT IS NEVER A GENE.
 * Adding a heritable signal is the closest this codebase has come to breaking
 * it, because a signal IS a legitimate gene and it sits one field away from the
 * shape genome. Two invariants therefore carry the weight here:
 *
 *   1. the advertisement cannot reach the geometry through the PHENOTYPE
 *   2. the advertisement cannot reach the geometry through the RNG STREAM
 *
 * The second is the one that would have been missed. A shared stream would mean
 * that turning deception on silently re-rolled every shape mutation, so an arm
 * with the mechanism and an arm without would differ in two things at once.
 */

const test = require("node:test");
const assert = require("node:assert");
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const C = require("../sim/carryover.js");
const D = require("../sim/deception.js");

const LEARN = { rate: 0.2, forget: 0.01, width: 0.06, naive: 1 };

/* ------------------------------------------- invariant 1: the phenotype path */

test("the advertisement is heritable but is NOT a placement coordinate", () => {
  const rng = E.makeRng(11);
  const ind = I.randomIndividual(rng);
  assert.ok(I.SIGNAL_GENE in ind.h1, "signal must be carried on a haplotype");
  assert.ok(
    I.ALL_KEYS.includes(I.SIGNAL_GENE),
    "signal must be a declared locus",
  );
  const forbidden = ["s", "phi", "site", "placement", "stigmaTheta", "stigmaT"];
  for (const hap of [ind.h1, ind.h2, I.phenotype(ind), I.gamete(ind, rng, 0)])
    for (const k of forbidden)
      assert.ok(!(k in hap), `${k} became heritable alongside the signal`);
});

test("shapeOf drops the advertisement so it never reaches a flower", () => {
  const rng = E.makeRng(12);
  const ind = I.randomIndividual(rng);
  assert.ok(
    I.SIGNAL_GENE in I.phenotype(ind),
    "the expressed phenotype should carry the signal",
  );
  assert.ok(
    !(I.SIGNAL_GENE in I.shapeOf(ind)),
    "shapeOf must strip the signal before it becomes a flower",
  );
  assert.ok(
    !(I.SIGNAL_GENE in E.toFlower(I.shapeOf(ind))),
    "a flower must never carry an advertisement field",
  );
});

/*
 * ⚠️ THE LOAD-BEARING ONE. Two individuals identical except in the
 * advertisement must produce BYTE-IDENTICAL placements. If this ever fails, the
 * signal has become a placement gene by the back door and every "the population
 * split on placement" statement would be a statement about an advertisement.
 */
test("two individuals differing ONLY in signal have identical placements", () => {
  const rng = E.makeRng(13);
  const ind = I.randomIndividual(rng);
  const opts = { ...I.DEFAULTS, siteN: 60 };
  const clone = (v) => ({
    h1: { ...ind.h1, [I.SIGNAL_GENE]: v },
    h2: { ...ind.h2, [I.SIGNAL_GENE]: v },
  });
  const a = I.sitesOf([clone(0.1)], opts, 0).map(I.placementOf)[0];
  const b = I.sitesOf([clone(0.9)], opts, 0).map(I.placementOf)[0];
  assert.ok(a && b, "both individuals must produce a placement at all");
  assert.strictEqual(a.s, b.s, "the advertisement moved the placement along s");
  assert.strictEqual(
    a.phi,
    b.phi,
    "the advertisement moved the placement around phi",
  );
});

/* ------------------------------------------- invariant 2: the random stream */

/*
 * A negative assertion needs a positive control in the same test, or a harness
 * that has stopped varying anything at all reads as the invariant holding.
 */
test("the advertisement's mutation rate cannot perturb the shape dynamics", () => {
  const cfg = { n: 12, generations: 4, seed: 3, siteN: 60, visits: 6000 };
  const shapeOnly = (signalMut) =>
    I.run({ ...cfg, signalMut }).history.map((h) => h.spread);

  /* NEGATIVE: with no learner the signal is never read, so changing how fast it
   * mutates must leave the placement history bit-identical. */
  const a = shapeOnly(0.0);
  const b = shapeOnly(0.4);
  assert.deepStrictEqual(
    a,
    b,
    "the advertisement's stream leaked into the shape dynamics",
  );

  /* POSITIVE CONTROL: with a learner reading the signal, the SAME change must
   * actually move the outcome — otherwise the assertion above would pass on a
   * model in which the advertisement does nothing anywhere. */
  const withLearner = (signalMut) =>
    I.run({ ...cfg, signalMut, deceptive: true, learn: LEARN }).history.map(
      (h) => h.spread,
    );
  assert.notDeepStrictEqual(
    withLearner(0.0),
    withLearner(0.4),
    "with deception ON the advertisement rate must change the outcome",
  );
});

/*
 * ⚠️ THIS TEST EXISTS BECAUSE A MUTANT SURVIVED, and the surviving mutant was
 * the coverage report.
 *
 * The test above compares two advertisement RATES. It cannot catch signal
 * mutation being drawn from the SHAPE stream, because that draw happens the same
 * number of times whichever rate is set — so both arms shift together, match
 * each other perfectly, and are both wrong. Changing `gauss(srng)` to
 * `gauss(rng)` in `gamete` passed it.
 *
 * The invariant that actually matters is not "the rate does not matter" but
 * "the advertisement changed NOTHING about the model that existed before it".
 * That needs an external reference, so these numbers were generated from commit
 * 63c4cb5 — the IBM as published on 2026-08-03, before the advertisement locus
 * existed — and NOT from the code under test. A constant calibrated from the
 * artifact under test would simply encode its defect.
 */
const PRE_ADVERTISEMENT = [
  [0.6426076918656048, 3.0637323268730365],
  [0.8843517599890253, 3.6807972859897253],
  [0.8257455458521449, 3.61632994537921],
  [0.49249979315034653, 2.269042873658907],
  [0.6023262955018738, 2.172879959409133],
];

test("the shape dynamics are bit-identical to the model before the advertisement", () => {
  const h = I.run({
    n: 12,
    generations: 5,
    seed: 3,
    siteN: 60,
    visits: 6000,
  }).history;
  assert.deepStrictEqual(
    h.map((r) => [r.spread, r.separation]),
    PRE_ADVERTISEMENT,
    "adding the advertisement moved the shape dynamics — every IBM result " +
      "published on 2026-08-03 would stop reproducing",
  );
});

/* --------------------------------------------------- the ring is a ring */

test("the advertisement blends across the 0/1 wrap", () => {
  /* 0.95 and 0.05 are 0.1 apart on a ring; a plain average would put their
   * offspring at 0.5, i.e. as far from both parents as it is possible to be. */
  const m = I.meanRing(0.95, 0.05);
  const d = Math.min(m, 1 - m);
  assert.ok(d < 0.02, `expected a mean near 0/1, got ${m}`);
  assert.ok(
    Math.abs(I.meanRing(0.2, 0.4) - 0.3) < 1e-9,
    "the ordinary case moved",
  );
  assert.ok(I.ringDist(0.95, 0.05) < 0.11, "ring distance is not wrapping");
});

test("advertisement alleles stay on the ring under mutation", () => {
  const rng = E.makeRng(14);
  const ind = I.randomIndividual(rng);
  for (let t = 0; t < 200; t++) {
    const g = I.gamete(ind, rng, 0.02, { signalMut: 0.9 });
    const v = g[I.SIGNAL_GENE];
    assert.ok(v >= 0 && v < 1, `signal left the ring: ${v}`);
  }
});

/* ------------------------------------------------------------- linkage */

test("linkage makes the advertisement co-segregate with the anther loci", () => {
  const rng = E.makeRng(15);
  /* A heterozygote whose two haplotypes are distinguishable at both loci. */
  const ind = {
    h1: { ...E.randomGenome(rng), signal: 0.1, antherT: 0.4 },
    h2: { ...E.randomGenome(rng), signal: 0.9, antherT: 0.8 },
  };
  const agree = (linkSignal) => {
    let same = 0;
    const T = 800;
    for (let t = 0; t < T; t++) {
      const g = I.gamete(ind, rng, 0, { linkSignal, signalMut: 0 });
      const sigFrom1 = Math.abs(g.signal - 0.1) < 1e-9;
      const antFrom1 = Math.abs(g.antherT - 0.4) < 1e-9;
      if (sigFrom1 === antFrom1) same++;
    }
    return same / T;
  };
  assert.ok(
    agree(true) > 0.999,
    `linked loci must always co-segregate, got ${agree(true)}`,
  );
  const free = agree(false);
  assert.ok(
    free > 0.4 && free < 0.6,
    `unlinked loci must co-segregate at chance, got ${free}`,
  );
});

test("linkage does not change which alleles exist, only how they travel", () => {
  const rng = E.makeRng(16);
  const ind = I.randomIndividual(rng);
  for (let t = 0; t < 60; t++) {
    const g = I.gamete(ind, rng, 0, { linkSignal: true, signalMut: 0 });
    for (const k of I.ALL_KEYS)
      assert.ok(
        Math.abs(g[k] - ind.h1[k]) < 1e-9 || Math.abs(g[k] - ind.h2[k]) < 1e-9,
        `locus ${k} produced an allele neither parent carried`,
      );
  }
});

/* ------------------------------------------ the signal-space statistic */

test("two advertisement clouds score far above one", () => {
  const rng = E.makeRng(17);
  const one = [];
  const two = [];
  for (let i = 0; i < 40; i++) {
    one.push(0.5 + 0.01 * (rng() - 0.5));
    two.push(i % 2 ? 0.2 + 0.01 * (rng() - 0.5) : 0.7 + 0.01 * (rng() - 0.5));
  }
  const a = I.ringSeparation(one);
  const b = I.ringSeparation(two);
  assert.ok(a && b, "the statistic returned null on a populated cloud");
  assert.ok(
    b.separation > 3 * a.separation,
    `two clouds ${b.separation} must clearly beat one ${a.separation}`,
  );
  assert.ok(
    b.minorityFrac > 0.35,
    "an even split must report a large minority",
  );
  /* The statistic must respect the wrap: a cloud straddling 0/1 is ONE cloud. */
  const straddle = [];
  for (let i = 0; i < 40; i++) straddle.push((1 + 0.02 * (rng() - 0.5)) % 1);
  assert.ok(
    I.ringSeparation(straddle).separation < 3 * a.separation,
    "a cloud straddling 0/1 was read as two",
  );
});

test("ring spread is zero for identical advertisements and wraps correctly", () => {
  assert.ok(I.ringSpread(new Array(10).fill(0.3)) < 1e-9, "identical spread");
  const straddling = [0.99, 0.01, 0.98, 0.02];
  assert.ok(
    I.ringSpread(straddling) < 0.05,
    "a tight cloud across the wrap read as wide",
  );
});

/* ------------------------------------------------ the deception wiring */

/*
 * The three levels have to be genuinely different, and in the right direction.
 * "learner present" is not the mechanism — cheating is — so the honest arm must
 * leave the animal's expectations where they started.
 */
test("honest plants leave expectations at naive; cheats drive them down", () => {
  const rng = E.makeRng(18);
  const srng = I.signalRng(18);
  const pop = I.foundPopulation(10, rng, { spread: 0.05, srng });
  const opts = { ...I.DEFAULTS, siteN: 50, visits: 4000 };
  const sites = I.sitesOf(pop, opts, 0);
  const signals = pop.map(I.signalOf);
  const after = (rewardP) => {
    const learner = D.makeLearner(LEARN);
    C.runBout(sites, new Array(sites.length).fill(1 / sites.length), {
      visits: opts.visits,
      seed: 7,
      learner,
      signals,
      rewardP: new Array(sites.length).fill(rewardP),
    });
    return learner.meanExpectation();
  };
  const honest = after(1);
  const cheat = after(0);
  assert.ok(
    Math.abs(honest - LEARN.naive) < 0.02,
    `honest plants moved the expectation to ${honest}`,
  );
  assert.ok(
    cheat < honest - 0.1,
    `cheating failed to depress expectation: ${cheat} vs ${honest}`,
  );
});

test("a deceptive generation still returns a full population", () => {
  const rng = E.makeRng(19);
  const srng = I.signalRng(19);
  const pop = I.foundPopulation(12, rng, { spread: 0.05, srng });
  const out = I.step(
    pop,
    { ...I.DEFAULTS, siteN: 40, visits: 4000, deceptive: true, learn: LEARN },
    rng,
    0,
    srng,
  );
  assert.strictEqual(out.pop.length, pop.length, "population size drifted");
  assert.ok(out.signalSpread >= 0, "signal spread must be defined");
  assert.ok(out.signals.length === pop.length, "signals must be reported");
});
