/*
 * sim/paired-stats.js — the paired-difference machinery that three experiments
 * now share instead of each carrying a copy (task #43).
 *
 * ⚠️ THE POINT OF SINGLE-SOURCING IS THAT THE CORRECTION TRAVELS. `degenerate`
 * was wrong once: it asked whether the STATISTIC was constant when the object
 * the bootstrap resamples is the DIFFERENCE. Two copies existed, so the fix had
 * to be applied twice and the second was a port rather than a derivation. These
 * tests pin the corrected behaviour, and the first of them reconstructs the
 * SUPERSEDED predicate and shows it giving the wrong answer on the same input —
 * so the test is demonstrably capable of telling the two apart rather than
 * merely agreeing with whatever is currently in the file.
 */

const test = require("node:test");
const assert = require("node:assert");

const S = require("../sim/paired-stats.js");

/* fate rows shaped like the ones the experiments actually build */
const rows = (fates) => fates.map((f, i) => ({ seed: i + 1, fate: f }));
const HELD = (rs) => rs.filter((r) => r.fate === "HELD").length / rs.length;

/* --------------- 1. THE CASE A STATISTIC-BASED GUARD WALKS STRAIGHT PAST */

test("degenerate catches a constant DIFFERENCE even when the statistic varies", () => {
  /* Both arms score HELD on exactly the same seeds. HELD is 0.5 in each and is
   * not constant across seeds in either — but every paired difference is 0, so
   * the bootstrap collapses to [0.000, 0.000]. */
  const a = rows(["HELD", "FUSED", "HELD", "FUSED"]);
  const b = rows(["HELD", "FUSED", "HELD", "FUSED"]);

  assert.strictEqual(
    S.degenerate(a, b, HELD),
    true,
    "the corrected predicate missed a constant difference vector",
  );

  /* the superseded predicate, reconstructed: it asked whether the STATISTIC was
   * constant across the seeds of each arm */
  const supersededDegenerate = (x, y, statOf) => {
    const sx = x.map((r) => statOf([r]));
    const sy = y.map((r) => statOf([r]));
    return sx.every((v) => v === sx[0]) && sy.every((v) => v === sy[0]);
  };
  assert.strictEqual(
    supersededDegenerate(a, b, HELD),
    false,
    "the superseded predicate was expected to MISS this case — if it now catches it, " +
      "this test no longer demonstrates the difference between the two and proves nothing",
  );

  /* and the interval really does collapse, so the guard is guarding something */
  const ci = S.pairedCI(a, b, HELD);
  assert.strictEqual(ci.lo, 0);
  assert.strictEqual(ci.hi, 0);
});

/* ------------------------------- 2. AND IT MUST NOT FIRE ON REAL VARIATION */

test("degenerate does not fire when the paired differences actually vary", () => {
  const a = rows(["HELD", "HELD", "FUSED", "HELD"]);
  const b = rows(["FUSED", "HELD", "FUSED", "FUSED"]);
  assert.strictEqual(
    S.degenerate(a, b, HELD),
    false,
    "a varying difference vector was reported degenerate — every real contrast " +
      "would be suppressed and the experiment would print bounds instead of intervals",
  );
  const ci = S.pairedCI(a, b, HELD);
  assert.ok(
    ci.hi > ci.lo,
    "a non-degenerate bootstrap produced a zero-width interval",
  );
});

/* ---------------------------------------- 3. t IS NOT z, AND NOT SILENTLY */

test("interval reports Student's t wider than the normal approximation", () => {
  const d = [-1, 0, 1, 2, -2, 3, 1, 0];
  const ci = S.interval(d);
  assert.strictEqual(ci.n, 8);
  const tw = ci.t[1] - ci.t[0];
  const zw = ci.z[1] - ci.z[0];
  assert.ok(tw > zw, "the t interval was not wider than z at n=8");
  /* t(df=7)=2.364624 against z=1.959964 — the ratio the v2 correction turned on.
   * Compared against the TABULATED constant, which is an independent source,
   * at the precision the table is quoted to. */
  assert.ok(
    Math.abs(tw / zw - 2.364624 / 1.959964) < 1e-6,
    `t/z width ratio was ${(tw / zw).toFixed(6)}, not the tabulated 1.206462`,
  );
});

/*
 * ⚠️ REWRITTEN, NOT WEAKENED. This pair used to assert that `interval` THROWS
 * past df=15, because the critical values were a fifteen-row table and the end
 * of the table was the only thing standing between the caller and a silent
 * normal approximation. The table is now a solver, so there is no end to fall
 * off — and asserting the old throw would be asserting that the module still has
 * the limitation, not that it still has the protection.
 *
 * The protection is what gets asserted: at EVERY n, the interval reported is a t
 * interval and not a z one. That is the invariant the original test was reaching
 * for through the only handle it had. It now holds where the old guard was blind
 * — past df=15, which is exactly where the historical bug lived.
 */
test("interval never silently degrades to a normal approximation, at any n", () => {
  for (const n of [2, 3, 8, 16, 17, 30, 64, 200, 1000]) {
    const d = new Array(n).fill(0).map((_, i) => (i % 5) - 2);
    const ci = S.interval(d);
    const tw = ci.t[1] - ci.t[0];
    const zw = ci.z[1] - ci.z[0];
    assert.ok(tw > zw, `n=${n}: t interval was not wider than z`);
    const mult = (ci.t[1] - ci.mean) / ci.se;
    assert.ok(
      Math.abs(mult - S.tCrit(n - 1)) < 1e-12,
      `n=${n}: multiplier ${mult} is not t(df=${n - 1})`,
    );
    assert.ok(mult > S.Z_CRIT, `n=${n}: multiplier fell to z`);
  }
});

test("interval refuses an n it cannot serve rather than approximating", () => {
  /* n<2 has no variance to report and must not come back with an interval */
  for (const n of [0, 1]) {
    const ci = S.interval(new Array(n).fill(1));
    assert.ok(!ci.t, `n=${n} returned an interval`);
    assert.ok(Number.isNaN(ci.sd), `n=${n} reported an sd`);
  }
});

test("interval flags a zero-width difference vector as degenerate", () => {
  const ci = S.interval([2, 2, 2, 2]);
  assert.strictEqual(ci.degenerate, true);
  assert.strictEqual(ci.t[0], ci.t[1]);
  assert.strictEqual(
    S.interval([2, 2, 3, 2]).degenerate,
    false,
    "a varying difference vector was flagged degenerate",
  );
});

/* -------------------------------------------- 4. THE EXACT BINOMIAL BOUNDS */

test("the exact bounds are the ones the experiments quote", () => {
  /* k = 0 of 30 at alpha = 0.05 solves (1-p)^30 = 0.05 -> 9.50% */
  assert.ok(Math.abs(S.zeroUpper(30) - 0.09503) < 1e-5);
  assert.ok(Math.abs(S.allLower(30) - 0.90497) < 1e-5);
  assert.ok(
    S.zeroUpper(3) > S.zeroUpper(30),
    "the bound must loosen at small n — that is the whole reason it replaces " +
      "a degenerate interval, which does not",
  );
});

/* ------------------- 5. THE THREE CONSUMERS SEE THE SAME OBJECT, NOT COPIES */

test("the experiments import the shared module rather than redefining it", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  for (const f of ["spatial-ibm.js", "phenology.js", "v2-sweep.js"]) {
    const src = fs.readFileSync(
      path.join(__dirname, "..", "experiments", f),
      "utf8",
    );
    assert.ok(
      src.includes('require("../sim/paired-stats.js")'),
      `${f} does not import sim/paired-stats.js`,
    );
    /* ⚠️ A NAME CANNOT GUARD AN OPEN SET, so this checks the two definitions
     * that actually existed as duplicates rather than trying to enumerate every
     * way a helper could be re-implemented. It catches a revert or a copy-paste
     * back, which is the realistic regression. */
    assert.ok(
      !/^function pairedCI\(/m.test(src),
      `${f} redefines pairedCI — the copy this module exists to remove is back`,
    );
    assert.ok(
      !/^const degenerate = /m.test(src),
      `${f} redefines degenerate — the copy this module exists to remove is back`,
    );
  }
});
