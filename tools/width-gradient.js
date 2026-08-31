/*
 * What does a plant actually GAIN or LOSE by flowering for longer?
 *
 * WHY THIS EXISTS. docs/2026-08-25-evolving-width-prereg.md predicts (P2) that
 * narrowing stops short of zero because "the visit budget is SPLIT across
 * slices, not duplicated, so a plant absent from a slice simply forgoes it".
 * That sentence is true and incomplete, and the missing half changes the sign of
 * the argument.
 *
 * sim/carryover.js:295-341 builds the cumulative choice array from the
 * abundances it is HANDED and draws `r = rng() * acc`, where `acc` is the sum
 * over the plants actually in flower in that slice. The draw is renormalised
 * over the present plants. So a plant that skips a slice forgoes those visits,
 * but a plant present in a THINLY OCCUPIED slice takes a larger share of it.
 * Narrowing buys fewer slices at a better exchange rate, and which effect wins
 * depends on how many other plants are in flower — it is frequency-dependent,
 * not a fixed cost.
 *
 * That is trap 3 of the pre-registration ("a positive that is really 'fewer
 * competitors'") arriving from the opposite direction: it can make WIDENING pay
 * rather than narrowing. This tool measures the gradient directly instead of
 * arguing about it, on a population held fixed, so the answer does not depend on
 * an evolutionary run that takes forty minutes and confounds selection with
 * drift.
 *
 * ⚠️⚠️ AND THE ACCOUNT ABOVE, WHICH THIS TOOL WAS BUILT TO SUPPORT, TURNED OUT
 * TO BE THE WRONG HALF OF THE STORY — established by this tool's own output.
 * Renormalisation is real but secondary. The dominant effect was that
 * `sim/ibm.js` re-offered a plant's whole display share in EVERY slice it was in
 * flower, so flowering all season MANUFACTURED S times the display of flowering
 * once. The tell was sitting in the table this file prints: against a saturated
 * resident the wide-to-narrow ratio is 8.26 at S=8 and 16.52 at S=16 — it TRACKS
 * S, which duplication predicts exactly and a missing cost does not predict at
 * all. Run with CONSERVE=1 for the conserved regime; see
 * docs/2026-08-28-conserved-display.md.
 *
 *   node tools/width-gradient.js [slices] [resident-width]
 *   CONSERVE=1 REPS=24 node tools/width-gradient.js 8 1.0
 */

const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");

const N = 30;
const SITE_N = 160;
const REPS = Math.max(1, Number(process.env.REPS) || 6);

/*
 * `CONSERVE=1` runs the same gradient with a plant's display SPREAD over the
 * slices it occupies instead of re-offered at full strength in each — see
 * docs/2026-08-28-conserved-display-prereg.md. Off by default so the published
 * table above regenerates unchanged.
 */
const CONSERVE = process.env.CONSERVE === "1";

/*
 * `DPV=1` is #51's ablation: the same total visits apportioned across slices in
 * PROPORTION to the display each carries, instead of `per/S` to every slice
 * regardless. It removes the empty-time premium and leaves geitonogamy in place
 * — see docs/2026-08-31-empty-time-prereg.md, which registers the predicted
 * ratios BEFORE this flag existed.
 */
const DPV = process.env.DPV === "1";

/*
 * Occupancy of the focal plant, whose bloom is pinned to 0 by main(). Reported
 * beside the flow because the registered per-width predictions are functions of
 * `k_f`, not of width — and width maps to `k_f` through a STEP function whose
 * steps belong to `S`. Reading `k_f` off the run rather than assuming it is what
 * lets a missed prediction be attributed to the share model instead of to a
 * guess about which slices a width covers.
 */
function occupancy(width, S) {
  const ringDist = (a, b) => {
    const d = Math.abs(a - b) % 1;
    return d > 0.5 ? 1 - d : d;
  };
  let k = 0;
  for (let i = 0; i < S; i++) if (ringDist(0, i / S) <= width / 2) k++;
  return k;
}

const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

/*
 * One generation, with plant 0's width set to `focal` and everyone else's to
 * `resident`. Returns plant 0's siring + receipt, which is what selection on the
 * locus actually sees.
 *
 * ⚠️ THE FOCAL PLANT IS ALWAYS INDEX 0 AND ITS GENOME IS NEVER CHANGED between
 * conditions — only its width. sitesOf seeds site sampling from the array index,
 * so comparing index 0 across conditions is the only comparison in which the
 * geometry is held fixed.
 */
function focalFlow(focal, resident, S, seed) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const opts = {
    ...I.DEFAULTS,
    siteN: SITE_N,
    phenology: {
      slices: S,
      widthLocus: true,
      widthMut: 0,
      conserveDisplay: CONSERVE,
      displayProportionalVisits: DPV,
    },
  };
  const built = I.foundTwoLineages(N, rng, srng, 8, opts);
  if (!built) return null;
  const pop = built.pop;
  /* blooms spread evenly so occupancy is a property of WIDTH rather than of
   * where the random bloom draws happened to fall */
  pop.forEach((ind, i) => {
    const b = i / pop.length;
    ind.h1[I.BLOOM_GENE] = b;
    ind.h2[I.BLOOM_GENE] = b;
    const w = i === 0 ? focal : resident;
    ind.h1[I.WIDTH_GENE] = w;
    ind.h2[I.WIDTH_GENE] = w;
  });
  const res = I.step(
    pop,
    opts,
    rng,
    0,
    srng,
    I.bloomRng(seed),
    I.widthRng(seed),
  );
  const T = res.T;
  if (!T) return null;
  let sired = 0,
    received = 0;
  for (let j = 0; j < T.length; j++) {
    if (j === 0) continue;
    sired += T[0][j];
    received += T[j][0];
  }
  /*
   * ⚠️ VISITS ARE REPORTED BESIDE FLOW BECAUSE THEY ANSWER A DIFFERENT
   * QUESTION, and #51's decisive prediction (P2) is about this column and not
   * about the flow one. Flow excludes self-transfer (`j === 0` is skipped just
   * above), so it carries the geitonogamy penalty on a concentrated plant;
   * visits do not. Under the proportional ablation expected visits collapse to
   * `total * base[f]`, independent of width — so a visits ratio that is NOT
   * 1.000 means the ablation did not do what it claims, whatever the flow
   * column says.
   */
  return {
    sired,
    received,
    total: sired + received,
    visits: res.visitsTo ? res.visitsTo[0] : null,
    spent: res.visitsSpent,
    emptySlices: res.emptyVisitSlices,
  };
}

function main() {
  const S = Math.max(2, Number(process.argv[2]) || 8);
  const resident = Number(process.argv[3]) || 1.0;
  console.log(
    `focal plant's pollen flow vs its own flowering width\n` +
      `S = ${S} slices (1/S = ${(1 / S).toFixed(4)})   ` +
      `resident width = ${resident}   n = ${N}   ${REPS} seeds   ` +
      `display ${CONSERVE ? "CONSERVED (base/k_f per slice)" : "per-slice (base in every slice)"}\n`,
  );
  console.log(
    "  focal width  k_f    sired  received     total   vs resident" +
      "     visits  vs res  empty  spent",
  );
  const widths = [0.02, 0.06, 0.12, 0.125, 0.25, 0.5, 0.75, 1.0];
  let refTotal = null;
  let refVisits = null;
  const spentSeen = new Set();
  for (const w of widths) {
    const rows = [];
    for (let s = 1; s <= REPS; s++) {
      const r = focalFlow(w, resident, S, s);
      if (r) rows.push(r);
    }
    if (!rows.length) continue;
    const t = mean(rows.map((r) => r.total));
    const v = mean(rows.map((r) => r.visits));
    if (w === resident) {
      refTotal = t;
      refVisits = v;
    }
    rows.forEach((r) => spentSeen.add(r.spent));
    console.log(
      `  ${String(w).padEnd(11)}${String(occupancy(w, S)).padStart(4)} ${mean(
        rows.map((r) => r.sired),
      )
        .toFixed(1)
        .padStart(9)}${mean(rows.map((r) => r.received))
        .toFixed(1)
        .padStart(10)}${t.toFixed(1).padStart(10)}` +
        (refTotal
          ? `${(t / refTotal).toFixed(3).padStart(14)}`
          : "".padStart(14)) +
        `${v.toFixed(1).padStart(11)}` +
        (refVisits
          ? `${(v / refVisits).toFixed(3).padStart(8)}`
          : "".padStart(8)) +
        `${String(mean(rows.map((r) => r.emptySlices)).toFixed(1)).padStart(7)}` +
        `${String(rows[0].spent).padStart(7)}`,
    );
  }
  /*
   * ⚠️ THE CONFOUND GUARD, PRINTED RATHER THAN ASSUMED. If the arms did not all
   * spend the same number of visits, "empty time is worthless" and "fewer
   * visits" are not separable and every ratio above is uninterpretable.
   */
  console.log(
    `\n  total visits spent: ${[...spentSeen].join(", ")}` +
      (spentSeen.size === 1
        ? "  — identical across every width, so the ratios are not a budget difference"
        : "  ⚠️⚠️ NOT IDENTICAL — the comparison is confounded with budget size"),
  );
  console.log(
    "\n  A ratio above 1 at widths BELOW the resident means narrowing pays.\n" +
      "  A ratio below 1 there means it does not, and P1 predicts the wrong\n" +
      "  direction — which is a result about the model, not a bug in it.",
  );
}

module.exports = { focalFlow };

if (require.main === module) main();
