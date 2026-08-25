/*
 * v2-sweep — the paired budget sweep that docs/2026-08-01-v2-result.md reports
 * but that no committed code has ever been able to produce.
 *
 * PROVENANCE. The result document publishes a paired test at n=8 over 6,000-
 * and 18,000-visit bouts with 95% intervals. The committed runner
 * (experiments/v2.js) has SEEDS = [1, 2], a single visits: 3000, and computes
 * means only — no difference, no variance, no interval. That is not drift: an
 * exhaustive scan of all 655 objects in the repository finds "18000" in two
 * Markdown blobs and nowhere else, there are no dangling objects or stashes,
 * no file has ever been deleted, and at the tree of a9e45d4 — the single commit
 * that added BOTH the runner and the document — the repository contained no
 * confidence-interval code of any kind. The numbers were produced by a session
 * that was never committed. This script runs the design the document DESCRIBES
 * so that they can be checked rather than trusted.
 *
 * WHAT IS DELIBERATELY NOT FIXED HERE. sim/evolve.js draws the shared rng
 * inside loops over `live` (mutate at :367, demographic jitter at :399), and
 * extinction shrinks `live`, so two arms desynchronise the moment their
 * survivor counts differ — which is the very quantity being compared. That
 * breaks the document's stated invariant that "the only within-pair difference
 * is the transfer model". It is left alone on purpose: this run has to answer
 * "do the published numbers reproduce from the code as it stands", and
 * repairing the model in the same pass would confound that with "did the
 * repair move them". The repair is a separate change.
 *
 * L2 only. The document's paired table is the L2 comparison; L0 collapses to
 * one species under both evaluators and L1 is not what was reported.
 */

const P = require("../sim/placement.js");
const K = require("../sim/packing.js");
const E = require("../sim/evolve.js");

const SMOKE = !!process.env.SMOKE;

const N_START = 20;
const GENERATIONS = Number(process.env.GENERATIONS || (SMOKE ? 20 : 250));
const N_SAMP = 50;

const SEEDS = (process.env.SEEDS || (SMOKE ? "1,2" : "1,2,3,4,5,6,7,8"))
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((s) => Number.isFinite(s));

const BUDGETS = (process.env.BUDGETS || (SMOKE ? "600,1800" : "6000,18000"))
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((s) => Number.isFinite(s));

/* Same precision calibration as experiments/v2.js, so the two are comparable. */
function precision() {
  const rng = E.makeRng(99);
  const sS = [];
  const sP = [];
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

function survivors(state) {
  return state.species.filter((s) => s.alive).length;
}

/* Identical parameterisation to experiments/v2.js:run, with the visit budget
 * lifted out so it can be swept. */
function run(evalName, ctx, seed, visits, generations = GENERATIONS) {
  const arm = E.ARMS.L2;
  const { state } = E.run({
    arm,
    ctx: { ...ctx, seed: 1000 + seed * 97 },
    evaluate: evalName === "carryover" ? E.CARRYOVER : E.MEANFIELD,
    nSpecies: N_START,
    generations,
    sampleEvery: 1000,
    k: 0.0005,
    kc: 0.0002,
    groom: 0.12,
    visits,
    boutSeed: 400 + seed,
    mutRate: 0.03,
    extinctAt: 0.002,
    seed,
  });
  return survivors(state);
}

/*
 * POSITIVE CONTROL for the halving below.
 *
 * MEANFIELD.community/.invasion never read params.visits, so the mean-field
 * reference should be bit-identical across budgets and only needs running once
 * per seed. That is an assumption about someone else's module, so it gets
 * checked rather than asserted — if evolve.js ever starts consuming the budget
 * on the mean-field path, this fails loudly instead of silently pairing each
 * carryover arm against the wrong reference.
 */
function checkArmIgnoresBudget(
  ctx,
  seed,
  budgets,
  evalName = "meanfield",
  generations = GENERATIONS,
) {
  const lo = budgets[0];
  const hi = budgets[budgets.length - 1];
  const a = run(evalName, ctx, seed, lo, generations);
  const b = run(evalName, ctx, seed, hi, generations);
  if (a !== b) {
    throw new Error(
      `${evalName} arm is budget-sensitive (seed ${seed}: ${a} at ${lo} vs ` +
        `${b} at ${hi}). The one-reference-per-seed optimisation below is ` +
        `invalid; run the reference arm per budget.`,
    );
  }
  return a;
}

const T_CRIT = {
  1: 12.706205,
  2: 4.302653,
  3: 3.182446,
  4: 2.776445,
  5: 2.570582,
  6: 2.446912,
  7: 2.364624,
  8: 2.306004,
  9: 2.262157,
  10: 2.228139,
  11: 2.200985,
  12: 2.178813,
  13: 2.160369,
  14: 2.144787,
  15: 2.13145,
};
const Z_CRIT = 1.959964;

function interval(d) {
  const n = d.length;
  const mean = d.reduce((a, b) => a + b, 0) / n;
  if (n < 2) return { n, mean, sd: NaN, se: NaN };
  const varS = d.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
  const sd = Math.sqrt(varS);
  const se = sd / Math.sqrt(n);
  const t = T_CRIT[n - 1];
  if (t === undefined)
    throw new Error(`no t critical value tabulated for df=${n - 1}`);
  return {
    n,
    mean,
    sd,
    se,
    t: [mean - t * se, mean + t * se],
    z: [mean - Z_CRIT * se, mean + Z_CRIT * se],
  };
}

function main() {
  const ctx = { bee: P.DEFAULT_BEE, nSamp: N_SAMP, ...precision() };
  const f = (x) => (Number.isFinite(x) ? x.toFixed(3).padStart(7) : "    n/a");

  console.log(
    `L2 only · ${N_START} species seeded · ${GENERATIONS} generations · ` +
      `seeds [${SEEDS.join(",")}] · budgets [${BUDGETS.join(",")}]` +
      (SMOKE ? " · SMOKE" : ""),
  );
  console.log(
    "mean-field is the within-seed reference; diff = carryover - meanfield\n",
  );

  const ref = {};
  for (const s of SEEDS) ref[s] = checkArmIgnoresBudget(ctx, s, BUDGETS);
  console.log(
    `mean-field survivors   ${SEEDS.map((s) => String(ref[s]).padStart(3)).join(" ")}`,
  );

  const out = {
    generations: GENERATIONS,
    seeds: SEEDS,
    meanfield: ref,
    budgets: {},
  };

  for (const v of BUDGETS) {
    const car = SEEDS.map((s) => run("carryover", ctx, s, v));
    const diffs = SEEDS.map((s, i) => car[i] - ref[s]);
    const ci = interval(diffs);
    out.budgets[v] = { carryover: car, diffs, ci };
    console.log(`\nbudget ${v}`);
    console.log(
      `  carryover survivors  ${car.map((x) => String(x).padStart(3)).join(" ")}`,
    );
    console.log(
      `  paired diffs         ${diffs.map((x) => (x >= 0 ? `+${x}` : String(x)).padStart(3)).join(" ")}`,
    );
    console.log(`  mean ${f(ci.mean)}   sd ${f(ci.sd)}   se ${f(ci.se)}`);
    if (ci.t) {
      const exc = (iv) =>
        iv[1] < 0 || iv[0] > 0 ? "EXCLUDES 0" : "includes 0";
      console.log(
        `  t  (df=${ci.n - 1}, correct) [${f(ci.t[0])}, ${f(ci.t[1])}]  ${exc(ci.t)}`,
      );
      console.log(
        `  z  (as published)     [${f(ci.z[0])}, ${f(ci.z[1])}]  ${exc(ci.z)}`,
      );
    }
  }

  console.log(`\nJSON ${JSON.stringify(out)}`);
}

module.exports = {
  run,
  precision,
  checkArmIgnoresBudget,
  interval,
  T_CRIT,
  Z_CRIT,
  N_SAMP,
};

if (require.main === module) main();
