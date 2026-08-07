/*
 * gap-occupancy.js — do intermediates actually ARISE and BRIDGE, or was the
 * subsidy only ever a weight on paper? (roadmap B, closing the box left by the
 * rare-bias run)
 *
 * ⚠️ THIS RUN EXISTS BECAUSE THE PREVIOUS ONE PROVED LESS THAN IT SOUNDED LIKE.
 *
 * The rare-bias result showed that at the exclusion separation the barrier leaks
 * EXACTLY ZERO pollen and yet strong rare-bias still fuses the two lineages, and
 * explained it by the geometry: weight goes as dens^(a-1), so the lowest-density
 * placement draws the most visits, and in a two-cluster population that is the
 * GAP BETWEEN THE CLUSTERS. The number quoted was 136x.
 *
 * ⚠️ BUT 136x IS THE WEIGHT AN INTERMEDIATE *WOULD* RECEIVE. It was computed by
 * dropping a hypothetical plant at the midpoint of a FOUNDING population and
 * asking what the kernel would give it. Nothing in that run observed an
 * intermediate actually appearing, and nothing observed one carrying genes
 * across. A mechanism inferred from a static weight is a hypothesis about a
 * dynamical process, and this project has already been caught reading a number
 * off a display and naming the wrong organ.
 *
 * So: run the fusing arm with the model's own generation loop traced, and ask
 * whether occupancy of the gap RISES BEFORE ancestry variance COLLAPSES.
 *
 * THREE HYPOTHESES, and they are separated by different columns of one table:
 *
 *   H1 BRIDGE   intermediates arise in the gap, get subsidised, and carry genes
 *               across. => gap occupancy rises BEFORE ancVar falls, and BOTH
 *               cores stay occupied while it does.
 *   H2 MERGE    no distinct intermediate class; the two clusters migrate bodily
 *               toward each other. => the cores DRAIN as the gap fills, and the
 *               founding separation shrinks.
 *   H3 LOSS     ancVar falls because one lineage dies, not because anything
 *               bridged. => gap stays empty, ancestry MEAN runs to 0 or 1.
 *               Excluded by construction here: only FUSED replicates are scored,
 *               and `fate` already separates FUSED from "one lost".
 *
 * H1 is my published explanation. H2 and H3 would both refute it while leaving
 * the fusion itself intact, which is the point of running this at all.
 */

const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");

const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const f2 = (x) => (x == null ? "   -  " : x.toFixed(2).padStart(6));
const f3 = (x) => (x == null ? "    -  " : x.toFixed(3).padStart(7));
const iv = (x) => (x == null ? " -" : String(x).padStart(2));

const SMOKE = process.env.GO_SMOKE === "1";
const N0 = SMOKE ? 12 : 30;
const GENS = SMOKE ? 5 : 35;
/* ⚠️ POWER IS AN ARGUMENT HERE, not a constant. The ordering test in PART A can
 * only be scored on FUSED replicates, and at a=0.25 only about a quarter of
 * seeds fuse — so the headline count is a quarter of whatever this is set to.
 * GO_SEEDS raises it; GO_PARTS restricts which parts run, because PART C costs
 * five arms per seed and does not need the same power as A. */
const N_SEEDS = SMOKE ? 2 : Number(process.env.GO_SEEDS || 12);
const SEEDS = Array.from({ length: N_SEEDS }, (_, i) => i + 1);
/* the sweep is a dose-response over five arms; 12 seeds resolves it and 5x the
 * seeds of PART A would dominate the runtime for no extra discrimination */
const SWEEP_SEEDS = SEEDS.slice(0, SMOKE ? 2 : 12);
const PARTS = (process.env.GO_PARTS || "ABC").toUpperCase();
const SITE_N = SMOKE ? 50 : 160;
const D_EXCL = 8;
/* a plant counts as an intermediate at >=10% of the population, i.e. three
 * plants at N=30. Declared here rather than chosen after looking. */
const GAP_THRESH = 0.1;
const optsAt = (extra = {}) => ({ ...I.DEFAULTS, siteN: SITE_N, ...extra });

if (SMOKE)
  console.log(
    "\n*** GO_SMOKE=1 — tiny configuration. Exercises the code path and the\n" +
      "*** reporting. THE NUMBERS BELOW ARE NOT RESULTS.\n",
  );

const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));

const placeOfGenome = (g) =>
  I.sitesOf([{ h1: g, h2: g }], optsAt(), 0).map(I.placementOf)[0];

const ancMean = (xs) => (xs.length ? mean(xs) : 0);
function fate(finalPop, ancVar0, extinct) {
  if (extinct || finalPop.length < 2) return "BOTH LOST";
  const v = I.ancestryVar(finalPop);
  const m = ancMean(finalPop.map((i) => i.anc || 0));
  if (v > 0.4 * ancVar0) return "HELD";
  if (m < 0.15 || m > 0.85) return "one lost";
  return "FUSED";
}

/* first generation at which a series crosses a threshold, or null */
const firstAtOrAbove = (xs, t) => {
  const i = xs.findIndex((x) => x != null && x >= t);
  return i < 0 ? null : i;
};
const firstAtOrBelow = (xs, t) => {
  const i = xs.findIndex((x) => x != null && x <= t);
  return i < 0 ? null : i;
};

/* One traced replicate: founds two lineages at the exclusion separation, runs
 * the MODEL'S OWN loop, and reads the per-generation trace back out. */
function tracedRun(seed, extra) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, optsAt());
  if (!built) return null;
  const pA = placeOfGenome(built.gA);
  const pB = placeOfGenome(built.gB);
  if (!pA || !pB) return null;

  const ancVar0 = I.ancestryVar(built.pop);
  const out = I.run({
    n: N0,
    generations: GENS,
    seed,
    siteN: SITE_N,
    found: built.pop,
    trace: true,
    ...extra,
  });

  const occ = out.history.map((h) =>
    h.places ? I.gapOccupancy(h.places, pA, pB) : null,
  );
  return {
    seed,
    fate: fate(out.pop, ancVar0, out.extinct),
    realised: built.realised,
    ancVar0,
    ancVar: out.history.map((h) => h.ancVar),
    ancMean: out.history.map((h) => (h.anc ? ancMean(h.anc) : null)),
    gap: occ.map((o) => (o ? o.gap : null)),
    coreA: occ.map((o) => (o ? o.coreA : null)),
    coreB: occ.map((o) => (o ? o.coreB : null)),
  };
}

console.log("=".repeat(104));
console.log(
  "Gap occupancy: do intermediates ARISE and BRIDGE, or is 136x a weight nothing ever collected?",
);
console.log("=".repeat(104));

// ========================================================================
// PART 0 — the anchor gate
// ========================================================================

rule("PART 0 — the anchor gate");

/* golden generated before allocExponent existed (commit 17cd60c), reused here
 * to prove that adding `trace` moved nothing either */
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

const a1 = JSON.stringify(goldenRun()) === JSON.stringify(PRE_ALLOC);
const a2 =
  JSON.stringify(goldenRun({ trace: true })) === JSON.stringify(PRE_ALLOC);
console.log(
  `  1. pre-trace model still reproduces (17cd60c)           ${a1 ? "ok" : "FAIL"}`,
);
console.log(
  `  2. trace:true does not perturb the run                  ${a2 ? "ok" : "FAIL"}`,
);

/*
 * ⚠️ THE POSITIVE CONTROL FOR THE STATISTIC, and this run is worthless without
 * it. The headline candidate answer is "the gap stayed EMPTY", and a statistic
 * that could only ever return zero would produce that answer on any input. So
 * it is shown here reporting BOTH answers on populations built to have the
 * property: an unbridged pair must read ~0 and a deliberately bridged one must
 * read high, in the same check.
 */
const pA0 = { s: 0, phi: 0 };
const pB0 = { s: 8, phi: 0 };
const twoClusters = [];
for (let i = 0; i < 15; i++) twoClusters.push({ s: 0.02 * i, phi: 0 });
for (let i = 0; i < 15; i++) twoClusters.push({ s: 8 - 0.02 * i, phi: 0 });
const bridged = twoClusters.slice(0, 20).concat(
  /* ten plants strung along the middle of the segment */
  Array.from({ length: 10 }, (_, i) => ({ s: 3 + 0.2 * i, phi: 0 })),
);
const oEmpty = I.gapOccupancy(twoClusters, pA0, pB0);
const oFull = I.gapOccupancy(bridged, pA0, pB0);
const a3 = oEmpty.gap < 0.02;
const a4 = oFull.gap > 0.25;
console.log(
  `  3. NEGATIVE: unbridged pair reads gap = ${oEmpty.gap.toFixed(3)}          ${a3 ? "ok" : "FAIL"}`,
);
console.log(
  `  4. POSITIVE: bridged population reads gap = ${oFull.gap.toFixed(3)}       ${a4 ? "ok" : "FAIL"}`,
);
console.log(
  `     (cores in the bridged case: ${oFull.coreA.toFixed(2)} / ${oFull.coreB.toFixed(2)} — both still occupied)`,
);

/* and the reference points must be FIXED, not re-derived: a single merged cloud
 * must NOT read as an empty gap just because its own midpoint moved with it */
const merged = Array.from({ length: 30 }, (_, i) => ({
  s: 3.9 + 0.007 * i,
  phi: 0,
}));
const oMerged = I.gapOccupancy(merged, pA0, pB0);
const a5 = oMerged.gap > 0.9;
console.log(
  `  5. a fully MERGED cloud reads gap = ${oMerged.gap.toFixed(3)}             ${a5 ? "ok" : "FAIL"}`,
);

/* the real founding geometry, which the dynamical arm starts from */
let a6 = true;
{
  const g0 = [];
  for (const seed of SEEDS.slice(0, 5)) {
    const rng = E.makeRng(seed);
    const srng = I.signalRng(seed);
    const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, optsAt());
    if (!built) continue;
    const pA = placeOfGenome(built.gA);
    const pB = placeOfGenome(built.gB);
    if (!pA || !pB) continue;
    const places = I.sitesOf(built.pop, optsAt(), 0).map(I.placementOf);
    g0.push(I.gapOccupancy(places, pA, pB).gap);
  }
  const m = mean(g0);
  a6 = m < 0.05;
  console.log(
    `  6. FOUNDING populations start with gap = ${m.toFixed(3)}          ${a6 ? "ok" : "FAIL"}`,
  );
}

if (!(a1 && a2 && a3 && a4 && a5 && a6)) {
  console.log(
    SMOKE
      ? "\n(anchors do not all apply at smoke size — informational only)"
      : "\nANCHORS FAILED — refusing to compute a result.",
  );
  if (!SMOKE) process.exit(1);
}

// ========================================================================
// PART A — the ordering test
// ========================================================================

rule(
  "PART A — in the FUSING arm, does the gap fill BEFORE ancestry collapses?",
);
console.log(
  "  a = 0.25, d = 8. Tgap = first generation with >=" +
    (GAP_THRESH * 100).toFixed(0) +
    "% of plants intermediate.\n" +
    "  Tanc = first generation where ancestry variance has fallen by half.\n" +
    "  H1 (my published explanation) requires Tgap < Tanc.\n",
);

const runsA = PARTS.includes("A")
  ? SEEDS.map((s) => tracedRun(s, { allocExponent: 0.25 })).filter(Boolean)
  : [];
const fused = runsA.filter((r) => r.fate === "FUSED");

console.log(
  "    seed   fate        peak gap   Tgap   Tanc   verdict on H1 (bridge-before-fusion)",
);
let before = 0;
let after = 0;
for (const r of runsA) {
  const tg = firstAtOrAbove(r.gap, GAP_THRESH);
  const ta = firstAtOrBelow(r.ancVar, 0.5 * r.ancVar0);
  let verdict = "";
  if (r.fate === "FUSED") {
    if (tg == null) verdict = "gap NEVER filled — H1 refuted here";
    else if (ta == null) verdict = "ancVar never halved";
    else if (tg < ta) {
      verdict = "gap filled FIRST — consistent with H1";
      before++;
    } else {
      verdict = "fusion came first — H1 refuted here";
      after++;
    }
  } else verdict = "(not scored — H3 excluded by fate)";
  console.log(
    `    ${String(r.seed).padStart(4)}   ${r.fate.padEnd(10)}  ${f3(Math.max(...r.gap.filter((x) => x != null)))}   ` +
      `${iv(tg)}     ${iv(ta)}   ${verdict}`,
  );
}
console.log(
  `\n  FUSED replicates: ${fused.length}/${runsA.length}. ` +
    `Gap filled before fusion in ${before}, after in ${after}.`,
);

// ========================================================================
// PART B — bridge or merge?
// ========================================================================

rule("PART B — H1 vs H2: is it a BRIDGE between two peaks, or a MERGE?");
console.log(
  "  ⚠️ MY OWN PRE-REGISTERED CRITERION FOR THIS WAS UNSATISFIABLE AND IS CORRECTED\n" +
    "  HERE. It said a bridge keeps BOTH CORES OCCUPIED while the gap fills. At FIXED\n" +
    "  POPULATION SIZE that cannot happen: the gap can only fill by taking plants from\n" +
    "  somewhere, and the only somewhere is the cores. Any true bridge and any true\n" +
    "  merge both drain them, so the criterion could not have discriminated anything.\n" +
    "\n" +
    "  What DOES discriminate, and is what the synthetic controls in PART 0 pin down:\n" +
    "  a MERGE ends with the cores essentially EMPTY and everything in the middle (the\n" +
    "  control reads coreA+coreB < 0.1, gap ~1.0). A BRIDGE keeps both ends occupied\n" +
    "  and roughly BALANCED while a third group appears between them. So read the\n" +
    "  final rows, not the trend: cores near zero = merge, cores balanced and non-zero\n" +
    "  = bridge. Averaged over the FUSED replicates.\n",
);
if (fused.length) {
  const G = Math.min(...fused.map((r) => r.gap.length));
  console.log("     gen    gap    coreA   coreB   cores sum   ancVar");
  for (let g = 0; g < G; g += SMOKE ? 1 : Math.max(1, Math.floor(G / 12))) {
    const gp = mean(fused.map((r) => r.gap[g]).filter((x) => x != null));
    const ca = mean(fused.map((r) => r.coreA[g]).filter((x) => x != null));
    const cb = mean(fused.map((r) => r.coreB[g]).filter((x) => x != null));
    const av = mean(fused.map((r) => r.ancVar[g]).filter((x) => x != null));
    console.log(
      `    ${String(g).padStart(4)}  ${f3(gp)} ${f3(ca)} ${f3(cb)}    ${f3(ca + cb)}  ${f3(av)}`,
    );
  }
} else {
  console.log("  no FUSED replicates to average — nothing to separate.");
}

// ========================================================================
// PART C — the symmetric arm: a > 1
// ========================================================================

rule("PART C — the symmetric case: COMMON-biased allocation (a > 1)");
console.log(
  "  Every earlier arm explored a < 1. The identities say the mate-finding gap is\n" +
    "  exactly `a`, which is a claim about a>1 as much as about a<1: a common-bias\n" +
    "  should make the rare type WORSE off, and should starve the intermediate\n" +
    "  rather than subsidise it. Gap occupancy should therefore fall monotonically\n" +
    "  as a rises. If it does not, the subsidy story is wrong in a way the a<1\n" +
    "  arms could not have shown.\n",
);
const A_VALUES = SMOKE ? [0.25, 1, 2] : [0.25, 0.5, 1, 1.5, 2];
console.log(
  "      a     peak gap   mean gap   HELD / FUSED / one lost / BOTH LOST",
);
for (const a of PARTS.includes("C") ? A_VALUES : []) {
  const rs = SWEEP_SEEDS.map((s) =>
    tracedRun(s, a === 1 ? {} : { allocExponent: a }),
  ).filter(Boolean);
  if (!rs.length) continue;
  const peaks = rs.map((r) => Math.max(...r.gap.filter((x) => x != null)));
  const means = rs.map((r) => mean(r.gap.filter((x) => x != null)));
  const t = { HELD: 0, FUSED: 0, "one lost": 0, "BOTH LOST": 0 };
  rs.forEach((r) => t[r.fate]++);
  console.log(
    `    ${a.toFixed(2)}   ${f3(mean(peaks))}   ${f3(mean(means))}   ` +
      `${t.HELD} / ${t.FUSED} / ${t["one lost"]} / ${t["BOTH LOST"]}`,
  );
}

console.log("\n" + "=".repeat(104));
console.log(
  "  H1 needs THREE things, and PART C is the one that carries the causal claim:\n" +
    "    A  in FUSED replicates the gap fills BEFORE ancestry variance halves;\n" +
    "    B  the end state has both cores still occupied and roughly balanced, i.e.\n" +
    "       a bridge rather than a migration of everything into the middle;\n" +
    "    C  the gap fills ONLY under rare-bias. Under a >= 1 the intermediate is the\n" +
    "       rarest placement and should be STARVED, so if occupancy there were the\n" +
    "       same, gap-filling would be something the run does anyway and the subsidy\n" +
    "       would explain nothing.\n" +
    "  Anything short of that means fusion happens by some other route and the 136x\n" +
    "  figure is a weight nothing ever collected.",
);
console.log("=".repeat(104));
