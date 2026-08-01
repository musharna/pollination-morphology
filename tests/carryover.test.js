/*
 * Tests for carryover.
 *
 * The load-bearing one is the REDUCTION TO THE KNOWN LIMIT. Every result so
 * far rests on a mean-field assumption — a grain gets exactly one chance and
 * is then gone — and this file replaces that with a counted simulation. If the
 * new machinery does not reproduce the old answer where the two must agree,
 * any difference it reports at real carryover is a bug rather than biology.
 * At groom = 1 each grain gets exactly one stigma sweep, at the very next
 * flower, which IS the mean-field assumption.
 */

const test = require("node:test");
const assert = require("node:assert");
const P = require("../sim/placement.js");
const K = require("../sim/packing.js");
const C = require("../sim/carryover.js");

const bee = P.DEFAULT_BEE;
const species = (theta, over = {}) => ({
  ...P.DEFAULT_FLOWER,
  antherTheta: theta,
  stigmaTheta: theta,
  ...over,
});
const sitesFor = (flowers) =>
  flowers.map((f, i) => C.siteSet(f, bee, { n: 200, seed: 11 + i }));

// Pearson correlation between the off-diagonal-inclusive entries of two matrices.
function corr(A, B) {
  const xs = [],
    ys = [];
  for (let i = 0; i < A.length; i++)
    for (let j = 0; j < A.length; j++) {
      xs.push(A[i][j]);
      ys.push(B[i][j]);
    }
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let sxy = 0,
    sxx = 0,
    syy = 0;
  for (let i = 0; i < xs.length; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy);
}

// --------------------------------------------------------------------------
// THE LIMIT CHECK
// --------------------------------------------------------------------------

test("at groom=1 the counted transfer reproduces the mean-field overlap", () => {
  const flowers = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 4].map((t) =>
    species(t),
  );
  const sites = sitesFor(flowers);
  const ab = flowers.map(() => 0.25);

  const r = C.runBout(sites, ab, { visits: 40000, seed: 3, groom: 1.0 });
  const counted = C.normaliseRows(r.T);

  // the mean-field matrix the rest of the project uses
  const mean = flowers.map((f, i) => {
    const a = K.sig2D(sites[i].anther.map((h) => ({ s: h.s, phi: h.phi })));
    return flowers.map((g, j) =>
      K.overlap(
        a,
        K.sig2D(sites[j].stigma.map((h) => ({ s: h.s, phi: h.phi }))),
      ),
    );
  });
  const meanNorm = C.normaliseRows(mean.map((row) => Float64Array.from(row)));

  const c = corr(counted, meanNorm);
  assert.ok(
    c > 0.9,
    `counted transfer must track mean-field overlap in the one-chance limit; r=${c.toFixed(3)}`,
  );
});

test("carryover actually carries — grains ride when grooming is low", () => {
  const flowers = [0, Math.PI].map((t) => species(t));
  const sites = sitesFor(flowers);
  const hi = C.runBout(sites, [0.5, 0.5], {
    visits: 20000,
    seed: 4,
    groom: 1.0,
  });
  const lo = C.runBout(sites, [0.5, 0.5], {
    visits: 20000,
    seed: 4,
    groom: 0.1,
  });
  assert.ok(
    C.medianCarry(lo.ageOnDeposit) > C.medianCarry(hi.ageOnDeposit),
    `low grooming should mean older pollen delivered: ${C.medianCarry(lo.ageOnDeposit)} vs ${C.medianCarry(hi.ageOnDeposit)}`,
  );
});

// --------------------------------------------------------------------------
// LAST-MALE ADVANTAGE — an emergent consequence of stacking, so it needs an
// A/B against random removal rather than an assertion that it exists.
// --------------------------------------------------------------------------

test("last-male advantage emerges from stacking, and vanishes without it", () => {
  const flowers = [0, Math.PI / 2].map((t) => species(t));
  const sites = sitesFor(flowers);
  const stacked = C.runBout(sites, [0.5, 0.5], {
    visits: 20000,
    seed: 6,
    groom: 0.1,
    lastMale: true,
  });
  const shuffled = C.runBout(sites, [0.5, 0.5], {
    visits: 20000,
    seed: 6,
    groom: 0.1,
    lastMale: false,
  });
  const a = C.medianCarry(stacked.ageOnDeposit);
  const b = C.medianCarry(shuffled.ageOnDeposit);
  assert.ok(
    a < b,
    `newest-first removal must deliver younger pollen than random removal: ${a} vs ${b}`,
  );
});

// --------------------------------------------------------------------------
// Bookkeeping. A transfer count that does not conserve grains is measuring
// nothing.
// --------------------------------------------------------------------------

test("every grain is accounted for", () => {
  const flowers = [0, Math.PI / 2, Math.PI].map((t) => species(t));
  const r = C.runBout(sitesFor(flowers), [1 / 3, 1 / 3, 1 / 3], {
    visits: 8000,
    seed: 8,
  });
  const out = r.landedRight + r.landedWrong + r.groomedOff + r.retained;
  assert.strictEqual(
    out,
    r.produced,
    `produced ${r.produced} but accounted for ${out}`,
  );
});

test("a stigma never collects pollen the same flower is about to hand it", () => {
  // One species only; if the sweep ran after the load, a plant would collect
  // its own pollen within a single visit and self-transfer would be inflated.
  const r = C.runBout(sitesFor([species(0)]), [1], {
    visits: 4000,
    seed: 9,
    groom: 1.0,
  });
  const minAge = Math.min(...r.ageOnDeposit);
  assert.ok(
    minAge >= 1,
    `a grain was collected on the visit it was deposited (age ${minAge})`,
  );
});

// --------------------------------------------------------------------------
// Geometry still drives it.
// --------------------------------------------------------------------------

test("opposed placement still isolates under carryover", () => {
  const flowers = [species(0), species(Math.PI)];
  const r = C.runBout(sitesFor(flowers), [0.5, 0.5], {
    visits: 20000,
    seed: 12,
    groom: 0.15,
  });
  const N = C.normaliseRows(r.T);
  assert.ok(
    N[0][0] > 0.8 && N[1][1] > 0.8,
    `dorsal and ventral species should mostly deliver to themselves: ` +
      `${N[0][0].toFixed(2)}, ${N[1][1].toFixed(2)}`,
  );
});

test("POSITIVE CONTROL: aligned placement does NOT isolate", () => {
  // Without this the previous test passes on a harness that never mixes.
  const flowers = [species(0), species(0)];
  const r = C.runBout(sitesFor(flowers), [0.5, 0.5], {
    visits: 20000,
    seed: 12,
    groom: 0.15,
  });
  const N = C.normaliseRows(r.T);
  assert.ok(
    N[0][1] > 0.25 && N[1][0] > 0.25,
    `identical placement must leak heavily between species: ${N[0][1].toFixed(2)}, ${N[1][0].toFixed(2)}`,
  );
});

test("the same seed gives the same transfer matrix", () => {
  const flowers = [0, Math.PI / 2].map((t) => species(t));
  const s = sitesFor(flowers);
  const a = C.runBout(s, [0.5, 0.5], { visits: 3000, seed: 21 });
  const b = C.runBout(s, [0.5, 0.5], { visits: 3000, seed: 21 });
  assert.deepStrictEqual([...a.T[0]], [...b.T[0]]);
  assert.deepStrictEqual([...a.T[1]], [...b.T[1]]);
});
