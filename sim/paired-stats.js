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

function interval(d) {
  const n = d.length;
  const mean = d.reduce((a, b) => a + b, 0) / n;
  if (n < 2) return { n, mean, sd: NaN, se: NaN };
  const varS = d.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
  const sd = Math.sqrt(varS);
  const se = sd / Math.sqrt(n);
  const t = T_CRIT[n - 1];
  /* ⚠️ THROWS RATHER THAN FALLING BACK TO z. A silent fallback past the end of
   * the table is how the v2 intervals became normal approximations in the first
   * place. */
  if (t === undefined)
    throw new Error(`no t critical value tabulated for df=${n - 1}`);
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
  T_CRIT,
  Z_CRIT,
};
