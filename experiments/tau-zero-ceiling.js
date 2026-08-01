/* What is the optimiser's ceiling at the tolerance evolution actually adopts?
 * The evolved communities show max pairwise overlap 0.000 — selection does not
 * tolerate overlap, it eliminates it — so comparing them against a ceiling
 * computed at tau=0.2 compares two different things. */
const K = require("../sim/packing.js");
const { sampleMorphologies } = require("./ablation.js");
const { pool } = sampleMorphologies(7);
const sigs = pool.map((p) => K.sig2D(p.d.hits));
const mat = K.overlapMatrix(sigs);
const sSd = K.median(pool.map((p) => K.sSpread(p.d.hits)));
const phiSd = K.median(pool.map((p) => K.phiSpread(p.d.hits)));
const free1D = [];
for (let i = 0; i < 200; i++)
  free1D.push(K.sig2D(K.syntheticHits((i + 0.5) / 200, 0, sSd, phiSd, { n: 240, seed: 20000 + i })));
const m1 = K.overlapMatrix(free1D);
console.log("  tau      L1-free   L2   (ceiling as tolerance -> 0)");
for (const tau of [0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.001, 0.0]) {
  const a = K.packingCeiling(m1, tau, { restarts: 200, seed: 99 }).size;
  const b = K.packingCeiling(mat, tau, { restarts: 200, seed: 99 }).size;
  console.log(`  ${String(tau).padEnd(7)} ${String(a).padStart(7)} ${String(b).padStart(5)}`);
}
