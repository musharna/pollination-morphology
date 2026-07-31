/*
 * Assertions written as a-priori predictions BEFORE running, so they can
 * fail. Each one states what the geometry must do if the model is right.
 */

const test = require("node:test");
const assert = require("node:assert");
const P = require("../sim/placement.js");

const flower = (over = {}) => ({ ...P.DEFAULT_FLOWER, ...over });
const bee = P.DEFAULT_BEE;

// --------------------------------------------------------------------------
// PREDICTION 1. Nototribic vs sternotribic is not a setting anywhere in the
// code. It must fall out of where the anther sits relative to the platform.
// --------------------------------------------------------------------------

test("a dorsal anther places pollen on the animal's back", () => {
  const d = P.placementDistribution(flower({ antherTheta: 0 }), bee, {
    seed: 7,
  });
  assert.ok(d.contactRate > 0.5, `expected contact, got ${d.contactRate}`);
  const dorsal =
    d.hits.filter((h) => h.face === "dorsal").length / d.hits.length;
  assert.ok(
    dorsal > 0.8,
    `expected mostly dorsal contact, got ${dorsal.toFixed(2)}`,
  );
});

test("a ventral anther places pollen on the animal's underside", () => {
  const d = P.placementDistribution(flower({ antherTheta: Math.PI }), bee, {
    seed: 7,
  });
  assert.ok(d.contactRate > 0.5, `expected contact, got ${d.contactRate}`);
  const ventral =
    d.hits.filter((h) => h.face === "ventral").length / d.hits.length;
  assert.ok(
    ventral > 0.8,
    `expected mostly ventral contact, got ${ventral.toFixed(2)}`,
  );
});

// --------------------------------------------------------------------------
// PREDICTION 2. THE REVEAL. Two species sharing one pollinator, differing in
// nothing but where the anther sits, place pollen on disjoint body regions
// and therefore cannot pollinate each other. Moving one anther restores it.
//
// Negative and positive control live in the SAME test: a broken harness that
// always returns ~0 overlap would pass the isolation half alone.
// --------------------------------------------------------------------------

test("opposed anthers isolate; aligned anthers do not", () => {
  const a = P.placementDistribution(flower({ antherTheta: 0 }), bee, {
    seed: 11,
  });
  const bOpposed = P.placementDistribution(
    flower({ antherTheta: Math.PI }),
    bee,
    { seed: 11 },
  );
  const bAligned = P.placementDistribution(flower({ antherTheta: 0 }), bee, {
    seed: 12,
  });

  const isolated = P.placementOverlap(a, bOpposed);
  const shared = P.placementOverlap(a, bAligned);

  assert.ok(
    isolated < 0.15,
    `opposed anthers should barely overlap, got ${isolated.toFixed(3)}`,
  );
  assert.ok(
    shared > 0.7,
    `aligned anthers should overlap heavily, got ${shared.toFixed(3)}`,
  );
  assert.ok(
    shared > isolated * 4,
    "the two regimes must be far apart, not adjacent",
  );
});

test("overlap rises monotonically as one anther is rotated onto the other", () => {
  const a = P.placementDistribution(flower({ antherTheta: 0 }), bee, {
    seed: 11,
  });
  const series = [Math.PI, (3 * Math.PI) / 4, Math.PI / 2, Math.PI / 4, 0].map(
    (th) =>
      P.placementOverlap(
        a,
        P.placementDistribution(flower({ antherTheta: th }), bee, { seed: 11 }),
      ),
  );
  for (let i = 1; i < series.length; i++) {
    assert.ok(
      series[i] >= series[i - 1] - 0.03,
      `overlap should not fall as anthers align: ${series.map((v) => v.toFixed(2)).join(" -> ")}`,
    );
  }
  assert.ok(
    series[4] - series[0] > 0.6,
    "the swing must be large enough to see",
  );
});

// --------------------------------------------------------------------------
// PREDICTION 3. Depth is geometry. A narrower throat stops the animal sooner,
// and an anther beyond its reach is never touched.
// --------------------------------------------------------------------------

test("a narrower throat admits the animal less deeply", () => {
  const wide = P.entryDepth(flower({ throatR: 0.5 }), bee);
  const narrow = P.entryDepth(flower({ throatR: 0.2 }), bee);
  assert.ok(
    narrow < wide,
    `narrow ${narrow} should be shallower than wide ${wide}`,
  );
});

test("an anther deeper than the animal can reach is never contacted", () => {
  const f = flower({ antherT: 0.95, throatR: 0.12 });
  const d = P.placementDistribution(f, bee, { seed: 3 });
  assert.strictEqual(
    d.hits.length,
    0,
    `expected no contact, got ${d.hits.length}`,
  );
});

// --------------------------------------------------------------------------
// PREDICTION 4. Placement is never a gene (groundwork §4.5). The only way to
// move a placement site is to change a shape parameter.
// --------------------------------------------------------------------------

const meanS = (d) => d.hits.reduce((acc, h) => acc + h.s, 0) / d.hits.length;

test("a bigger animal is touched at a different point on its body", () => {
  // The flower does not change at all. Only the visitor does.
  const f = flower();
  const a = P.placementDistribution(f, { ...bee, bodyLen: 1.5 }, { seed: 5 });
  const b = P.placementDistribution(f, { ...bee, bodyLen: 2.1 }, { seed: 5 });
  assert.ok(a.hits.length > 0 && b.hits.length > 0, "both must make contact");
  assert.ok(
    Math.abs(meanS(a) - meanS(b)) > 0.04,
    `site should move along the body: ${meanS(a).toFixed(3)} vs ${meanS(b).toFixed(3)}`,
  );
});

// Circular spread of the placement site around the animal's body.
const phiSpread = (d) => {
  const c = d.hits.reduce((a, h) => a + Math.cos(h.phi), 0) / d.hits.length;
  const s = d.hits.reduce((a, h) => a + Math.sin(h.phi), 0) / d.hits.length;
  return 1 - Math.sqrt(c * c + s * s); // 0 = perfectly repeatable, 1 = smeared
};

test("symmetry controls PRECISION, not mean position", () => {
  // antherT and antherTheta are held fixed; only the latent polarity moves.
  // A radial flower can be entered at any roll, so pollen smears around the
  // body; a bilateral one with a platform fixes it. Armbruster's precision.
  const radial = P.placementDistribution(flower({ polarity: 0.08 }), bee, {
    seed: 5,
  });
  const bilateral = P.placementDistribution(flower({ polarity: 0.85 }), bee, {
    seed: 5,
  });
  assert.ok(
    radial.hits.length > 0 && bilateral.hits.length > 0,
    "both must make contact",
  );
  assert.ok(
    phiSpread(bilateral) < phiSpread(radial) - 0.1,
    `bilateral should be tighter: ${phiSpread(bilateral).toFixed(3)} vs radial ${phiSpread(radial).toFixed(3)}`,
  );
});

test("a tube too wide for the visitor places no pollen at all", () => {
  // Why open bowl flowers place pollen diffusely and tubes place it precisely.
  const snug = P.placementDistribution(flower({ throatR: 0.34 }), bee, {
    seed: 5,
  });
  const roomy = P.placementDistribution(
    flower({ throatR: 0.62, mouthR: 0.95 }),
    bee,
    { seed: 5 },
  );
  assert.ok(
    snug.contactRate > 0.5,
    `snug tube should contact: ${snug.contactRate}`,
  );
  assert.ok(
    roomy.contactRate < 0.1,
    `roomy tube should miss: ${roomy.contactRate}`,
  );
});

test("the CYCLOIDEA-like polarity term moves three traits at once", () => {
  const lo = P.polarityTraits(flower({ polarity: 0.1 }));
  const hi = P.polarityTraits(flower({ polarity: 0.9 }));
  assert.ok(hi.zygomorphy > lo.zygomorphy);
  assert.ok(hi.platformLen > lo.platformLen);
  assert.ok(hi.platformAngle > lo.platformAngle);
});

// --------------------------------------------------------------------------
// PREDICTION 5. Determinism (groundwork §5.4).
// --------------------------------------------------------------------------

test("the same seed gives byte-identical placement", () => {
  const a = P.placementDistribution(flower(), bee, { seed: 42 });
  const b = P.placementDistribution(flower(), bee, { seed: 42 });
  assert.deepStrictEqual(a.hits, b.hits);
});

test("different seeds give different jitter but the same regime", () => {
  const a = P.placementDistribution(flower(), bee, { seed: 1 });
  const b = P.placementDistribution(flower(), bee, { seed: 2 });
  assert.notDeepStrictEqual(a.hits, b.hits);
  assert.ok(
    P.placementOverlap(a, b) > 0.7,
    "same flower, different seed, should still agree",
  );
});
