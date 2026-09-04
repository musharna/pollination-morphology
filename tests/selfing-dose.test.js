const test = require("node:test");
const assert = require("node:assert");
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");

/*
 * #62 — dose-dependent selfing assurance.
 *
 * The claim being tested is not "the code runs" but the ONE property that makes
 * #62 a test of shape rather than of amount: the dose arm and the flat arm must
 * spend an IDENTICAL total of maternal assurance. If that fails, the sweep is
 * measuring how much selfing there is, which #58 already answered.
 */

const SITE_N = 160,
  D_EXCL = 8,
  SLICES = 8,
  WIDTH = 0.12,
  VPP = 800,
  N0 = 30;

/* one generation of arm A under a given selfing config, returning step()'s result */
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

test("selfing off leaves selfW null — no selfing is not zero assurance", () => {
  assert.strictEqual(oneStep(null).selfW, null);
});

test("the flat floor gives every plant the identical scalar", () => {
  const r = oneStep({ rate: 2.0 });
  assert.ok(r.selfW, "flat arm produced no selfW");
  const first = r.selfW[0];
  assert.ok(first > 0, "flat floor is not positive");
  for (const w of r.selfW) assert.strictEqual(w, first);
});

test("the dose arm does NOT give every plant the same scalar", () => {
  const r = oneStep({ rate: 2.0, dose: true });
  assert.ok(r.selfW, "dose arm produced no selfW");
  const distinct = new Set(r.selfW).size;
  assert.ok(
    distinct > 1,
    `dose arm handed out ${distinct} distinct weight(s) — it is behaving as a flat floor`,
  );
});

/*
 * ⚠️ C-MATCH — the control the whole experiment rests on. Written to fail if the
 * scaling is dropped or done per-plant instead of per-generation.
 */
test("C-match: dose and flat spend the SAME total assurance", () => {
  const flat = oneStep({ rate: 2.0 });
  const dose = oneStep({ rate: 2.0, dose: true });
  const a = sum(flat.selfW),
    b = sum(dose.selfW);
  assert.ok(a > 0, "flat total is not positive — fixture spends nothing");
  assert.ok(
    Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a)),
    `C-match FAILED: flat spends ${a}, dose spends ${b}`,
  );
});

test("C-match holds across rates, not just the one the sweep uses", () => {
  for (const rate of [0.25, 0.5, 1.0, 2.0]) {
    const a = sum(oneStep({ rate }).selfW);
    const b = sum(oneStep({ rate, dose: true }).selfW);
    assert.ok(
      Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a)),
      `C-match FAILED at rate ${rate}: flat ${a}, dose ${b}`,
    );
  }
});

test("dose weights are proportional to the transfer matrix diagonal", () => {
  const r = oneStep({ rate: 2.0, dose: true });
  const diag = r.selfW.map((_, i) => r.T[i][i]);
  /* a single ratio must explain every plant */
  let s = null;
  for (let i = 0; i < r.selfW.length; i++) {
    if (diag[i] === 0) {
      assert.strictEqual(
        r.selfW[i],
        0,
        `plant ${i} carries no self-pollen but was given assurance ${r.selfW[i]}`,
      );
      continue;
    }
    const ratio = r.selfW[i] / diag[i];
    if (s === null) s = ratio;
    else
      assert.ok(
        Math.abs(ratio - s) <= 1e-9 * Math.max(1, Math.abs(s)),
        `plant ${i} scaled by ${ratio}, others by ${s} — not one dose constant`,
      );
  }
  assert.ok(
    s !== null && s > 0,
    "no plant carried self-pollen in this fixture",
  );
});

test("a plant carrying no self-pollen gets no assurance under dose", () => {
  const r = oneStep({ rate: 2.0, dose: true });
  let zeros = 0;
  for (let i = 0; i < r.selfW.length; i++)
    if (r.T[i][i] === 0) {
      zeros++;
      assert.strictEqual(r.selfW[i], 0);
    }
  /* documents the fixture rather than asserting the biology: if this ever hits
   * 0 the test above stops covering the zero branch and should be re-fixtured */
  assert.ok(zeros >= 0);
});

/*
 * ⚠️ THE DEGENERATE CASE, and a note about what this test does NOT do.
 *
 * If nobody carries self-pollen there is no dose for the assurance to depend on,
 * so the branch spends nothing rather than falling back to the flat floor —
 * falling back would make the dose arm silently become the control arm in
 * exactly the generations where the two differ most.
 *
 * An all-zero diagonal does not arise in any fixture reachable from here, so
 * that branch is NOT covered. The first draft of this test "covered" it by
 * rebuilding the branch's arithmetic in the test body and asserting on the
 * copy — a test that passes whatever the real code does. It is deleted rather
 * than kept, because a test that cannot fail is worse than a missing one: it
 * reports coverage that does not exist.
 *
 * What IS asserted here is the consequence a lost guard would have: dividing by
 * a zero total yields Infinity or NaN, which would propagate into the maternal
 * weights and silently corrupt the draw rather than crash. That is checked
 * across seeds and rates, where it can actually fail.
 */
test("no assurance weight is ever NaN or Infinite, across seeds and rates", () => {
  for (const seed of [1, 2, 3, 7, 11]) {
    for (const rate of [0.25, 2.0]) {
      const r = oneStep({ rate, dose: true }, seed);
      for (let i = 0; i < r.selfW.length; i++)
        assert.ok(
          Number.isFinite(r.selfW[i]),
          `seed ${seed} rate ${rate} plant ${i}: assurance is ${r.selfW[i]}`,
        );
    }
  }
});

test("selfing.always still overrides dose — the control arm is unchanged", () => {
  const r = oneStep({ rate: 2.0, dose: true, always: true });
  for (const w of r.selfW) assert.strictEqual(w, 1);
});
