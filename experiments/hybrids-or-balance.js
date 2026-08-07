/*
 * hybrids-or-balance.js — is hybrid formation the CAUSE of fusion, or a
 * CONSEQUENCE of ancestry staying balanced? (closes the box left by #28)
 *
 * ⚠️ THE PREVIOUS RUN COULD NOT ANSWER THIS AND SAID SO. At d = 8 under
 * a = 0.25, fused replicates both form hybrids AND keep ancestry balanced, while
 * losing replicates do neither — the two move together in every seed, so no
 * observational window can order them. Without gene flow, imbalance grows
 * unopposed; with imbalance, there is soon nothing left to hybridise WITH. That
 * is a correlation no amount of extra seeds will break.
 *
 * So this run INTERVENES. Two manipulations, each with the same disturbance
 * applied without the mechanism:
 *
 *   HYB    force gene flow: replace J recruits with real F1s, built by crossing
 *          a pure-A parent with a pure-B parent using the model's own gamete().
 *          Creates hybrids REGARDLESS of whether the dynamics would have.
 *   BAL    force balance WITHOUT gene flow: replace J majority-lineage recruits
 *          with same-lineage offspring of MINORITY parents. Pushes composition
 *          back toward 50/50 and creates no hybrid at all.
 *   CLONE  the matched disturbance control: replace J recruits with same-lineage
 *          offspring of parents drawn the same way. Same number of individuals
 *          replaced, same construction machinery, same number of gamete() calls
 *          — and no gene flow and no rebalancing.
 *
 * PREDICTIONS, declared before the run:
 *   if hybrid formation is UPSTREAM  => HYB fuses more than CLONE; BAL does not.
 *   if balance is UPSTREAM           => BAL fuses more than CLONE; HYB does not.
 *   if they are one event            => both move together, and this run says so.
 *
 * ⚠️ TWO THINGS THIS DESIGN GETS RIGHT ON PURPOSE.
 *
 * 1. THE LOOP IS DRIVEN HERE RATHER THAN BY run(), because an intervention has
 *    to act BETWEEN generations. That is the reimplementation this project has
 *    been burned by once, so PART 0 asserts the NONE arm is BIT-IDENTICAL to
 *    I.run() over every history field. If this loop ever drifts from the model's,
 *    that anchor fails rather than the result quietly becoming fiction.
 *
 * 2. EVERY INTERVENTION DRAWS FROM ITS OWN RNG STREAM. If the manipulations
 *    consumed the model's stream, NONE and CLONE would differ for two reasons at
 *    once — the disturbance and a shifted stream — and no arm would be a control
 *    for any other.
 *
 * ⚠️ AND THE MANIPULATION CHECK IS NOT OPTIONAL. An intervention that did not
 * actually intervene is this project's recorded 4x bust ("inert ops"). HYB must
 * be shown to RAISE hybrid frequency and BAL to LOWER imbalance, measured, before
 * either arm's fate distribution means anything.
 */

const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");

const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const f3 = (x) =>
  x == null || Number.isNaN(x) ? "     - " : x.toFixed(3).padStart(7);

const SMOKE = process.env.HB_SMOKE === "1";
const N0 = SMOKE ? 12 : 30;
const GENS = SMOKE ? 6 : 35;
const SITE_N = SMOKE ? 50 : 160;
const D_EXCL = 8;
const A_RARE = 0.25;
const HYB_LO = 0.15;
const HYB_HI = 0.85;
/* dose: individuals replaced per generation, out of N0. Declared, not tuned. */
const J = Number(process.env.HB_J || 2);
const N_SEEDS = SMOKE ? 3 : Number(process.env.HB_SEEDS || 24);
/*
 * First seed, so a REPLICATION can draw draws disjoint from the ones that
 * generated the hypothesis. Defaults to 1, which is the only value any earlier
 * run used — every number in #29 reproduces unchanged, and the anchor gate says
 * so rather than leaving it to be assumed.
 */
const SEED0 = Number(process.env.HB_SEED0 || 1);
const SEEDS = Array.from({ length: N_SEEDS }, (_, i) => i + SEED0);
const ARMS = (process.env.HB_ARMS || "NONE,CLONE,HYB,BAL").split(",");
const optsAt = (extra = {}) => ({ ...I.DEFAULTS, siteN: SITE_N, ...extra });

if (SMOKE)
  console.log(
    "\n*** HB_SMOKE=1 — tiny configuration. Exercises the code path and the\n" +
      "*** reporting. THE NUMBERS BELOW ARE NOT RESULTS.\n",
  );

const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));
const isHyb = (x) => x != null && x > HYB_LO && x < HYB_HI;
const ancOf = (i) => (i.anc === undefined ? 0 : i.anc);
const isPureA = (i) => ancOf(i) <= HYB_LO;
const isPureB = (i) => ancOf(i) >= HYB_HI;

function fate(finalPop, ancVar0, extinct) {
  if (extinct || finalPop.length < 2) return "BOTH LOST";
  const v = I.ancestryVar(finalPop);
  const m = mean(finalPop.map(ancOf));
  if (v > 0.4 * ancVar0) return "HELD";
  if (m < 0.15 || m > 0.85) return "one lost";
  return "FUSED";
}

/* An offspring built exactly as step() builds one, but drawing from the
 * INTERVENTION stream so the model's own stream is untouched. */
function cross(a, b, irng, opts) {
  const gopts = {
    linkSignal: opts.linkSignal,
    signalMut: opts.signalMut,
    srng: irng,
  };
  return {
    h1: I.gamete(a, irng, opts.mutRate, gopts),
    h2: I.gamete(b, irng, opts.mutRate, gopts),
    anc: (ancOf(a) + ancOf(b)) / 2,
  };
}

const pickFrom = (xs, irng) => xs[Math.floor(irng() * xs.length)];

/* Returns the replacement individuals for one generation, or null when the arm
 * cannot act (e.g. HYB with one lineage already gone). A no-op is COUNTED, not
 * silently tolerated — an arm that mostly could not act is not a treatment. */
function replacements(arm, parents, pop, irng, opts) {
  const A = parents.filter(isPureA);
  const B = parents.filter(isPureB);
  if (arm === "HYB") {
    if (!A.length || !B.length) return null;
    return Array.from({ length: J }, () =>
      cross(pickFrom(A, irng), pickFrom(B, irng), irng, opts),
    );
  }
  if (arm === "CLONE") {
    /* same-lineage cross, drawn from whichever pure classes exist, so the
     * disturbance matches HYB in count and in gamete() calls but moves no genes
     * between lineages */
    const pool =
      A.length && B.length ? (irng() < 0.5 ? A : B) : A.length ? A : B;
    if (!pool.length) return null;
    return Array.from({ length: J }, () =>
      cross(pickFrom(pool, irng), pickFrom(pool, irng), irng, opts),
    );
  }
  if (arm === "BAL") {
    /* push composition back toward 50/50 using MINORITY parents only, creating
     * no hybrid: a same-lineage cross within the minority class */
    const nA = pop.filter(isPureA).length;
    const nB = pop.filter(isPureB).length;
    const minority = nA < nB ? A : B;
    if (!minority.length) return null;
    return Array.from({ length: J }, () =>
      cross(pickFrom(minority, irng), pickFrom(minority, irng), irng, opts),
    );
  }
  return null;
}

/*
 * The generation loop. `arm === "NONE"` must be bit-identical to I.run() — see
 * the anchor in PART 0.
 */
function drive(seed, arm) {
  const opts = optsAt({ allocExponent: A_RARE });
  /* founding consumes its OWN streams */
  const frng = E.makeRng(seed);
  const fsrng = I.signalRng(seed);
  const built = I.foundTwoLineages(N0, frng, fsrng, D_EXCL, opts);
  if (!built) return null;
  const ancVar0 = I.ancestryVar(built.pop);
  /*
   * ⚠️ THE LOOP'S STREAMS ARE FRESH FROM THE SEED, NOT THE POST-FOUNDING STATE.
   * run() builds its rng from the seed even when it is HANDED a `found`
   * population, so a loop that carried the founding stream forward would be a
   * different model. The anchor caught exactly this — it is the whole reason
   * driving the loop here is safe.
   */
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const irng = E.makeRng(seed + 50021);

  let pop = built.pop;
  const history = [];
  const trace = [];
  let extinct = false;
  let acted = 0;
  let couldNot = 0;

  for (let g = 0; g < GENS; g++) {
    if (pop.length < 2) {
      extinct = true;
      break;
    }
    const parents = pop;
    const out = I.step(pop, opts, rng, g, srng);
    pop = out.pop;
    history.push([
      out.spread,
      out.cluster ? out.cluster.separation : null,
      out.ancVar,
      out.unmated,
    ]);

    if (arm !== "NONE" && pop.length > J) {
      const reps = replacements(arm, parents, pop, irng, opts);
      if (reps) {
        /* replace J DISTINCT recruits chosen at random */
        const idx = new Set();
        while (idx.size < J) idx.add(Math.floor(irng() * pop.length));
        const next = pop.slice();
        [...idx].forEach((k, i) => (next[k] = reps[i]));
        pop = next;
        acted++;
      } else couldNot++;
    }
    trace.push({
      hybAny: pop.filter((i) => isHyb(ancOf(i))).length / pop.length,
      ancDev: Math.abs(mean(pop.map(ancOf)) - 0.5),
    });
  }
  return {
    seed,
    arm,
    history,
    fate: fate(pop, ancVar0, extinct),
    acted,
    couldNot,
    hybAny: mean(trace.map((t) => t.hybAny)),
    ancDev: mean(trace.map((t) => t.ancDev)),
  };
}

console.log("=".repeat(100));
console.log(
  "Hybrids or balance: which one CAUSES fusion? An intervention, because the two are correlated.",
);
console.log("=".repeat(100));

// ========================================================================
// PART 0 — the anchor gate
// ========================================================================

rule("PART 0 — the anchor gate");

/* ⚠️ THE LOAD-BEARING ANCHOR. This experiment drives the generation loop itself,
 * so it must be shown to BE the model's loop when it is not intervening. */
let ident = true;
let identN = 0;
for (const s of SEEDS.slice(0, 3)) {
  const mine = drive(s, "NONE");
  if (!mine) continue;
  const rng = E.makeRng(s);
  const srng = I.signalRng(s);
  const opts = optsAt({ allocExponent: A_RARE });
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  const theirs = I.run({
    n: N0,
    generations: GENS,
    seed: s,
    siteN: SITE_N,
    found: built.pop,
    allocExponent: A_RARE,
  }).history.map((r) => [r.spread, r.separation, r.ancVar, r.unmated]);
  if (JSON.stringify(mine.history) !== JSON.stringify(theirs)) ident = false;
  identN++;
}
console.log(
  `  1. NONE arm is bit-identical to I.run() on ${identN} seeds   ${ident && identN > 0 ? "ok" : "FAIL"}`,
);

/* ⚠️ THE SEED OFFSET MUST NOT HAVE MOVED THE ORIGINAL RUN. Its default is the
 * only value #29 ever used, so this asserts the construction rather than leaving
 * "it defaults to 1" as a claim in a comment. */
{
  const seedsAt = (s0) => Array.from({ length: N_SEEDS }, (_, i) => i + s0);
  const d = seedsAt(1);
  console.log(
    `  1b. seed offset: default -> [${d.slice(0, 3).join(",")}...], ` +
      `this run s0=${SEED0} -> [${SEEDS.slice(0, 3).join(",")}...]   ` +
      `${d[0] === 1 && d.length === N_SEEDS ? "ok" : "FAIL"}`,
  );
}

/* ⚠️ A CROSS BETWEEN LINEAGES MUST PRODUCE A HYBRID AND A CROSS WITHIN ONE MUST
 * NOT — both signs in one check, because "no hybrids appeared" is a candidate
 * ANSWER for the CLONE arm and a broken cross() would fake it. */
{
  const rng = E.makeRng(11);
  const srng = I.signalRng(11);
  const opts = optsAt();
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  const A = built.pop.filter(isPureA)[0];
  const B = built.pop.filter(isPureB)[0];
  const irng = E.makeRng(999);
  const between = cross(A, B, irng, opts);
  const within = cross(A, A, irng, opts);
  console.log(
    `  2. cross A×B anc=${between.anc.toFixed(2)} (hybrid ${isHyb(between.anc)}), ` +
      `A×A anc=${within.anc.toFixed(2)} (hybrid ${isHyb(within.anc)})   ` +
      `${isHyb(between.anc) && !isHyb(within.anc) ? "ok" : "FAIL"}`,
  );
}

// ========================================================================
// PART A — did the interventions actually intervene?
// ========================================================================

rule("PART A — MANIPULATION CHECK (an inert op is this project's 4x bust)");

const RES = {};
for (const arm of ARMS)
  RES[arm] = SEEDS.map((s) => drive(s, arm)).filter(Boolean);

console.log("  arm     acted/gen  couldNot   hybrids anywhere   |ancMean-0.5|");
for (const arm of ARMS) {
  const r = RES[arm];
  console.log(
    `  ${arm.padEnd(7)} ${f3(mean(r.map((x) => x.acted)))}  ${f3(mean(r.map((x) => x.couldNot)))}   ` +
      `${f3(mean(r.map((x) => x.hybAny)))}            ${f3(mean(r.map((x) => x.ancDev)))}`,
  );
}
console.log(
  "\n  ⚠️ HYB must RAISE hybrids-anywhere over CLONE, and BAL must LOWER\n" +
    "  |ancMean-0.5| over CLONE. If either fails, that arm is inert and its\n" +
    "  fate distribution below means nothing.",
);

// ========================================================================
// PART B — the outcome
// ========================================================================

rule("PART B — fate distribution by arm");

console.log("  arm      HELD  FUSED  oneLost  bothLost   fusion rate");
const rate = {};
for (const arm of ARMS) {
  const r = RES[arm];
  const c = (f) => r.filter((x) => x.fate === f).length;
  rate[arm] = r.length ? c("FUSED") / r.length : null;
  console.log(
    `  ${arm.padEnd(7)} ${String(c("HELD")).padStart(5)}${String(c("FUSED")).padStart(7)}` +
      `${String(c("one lost")).padStart(9)}${String(c("BOTH LOST")).padStart(10)}   ${f3(rate[arm])}`,
  );
}

/* two-sided permutation test on the difference in fusion RATE */
function permRate(a, b, seed = 13) {
  const A = a.map((x) => (x.fate === "FUSED" ? 1 : 0));
  const B = b.map((x) => (x.fate === "FUSED" ? 1 : 0));
  if (!A.length || !B.length) return { diff: null, p: null };
  const diff = mean(A) - mean(B);
  const all = A.concat(B);
  const rng = E.makeRng(seed);
  const N = SMOKE ? 200 : 20000;
  let ge = 0;
  for (let k = 0; k < N; k++) {
    const s = all.slice();
    for (let i = s.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = s[i];
      s[i] = s[j];
      s[j] = t;
    }
    if (
      Math.abs(mean(s.slice(0, A.length)) - mean(s.slice(A.length))) >=
      Math.abs(diff) - 1e-12
    )
      ge++;
  }
  return { diff, p: (ge + 1) / (N + 1) };
}

console.log(
  "\n  THE TWO PRE-DECLARED CONTRASTS, each against the matched control:",
);
for (const arm of ["HYB", "BAL"]) {
  if (!RES[arm] || !RES.CLONE) continue;
  const t = permRate(RES[arm], RES.CLONE);
  console.log(
    `    ${arm} vs CLONE   fusion ${f3(rate[arm])} vs ${f3(rate.CLONE)}   ` +
      `diff ${f3(t.diff)}   p ${t.p == null ? " -" : t.p.toFixed(4)}`,
  );
}
if (RES.CLONE && RES.NONE) {
  const t = permRate(RES.CLONE, RES.NONE);
  console.log(
    `    CLONE vs NONE (is the disturbance ITSELF doing it?)   diff ${f3(t.diff)}   ` +
      `p ${t.p == null ? " -" : t.p.toFixed(4)}`,
  );
}
console.log("");
