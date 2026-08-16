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

const CELLS = [
  ["wide season (baseline)", { width: 1.0, slices: SLICES }],
  ["narrow · free recombination", { width: WIDTH, slices: SLICES }],
  ["narrow · linked (supergene)", { width: WIDTH, slices: SLICES, link: true }],
];
const FREE = 1;
const LINKED = 2;

if (SMOKE)
  console.log(
    "\n*** PH_SMOKE=1 — tiny configuration. Exercises the code path and the\n" +
      "*** reporting. THE NUMBERS BELOW ARE NOT RESULTS.\n",
  );

const optsAt = (extra = {}) => ({ ...I.DEFAULTS, siteN: SITE_N, ...extra });

/*
 * Did the SEASON itself go bimodal? Largest gap on the ring of flowering times,
 * as a fraction of the mean spacing — 1.0 is an even scatter, large values mean
 * the population has split into flowering groups. Deliberately NOT the placement
 * statistic: the whole point is to report the two separately.
 */
function seasonSplit(blooms) {
  if (!blooms || blooms.length < 4) return null;
  const b = blooms.slice().sort((x, y) => x - y);
  let biggest = 0;
  for (let i = 0; i < b.length; i++) {
    const gap = i === b.length - 1 ? 1 - b[i] + b[0] : b[i + 1] - b[i];
    if (gap > biggest) biggest = gap;
  }
  return biggest / (1 / b.length);
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
  const season = [];
  let extinct = false;
  for (let g = 0; g < GENS; g++) {
    if (pop.length < 2) {
      extinct = true;
      break;
    }
    const res = I.step(pop, opts, rng, g, srng, brng);
    if (res.bloomAssort != null) assort.push(res.bloomAssort);
    const s = seasonSplit(res.blooms);
    if (s != null) season.push(s);
    pop = res.pop;
  }
  return {
    seed,
    fate: I.fateOf(pop, ancVar0, extinct),
    assort: mean(assort),
    /* the LAST few generations — a season that split does so over time */
    season: mean(season.slice(-5)),
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
const ciStr = (ci) =>
  ci
    ? `${ci.point >= 0 ? "+" : ""}${ci.point.toFixed(3)} [${ci.lo.toFixed(3)}, ${ci.hi.toFixed(3)}]`
    : "—";

console.log(
  `flowering time in the IBM — ${N_SEEDS} seeds/cell, n=${N0}, ` +
    `${GENS} generations, ${SLICES} slices, d=${D_EXCL}`,
);

rule("PART 1 — the cells, placement-mediated mating");
const arm = CELLS.map(([, p]) =>
  SEEDS.map((s) => replicate(s, p, false)).filter(Boolean),
);
console.log(
  "  cell                           HELD   FUSED  oneLost  assortment  seasonSplit",
);
arm.forEach((rows, i) => {
  console.log(
    `  ${CELLS[i][0].padEnd(29)}${f3(HELD(rows))}${f3(FUSED(rows))}${f3(
      fracOf("one lost")(rows),
    )}   ${f3(mean(rows.map((r) => r.assort)))}   ${f3(
      mean(rows.map((r) => r.season)),
    )}`,
  );
});

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
const dLink = pairedCI(arm[LINKED], arm[0], HELD);
const dLinkF = pairedCI(arm[LINKED], arm[0], FUSED);
console.log(`  H-free   HELD, narrow+free vs wide baseline:   ${ciStr(dFree)}`);
console.log(`  H-link   HELD, narrow+linked vs wide baseline: ${ciStr(dLink)}`);
console.log(
  `           FUSED, same contrast:                 ${ciStr(dLinkF)}`,
);

const sWide = mean(arm[0].map((r) => r.season));
const sFree = mean(arm[FREE].map((r) => r.season));
console.log(
  `\n  season split (largest gap / mean spacing): wide ${f3(sWide)}` +
    ` · narrow+free ${f3(sFree)}`,
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
  const seasonMoved = sFree > sWide * 1.15;
  console.log(
    "  ❌ REFUTED — temporal assortment does not reach placement.\n" +
      `     Free recombination: ${ciStr(dFree)}. Linked: ${ciStr(dLink)}.\n` +
      "     Both span zero, and the assortment DID happen (PART 2), so this is\n" +
      "     a fact about the mechanism rather than a failed intervention.",
  );
  console.log(
    seasonMoved
      ? "\n  ⚠️⚠️ AND THIS IS THE INFORMATIVE HALF, not a consolation. The SEASON\n" +
          `     split (${f3(sFree)} against ${f3(sWide)} in the baseline) while the\n` +
          "     SHAPES did not. The population sorted itself on the axis under\n" +
          "     selection and the placement genes shuffled straight through the\n" +
          "     temporal barrier — which is what INDEPENDENCE OF PLACEMENT means\n" +
          "     when you take it literally. An assortment axis that cannot carry\n" +
          "     placement with it cannot make a placement species.\n" +
          "     ⚠️ Registered in advance as the expected outcome, with this\n" +
          "     mechanism, in docs/2026-08-16-phenology-prereg.md."
      : "\n  ⚠️ AND THE SEASON DID NOT SPLIT EITHER. The registered explanation for\n" +
          "     the null — assortment sorts flowering times but cannot carry\n" +
          "     placement — is NOT supported: nothing sorted at all. Something\n" +
          "     upstream is holding the bloom distribution together, and the\n" +
          "     mechanism story must not be quoted as if it had been shown.",
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
} else {
  console.log(
    "  ✅ HELD rises in the LINKED arm, FUSED does not, and the effect is absent\n" +
      "     from the random-mating null.\n\n" +
      "  ⚠️⚠️ AND IT MUST BE QUOTED AS A CONDITIONAL. The linked arm BUILDS the\n" +
      "     association it needs: the finding is that placement divergence is\n" +
      "     available IF a flowering-time allele is already linked to the anther\n" +
      "     loci. That is not evidence that phenology creates the association\n" +
      `     from nothing — the free arm (${ciStr(dFree)}) is the arm that would\n` +
      "     have shown that, and it is the one to read first.",
  );
}
