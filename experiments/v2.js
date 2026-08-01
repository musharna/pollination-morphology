/*
 * v2 — carryover INSIDE the evolution loop.
 *
 * The carryover experiment showed that pollen riding across visits raises how
 * many species can coexist, but it asked that of FIXED genomes. This asks the
 * next question: does carryover change what species become?
 *
 * Two plausible opposite answers again. If a grain gets many chances to find
 * the right stigma, overlapping a rival is CHEAPER — so selection to diverge
 * should be weaker and species should stay closer together. But weaker
 * pressure to separate might also mean more of them fit. Whether the survivors
 * end up more numerous, less separated, or both is the measurement.
 *
 * The loop, the mutation operator and the demography are identical across
 * evaluators. Only the transfer model differs.
 */

const P = require("../sim/placement.js");
const K = require("../sim/packing.js");
const E = require("../sim/evolve.js");

const N_START = 20;
const GENERATIONS = 250;
const N_SAMP = 50;
const SEEDS = [1, 2];

function precision() {
  const rng = E.makeRng(99);
  const sS = [],
    sP = [];
  for (let i = 0; i < 100; i++) {
    const d = P.placementDistribution(
      E.toFlower(E.randomGenome(rng)),
      P.DEFAULT_BEE,
      {
        n: N_SAMP,
        seed: 500 + i,
      },
    );
    if (d.hits.length >= 8) {
      sS.push(K.sSpread(d.hits));
      sP.push(K.phiSpread(d.hits));
    }
  }
  return { sSd: K.median(sS), phiSd: K.median(sP) };
}

/* How separated did the survivors end up? Reported on the SAME mean-field
 * overlap metric for both evaluators, so the two are comparable — an
 * evaluator-specific measure would confound what evolved with how it is
 * scored. */
function separation(state, arm) {
  const live = state.species.filter((s) => s.alive);
  if (live.length < 2) return { n: live.length, meanOv: 0 };
  const O = E.overlapMatrixOf(
    live.map((s) => s.sig),
    arm,
  );
  let sum = 0,
    cnt = 0;
  for (let i = 0; i < live.length; i++)
    for (let j = 0; j < live.length; j++)
      if (i !== j) {
        sum += O[i][j];
        cnt++;
      }
  return { n: live.length, meanOv: sum / cnt };
}

function run(armName, evalName, ctx, seed) {
  const arm = E.ARMS[armName];
  const params = {
    arm,
    ctx: { ...ctx, seed: 1000 + seed * 97 },
    evaluate: evalName === "carryover" ? E.CARRYOVER : E.MEANFIELD,
    nSpecies: N_START,
    generations: GENERATIONS,
    sampleEvery: 1000,
    k: 0.0005,
    kc: 0.0002,
    groom: 0.12,
    visits: 3000,
    boutSeed: 400 + seed,
    mutRate: 0.03,
    extinctAt: 0.002,
    seed,
  };
  const { state } = E.run(params);
  return separation(state, arm);
}

function main() {
  const prec = precision();
  const ctx = { bee: P.DEFAULT_BEE, nSamp: N_SAMP, ...prec };
  console.log(
    `${N_START} species seeded, ${GENERATIONS} generations, ${SEEDS.length} replicates.\n` +
      `carryover arm: grooming 0.12, ${3000} visits per evaluation bout.\n`,
  );

  console.log(
    "arm    transfer model   surviving species   mean pairwise overlap",
  );
  console.log("-".repeat(70));
  const res = {};
  for (const armName of ["L0", "L1", "L2"]) {
    for (const ev of ["meanfield", "carryover"]) {
      const runs = SEEDS.map((s) => run(armName, ev, ctx, s));
      const ns = runs.map((r) => r.n);
      const mean = ns.reduce((a, b) => a + b, 0) / ns.length;
      const ov = runs.reduce((a, r) => a + r.meanOv, 0) / runs.length;
      res[`${armName}/${ev}`] = { mean, ov };
      console.log(
        `${armName.padEnd(6)} ${ev.padEnd(15)} ` +
          `${ns.map((v) => String(v).padStart(3)).join(" ")}  mean ${mean.toFixed(1).padStart(4)}` +
          `        ${ov.toFixed(4)}`,
      );
    }
  }

  console.log("\nwhat changed, L2:");
  const a = res["L2/meanfield"],
    b = res["L2/carryover"];
  console.log(`  species        ${a.mean.toFixed(1)} -> ${b.mean.toFixed(1)}`);
  console.log(`  mean overlap   ${a.ov.toFixed(4)} -> ${b.ov.toFixed(4)}`);
  console.log(
    "\n  A rise in species with a rise in overlap would mean carryover lets species\n" +
      "  pack in more tightly because missing is cheap. A rise with overlap still at\n" +
      "  zero would mean it changes who survives without changing how far apart\n" +
      "  selection pushes them.",
  );
}

main();
