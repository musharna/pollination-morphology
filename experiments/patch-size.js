/*
 * Roadmap B, step 6 — does a LARGER PATCH push a rare morph past parity?
 *
 * Spatial structure lifted rare/common from 0.247 to 0.950 by giving a rare
 * morph neighbours of its own kind. It stopped just short of 1.0, and the arm
 * that grew the patch was under-powered (non-monotone, one site-set draw per
 * cell) so its apparent crossing was explicitly NOT claimed. This is that arm
 * done properly: many independent draws, seed-averaged, bias-corrected.
 *
 * ⚠️ PRE-REGISTERED PREDICTION, derived before running.
 *
 * With a symmetric foraging kernel and uniform abundance the bee's stationary
 * distribution over plants is UNIFORM — every plant is visited at the same rate
 * regardless of which morph it carries. Inside a patch, a plant's neighbours are
 * its own morph, so its visits are productive. The only asymmetry left is
 * BOUNDARY DILUTION: a plant at the edge of its patch has neighbours of the
 * other morph and wastes transfer on them, and the rare patch has a far higher
 * boundary fraction — 2 of 4 against 2 of 20.
 *
 * That argues the ratio should APPROACH 1 FROM BELOW as the patch grows
 * (boundary fraction 2/4 -> 2/8 -> 2/12 ...) and should NOT cross it. Spatial
 * structure would then buy NEUTRALITY, not advantage — enough for drift to
 * maintain a rare placement, not enough for disruptive selection to favour one.
 *
 * If it does cross 1.0, the mechanism above is not what is operating and the
 * result needs a different explanation. Either outcome is informative, which is
 * the point of writing the prediction down first.
 */

const P = require("../sim/placement.js");
const C = require("../sim/carryover.js");
const E = require("../sim/evolve.js");

const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

function meanPlacement(hits) {
  if (!hits.length) return null;
  let cs = 0,
    sn = 0;
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

/* Focal plants occupy a contiguous arc; positions are identical either way. */
function layout(nFocal, n) {
  const pos = Array.from({ length: n }, (_, i) => i / n);
  const focal = new Array(n).fill(false);
  for (let i = 0; i < nFocal; i++) focal[i] = true;
  return { pos, focal };
}

const BOUT_SEEDS = [13, 29, 47];

function focalPerCapita(focalG, resG, nFocal, n, tag, forageRange, visits) {
  const { pos, focal } = layout(nFocal, n);
  const ss = [];
  for (let i = 0; i < n; i++) {
    const s = buildViable(focal[i] ? focalG : resG, tag + i * 13);
    if (!s) return null;
    ss.push(s);
  }
  const per = [];
  for (const seed of BOUT_SEEDS) {
    const r = C.runBout(ss, new Array(n).fill(1 / n), {
      visits,
      seed,
      positions: pos,
      forageRange,
    });
    let tot = 0,
      cnt = 0;
    for (let i = 0; i < n; i++) {
      if (!focal[i]) continue;
      cnt++;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        tot += r.T[i][j] + r.T[j][i];
      }
    }
    if (cnt) per.push(tot / cnt);
  }
  return per.length ? mean(per) : null;
}

function ratio(focalG, resG, scale, tag, forageRange) {
  const n = 24 * scale;
  /* ⚠️ VISITS SCALE WITH THE SQUARE OF THE RING. A locally foraging bee
   * DIFFUSES, so its time to traverse the ring goes as (ring / step)^2.
   * Holding the bout fixed while the population grew meant the bee never mixed
   * over the larger rings — and the identical-morph control, which is flat at
   * 1.0 by construction, drifted 0.976 -> 1.133 -> 1.228 with scale. That
   * drift was the tell that the bout, not the biology, was being measured. */
  const visits = 9000 * scale * scale;
  const rare = focalPerCapita(
    focalG,
    resG,
    4 * scale,
    n,
    tag,
    forageRange,
    visits,
  );
  const common = focalPerCapita(
    focalG,
    resG,
    20 * scale,
    n,
    tag + 5000,
    forageRange,
    visits,
  );
  if (!rare || !common || !(common > 0)) return null;
  return rare / common;
}

function ci(xs) {
  const m = mean(xs);
  if (xs.length < 2) return { m, half: NaN };
  const sd = Math.sqrt(
    xs.reduce((a, x) => a + (x - m) * (x - m), 0) / (xs.length - 1),
  );
  return { m, half: (2.571 * sd) / Math.sqrt(xs.length) }; // t, df=5
}

// ==========================================================================
const DRAWS = [0, 1, 2, 3, 4, 5];
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
    `${DRAWS.length} independent site-set draws x ${BOUT_SEEDS.length} bout seeds per cell`,
);

rule("Patch size at fixed frequency 1/6, clustered, tight foraging");
console.log(
  "  Prediction: approaches 1 FROM BELOW as the boundary fraction falls, and\n" +
    "  does not cross. Corrected = focal ratio / identical-morph control, because\n" +
    "  the control showed a real +8% bias in exactly this cell.\n",
);
console.log(
  "  patch/total   boundary   raw          control      CORRECTED (95% CI)",
);
const out = [];
for (const scale of [1, 2]) {
  const n = 24 * scale,
    nF = 4 * scale;
  /* Kernel held constant RELATIVE to plant spacing, so "tight" means the same
   * number of neighbours at every population size. */
  const forageRange = 0.03 / scale;
  const raws = [],
    ctrls = [],
    corr = [];
  for (const d of DRAWS) {
    const tag = 200000 + scale * 7000 + d * 400;
    const f = ratio(far.g, res.g, scale, tag, forageRange);
    const c = ratio(res.g, res.g, scale, tag + 300000, forageRange);
    if (f === null || c === null || !(c > 0)) continue;
    raws.push(f);
    ctrls.push(c);
    corr.push(f / c);
  }
  if (!corr.length) continue;
  const R = ci(raws),
    K = ci(ctrls),
    X = ci(corr);
  out.push({ scale, nF, n, X });
  console.log(
    `  ${String(nF).padStart(3)}/${String(n).padEnd(9)} ${(2 / nF).toFixed(2).padStart(8)}   ` +
      `${R.m.toFixed(3)}        ${K.m.toFixed(3)}        ${X.m.toFixed(3)} +/- ${X.half.toFixed(3)}`,
  );
}

rule("VERDICT");
if (out.length >= 2) {
  const first = out[0],
    last = out[out.length - 1];
  const rising = last.X.m > first.X.m;
  const crossed = last.X.m - last.X.half > 1;
  const atParity = last.X.m + last.X.half > 1 && last.X.m - last.X.half < 1;
  console.log(
    `  ${first.nF}/${first.n} -> ${last.nF}/${last.n}: corrected ${first.X.m.toFixed(3)} -> ${last.X.m.toFixed(3)} ` +
      `(${rising ? "rising" : "not rising"})`,
  );
  if (last.X.half > 0.2) {
    console.log(
      `\n  ⚠️ INCONCLUSIVE. The interval on the largest patch is +/-${last.X.half.toFixed(3)},\n` +
        "  spanning everything from a clear penalty to a clear advantage. This does not\n" +
        "  answer the question either way, and is reported as a failure to measure\n" +
        "  rather than dressed up as a confirmation.",
    );
  } else
  console.log(
    crossed
      ? "\n  ⚠️ IT CROSSES 1.0 — the interval excludes parity from below. The boundary-\n" +
          "  dilution prediction is REFUTED and something else is operating; a rare\n" +
          "  morph in a large patch does better than a common one, which would be the\n" +
          "  symmetry-breaker roadmap B has been looking for."
      : atParity
        ? "\n  ✅ PREDICTION HELD: the interval spans 1.0. Spatial structure buys\n" +
          "  NEUTRALITY, not advantage — it removes the penalty on a rare placement\n" +
          "  without rewarding it. Enough for drift to maintain variation; not enough\n" +
          "  for disruptive selection to create it."
        : "\n  The interval sits below 1.0: the penalty is reduced but not eliminated,\n" +
          "  so even parity is not reached at these patch sizes.",
  );
  console.log(
    `\n  Boundary fraction falls ${(2 / first.nF).toFixed(2)} -> ${(2 / last.nF).toFixed(2)} across these rows, which is the\n` +
      "  quantity the prediction was derived from. ⚠️ Going further needs visits to\n" +
      "  scale as the SQUARE of the ring, so a 12/72 row costs 9x a 4/24 row — that\n" +
      "  is what answering this properly would take, and it was not spent here.",
  );
}
console.log();
