/*
 * Tests for the forward-cap fix (roadmap item D).
 *
 * THE ARTEFACT. contactSite finds the nearest point on the body CENTRELINE and
 * the centreline stops dead at s=0. An organ sitting deeper in the tube than
 * the animal's head can reach therefore has its nearest centreline point pinned
 * at s=0 no matter where it actually is, so every such morphology collapses
 * onto one coordinate. Measured across six pools, 38.5% of sampled morphologies
 * touch that boundary.
 *
 * WHAT IS AND IS NOT WRONG. The contact TEST is already right: for a capsule
 * with a hemispherical cap at the spine end, surface distance is d - r0, and
 * bodyRadius(bee, 0) is exactly r0. So whether the animal is touched, and how
 * many visits deliver, are correct as they stand. Only the reported (s, phi)
 * LABEL is degenerate. The fix relabels forward contacts onto the cap and
 * changes no geometry — which is why the contact counts below are pinned as
 * regression values.
 *
 * EVERY TEST HERE WAS RUN AGAINST THE PRE-FIX CODE FIRST. The two that detect
 * the artefact fail there (one distinct coordinate, one occupied bin); the
 * positive controls and the regression pins pass there. A test that has not
 * been seen to fail is not evidence.
 */

const test = require("node:test");
const assert = require("node:assert");
const P = require("../sim/placement.js");
const K = require("../sim/packing.js");

const bee = P.DEFAULT_BEE;

/* An organ deeper than the head can reach — the artefact's home. entryDepth is
 * 0.845 here, so an anther at 0.85 sits beyond it on every visit. */
const DEEP = { ...P.DEFAULT_FLOWER, antherT: 0.85 };
/* An organ the body reaches normally — the positive control. */
const SHALLOW = { ...P.DEFAULT_FLOWER, antherT: 0.6 };

const distinctS = (hits) => new Set(hits.map((h) => h.s.toFixed(4))).size;

test("PRECONDITION: the deep organ really is beyond reach, the shallow one is not", () => {
  const depth = P.entryDepth(DEEP, bee);
  assert.ok(
    DEEP.antherT > depth,
    `deep anther ${DEEP.antherT} must sit past entryDepth ${depth.toFixed(3)}`,
  );
  assert.ok(
    SHALLOW.antherT < depth,
    `shallow anther ${SHALLOW.antherT} must sit within entryDepth ${depth.toFixed(3)}`,
  );
});

test("an organ beyond reach resolves to DISTINCT along-body coordinates", () => {
  const d = P.placementDistribution(DEEP, bee, { n: 200, seed: 5 });
  assert.ok(d.hits.length > 50, `need contacts to judge, got ${d.hits.length}`);

  // Pre-fix this is exactly 1: every visit reports s=0.
  assert.ok(
    distinctS(d.hits) > 1,
    `deep organ collapsed to ${distinctS(d.hits)} distinct along-body coordinate(s)`,
  );

  // POSITIVE CONTROL, same test: a reachable organ was never broken and must
  // stay resolved, so a harness that reports "resolved" for everything cannot
  // pass by accident.
  const c = P.placementDistribution(SHALLOW, bee, { n: 200, seed: 5 });
  assert.ok(
    distinctS(c.hits) > 10,
    `reachable organ should be well resolved, got ${distinctS(c.hits)}`,
  );
  assert.ok(
    c.hits.every((h) => h.s > 0),
    "a reachable organ must not be relabelled onto the cap",
  );
});

test("the along-body HISTOGRAM resolves them too, not just the raw coordinate", () => {
  /* This is the one the ablation actually consumes. Resolving the coordinate
   * while the binning still clamps everything into bin 0 would fix nothing. */
  const d = P.placementDistribution(DEEP, bee, { n: 200, seed: 5 });
  const occupied = [...K.sig1D(d.hits)].filter((v) => v > 0).length;
  assert.ok(
    occupied > 1,
    `deep organ occupies ${occupied} along-body bin(s) after binning`,
  );
});

test("REGRESSION: the fix relabels, it must not change whether contact happens", () => {
  /* Pinned against the pre-fix code. The cap relabelling touches no geometry,
   * so any movement here means the fix changed the biology. */
  const d = P.placementDistribution(DEEP, bee, { n: 200, seed: 5 });
  const c = P.placementDistribution(SHALLOW, bee, { n: 200, seed: 5 });
  assert.strictEqual(d.hits.length, 108, "deep-organ contact count changed");
  assert.strictEqual(
    c.hits.length,
    200,
    "reachable-organ contact count changed",
  );
});

test("cap coordinates stay inside the cap", () => {
  const d = P.placementDistribution(DEEP, bee, { n: 200, seed: 5 });
  const capMax = P.bodyRadius(bee, 0) / bee.bodyLen; // forward extent, in body lengths
  for (const h of d.hits) {
    assert.ok(
      h.s <= 0 + 1e-9,
      `forward contact should sit at or ahead of the face, got s=${h.s}`,
    );
    assert.ok(
      h.s >= -capMax - 1e-9,
      `contact ran past the front of the head: s=${h.s} vs cap ${-capMax}`,
    );
  }
});

test("binning s>=0 is a PURE INDEX SHIFT, so unpinned species are untouched", () => {
  /* The extra bins are prepended at the SAME width, so every species that never
   * touches the boundary keeps a numerically identical histogram (shifted) and
   * therefore identical overlaps. Without this the fix would silently move every
   * number in the project, and the before/after comparison would be worthless. */
  const base = K.sBin(0);
  for (let s = 0; s <= 1.0001; s += 0.01) {
    const expected = Math.min(17, Math.floor(s * 18));
    assert.strictEqual(
      K.sBin(Math.min(s, 1)) - base,
      expected,
      `bin width changed at s=${s.toFixed(2)}`,
    );
  }
});

test("two species clear of the boundary overlap EXACTLY as before the fix", () => {
  /* The value is pinned from the pre-fix code. Synthetic blobs well inside
   * [0,1] cannot touch the cap, so their overlap must be bit-identical. */
  const a = K.sig2D(K.syntheticHits(0.4, 0, 0.05, 0.3, { n: 400, seed: 11 }));
  const b = K.sig2D(K.syntheticHits(0.55, 0, 0.05, 0.3, { n: 400, seed: 12 }));
  assert.strictEqual(K.overlap(a, b).toFixed(6), "0.170000");
});
