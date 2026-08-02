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

// --------------------------------------------------------------------------
// THE CONTINUOUS METRIC.
//
// Everything above tests the histogram, which is no longer what any headline
// is measured on — sim/ is entirely on kdeOverlap now. Structural properties
// tested only on a retired code path are inert: they would keep passing while
// the live metric broke in exactly the way the histogram already did.
// --------------------------------------------------------------------------

test("SATURATION: overlap keeps resolving below one histogram bin width", () => {
  /* The defect that forced this metric. Two clouds a fixed distance apart,
   * getting tighter: overlap must keep FALLING. The histogram cannot do this —
   * once both clouds fit inside one bin it returns the same number forever, and
   * the packing ceiling it feeds becomes a count of bins rather than a fact
   * about geometry.
   *
   * The histogram is asserted to FAIL here on purpose. A test never seen
   * failing is not known to be able to fail, and this one would otherwise pass
   * on a metric with any resolution floor at all — including a finer-binned
   * histogram, which was the band-aid this replaced. */
  const binW = (1 - K.S_LO) / K.S_BINS;
  const offset = binW / 2;
  /* The ladder stops at binW/8 because that is where the EXPERIMENTS live —
   * evolved precision runs sSd 0.0077-0.0109 against a 0.0556 bin, i.e. binW/5
   * to binW/7. Going further only measures floating-point underflow: at binW/64
   * the clouds are 32 sd apart and the true overlap is ~1e-60, so both metrics
   * return a hard zero and the comparison stops meaning anything. */
  const sds = [binW, binW / 2, binW / 4, binW / 8];

  const kde = sds.map((sd) =>
    K.kdeOverlap(
      K.kdeSig(blob(0.5, 0, sd, 0.3, 11)),
      K.kdeSig(blob(0.5 + offset, 0, sd, 0.3, 12)),
    ),
  );
  for (let i = 1; i < kde.length; i++)
    assert.ok(
      kde[i] < kde[i - 1] - 1e-6,
      `continuous overlap stopped resolving: ${kde.map((v) => v.toFixed(4))}`,
    );
  /* Threshold from theory, not from this output. Two equal-sd gaussians whose
   * centres are d apart have OVL = 2*Phi(-d/2sigma); at binW/8 the separation
   * is 4 sd, giving 0.046. Both clouds share one roll distribution, so the
   * product kernel leaves that unchanged. Asserting < 0.10 is that value with
   * margin — a number calibrated from the measurement it is checking would
   * encode whatever bias the measurement has. */
  assert.ok(
    kde[kde.length - 1] < 0.1,
    `clouds 4 sd apart should overlap ~0.046, got ${kde[kde.length - 1].toFixed(4)}`,
  );

  const hist = sds.map((sd) =>
    K.overlap(
      K.sig2D(blob(0.5, 0, sd, 0.3, 11)),
      K.sig2D(blob(0.5 + offset, 0, sd, 0.3, 12)),
    ),
  );
  assert.ok(
    hist[hist.length - 1] > 0.2,
    `the histogram is supposed to SATURATE here — if it now resolves, this test no longer proves the continuous metric is needed: ${hist.map((v) => v.toFixed(4))}`,
  );
});

test("2-D out-packs 1-D at matched precision ON THE LIVE METRIC", () => {
  const sSd = 0.03,
    phiSd = 0.35,
    tau = 0.2;
  const line = [];
  for (let i = 0; i < 40; i++)
    line.push(K.kdeSig(blob(0.02 + i * 0.024, 0, sSd, phiSd, 200 + i)));
  const surface = [];
  let k = 0;
  for (let i = 0; i < 20; i++)
    for (let j = 0; j < 10; j++)
      surface.push(
        K.kdeSig(
          blob(
            0.02 + i * 0.049,
            -Math.PI + j * ((2 * Math.PI) / 10),
            sSd,
            phiSd,
            300 + k++,
          ),
        ),
      );
  const a = K.packingCeiling(K.kdeOverlapMatrix(line), tau, { seed: 5 }).size;
  const b = K.packingCeiling(K.kdeOverlapMatrix(surface), tau, {
    seed: 5,
  }).size;
  assert.ok(
    b > a * 1.5,
    `2-D should pack substantially more: 1-D ${a} vs 2-D ${b}`,
  );
});

test("PROJECTION still holds continuously: dropping roll cannot lower overlap", () => {
  /* Asserted in kdeSig's own comment, so it needs a measurement. The estimator
   * is a finite-sample approximation of the integral inequality, so single
   * pairs may jitter; the direction is checked in aggregate and no pair may
   * violate it by more than estimator noise. */
  let sum1 = 0,
    sum2 = 0;
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
    const o2 = K.kdeOverlap(K.kdeSig(h1), K.kdeSig(h2));
    const o1 = K.kdeOverlap(
      K.kdeSig(h1, { dims: 1 }),
      K.kdeSig(h2, { dims: 1 }),
    );
    assert.ok(
      o1 >= o2 - 0.05,
      `marginal ${o1.toFixed(4)} well below joint ${o2.toFixed(4)} at i=${i}`,
    );
    sum1 += o1;
    sum2 += o2;
  }
  assert.ok(
    sum1 > sum2,
    `marginalising should raise mean overlap: 1-D ${sum1.toFixed(3)} vs 2-D ${sum2.toFixed(3)}`,
  );
});

test("a 1-D signature cannot be silently compared against a 2-D one", () => {
  const a = K.kdeSig(blob(0.4, 0, 0.04, 0.3, 21));
  const b = K.kdeSig(blob(0.4, 0, 0.04, 0.3, 22), { dims: 1 });
  assert.throws(() => K.kdeOverlap(a, b), /dimension mismatch/);
  assert.ok(
    K.kdeOverlap(a, K.kdeSig(blob(0.4, 0, 0.04, 0.3, 22))) > 0.5,
    "matched dims must still work",
  );
});

test("the histogram metric refuses a continuous signature instead of returning 0", () => {
  /* Feeding a kdeSig to overlap() used to skip the loop and return 0 — "these
   * species do not overlap" — which silently inflates every ceiling downstream
   * and produces a table that looks entirely normal. */
  const k = K.kdeSig(blob(0.4, 0, 0.04, 0.3, 31));
  assert.throws(() => K.overlap(k, k), /continuous/);
  assert.ok(
    K.overlap(
      K.sig2D(blob(0.4, 0, 0.04, 0.3, 31)),
      K.sig2D(blob(0.4, 0, 0.04, 0.3, 31)),
    ) > 0.9,
  );
});

test("the estimator's ASYMMETRIC error shrinks with retained sample size", () => {
  /* KDE_M is the one estimator constant that biases the two arms in OPPOSITE
   * directions — too few points over-state overlap for an irregular cloud and
   * under-state it for a clean gaussian one — so it can decide an L1-vs-L2
   * comparison on its own. Guard the convergence rather than a magic tolerance:
   * a fixed threshold calibrated from these very clouds would encode whatever
   * bias they happen to have. */
  const irregular = (seed) => [
    ...blob(0.35, 0, 0.03, 0.25, seed),
    ...blob(0.55, 1.6, 0.03, 0.25, seed + 1),
  ];
  const gauss = (seed) => blob(0.45, 0.8, 0.06, 0.5, seed);

  const diff = (mk, m) => {
    let d = 0;
    for (let i = 0; i < 6; i++) {
      const a = mk(600 + i * 2),
        b = mk(700 + i * 2);
      d += Math.abs(
        K.kdeOverlap(K.kdeSig(a, { m }), K.kdeSig(b, { m })) -
          K.kdeOverlap(K.kdeSig(a, { m: 384 }), K.kdeSig(b, { m: 384 })),
      );
    }
    return d / 6;
  };
  for (const mk of [irregular, gauss]) {
    const lo = diff(mk, 24),
      hi = diff(mk, 192);
    assert.ok(
      hi < lo,
      `error should fall with M: M=24 ${lo.toFixed(4)} vs M=192 ${hi.toFixed(4)}`,
    );
  }
});
