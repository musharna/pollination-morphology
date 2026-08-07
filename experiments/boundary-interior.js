/*
 * boundary-interior.js — is the rare-morph penalty in a patch ENTIRELY a
 * composition effect?
 *
 * ROADMAP B, the open item left by the patch-size run: "measure boundary and
 * interior plants SEPARATELY". That run tried to answer the question by growing
 * the ring and returned ±0.492 — an interval spanning penalty to advantage,
 * reported as a failure to measure. Growing further costs 9x per row because a
 * locally foraging bee DIFFUSES and visits must scale as the square of the ring.
 * This asks the same question at 4/24 for the price of one row.
 *
 * ⚠️ PRE-REGISTERED, AND SHARPER THAN THE ROADMAP'S PHRASING.
 *
 * The boundary-dilution mechanism says a plant at the edge of its patch wastes
 * transfer on neighbours of the other morph. Note what that claims: dilution
 * depends on STRUCTURAL POSITION, not on which morph you carry. A boundary plant
 * is diluted whether it is rare or common. The rare patch is penalised only
 * because MORE OF IT IS BOUNDARY — 2 of 4 against 2 of 20.
 *
 * So the mechanism predicts BOTH sub-ratios sit at parity:
 *
 *   H-comp   boundary-only rare/common ~ 1  AND  interior-only rare/common ~ 1,
 *            while the POOLED ratio sits below 1. The penalty is then purely a
 *            weighting of two unbiased sub-populations — a composition effect.
 *
 *   REFUTED IF either sub-ratio sits clearly below 1. That would mean a rare
 *   plant does worse than a common plant IN THE SAME STRUCTURAL POSITION, which
 *   boundary dilution cannot explain and which would be a genuine rare-morph
 *   penalty surviving spatial structure.
 *
 * ⚠️ THE SPLIT NEEDS ITS OWN POSITIVE CONTROL, because "boundary and interior
 * look the same" is one of the possible answers and a broken split would produce
 * it on every input. Under GLOBAL foraging the bee ignores the arrangement
 * entirely, so boundary and interior are the same plants wearing different
 * labels and must read equal. Under LOCAL foraging they must differ. That
 * contrast is measured on the IDENTICAL-MORPH configuration, where placement is
 * held constant and position is the only thing that varies — so it isolates the
 * geometry rather than confounding it with the morph.
 */

const P = require("../sim/placement.js");
const C = require("../sim/carryover.js");
const E = require("../sim/evolve.js");

const SMOKE = process.env.BI_SMOKE === "1";
const N = 24;
const N_RARE = 4;
const N_COMMON = 20;
const VISITS = SMOKE ? 1500 : 9000;
const RANGE_LOCAL = 0.03;
/* Draws are the cheap axis: variance falls with more site-set draws at LINEAR
 * cost, where tightening by growing the ring costs 9x per row. That asymmetry is
 * the whole reason this experiment asks the question at 4/24. */
const N_DRAWS = SMOKE ? 2 : Number(process.env.BI_DRAWS || 6);
const DRAWS = Array.from({ length: N_DRAWS }, (_, i) => i);
const BOUT_SEEDS = SMOKE ? [13] : [13, 29, 47];

if (SMOKE)
  console.log(
    "\n*** BI_SMOKE=1 — tiny configuration. Exercises the code path and the\n" +
      "*** reporting. THE NUMBERS BELOW ARE NOT RESULTS.\n",
  );

const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));
const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

function meanPlacement(hits) {
  if (!hits.length) return null;
  let cs = 0;
  let sn = 0;
  for (const h of hits) {
    cs += Math.cos(h.phi);
    sn += Math.sin(h.phi);
  }
  return { s: mean(hits.map((h) => h.s)), phi: Math.atan2(sn, cs) };
}
const dist = (a, b) => C.bodyDist({ s: a.s, phi: a.phi }, b.s, b.phi);

const BEE = P.DEFAULT_BEE;
const build = (g, seed) => C.siteSet(E.toFlower(g), BEE, { n: 110, seed });
const viable = (s) => s.anther.length && s.stigma.length;
function buildViable(g, seed) {
  for (let k = 0; k < 8; k++) {
    const s = build(g, seed + k * 9973);
    if (viable(s)) return s;
  }
  return null;
}

/*
 * The focal morph occupies a contiguous arc on the ring, exactly as the patch
 * work laid it out. On a ring an arc of length k has exactly TWO boundary
 * members — its two ends — whatever k is. That is the whole asymmetry: the
 * boundary COUNT is constant while the patch size is not.
 */
function layout(nFocal) {
  const pos = Array.from({ length: N }, (_, i) => i / N);
  const focal = new Array(N).fill(false);
  for (let i = 0; i < nFocal; i++) focal[i] = true;
  const boundary = new Set([0, nFocal - 1]);
  const interior = [];
  for (let i = 1; i < nFocal - 1; i++) interior.push(i);
  return { pos, focal, boundary: [...boundary], interior };
}

/*
 * Per-capita transfer for a named subset of the focal plants. Returns the
 * boundary and interior figures from the SAME bout, so nothing about the split
 * can be an artefact of running them separately.
 */
function perCapita(focalG, resG, nFocal, tag, forageRange) {
  const { pos, focal, boundary, interior } = layout(nFocal);
  const ss = [];
  for (let i = 0; i < N; i++) {
    const s = buildViable(focal[i] ? focalG : resG, tag + i * 13);
    if (!s) return null;
    ss.push(s);
  }
  const bAcc = [];
  const iAcc = [];
  const allAcc = [];
  for (const seed of BOUT_SEEDS) {
    const r = C.runBout(ss, new Array(N).fill(1 / N), {
      visits: VISITS,
      seed,
      positions: pos,
      forageRange,
    });
    const per = (idx) => {
      if (!idx.length) return null;
      let tot = 0;
      for (const i of idx)
        for (let j = 0; j < N; j++) {
          if (i === j) continue;
          tot += r.T[i][j] + r.T[j][i];
        }
      return tot / idx.length;
    };
    const b = per(boundary);
    const it = per(interior);
    const all = per([...boundary, ...interior]);
    if (b === null || it === null || all === null) return null;
    bAcc.push(b);
    iAcc.push(it);
    allAcc.push(all);
  }
  return { b: mean(bAcc), i: mean(iAcc), all: mean(allAcc) };
}

function ci(xs) {
  const m = mean(xs);
  if (xs.length < 2) return { m, half: NaN };
  const sd = Math.sqrt(
    xs.reduce((a, x) => a + (x - m) * (x - m), 0) / (xs.length - 1),
  );
  /* two-sided 95% t by degrees of freedom; the draw count is now a knob, so a
   * single hard-coded t would silently mis-size every interval off n = 6 */
  const T = {
    1: 12.706,
    2: 4.303,
    3: 3.182,
    4: 2.776,
    5: 2.571,
    6: 2.447,
    7: 2.365,
    8: 2.306,
    9: 2.262,
    10: 2.228,
    12: 2.179,
    15: 2.131,
    20: 2.086,
    25: 2.06,
    30: 2.042,
  };
  const df = xs.length - 1;
  let t = 1.96;
  for (const k of Object.keys(T)
    .map(Number)
    .sort((a, b) => a - b))
    if (df <= k) {
      t = T[k];
      break;
    }
  return { m, half: (t * sd) / Math.sqrt(xs.length) };
}

// ------------------------------------------------------------------ genomes

const rng0 = E.makeRng(5);
let res = null;
for (let i = 0; i < 300; i++) {
  const g = E.randomGenome(rng0);
  const s = build(g, 100 + i);
  if (!viable(s)) continue;
  if (!res || s.contactRate > res.rate) res = { g, rate: s.contactRate, s };
}
const rngM = E.makeRng(77);
let far = null;
for (let k = 0; k < 40; k++) {
  const mg = E.mutate(res.g, rngM, 0.8 + 0.8 * (k / 40));
  const ms = build(mg, 6000 + k);
  if (!viable(ms)) continue;
  const d = dist(meanPlacement(ms.anther), meanPlacement(res.s.anther));
  if (!far || d > far.d) far = { g: mg, d };
}
console.log(
  `\n  focal morph at placement distance ${far.d.toFixed(1)}; ` +
    `${DRAWS.length} site-set draws x ${BOUT_SEEDS.length} bout seeds per cell`,
);

// ------------------------------------------------------ the split's control

/*
 * ⚠️ RUN FIRST, BECAUSE EVERY VERDICT BELOW DEPENDS ON IT.
 *
 * ⚠️⚠️ THE FIRST VERSION OF THIS CONTROL COULD NOT HAVE FIRED. It used the
 * IDENTICAL-MORPH configuration, on the reasoning that holding placement
 * constant leaves position as the only variable. But if every plant carries the
 * same morph there is NO OTHER MORPH TO BE DILUTED BY, so boundary dilution
 * cannot occur there at any foraging range — the control was certifying a
 * mechanism it had removed. Caught by the smoke run reporting b/i above 1.
 *
 * The right configuration is the real two-morph one. Within the focal arc every
 * plant carries the SAME genome, so placement is still held constant; what
 * differs is that the two end plants have other-morph neighbours and the
 * interior ones do not. Local foraging must separate them; global foraging must
 * not, because then the bee ignores the arrangement entirely.
 */
rule("CONTROL — does the boundary/interior split measure locality at all?");
console.log(
  "  Real two-morph layout. Within the focal arc the genome is constant, so only\n" +
    "  the NEIGHBOURHOOD differs. b/i is boundary over interior per-capita, in the\n" +
    "  20-plant arc.\n",
);
const splitRatios = {};
for (const [label, range] of [
  ["local  (0.03)", RANGE_LOCAL],
  ["global (inf)", Infinity],
]) {
  const rs = [];
  for (const d of DRAWS) {
    const c = perCapita(far.g, res.g, N_COMMON, 410000 + d * 400, range);
    if (c && c.i > 0) rs.push(c.b / c.i);
  }
  const X = ci(rs);
  splitRatios[label.trim().split(" ")[0]] = X;
  console.log(
    `  ${label.padEnd(15)} b/i = ${X.m.toFixed(3)} +/- ${X.half.toFixed(3)}`,
  );
}
const local = splitRatios.local;
const global = splitRatios.global;
const splitBites = local.m + local.half < 1;
const globalFlat = global.m - global.half < 1 && global.m + global.half > 1;
console.log(
  `\n  local separates boundary from interior      ${splitBites ? "ok" : "FAIL"}\n` +
    `  global does NOT (arrangement is ignored)    ${globalFlat ? "ok" : "FAIL"}`,
);
if (!splitBites || !globalFlat)
  console.log(
    "\n  ⚠️ THE SPLIT DOES NOT DO WHAT IT CLAIMS. Either it cannot see the\n" +
      "  neighbourhood under local foraging, or it reports a difference where the\n" +
      "  bee ignores position. EVERY VERDICT BELOW IS VOID.",
  );

// ------------------------------------------------------------------ the test

rule("Rare/common per-capita, split by structural position (4/24, local)");
console.log(
  "  Prediction: BOTH sub-ratios at parity, pooled below it. Corrected by the\n" +
    "  identical-morph run in the same cell, which carries a real bias.\n",
);

const cols = { b: [], i: [], all: [] };
for (const d of DRAWS) {
  const tag = 200000 + d * 400;
  const rareF = perCapita(far.g, res.g, N_RARE, tag, RANGE_LOCAL);
  const commF = perCapita(far.g, res.g, N_COMMON, tag + 5000, RANGE_LOCAL);
  const rareC = perCapita(res.g, res.g, N_RARE, tag + 300000, RANGE_LOCAL);
  const commC = perCapita(res.g, res.g, N_COMMON, tag + 305000, RANGE_LOCAL);
  if (!rareF || !commF || !rareC || !commC) continue;
  for (const k of ["b", "i", "all"]) {
    if (!(commF[k] > 0) || !(commC[k] > 0) || !(rareC[k] > 0)) continue;
    const raw = rareF[k] / commF[k];
    const ctrl = rareC[k] / commC[k];
    if (ctrl > 0) cols[k].push(raw / ctrl);
  }
}

const B = ci(cols.b);
const I = ci(cols.i);
const A = ci(cols.all);
console.log("  subset          n     corrected rare/common (95% CI)");
console.log(
  `  boundary (2/2)  ${String(cols.b.length).padStart(2)}    ${B.m.toFixed(3)} +/- ${B.half.toFixed(3)}`,
);
console.log(
  `  interior (2/18) ${String(cols.i.length).padStart(2)}    ${I.m.toFixed(3)} +/- ${I.half.toFixed(3)}`,
);
console.log(
  `  pooled          ${String(cols.all.length).padStart(2)}    ${A.m.toFixed(3)} +/- ${A.half.toFixed(3)}`,
);

// ---------------------------------------------------------------- verdict

rule("VERDICT");
const spans1 = (x) => x.m - x.half < 1 && x.m + x.half > 1;
const below1 = (x) => x.m + x.half < 1;

if (!splitBites || !globalFlat) {
  console.log("  Void — the split's own control failed above.");
} else if (!cols.b.length || !cols.i.length) {
  console.log("  No usable cells.");
} else if (!below1(A)) {
  /*
   * ⚠️⚠️ THIS BRANCH EXISTS BECAUSE THE ONE BELOW COULD PASS ON PURE NOISE.
   * "Both sub-ratios span 1.0" is satisfied automatically when the intervals are
   * wide enough to span everything — including by a run with no signal at all.
   * The composition claim is only meaningful if there is a POOLED PENALTY TO
   * DECOMPOSE, so a pooled ratio that does not sit below 1 is an underpowered
   * measurement and is reported as one, not as a confirmation.
   */
  console.log(
    `  ⚠️ UNDERPOWERED — the POOLED ratio is ${A.m.toFixed(3)} +/- ${A.half.toFixed(3)}, which does not\n` +
      "  exclude 1.0, so there is no penalty in this cell to attribute to anything.\n" +
      "  The sub-ratios cannot discriminate here: with intervals this wide the\n" +
      "  composition hypothesis 'holds' whatever the truth is, which makes it an\n" +
      "  untested hypothesis rather than a supported one.\n\n" +
      "  This is a failure to measure, and the fix is more DRAWS (linear cost via\n" +
      "  BI_DRAWS) rather than a bigger ring (9x cost) — which was the point of\n" +
      "  asking the question at 4/24 in the first place.",
  );
} else if (spans1(B) && spans1(I)) {
  console.log(
    `  ✅ H-comp HELD against a real penalty (pooled ${A.m.toFixed(3)} +/- ${A.half.toFixed(3)}, excluding 1).\n` +
      "  Both sub-ratios span 1.0: a rare plant and a common plant in the SAME\n" +
      "  structural position do equally well, so the penalty is a COMPOSITION effect\n" +
      "  — the rare patch is penalised for being mostly boundary (2 of 4) rather than\n" +
      "  for being rare.",
  );
} else if (below1(B) || below1(I)) {
  const which = below1(I) ? "INTERIOR" : "boundary";
  console.log(
    `  ⚠️⚠️ H-comp REFUTED: the ${which} sub-ratio sits clearly below 1. A rare plant\n` +
      "  does worse than a common one IN THE SAME STRUCTURAL POSITION, which boundary\n" +
      "  dilution cannot explain.",
  );
  if (below1(I))
    console.log(
      "  Interior is the damning one: those plants have only own-morph neighbours,\n" +
        "  so a penalty there is a rare-morph penalty that spatial structure does not\n" +
        "  remove — and the patch-size prediction was derived from the wrong mechanism.",
    );
} else {
  console.log(
    "  INCONCLUSIVE — the intervals neither span 1.0 nor exclude it cleanly.\n" +
      "  Reported as a failure to measure rather than resolved by choosing a side.",
  );
}
/*
 * ⚠️ POST HOC, AND LABELLED AS SUCH. This was not pre-registered, so it is a
 * consistency check and not a confirmation — the project has been burned once by
 * a post-hoc contrast (#29's exclusion finding, which then needed a
 * pre-registered replication before it could be believed).
 *
 * What makes it worth printing anyway: the b/i figure comes from the CONTROL,
 * measured on the 20-plant arc, while the pooled ratio is a 4-vs-20 comparison.
 * So composition alone predicts the pooled penalty from a quantity measured
 * somewhere else, and the prediction can miss.
 *
 * With interior per-capita I and boundary B = (b/i)·I, an arc of k plants has
 * exactly 2 boundary members, so its mean per-capita is ((b/i)·2 + (k-2))·I / k.
 */
const bi = local.m;
const arcMean = (k) => (bi * 2 + (k - 2)) / k;
const predicted = arcMean(N_RARE) / arcMean(N_COMMON);
rule("POST HOC — does composition alone predict the size of the penalty?");
console.log(
  `  b/i measured on the 20-arc = ${bi.toFixed(3)} (control, independent of the pooled cell)\n` +
    `  => predicted pooled rare/common = ${predicted.toFixed(3)}\n` +
    `     observed  pooled rare/common = ${A.m.toFixed(3)} +/- ${A.half.toFixed(3)}`,
);
console.log(
  Math.abs(predicted - A.m) < A.half
    ? "  The prediction falls inside the observed interval. ⚠️ Post hoc — it would\n" +
        "  need pre-registering on fresh seeds before it counts as a test."
    : "  ⚠️ The prediction falls OUTSIDE the observed interval, so composition alone\n" +
        "  does not account for the penalty's SIZE even if it accounts for its sign.",
);

console.log(
  `\n  ⚠️ Interior of the rare patch is 2 plants; that is the arithmetic of a\n` +
    "  4-plant arc on a ring and no sample size fixes it. A wide interior interval\n" +
    "  here is a fact about the design, not noise to average away.\n" +
    "  ⚠️ And spanning 1.0 is NOT proving parity: at this width an interior penalty\n" +
    "  of ~10-15% would not have been detected. The claim is that no LARGE\n" +
    "  position-independent penalty survives, not that none does.",
);
console.log();
