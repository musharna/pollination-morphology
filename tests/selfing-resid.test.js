const test = require("node:test");
const assert = require("node:assert");
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const { selfingFor } = require("../experiments/selfing-arms.js");

/*
 * #63 — residualised selfing assurance.
 *
 * ⚠️ THE TEST #62 DELETED IS THE ONE NOT WRITTEN HERE. #62 shipped a
 * "degenerate case" test that rebuilt the branch's arithmetic in the test body
 * and asserted on the copy, so it passed whatever the real code did. Nothing
 * below recomputes the OLS fit. Every assertion is a CONSEQUENCE that only a
 * genuine residualisation has, or a comparison against another ARM's output.
 *
 * The defining consequence: OLS residuals are exactly Pearson-orthogonal to the
 * regressor, and the "shift" variant is an affine map of the residual, so
 * corr(selfW_shift, received) must be ZERO to floating precision. The dose arm
 * is correlated at ~0.4 and the raw diagonal likewise, so this single number
 * separates a real residualisation from every other shape in the file.
 */

const SITE_N = 160,
  D_EXCL = 8,
  SLICES = 8,
  WIDTH = 0.12,
  VPP = 800,
  N0 = 30;

function oneStep(selfing, seed = 7) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const brng = I.bloomRng(seed);
  const phen = { slices: SLICES, width: WIDTH };
  const opts = {
    ...I.DEFAULTS,
    siteN: SITE_N,
    phenology: phen,
    visitsPerPlant: VPP,
    selfing,
  };
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  assert.ok(built, "founding failed — the fixture is wrong, not the code");
  phen.displayProportionalVisits = false;
  return I.step(built.pop, opts, rng, 0, srng, brng);
}

const sum = (x) => x.reduce((a, b) => a + b, 0);

/* the two halves of the transfer matrix, split exactly as ibm.js:1749-1753 */
function halves(T) {
  const n = T.length;
  const self = new Array(n).fill(0),
    recv = new Array(n).fill(0);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      if (i === j) self[j] += T[i][j];
      else recv[j] += T[i][j];
    }
  return { self, recv };
}

function pearson(a, b) {
  const n = a.length;
  const ma = sum(a) / n,
    mb = sum(b) / n;
  let num = 0,
    da = 0,
    db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da > 0 && db > 0 ? num / Math.sqrt(da * db) : null;
}

/* ------------------------------------------------------------------ C-MATCH */

test("C-match: both residual variants spend the flat floor's exact total", () => {
  for (const rate of [0.25, 1.0, 2.0]) {
    for (const seed of [7, 11, 23]) {
      const flat = oneStep({ rate }, seed);
      const clip = oneStep({ rate, resid: "clip" }, seed);
      const shift = oneStep({ rate, resid: "shift" }, seed);
      const tf = sum(flat.selfW);
      assert.ok(tf > 0, `flat total not positive at rate ${rate}`);
      for (const [name, r] of [
        ["clip", clip],
        ["shift", shift],
      ]) {
        const rel = Math.abs(sum(r.selfW) - tf) / tf;
        assert.ok(
          rel < 1e-12,
          `${name} spends a different total at rate ${rate} seed ${seed}: ` +
            `${sum(r.selfW)} vs flat ${tf} (rel ${rel})`,
        );
      }
    }
  }
});

/* -------------------------------------------------- THE DEFINING CONSEQUENCE */

test("the SHIFT variant's assurance is exactly orthogonal to `received`", () => {
  for (const seed of [7, 11, 23, 41]) {
    const r = oneStep({ rate: 2.0, resid: "shift" }, seed);
    const { recv } = halves(r.T);
    const c = pearson(r.selfW, recv);
    assert.ok(c !== null, `degenerate fixture at seed ${seed}`);
    assert.ok(
      Math.abs(c) < 1e-8,
      `shift assurance still correlates with received at seed ${seed}: ${c}`,
    );
  }
});

test("...and it is orthogonal WITHOUT having become flat or lost the dose", () => {
  /* orthogonality alone is satisfied by a constant vector, which is the flat
   * floor. Pinning BOTH properties is what makes the pair a real test. */
  for (const seed of [7, 11, 23, 41]) {
    const r = oneStep({ rate: 2.0, resid: "shift" }, seed);
    const { self } = halves(r.T);
    assert.ok(
      new Set(r.selfW).size > 1,
      `shift assurance collapsed to a constant at seed ${seed}`,
    );
    const c = pearson(r.selfW, self);
    assert.ok(
      c > 0.3,
      `shift assurance stopped tracking self-pollen at seed ${seed}: ${c}`,
    );
  }
});

test("the CLIP variant reduces the received-correlation the dose arm carries", () => {
  for (const seed of [7, 11, 23, 41]) {
    const dose = oneStep({ rate: 2.0, dose: true }, seed);
    const clip = oneStep({ rate: 2.0, resid: "clip" }, seed);
    const { recv } = halves(dose.T);
    const cDose = Math.abs(pearson(dose.selfW, recv));
    const cClip = Math.abs(pearson(clip.selfW, recv));
    assert.ok(
      cClip < cDose,
      `clip did not reduce the correlation at seed ${seed}: ` +
        `clip ${cClip} vs dose ${cDose}`,
    );
  }
});

/* --------------------------------------------- THE VARIANTS ARE NOT THE SAME */

test("clip and shift are different shapes, and neither is the dose arm", () => {
  const clip = oneStep({ rate: 2.0, resid: "clip" });
  const shift = oneStep({ rate: 2.0, resid: "shift" });
  const dose = oneStep({ rate: 2.0, dose: true });
  const differs = (a, b) => a.some((x, i) => Math.abs(x - b[i]) > 1e-9);
  assert.ok(differs(clip.selfW, shift.selfW), "clip and shift are identical");
  assert.ok(differs(clip.selfW, dose.selfW), "clip is the dose arm");
  assert.ok(differs(shift.selfW, dose.selfW), "shift is the dose arm");
});

test("clip starves far more plants than shift, and shift's minimum is exactly zero", () => {
  for (const seed of [7, 11, 23, 41]) {
    const clip = oneStep({ rate: 2.0, resid: "clip" }, seed);
    const shift = oneStep({ rate: 2.0, resid: "shift" }, seed);
    const zc = clip.selfW.filter((x) => x === 0).length;
    const zs = shift.selfW.filter((x) => x === 0).length;
    assert.ok(
      zc > zs,
      `clip did not starve more than shift at seed ${seed}: ${zc} vs ${zs}`,
    );
    /* shift subtracts the minimum, so exactly the minimum plant lands on zero */
    assert.strictEqual(
      Math.min(...shift.selfW),
      0,
      `shift's minimum is not zero at seed ${seed}`,
    );
  }
});

/* ------------------------------------------------------- DEGENERATE / GUARDS */

test("no residual arm ever emits a negative, NaN or infinite assurance", () => {
  for (const variant of ["clip", "shift"])
    for (const rate of [0.25, 1.0, 2.0])
      for (const seed of [7, 11, 23, 41, 97]) {
        const r = oneStep({ rate, resid: variant }, seed);
        for (const w of r.selfW)
          assert.ok(
            Number.isFinite(w) && w >= 0,
            `${variant} produced ${w} at rate ${rate} seed ${seed}`,
          );
      }
});

test("`always` still overrides the residual arm", () => {
  const r = oneStep({ rate: 2.0, resid: "clip", always: true });
  for (const w of r.selfW) assert.strictEqual(w, 1);
});

test("selfing off still leaves selfW null with the new branch present", () => {
  assert.strictEqual(oneStep(null).selfW, null);
});

/* ------------------------------------------------------------- NAMING SEAM */

test("the arm names parse to the configs the sweep will run", () => {
  assert.deepStrictEqual(selfingFor("R200r"), {
    rate: 2,
    cost: 0,
    resid: "clip",
  });
  assert.deepStrictEqual(selfingFor("R200s"), {
    rate: 2,
    cost: 0,
    resid: "shift",
  });
  assert.deepStrictEqual(selfingFor("R200rn"), {
    rate: 2,
    cost: 0,
    resid: "clip",
    ancNull: true,
  });
  assert.deepStrictEqual(selfingFor("R200c25s"), {
    rate: 2,
    cost: 0.25,
    resid: "shift",
  });
});

test("a name carrying TWO shapes is rejected, not silently resolved to one", () => {
  for (const bad of ["R200dr", "R200rd", "R200rs", "R200sr", "R200ds"])
    assert.strictEqual(selfingFor(bad), null, `${bad} should not parse`);
});

test("the existing arms do not acquire a residual by accident", () => {
  for (const arm of [
    "A",
    "B",
    "S",
    "Sn",
    "R25",
    "R200",
    "R200n",
    "R200c50",
    "R200d",
  ]) {
    const cfg = selfingFor(arm);
    if (cfg) assert.strictEqual(cfg.resid, undefined, `${arm} gained a resid`);
  }
});
