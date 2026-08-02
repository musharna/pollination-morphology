/* What is the optimiser's ceiling at the tolerance evolution actually adopts?
 * That number is the DENOMINATOR of v1's "% of the achievable ceiling" claim,
 * so it has to track every change to how overlap is measured.
 *
 * ⚠️ THE FILE'S OWN PREMISE CHANGED, AND THE NAME IS NOW A FOSSIL.
 *
 * It used to ask for the ceiling as tau -> 0, on the reasoning that evolved
 * communities show max pairwise overlap 0.000 and so should be scored against a
 * zero-tolerance bound. That reasoning only worked because the histogram metric
 * could return EXACTLY zero: two clouds in different bins scored 0 no matter how
 * close the bins were.
 *
 * The continuous metric has gaussian tails, so overlap is never exactly zero. At
 * tau = 0 every pair conflicts and the ceiling collapses to 1 for every arm —
 * not a fact about geometry, just the limit being unreachable. The "0.000" that
 * motivated the old framing was a rounding artefact of a metric that quantised
 * to bins.
 *
 * So the tolerance is now READ OFF THE MEASURED ARM instead of assumed: run the
 * evolution loop, take the largest pairwise overlap its survivors actually
 * tolerate, and compute the ceiling there. That is what the original comment was
 * reaching for; it just could not be measured on a metric that rounded it away.
 */
const K = require("../sim/packing.js");
const A = require("./ablation.js");

const { pool } = A.sampleMorphologies(7);
const prec = A.precisionPool(pool, 31337);

const matL2 = K.kdeOverlapMatrix(pool.map((p) => K.kdeSig(p.d.hits)));
const matL1 = K.kdeOverlapMatrix(A.armFree1D(A.scaled(200), prec, 20000));
/* v1's L1 arm evolves its own precision and drives it to the tight end, so the
 * bound it is scored against has to be the ceiling of a 1-D arm at that
 * precision — not at the pool's median. Scoring a precision-selected arm
 * against a drawn-precision bound is what made the old constant reportable as
 * 111% of itself. */
const matL1e = K.kdeOverlapMatrix(
  A.armFree1DEvolved(A.scaled(200), prec, 21000),
);

const best = (m, tau) => {
  let b = 0;
  for (const seed of [99, 7, 4242])
    b = Math.max(
      b,
      K.packingCeiling(m, tau, { restarts: A.RESTARTS, seed }).size,
    );
  return b;
};

console.log(
  `pool ${pool.length} morphologies, 1-D steelman ${A.scaled(200)} species` +
    `\nmetric: continuous overlap, KDE_M=${K.KDE_M}\n`,
);
console.log(
  "  tau        L1-drawn  L1-evolved     L2   (ceiling by isolation tolerance)",
);
for (const tau of [0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.001, 0.0]) {
  const a = best(matL1, tau);
  const b = best(matL1e, tau);
  const c = best(matL2, tau);
  const note =
    tau === 0 ? "   <- DEGENERATE: continuous overlap is never exactly 0" : "";
  console.log(
    `  ${String(tau).padEnd(8)} ${String(a).padStart(8)} ${String(b).padStart(11)} ${String(c).padStart(6)}${note}`,
  );
}

console.log(
  "\nThe tolerance to use is the one the evolved communities actually show;\n" +
    "experiments/v1.js prints it as max pairwise overlap among survivors.\n" +
    "A bound the measured arm can BEAT is a lower bound wearing the wrong label,\n" +
    "so whichever row is adopted must be re-checked against v1's survivor counts\n" +
    "every time either side changes.",
);
