/*
 * v1 — does evolution reach the packing ceiling?
 *
 * The ablation found the ceiling with an optimiser that saw every candidate at
 * once and picked a mutually compatible set. Evolution is myopic: each species
 * can only take a step that helps it against the community it is in right now.
 * The gap between those two numbers is the finding, whichever way it falls.
 *
 * THE DENOMINATOR IS THE tau->0 CEILING, NOT tau=0.2. Evolved communities show
 * max pairwise overlap 0.000 — selection does not tolerate overlap, it
 * eliminates it — so scoring evolution against a ceiling computed at a
 * tolerance it never uses compares two different things. That mistake produced
 * one wrong headline already (30% against the true 64%).
 *
 * Ceilings from experiments/tau-zero-ceiling.js, re-run 2026-08-01 after the
 * head-cap fix and the switch to distribution-matched precision:
 *   L0  1     L1-free  6     L2  16
 */

const P = require("../sim/placement.js");
const K = require("../sim/packing.js");
const E = require("../sim/evolve.js");

const GENERATIONS = 400;
const N_START = 40;
const N_SAMP = 60;
const SEEDS = [1, 2, 3];

/* Precision the L1 arm is handed, measured off the morphology arm rather than
 * chosen, so the control cannot be beaten on sharpness instead of dimension. */
function measurePrecision() {
  const rng = E.makeRng(99);
  const sS = [],
    sP = [];
  for (let i = 0; i < 120; i++) {
    const f = E.toFlower(E.randomGenome(rng));
    const d = P.placementDistribution(f, P.DEFAULT_BEE, {
      n: N_SAMP,
      seed: 500 + i,
    });
    if (d.hits.length < 8) continue;
    sS.push(K.sSpread(d.hits));
    sP.push(K.phiSpread(d.hits));
  }
  const lo = (xs) => Math.min(...xs);
  const hi = (xs) => Math.max(...xs);
  /* The RANGE the real pool actually spans. L1 may evolve anywhere inside it —
   * as precise as the best real flower, never better. */
  return {
    sSd: K.median(sS),
    phiSd: K.median(sP),
    sMin: lo(sS),
    sMax: hi(sS),
    pMin: lo(sP),
    pMax: hi(sP),
  };
}

function survivorStats(state, arm) {
  const live = state.species.filter((s) => s.alive);
  if (live.length < 2) return { n: live.length, maxOv: 0, meanOv: 0 };
  const O = E.overlapMatrixOf(
    live.map((s) => s.sig),
    arm,
  );
  let mx = 0,
    sum = 0,
    cnt = 0;
  for (let i = 0; i < live.length; i++)
    for (let j = i + 1; j < live.length; j++) {
      const o = Math.max(O[i][j], O[j][i]);
      mx = Math.max(mx, o);
      sum += o;
      cnt++;
    }
  return { n: live.length, maxOv: mx, meanOv: sum / cnt };
}

function runArm(name, arm, ctx, seed) {
  const params = {
    arm,
    ctx: { ...ctx, seed: 1000 + seed * 97 },
    nSpecies: N_START,
    generations: GENERATIONS,
    sampleEvery: 100,
    k: 0.0005, // must sit well below n*O_ii at equilibrium — see fitnesses()
    mutRate: 0.03,
    extinctAt: 0.002,
    seed,
  };
  const { state, history } = E.run(params);
  return { ...survivorStats(state, arm), history, state };
}

function main() {
  const prec = measurePrecision();
  console.log(
    `L1 precision is HERITABLE, bounded by the real pool: s sd ${prec.sMin.toFixed(4)}-${prec.sMax.toFixed(4)}, ` +
      `phi sd ${prec.pMin.toFixed(4)}-${prec.pMax.toFixed(4)} rad\n` +
      `  (was a fixed median of ${prec.sSd.toFixed(4)} / ${prec.phiSd.toFixed(4)} — the deferred modelling choice, now decided)`,
  );
  console.log(
    `${N_START} species seeded at random, ${GENERATIONS} generations, ${SEEDS.length} replicate runs\n`,
  );

  const ctx = {
    bee: P.DEFAULT_BEE,
    nSamp: N_SAMP,
    sSd: prec.sSd,
    phiSd: prec.phiSd,
    sMin: prec.sMin,
    sMax: prec.sMax,
    pMin: prec.pMin,
    pMax: prec.pMax,
  };
  /* ⚠️ L1's CEILING IS NOW STALE and its "reached %" column is not meaningful.
   * 6 was computed when L1's precision was DRAWN from the pool's distribution;
   * with precision heritable, evolution drives it to the tight end, and tighter
   * placements pack more. L1 exceeding this bound is the bound being wrong, not
   * L1 beating a real limit — which is exactly the standing constraint that a
   * ceiling arm must be re-checked against the measured arm every time it is
   * used. The ADVANTAGE RATIO below is unaffected: it is measured/measured and
   * does not touch these constants. */
  const CEIL = { L2: 16, L1: 6, L0: 1 };

  console.log(
    "arm   ceiling   surviving species (per replicate)      mean    reached",
  );
  console.log("-".repeat(78));

  const out = {};
  for (const name of ["L0", "L1", "L2"]) {
    const runs = SEEDS.map((s) => runArm(name, E.ARMS[name], ctx, s));
    const ns = runs.map((r) => r.n);
    const mean = ns.reduce((a, b) => a + b, 0) / ns.length;
    out[name] = { runs, ns, mean };
    console.log(
      `${name.padEnd(5)} ${String(CEIL[name]).padStart(7)}   ` +
        `${ns.map((v) => String(v).padStart(3)).join(" ")}`.padEnd(36) +
        `${mean.toFixed(1).padStart(6)}   ${((100 * mean) / CEIL[name]).toFixed(0)}%`,
    );
  }

  console.log(
    "\nplacement separation among survivors (max pairwise overlap, seed 1):",
  );
  for (const name of ["L0", "L1", "L2"]) {
    const r = out[name].runs[0];
    console.log(
      `  ${name}: ${r.n} species, max pairwise overlap ${r.maxOv.toFixed(3)}, mean ${r.meanOv.toFixed(3)}`,
    );
  }

  console.log(
    "\ntrajectory of surviving species, seed 1 (axis-4 collapse check):",
  );
  console.log(
    "  gen   " +
      out.L2.runs[0].history.map((h) => String(h.gen).padStart(5)).join(""),
  );
  for (const name of ["L0", "L1", "L2"]) {
    console.log(
      `  ${name}    ` +
        out[name].runs[0].history
          .map((h) => String(h.alive).padStart(5))
          .join(""),
    );
  }

  console.log(
    "\nL0 is the negative control: with no placement, every species' pollen reaches\n" +
      "every stigma, so the community MUST collapse. If it does not, diversification\n" +
      "in the other arms is not being caused by placement.",
  );
}

main();
