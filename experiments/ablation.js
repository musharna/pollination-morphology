/*
 * THE ABLATION (groundwork §4.4). Does placement-derived-from-3-D-morphology
 * buy anything a 1-D placement gene does not?
 *
 * This is the delete-the-grid test for this project. It runs before the
 * evolution loop is built, because if L1 matches L2 the geometry is decoration
 * and v1 should not be written.
 *
 *   L0            no placement at all — the standard ABM assumption
 *   L1-strict     L2's own placements with roll discarded
 *   L1-free       a free 1-D placement gene, whole body available   [STEELMAN]
 *   L2            2-D placement derived from real morphology
 *   CTRL-2D-ideal a free 2-D placement gene, whole surface available [CEILING]
 *
 * READ THE ARMS HONESTLY:
 *
 *   L2 >= L1-strict is FORCED. Marginalising a joint histogram cannot lower
 *   min-sum overlap. That arm measures a magnitude (how much roll is carrying)
 *   and its direction proves nothing.
 *
 *   L2 vs L1-FREE is the real test and L1-free can win. It is handed the whole
 *   body length as a free gene at precision matched to L2's own, whereas L2
 *   can only reach the placements its morphology space actually produces. If a
 *   free 1-D gene out-packs our geometry, the geometry is not earning its
 *   keep, and that is the finding.
 *
 *   CTRL-2D-ideal is the ceiling L2 would hit if morphology could put pollen
 *   anywhere on the animal. The gap between L2 and it is how much of the
 *   surface the flower shapes cannot reach.
 */

const P = require("../sim/placement.js");
const K = require("../sim/packing.js");

const TAUS = [0.05, 0.1, 0.2, 0.3, 0.5];
const N_MORPH = 400;
const N_VISITS = 240;
const MIN_CONTACT = 0.5; // a flower that rarely touches the animal is not a species

function rngFrom(seed) {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------- the morphology pool
 *
 * Genes are SHAPE parameters only. Placement appears nowhere in this list,
 * which is groundwork §4.5's constraint made mechanical: the only way an arm
 * can move a placement site is by changing a shape and letting the contact
 * model recompute where the animal gets touched.
 */
function sampleMorphologies(seed = 1) {
  const rng = rngFrom(seed);
  const lerp = (a, b) => a + (b - a) * rng();
  const pool = [];
  let rejected = 0;

  for (let i = 0; i < N_MORPH; i++) {
    const f = {
      ...P.DEFAULT_FLOWER,
      axisLen: lerp(1.8, 3.2),
      mouthR: lerp(0.55, 1.0),
      throatR: lerp(0.16, 0.5),
      curve: lerp(0.0, 0.6),
      polarity: lerp(0.05, 0.95),
      antherT: lerp(0.35, 0.85),
      antherTheta: lerp(-Math.PI, Math.PI),
      antherProject: lerp(0.15, 0.5),
    };
    const d = P.placementDistribution(f, P.DEFAULT_BEE, {
      n: N_VISITS,
      seed: 1000 + i,
    });
    if (d.contactRate < MIN_CONTACT) {
      rejected++;
      continue;
    }
    pool.push({ f, d });
  }
  return { pool, rejected, attempted: N_MORPH };
}

/* --------------------------------------------------------------- the arms */

function armL0(nSpecies) {
  /* No placement model: every visit is an undifferentiated encounter, so every
   * species deposits over the whole animal identically. Implemented rather
   * than asserted, so the "L0 cannot isolate" prediction is measured. */
  const flat = K.sig2D(
    Array.from({ length: 2000 }, (_, i) => ({
      s: (i % 50) / 50 + 0.01,
      phi: -Math.PI + ((i % 37) / 37) * 2 * Math.PI,
    })),
  );
  return Array.from({ length: nSpecies }, () => flat);
}

function armFree1D(count, sSd, phiSd, seed) {
  const sigs = [];
  for (let i = 0; i < count; i++) {
    const s0 = (i + 0.5) / count;
    sigs.push(
      K.sig2D(
        K.syntheticHits(s0, 0, sSd, phiSd, { n: N_VISITS, seed: seed + i }),
      ),
    );
  }
  return sigs;
}

function armFree2D(nS, nPhi, sSd, phiSd, seed) {
  const sigs = [];
  let k = 0;
  for (let i = 0; i < nS; i++)
    for (let j = 0; j < nPhi; j++)
      sigs.push(
        K.sig2D(
          K.syntheticHits(
            (i + 0.5) / nS,
            -Math.PI + (j / nPhi) * 2 * Math.PI,
            sSd,
            phiSd,
            { n: N_VISITS, seed: seed + k++ },
          ),
        ),
      );
  return sigs;
}

/* ------------------------------------------------------------------ report */

function ceilings(sigs, label) {
  const mat = K.overlapMatrix(sigs);
  const row = { arm: label, pool: sigs.length };
  for (const tau of TAUS)
    row[`tau${tau}`] = K.packingCeiling(mat, tau, {
      restarts: 200,
      seed: 99,
    }).size;
  return row;
}

function main() {
  const t0 = process.hrtime.bigint();
  const { pool, rejected, attempted } = sampleMorphologies(7);

  console.log(`morphologies sampled : ${attempted}`);
  console.log(
    `  rejected (contact < ${MIN_CONTACT}) : ${rejected}  (${((100 * rejected) / attempted).toFixed(1)}%)`,
  );
  console.log(`  viable species pool  : ${pool.length}`);

  /* Precision, measured off the real arm so the synthetic arms inherit it
   * instead of being handed a number chosen by me. A steelman given tighter
   * blobs than the geometry produces would win for the wrong reason. */
  const sSd = K.median(pool.map((p) => K.sSpread(p.d.hits)));
  const phiSd = K.median(pool.map((p) => K.phiSpread(p.d.hits)));
  console.log(
    `\nmatched precision (median of L2): s sd ${sSd.toFixed(4)}, phi sd ${phiSd.toFixed(4)} rad`,
  );

  /* How much of the animal can the morphology space actually reach? If this
   * is a thin ribbon, the second placement dimension is nominal. */
  const occupied = new Set();
  const occupiedS = new Set();
  for (const p of pool)
    for (const h of p.d.hits) {
      const sb = Math.min(17, Math.floor(h.s * 18));
      const pb = Math.min(
        19,
        Math.floor(((h.phi + Math.PI) / (2 * Math.PI)) * 20),
      );
      occupied.add(`${sb},${pb}`);
      occupiedS.add(sb);
    }
  console.log(
    `reachable body bins  : ${occupied.size} of ${18 * 20} 2-D bins (${((100 * occupied.size) / 360).toFixed(1)}%), ${occupiedS.size} of 18 along the body`,
  );

  const sigs2D = pool.map((p) => K.sig2D(p.d.hits));
  const sigs1D = pool.map((p) => K.sig1D(p.d.hits));

  const rows = [
    ceilings(armL0(60), "L0 (no placement)"),
    ceilings(sigs1D, "L1-strict (roll discarded)"),
    ceilings(
      armFree1D(200, sSd, phiSd, 20000),
      "L1-free (1-D gene) [STEELMAN]",
    ),
    ceilings(sigs2D, "L2 (from morphology)"),
    ceilings(armFree2D(40, 14, sSd, phiSd, 40000), "CTRL-2D-ideal [CEILING]"),
  ];

  console.log("\nspecies packing ceiling, by isolation threshold tau:\n");
  const head = [
    "arm".padEnd(30),
    "pool".padStart(5),
    ...TAUS.map((t) => `t=${t}`.padStart(7)),
  ];
  console.log(head.join(" "));
  console.log("-".repeat(head.join(" ").length));
  for (const r of rows) {
    console.log(
      [
        r.arm.padEnd(30),
        String(r.pool).padStart(5),
        ...TAUS.map((t) => String(r[`tau${t}`]).padStart(7)),
      ].join(" "),
    );
  }

  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  console.log(`\nelapsed ${(ms / 1000).toFixed(1)}s`);
  return rows;
}

if (require.main === module) main();
module.exports = { main, sampleMorphologies };
