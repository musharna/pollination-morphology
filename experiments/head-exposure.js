/*
 * Roadmap item D, part 2 — how much of the ablation is exposed to the s=0 pin?
 *
 * head-boundary.js settled that the pin is caused by organs sitting deeper than
 * the head reaches (H1), and that the phi separating pinned species is well
 * conditioned (H2 refuted). One risk survives: at s=0 the coordinate collapses
 * ALONG-BODY position across the whole forward cap, so an organ at the front
 * pole and one at the dorsal shoulder both report s=0.
 *
 * That matters only for the L1 arms, which are allowed to use s and nothing
 * else. If a large share of the pool pins, L1's ceiling could be set by a
 * coordinate edge rather than by biology, and the 3.3x headline would inherit
 * it.
 *
 * THE TEST: drop every species that touches the boundary and see what the
 * L2/L1 ratio does. If the edge is what holds L1 down, removing the species
 * that touch it must RAISE L1 relative to L2.
 *
 * A single seed cannot answer that, because dropping species also shrinks and
 * reshuffles the pool, and the ratio moves on its own for reasons that have
 * nothing to do with the boundary. So the comparison is PAIRED ACROSS SEEDS —
 * the same pool, with and without its pinned members — and reported with an
 * interval. A null with no noise band attached is not a null; three separate
 * measurement artefacts impersonated results on this project already.
 */

const P = require("../sim/placement.js");
const K = require("../sim/packing.js");
const E = require("../sim/evolve.js");

const bee = P.DEFAULT_BEE;
const N_SAMP = 60;
const POOL_TRIES = 400;
const TAUS = [0.05, 0.1, 0.2, 0.3, 0.5];
const SEEDS = [7, 23, 41, 59, 71, 89];

function pooled(seed) {
  const rng = E.makeRng(seed);
  const out = [];
  for (let i = 0; i < POOL_TRIES; i++) {
    const f = E.toFlower(E.randomGenome(rng));
    const a = P.placementDistribution(f, bee, {
      n: N_SAMP,
      seed: seed * 13 + i,
      part: "anther",
    });
    const s = P.placementDistribution(f, bee, {
      n: N_SAMP,
      seed: seed * 29 + i,
      part: "stigma",
    });
    if (a.hits.length < 8 || s.hits.length < 8) continue;
    const pinA = a.hits.filter((h) => h.s < 0.01).length / a.hits.length;
    const pinS = s.hits.filter((h) => h.s < 0.01).length / s.hits.length;
    out.push({ f, a, s, pinned: Math.max(pinA, pinS) });
  }
  return out;
}

function ceilings(pool, sigOf, seed) {
  const sigs = pool.map((p) => ({ A: sigOf(p.a.hits), S: sigOf(p.s.hits) }));
  const n = sigs.length;
  const mat = [];
  for (let i = 0; i < n; i++) {
    mat.push(new Float64Array(n));
    for (let j = 0; j < n; j++) mat[i][j] = K.overlap(sigs[i].A, sigs[j].S);
  }
  return TAUS.map(
    (t) => K.packingCeiling(mat, t, { restarts: 200, seed }).size,
  );
}

function meanCi(xs) {
  const n = xs.length;
  const m = xs.reduce((a, b) => a + b, 0) / n;
  if (n < 2) return { m, lo: m, hi: m };
  const v = xs.reduce((a, b) => a + (b - m) * (b - m), 0) / (n - 1);
  const half = 2.571 * Math.sqrt(v / n); // t(0.975, df=5)
  return { m, lo: m - half, hi: m + half };
}

function main() {
  console.log(
    `${SEEDS.length} independent pools, ${POOL_TRIES} morphologies sampled each.\n` +
      `A species counts as touching the boundary if EITHER its anther or its\n` +
      `stigma contacts pin at s=0 on any visit.\n`,
  );

  const diffs = TAUS.map(() => []);
  let totPool = 0,
    totTouch = 0;

  console.log(
    "  seed   pool   touching boundary        ratio full -> unpinned",
  );
  for (const seed of SEEDS) {
    const pool = pooled(seed);
    const clean = pool.filter((p) => p.pinned === 0);
    totPool += pool.length;
    totTouch += pool.length - clean.length;

    const f1 = ceilings(pool, K.sig1D, seed);
    const f2 = ceilings(pool, K.sig2D, seed);
    const c1 = ceilings(clean, K.sig1D, seed);
    const c2 = ceilings(clean, K.sig2D, seed);

    const rFull = f2.map((v, i) => v / f1[i]);
    const rCln = c2.map((v, i) => v / c1[i]);
    rFull.forEach((v, i) => diffs[i].push(rCln[i] - v));

    const k = TAUS.indexOf(0.2);
    console.log(
      `  ${String(seed).padStart(4)}   ${String(pool.length).padStart(4)}` +
        `   ${String(pool.length - clean.length).padStart(6)}` +
        ` (${((100 * (pool.length - clean.length)) / pool.length).toFixed(1).padStart(4)}%)` +
        `        ${rFull[k].toFixed(2)} -> ${rCln[k].toFixed(2)}   (t=0.2)`,
    );
  }

  console.log(
    `\n  ${((100 * totTouch) / totPool).toFixed(1)}% of sampled morphologies touch the boundary.\n`,
  );

  console.log(
    "PAIRED change in the L2/L1 ratio when every pinned species is dropped",
  );
  console.log(
    "  (same pool both arms, so pool composition is differenced out)\n",
  );
  console.log("    tau    mean delta        95% CI          excludes 0?");
  TAUS.forEach((t, i) => {
    const { m, lo, hi } = meanCi(diffs[i]);
    const excl = lo > 0 || hi < 0;
    console.log(
      `  ${String(t).padStart(5)}   ${m >= 0 ? "+" : ""}${m.toFixed(3).padStart(6)}` +
        `      [${lo >= 0 ? "+" : ""}${lo.toFixed(3)}, ${hi >= 0 ? "+" : ""}${hi.toFixed(3)}]` +
        `      ${excl ? "YES <- boundary moves the headline" : "no"}`,
    );
  });

  console.log(
    `\n  A positive delta would mean L1 does BETTER once the boundary-touching\n` +
      `  species are gone — i.e. the s=0 edge was holding L1 down and inflating\n` +
      `  the advantage. An interval spanning zero means the boundary is not what\n` +
      `  the 2-D advantage is made of.`,
  );
}

main();
