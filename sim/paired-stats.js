/*
 * paired-stats.js — the paired-difference machinery, in one place.
 *
 * WHY THIS EXISTS. `pairedCI` and `degenerate` were written once for
 * experiments/spatial-ibm.js and then copied verbatim into
 * experiments/phenology.js, and a third experiment needed them again. The two
 * copies were byte-identical at the time of extraction, which is the good case;
 * the bad case is the one this project has already lived through, where a
 * predicate is corrected in one copy and the other keeps reporting the old
 * answer. Task #43 in the tracker is exactly this.
 *
 * Both statistical idioms live here because both are paired over SEEDS, which is
 * the unit of independence in every experiment in this repo:
 *
 *   pairedCI  — bootstrap over resampled seed pairs, for statistics like HELD
 *               that are fractions of a categorical outcome
 *   interval  — Student's t on a vector of per-seed differences, for statistics
 *               that are already numeric per seed
 */

const E = require("./evolve.js");

/*
 * Paired over SEEDS: every cell sees the same founding draws, so a difference
 * between cells is not a difference in which populations they happened to get.
 * Resampling is over seeds, which is the unit of independence.
 */
function pairedCI(a, b, statOf, B = 4000, seed = 99) {
  const n = a.length;
  if (n !== b.length || !n) return null;
  const rng = E.makeRng(seed);
  const point = statOf(a) - statOf(b);
  const draws = [];
  for (let k = 0; k < B; k++) {
    const ia = [],
      ib = [];
    for (let i = 0; i < n; i++) {
      const j = Math.floor(rng() * n);
      ia.push(a[j]);
      ib.push(b[j]);
    }
    draws.push(statOf(ia) - statOf(ib));
  }
  draws.sort((x, y) => x - y);
  return {
    point,
    lo: draws[Math.floor(0.025 * B)],
    hi: draws[Math.floor(0.975 * B)],
  };
}

/*
 * ⚠️⚠️ A PAIRED BOOTSTRAP OVER A CONSTANT IS NOT A CONFIDENCE INTERVAL. When the
 * paired difference is identical in every seed, every resample is identical too
 * and the interval collapses to [0.000, 0.000] — at n=3 exactly as readily as at
 * n=30. That width reports the SAMPLE BEING CONSTANT, not the precision of the
 * estimate. One was published once as though it were a tight refutation.
 *
 * ⚠️ AND THE FIRST VERSION OF THIS PREDICATE TESTED THE WRONG OBJECT. It asked
 * whether the STATISTIC was constant. `pairedCI` resamples paired DIFFERENCES,
 * and a difference vector can be constant while the statistic varies — arm A
 * beating arm B by exactly one in every seed. The interval collapses even though
 * the statistic is not constant anywhere, and a guard written against the
 * statistic walks straight past it: a predicate that does not fully observe what
 * it is trusted for.
 *
 * The object the bootstrap resamples is the difference, so that is the object
 * the predicate tests.
 */
const degenerate = (a, b, statOf) => {
  const n = Math.min(a.length, b.length);
  if (!n) return true;
  const d = [];
  for (let i = 0; i < n; i++) d.push(statOf([a[i]]) - statOf([b[i]]));
  return d.every((x) => x === d[0]);
};

/* For k = 0 successes in n trials the exact one-sided upper bound at level a
 * solves (1-p)^n = a; the mirror gives the lower bound for k = n. Reported in
 * place of a degenerate interval, where it says something real. */
const zeroUpper = (n, alpha = 0.05) => 1 - Math.pow(alpha, 1 / n);
const allLower = (n, alpha = 0.05) => Math.pow(alpha, 1 / n);

/*
 * ⚠️ STUDENT'S t, NOT A NORMAL APPROXIMATION, AND THE DISTINCTION IS NOT
 * COSMETIC. docs/2026-08-01-v2-result.md published intervals computed with
 * z = 1.959964 at n = 8, where the correct critical value is t(df=7) = 2.364624
 * — 21% wider. The document's own headline near-miss ("excluded zero by 0.02")
 * does not survive the correction. Both are returned so a reader can see the
 * difference rather than take the tighter one on trust.
 */
const T_CRIT = {
  1: 12.706205,
  2: 4.302653,
  3: 3.182446,
  4: 2.776445,
  5: 2.570582,
  6: 2.446912,
  7: 2.364624,
  8: 2.306004,
  9: 2.262157,
  10: 2.228139,
  11: 2.200985,
  12: 2.178813,
  13: 2.160369,
  14: 2.144787,
  15: 2.13145,
};
const Z_CRIT = 1.959964;

/*
 * ⚠️ A TABLE CANNOT SERVE AN OPEN SET OF n. The table above ends at df=15 and
 * `interval` throws past it — the correct failure, but still a failure: the
 * moment an experiment wants 40 seeds instead of 8, the choice is between
 * hand-typing more rows (numeric constants written from recall, which is exactly
 * how z-instead-of-t got in) and computing the quantile.
 *
 * So it is computed. The table is KEPT, and is now the POSITIVE CONTROL: the
 * test asserts tCrit reproduces all fifteen tabulated values, so a solver that
 * quietly returned nonsense would have to reproduce fifteen independently
 * sourced numbers to pass.
 */

/* Lanczos. */
function gammaln(x) {
  const cof = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += cof[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

/* Continued fraction for the incomplete beta (modified Lentz). Throws rather
 * than returning its last iterate — a non-converged fraction that returns
 * anyway is an observable that cannot report its own failure. */
function betacf(a, b, x) {
  const MAXIT = 300;
  const EPS = 3e-16;
  const FPMIN = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) return h;
  }
  throw new Error(`betacf did not converge at a=${a} b=${b} x=${x}`);
}

/* Regularised incomplete beta I_x(a,b). */
function betai(a, b, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    gammaln(a + b) -
      gammaln(a) -
      gammaln(b) +
      a * Math.log(x) +
      b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a;
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/*
 * Two-sided critical value of Student's t at `df` degrees of freedom.
 *
 * For t > 0, P(|T| > t) = I_{df/(df+t^2)}(df/2, 1/2), monotonically decreasing
 * in t — so the tail is inverted by bisection, with no derivative and no
 * starting guess to get wrong.
 */
function tCrit(df, alpha = 0.05) {
  if (!Number.isFinite(df) || df < 1)
    throw new Error(`t critical value undefined for df=${df}`);
  if (!(alpha > 0 && alpha < 1)) throw new Error(`bad alpha ${alpha}`);
  const tail = (t) => betai(df / 2, 0.5, df / (df + t * t));
  let lo = 0;
  let hi = 1e4;
  if (tail(hi) > alpha) throw new Error(`t critical value outside bracket`);
  for (let i = 0; i < 300 && hi - lo > 1e-12 * (1 + hi); i++) {
    const mid = 0.5 * (lo + hi);
    if (tail(mid) > alpha) lo = mid;
    else hi = mid;
  }
  return 0.5 * (lo + hi);
}

function interval(d) {
  const n = d.length;
  const mean = d.reduce((a, b) => a + b, 0) / n;
  if (n < 2) return { n, mean, sd: NaN, se: NaN };
  const varS = d.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
  const sd = Math.sqrt(varS);
  const se = sd / Math.sqrt(n);
  /* ⚠️ STILL NEVER FALLS BACK TO z. tCrit throws on a df it cannot serve rather
   * than returning a normal approximation, which is how the v2 intervals became
   * normal approximations in the first place. It is a single path: there is no
   * "use the table if it has this df" branch, so the table cannot drift away
   * from the solver without the positive-control test noticing. */
  const t = tCrit(n - 1);
  return {
    n,
    mean,
    sd,
    se,
    /* zero-width whenever every paired difference is identical — the numeric
     * analogue of a degenerate bootstrap, and flagged the same way */
    degenerate: sd === 0,
    t: [mean - t * se, mean + t * se],
    z: [mean - Z_CRIT * se, mean + Z_CRIT * se],
  };
}

module.exports = {
  pairedCI,
  degenerate,
  zeroUpper,
  allLower,
  interval,
  tCrit,
  betai,
  T_CRIT,
  Z_CRIT,
};
