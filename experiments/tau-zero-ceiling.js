/* What is the optimiser's ceiling at the tolerance evolution actually adopts?
 * The evolved communities show max pairwise overlap 0.000 — selection does not
 * tolerate overlap, it eliminates it — so comparing them against a ceiling
 * computed at tau=0.2 compares two different things.
 *
 * Rebuilt 2026-08-01 alongside the head-cap fix. Two corrections carry over
 * from ablation.js, and both matter here because this file's number is the
 * DENOMINATOR of v1's "% of the achievable ceiling" claim:
 *
 *   1. The synthetic L1-free arm now spans the SAME body surface the real
 *      animal has, cap included, at the same density of species centres.
 *   2. It draws (s sd, phi sd) PAIRS from the real pool's precision
 *      distribution rather than being handed the median. Precision is strongly
 *      heterogeneous — 71 of 309 species are tighter than median on both axes —
 *      so a median-precision steelman is a weaker opponent than the geometry
 *      actually fields.
 */
const K = require("../sim/packing.js");
const A = require("./ablation.js");

const { pool } = A.sampleMorphologies(7);
const sigs = pool.map((p) => K.sig2D(p.d.hits));
const mat = K.overlapMatrix(sigs);
const prec = A.precisionPool(pool, 31337);
const m1 = K.overlapMatrix(A.armFree1D(A.scaled(200), prec, 20000));

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
  `pool ${pool.length} morphologies, L1-free steelman ${A.scaled(200)} species\n`,
);
console.log("  tau      L1-free   L2   (ceiling as tolerance -> 0)");
for (const tau of [0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.001, 0.0]) {
  const a = best(m1, tau);
  const b = best(mat, tau);
  console.log(
    `  ${String(tau).padEnd(7)} ${String(a).padStart(7)} ${String(b).padStart(5)}`,
  );
}
