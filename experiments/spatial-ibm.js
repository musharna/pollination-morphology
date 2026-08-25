/*
 * spatial-ibm.js — the 2x2 registered in docs/2026-08-16-spatial-ibm-prereg.md.
 *
 * THE QUESTION. Five routes to the northstar are spent (roadmap :219) and the
 * table has a hole in it: spatial structure is the ONLY mechanism ever measured
 * to move the rare-morph barrier (0.26 -> 0.360, 2026-08-02), and it was
 * measured in the v1 harness, which has no inheritance, no recombination and no
 * hybrids. The IBM has all three and has been panmictic since the day it was
 * written. So the one route that worked has never been run in the model that can
 * speciate.
 *
 * ⚠️ WHAT WOULD MAKE THIS A NON-RESULT, stated before the numbers exist.
 * "Aggregation promotes coexistence" is canonical ecology. A run showing only
 * that two lineages persist longer when they clump is a restatement of Chesson
 * with flowers drawn on it. The registered claim is therefore about
 * DISTINCTNESS: HELD must rise WITHOUT FUSED rising. If they rise together the
 * lineages are persisting by merging, which is the opposite of a speciation
 * mechanism.
 *
 * ⚠️ THE BASELINE CELL IS NOT `space: null`. All four cells run with space ON,
 * differing only in the two kernel widths, so every cell consumes the random
 * stream identically and the differences between them are the mechanism. A
 * space-null baseline would differ from the others in the rng walk as well as
 * in the model, and no difference could be attributed. (`space: null` is still
 * asserted bit-identical to the pre-space model, in tests/spatial-ibm.test.js.)
 */

const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");

const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const f3 = (x) =>
  x == null || Number.isNaN(x) ? "     - " : x.toFixed(3).padStart(7);
const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));

const SMOKE = process.env.SP_SMOKE === "1";
const N0 = SMOKE ? 12 : 30;
const GENS = SMOKE ? 6 : 35;
const SITE_N = SMOKE ? 50 : 160;
/* the separation the exclusion result was established at */
const D_EXCL = 8;
const N_SEEDS = SMOKE ? 4 : Number(process.env.SP_SEEDS || 40);
const SEEDS = Array.from({ length: N_SEEDS }, (_, i) => i + 1);

/*
 * The kernel widths. Both are in RING UNITS, where the whole population spans
 * 1.0, and both are declared here rather than tuned against the outcome.
 *
 * FORAGE 0.06 puts roughly a tenth of the ring inside one standard deviation —
 * the animal works a neighbourhood rather than the patch. SEED 0.02 is tighter
 * than the forage kernel on purpose: seed disperses less far than a pollinator
 * flies, which is the usual situation in plants and is the whole reason a
 * neighbourhood can be a family.
 *
 * ⚠️ Whether these values actually PRODUCE kin structure is not assumed; it is
 * the positive control below, and the run refuses to report a comparison if the
 * clustering statistic does not separate.
 */
const FORAGE = 0.06;
const SEED = 0.02;

const CELLS = [
  ["global forage · global seed", Infinity, Infinity],
  ["local forage  · global seed", FORAGE, Infinity],
  ["global forage · limited seed", Infinity, SEED],
  ["local forage  · limited seed", FORAGE, SEED],
];
const INTERACTION = 3; // index of the cell where the mechanism should pay

if (SMOKE)
  console.log(
    "\n*** SP_SMOKE=1 — tiny configuration. Exercises the code path and the\n" +
      "*** reporting. THE NUMBERS BELOW ARE NOT RESULTS.\n",
  );

const optsAt = (extra = {}) => ({ ...I.DEFAULTS, siteN: SITE_N, ...extra });

/* ------------------------------------------------------------ one replicate */

function replicate(seed, forageRange, seedRange, randomMating) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const opts = optsAt({
    space: { forageRange, seedRange },
    randomMating,
  });
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  if (!built) return null;

  let pop = built.pop;
  const ancVar0 = I.ancestryVar(pop);
  const clustering = [];
  let extinct = false;
  /*
   * ⚠️⚠️ THE FIRST RUN KEPT ONLY THE FOUR-WAY LABEL AND THREW THE CONTINUOUS
   * QUANTITY AWAY. `fateOf` reduces the whole trajectory to HELD / one lost /
   * FUSED / BOTH LOST, and HELD came back 0/30 in every cell — which is a real
   * negative, but a CATEGORICAL one. It cannot distinguish "limited dispersal
   * did nothing" from "limited dispersal SLOWED exclusion without ever crossing
   * the 0.4 x ancVar0 threshold", and those are different biology.
   *
   * So the ratio ancVar(g) / ancVar0 is kept per generation, along with the
   * generation at which the ancestry mean first leaves the [0.15, 0.85] band
   * that `fateOf` calls "one lost". A retained ratio and a later loss time are
   * both continuous, both directional, and both able to move when the label
   * cannot.
   */
  const ancTrace = [];
  let lostAt = null;
  for (let g = 0; g < GENS; g++) {
    if (pop.length < 2) {
      extinct = true;
      break;
    }
    const res = I.step(pop, opts, rng, g, srng);
    /* ⚠️ Collected only while there IS ancestry variation to structure. Once a
     * lineage is lost the ratio is undefined, and averaging nulls in as 1 would
     * make a resolved run look unstructured. */
    if (res.ancNeighbour !== null) clustering.push(res.ancNeighbour);
    pop = res.pop;
    const vRel = ancVar0 > 1e-12 ? I.ancestryVar(pop) / ancVar0 : null;
    if (vRel !== null) ancTrace.push(vRel);
    /* ⚠️⚠️ THIS LATCHED, AND A LATCH IS THE WRONG SHAPE FOR THIS QUANTITY.
     * The first version set lostAt on the first excursion outside [0.15, 0.85]
     * and never cleared it, so a mean that wandered out and came BACK was
     * recorded as a permanent lineage loss — the smoke run printed "lost by gen
     * 3.3" beside a final mean of 0.750, which is inside the band. The field
     * said "time of loss" and measured "time of first excursion".
     *
     * `fateOf` classifies on the FINAL state, so the loss time that belongs
     * beside it is the start of the excursion THAT WAS STILL RUNNING at the
     * end. Clearing on re-entry gives exactly that, and leaves lostAt null for
     * a run that finished inside the band — which is the censored case. */
    const m = mean(pop.map((i) => (i.anc === undefined ? 0 : i.anc)));
    if (m < 0.15 || m > 0.85) {
      if (lostAt === null) lostAt = g + 1;
    } else {
      lostAt = null;
    }
  }

  /*
   * ⚠️⚠️ THE CROSS-SEED AVERAGE OF THIS CANCELS THE THING IT IS FOR.
   * Per run the final ancestry mean is BIMODAL: losing a lineage drives it to 0
   * or to 1 depending on WHICH lineage survived, and which one is arbitrary.
   * Averaging that across seeds sends 0 and 1 to 0.5 — which reads as "the
   * population is perfectly mixed", the exact opposite of "every run lost a
   * lineage". The smoke run printed 0.750 for three runs at 1.0 and one at 0.0.
   *
   * So the per-run number is FOLDED about the midpoint before it is ever
   * averaged. `skew` is 0 when the two lineages are balanced and 1 when one is
   * fixed, regardless of which — a magnitude, which is what the question asks
   * for, rather than a signed direction that has no meaning across seeds.
   */
  const ancMeanFinal = pop.length
    ? mean(pop.map((i) => (i.anc === undefined ? 0 : i.anc)))
    : null;
  const skew = ancMeanFinal === null ? null : Math.abs(ancMeanFinal - 0.5) * 2;

  return {
    seed,
    fate: I.fateOf(pop, ancVar0, extinct),
    /* the EARLY window, before outcomes resolve — clustering measured after a
     * lineage is already going extinct is measuring the extinction */
    clustering: mean(clustering.slice(0, Math.min(10, clustering.length))),
    /* the continuous readouts the categorical fate cannot express */
    ancRelFinal: ancTrace.length ? ancTrace[ancTrace.length - 1] : null,
    /*
     * ⚠️⚠️ "MID-RUN" SAMPLED A POPULATION THAT HAD RESOLVED THIRTEEN GENERATIONS
     * EARLIER. The first version took ancTrace[length/2] — the midpoint of the
     * ARRAY. But the run's own loss times say exclusion completes by about
     * generation 4 of 35, so the array midpoint sits at ~gen 17, long after
     * every arm has settled, and it read 0.000 in all four cells BY
     * CONSTRUCTION. A sampling point chosen by position in a buffer rather
     * than by where the dynamics live cannot see the dynamics.
     *
     * The contested window is the first few generations, so that is what is
     * sampled.
     */
    ancRelEarly: ancTrace.length ? mean(ancTrace.slice(0, 5)) : null,
    ancMeanFinal,
    skew,
    /* ⚠️ null means the lineage was NEVER lost inside GENS — that is the
     * RIGHT-CENSORED case and it must not be averaged in as if it were a
     * loss time, so the report counts censored runs separately. */
    lostAt,
    realised: built.realised,
  };
}

/* ------------------------------------------------------- paired bootstrap */

/*
 * Paired over SEEDS: every cell sees the same founding draws, so a difference
 * between cells is not a difference in which populations they happened to get.
 * Resampling is over seeds, which is the unit of independence.
 */
function pairedCI(a, b, statOf, B = 4000, seed = 99) {
  const n = a.length;
  if (n !== b.length || !n) return null;
  const rng = E.makeRng(seed);
  const point = statOf(a) - statOf(b);
  const draws = [];
  for (let k = 0; k < B; k++) {
    const ia = [],
      ib = [];
    for (let i = 0; i < n; i++) {
      const j = Math.floor(rng() * n);
      ia.push(a[j]);
      ib.push(b[j]);
    }
    draws.push(statOf(ia) - statOf(ib));
  }
  draws.sort((x, y) => x - y);
  return {
    point,
    lo: draws[Math.floor(0.025 * B)],
    hi: draws[Math.floor(0.975 * B)],
  };
}

const fracOf = (f) => (rows) =>
  rows.filter((r) => r.fate === f).length / rows.length;
const countOf = (f) => (rows) => rows.filter((r) => r.fate === f).length;
const excludes0 = (ci) => ci && (ci.lo > 0 || ci.hi < 0);

/*
 * ⚠️⚠️ A PAIRED BOOTSTRAP OVER A CONSTANT IS NOT A CONFIDENCE INTERVAL, AND THE
 * FIRST RUN PUBLISHED ONE.
 *
 * `pairedCI` resamples the observed pairs. When every pair is (0, 0) — which is
 * what happened: HELD came back 0 of 30 in all four cells — every resample is
 * necessarily (0, 0) and the interval collapses to [0.000, 0.000]. That width
 * is a fact about the SAMPLE BEING CONSTANT, not about the precision of the
 * estimate: it would print identically at n=3. Quoting it says "the effect is
 * zero to three decimal places" when the data support only "no HELD outcome
 * occurred in 30 seeds".
 *
 * The interval is not wrong, it is OUT OF ITS OPERATING RANGE — the bootstrap
 * cannot represent outcomes it never observed. So the reporting layer detects
 * the degeneracy and reports the exact binomial bound instead, which CAN
 * express boundary uncertainty about a statistic pinned at its floor.
 *
 * For k = 0 successes in n trials the exact one-sided upper bound at level a
 * solves (1-p)^n = a. At n=30, a=0.05 that is 9.50%.
 */
/*
 * ⚠️⚠️ THE FIRST VERSION OF THIS GUARD COULD NOT SEE ITS OWN REFERENT — caught
 * on the phenology branch, ported here.
 *
 * It asked whether the STATISTIC was constant. `pairedCI` resamples paired
 * DIFFERENCES, and a difference vector can be constant while the statistic
 * varies: if both arms score the outcome on exactly the SAME seeds, every
 * paired difference is 0 and the interval collapses to [0.000, 0.000] even
 * though the statistic is not constant anywhere. A guard written against the
 * statistic walks straight past that, which is the whole failure it exists to
 * catch — a predicate that does not fully observe what it is trusted for.
 *
 * The object the bootstrap resamples is the difference, so that is the object
 * the predicate tests.
 */
const degenerate = (a, b, statOf) => {
  const n = Math.min(a.length, b.length);
  if (!n) return true;
  const d = [];
  for (let i = 0; i < n; i++) d.push(statOf([a[i]]) - statOf([b[i]]));
  return d.every((x) => x === d[0]);
};
const zeroUpper = (n, alpha = 0.05) => 1 - Math.pow(alpha, 1 / n);
const allLower = (n, alpha = 0.05) => Math.pow(alpha, 1 / n);

const ciStr = (ci) =>
  ci
    ? `${ci.point >= 0 ? "+" : ""}${ci.point.toFixed(3)} [${ci.lo.toFixed(3)}, ${ci.hi.toFixed(3)}]`
    : "—";

/* the interval when it means something, the count and the exact bound when it
 * does not — never the degenerate interval on its own */
function contrastStr(a, b, statOf, label) {
  const ci = pairedCI(a, b, statOf);
  if (!degenerate(a, b, statOf)) return ciStr(ci);
  const k = a.filter((r) => statOf([r]) === 1).length;
  const n = a.length;
  return (
    `${k}/${n} vs ${b.filter((r) => statOf([r]) === 1).length}/${b.length} — ` +
    `⚠️ NO INTERVAL: ${label} is constant across every seed in both arms, so the\n` +
    `              bootstrap is degenerate. ` +
    (k === 0
      ? `Exact one-sided 95% upper bound on ${label}: ${(zeroUpper(n) * 100).toFixed(2)}%.`
      : `Exact one-sided 95% lower bound: ${(allLower(n) * 100).toFixed(2)}%.`)
  );
}

/* ---------------------------------------------------------------- the run */

function runArm(randomMating) {
  return CELLS.map(([, fr, sr]) =>
    SEEDS.map((s) => replicate(s, fr, sr, randomMating)).filter(Boolean),
  );
}

console.log(
  `spatial structure in the IBM — ${N_SEEDS} seeds/cell, n=${N0}, ` +
    `${GENS} generations, d=${D_EXCL}`,
);

rule("PART 1 — the 2x2, placement-mediated mating");
const arm = runArm(false);

console.log(
  "  cell                            HELD   FUSED  oneLost   clustering",
);
arm.forEach((rows, i) => {
  console.log(
    `  ${CELLS[i][0].padEnd(30)}${f3(fracOf("HELD")(rows))}${f3(
      fracOf("FUSED")(rows),
    )}${f3(fracOf("one lost")(rows))}   ${f3(mean(rows.map((r) => r.clustering)))}`,
  );
});

/* ---------------- the positive control, BEFORE any comparison is believed */

rule("PART 2 — did the intervention land? (the positive control)");

const clus = arm.map((rows) => mean(rows.map((r) => r.clustering)));
const globalSeedClus = mean([clus[0], clus[1]]);
const limitedSeedClus = mean([clus[2], clus[3]]);
console.log(
  `  ancestry clustering, global dispersal:  ${f3(globalSeedClus)}  (1.0 = no kin structure)`,
);
console.log(`  ancestry clustering, limited dispersal: ${f3(limitedSeedClus)}`);

const LANDED = limitedSeedClus < 0.9 && globalSeedClus > 0.9;
if (!LANDED) {
  console.log(
    "\n  ⚠️⚠️ NO RESULT. The dispersal kernels did not separate the clustering\n" +
      "  statistic, so the limited-dispersal arms are not actually more\n" +
      "  structured than the global ones. Every comparison below would be\n" +
      "  measuring an intervention that never landed — which is a broken\n" +
      "  harness, NOT evidence about biology. Registered in the prereg.",
  );
} else {
  console.log(
    "\n  ✅ the intervention landed: limited dispersal built kin structure.",
  );
}

/* --------------------------------------- the registered comparisons */

rule("PART 3 — the registered predictions");

const HELD = fracOf("HELD");
const FUSED = fracOf("FUSED");

const dHeld = pairedCI(arm[INTERACTION], arm[0], HELD);
const dFused = pairedCI(arm[INTERACTION], arm[0], FUSED);
console.log(
  `  H-spatial   HELD, local+limited vs baseline: ${contrastStr(arm[INTERACTION], arm[0], HELD, "HELD")}`,
);
console.log(
  `  H-distinct  FUSED, same contrast:            ${contrastStr(arm[INTERACTION], arm[0], FUSED, "FUSED")}`,
);

/*
 * ⚠️⚠️ THE CONTINUOUS READOUTS, BECAUSE THE LABEL CANNOT MOVE AND THEY CAN.
 * `fateOf` thresholds retained ancestry variance at 0.4 x ancVar0. If limited
 * dispersal slowed exclusion without ever clearing that line, HELD is 0 in both
 * arms and the categorical contrast is silent by construction. These three are
 * not: retained variance is continuous, and loss TIME is continuous even when
 * every run eventually resolves the same way.
 */
console.log(
  "\n  cell                          ancVar/ancVar0  ancVar/ancVar0   lineage skew  lost by gen",
);
console.log(
  "                                 (gens 1-5)        (final)       (0=even,1=fixed) (censored)",
);
arm.forEach((rows, i) => {
  const mid = rows.map((r) => r.ancRelEarly).filter((x) => x !== null);
  const fin = rows.map((r) => r.ancRelFinal).filter((x) => x !== null);
  const sk = rows.map((r) => r.skew).filter((x) => x !== null);
  const lost = rows.map((r) => r.lostAt).filter((x) => x !== null);
  const censored = rows.length - lost.length;
  console.log(
    `  ${CELLS[i][0].padEnd(30)}${f3(mean(mid))}          ${f3(mean(fin))}` +
      `        ${f3(mean(sk))}       ${lost.length ? mean(lost).toFixed(1) : "—"}` +
      `  (${censored}/${rows.length})`,
  );
});
console.log(
  "\n  ⚠️ 'lost by gen' averages ONLY the runs that resolved; the censored count is\n" +
    "     printed beside it because averaging a right-censored run as if it had been\n" +
    "     lost on the last generation would bias every arm toward the run length.",
);

/*
 * ⚠️⚠️ AND THE ONE COLUMN THAT MOVED NEEDS AN INTERVAL, OR IT IS JUST A NUMBER.
 * The first continuous run came back with loss time 3.6 in both LOCAL-foraging
 * cells against 4.1 in both global ones — the categorical fate was 0/38 HELD
 * everywhere, so this is the only quantity in the experiment that separated at
 * all. Quoting "3.6 against 4.1" as a finding would be exactly the sloppiness
 * the zero-width interval already cost this experiment once.
 *
 * ⚠️ NOTE THE DIRECTION BEFORE READING IT AS SUPPORT. A SHORTER loss time means
 * exclusion arrived SOONER. If local foraging is real here it ACCELERATES the
 * loss of a lineage — the opposite of the registered hypothesis, under which
 * giving a rare morph neighbours of its own kind should protect it.
 */
const lossTime = (rows) => {
  const v = rows.map((r) => r.lostAt).filter((x) => x !== null);
  return v.length ? mean(v) : 0;
};
/* ⚠️ the degeneracy check is not only for BINARY statistics — a continuous one
 * collapses the same way when every paired difference is identical, and loss
 * time does exactly that in cells where the intervention changes nothing. */
const flatOrCI = (a, b, statOf) =>
  degenerate(a, b, statOf)
    ? "⚠️ NO INTERVAL — every paired difference identical"
    : ciStr(pairedCI(a, b, statOf));

console.log("\n  loss time, paired against the global·global baseline:");
[1, 2, 3].forEach((i) => {
  console.log(
    `  ${CELLS[i][0].padEnd(30)}${flatOrCI(arm[i], arm[0], lossTime)}`,
  );
});
console.log(
  "  ⚠️ NEGATIVE means exclusion arrived EARLIER than baseline — against the\n" +
    "     registered direction, not for it.",
);

/*
 * ⚠️⚠️ THE LAST UNTESTED QUANTITY, AND IT IS THE ONE STILL SEPARATING.
 *
 * Loss time came back -0.421 [-1.053, 0.263] and -0.447 [-1.289, 0.421] — both
 * spanning zero, so "3.6 against 4.1" is not a finding. But retained ancestry
 * variance over the CONTESTED WINDOW (generations 1-5, where this model resolves)
 * separated in the same pattern and had no interval on it: 0.519 in both
 * global-foraging cells against 0.437 and 0.398 where foraging is local.
 *
 * It tracks FORAGING, not dispersal, in every readout that has moved at all —
 * which is itself worth stating, because limited dispersal is the half of the
 * intervention roadmap :530 actually argued for.
 *
 * ⚠️ AND THE SIGN IS AGAINST THE HYPOTHESIS. LESS retained variance means the
 * lineages collapsed toward one another FASTER. If this clears zero, local
 * foraging does not merely fail to rescue a rare morph — it costs it. That is a
 * different roadmap sentence from "no effect", so it gets a real interval
 * rather than an eyeball.
 */
const earlyVar = (rows) => {
  const v = rows.map((r) => r.ancRelEarly).filter((x) => x !== null);
  return v.length ? mean(v) : 0;
};
console.log(
  "\n  retained ancestry variance over gens 1-5, paired against global·global:",
);
[1, 2, 3].forEach((i) => {
  console.log(
    `  ${CELLS[i][0].padEnd(30)}${flatOrCI(arm[i], arm[0], earlyVar)}`,
  );
});
console.log(
  "  ⚠️ NEGATIVE means LESS ancestry variance retained than baseline — the\n" +
    "     lineages collapsed toward each other sooner, again against the\n" +
    "     registered direction.",
);

/* the interaction: does the pair pay more than the sum of its parts? */
const mainForage = HELD(arm[1]) - HELD(arm[0]);
const mainSeed = HELD(arm[2]) - HELD(arm[0]);
const both = HELD(arm[3]) - HELD(arm[0]);
console.log(
  `\n  local foraging alone:   ${f3(mainForage)}` +
    `\n  limited dispersal alone:${f3(mainSeed)}` +
    `\n  both together:          ${f3(both)}` +
    `\n  interaction (both - sum of parts): ${f3(both - mainForage - mainSeed)}`,
);

rule("PART 4 — the random-mating null");
const nullArm = runArm(true);
console.log(
  "  cell                            HELD   FUSED  oneLost   clustering",
);
nullArm.forEach((rows, i) => {
  console.log(
    `  ${CELLS[i][0].padEnd(30)}${f3(fracOf("HELD")(rows))}${f3(
      fracOf("FUSED")(rows),
    )}${f3(fracOf("one lost")(rows))}   ${f3(mean(rows.map((r) => r.clustering)))}`,
  );
});
const dHeldNull = pairedCI(nullArm[INTERACTION], nullArm[0], HELD);
console.log(
  `\n  HELD, local+limited vs baseline (null): ${contrastStr(nullArm[INTERACTION], nullArm[0], HELD, "HELD")}`,
);

/*
 * ⚠️ THE ASYMMETRY, STATED AS COUNTS RATHER THAN AS 1.000. Under
 * placement-mediated mating the cells resolve to "one lost"; under random
 * mating they resolve to FUSED. Both read 1.000 in the fraction columns, which
 * invites "the model ALWAYS does this" — but 30/30 supports a lower bound of
 * 90.5%, not a probability of one.
 */
console.log("\n  the two attractors, as counts:");
arm.forEach((rows, i) => {
  const nl = countOf("one lost")(rows);
  const nf = countOf("FUSED")(nullArm[i]);
  console.log(
    `  ${CELLS[i][0].padEnd(30)} placement-mated ${nl}/${rows.length} one lost` +
      `   ·   random-mated ${nf}/${nullArm[i].length} FUSED`,
  );
});
console.log(
  `\n  ⚠️ k/n = n/n gives an exact one-sided 95% LOWER bound of ` +
    `${(allLower(SEEDS.length) * 100).toFixed(1)}% at n=${SEEDS.length}, not 100%.`,
);

/* ------------------------------------------------------------- the verdict */

rule("VERDICT");

if (!LANDED) {
  console.log(
    "  NO RESULT — the positive control failed. See PART 2. Nothing below the\n" +
      "  control is interpretable and no verdict is issued.",
  );
} else if (degenerate(arm[INTERACTION], arm[0], HELD)) {
  /* ⚠️⚠️ THE CASE THE FIRST RUN GOT WRONG. HELD was constant across every seed
   * in both arms, the bootstrap returned [0.000, 0.000], and the verdict quoted
   * it as though a zero-width interval were a precise measurement. It is not a
   * measurement at all — it is what a bootstrap prints when it has nothing to
   * resample. The claim available here is a BOUND, and it is a bound on a LARGE
   * effect only. */
  const k = countOf("HELD")(arm[INTERACTION]);
  const n = arm[INTERACTION].length;
  console.log(
    `  ❌ NO LARGE EFFECT — and NO INTERVAL IS QUOTED, because none is available.\n` +
      `     HELD occurred ${k}/${n} times in local+limited and ` +
      `${countOf("HELD")(arm[0])}/${arm[0].length} in the baseline.\n` +
      `     The statistic is CONSTANT across every seed in both arms, so the paired\n` +
      `     bootstrap is degenerate: it would print [0.000, 0.000] at n=3 as readily\n` +
      `     as at n=${n}, and that width measures the sample being constant, not the\n` +
      `     precision of the estimate.\n\n` +
      (k === 0
        ? `     What the data DO support: an exact one-sided 95% upper bound of ` +
          `${(zeroUpper(n) * 100).toFixed(2)}% on\n` +
          `     the HELD probability at this configuration ` +
          `(${(zeroUpper(n, 0.05 / CELLS.length) * 100).toFixed(2)}% Bonferroni over ${CELLS.length} cells).\n` +
          `     That REFUTES A LARGE RESCUE and says nothing about a small one.\n`
        : "") +
      `     ⚠️ So read the CONTINUOUS columns in PART 3 before concluding the\n` +
      `     intervention did nothing: a mechanism that SLOWED exclusion without\n` +
      `     crossing the 0.4 x ancVar0 threshold is invisible to this label and\n` +
      `     visible in retained variance and loss time.\n` +
      "     The clustering DID happen (PART 2), so the intervention landed.",
  );
} else if (!excludes0(dHeld)) {
  console.log(
    "  ❌ REFUTED. Local foraging with limited dispersal does not raise HELD:\n" +
      `     ${ciStr(dHeld)} spans zero. The clustering DID happen (PART 2), so\n` +
      "     this is a fact about the mechanism rather than a failed intervention.",
  );
} else if (excludes0(dFused) && dFused.point > 0) {
  console.log(
    "  ⚠️ RESCUED BUT FUSED — INADMISSIBLE as a speciation mechanism.\n" +
      `     HELD moved ${ciStr(dHeld)} but FUSED moved with it, ${ciStr(dFused)}.\n` +
      "     The lineages persist by MERGING, which is the outcome the\n" +
      "     pre-registration named as refuting the distinctness claim.",
  );
} else if (excludes0(dHeldNull) && dHeldNull.point > 0) {
  console.log(
    "  ⚠️ DEMOTED TO DEMOGRAPHY. HELD rises in the RANDOM-MATING null too\n" +
      `     (${ciStr(dHeldNull)}), where placement cannot influence parentage.\n` +
      "     Whatever is happening is drift and demography under aggregation —\n" +
      "     canonical ecology — and not placement-mediated mating.",
  );
} else {
  console.log(
    "  ✅ ADMISSIBLE. HELD rises, FUSED does not, the clustering is measured\n" +
      "     rather than assumed, and the effect is absent from the\n" +
      "     random-mating null. ⚠️ Still to be read against the interaction in\n" +
      "     PART 3: a main effect as large as the interaction means the story\n" +
      "     told here — that the animal's neighbourhood must also be a family —\n" +
      "     is not the story the numbers support.",
  );
}
