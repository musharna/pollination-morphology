/*
 * two-pollinator-coexistence.js — the discrepancy the last result created.
 *
 * WHERE THIS COMES FROM. Secondary contact (2026-08-04) found that two lineages
 * founded far enough apart do not fuse — one of them is LOST OUTRIGHT, in every
 * seed, and not by drift (it is still lost at N = 60). The reasoning was that
 * once two groups stop exchanging genes they stop competing for MATES and start
 * competing for OFFSPRING SLOTS, and one is excluded.
 *
 * ⚠️ THAT IS A PREDICTION ABOUT THE WORLD, AND THE WORLD DISAGREES. Orchid
 * communities plainly contain coexisting congeners. So either the mechanism is
 * wrong or something outside the model permits coexistence, and the model has
 * exactly one obvious candidate it has not been given: MORE THAN ONE POLLINATOR.
 *
 * THE ARGUMENT. Under one animal, two reproductively isolated lineages are
 * playing a zero-sum game — every seed set by one is a seed not set by the
 * other, because there is a single pool of visits to divide. Under two animals
 * with different body plans, a lineage placing pollen where animal A carries it
 * is not necessarily taking anything from a lineage that places on animal B.
 * Coexistence would then need no new mechanism at all: just a second axis for
 * the competition to spread across.
 *
 * ⚠️ TWO THINGS ARE EASY TO GET WRONG HERE AND BOTH ARE CONTROLLED.
 *
 *   THE VISIT BUDGET. Giving each animal a full budget would mean the
 *   two-pollinator arm also gets twice the pollination, and "two pollinators
 *   permit coexistence" would be indistinguishable from "more visits permit
 *   coexistence". sim/ibm.js SPLITS the budget, so total visitation is invariant
 *   and the arms differ in geometry alone.
 *
 *   TWO BOUTS IS NOT TWO POLLINATORS. Summing two bouts changes the sampling
 *   even when the animals are identical. So the decisive control is TWO
 *   IDENTICAL BEES: same number of bouts, same split budget, same summation, and
 *   no new geometry. If coexistence appears there too, it is an artefact of the
 *   machinery rather than a fact about pollinators.
 *
 * Pollen is carried on a body, so a grain picked up from animal A can only be
 * delivered by animal A: separate bouts, summed, never one mixed bout. That is
 * the convention experiments/two-pollinators.js established.
 */

const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const P = require("../sim/placement.js");
const { claim } = require("../sim/verdict-gates.js");

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(
    xs.reduce((s, x) => s + (x - m) * (x - m), 0) / (xs.length - 1),
  );
};
const f2 = (x) =>
  x === null || x === undefined ? "   -  " : x.toFixed(2).padStart(6);
const f3 = (x) =>
  x === null || x === undefined ? "    -  " : x.toFixed(3).padStart(7);

const SMOKE = process.env.TP_SMOKE === "1";
const N = SMOKE ? 12 : 30;
const GENS = SMOKE ? 4 : 35;
const SEEDS = SMOKE ? [1, 2] : [1, 2, 3, 4, 5];
const SITE_N = SMOKE ? 50 : 160;
if (SMOKE)
  console.log(
    "\n*** TP_SMOKE=1 — tiny configuration. Exercises the code path and the\n" +
      "*** reporting. THE NUMBERS BELOW ARE NOT RESULTS.\n",
  );

/* d = 8 is the EXCLUSION separation from 2026-08-04; d = 2 is the fusion regime,
 * carried as a reference so a change at 8 can be seen not to be a change
 * everywhere. */
const D_EXCL = 8;
const D_FUSE = 2;
const SEPARATIONS = SMOKE ? [D_EXCL] : [D_FUSE, D_EXCL];

/* Body plans exactly as experiments/two-pollinators.js and checks.js build them. */
const scaleBee = (k, lenK) => ({
  bodyLen: 1.75 * lenK,
  regions: P.DEFAULT_BEE.regions.map((r) => ({
    ...r,
    r0: r.r0 * k,
    r1: r.r1 * k,
  })),
  reach: P.DEFAULT_BEE.reach,
});
const BEE_A = scaleBee(0.65, 0.8); // small slender
const BEE_B = scaleBee(1.35, 1.15); // large robust

const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));
const optsAt = (extra = {}) => ({ ...I.DEFAULTS, siteN: SITE_N, ...extra });

const ancMean = (pop) => mean(pop.map((i) => i.anc || 0));
function fate(finalPop, v0) {
  const v = I.ancestryVar(finalPop);
  const m = ancMean(finalPop);
  if (v > 0.4 * v0) return { tag: "HELD", v, m };
  if (m < 0.15 || m > 0.85) return { tag: "one lost", v, m };
  return { tag: "FUSED", v, m };
}

// ========================================================================
// PART 0 — the anchor gate
// ========================================================================

/*
 * ANCHOR 1 — the single-animal case must be unchanged. Adding a bees loop that
 * quietly moved the one-bee path would invalidate every earlier IBM result while
 * looking like an extension. Golden from commit ef7180d.
 */
const PRE_BEES = [
  [0.6426076918656048, 3.0637323268730365],
  [0.8843517599890253, 3.6807972859897253],
  [0.8257455458521449, 3.61632994537921],
  [0.49249979315034653, 2.269042873658907],
  [0.6023262955018738, 2.172879959409133],
];
function anchorUnchanged() {
  const h = I.run({
    n: 12,
    generations: 5,
    seed: 3,
    siteN: 60,
    visits: 6000,
  }).history;
  const ok =
    JSON.stringify(h.map((r) => [r.spread, r.separation])) ===
    JSON.stringify(PRE_BEES);
  console.log("  1. the single-animal path is unchanged");
  console.log(
    `     shape history bit-identical to commit ef7180d   ${ok ? "ok" : "FAIL"}`,
  );
  return ok;
}

/*
 * ⚠️ ANCHOR 2 — DO THE TWO ANIMALS ACTUALLY DIFFER?
 *
 * This is the inertness gate, and it is the one this project keeps needing. If
 * BEE_A and BEE_B place pollen in the same spot, the "two different pollinators"
 * arm is the identical-bees control wearing a different label, and whatever it
 * returns means nothing.
 *
 * The reference is built in, not assumed: two IDENTICAL animals still sample
 * their contact sites independently (different site seeds), so they already
 * differ by some sampling noise. The two different body plans have to clear that
 * floor by a wide margin, and the floor is measured here rather than guessed.
 */
function anchorAnimalsDiffer() {
  const gaps = [];
  const floors = [];
  for (const seed of SEEDS) {
    const rng = E.makeRng(seed);
    const srng = I.signalRng(seed);
    const built = I.foundTwoLineages(N, rng, srng, D_EXCL, optsAt());
    if (!built) continue;
    const placesOn = (bee, idx) =>
      I.sitesOf(built.pop, optsAt({ bee }), 0, idx).map(I.placementOf);
    const pA = placesOn(BEE_A, 0);
    const pB = placesOn(BEE_B, 1);
    const p0 = placesOn(P.DEFAULT_BEE, 0);
    const p1 = placesOn(P.DEFAULT_BEE, 1);
    const pair = (x, y) => {
      const ds = [];
      for (let i = 0; i < x.length; i++)
        if (x[i] && y[i]) ds.push(I.dist(x[i], y[i]));
      return ds.length ? mean(ds) : null;
    };
    const g = pair(pA, pB);
    const f = pair(p0, p1);
    if (g !== null) gaps.push(g);
    if (f !== null) floors.push(f);
  }
  const mg = gaps.length ? mean(gaps) : null;
  const mf = floors.length ? mean(floors) : null;
  const ok = mg !== null && mf !== null && mg > 3 * mf;
  console.log(`\n  2. the two animals place pollen in DIFFERENT places`);
  console.log(
    `     same plants, BEE_A vs BEE_B          mean placement gap ${f3(mg)}`,
  );
  console.log(
    `     same plants, two IDENTICAL animals   sampling floor     ${f3(mf)}   (independent site draws)`,
  );
  console.log(
    `     the geometries differ by ${mg && mf ? (mg / mf).toFixed(1) : "n/a"}x the floor   ${ok ? "ok" : "FAIL"}`,
  );
  return ok;
}

/*
 * ANCHOR 3 — the single-animal arm still reproduces the result this experiment
 * exists to explain: at the exclusion separation, one lineage is lost.
 */
function anchorExclusion() {
  const rs = SEEDS.map((s) => contactRun(D_EXCL, s, {})).filter(Boolean);
  const lost = rs.filter((r) => r.fate.tag === "one lost").length;
  const ok = lost > rs.length / 2;
  console.log(
    `\n  3. under ONE animal the exclusion result reproduces (2026-08-04: one lost 5/5)`,
  );
  console.log(
    `     one lineage lost in ${lost} of ${rs.length} seeds at d=${D_EXCL}   ${ok ? "ok" : "FAIL"}`,
  );
  return ok;
}

// ========================================================================
// the arms
// ========================================================================

function contactRun(d, seed, extra) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const built = I.foundTwoLineages(N, rng, srng, d, optsAt());
  if (!built) return null;
  const v0 = I.ancestryVar(built.pop);
  const out = I.run({
    n: N,
    generations: GENS,
    seed,
    siteN: SITE_N,
    found: built.pop,
    ...extra,
  });
  const last = out.history[out.history.length - 1];
  return {
    realised: built.realised,
    v0,
    fate: fate(out.pop, v0),
    sep: last.separation,
    stalled: out.history.some((h) => h.stalled),
    unmated: mean(out.history.map((h) => h.unmated)),
  };
}

const ARMS = [
  ["one animal (reference)", {}],
  ["two IDENTICAL animals", { bees: [P.DEFAULT_BEE, P.DEFAULT_BEE] }],
  ["two DIFFERENT animals", { bees: [BEE_A, BEE_B] }],
  [
    "two DIFFERENT + random mating",
    { bees: [BEE_A, BEE_B], randomMating: true },
  ],
];

function sweepAt(d) {
  console.log(`\n  separation d = ${d}`);
  console.log(
    "    arm                              final ancVar   HELD / FUSED / lost   unmated  stalls",
  );
  const rows = [];
  for (const [label, extra] of ARMS) {
    const rs = SEEDS.map((s) => contactRun(d, s, extra)).filter(Boolean);
    if (!rs.length) continue;
    const tally = { HELD: 0, FUSED: 0, "one lost": 0 };
    rs.forEach((r) => tally[r.fate.tag]++);
    const stalls = rs.filter((r) => r.stalled).length;
    rows.push({ d, label, tally, v: mean(rs.map((r) => r.fate.v)) });
    console.log(
      `    ${label.padEnd(32)} ${f3(mean(rs.map((r) => r.fate.v)))}       ` +
        `${tally.HELD} / ${tally.FUSED} / ${tally["one lost"]}      ` +
        `${f2(mean(rs.map((r) => r.unmated)))}   ${stalls}/${rs.length}` +
        `${stalls ? "  <-- FROZEN" : ""}`,
    );
  }
  return rows;
}

// ========================================================================
// main
// ========================================================================

console.log("=".repeat(90));
console.log(
  "Does a second pollinator permit coexistence past the exclusion separation?",
);
console.log("=".repeat(90));

rule("PART 0 — the anchor gate");
const gate = [anchorUnchanged(), anchorAnimalsDiffer(), anchorExclusion()];
if (!gate.every(Boolean)) {
  console.log(
    SMOKE
      ? "\n(anchors do not apply at smoke size — informational only)"
      : "\nANCHORS FAILED — refusing to compute a result.",
  );
  if (!SMOKE) process.exit(1);
}

rule("PART A — one animal vs two, at the fusion and exclusion separations");
const all = [];
for (const d of SEPARATIONS) all.push(...sweepAt(d));

// ---------------------------------------------------------------- verdict

console.log("\n" + "=".repeat(90));

const at = (d, label) =>
  all.find((r) => r.d === d && r.label.startsWith(label));
const held = (row) => row && row.tally.HELD > row.tally["one lost"];

const one = at(D_EXCL, "one animal");
const same = at(D_EXCL, "two IDENTICAL");
const diff = at(D_EXCL, "two DIFFERENT animals");
const nul = at(D_EXCL, "two DIFFERENT + random");

console.log(
  `  at the exclusion separation d = ${D_EXCL}:\n` +
    `    one animal            ${one ? one.tally.HELD + " held / " + one.tally["one lost"] + " lost" : "n/a"}\n` +
    `    two IDENTICAL         ${same ? same.tally.HELD + " held / " + same.tally["one lost"] + " lost" : "n/a"}   (control: machinery only)\n` +
    `    two DIFFERENT         ${diff ? diff.tally.HELD + " held / " + diff.tally["one lost"] + " lost" : "n/a"}\n`,
);

if (held(diff) && !held(same) && !held(one)) {
  /* ⚠️⚠️ THE NULL USED TO BE A FOOTNOTE INSIDE THIS STRING. It read "⚠️ BUT the
   * random-mating null ALSO holds — check that before believing any of it", and
   * it was appended to a message whose FIRST LINE had already announced the
   * result. A control that ships inside the claim it invalidates cannot withhold
   * that claim, only apologise for it. The null is the single discriminator
   * between "it is the geometry" and "it is the demography", so it is now the
   * gate and the ✅ text is unreachable while it holds. */
  console.log(
    claim({
      gates: [
        {
          name: "the random-mating null does NOT also hold",
          ok: nul ? !held(nul) : null,
          failText:
            "Two lineages persist under two animals even when mating is RANDOM with respect\n" +
            "to placement. Whatever permits coexistence therefore does not run through\n" +
            "placement-mediated mating, and calling it geometry is unsupported: the same\n" +
            "demography produces it with the geometry switched off.",
        },
      ],
      heading:
        "  ⛔ THE PATTERN IS PRESENT AND IT IS NOT A RESULT — the null is unmet:",
      positive:
        `  ✅ A SECOND POLLINATOR PERMITS COEXISTENCE, AND IT IS THE GEOMETRY.\n` +
        `\n` +
        `  Two lineages that are excluded under one animal persist under two with different\n` +
        `  body plans — while two IDENTICAL animals, same bouts and same split budget, still\n` +
        `  exclude. So it is not the extra bout, not the summation and not the visit split.\n` +
        `  The random-mating null does not hold here either, so it is not the demography.\n` +
        `\n` +
        `  That resolves the discrepancy the last run created. Exclusion was never a fact\n` +
        `  about placement divergence; it was a fact about a SINGLE pool of visits, in which\n` +
        `  two isolated lineages must play zero-sum. A second animal gives the competition\n` +
        `  somewhere else to go, and coexistence needs no new mechanism at all.`,
    }).text,
  );
} else if (held(diff) && held(same)) {
  console.log(
    `  ⚠️ COEXISTENCE APPEARS WITH TWO IDENTICAL ANIMALS TOO, so it is the machinery and\n` +
      `  not the pollinators: splitting one budget across two summed bouts is doing the\n` +
      `  work. The geometry arm cannot be read until that is understood.`,
  );
} else {
  console.log(
    `  A SECOND POLLINATOR DOES NOT RESCUE COEXISTENCE. One lineage is still lost with\n` +
      `  two animals of different body plan, so the exclusion is not an artefact of\n` +
      `  having only one pool of visits.\n` +
      `\n` +
      `  The discrepancy with real orchid communities therefore stands and sharpens: it\n` +
      `  is not pollinator number. The remaining candidates are things this model does\n` +
      `  not have — spatial structure at the scale of populations rather than patches,\n` +
      `  or the assumption that population size is fixed, which is what makes two\n` +
      `  isolated lineages compete for slots at all.`,
  );
}
console.log("=".repeat(90));
