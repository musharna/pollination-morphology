/*
 * ⚠️ THE ABLATION'S RATIO IS A POINT ON A CURVE, AND IT WAS READ OFF AT TWO
 * DIFFERENT X-VALUES.
 *
 * The ablation hands the synthetic 1-D steelman scaled(200) = 234 candidates
 * while the morphology arm draws on 309 species and CTRL-2D-ideal on 3760. Those
 * counts were never matched, and the packing ceiling depends on them strongly —
 * so "the 2-D advantage is N times" was comparing arms at different pool sizes.
 *
 * Measured at tau = 0.2, both arms as a function of how many candidates they are
 * offered:
 *
 *     candidates    L1-free    L2      ratio at matched N
 *          234         16       -
 *          309         19      40           2.1x
 *          608         19      52           2.7x
 *         1209         21      65           3.1x
 *         2381         24      77           3.2x
 *
 * NEITHER ARM IS SATURATED, and they grow at completely different rates: each
 * doubling of the candidate pool buys 1-D about +2 species and 2-D about +12.
 *
 * That is the actual finding, and it is a better one than any single multiplier:
 * DIMENSIONALITY SETS THE SCALING, NOT A FIXED RATIO. A 1-D placement axis runs
 * out of line — there are only so many distinguishable positions along a body at
 * a given precision — while a 2-D surface keeps finding room. It also explains
 * why "the ratio" has moved every time this project re-measured it: it is not a
 * constant, so every measurement was reporting wherever its pool size happened
 * to sit.
 *
 * The ratio quoted anywhere must therefore name the pool size it was taken at.
 */

const P = require("../sim/placement.js");
const K = require("../sim/packing.js");
const A = require("./ablation.js");

const TAU = 0.2;
const N_VISITS = 240;

function l2Pool(nMorph, seed) {
  let x = seed >>> 0 || 1;
  const rng = () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
  const lerp = (a, b) => a + (b - a) * rng();
  const out = [];
  for (let i = 0; i < nMorph; i++) {
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
    if (d.contactRate >= 0.5) out.push(d);
  }
  return out;
}

const ceiling = (sigs) => {
  const mat = K.kdeOverlapMatrix(sigs);
  let b = 0;
  for (const seed of [99, 7, 4242])
    b = Math.max(
      b,
      K.packingCeiling(mat, TAU, { restarts: A.RESTARTS, seed }).size,
    );
  return b;
};

function l1Free(count, prec, seed) {
  const sigs = [];
  for (let i = 0; i < count; i++) {
    const [sSd, phiSd] = prec[i % prec.length];
    sigs.push(
      K.kdeSig(
        K.syntheticHits(
          A.S_LO + ((i + 0.5) / count) * A.S_SPAN,
          0,
          sSd,
          phiSd,
          { n: N_VISITS, seed: seed + i, sLo: A.S_LO },
        ),
      ),
    );
  }
  return sigs;
}

function main() {
  const { pool } = A.sampleMorphologies(7);
  const prec = A.precisionPool(pool, 31337);

  console.log(
    `species packing ceiling at tau = ${TAU}, as a function of how many\n` +
      `candidate species each arm is offered. MATCHED N, so the comparison is\n` +
      `a ratio rather than two points on two different curves.\n`,
  );
  console.log("  morphologies   pool N   L1-free   L2   ratio");
  for (const n of [400, 800, 1600, 3200]) {
    const p = l2Pool(n, 7);
    const l2 = ceiling(p.map((d) => K.kdeSig(d.hits)));
    const l1 = ceiling(l1Free(p.length, prec, 20000));
    console.log(
      `  ${String(n).padStart(12)}   ${String(p.length).padStart(6)}   ` +
        `${String(l1).padStart(7)} ${String(l2).padStart(4)}   ${(l2 / l1).toFixed(2)}x`,
    );
  }
  console.log(
    "\nIf the ratio RISES with pool size, the advantage is a scaling property of\n" +
      "the placement space rather than a fixed multiplier, and no single number\n" +
      "states it. Quote the pool size with the ratio, always.",
  );
}

if (require.main === module) main();
module.exports = { l2Pool, l1Free, ceiling };
