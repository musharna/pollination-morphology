/*
 * Negative controls for the two split statistics.
 *
 * ⚠️⚠️ `separation` IS A RATIO, UNBOUNDED IN ITS DENOMINATOR, AND THE ONLY TEST
 * IT HAD ASKED IT TO BEAT ONE CLOUD (tests/ibm.test.js, "two clouds score far
 * above one"). That assertion passes for a statistic that is also inflated
 * arbitrarily by a tight majority and nearly blind to how lopsided the split is
 * — which is what it turned out to be. Measured on the live function before the
 * new fields were added (_scratch/sep-probe.js, 40 points):
 *
 *   genuine balanced split          sep   222.6   minorityFrac 0.500
 *   ONE OUTLIER, ordinary core      sep    97.4   minorityFrac 0.025
 *   ONE OUTLIER, core 100x tighter  sep  9443.6   minorityFrac 0.025
 *   fixation (all points identical) sep     0.0   minorityFrac 0.000
 *   unbalanced 90/10                sep   204.9   minorityFrac 0.100
 *
 * Two things follow, and each gets a control here. Tightening the majority and
 * changing nothing else about the split moves the number ~97x, so separations
 * from different runs are not comparable unless their denominators are. And
 * 90/10 scores within 8% of a balanced split, so the ratio cannot see the one
 * thing the word "split" is supposed to mean — while minorityFrac reads 0.100
 * against 0.500 and separates them at a glance.
 *
 * ⚠️ NOTE ON A CLAIM THAT DID NOT REPRODUCE. The defect was recorded as "one
 * outlier scores 248 against 196 for a genuine balanced split". At the geometry
 * probed here the plain outlier scores BELOW a real split (97.4 vs 222.6), so
 * whether an outlier outscores a split is configuration-specific rather than
 * general. The tightened-core case (9443.6) settles the same point without
 * depending on the configuration, so that is what the control below asserts.
 */

const test = require("node:test");
const assert = require("node:assert");
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");

const cloudPair = (rng, jitter) => {
  const pts = [];
  for (let i = 0; i < 40; i++)
    pts.push(
      i % 2
        ? {
            s: 0.2 + jitter * (rng() - 0.5),
            phi: -2 + 5 * jitter * (rng() - 0.5),
          }
        : {
            s: 0.8 + jitter * (rng() - 0.5),
            phi: 2 + 5 * jitter * (rng() - 0.5),
          },
    );
  return pts;
};

const oneOutlier = (jit) => {
  const rng = E.makeRng(11);
  const pts = [];
  for (let i = 0; i < 39; i++)
    pts.push({ s: 0.5 + jit * (rng() - 0.5), phi: 5 * jit * (rng() - 0.5) });
  pts.push({ s: 0.9, phi: 3.0 });
  return pts;
};

/* ------------------------------------------------------------ the outlier */

test("a lone outlier is not a split, and minorityFrac is what says so", () => {
  const r = I.twoClusterSeparation(oneOutlier(0.02));
  assert.ok(r, "statistic returned null on a populated cloud");
  assert.deepStrictEqual(
    r.sizes.slice().sort((a, b) => a - b),
    [1, 39],
    "the split was not 1-against-the-rest, so this is not the case under test",
  );
  assert.ok(
    r.minorityFrac < 0.05,
    `one outlier must report a tiny minority, got ${r.minorityFrac}`,
  );
  /* the point of the control: separation alone does NOT refuse this */
  assert.ok(
    r.separation > 10,
    "if separation ever stops scoring a lone outlier highly, this control has " +
      "stopped testing anything and minorityFrac's job has changed",
  );
});

/* ------------------------------------------------- the unbounded denominator */

test("separation is inflated by tightening the majority, and dispersion shows it", () => {
  /* identical geometry, identical outlier; ONLY the core's scale differs */
  const loose = I.twoClusterSeparation(oneOutlier(0.02));
  const tight = I.twoClusterSeparation(oneOutlier(0.0002));
  assert.ok(
    tight.separation > 10 * loose.separation,
    `tightening the core should inflate separation: ${loose.separation} -> ${tight.separation}`,
  );
  /* the numerator did not move, so the ratio moved entirely on its denominator */
  assert.ok(
    Math.abs(tight.gap - loose.gap) / loose.gap < 0.05,
    `gap should be ~unchanged: ${loose.gap} vs ${tight.gap}`,
  );
  assert.ok(
    tight.dispersion < loose.dispersion / 10,
    `dispersion should carry the whole change: ${loose.dispersion} vs ${tight.dispersion}`,
  );
  /* and the reported parts must reconstruct the whole, or they are decoration */
  for (const r of [loose, tight])
    assert.ok(
      Math.abs(r.separation - r.gap / r.dispersion) < 1e-9,
      "separation is not gap/dispersion — the reported parts do not make the whole",
    );
});

/* -------------------------------------------------------------- lopsidedness */

test("a lopsided split reports a small minority", () => {
  const rng = E.makeRng(3);
  const balanced = cloudPair(rng, 0.01);
  const lop = [];
  for (let i = 0; i < 40; i++)
    lop.push(
      i < 36
        ? { s: 0.2 + 0.01 * (rng() - 0.5), phi: -2 + 0.05 * (rng() - 0.5) }
        : { s: 0.8 + 0.01 * (rng() - 0.5), phi: 2 + 0.05 * (rng() - 0.5) },
    );
  const b = I.twoClusterSeparation(balanced);
  const l = I.twoClusterSeparation(lop);
  assert.ok(b && l, "statistic returned null on a populated cloud");
  assert.ok(
    l.minorityFrac < 0.2 && b.minorityFrac > 0.4,
    `minorityFrac must separate 90/10 from 50/50: ${l.minorityFrac} vs ${b.minorityFrac}`,
  );
});

/* ------------------------------------------------------------------ fixation */

test("fixation reports no split rather than a large or undefined one", () => {
  const same = new Array(40).fill({ s: 0.4, phi: 0.3 });
  const r = I.twoClusterSeparation(same);
  assert.ok(r, "statistic returned null on a populated cloud");
  assert.strictEqual(r.separation, 0, "identical points reported a separation");
  assert.ok(
    Number.isFinite(r.separation),
    "a zero denominator produced a non-finite separation",
  );
  assert.strictEqual(r.dispersion, 0);
});

/* ------------------------------------------------------ the two axes agree */

test("both split statistics report the same fields", () => {
  /* ringSeparation is documented as "the SAME statistic on the advertisement
   * axis", so a caller reading gap/dispersion off one must be able to read them
   * off the other. It already carried `gap` while twoClusterSeparation did not,
   * which is how the two drifted apart in the first place. */
  const rng = E.makeRng(5);
  const a = I.twoClusterSeparation(cloudPair(rng, 0.01));
  const sigs = [];
  for (let i = 0; i < 40; i++) sigs.push(i % 2 ? 0.1 : 0.6);
  const b = I.ringSeparation(sigs);
  assert.ok(a && b, "one of the two statistics returned null");
  assert.deepStrictEqual(
    Object.keys(a).sort(),
    Object.keys(b).sort(),
    "the two axes report different fields",
  );
});
