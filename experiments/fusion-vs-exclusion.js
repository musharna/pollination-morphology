/*
 * fusion-vs-exclusion.js — what DECIDES whether a pair fuses or loses a lineage?
 *
 * ⚠️ THIS EXISTS BECAUSE THE LAST RUN'S ANSWER WAS NECESSARY BUT NOT SUFFICIENT.
 *
 * The gap-occupancy run showed intermediates arise and that they arise BEFORE
 * ancestry variance collapses (11/12 fused replicates, p = 0.0032). But it also
 * showed, and reported, that `one lost` replicates fill the gap too — peaking at
 * 0.43-0.67. So gap occupancy cannot be what decides the outcome.
 *
 * At d = 8 under strong rare-bias (a = 0.25) the SAME parameters give all three
 * outcomes across seeds. That is the arm to interrogate: the difference cannot be
 * a parameter, so it is either the dynamics or the founding draw.
 *
 * THREE HYPOTHESES, separated by different columns of one table:
 *
 *   H1 PARENTAGE   the gap fills in every outcome, but only in FUSED replicates
 *                  is it filled by HYBRIDS. Elsewhere the gap holds pure-lineage
 *                  plants whose placement drifted — geometry without gene flow.
 *   H2 RACE        whichever lineage drifts to minority first is excluded; fusion
 *                  happens only where gene flow starts before the imbalance runs
 *                  away. => early |ancMean - 0.5| / minority fraction separates.
 *   H3 FOUNDING    the outcome is set before the dynamics start, by the realised
 *                  separation and the founding spread. => a generation-0 quantity
 *                  separates, and the dynamics are epiphenomenal.
 *
 * H1 is the untraced link in the published explanation: the last run never showed
 * that gap occupants are the individuals actually moving genes. H3 is the null
 * that would make both dynamical stories decorative, so it is measured.
 *
 * ⚠️ EVERY PREDICTOR IS READ IN A WINDOW THAT ENDS BEFORE THE OUTCOME RESOLVES,
 * and the window is declared here rather than chosen after looking.
 */

const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");

const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const f3 = (x) =>
  x == null || Number.isNaN(x) ? "     - " : x.toFixed(3).padStart(7);

const SMOKE = process.env.FX_SMOKE === "1";
const N0 = SMOKE ? 12 : 30;
const GENS = SMOKE ? 6 : 35;
const SITE_N = SMOKE ? 50 : 160;
const D_EXCL = 8;
const A_RARE = 0.25;
/*
 * The windows in which predictors are read. BOTH ARE DECLARED HERE, BEFORE THE
 * FULL RUN, and both are reported — picking whichever one discriminated after
 * seeing the table would be the post-hoc failure this project has already
 * recorded once.
 *
 * ⚠️ THE SMOKE RUN IS WHY THERE ARE TWO. A window of 0..4 is safely before the
 * outcome resolves, but the PREVIOUS run measured mean T-gap at 10.3 — so a
 * five-generation window may sit entirely before the gap ever fills, and would
 * discriminate nothing for a reason that has nothing to do with the hypothesis.
 * The wider window ends at generation 8, below the mean T-anc of 13.1 measured
 * in THAT run. Its justification is prior data, not this run's outcome.
 */
const EARLY_WINDOWS = SMOKE ? [3] : [5, 9];
const EARLY = EARLY_WINDOWS[EARLY_WINDOWS.length - 1];
/* an individual counts as a hybrid at an ancestry fraction this far inside the
 * interior. Founders are exactly 0 or 1; an F1 is 0.5. Declared here. */
const HYB_LO = 0.15;
const HYB_HI = 0.85;
const N_SEEDS = SMOKE ? 3 : Number(process.env.FX_SEEDS || 40);
const SEEDS = Array.from({ length: N_SEEDS }, (_, i) => i + 1);
const PARTS = (process.env.FX_PARTS || "ABC").toUpperCase();
const optsAt = (extra = {}) => ({ ...I.DEFAULTS, siteN: SITE_N, ...extra });

if (SMOKE)
  console.log(
    "\n*** FX_SMOKE=1 — tiny configuration. Exercises the code path and the\n" +
      "*** reporting. THE NUMBERS BELOW ARE NOT RESULTS.\n",
  );

const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));
const placeOfGenome = (g) =>
  I.sitesOf([{ h1: g, h2: g }], optsAt(), 0).map(I.placementOf)[0];

/*
 * ⚠️ PER-PLANT GAP MEMBERSHIP, AND IT MUST NOT DRIFT FROM THE MODEL'S OWN
 * STATISTIC. `gapOccupancy` returns fractions, and this run needs to cross gap
 * membership with each plant's ancestry, which needs INDICES. Rather than trust
 * that this predicate stays in step with the model's, PART 0 asserts that the
 * fractions derived from these indices equal `I.gapOccupancy` EXACTLY, on real
 * traced clouds. If the model's predicate is ever edited, that anchor fails
 * rather than this experiment quietly measuring a different gap.
 */
function gapMembers(places, pA, pB, { ell = 1.3, core = 0.3 } = {}) {
  const gap = [];
  const coreA = [];
  const coreB = [];
  const d0 = I.dist(pA, pB);
  let n = 0;
  if (!(d0 > 0)) return { gap, coreA, coreB, n };
  for (let i = 0; i < places.length; i++) {
    const p = places[i];
    if (!p) continue;
    n++;
    const a = I.dist(p, pA);
    const b = I.dist(p, pB);
    if (a < core * d0) coreA.push(i);
    else if (b < core * d0) coreB.push(i);
    else if (a + b <= ell * d0) gap.push(i);
  }
  return { gap, coreA, coreB, n };
}

const isHyb = (x) => x != null && x > HYB_LO && x < HYB_HI;
const ancMean = (xs) => (xs.length ? mean(xs) : 0);

function fate(finalPop, ancVar0, extinct) {
  if (extinct || finalPop.length < 2) return "BOTH LOST";
  const v = I.ancestryVar(finalPop);
  const m = ancMean(finalPop.map((i) => i.anc || 0));
  if (v > 0.4 * ancVar0) return "HELD";
  if (m < 0.15 || m > 0.85) return "one lost";
  return "FUSED";
}

/* One traced replicate. `shuffleAnc` is the PART B control: it permutes the
 * ancestry labels within each generation, which destroys the parentage link
 * while leaving every placement and every fraction-in-gap untouched. */
function replicate(seed, { shuffleAnc = false, extra = {} } = {}) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, optsAt());
  if (!built) return null;
  const pA = placeOfGenome(built.gA);
  const pB = placeOfGenome(built.gB);
  if (!pA || !pB) return null;

  const ancVar0 = I.ancestryVar(built.pop);
  const spread0 = I.spreadOf(
    I.sitesOf(built.pop, optsAt(), 0).map(I.placementOf),
  );
  const out = I.run({
    n: N0,
    generations: GENS,
    seed,
    siteN: SITE_N,
    found: built.pop,
    trace: true,
    allocExponent: A_RARE,
    ...extra,
  });

  /* the permutation stream is its own, so the control cannot perturb the model */
  const prng = E.makeRng(seed + 90001);
  const rows = out.history.map((h) => {
    if (!h.places) return null;
    const m = gapMembers(h.places, pA, pB);
    let anc = h.anc || [];
    if (shuffleAnc) {
      anc = anc.slice();
      for (let i = anc.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        const t = anc[i];
        anc[i] = anc[j];
        anc[j] = t;
      }
    }
    const n = m.n || 1;
    const hybGap = m.gap.filter((i) => isHyb(anc[i])).length / n;
    const pureGap = m.gap.filter((i) => !isHyb(anc[i])).length / n;
    const hybAny = anc.filter(isHyb).length / n;
    return {
      gap: m.gap.length / n,
      hybGap,
      pureGap,
      hybAny,
      ancDev: Math.abs(ancMean(anc) - 0.5),
      minority: h.minorityFrac,
      ancVar: h.ancVar,
      _places: h.places,
      _pA: pA,
      _pB: pB,
    };
  });

  const early = rows.slice(0, EARLY).filter(Boolean);
  const col = (k) => mean(early.map((r) => r[k]).filter((x) => x != null));
  const live = rows.filter(Boolean);
  /* per-window aggregates, so PART A can report every declared window */
  const win = {};
  for (const W of EARLY_WINDOWS) {
    const w = rows.slice(0, W).filter(Boolean);
    const c = (k) => mean(w.map((r) => r[k]).filter((x) => x != null));
    win[W] = {
      gap: c("gap"),
      hybGap: c("hybGap"),
      pureGap: c("pureGap"),
      hybAny: c("hybAny"),
      ancDev: c("ancDev"),
      minority: c("minority"),
      /* measured, so "the window is pre-resolution" is a number not a claim */
      ancVarFrac: w.length ? w[w.length - 1].ancVar / (ancVar0 || 1) : null,
    };
  }
  return {
    seed,
    win,
    fate: fate(out.pop, ancVar0, out.extinct),
    realised: built.realised,
    spread0,
    ancVar0,
    ancVarEarlyFrac: early.length
      ? early[early.length - 1].ancVar / (ancVar0 || 1)
      : null,
    gapEarly: col("gap"),
    hybGapEarly: col("hybGap"),
    pureGapEarly: col("pureGap"),
    hybAnyEarly: col("hybAny"),
    ancDevEarly: col("ancDev"),
    minorityEarly: col("minority"),
    gapPeak: live.length ? Math.max(...live.map((r) => r.gap)) : null,
    rows,
  };
}

/* Difference in means with a deterministic permutation p-value. Two-sided. */
function permTest(a, b, seed = 7) {
  a = a.filter((x) => x != null && !Number.isNaN(x));
  b = b.filter((x) => x != null && !Number.isNaN(x));
  if (!a.length || !b.length) return { diff: null, p: null };
  const diff = mean(a) - mean(b);
  const all = a.concat(b);
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
    const d = mean(s.slice(0, a.length)) - mean(s.slice(a.length));
    if (Math.abs(d) >= Math.abs(diff) - 1e-12) ge++;
  }
  return { diff, p: (ge + 1) / (N + 1) };
}

console.log("=".repeat(100));
console.log(
  "Fusion vs exclusion: gap-filling is necessary but not sufficient — what is the rest?",
);
console.log("=".repeat(100));

// ========================================================================
// PART 0 — the anchor gate
// ========================================================================

rule("PART 0 — the anchor gate");

const PRE_ALLOC = [
  [0.6426076918656048, 3.0637323268730365, 0, 0],
  [0.8843517599890253, 3.6807972859897253, 0, 0],
  [0.8257455458521449, 3.61632994537921, 0, 0],
  [0.49249979315034653, 2.269042873658907, 0, 0],
  [0.6023262955018738, 2.172879959409133, 0, 0],
];
const goldenRun = (extra = {}) =>
  I.run({
    n: 12,
    generations: 5,
    seed: 3,
    siteN: 60,
    visits: 6000,
    ...extra,
  }).history.map((r) => [r.spread, r.separation, r.ancVar, r.unmated]);

const a1 =
  JSON.stringify(goldenRun({ trace: true })) === JSON.stringify(PRE_ALLOC);
console.log(
  `  1. traced model still reproduces the pre-alloc golden   ${a1 ? "ok" : "FAIL"}`,
);

/* ⚠️ THE TIE TO THE MODEL'S OWN PREDICATE, checked on real traced clouds. */
const probe = replicate(SEEDS[0]);
let tie = true;
let tieN = 0;
for (const r of (probe ? probe.rows : []).filter(Boolean)) {
  const g = I.gapOccupancy(r._places, r._pA, r._pB);
  const m = gapMembers(r._places, r._pA, r._pB);
  const n = m.n || 1;
  if (
    Math.abs(g.gap - m.gap.length / n) > 1e-12 ||
    Math.abs(g.coreA - m.coreA.length / n) > 1e-12 ||
    Math.abs(g.coreB - m.coreB.length / n) > 1e-12
  )
    tie = false;
  tieN++;
}
console.log(
  `  2. per-plant membership == I.gapOccupancy on ${String(tieN).padStart(2)} clouds  ${tie && tieN > 0 ? "ok" : "FAIL"}`,
);

/* ⚠️ THE HYBRID CLASSIFIER NEEDS BOTH SIGNS IN ONE CHECK. "no hybrids in the
 * gap" is a candidate ANSWER here, so a classifier hard-wired to zero would read
 * as a result. */
const hybNeg = [0, 1, 0, 1].filter(isHyb).length;
const hybPos = [0.5, 0.5, 0.25, 0.75].filter(isHyb).length;
console.log(
  `  3. classifier: pure founders ${hybNeg}/4, F1-like ${hybPos}/4        ${hybNeg === 0 && hybPos === 4 ? "ok" : "FAIL"}`,
);

/* ⚠️ THE PREDICTOR WINDOW MUST END BEFORE THE OUTCOME RESOLVES. */
if (probe)
  console.log(
    `  4. ancVar at gen ${EARLY} is ${f3(probe.ancVarEarlyFrac)} of founding (seed ${probe.seed}) — ` +
      `${probe.ancVarEarlyFrac > 0.4 ? "unresolved, ok" : "ALREADY RESOLVED"}`,
  );

let REPS = null;

// ========================================================================
// PART A — what separates the outcomes
// ========================================================================

if (PARTS.includes("A")) {
  rule(`PART A — predictors read over generations 0..${EARLY - 1}, by outcome`);

  REPS = SEEDS.map((s) => replicate(s)).filter(Boolean);
  const by = (f) => REPS.filter((r) => r.fate === f);
  const F = by("FUSED");
  const L = by("one lost");
  const H = by("HELD");

  console.log(
    `  n = ${REPS.length} seeds at d=${D_EXCL}, a=${A_RARE}: ` +
      `${H.length} HELD / ${F.length} FUSED / ${L.length} one lost / ` +
      `${by("BOTH LOST").length} both lost`,
  );
  console.log(
    `  mean ancVar at gen ${EARLY}: ${f3(mean(REPS.map((r) => r.ancVarEarlyFrac)))} of founding ` +
      `(the window is pre-resolution)`,
  );

  const PRED = [
    ["gap occupancy", "gap"],
    ["  of which HYBRID", "hybGap"],
    ["  of which pure", "pureGap"],
    ["hybrids anywhere", "hybAny"],
    ["|ancMean - 0.5|", "ancDev"],
    ["minority fraction", "minority"],
  ];
  /* BOTH declared windows are reported. Reporting only the one that separated
   * would be choosing the criterion after seeing the data. */
  for (const W of EARLY_WINDOWS) {
    console.log(
      `\n  === window: generations 0..${W - 1} — mean ancVar at gen ${W} is ` +
        `${f3(mean(REPS.map((r) => r.win[W].ancVarFrac)))} of founding ===`,
    );
    console.log(
      "  predictor               HELD   FUSED  oneLost    F-minus-L        p",
    );
    for (const [label, key] of PRED) {
      const a = F.map((r) => r.win[W][key]);
      const b = L.map((r) => r.win[W][key]);
      const t = permTest(a, b);
      console.log(
        `  ${label.padEnd(21)} ${f3(mean(H.map((r) => r.win[W][key])))} ${f3(mean(a))} ${f3(mean(b))}  ` +
          `${f3(t.diff)}    ${t.p == null ? "   -" : t.p.toFixed(4)}`,
      );
    }
  }
  /* NOT a predictor — it reads the whole run, i.e. partly after the outcome.
   * Reported because it is the quantity the previous run published. */
  const tp = permTest(
    F.map((r) => r.gapPeak),
    L.map((r) => r.gapPeak),
  );
  console.log(
    `\n  gap PEAK, whole run (NOT a predictor — post-outcome): HELD ${f3(mean(H.map((r) => r.gapPeak)))}` +
      `  FUSED ${f3(mean(F.map((r) => r.gapPeak)))}  oneLost ${f3(mean(L.map((r) => r.gapPeak)))}` +
      `  p ${tp.p == null ? " -" : tp.p.toFixed(4)}`,
  );
  console.log(
    "\n  ⚠️ p is a two-sided permutation test on the difference in means, 20k shuffles.",
  );
  console.log(
    "  ⚠️ Group sizes are small by construction — the arm was chosen BECAUSE it splits.",
  );
}

// ========================================================================
// PART B — the label-shuffle control
// ========================================================================

if (PARTS.includes("B")) {
  rule("PART B — control: permute ancestry labels, keep every placement");

  console.log(
    "  ⚠️ Destroys the parentage link and NOTHING else. Plain gap occupancy is\n" +
      "  arithmetically untouched; hybrid-gap occupancy must LOSE its\n" +
      "  discrimination, or it was never reading parentage.\n",
  );

  const sh = SEEDS.map((s) => replicate(s, { shuffleAnc: true })).filter(
    Boolean,
  );
  const F = sh.filter((r) => r.fate === "FUSED");
  const L = sh.filter((r) => r.fate === "one lost");
  for (const W of EARLY_WINDOWS) {
    console.log(`  --- window 0..${W - 1}`);
    for (const [label, key] of [
      ["gap occupancy", "gap"],
      ["  of which HYBRID", "hybGap"],
    ]) {
      const t = permTest(
        F.map((r) => r.win[W][key]),
        L.map((r) => r.win[W][key]),
      );
      console.log(
        `  ${label.padEnd(20)} FUSED ${f3(mean(F.map((r) => r.win[W][key])))}  oneLost ${f3(mean(L.map((r) => r.win[W][key])))}` +
          `   diff ${f3(t.diff)}   p ${t.p == null ? " -" : t.p.toFixed(4)}`,
      );
    }
  }
  console.log(
    "\n  ⚠️ The shuffle touches only the read-out, so the fates are the same\n" +
      "  replicates as PART A.",
  );
}

// ========================================================================
// PART C — is it decided at founding?
// ========================================================================

if (PARTS.includes("C")) {
  rule("PART C — H3: was the outcome set before the first generation?");

  const reps = REPS || SEEDS.map((s) => replicate(s)).filter(Boolean);
  const F = reps.filter((r) => r.fate === "FUSED");
  const L = reps.filter((r) => r.fate === "one lost");
  const H = reps.filter((r) => r.fate === "HELD");
  console.log(
    "  Generation-0 quantities only. If these separate the outcomes, the\n" +
      "  dynamical story is decoration.\n",
  );
  for (const [label, key] of [
    ["realised separation", "realised"],
    ["founding spread", "spread0"],
    ["founding ancVar", "ancVar0"],
  ]) {
    const t = permTest(
      F.map((r) => r[key]),
      L.map((r) => r[key]),
    );
    console.log(
      `  ${label.padEnd(20)} HELD ${f3(mean(H.map((r) => r[key])))}  FUSED ${f3(mean(F.map((r) => r[key])))}  ` +
        `oneLost ${f3(mean(L.map((r) => r[key])))}   p ${t.p == null ? " -" : t.p.toFixed(4)}`,
    );
  }
}

// ========================================================================
// PART D — the per-replicate pre-resolution window
// ========================================================================

/*
 * ⚠️ DECLARED BEFORE ANY FULL RESULT, AND HERE IS EXACTLY WHY IT EXISTS.
 *
 * A 2-seed TIMING run (no outcomes read) showed gap occupancy sitting at ~0
 * through generation 8 and peaking later. That is consistent with the previous
 * run's published mean T-gap of 10.3 — so BOTH fixed windows above may be
 * structurally incapable of seeing the mechanism, and would return "no signal"
 * for a reason that has nothing to do with the hypothesis. A fixed window that
 * cannot contain the process is a harness fault, not a negative result.
 *
 * So: give each replicate its OWN window, ending at ITS resolution generation —
 * the first at which ancVar falls to the fate threshold. Predictors are averaged
 * strictly BEFORE that generation, so nothing is read from a resolved run.
 *
 * ⚠️ THIS IS STILL WEAKER THAN THE FIXED WINDOWS and is reported as such: the
 * window length now varies with the replicate, and a replicate that resolves
 * late gets more generations to accumulate a signal. Length is reported per fate
 * so that confound is visible rather than buried.
 */
if (PARTS.includes("D")) {
  rule("PART D — per-replicate window, ending at that replicate's resolution");

  const reps = REPS || SEEDS.map((s) => replicate(s)).filter(Boolean);
  const withWin = reps.map((r) => {
    const live = r.rows.filter(Boolean);
    let T = live.findIndex((x) => x.ancVar <= 0.4 * r.ancVar0);
    if (T < 0) T = live.length;
    const w = live.slice(0, T);
    const c = (k) => mean(w.map((x) => x[k]).filter((x) => x != null));
    return {
      fate: r.fate,
      T,
      gap: c("gap"),
      hybGap: c("hybGap"),
      pureGap: c("pureGap"),
      ancDev: c("ancDev"),
    };
  });
  const F = withWin.filter((r) => r.fate === "FUSED");
  const L = withWin.filter((r) => r.fate === "one lost");
  const H = withWin.filter((r) => r.fate === "HELD");
  console.log(
    `  window length (generations): HELD ${f3(mean(H.map((r) => r.T)))}  ` +
      `FUSED ${f3(mean(F.map((r) => r.T)))}  oneLost ${f3(mean(L.map((r) => r.T)))}`,
  );
  console.log(
    "  ⚠️ If these lengths differ, the comparison below is confounded by exposure.\n",
  );
  console.log(
    "  predictor               HELD   FUSED  oneLost    F-minus-L        p",
  );
  for (const [label, key] of [
    ["gap occupancy", "gap"],
    ["  of which HYBRID", "hybGap"],
    ["  of which pure", "pureGap"],
    ["|ancMean - 0.5|", "ancDev"],
  ]) {
    const t = permTest(
      F.map((r) => r[key]),
      L.map((r) => r[key]),
    );
    console.log(
      `  ${label.padEnd(21)} ${f3(mean(H.map((r) => r[key])))} ${f3(mean(F.map((r) => r[key])))} ${f3(mean(L.map((r) => r[key])))}  ` +
        `${f3(t.diff)}    ${t.p == null ? "   -" : t.p.toFixed(4)}`,
    );
  }
}

console.log("");
