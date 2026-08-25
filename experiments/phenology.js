/*
 * phenology.js — the 2026-08-16 pre-registration
 * (docs/2026-08-16-phenology-prereg.md), written before this file.
 *
 * THE QUESTION. Flowering time is the one assortment axis in this project that
 * is genuinely independent of placement — two plants that never flower together
 * cannot exchange pollen whatever their shapes are. Roadmap :536 has named it
 * since the mechanism list was written and nothing in sim/ implemented it.
 *
 * ⚠️ THE PRIMARY PREDICTION IS A NULL, WITH A MECHANISM. Under free
 * recombination a bloom allele is torn away from whatever placement allele it
 * arose beside within ONE generation. So a narrow season should sort the
 * population by WHEN IT FLOWERS while the placement genes shuffle straight
 * through the temporal barrier: assortment on an axis genuinely independent of
 * placement is assortment that cannot transmit TO placement.
 *
 * That is why the run measures whether the SEASON split separately from whether
 * the SHAPES did. "The season split and the shapes did not" is a far stronger
 * statement than "nothing happened", and collapsing the two into one null would
 * throw the actual result away.
 *
 * ⚠️ THE BASELINE IS A WIDE SEASON, NOT PHENOLOGY SWITCHED OFF. A null-phenology
 * baseline would differ from the treatment in the sliced-bout structure, the
 * carryover loss between slices and the random draws as well as in the
 * mechanism. `width: 1.0` — everything in flower in every slice — holds all of
 * that identical and removes only the assortment.
 */

const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");

const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const f3 = (x) =>
  x == null || Number.isNaN(x) ? "     - " : x.toFixed(3).padStart(7);
const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));

const SMOKE = process.env.PH_SMOKE === "1";
const N0 = SMOKE ? 12 : 30;
const GENS = SMOKE ? 6 : 35;
const SITE_N = SMOKE ? 50 : 160;
const D_EXCL = 8;
const SLICES = 8;
const WIDTH = 0.12;
const N_SEEDS = SMOKE ? 4 : Number(process.env.PH_SEEDS || 40);
const SEEDS = Array.from({ length: N_SEEDS }, (_, i) => i + 1);

/*
 * ⚠️⚠️ THE FIRST RUN HAD NO `wide + linked` CELL, AND WITHOUT IT THE LINKED ARM
 * BUNDLES TWO INTERVENTIONS.
 *
 * `linkBloom` does not only tie flowering time to the anther loci. It makes
 * antherT, angle and antherProject SEGREGATE TOGETHER off a single coin
 * (sim/ibm.js:287-289) where the free arm draws each independently. That is a
 * morphology-preserving supergene, and it can raise HELD on its own — retained
 * ancestry variance is exactly what co-segregating placement loci protect —
 * with flowering time contributing nothing at all.
 *
 * The published +0.289 was narrow+linked against wide+FREE, which differs in
 * BOTH the season width AND the recombination structure. The random-mating null
 * does not separate them either: it removes the transfer matrix, and both
 * candidate mechanisms act through the transfer matrix.
 *
 * So the design is a 2x2 and the registered contrast is the one that holds
 * linkage FIXED:  narrow+linked  -  wide+linked.
 */
const CELLS = [
  ["wide season (baseline)", { width: 1.0, slices: SLICES }],
  ["narrow · free recombination", { width: WIDTH, slices: SLICES }],
  ["narrow · linked (supergene)", { width: WIDTH, slices: SLICES, link: true }],
  [
    "wide · linked (the missing cell)",
    { width: 1.0, slices: SLICES, link: true },
  ],
  /*
   * ⚠️⚠️ THE CONFOUND ARM. A narrow season does two things: it ASSORTS mating by
   * flowering time — the hypothesis — and it SHRINKS the pool available on any
   * given day. At width 0.12 with n=30 that second effect leaves ~3.6
   * co-flowering plants against 30 in the baseline, and a mating pool that
   * small retains ancestry variance MECHANICALLY, with no need for flowering
   * time to correlate with lineage at all.
   *
   * `shuffleBloom` permutes the expressed schedules among plants every
   * generation. A permutation rather than a redraw, so the multiset of bloom
   * times is preserved exactly and the number of plants in flower in each slice
   * is identical to the narrow·free arm — the fragmentation is held fixed to
   * the individual — while WHO holds which schedule is randomised, destroying
   * the bloom-to-lineage association.
   *
   * narrow·free MINUS narrow·shuffled is therefore the effect of HERITABLE
   * temporal assortment with pool size controlled. If that contrast is flat,
   * the +0.237 was small mating pools and nothing more.
   */
  [
    "narrow · bloom SHUFFLED (confound)",
    { width: WIDTH, slices: SLICES, shuffleBloom: true },
  ],
];
const FREE = 1;
const LINKED = 2;
const WIDE_LINKED = 3;
const SHUFFLED = 4;

if (SMOKE)
  console.log(
    "\n*** PH_SMOKE=1 — tiny configuration. Exercises the code path and the\n" +
      "*** reporting. THE NUMBERS BELOW ARE NOT RESULTS.\n",
  );

const optsAt = (extra = {}) => ({ ...I.DEFAULTS, siteN: SITE_N, ...extra });

/*
 * ⚠️⚠️ THE STATISTIC THIS REPLACES MAXIMISED ON FIXATION.
 *
 * `seasonSplit` was largest-ring-gap / mean-spacing, and it was reported under a
 * column called "seasonSplit" in a design whose entire point was to measure
 * whether the SEASON split separately from whether the SHAPES did. Fed known
 * distributions it returned: uniform 4.6, two tight clusters — an actual split —
 * 19.9, and ONE tight cluster — total fixation — 39.9. It is monotone in how
 * concentrated the population is, so a collapsed bloom distribution outscores a
 * genuine two-way split by a factor of two. The published ordering (wide 14.691
 * above narrow 12.711) most likely says the neutral bloom allele drifted toward
 * fixation in the arm where nothing selected on it — the opposite of the reading
 * the column invited.
 *
 * The right instrument is the pair of CIRCULAR MOMENTS, because one number
 * cannot separate three cases and two can. With unit vectors at angle 2*pi*bloom:
 *
 *     R1 = |mean of the vectors|         R2 = |mean at DOUBLE the angle|
 *
 *     fixation (one cluster)   R1 ~ 1   R2 ~ 1
 *     even scatter             R1 ~ 0   R2 ~ 0
 *     TWO OPPOSED CLUSTERS     R1 ~ 0   R2 ~ 1     <- the split, and only this
 *
 * R1 alone cannot tell a split from a scatter — two opposed clusters CANCEL. R2
 * alone cannot tell a split from fixation. Together they identify all three,
 * which is why both are reported and neither is quoted on its own.
 */
function bloomMoments(blooms) {
  if (!blooms || blooms.length < 4) return null;
  const n = blooms.length;
  let c1 = 0,
    s1 = 0,
    c2 = 0,
    s2 = 0;
  for (const b of blooms) {
    const a = 2 * Math.PI * b;
    c1 += Math.cos(a);
    s1 += Math.sin(a);
    c2 += Math.cos(2 * a);
    s2 += Math.sin(2 * a);
  }
  return {
    R1: Math.hypot(c1 / n, s1 / n),
    R2: Math.hypot(c2 / n, s2 / n),
  };
}

function replicate(seed, phen, randomMating) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const brng = I.bloomRng(seed);
  const opts = optsAt({ phenology: phen, randomMating });
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  if (!built) return null;

  let pop = built.pop;
  const ancVar0 = I.ancestryVar(pop);
  const assort = [];
  const r1 = [];
  const r2 = [];
  const lineage = [];
  let extinct = false;
  for (let g = 0; g < GENS; g++) {
    if (pop.length < 2) {
      extinct = true;
      break;
    }
    const res = I.step(pop, opts, rng, g, srng, brng);
    if (res.bloomAssort != null) assort.push(res.bloomAssort);
    /* ⚠️ the positive control for the SHUFFLED arm specifically — bloomAssort
     * is blind to it, because a permutation leaves assortment on expressed
     * time untouched and only breaks the tie to ancestry */
    if (res.bloomLineage != null) lineage.push(res.bloomLineage);
    const m = bloomMoments(res.blooms);
    if (m != null) {
      r1.push(m.R1);
      r2.push(m.R2);
    }
    pop = res.pop;
  }
  return {
    seed,
    fate: I.fateOf(pop, ancVar0, extinct),
    assort: mean(assort),
    /* ⚠️ EARLY, not late. Once a lineage is lost there is no ancestry variation
     * left for flowering time to be associated WITH, so a late window measures
     * the resolution rather than the association. */
    lineage: lineage.length ? mean(lineage.slice(0, 10)) : null,
    /* the LAST few generations — the bloom distribution settles over time */
    R1: mean(r1.slice(-5)),
    R2: mean(r2.slice(-5)),
  };
}

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
const HELD = fracOf("HELD");
const FUSED = fracOf("FUSED");
const excludes0 = (ci) => ci && (ci.lo > 0 || ci.hi < 0);

/*
 * ⚠️⚠️ A PAIRED BOOTSTRAP OVER A CONSTANT IS NOT A CONFIDENCE INTERVAL.
 * `pairedCI` resamples the observed pairs, so when the statistic is identical
 * in every seed of both arms every resample is identical too and the interval
 * collapses to [0.000, 0.000] — at n=3 exactly as readily as at n=30. That
 * width reports the SAMPLE BEING CONSTANT, not the precision of the estimate.
 * The spatial run published one of these as though it were a tight refutation.
 *
 * For k = 0 successes in n trials the exact one-sided upper bound at level a
 * solves (1-p)^n = a; at n=30, a=0.05 that is 9.50%.
 *
 * ⚠️ KNOWN DUPLICATE of the same guard in experiments/spatial-ibm.js, which
 * lives on another branch. This project has already been bitten by experiments
 * carrying byte-identical copies of a helper that then diverge silently, so
 * these two must be single-sourced when the branches merge — deliberately not
 * done here, because introducing a shared module across two unmerged branches
 * is a worse hazard than one flagged copy.
 */
/*
 * ⚠️⚠️ AND THE FIRST VERSION OF THIS GUARD COULD NOT SEE ITS OWN REFERENT.
 * It asked whether the STATISTIC was constant. But `pairedCI` resamples paired
 * DIFFERENCES, and a difference vector can be constant while the statistic
 * varies — if both arms score HELD on exactly the same seeds, every paired
 * difference is 0 and the interval collapses even though HELD is not constant
 * anywhere. The smoke run walked straight through the guard and printed
 * "+0.000 [0.000, 0.000]" for precisely that reason.
 *
 * The object the bootstrap resamples is the difference, so that is the object
 * the predicate has to test.
 */
const degenerate = (a, b, statOf) => {
  const n = Math.min(a.length, b.length);
  if (!n) return true;
  const d = [];
  for (let i = 0; i < n; i++) d.push(statOf([a[i]]) - statOf([b[i]]));
  return d.every((x) => x === d[0]);
};
const zeroUpper = (n, alpha = 0.05) => 1 - Math.pow(alpha, 1 / n);

const ciStr = (ci) =>
  ci
    ? `${ci.point >= 0 ? "+" : ""}${ci.point.toFixed(3)} [${ci.lo.toFixed(3)}, ${ci.hi.toFixed(3)}]`
    : "—";

/* the interval when it means something; the count and the exact bound when the
 * bootstrap has nothing to resample */
function contrastStr(a, b, statOf, label) {
  if (!degenerate(a, b, statOf)) return ciStr(pairedCI(a, b, statOf));
  const k = a.filter((r) => statOf([r]) === 1).length;
  const j = b.filter((r) => statOf([r]) === 1).length;
  const same = k === j;
  return (
    `${k}/${a.length} vs ${j}/${b.length} — ⚠️ NO INTERVAL (` +
    (same && k === 0
      ? `${label} never occurred in either arm; exact 95% upper bound ` +
        `${(zeroUpper(a.length) * 100).toFixed(2)}%`
      : same
        ? `every paired difference is identical — the two arms score ${label} on the ` +
          `SAME seeds, so the bootstrap has nothing to resample`
        : `every paired difference is identical`) +
    ")"
  );
}

console.log(
  `flowering time in the IBM — ${N_SEEDS} seeds/cell, n=${N0}, ` +
    `${GENS} generations, ${SLICES} slices, d=${D_EXCL}`,
);

rule("PART 1 — the cells, placement-mediated mating");
const arm = CELLS.map(([, p]) =>
  SEEDS.map((s) => replicate(s, p, false)).filter(Boolean),
);
console.log(
  "  cell                              HELD   FUSED  oneLost  assort    R1     R2   bloom",
);
arm.forEach((rows, i) => {
  const R1 = mean(rows.map((r) => r.R1));
  const R2 = mean(rows.map((r) => r.R2));
  /* ⚠️ the reading is printed BESIDE the numbers rather than left to the
   * reader, because the whole failure this replaces was a number being read
   * as a word it did not mean */
  const reading = R1 > 0.5 ? "CONCENTRATED" : R2 > 0.5 ? "SPLIT" : "scattered";
  console.log(
    `  ${CELLS[i][0].padEnd(32)}${f3(HELD(rows))}${f3(FUSED(rows))}${f3(
      fracOf("one lost")(rows),
    )}  ${f3(mean(rows.map((r) => r.assort)))} ${f3(R1)}${f3(R2)}  ${reading}`,
  );
});
console.log(
  "\n  ⚠️ R1 = mean resultant length, R2 = the same at double angle. Fixation is\n" +
    "     (R1~1, R2~1); an even scatter (R1~0, R2~0); TWO OPPOSED FLOWERING GROUPS\n" +
    "     (R1~0, R2~1). Neither number means anything alone — R1 cannot tell a\n" +
    "     split from a scatter because opposed clusters CANCEL, and R2 cannot tell\n" +
    "     a split from fixation. The replaced statistic scored fixation ABOVE a\n" +
    "     genuine split and was quoted as if large meant split.",
);

rule("PART 2 — did the intervention land? (the positive control)");
const aWide = mean(arm[0].map((r) => r.assort));
const aNarrow = mean(
  arm[FREE].map((r) => r.assort).concat(arm[LINKED].map((r) => r.assort)),
);
console.log(
  `  pollen assortment by flowering time, wide season:   ${f3(aWide)}`,
);
console.log(
  `  pollen assortment by flowering time, narrow season: ${f3(aNarrow)}`,
);
const LANDED = aNarrow < 0.9 && aWide > 0.9;

/*
 * ⚠️⚠️ AND THE SHUFFLED ARM NEEDS ITS OWN CONTROL, BECAUSE THE ONE ABOVE CANNOT
 * SEE IT. `assort` measures whether pollen moves between plants close in
 * EXPRESSED flowering time — and a permutation leaves that untouched, so the
 * shuffled arm assorts exactly as hard as its control and PART 2 would report
 * the manipulation as having landed whether it ran or not.
 *
 * What the shuffle destroys is the tie between flowering time and ANCESTRY.
 * bloomLineage is mean bloom distance within a lineage over the all-pairs mean:
 * below 1 means relatives flower together, and a permutation should send it to
 * 1. If it does NOT separate, the confound arm never ran and the contrast below
 * is measuring nothing.
 */
const lnFree = mean(arm[FREE].map((r) => r.lineage).filter((x) => x != null));
const lnShuf = mean(
  arm[SHUFFLED].map((r) => r.lineage).filter((x) => x != null),
);
console.log(
  `\n  bloom-lineage association, narrow·free:     ${f3(lnFree)}  (<1 = relatives flower together)`,
);
console.log(`  bloom-lineage association, narrow·shuffled: ${f3(lnShuf)}`);
const SHUF_LANDED = lnFree < 0.99 && lnShuf > lnFree;
console.log(
  SHUF_LANDED
    ? "  ✅ the shuffle landed: permuting the schedules removed the tie between\n" +
        "     flowering time and lineage while leaving assortment on expressed time."
    : "  ⚠️⚠️ THE SHUFFLE DID NOT LAND — either heritable bloom shows no lineage\n" +
        "     association to begin with, or permuting did not remove it. The confound\n" +
        "     contrast below is NOT interpretable.",
);
console.log(
  LANDED
    ? "\n  ✅ the season is assorting pollen: narrow windows move pollen between\n" +
        "  plants closer in flowering time than chance."
    : "\n  ⚠️⚠️ NO RESULT. The flowering windows did not separate the assortment\n" +
        "  statistic, so the narrow arms are not actually assorting anything.\n" +
        "  Every comparison below would be measuring an intervention that never\n" +
        "  landed — a broken harness, NOT evidence about biology.",
);

rule("PART 3 — the registered predictions");
const dFree = pairedCI(arm[FREE], arm[0], HELD);
/* ⚠️⚠️ THE CONTRAST THAT HOLDS LINKAGE FIXED. `dLinkOld` is what the first run
 * published — narrow+linked against wide+FREE — and it moves BOTH the season
 * width and the recombination structure at once, so it cannot say which one
 * did the work. `dLink` is the registered one. */
const dLink = pairedCI(arm[LINKED], arm[WIDE_LINKED], HELD);
const dLinkOld = pairedCI(arm[LINKED], arm[0], HELD);
const dLinkF = pairedCI(arm[LINKED], arm[WIDE_LINKED], FUSED);
/* the linkage MAIN effect: does co-segregating the anther loci raise HELD with
 * the season held WIDE — i.e. with phenology contributing nothing? */
const dLinkMain = pairedCI(arm[WIDE_LINKED], arm[0], HELD);
/* ⚠️ THE CONFOUND CONTRAST: heritable narrow season against a narrow season
 * whose schedules are permuted. Same pool size to the individual; the only
 * difference is whether flowering time tracks lineage. */
const dPool = pairedCI(arm[FREE], arm[SHUFFLED], HELD);

console.log(
  `  H-free    HELD, narrow+free   vs wide+free:   ${contrastStr(arm[FREE], arm[0], HELD, "HELD")}`,
);
console.log(
  `  H-link    HELD, narrow+linked vs WIDE+LINKED: ${contrastStr(arm[LINKED], arm[WIDE_LINKED], HELD, "HELD")}   <- registered`,
);
console.log(
  `            FUSED, same contrast:               ${contrastStr(arm[LINKED], arm[WIDE_LINKED], FUSED, "FUSED")}`,
);
console.log(
  `\n  LINKAGE MAIN EFFECT, wide+linked vs wide+free: ${contrastStr(arm[WIDE_LINKED], arm[0], HELD, "HELD")}`,
);
console.log(
  `\n  ⚠️⚠️ THE CONFOUND CONTRAST — pool size held fixed, heritability destroyed:\n` +
    `  H-pool    HELD, narrow+free vs narrow+SHUFFLED: ${contrastStr(arm[FREE], arm[SHUFFLED], HELD, "HELD")}\n` +
    `            (narrow+shuffled alone vs wide baseline: ${contrastStr(arm[SHUFFLED], arm[0], HELD, "HELD")})`,
);
console.log(
  `  (for comparison, the contrast the first run published,\n` +
    `   narrow+linked vs wide+FREE, which confounds the two: ${ciStr(dLinkOld)})`,
);

/* the 2x2 interaction: does the pair pay more than the sum of its parts? */
const mFree = HELD(arm[FREE]) - HELD(arm[0]);
const mLink = HELD(arm[WIDE_LINKED]) - HELD(arm[0]);
const mBoth = HELD(arm[LINKED]) - HELD(arm[0]);
console.log(
  `\n  narrow season alone:  ${f3(mFree)}` +
    `\n  linkage alone:        ${f3(mLink)}` +
    `\n  both together:        ${f3(mBoth)}` +
    `\n  interaction (both - sum of parts): ${f3(mBoth - mFree - mLink)}`,
);

const bWide = mean(arm[0].map((r) => r.R1));
const bFree = mean(arm[FREE].map((r) => r.R1));
const bWide2 = mean(arm[0].map((r) => r.R2));
const bFree2 = mean(arm[FREE].map((r) => r.R2));
console.log(
  `\n  bloom distribution: wide (R1 ${f3(bWide)}, R2 ${f3(bWide2)})` +
    ` · narrow+free (R1 ${f3(bFree)}, R2 ${f3(bFree2)})`,
);

rule("PART 4 — the random-mating null, on the linked arm");
const nullLinked = SEEDS.map((s) =>
  replicate(s, CELLS[LINKED][1], true),
).filter(Boolean);
const nullBase = SEEDS.map((s) => replicate(s, CELLS[0][1], true)).filter(
  Boolean,
);
const dNull = pairedCI(nullLinked, nullBase, HELD);
console.log(
  `  HELD, narrow+linked vs baseline (random mating): ${ciStr(dNull)}`,
);

rule("VERDICT");

if (!LANDED) {
  console.log(
    "  NO RESULT — the positive control failed. See PART 2. Nothing below the\n" +
      "  control is interpretable and no verdict is issued.",
  );
} else if (!excludes0(dLink)) {
  /* ⚠️ THE BLOOM DISTRIBUTION IS DESCRIBED, NOT ADJUDICATED. The statistic this
   * branch used to consult scored FIXATION above a genuine split, so it could
   * not support either "the season split" or "the season did not". R1/R2 can,
   * and the reading is stated only where the two moments agree on one. */
  const wideR =
    bWide > 0.5 ? "CONCENTRATED" : bWide2 > 0.5 ? "SPLIT" : "scattered";
  const freeR =
    bFree > 0.5 ? "CONCENTRATED" : bFree2 > 0.5 ? "SPLIT" : "scattered";
  console.log(
    "  ❌ REFUTED — temporal assortment does not reach placement.\n" +
      `     Free recombination: ${ciStr(dFree)}. Linked (vs wide+linked): ${ciStr(dLink)}.\n` +
      "     Both span zero, and the assortment DID happen (PART 2), so this is\n" +
      "     a fact about the mechanism rather than a failed intervention.",
  );
  console.log(
    freeR === "SPLIT" && wideR !== "SPLIT"
      ? "\n  ⚠️⚠️ AND THIS IS THE INFORMATIVE HALF, not a consolation. The SEASON\n" +
          `     went to TWO OPPOSED FLOWERING GROUPS (R1 ${f3(bFree)}, R2 ${f3(bFree2)})\n` +
          `     against ${wideR} in the baseline, while the SHAPES did not move.\n` +
          "     The population sorted itself on the axis under selection and the\n" +
          "     placement genes shuffled straight through the temporal barrier —\n" +
          "     which is what INDEPENDENCE OF PLACEMENT means taken literally. An\n" +
          "     assortment axis that cannot carry placement cannot make a species.\n" +
          "     ⚠️ Registered in advance in docs/2026-08-16-phenology-prereg.md."
      : `\n  ⚠️ AND THE SEASON DID NOT SPLIT EITHER — narrow+free reads ${freeR}\n` +
          `     (R1 ${f3(bFree)}, R2 ${f3(bFree2)}), baseline ${wideR}. The registered\n` +
          "     explanation for the null — assortment sorts flowering times but\n" +
          "     cannot carry placement — is NOT supported: nothing sorted at all.\n" +
          "     ⚠️ If the baseline reads CONCENTRATED, suspect DRIFT TO FIXATION on a\n" +
          "     locus nothing is selecting, not a season that split.",
  );
} else if (dLink.point < 0) {
  /* ⚠️⚠️ THE BRANCH THE FIRST VERSION DID NOT HAVE. It asked only whether the
   * interval EXCLUDED zero, never whether the effect was POSITIVE, so a
   * significant DECREASE in HELD fell through every intermediate branch and
   * printed the green "HELD rises" sentence. It did not fire — the observed
   * point was +0.289 — but a verdict that can print the opposite of what
   * happened is not gated on anything. */
  console.log(
    "  ⛔ HELD moved DOWN, not up. narrow+linked against wide+linked:\n" +
      `     ${ciStr(dLink)}. Linkage plus a narrow season DESTROYS retained\n` +
      "     ancestry variance relative to linkage alone. Whatever this is, it is\n" +
      "     not the registered mechanism, and the sign must be reported as found.",
  );
} else if (excludes0(dLinkF) && dLinkF.point > 0) {
  console.log(
    "  ⚠️ RESCUED BUT FUSED. HELD moved in the linked arm but FUSED moved with\n" +
      "     it — the lineages persist by MERGING, which the pre-registration\n" +
      "     named as refuting the distinctness claim.",
  );
} else if (excludes0(dNull) && dNull.point > 0) {
  console.log(
    "  ⚠️ DEMOTED TO DEMOGRAPHY — the effect survives severing placement from\n" +
      `     parentage (${ciStr(dNull)}), so it is not placement-mediated mating.`,
  );
} else if (!SHUF_LANDED) {
  /* ⚠️⚠️ THE CONFOUND ARM IS A GATE, NOT A FOOTNOTE. If the shuffle did not
   * land there is nothing to subtract and the effect cannot be attributed. */
  console.log(
    "  ⚠️⚠️ NO ATTRIBUTION — the confound arm did not land (PART 2). Heritable\n" +
      "     bloom shows no lineage association, or permuting it did not remove\n" +
      "     one, so 'heritable temporal assortment' cannot be separated from\n" +
      "     'small mating pools' and no mechanism may be named.",
  );
} else if (!excludes0(dPool)) {
  /* ⚠️⚠️ AND THIS IS THE BRANCH THAT MATTERS. If narrow+free does not beat
   * narrow+SHUFFLED, then destroying the tie between flowering time and lineage
   * cost nothing — and what raised HELD was the ~3.6-plant mating pool, not
   * temporal assortment. The headline +0.237 would be a pool-size artefact. */
  console.log(
    "  ⛔ THE EFFECT IS POOL SIZE, NOT TEMPORAL ASSORTMENT.\n" +
      `     narrow+free against narrow+SHUFFLED is ${ciStr(dPool)}, which spans zero:\n` +
      "     destroying the tie between flowering time and lineage cost nothing,\n" +
      "     while the per-slice pool stayed identical by construction.\n" +
      `     What raised HELD is ~${(N0 * WIDTH).toFixed(1)} co-flowering plants of ${N0}, not the season.\n` +
      "     ⚠️ The shuffle DID land (PART 2), so this is a fact about the\n" +
      "     mechanism and not a control that failed to fire.",
  );
} else {
  /* ⚠️⚠️ WHICH OF THE FOUR THINGS HAPPENED IS DECIDED BY THE 2x2, NOT ASSERTED.
   * The narrow season and the supergene are separate interventions and the run
   * now has a cell for each, so the sentence printed here names the pattern the
   * numbers actually show rather than the one the prereg hoped for. */
  const linkageAlone = excludes0(dLinkMain) && dLinkMain.point > 0;
  const seasonAlone = excludes0(dFree) && dFree.point > 0;
  const interaction = mBoth - mFree - mLink;

  console.log(
    "  ✅ HELD rises, narrow+linked against WIDE+LINKED — the contrast that holds\n" +
      `     recombination structure FIXED: ${ciStr(dLink)}. FUSED does not move,\n` +
      "     and the effect is absent from the random-mating null.\n",
  );

  if (linkageAlone && seasonAlone)
    console.log(
      "  ⚠️⚠️ BOTH MAIN EFFECTS ARE LIVE, so read this as ECOLOGY x ARCHITECTURE.\n" +
        `     Linkage alone moves HELD (${ciStr(dLinkMain)}) and a narrow season\n` +
        `     alone moves it (${ciStr(dFree)}), with an interaction of ${f3(interaction)}.\n` +
        "     The claim available is that temporal assortment reaches placement AND\n" +
        "     that genome architecture changes how far it reaches — not that either\n" +
        "     one does the work by itself.",
    );
  else if (linkageAlone)
    console.log(
      "  ⚠️⚠️ LINKAGE ALONE ALREADY MOVES HELD — wide+linked against wide+free is\n" +
        `     ${ciStr(dLinkMain)}, with NO phenology involved. The narrow season adds\n` +
        `     ${ciStr(dLink)} ON TOP of that. Quote the supergene as the primary\n` +
        "     mechanism and phenology as a modifier, in that order.",
    );
  else if (seasonAlone)
    console.log(
      "  ✅✅ THE SEASON MOVES PLACEMENT WITHOUT A SUPERGENE — narrow+free against\n" +
        `     wide+free is ${ciStr(dFree)} while linkage alone is ${ciStr(dLinkMain)}.\n` +
        "     This is the strong form: a bloom allele is torn from its placement\n" +
        "     allele every generation and placement divergence rises anyway.\n" +
        "     ⚠️ It REFUTES the pre-registered null, which predicted exactly the\n" +
        "     opposite on exactly this arm. Report the prereg as failed.",
    );
  else
    console.log(
      "  ⚠️ NEITHER MAIN EFFECT CLEARS ZERO on its own, so the movement lives in\n" +
        `     the combination (interaction ${f3(interaction)}) and the design cannot\n` +
        "     yet say which ingredient carries it. Do not name a mechanism.",
    );

  console.log(
    "\n  ⚠️⚠️ AND LINKAGE IS ITSELF IMPOSED. Suppressed recombination is a knob this\n" +
      "     model sets, not something the pollination ecology derived — so a result\n" +
      "     that needs the supergene does NOT answer roadmap :219's northstar, which\n" +
      "     asks for a minority advantage DERIVED rather than imposed. It relocates\n" +
      "     the imposition from ecology to the genome.\n" +
      "  ⚠️ STILL OUTSTANDING: the narrow arms leave ~" +
      `${(N0 * WIDTH).toFixed(1)} of ${N0} plants co-flowering per\n` +
      "     slice, so a shuffled-bloom arm is still owed before the effect can be\n" +
      "     attributed to heritable temporal assortment rather than to small pools.",
  );
}
