/*
 * tCrit is a numerical solver replacing a hand-typed table. Its whole warrant is
 * that the table it replaced is still here to check it against: fifteen values
 * from an independent source, none of which the solver has any way to see.
 *
 * ⚠️ AND THE AGREEMENT TEST ALONE WOULD NOT BE ENOUGH. A solver that ignored
 * `df` and returned 2.13 for everything would still land within a few percent of
 * eight of the fifteen rows. So the tolerance is 1e-5 absolute — far tighter
 * than the spread between adjacent rows — and the tail identity is checked
 * directly at df values the table never covered.
 *
 * ⚠️⚠️ AND THE OFF-TABLE CHECK IS THE ONE THAT MATTERS. Driven against four
 * deliberately broken solvers (_scratch/tcrit-seen-to-fail.js), all four die —
 * but "silently return z for df > 15", which is THE HISTORICAL BUG THIS MODULE
 * EXISTS TO PREVENT, PASSES table agreement and is killed only by the off-table
 * tail identity. A control that only checks where the old table already had
 * answers cannot see the failure that happens past its end.
 */
const test = require("node:test");
const assert = require("node:assert");
const S = require("../sim/paired-stats.js");

test("tCrit reproduces every tabulated critical value", () => {
  const dfs = Object.keys(S.T_CRIT).map(Number);
  assert.equal(dfs.length, 15, "the positive control lost rows");
  for (const df of dfs) {
    const got = S.tCrit(df);
    assert.ok(
      Math.abs(got - S.T_CRIT[df]) < 1e-5,
      `df=${df}: solver ${got} vs table ${S.T_CRIT[df]}`,
    );
  }
});

test("a df-blind solver could not pass the above", () => {
  /* the rows are far enough apart that a constant answer fails */
  const lo = S.T_CRIT[1];
  const hi = S.T_CRIT[15];
  assert.ok(
    lo - hi > 10,
    `table spread ${lo - hi} is too flat to discriminate`,
  );
});

test("the solved value actually solves the two-sided tail, off-table", () => {
  for (const df of [20, 39, 63, 200]) {
    const t = S.tCrit(df);
    const tail = S.betai(df / 2, 0.5, df / (df + t * t));
    assert.ok(
      Math.abs(tail - 0.05) < 1e-9,
      `df=${df}: P(|T|>${t}) = ${tail}, wanted 0.05`,
    );
  }
});

test("tCrit decreases in df and approaches z from above", () => {
  let prev = Infinity;
  for (const df of [1, 2, 5, 10, 30, 100, 1000, 100000]) {
    const t = S.tCrit(df);
    assert.ok(t < prev, `not decreasing at df=${df}`);
    assert.ok(t > S.Z_CRIT, `df=${df} fell to or below z`);
    prev = t;
  }
  assert.ok(Math.abs(S.tCrit(1e6) - S.Z_CRIT) < 1e-5, "does not converge to z");
});

test("tCrit refuses a df it cannot serve rather than approximating", () => {
  for (const bad of [0, 0.5, -3, NaN, Infinity]) {
    assert.throws(() => S.tCrit(bad), /undefined for df/, `df=${bad}`);
  }
  assert.throws(() => S.tCrit(7, 0), /bad alpha/);
  assert.throws(() => S.tCrit(7, 1), /bad alpha/);
});

test("interval at n=8 still gives the published t multiplier", () => {
  const d = [1, 1, -1, -2, 0, 0, 2, 1];
  const ci = S.interval(d);
  const mult = (ci.t[1] - ci.mean) / ci.se;
  assert.ok(
    Math.abs(mult - 2.364624) < 1e-5,
    `n=8 multiplier drifted to ${mult}`,
  );
});

test("interval now serves n beyond the old table", () => {
  const d = Array.from({ length: 40 }, (_, i) => (i % 5) - 2);
  const ci = S.interval(d);
  assert.equal(ci.n, 40);
  assert.ok(Number.isFinite(ci.t[0]) && Number.isFinite(ci.t[1]));
  const mult = (ci.t[1] - ci.mean) / ci.se;
  assert.ok(Math.abs(mult - S.tCrit(39)) < 1e-12);
});
