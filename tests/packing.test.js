/*
 * Tests for the packing harness ITSELF, before it is used to judge the
 * ablation. An inert harness returns "no difference between arms", which reads
 * exactly like "the third dimension is decorative" — the conclusion the
 * ablation is meant to be able to reach honestly. So the harness has to be
 * shown capable of detecting a difference when one is definitely there
 * (positive control) and of returning 1 when there is definitely none
 * (negative control) before any arm result means anything.
 */

const test = require("node:test");
const assert = require("node:assert");
const K = require("../sim/packing.js");

const blob = (s, phi, sSd, phiSd, seed) =>
  K.syntheticHits(s, phi, sSd, phiSd, { n: 400, seed });

// --------------------------------------------------------------------------
// The packer must be able to return both extremes.
// --------------------------------------------------------------------------

test("NEGATIVE CONTROL: identical species pack to exactly one", () => {
  const sigs = [1, 2, 3, 4, 5].map(() => K.sig2D(blob(0.5, 0, 0.02, 0.2, 9)));
  const { size } = K.packingCeiling(K.overlapMatrix(sigs), 0.3, { seed: 4 });
  assert.strictEqual(
    size,
    1,
    "five copies of one species cannot coexist as more than one",
  );
});

test("POSITIVE CONTROL: fully disjoint species all coexist", () => {
  const sigs = [0.1, 0.3, 0.5, 0.7, 0.9].map((s) =>
    K.sig2D(blob(s, 0, 0.005, 0.05, 3)),
  );
  const { size } = K.packingCeiling(K.overlapMatrix(sigs), 0.3, { seed: 4 });
  assert.strictEqual(size, 5, "well-separated species should all pack");
});

test("the ceiling never falls as the isolation threshold is relaxed", () => {
  const sigs = [];
  for (let i = 0; i < 12; i++)
    sigs.push(K.sig2D(blob(0.2 + i * 0.05, 0, 0.04, 0.3, 100 + i)));
  const mat = K.overlapMatrix(sigs);
  let prev = 0;
  for (const tau of [0.0, 0.1, 0.2, 0.4, 0.6, 0.9]) {
    const { size } = K.packingCeiling(mat, tau, { seed: 7 });
    assert.ok(
      size >= prev,
      `ceiling fell from ${prev} to ${size} when tau rose to ${tau}`,
    );
    prev = size;
  }
});

// --------------------------------------------------------------------------
// THE LOAD-BEARING POSITIVE CONTROL. If a genuinely 2-D placement space at
// matched precision does NOT out-pack a 1-D one here, the harness cannot see
// dimensionality and every arm result downstream is meaningless.
// --------------------------------------------------------------------------

test("an ideal 2-D surface out-packs an ideal 1-D axis at MATCHED precision", () => {
  const sSd = 0.03;
  const phiSd = 0.35;
  const tau = 0.2;

  // 1-D: species may only differ in position along the body.
  const line = [];
  for (let i = 0; i < 40; i++)
    line.push(K.sig2D(blob(0.02 + i * 0.024, 0, sSd, phiSd, 200 + i)));

  // 2-D: same precision, same body, but roll is also available.
  const surface = [];
  let k = 0;
  for (let i = 0; i < 20; i++)
    for (let j = 0; j < 10; j++)
      surface.push(
        K.sig2D(
          blob(
            0.02 + i * 0.049,
            -Math.PI + j * ((2 * Math.PI) / 10),
            sSd,
            phiSd,
            300 + k++,
          ),
        ),
      );

  const a = K.packingCeiling(K.overlapMatrix(line), tau, { seed: 5 }).size;
  const b = K.packingCeiling(K.overlapMatrix(surface), tau, { seed: 5 }).size;
  assert.ok(
    b > a * 1.5,
    `2-D should pack substantially more at matched precision: 1-D ${a} vs 2-D ${b}`,
  );
});

// --------------------------------------------------------------------------
// The projection claim asserted in packing.js's own comment. If this is false,
// the framing of the whole ablation is wrong and L1-strict is not a valid
// lower arm.
// --------------------------------------------------------------------------

test("discarding roll can only INCREASE overlap, never decrease it", () => {
  let checked = 0;
  for (let i = 0; i < 30; i++) {
    const h1 = blob(
      0.3 + (i % 5) * 0.08,
      -1 + (i % 7) * 0.4,
      0.05,
      0.4,
      500 + i,
    );
    const h2 = blob(
      0.3 + (i % 3) * 0.1,
      -1 + (i % 4) * 0.5,
      0.05,
      0.4,
      900 + i,
    );
    const o2 = K.overlap(K.sig2D(h1), K.sig2D(h2));
    const o1 = K.overlap(K.sig1D(h1), K.sig1D(h2));
    assert.ok(
      o1 >= o2 - 1e-9,
      `marginal overlap ${o1.toFixed(4)} < joint ${o2.toFixed(4)} at i=${i}`,
    );
    checked++;
  }
  assert.strictEqual(checked, 30);
});

test("sig1D is exactly the marginal of sig2D", () => {
  const h = blob(0.4, 0.6, 0.06, 0.5, 77);
  const j = K.sig2D(h);
  const m = K.sig1D(h);
  for (let s = 0; s < K.S_BINS; s++) {
    let sum = 0;
    for (let p = 0; p < K.PHI_BINS; p++) sum += j[s * K.PHI_BINS + p];
    assert.ok(
      Math.abs(sum - m[s]) < 1e-9,
      `bin ${s}: marginal ${m[s]} != summed joint ${sum}`,
    );
  }
});

// --------------------------------------------------------------------------
// Determinism and precision measurement.
// --------------------------------------------------------------------------

test("the same seed gives the same ceiling", () => {
  const sigs = [];
  for (let i = 0; i < 15; i++)
    sigs.push(K.sig2D(blob(0.2 + i * 0.04, i * 0.3, 0.04, 0.3, 400 + i)));
  const mat = K.overlapMatrix(sigs);
  const a = K.packingCeiling(mat, 0.25, { seed: 12 });
  const b = K.packingCeiling(mat, 0.25, { seed: 12 });
  assert.deepStrictEqual(a.members, b.members);
});

test("measured spread recovers the spread it was generated with", () => {
  const h = blob(0.5, 0, 0.05, 0.4, 31);
  assert.ok(
    Math.abs(K.sSpread(h) - 0.05) < 0.012,
    `s spread ${K.sSpread(h).toFixed(4)} should recover 0.05`,
  );
  assert.ok(
    Math.abs(K.phiSpread(h) - 0.4) < 0.08,
    `phi spread ${K.phiSpread(h).toFixed(4)} should recover 0.4`,
  );
});
