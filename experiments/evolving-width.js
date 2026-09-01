/*
 * evolving-width.js — the 2026-08-25 pre-registration
 * (docs/2026-08-25-evolving-width-prereg.md), written before this file.
 *
 * THE QUESTION, and it is the northstar at ROADMAP.md:219 — can a minority
 * advantage be DERIVED from pollination rather than IMPOSED? Temporal
 * assortment (#37) is the only positive in this project that survives its own
 * controls, and it depends on a narrow flowering season that the model SETS: one
 * global constant applied identically to every plant. That is as imposed as the
 * demographic subsidy already ruled question-begging. Here width is a heritable
 * per-plant locus and the run asks whether narrow flowering arises on its own.
 *
 * ⚠️⚠️ S-INVARIANCE IS A REQUIRED CONDITION, NOT A ROBUSTNESS CHECK. The
 * presence predicate is a step function whose steps are set by the number of
 * slices: centres are 1/S apart, so below width = 1/S no plant is ever in two
 * slices at once and some catch ZERO. A locus free to move across those
 * thresholds will climb a staircase belonging to the discretisation. If the
 * evolved width tracks 1/S, the result is an artefact and this file says so.
 * `node tools/slice-coverage.js` re-derives the table.
 *
 * ⚠️ THE PRIMARY COMPARISON IS TREATMENT AGAINST THE SHUFFLED ARM, not against
 * the founding width. Width is clamped at both ends and a clamped trait drifts
 * inward from a boundary under mutation alone, so "narrower than it started" is
 * partly arithmetic. The shuffled arm has identical mutation, identical clamping
 * and an identical multiset of expressed widths, and differs only in whether a
 * plant's width is tied to its own fitness. The paired difference cancels what
 * the boundary does.
 */

const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
/* the t interval is imported rather than rewritten — the v2 correction of
 * 2026-08-25 exists because a z interval at n=8 was published as though it were
 * a t interval, and a second hand-rolled copy is how that comes back */
const { interval } = require("../sim/paired-stats.js");

const SMOKE = process.env.EW_SMOKE === "1";
const N0 = SMOKE ? 12 : 30;
const GENS = SMOKE ? 6 : 35;
const SITE_N = SMOKE ? 50 : 160;
const D_EXCL = 8;
/* the published narrow arm, for the fixed-width reference cells */
const WIDTH = 0.12;
const SLICE_SET = (process.env.EW_SLICES || (SMOKE ? "8" : "8,16,32"))
  .split(",")
  .map(Number)
  .filter(Number.isFinite);
const N_SEEDS = SMOKE ? 4 : Number(process.env.EW_SEEDS || 12);
const CONSERVE = process.env.EW_CONSERVE === "1";
/*
 * `EW_DPV=1` is #51's ablation, layered on top of conservation: the same total
 * visits apportioned across slices in proportion to the display each carries,
 * rather than `per/S` to every slice regardless. It removes the empty-time
 * premium and leaves geitonogamy in place — see
 * docs/2026-08-31-empty-time-prereg.md, whose P4 registers this run as
 * DIRECTIONAL ONLY. The sharp test is the gradient tool, which holds the
 * population fixed; at n=12 these intervals are wide and already overlap.
 */
const DPV = process.env.EW_DPV === "1";
const SEEDS = Array.from({ length: N_SEEDS }, (_, i) => i + 1);
/* the mutational step on the width locus. Not swept: the question is whether
 * width moves at all and in which direction, and a rate chosen to make it move
 * further would be tuning the answer. */
const WIDTH_MUT = 0.03;

const optsAt = (extra = {}) => ({ ...I.DEFAULTS, siteN: SITE_N, ...extra });
const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const sd = (xs) => {
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
};
const f3 = (x) =>
  x == null || Number.isNaN(x) ? "     - " : x.toFixed(3).padStart(7);
const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));

/*
 * TRAP 2, MEASURED RATHER THAN WORRIED ABOUT. Blooms may be pulled toward slice
 * centres, an S-periodic attractor with no biological referent. Distance from a
 * bloom to its nearest centre is uniform on [0, 1/(2S)] under no attraction, so
 * its expectation is 1/(4S); the ratio of the observed mean to that is 1 for an
 * indifferent population and below 1 for one drawn onto the grid.
 */
function gridPull(blooms, S) {
  if (!blooms || !blooms.length) return null;
  const d = blooms.map((b) => {
    let best = Infinity;
    for (let k = 0; k < S; k++) best = Math.min(best, I.ringDist(b, k / S));
    return best;
  });
  return mean(d) / (1 / (4 * S));
}

function replicate(seed, phen) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const brng = I.bloomRng(seed);
  const wrng = phen.widthLocus ? I.widthRng(seed) : null;
  const opts = optsAt({ phenology: phen });
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  if (!built) return null;

  let pop = built.pop;
  const ancVar0 = I.ancestryVar(pop);
  const wMean = [];
  const wSd = [];
  const lineage = [];
  const pull = [];
  let extinct = false;
  let lastWidths = null;
  for (let g = 0; g < GENS; g++) {
    if (pop.length < 2) {
      extinct = true;
      break;
    }
    const res = I.step(pop, opts, rng, g, srng, brng, wrng);
    if (res.widths) {
      wMean.push(mean(res.widths));
      /* ⚠️ trap 4: the dispersion travels beside the centre at every step. A
       * bimodal outcome — some lineages narrow, some wide — is a different and
       * more interesting result than a uniform shift, and a mean hides it. */
      wSd.push(sd(res.widths));
      lastWidths = res.widths;
    }
    if (res.bloomLineage != null) lineage.push(res.bloomLineage);
    const gp = gridPull(res.blooms, phen.slices);
    if (gp != null) pull.push(gp);
    pop = res.pop;
  }
  return {
    seed,
    fate: I.fateOf(pop, ancVar0, extinct),
    /* the LAST few generations — where the width distribution has settled */
    width: wMean.length ? mean(wMean.slice(-5)) : null,
    widthSd: wSd.length ? mean(wSd.slice(-5)) : null,
    widthStart: wMean.length ? wMean[0] : null,
    /* ⚠️ EARLY, not late — see the phenology runner. Once a lineage is lost
     * there is no ancestry variation left for flowering time to associate WITH,
     * so a late window measures the resolution rather than the association. */
    lineage: lineage.length ? mean(lineage.slice(0, 10)) : null,
    pull: pull.length ? mean(pull.slice(-5)) : null,
    lastWidths,
  };
}

const fracOf = (f) => (rows) =>
  rows.length ? rows.filter((r) => r.fate === f).length / rows.length : NaN;
const HELD = fracOf("HELD");

/* paired difference over the seeds both arms survived */
function paired(a, b, key) {
  const byA = new Map(a.map((r) => [r.seed, r]));
  const d = [];
  for (const rb of b) {
    const ra = byA.get(rb.seed);
    if (!ra) continue;
    const x = ra[key],
      y = rb[key];
    if (x == null || y == null || Number.isNaN(x) || Number.isNaN(y)) continue;
    d.push(x - y);
  }
  return d.length >= 2 ? interval(d) : null;
}

const excludes0 = (ci) => !!ci && ci.t && (ci.t[0] > 0 || ci.t[1] < 0);

function main() {
  console.log(
    `evolving flowering-window width · ${N0} plants · ${GENS} generations · ` +
      `${SEEDS.length} seeds · d=${D_EXCL} · widthMut=${WIDTH_MUT} · ` +
      `display ${CONSERVE ? "CONSERVED" : "per-slice (job 3529 regime)"}` +
      `${DPV ? " · visits PROPORTIONAL to display (#51 ablation)" : ""}`,
  );
  console.log(
    "founders uniform on (0,1); primary comparison is treatment - shuffled,\n" +
      "so the inward drift of a clamped trait cancels in the pair.",
  );

  const perS = [];

  for (const S of SLICE_SET) {
    /*
     * `EW_CONSERVE=1` spreads a plant's fixed display over the slices it
     * occupies instead of re-offering it whole in each — see
     * docs/2026-08-28-conserved-display-prereg.md. The original run of this
     * experiment (job 3529) was made WITHOUT it, and its finding that width
     * evolves wider is now known to have been measured against a model in which
     * flowering longer MANUFACTURED display. Off by default so that run
     * reproduces.
     *
     * ⚠️ It rides on `base` and on the two fixed-width cells alike, which makes
     * those two rows a built-in control on the flag rather than two rows that
     * merely happen to be reported beside it. THE CONTROL FIRED, and what it
     * caught was a mis-stated invariant rather than a bug:
     *
     *   fixed WIDE   (w=1.0)  : unchanged at S = 8, 16 and 32
     *   fixed NARROW (w=0.12) : unchanged at S=8, MOVED at S=16 and S=32
     *
     * The prereg registered the no-op as a property of equal WIDTH. It is a
     * property of equal OCCUPANCY: conservation divides by the number of slice
     * centres inside a plant's window, and a window of length w on centres 1/S
     * apart catches floor(w*S) or floor(w*S)+1 of them depending on its PHASE.
     * So it is neutral when w*S is an integer (1.0 at every S here) or when the
     * only nonzero occupancy is 1 (0.12*8 = 0.96), and not otherwise
     * (0.12*16 = 1.92 gives {1,2}; 0.12*32 = 3.84 gives {3,4}).
     *
     * ⚠️ SO THE NARROW ROW AT S=16 AND S=32 IS NOT COMPARABLE ACROSS THE TWO
     * ARMS — the model differs there. It stays in the table as the control that
     * detected this, not as a measurement. Nothing published moves: #37 and
     * every other fixed-width call site in the project run at S=8, which
     * tests/conserved-display.test.js now checks by reading #37's own constants.
     */
    const cons = {
      ...(CONSERVE ? { conserveDisplay: true } : {}),
      ...(DPV ? { displayProportionalVisits: true } : {}),
    };
    const base = {
      slices: S,
      widthLocus: true,
      widthMut: WIDTH_MUT,
      ...cons,
    };
    const CELLS = [
      ["treatment (width evolves)", base],
      ["shuffled width (confound)", { ...base, shuffleWidth: true }],
      ["non-heritable width", { ...base, widthNonHeritable: true }],
      ["fixed wide (#37 baseline)", { slices: S, width: 1.0, ...cons }],
      ["fixed narrow (#37 arm)", { slices: S, width: WIDTH, ...cons }],
    ];
    const arms = CELLS.map(([, p]) =>
      SEEDS.map((s) => replicate(s, p)).filter(Boolean),
    );

    rule(`S = ${S} slices · one slice is ${(1 / S).toFixed(4)} of the season`);
    console.log(
      "  arm                             width   sd(w)   start  lineage  gridPull    HELD",
    );
    /*
     * ⚠️ AN ARM WITH NO EXPRESSED WIDTHS MUST PRINT A DASH, NOT 0.000. The
     * fixed-width arms run with the locus OFF, so `widths` is null in every
     * generation and the filtered array is empty — and mean([]) is 0, so the
     * first run of this table reported "fixed wide (#37 baseline)  0.000" in a
     * column headed `width`. A baseline whose width is 1.0 by construction,
     * displaying as zero, is a number that would be read straight into a
     * conclusion. Absent and zero are different and the table has to say which.
     */
    const col = (rows, key) => {
      const xs = rows.map((r) => r[key]).filter((x) => x != null);
      return xs.length ? f3(mean(xs)) : "     - ";
    };
    CELLS.forEach(([name], i) => {
      const rows = arms[i];
      console.log(
        `  ${name.padEnd(30)}${col(rows, "width")}${col(rows, "widthSd")}` +
          `${col(rows, "widthStart")}${col(rows, "lineage")}` +
          `${col(rows, "pull")}${f3(HELD(rows))}`,
      );
    });

    const [treat, shuf, nonher, wide] = arms;
    const dWidth = paired(treat, shuf, "width");
    const dLineage = paired(treat, shuf, "lineage");
    const dHeldWide = interval(
      SEEDS.map((s) => {
        const a = treat.find((r) => r.seed === s);
        const b = wide.find((r) => r.seed === s);
        if (!a || !b) return null;
        return (a.fate === "HELD" ? 1 : 0) - (b.fate === "HELD" ? 1 : 0);
      }).filter((x) => x != null),
    );
    const dNonHer = paired(treat, nonher, "width");

    /*
     * ⚠️ A ZERO-WIDTH INTERVAL IS NOT A TIGHT RESULT. When every paired
     * difference is identical the t interval collapses to [0.000, 0.000] — at
     * n=4 exactly as readily as at n=40 — and that width reports the SAMPLE
     * BEING CONSTANT, not the precision of the estimate. The spatial run
     * published one of these as though it were a tight refutation, so it is
     * labelled here rather than printed bare.
     */
    const ciStr = (ci) => {
      if (!ci || !ci.t) return "not estimable";
      const body = `${ci.mean >= 0 ? "+" : ""}${ci.mean.toFixed(3)} [${ci.t[0].toFixed(3)}, ${ci.t[1].toFixed(3)}] (n=${ci.n}, t)`;
      return ci.degenerate
        ? `${body}  ⚠️ DEGENERATE: every seed gave the same difference; the width is not a precision`
        : body;
    };
    console.log("");
    console.log(`  evolved width, treatment - shuffled : ${ciStr(dWidth)}`);
    console.log(`  evolved width, treatment - nonherit : ${ciStr(dNonHer)}`);
    console.log(`  bloomLineage, treatment - shuffled  : ${ciStr(dLineage)}`);
    console.log(`  HELD, treatment - fixed wide        : ${ciStr(dHeldWide)}`);

    perS.push({
      S,
      width: mean(treat.map((r) => r.width).filter((x) => x != null)),
      dWidth,
      dLineage,
      dHeldWide,
      pull: mean(treat.map((r) => r.pull).filter((x) => x != null)),
    });
  }

  /* ------------------------------------------------- THE REQUIRED CONDITIONS */

  rule("the four conditions, as registered");

  const c1 = perS.every((r) => excludes0(r.dWidth) && r.dWidth.mean < 0);
  /*
   * ⚠️⚠️ CONDITION 2, AND IT IS THE ONE THE DESIGN EXISTS FOR. If the evolved
   * width tracks 1/S the locus is climbing the discretisation, not responding to
   * pollination. Tracking is tested as a RATIO: width/(1/S) constant across S is
   * the artefact signature; a width that stays put in absolute terms while 1/S
   * changes by 4x is the biological one.
   */
  /*
   * ⚠️ AND THE PREDICATE HAS TO BE DIMENSIONLESS ON BOTH SIDES OR IT CANNOT
   * COMPARE THEM. The first version of this line tested a spread in `width`
   * against a spread in `width*S` — quantities in different units, scaled by an
   * S to paper over it — which is precisely the guard-that-cannot-observe-its-
   * referent shape this project keeps catching. Two hypotheses, one statistic
   * each, both coefficients of variation:
   *
   *   width is S-invariant   ->  width is near-constant across S  ->  CV(width)   small
   *   width tracks the grid  ->  width*S is near-constant         ->  CV(width*S) small
   *
   * Whichever is smaller names which description fits the data.
   *
   * ⚠️ WITH THREE VALUES OF S THIS IS A DIRECTION, NOT A TEST, and both numbers
   * are printed so the reader can see how close the call was rather than being
   * handed the verdict alone.
   */
  const cv = (xs) => {
    const m = mean(xs);
    return m > 1e-12 ? sd(xs) / m : NaN;
  };
  const cvAbs = cv(perS.map((r) => r.width));
  const cvGrid = cv(perS.map((r) => r.width * r.S));
  const tracksGrid = perS.length > 1 && cvGrid < cvAbs;
  const c2 = perS.length > 1 && !tracksGrid;
  const c3 = perS.every((r) => excludes0(r.dLineage) && r.dLineage.mean < 0);
  const c4 = perS.every((r) => excludes0(r.dHeldWide) && r.dHeldWide.mean > 0);

  console.log(
    `  1. evolved width below the shuffled arm, t excludes 0, every S : ${c1 ? "YES" : "no"}`,
  );
  console.log(
    `  2. S-invariant (does NOT track 1/S)                            : ${
      perS.length > 1 ? (c2 ? "YES" : "NO — ARTEFACT") : "not tested (one S)"
    }`,
  );
  if (perS.length > 1)
    console.log(
      `       CV(width) ${cvAbs.toFixed(4)}   vs   CV(width*S) ${cvGrid.toFixed(4)}` +
        `   -> ${tracksGrid ? "width*S is the steadier quantity: THE GRID" : "width is the steadier quantity: S-invariant"}`,
    );
  perS.forEach((r) =>
    console.log(
      `       S=${String(r.S).padStart(2)}  width ${r.width.toFixed(4)}   width*S ${(r.width * r.S).toFixed(3)}   1/S ${(1 / r.S).toFixed(4)}   gridPull ${f3(r.pull)}`,
    ),
  );
  console.log(
    `  3. bloomLineage falls with it (assortment actually delivered)  : ${c3 ? "YES" : "no"}`,
  );
  console.log(
    `  4. HELD rises against the fixed-wide control                   : ${c4 ? "YES" : "no"}`,
  );

  const positive = c1 && c2 && c3 && c4;
  console.log("");
  if (positive) {
    console.log("VERDICT: POSITIVE — all four registered conditions met.");
  } else if (c1 && c3 && c4 && !c2) {
    /* the case the pre-registration named in advance and refused to let pass */
    console.log(
      "VERDICT: NEGATIVE (ARTEFACT). Conditions 1, 3 and 4 hold but the evolved\n" +
        "width tracks 1/S, so the locus is climbing the slice grid rather than\n" +
        "responding to pollination. The pre-registration set this out as a\n" +
        "negative before the run, and it is reported as one.",
    );
  } else {
    console.log(
      "VERDICT: NEGATIVE — not every registered condition is met. The failing\n" +
        "conditions are listed above; a partial pass is not a positive with a caveat.",
    );
  }
}

module.exports = { replicate, gridPull, paired };

if (require.main === module) main();
