/*
 * rare-biased-visits.js — can an animal that prefers the RARER morph complete a
 * split? (roadmap B)
 *
 * ⚠️ THIS RUN EXISTS BECAUSE THE PREVIOUS ONE LEFT A QUANTITATIVE BAR.
 *
 * The limiting-factors run closed the pollinator route and pinned the frequency
 * dependence at `receipt ratio ~ (own-frequency odds)^0.70`, mostly
 * partner-counting, i.e. a property of MATE-FINDING rather than of provisioning.
 * It named the one candidate that could move it: rare-biased visit allocation,
 * an animal that preferentially visits the rarer morph. And it made the bar
 * cheap — a candidate has to move that exponent, measurable in single bouts.
 *
 * The knob needs no new mechanism. `runBout` already takes a free per-plant
 * abundance vector, so a plant in a morph of frequency f_m gets weight
 * f_m^a / n_m and the morph's SHARE OF VISITS becomes f_m^a:
 *   a = 1   visits proportional to abundance = uniform per plant = every earlier
 *           result, bit-identical
 *   a = 0   visits split 50/50 regardless of frequency = the strongest possible
 *           rare-bias
 *
 * ⚠️ IN THE DYNAMICAL ARM THE BIAS MUST NOT KEY ON `anc`. Ancestry is hidden
 * bookkeeping the pollinator cannot perceive; biasing on it would be the same
 * mistake as making placement a gene. `allocWeights` in sim/ibm.js therefore
 * computes rarity from the population's OWN placement cloud — a plant sitting
 * where few others sit is rare, whatever it descends from — and a kernel share
 * around each plant approximates its cluster's frequency, so the label-free
 * version reproduces the labelled one. PART 0 asserts that it does.
 *
 * Analytic anchor, in the pure partner-counting limit: a plant's conspecific
 * receipt goes as (visits per plant of its morph) x (share of carried pollen
 * that is its morph), so the ratio is odds^(2a-1) and the exponent crosses zero
 * at a = 0.5 — visits proportional to the SQUARE ROOT of abundance. Carryover
 * already softens 1 -> 0.70, so the real crossing should sit below 0.5. Both
 * predictions are checked rather than assumed.
 */

const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const C = require("../sim/carryover.js");

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const f2 = (x) => (x == null ? "   -  " : x.toFixed(2).padStart(6));
const f3 = (x) => (x == null ? "    -  " : x.toFixed(3).padStart(7));

const SMOKE = process.env.RB_SMOKE === "1";
const N0 = SMOKE ? 12 : 30;
const GENS = SMOKE ? 4 : 35;
const SEEDS = SMOKE ? [1, 2] : [1, 2, 3, 4, 5];
const SITE_N = SMOKE ? 50 : 160;
const FREQS = SMOKE ? [0.25, 0.75] : [0.1, 0.25, 0.5, 0.75, 0.9];
const D_EXCL = 8;
const optsAt = (extra = {}) => ({ ...I.DEFAULTS, siteN: SITE_N, ...extra });
if (SMOKE)
  console.log(
    "\n*** RB_SMOKE=1 — tiny configuration. Exercises the code path and the\n" +
      "*** reporting. THE NUMBERS BELOW ARE NOT RESULTS.\n",
  );

const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));

/* founding, carried verbatim from experiments/limiting-factors.js so the
 * measurement stays comparable to the published 0.70 rather than a new estimator */
function foundAtFreq(n, rng, srng, targetD, fB, same = false) {
  const b = I.foundTwoLineages(n, rng, srng, targetD, optsAt());
  if (!b) return null;
  const nB = Math.min(n - 1, Math.max(1, Math.round(n * fB)));
  const nA = n - nB;
  const pop = [
    ...I.foundPopulation(nA, rng, { spread: 0.02, srng, base: b.gA, anc: 0 }),
    ...I.foundPopulation(nB, rng, {
      spread: 0.02,
      srng,
      base: same ? b.gA : b.gB,
      anc: 1,
    }),
  ];
  return { pop, nA, nB };
}

/* the labelled allocation used by the single-bout screen: exact, because at
 * fixed composition the morph memberships ARE known */
function abundanceFor(nA, nB, a) {
  const n = nA + nB;
  const wA = Math.pow(nA / n, a) / nA;
  const wB = Math.pow(nB / n, a) / nB;
  const ab = new Array(n);
  for (let i = 0; i < n; i++) ab[i] = i < nA ? wA : wB;
  const tot = ab.reduce((x, y) => x + y, 0);
  return ab.map((w) => w / tot);
}

function perCapita(built, a) {
  const o = optsAt();
  const n = built.pop.length;
  const ab =
    a === null ? new Array(n).fill(1 / n) : abundanceFor(built.nA, built.nB, a);
  const ss = I.sitesOf(built.pop, o, 0);
  const rb = C.runBout(ss, ab, { visits: o.visits, seed: 7 });
  const rec = new Array(n).fill(0);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) if (i !== j) rec[j] += rb.T[i][j];
  return { A: mean(rec.slice(0, built.nA)), B: mean(rec.slice(built.nA)) };
}

/* slope of log(relative per-capita) on the log-ODDS of own frequency: 1 = pure
 * partner-counting, 0 = no frequency dependence, <0 = a RARE ADVANTAGE */
function fit(rows) {
  if (rows.length < 2) return null;
  const xs = rows.map((r) => Math.log(r.fReal / (1 - r.fReal)));
  const ys = rows.map((r) => Math.log(r.rel));
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) * (xs[i] - mx);
  }
  return den > 0 ? num / den : null;
}

function sweep(label, a, same = false) {
  const rows = [];
  for (const f of FREQS) {
    const rels = [];
    for (const seed of SEEDS) {
      const rng = E.makeRng(seed);
      const srng = I.signalRng(seed);
      const built = foundAtFreq(N0, rng, srng, D_EXCL, f, same);
      if (!built) continue;
      const pc = perCapita(built, a);
      if (!(pc.A > 0) || !(pc.B > 0)) continue;
      rels.push(pc.B / pc.A);
    }
    if (!rels.length) continue;
    const fReal = Math.min(N0 - 1, Math.max(1, Math.round(N0 * f))) / N0;
    rows.push({ f, fReal, rel: mean(rels) });
  }
  const e = fit(rows);
  console.log(
    `  ${label.padEnd(32)} ` +
      rows.map((r) => f3(r.rel)).join(" ") +
      `   | exp ${f2(e)}`,
  );
  return { rows, e };
}

const ancMean = (pop) => (pop.length ? mean(pop.map((i) => i.anc || 0)) : 0);
function fate(finalPop, ancVar0, extinct) {
  if (extinct || finalPop.length < 2) return "BOTH LOST";
  const v = I.ancestryVar(finalPop);
  const m = ancMean(finalPop);
  if (v > 0.4 * ancVar0) return "HELD";
  if (m < 0.15 || m > 0.85) return "one lost";
  return "FUSED";
}
const TAGS = ["HELD", "FUSED", "one lost", "BOTH LOST"];

console.log("=".repeat(104));
console.log(
  "Rare-biased visit allocation: does preferring the rarer morph complete a split?",
);
console.log("=".repeat(104));

// ========================================================================
// PART 0 — the anchor gate
// ========================================================================

rule("PART 0 — the anchor gate");

/* golden generated before allocExponent existed (commit 17cd60c) */
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

const g1 = JSON.stringify(goldenRun()) === JSON.stringify(PRE_ALLOC);
const g2 =
  JSON.stringify(goldenRun({ allocExponent: 1 })) === JSON.stringify(PRE_ALLOC);
/* ⚠️ THE PAIRED NEGATIVE. The two above are satisfied by an option that does
 * nothing at all; this is the one that fails if allocExponent never reaches
 * step(), which would make every arm below the same arm. */
const g3 =
  JSON.stringify(goldenRun({ allocExponent: 0.5 })) !==
  JSON.stringify(PRE_ALLOC);
console.log(
  `  1. pre-option model reproduces (17cd60c)          ${g1 ? "ok" : "FAIL"}`,
);
console.log(
  `  2. allocExponent = 1 is bit-identical             ${g2 ? "ok" : "FAIL"}`,
);
console.log(
  `  3. allocExponent = 0.5 CHANGES the run            ${g3 ? "ok" : "FAIL"}`,
);

/* ⚠️ AND THE LABEL-FREE VERSION MUST MATCH THE LABELLED ONE. The screen knows
 * which plant is which morph; the dynamical model must not. If the placement
 * kernel did not recover the same allocation, the two halves of this run would
 * not be measuring the same mechanism. */
let g4 = true;
{
  const rng = E.makeRng(1);
  const srng = I.signalRng(1);
  const built = foundAtFreq(N0, rng, srng, D_EXCL, 0.25);
  if (built) {
    const n = built.pop.length;
    const fB = built.nB / n;
    const ss = I.sitesOf(built.pop, optsAt(), 0);
    for (const a of [0.5, 0.35]) {
      const w = I.allocWeights(ss, a, n);
      const shareB = w.slice(built.nA).reduce((x, y) => x + y, 0);
      const pred = Math.pow(fB, a) / (Math.pow(fB, a) + Math.pow(1 - fB, a));
      const ok = Math.abs(shareB - pred) < 0.08;
      if (!ok) g4 = false;
      console.log(
        `  4. label-free rarity at a=${a.toFixed(2)}: predicted ${pred.toFixed(3)}` +
          `  got ${shareB.toFixed(3)}   ${ok ? "ok" : "FAIL"}`,
      );
    }
  }
}

if (!(g1 && g2 && g3 && g4)) {
  console.log(
    SMOKE
      ? "\n(anchors do not all apply at smoke size — informational only)"
      : "\nANCHORS FAILED — refusing to compute a result.",
  );
  if (!SMOKE) process.exit(1);
}

// ========================================================================
// PART A — the single-bout screen
// ========================================================================

rule(
  "PART A — the screen: how strong must the bias be to invert the criterion?",
);
console.log(
  "  ⚠️ THE CONTROL IS SWEPT AT EVERY STRENGTH, and that is the whole point.\n" +
    "  One lineage wearing BOTH labels has no placement difference at all, yet its\n" +
    "  exponent still moves under bias, because handing a label more visits than its\n" +
    "  share of plants raises per-capita receipt as pure arithmetic. A control run only\n" +
    "  at a=1 would let that trivial inflation read as a repaired mate-finding.\n",
);
console.log(
  "  columns are frequency of B: " +
    FREQS.join("  ") +
    "\n  exp: 1 = pure partner-counting, 0 = none, <0 = RARE ADVANTAGE\n",
);

const A_VALUES = SMOKE ? [1, 0.5, 0] : [1, 0.75, 0.5, 0.35, 0.25, 0];
const real = {};
const ctl = {};
for (const a of A_VALUES)
  real[a] = sweep(`a=${a.toFixed(2)}  visits ~ abundance^a`, a);
console.log("  " + "-".repeat(96));
for (const a of A_VALUES)
  ctl[a] = sweep(`CTL one lineage, both labels a=${a.toFixed(2)}`, a, true);

console.log(
  "\n    a        real     control     real-control = the MATE-FINDING part",
);
for (const a of A_VALUES) {
  const r = real[a].e;
  const c = ctl[a].e;
  console.log(
    `    ${a.toFixed(2)}   ${f3(r)}   ${f3(c)}        ` +
      `${f3(r == null || c == null ? null : r - c)}   (analytic ${f3(2 * a - 1)})`,
  );
}
console.log(
  "\n  ⚠️ real - control is the part attributable to finding a PARTNER rather than to\n" +
    "  being visited more often. Analytically the control is odds^(a-1) and the real arm\n" +
    "  odds^(2a-1), so that gap is exactly `a`: the mate-finding penalty IS the allocation\n" +
    "  exponent, and it only reaches zero when abundance stops predicting visits at all.",
);

// ========================================================================
// PART B — the dynamical arms
// ========================================================================

rule("PART B — does an inverted criterion actually maintain two lineages?");

function contactRun(seed, extra) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, optsAt());
  if (!built) return null;
  const v0 = I.ancestryVar(built.pop);
  const out = I.run({
    n: N0,
    generations: GENS,
    seed,
    siteN: SITE_N,
    found: built.pop,
    ...extra,
  });
  return fate(out.pop, v0, out.extinct);
}

const ARMS = [
  ["1. a=1.00  no bias            (reference)", {}],
  ["2. a=0.43  GIGORD-CALIBRATED            ", { allocExponent: 0.43 }],
  ["3. a=0.25  twice the measured strength  ", { allocExponent: 0.25 }],
];
console.log(
  "\n    arm                                        " + TAGS.join(" / "),
);
for (const [label, extra] of ARMS) {
  const rs = SEEDS.map((s) => contactRun(s, extra)).filter(Boolean);
  if (!rs.length) continue;
  const t = Object.fromEntries(TAGS.map((x) => [x, 0]));
  rs.forEach((r) => t[r]++);
  console.log(`    ${label}   ${TAGS.map((x) => t[x]).join(" / ")}`);
}
console.log(
  "\n  Published counts over many more seeds: reference 0/34 HELD, calibrated a=0.43\n" +
    "  1/15 (shown to be noise, 0/10 on replication), a=0.25 6/29 (p=0.0070).",
);

// ========================================================================
// PART C — why it fuses
// ========================================================================

rule("PART C — the barrier is sound, so why does strong bias FUSE?");

/* cross-lineage share of received pollen at 50/50. 0 = perfect isolation,
 * 0.5 = mating blind to lineage. That share IS the per-generation gene flow m. */
function leakAt(targetD, same = false) {
  const o = optsAt();
  const ms = [];
  for (const seed of SEEDS) {
    const rng = E.makeRng(seed);
    const srng = I.signalRng(seed);
    const built = foundAtFreq(N0, rng, srng, targetD, 0.5, same);
    if (!built) continue;
    const n = built.pop.length;
    const ss = I.sitesOf(built.pop, o, 0);
    const rb = C.runBout(ss, new Array(n).fill(1 / n), {
      visits: o.visits,
      seed: 7,
    });
    let within = 0;
    let cross = 0;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        if (i < built.nA === j < built.nA) within += rb.T[i][j];
        else cross += rb.T[i][j];
      }
    if (within + cross > 0) ms.push(cross / (within + cross));
  }
  return ms.length ? mean(ms) : null;
}

const ceiling = leakAt(D_EXCL, true);
console.log(
  `  ceiling control (one lineage, both labels): m = ${f3(ceiling)}  ` +
    (ceiling != null && Math.abs(ceiling - 0.5) < 0.06
      ? "ok — reads ~0.5 as it must"
      : "FAIL — statistic is broken"),
);
console.log("\n     d      m (cross-lineage pollen)     Nm     ");
for (const d of SMOKE ? [4, 8] : [1, 2, 4, 6, 8, 12]) {
  const m = leakAt(d);
  if (m == null) continue;
  console.log(
    `    ${String(d).padStart(2)}         ${f3(m)}              ${(N0 * m).toFixed(2).padStart(6)}   ` +
      (m > 1 / N0 ? "LEAKY — Nm>1" : "isolating"),
  );
}

/* ⚠️ the resolution. Weight goes as dens^(a-1), so under a<1 the LOWEST-density
 * placement draws the MOST visits — and in a two-cluster population that is the
 * GAP BETWEEN THE CLUSTERS. */
console.log(
  "\n  visit weight an INTERMEDIATE would draw, against an ordinary cluster member:",
);
console.log("     d      a=0.50    a=0.30    a=0.25");
for (const d of SMOKE ? [8] : [4, 6, 8, 12]) {
  const rows = [];
  for (const seed of SEEDS) {
    const rng = E.makeRng(seed);
    const srng = I.signalRng(seed);
    const built = foundAtFreq(N0, rng, srng, d, 0.5);
    if (!built) continue;
    const ss = I.sitesOf(built.pop, optsAt(), 0);
    const places = ss.map(I.placementOf).filter(Boolean);
    if (places.length < N0) continue;
    const dens = (p) =>
      places.reduce((t, q) => {
        const x = I.dist(p, q) / 1.0;
        return t + Math.exp(-0.5 * x * x);
      }, 0) / places.length;
    const cl = mean(places.map(dens));
    const mid = {
      s: (places[0].s + places[N0 - 1].s) / 2,
      phi: Math.atan2(
        (Math.sin(places[0].phi) + Math.sin(places[N0 - 1].phi)) / 2,
        (Math.cos(places[0].phi) + Math.cos(places[N0 - 1].phi)) / 2,
      ),
    };
    rows.push({ cl, gp: dens(mid) });
  }
  if (!rows.length) continue;
  const cl = mean(rows.map((r) => r.cl));
  const gp = mean(rows.map((r) => r.gp));
  const ratio = (a) => Math.pow(gp / cl, a - 1);
  console.log(
    `    ${String(d).padStart(2)}    ${ratio(0.5).toFixed(1).padStart(8)}` +
      `${ratio(0.3).toFixed(1).padStart(10)}${ratio(0.25).toFixed(1).padStart(10)}`,
  );
}

console.log("\n" + "=".repeat(104));
console.log(
  "  RARE-BIASED VISITATION IS SELF-DEFEATING ON A CONTINUOUS TRAIT AXIS.\n" +
    "\n" +
    "  The exclusion separation leaks EXACTLY ZERO pollen, so fusion cannot be ordinary\n" +
    "  gene flow. It is the definition of rarity: the rarest placement in a splitting\n" +
    "  population is the INTERMEDIATE, so a preference for rare morphs pours visits onto\n" +
    "  precisely the plants that bridge the two lineages — and an intermediate sits at\n" +
    "  d/2 from each cluster, where the barrier IS leaky. The mechanism builds the\n" +
    "  conduit that erases the split it was recruited to protect.\n" +
    "\n" +
    "  ⚠️ Which is why deception split the ADVERTISEMENT and not the plant: a colour\n" +
    "  dimorphism is DISCRETE and has no intermediate to subsidise, while placement is\n" +
    "  continuous. Discrete versus continuous is the distinction that decides whether\n" +
    "  negative frequency-dependence can complete a split or only maintain a polymorphism.",
);
console.log("=".repeat(104));
