/*
 * Is L2 winning the ablation because of DIMENSIONALITY, or because the species
 * the packer selects are tighter than the median it was matched against?
 *
 * The synthetic arms were handed the MEDIAN L2 spread. If the packer
 * preferentially picks the tight tail of the L2 pool, L2's ceiling reflects a
 * precision advantage the steelman was never given, and the headline result is
 * an artefact of the matching rather than a fact about placement geometry.
 *
 * This measures the spread of the ACTUALLY SELECTED species and re-runs the
 * steelman at that precision.
 */

const P = require("../sim/placement.js");
const K = require("../sim/packing.js");
const { sampleMorphologies } = require("./ablation.js");

const N_VISITS = 240;
const TAUS = [0.05, 0.1, 0.2, 0.3];

function pct(xs, p) {
  const a = [...xs].sort((x, y) => x - y);
  return a[Math.min(a.length - 1, Math.floor(p * a.length))];
}

function freeArm1D(count, sSd, phiSd, seed) {
  const sigs = [];
  for (let i = 0; i < count; i++)
    sigs.push(
      K.sig2D(
        K.syntheticHits((i + 0.5) / count, 0, sSd, phiSd, {
          n: N_VISITS,
          seed: seed + i,
        }),
      ),
    );
  return sigs;
}

function main() {
  const { pool } = sampleMorphologies(7);
  const sAll = pool.map((p) => K.sSpread(p.d.hits));
  const phiAll = pool.map((p) => K.phiSpread(p.d.hits));

  console.log("L2 pool spread distribution:");
  for (const q of [0.05, 0.25, 0.5, 0.75, 0.95])
    console.log(
      `  p${String(q * 100).padStart(2)}  s sd ${pct(sAll, q).toFixed(4)}   phi sd ${pct(phiAll, q).toFixed(4)}`,
    );

  const sigs2D = pool.map((p) => K.sig2D(p.d.hits));
  const mat = K.overlapMatrix(sigs2D);

  console.log("\nspread of the species the packer ACTUALLY selects:\n");
  console.log(
    "  tau   picked   median s sd   median phi sd   (pool median: " +
      `${K.median(sAll).toFixed(4)} / ${K.median(phiAll).toFixed(4)})`,
  );

  const selectedSpreads = {};
  for (const tau of TAUS) {
    const { members } = K.packingCeiling(mat, tau, { restarts: 200, seed: 99 });
    const s = K.median(members.map((i) => K.sSpread(pool[i].d.hits)));
    const ph = K.median(members.map((i) => K.phiSpread(pool[i].d.hits)));
    selectedSpreads[tau] = { s, ph };
    console.log(
      `  ${String(tau).padEnd(5)} ${String(members.length).padStart(6)}   ${s.toFixed(4)}        ${ph.toFixed(4)}`,
    );
  }

  /*
   * THE DECIDING RE-RUN. Give the 1-D steelman the precision of the species L2
   * actually used — the most generous matching available. If L2 still wins by
   * a wide margin, the win is dimensional. If the gap closes, it was
   * precision.
   */
  console.log("\nsteelman re-run at the SELECTED-species precision:\n");
  console.log("  tau   L1-free@selected   L2   ratio");
  for (const tau of TAUS) {
    const { s, ph } = selectedSpreads[tau];
    const steel = freeArm1D(300, s, ph, 70000);
    const a = K.packingCeiling(K.overlapMatrix(steel), tau, {
      restarts: 200,
      seed: 99,
    }).size;
    const b = K.packingCeiling(mat, tau, { restarts: 200, seed: 99 }).size;
    console.log(
      `  ${String(tau).padEnd(5)} ${String(a).padStart(16)} ${String(b).padStart(4)}   ${(b / a).toFixed(2)}x`,
    );
  }

  /*
   * SECOND CHECK — is the 1-D steelman pool-limited? If raising its candidate
   * count raises its ceiling, the earlier number was an artefact of how many
   * candidates it was offered rather than of geometry.
   */
  console.log("\nis the steelman pool-limited? (tau=0.2, median precision)");
  const sMed = K.median(sAll);
  const phMed = K.median(phiAll);
  for (const n of [50, 100, 200, 400, 800]) {
    const sigs = freeArm1D(n, sMed, phMed, 90000);
    const c = K.packingCeiling(K.overlapMatrix(sigs), 0.2, {
      restarts: 200,
      seed: 99,
    }).size;
    console.log(`  pool ${String(n).padStart(4)} -> ceiling ${c}`);
  }
}

main();
