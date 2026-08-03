/*
 * Is L2 winning the ablation because of DIMENSIONALITY, or because the species
 * the packer selects are tighter than the precision it was matched against?
 *
 * If the packer preferentially picks the tight tail of the L2 pool, L2's ceiling
 * reflects a precision advantage the steelman was never given, and the headline
 * is an artefact of the matching rather than a fact about placement geometry.
 * This measures the spread of the ACTUALLY SELECTED species and re-runs the
 * steelman at that precision.
 *
 * ⚠️ RE-BASED 2026-08-02, and it was stale in two ways that both flattered L2.
 *
 * 1. THE STEELMAN WAS CONFINED TO A SMALLER ANIMAL. Its centres were spread over
 *    s in [0, 1] while L2's placements run from the head cap at S_LO to the tail
 *    — the same rigging ablation.js was corrected for and this file was not. A
 *    control given less surface than the measured arm loses for a reason that has
 *    nothing to do with dimensionality, and every ratio below inherited it.
 * 2. The overlap metric was the 24-bin histogram, which saturates below one bin
 *    width — and this file deliberately re-runs the steelman at TIGHT precision,
 *    which is precisely where it saturates.
 *
 * 3. ⚠️ AND IT REPEATED THE ERROR ablation.js HAD ALREADY FIXED. It handed every
 *    steelman candidate the MEDIAN of the selected species' spread. Measured,
 *    precision HETEROGENEITY is itself worth most of a doubling — 18 slots from
 *    candidates of varied spread against 10 from any homogeneous pool, because a
 *    packer offered a mix can cherry-pick the tight ones and a uniform pool gives
 *    it nothing to choose between. The tell was that this file's steelman scored
 *    BELOW the ablation's while being handed TIGHTER blobs and MORE candidates.
 *    So the steelman now inherits the selected species' precision DISTRIBUTION.
 *
 * All three corrections ran the same way: toward the control. The premise line
 * "the synthetic arms were handed the MEDIAN L2 spread" was obsolete too — the
 * ablation draws (s sd, phi sd) PAIRS from the pool's distribution now.
 */

const P = require("../sim/placement.js");
const K = require("../sim/packing.js");
const {
  sampleMorphologies,
  S_LO,
  S_SPAN,
  scaled,
} = require("./ablation.js");

const N_VISITS = 240;
const TAUS = [0.05, 0.1, 0.2, 0.3];

function pct(xs, p) {
  const a = [...xs].sort((x, y) => x - y);
  return a[Math.min(a.length - 1, Math.floor(p * a.length))];
}

/* pairs: the precision DISTRIBUTION the steelman inherits, as (s sd, phi sd)
 * tuples. Passing a single tuple gives the old homogeneous arm, which is a
 * measurably weaker control — see note 3 in the header. */
function freeArm1D(count, pairs, seed) {
  const sigs = [];
  for (let i = 0; i < count; i++) {
    const [sSd, phiSd] = pairs[i % pairs.length];
    sigs.push(
      K.kdeSig(
        K.syntheticHits(S_LO + ((i + 0.5) / count) * S_SPAN, 0, sSd, phiSd, {
          n: N_VISITS,
          seed: seed + i,
          sLo: S_LO,
        }),
      ),
    );
  }
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

  const sigs2D = pool.map((p) => K.kdeSig(p.d.hits));
  const mat = K.kdeOverlapMatrix(sigs2D);

  console.log("\nspread of the species the packer ACTUALLY selects:\n");
  console.log(
    "  tau   picked   median s sd   median phi sd   (pool median: " +
      `${K.median(sAll).toFixed(4)} / ${K.median(phiAll).toFixed(4)})`,
  );

  const selectedSpreads = {};
  for (const tau of TAUS) {
    const { members } = K.packingCeiling(mat, tau, { restarts: 200, seed: 99 });
    const pairs = members.map((i) => [
      K.sSpread(pool[i].d.hits),
      K.phiSpread(pool[i].d.hits),
    ]);
    const s = K.median(pairs.map((q) => q[0]));
    const ph = K.median(pairs.map((q) => q[1]));
    selectedSpreads[tau] = { s, ph, pairs };
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
  console.log(
    "\nsteelman re-run at the SELECTED-species precision DISTRIBUTION:\n",
  );
  console.log("  tau   L1-free@selected   L2   ratio");
  for (const tau of TAUS) {
    const { pairs } = selectedSpreads[tau];
    const steel = freeArm1D(scaled(300), pairs, 70000);
    const a = K.packingCeiling(K.kdeOverlapMatrix(steel), tau, {
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
  console.log(
    "\nis the steelman pool-limited? (tau=0.2, pool precision distribution)",
  );
  const poolPairs = pool.map((p) => [
    K.sSpread(p.d.hits),
    K.phiSpread(p.d.hits),
  ]);
  for (const n of [50, 100, 200, 400, 800]) {
    const sigs = freeArm1D(n, poolPairs, 90000);
    const c = K.packingCeiling(K.kdeOverlapMatrix(sigs), 0.2, {
      restarts: 200,
      seed: 99,
    }).size;
    console.log(`  pool ${String(n).padStart(4)} -> ceiling ${c}`);
  }
}

main();
