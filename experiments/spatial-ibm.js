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
  }

  return {
    seed,
    fate: I.fateOf(pop, ancVar0, extinct),
    /* the EARLY window, before outcomes resolve — clustering measured after a
     * lineage is already going extinct is measuring the extinction */
    clustering: mean(clustering.slice(0, Math.min(10, clustering.length))),
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
const excludes0 = (ci) => ci && (ci.lo > 0 || ci.hi < 0);
const ciStr = (ci) =>
  ci
    ? `${ci.point >= 0 ? "+" : ""}${ci.point.toFixed(3)} [${ci.lo.toFixed(3)}, ${ci.hi.toFixed(3)}]`
    : "—";

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
console.log(`  H-spatial   HELD, local+limited vs baseline: ${ciStr(dHeld)}`);
console.log(`  H-distinct  FUSED, same contrast:            ${ciStr(dFused)}`);

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
console.log(`\n  HELD, local+limited vs baseline (null): ${ciStr(dHeldNull)}`);

/* ------------------------------------------------------------- the verdict */

rule("VERDICT");

if (!LANDED) {
  console.log(
    "  NO RESULT — the positive control failed. See PART 2. Nothing below the\n" +
      "  control is interpretable and no verdict is issued.",
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
