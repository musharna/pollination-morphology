/*
 * limiting-factors.js — is coexistence about the NUMBER OF LIMITING FACTORS?
 * (roadmap B/C)
 *
 * ⚠️ THIS RUN EXISTS BECAUSE AN EARLIER CONTROL WAS TOO GOOD.
 *
 * The two-pollinator run (2026-08-04) asked whether a second animal permits two
 * lineages to coexist past the exclusion separation, and answered no. Its central
 * control was that the visit budget is SPLIT between the animals, so that "two
 * pollinators permit coexistence" could not be confused with "more visits permit
 * coexistence". That control was right for the question as asked — and it also
 * guaranteed the answer.
 *
 * Splitting one budget keeps ONE LIMITING FACTOR. The animals divide a single
 * pool of visits, so the two lineages are still competing for the same resource
 * no matter how different their pollinators are. Competitive exclusion follows
 * from a single limiting factor almost by definition (Levin 1970: n coexisting
 * types need n limiting factors), so the negative was partly built in.
 *
 * The density-dependence run (2026-08-04) then measured WHY exclusion happens
 * here — the invasion criterion fails in both directions, per-capita receipt
 * RISING with a lineage's own frequency, 0.214 at 10% to 4.654 at 90%. Coexistence
 * needs a STABILISING niche difference and this model has the opposite sign.
 * A second limiting factor is the one candidate not yet tested that could supply
 * one.
 *
 * ⚠️ THE DECISIVE CONTRAST, AND IT IS A PAIR RATHER THAN AN ARM. Independent
 * budgets reintroduce exactly the confound the split existed to remove: two
 * animals with a full budget each is also twice the pollination. So it is only
 * interpretable beside a ONE-ANIMAL DOUBLE-BUDGET arm carrying the SAME total
 * visits. Same volume, different number of limiting factors — any difference
 * between those two is the thing this run is named after, and any effect present
 * in both is just more visits.
 *
 * ⚠️ AND THE CHEAP MEASUREMENT COMES FIRST. Part A is the invasion criterion,
 * which is single bouts rather than 35-generation runs, and it is what actually
 * decides the question: if per-capita receipt still rises with own frequency
 * under independent budgets, neither lineage can increase when rare and the
 * dynamical arms cannot produce coexistence whatever else changes. Running the
 * expensive arms first and the diagnostic second would be the wrong order.
 */

const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const C = require("../sim/carryover.js");
const P = require("../sim/placement.js");

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(
    xs.reduce((s, x) => s + (x - m) * (x - m), 0) / (xs.length - 1),
  );
};
const ci = (xs) => (xs.length > 1 ? (1.96 * sd(xs)) / Math.sqrt(xs.length) : 0);
const f2 = (x) =>
  x === null || x === undefined ? "   -  " : x.toFixed(2).padStart(6);
const f3 = (x) =>
  x === null || x === undefined ? "    -  " : x.toFixed(3).padStart(7);

const SMOKE = process.env.LF_SMOKE === "1";
const N0 = SMOKE ? 12 : 30;
const GENS = SMOKE ? 4 : 35;
const SEEDS = SMOKE ? [1, 2] : [1, 2, 3, 4, 5];
const SITE_N = SMOKE ? 50 : 160;
const VISITS = I.DEFAULTS.visits;
if (SMOKE)
  console.log(
    "\n*** LF_SMOKE=1 — tiny configuration. Exercises the code path and the\n" +
      "*** reporting. THE NUMBERS BELOW ARE NOT RESULTS.\n",
  );

const D_EXCL = 8;
const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));
const optsAt = (extra = {}) => ({ ...I.DEFAULTS, siteN: SITE_N, ...extra });

/*
 * The two body plans, carried over verbatim from the two-pollinator run so the
 * "animals differ" question stays settled rather than re-opened: they were
 * measured to place pollen 11.910 apart against a 0.111 sampling floor, i.e.
 * 106.9x. Nothing here needs them to differ more.
 */
const scaleBee = (k, lenK) => ({
  ...P.DEFAULT_BEE,
  r: P.DEFAULT_BEE.r * k,
  len: P.DEFAULT_BEE.len * lenK,
});
const BEE_A = scaleBee(0.65, 0.8);
const BEE_B = scaleBee(1.35, 1.15);

/*
 * ⚠️ THE ARMS, AND THE PAIR THAT MATTERS IS 3 AND 4.
 *
 * Arms 3 and 4 carry IDENTICAL total visits (2x the base budget). They differ
 * only in whether that volume arrives as one pool or two. If coexistence appears
 * in 3 and not 4, it is the number of limiting factors; if it appears in both, it
 * is the volume; if in neither, neither matters.
 */
const ARMS = [
  ["1. one animal, base budget         (reference)  ", {}],
  [
    "2. two animals, SPLIT budget       (1 factor)   ",
    { bees: [BEE_A, BEE_B] },
  ],
  [
    "3. two animals, INDEPENDENT budgets (2 factors) ",
    { bees: [BEE_A, BEE_B], independentBudgets: true },
  ],
  ["4. ONE animal, DOUBLE budget       (1 factor)   ", { visits: 2 * VISITS }],
];

const ancMean = (pop) => (pop.length ? mean(pop.map((i) => i.anc || 0)) : 0);

function fate(finalPop, ancVar0, extinct) {
  if (extinct || finalPop.length < 2) return { tag: "BOTH LOST", v: 0, m: 0 };
  const v = I.ancestryVar(finalPop);
  const m = ancMean(finalPop);
  if (v > 0.4 * ancVar0) return { tag: "HELD", v, m };
  if (m < 0.15 || m > 0.85) return { tag: "one lost", v, m };
  return { tag: "FUSED", v, m };
}
const TAGS = ["HELD", "FUSED", "one lost", "BOTH LOST"];

// ========================================================================
// PART 0 — the anchor gate
// ========================================================================

/*
 * ANCHOR 1 — `independentBudgets` changed nothing with one animal. With a single
 * bee there is nothing to divide, so both settings must produce the identical
 * run; if they do not, the option is reaching something it should not.
 * Golden generated from commit 17cd60c, before the option existed.
 */
const PRE_INDEP = [
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

function anchorInert() {
  const base = JSON.stringify(goldenRun()) === JSON.stringify(PRE_INDEP);
  const indep =
    JSON.stringify(goldenRun({ independentBudgets: true })) ===
    JSON.stringify(PRE_INDEP);
  console.log("  1. the new option is inert where it must be");
  console.log(
    `     single-animal run bit-identical to 17cd60c          ${base ? "ok" : "FAIL"}`,
  );
  console.log(
    `     independentBudgets is a no-op with ONE animal       ${indep ? "ok" : "FAIL"}`,
  );
  return base && indep;
}

/*
 * ⚠️ ANCHOR 2 — DOES THE OPTION ACTUALLY DO ANYTHING WITH TWO ANIMALS?
 *
 * This is the inertness gate. The whole run compares split against independent
 * budgets, and if the flag were being dropped somewhere both arms would be the
 * same arm and the result would read "the number of limiting factors does not
 * matter" no matter what. So the total delivered pollen must actually roughly
 * DOUBLE, and that is measured rather than assumed.
 */
function anchorBudgetBites() {
  const totals = {};
  for (const [key, extra] of [
    ["split", { bees: [BEE_A, BEE_B] }],
    ["independent", { bees: [BEE_A, BEE_B], independentBudgets: true }],
    ["double-single", { visits: 2 * VISITS }],
    ["base", {}],
  ]) {
    const vals = [];
    for (const seed of SEEDS) {
      const rng = E.makeRng(seed);
      const srng = I.signalRng(seed);
      const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, optsAt());
      if (!built) continue;
      vals.push(totalDelivered(built.pop, optsAt(extra)));
    }
    totals[key] = mean(vals);
  }
  const ratio = totals.independent / totals.split;
  const volMatch = totals["double-single"] / totals.independent;
  /* independent budgets must deliver ~2x the split pool ... */
  const good = ratio > 1.6;
  /* ... and the double-budget control must match it in VOLUME, or the pair
   * cannot separate "two factors" from "more visits" */
  const matched = volMatch > 0.75 && volMatch < 1.33;
  console.log(
    "\n  2. the budget option BITES, and the control matches it in volume",
  );
  console.log(
    `     total delivered pollen: base ${totals.base.toFixed(0)}, split ${totals.split.toFixed(0)},` +
      ` independent ${totals.independent.toFixed(0)}, double-single ${totals["double-single"].toFixed(0)}`,
  );
  console.log(
    `     independent / split      ${f2(ratio)}   (must exceed 1.6)        ${good ? "ok" : "FAIL"}`,
  );
  console.log(
    `     double-single / independent ${f2(volMatch)}   (the volume match)    ${matched ? "ok" : "FAIL"}`,
  );
  return good && matched;
}

function totalDelivered(pop, opts) {
  const n = pop.length;
  const bees = opts.bees && opts.bees.length ? opts.bees : [opts.bee];
  const per = opts.independentBudgets
    ? opts.visits
    : Math.max(1, Math.round(opts.visits / bees.length));
  let tot = 0;
  bees.forEach((bee, bi) => {
    const ss = I.sitesOf(pop, { ...opts, bee }, 0, bi);
    const rb = C.runBout(ss, new Array(n).fill(1 / n), {
      visits: per,
      seed: 7 + 100000 * bi,
    });
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) if (i !== j) tot += rb.T[i][j];
  });
  return tot;
}

/* ANCHOR 3 — the founding still hits its target. */
function anchorFounding() {
  const got = [];
  const vars = [];
  for (const seed of SEEDS) {
    const rng = E.makeRng(seed);
    const srng = I.signalRng(seed);
    const b = I.foundTwoLineages(N0, rng, srng, D_EXCL, optsAt());
    if (!b) continue;
    got.push(b.realised);
    vars.push(I.ancestryVar(b.pop));
  }
  const mg = mean(got);
  const mv = mean(vars);
  const ok = mg > D_EXCL / 2 && mg < D_EXCL * 2 && Math.abs(mv - 0.25) < 0.02;
  console.log("\n  3. two lineages founded at the exclusion separation");
  console.log(
    `     target ${D_EXCL}   realised ${f2(mg)}   ancVar ${f3(mv)}          ${ok ? "ok" : "FAIL"}`,
  );
  return ok;
}

// ========================================================================
// PART A — the invasion criterion under each service regime
// ========================================================================

/*
 * ⚠️ THE DECIDING MEASUREMENT, AND IT IS CHEAP.
 *
 * Mutual invasibility (Turelli 1978; Chesson 2000): two types coexist if each can
 * increase when rare against the other. Measured directly as per-capita
 * cross-pollen receipt against a lineage's own frequency. Under one limiting
 * factor this rose from 0.214 to 4.654 across f = 0.1…0.9 — a rare lineage doing
 * WORSE, which forces exclusion.
 *
 * If a second limiting factor supplies a stabilising niche difference, THIS is
 * where it shows up: the slope should flatten, and coexistence needs it to invert
 * (rare > 1). If the slope is unchanged, no dynamical arm below can coexist and
 * the answer is settled before the expensive part runs.
 */
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
  return { pop, nA, nB, realised: same ? 0 : b.realised };
}

/* Per-capita receipt, summed over every animal's bout — the same convention the
 * model uses, since a grain picked up on one body can only be delivered by it. */
function perCapita(built, opts) {
  const n = built.pop.length;
  const bees = opts.bees && opts.bees.length ? opts.bees : [opts.bee];
  const per = opts.independentBudgets
    ? opts.visits
    : Math.max(1, Math.round(opts.visits / bees.length));
  const rec = new Array(n).fill(0);
  bees.forEach((bee, bi) => {
    const ss = I.sitesOf(built.pop, { ...opts, bee }, 0, bi);
    const rb = C.runBout(ss, new Array(n).fill(1 / n), {
      visits: per,
      seed: 7 + 100000 * bi,
    });
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) if (i !== j) rec[j] += rb.T[i][j];
  });
  return {
    A: mean(rec.slice(0, built.nA)),
    B: mean(rec.slice(built.nA)),
  };
}

/*
 * ⚠️ THE MATE-AVAILABILITY RESIDUAL — what turns the diagnosis into a
 * measurement instead of an assertion.
 *
 * If the frequency dependence is nothing but MATE AVAILABILITY, then a plant's
 * receipt is simply proportional to how many compatible partners it has, so
 * (B per-capita / A per-capita) should equal the odds f/(1-f) exactly and this
 * residual reads 1 at every frequency. Departures say how much of the effect is
 * something OTHER than counting partners — carryover, or the animal's behaviour.
 *
 * That distinction is the whole question here. A resource-competition story can
 * be fixed by adding a resource; a mate-availability story cannot, because
 * partners are not a resource a pollinator can supply.
 */
const residual = (rel, f) => (f <= 0 || f >= 1 ? null : rel / (f / (1 - f)));

function invasion(label, extra, same = false) {
  const FREQS = SMOKE ? [0.25, 0.75] : [0.1, 0.25, 0.5, 0.75, 0.9];
  console.log(`\n  ${label}`);
  console.log(
    "     freq of B    per-capita A   per-capita B   B relative to A     mate-avail residual",
  );
  const rows = [];
  for (const f of FREQS) {
    const rels = [];
    const ra = [];
    const rb = [];
    for (const seed of SEEDS) {
      const rng = E.makeRng(seed);
      const srng = I.signalRng(seed);
      const built = foundAtFreq(N0, rng, srng, D_EXCL, f, same);
      if (!built) continue;
      const pc = perCapita(built, optsAt(extra));
      if (!(pc.A > 0) || !(pc.B > 0)) continue;
      ra.push(pc.A);
      rb.push(pc.B);
      rels.push(pc.B / pc.A);
    }
    if (!rels.length) continue;
    /* the realised frequency, not the requested one — foundAtFreq rounds to whole
     * plants, and at n=30 a request for 0.10 is 3/30 exactly but 0.25 is not */
    const fReal = Math.min(N0 - 1, Math.max(1, Math.round(N0 * f))) / N0;
    const rel = mean(rels);
    rows.push({
      f,
      fReal,
      A: mean(ra),
      B: mean(rb),
      rel,
      ci: ci(rels),
      res: residual(rel, fReal),
    });
    console.log(
      `      ${f2(f)}       ${f2(mean(ra))}        ${f2(mean(rb))}        ${f3(rel)} +/- ${ci(rels).toFixed(3)}      ${f3(residual(rel, fReal))}`,
    );
  }
  return rows;
}

/* The slope of relative per-capita against own frequency, in log space so that a
 * flat (no frequency dependence) regime reads 0 regardless of scale. Positive =
 * positive frequency dependence = rare does worse = exclusion forced. */
function pfdSlope(rows) {
  if (rows.length < 2) return null;
  const xs = rows.map((r) => r.f);
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

// ========================================================================
// PART B — the dynamical arms
// ========================================================================

function contactRun(seed, extra = {}) {
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
  return {
    fate: fate(out.pop, v0, out.extinct),
    stalled: out.history.some((h) => h.stalled),
    unmated: mean(out.history.map((h) => h.unmated)),
  };
}

function armSweep(arms) {
  console.log(
    "\n    arm                                              " +
      TAGS.join(" / ") +
      "   stalls",
  );
  const rows = [];
  for (const [label, extra] of arms) {
    const rs = SEEDS.map((s) => contactRun(s, extra)).filter(Boolean);
    if (!rs.length) continue;
    const tally = Object.fromEntries(TAGS.map((t) => [t, 0]));
    rs.forEach((r) => tally[r.fate.tag]++);
    const stalls = rs.filter((r) => r.stalled).length;
    rows.push({ label, tally });
    console.log(
      `    ${label}   ${TAGS.map((t) => tally[t]).join(" / ")}        ${stalls}/${rs.length}`,
    );
  }
  return rows;
}

// ========================================================================
// main
// ========================================================================

console.log("=".repeat(96));
console.log(
  "Limiting factors: does a SECOND one permit coexistence where a second animal did not?",
);
console.log("=".repeat(96));

rule("PART 0 — the anchor gate");
const gate = [anchorInert(), anchorBudgetBites(), anchorFounding()];
if (!gate.every(Boolean)) {
  console.log(
    SMOKE
      ? "\n(anchors do not all apply at smoke size — informational only)"
      : "\nANCHORS FAILED — refusing to compute a result.",
  );
  if (!SMOKE) process.exit(1);
}

rule("PART A — the invasion criterion (the cheap measurement that decides it)");
console.log(
  "  ⚠️ Under ONE limiting factor this ran 0.214 -> 4.654 across f = 0.1…0.9: a rare\n" +
    "  lineage does WORSE, which forces exclusion. A second limiting factor has to\n" +
    "  FLATTEN that slope, and coexistence needs it to INVERT (rare above 1).",
);
const invSplit = invasion("two animals, SPLIT budget — ONE limiting factor", {
  bees: [BEE_A, BEE_B],
});
const invIndep = invasion(
  "two animals, INDEPENDENT budgets — TWO limiting factors",
  { bees: [BEE_A, BEE_B], independentBudgets: true },
);
const invDouble = invasion(
  "ONE animal, DOUBLE budget — one factor, SAME total visits as above",
  { visits: 2 * VISITS },
);
const invCtl = invasion(
  "POSITIVE CONTROL — one lineage wearing BOTH labels, independent budgets (must read ~1)",
  { bees: [BEE_A, BEE_B], independentBudgets: true },
  true,
);

console.log(
  "\n  positive frequency dependence, as a log-slope (0 = none, >0 = rare does worse):",
);
const slopes = {
  split: pfdSlope(invSplit),
  independent: pfdSlope(invIndep),
  double: pfdSlope(invDouble),
  control: pfdSlope(invCtl),
};
for (const [k, v] of Object.entries(slopes))
  console.log(`    ${k.padEnd(14)} ${v === null ? "   -  " : f2(v)}`);

rule("PART B — the dynamical arms at the exclusion separation");
const arms = armSweep(ARMS);

rule("PART C — the null: mating severed from placement");
console.log(
  "  ⚠️ If lineages are lost here too, the outcome is demographic rather than geometric.",
);
const nul = armSweep([
  [
    "3n. two animals, INDEPENDENT budgets + random mating",
    { bees: [BEE_A, BEE_B], independentBudgets: true, randomMating: true },
  ],
]);

// ---------------------------------------------------------------- verdict

console.log("\n" + "=".repeat(96));

const held = arms.filter((r) => r.tally.HELD > 0);
const lost = arms.filter((r) => r.tally["one lost"] >= 3);
const nullFuses = nul.length && nul[0].tally.FUSED > nul[0].tally["one lost"];
const ctlFlat = slopes.control !== null && Math.abs(slopes.control) < 0.5;
/* the pair that matters: two factors vs one factor at the SAME visit volume */
const flattened =
  slopes.independent !== null &&
  slopes.double !== null &&
  slopes.independent < 0.6 * slopes.double;
const inverted = invIndep.length && invIndep[0].rel > 1;

console.log(
  `  arms holding both lineages : ${held.length}/${arms.length}      ` +
    `losing one : ${lost.length}/${arms.length}\n`,
);

if (!ctlFlat) {
  console.log(
    `  ⚠️ THE CONTROL IS NOT FLAT (slope ${f3(slopes.control).trim()}). One lineage wearing both labels\n` +
      `  cannot differ in placement, so a non-zero slope there means the statistic is\n` +
      `  measuring something other than frequency dependence. DO NOT read anything below.`,
  );
} else if (held.length === 0 && lost.length === arms.length) {
  console.log(
    `  A SECOND LIMITING FACTOR DOES NOT PERMIT COEXISTENCE EITHER.\n` +
      `\n` +
      `  Every arm loses a lineage at d=${D_EXCL}, including two animals with INDEPENDENT budgets —\n` +
      `  and the one-animal DOUBLE-budget arm carries the same total visits, so this is not\n` +
      `  about volume. ${nullFuses ? "The null still fuses, so it is still the geometry." : "⚠️ THE NULL DOES IT TOO — demographic, not geometric."}\n` +
      `\n` +
      `  Part A says why: the frequency-dependence slope is ${f3(slopes.independent).trim()} under two limiting\n` +
      `  factors against ${f3(slopes.double).trim()} under one at the same volume — ${
        flattened ? "flattened but still POSITIVE" : "essentially unchanged"
      }.\n` +
      `  A rare lineage still does worse, so neither can increase when rare and the\n` +
      `  invasion criterion still fails. ${
        inverted
          ? "⚠️ BUT THE RARE END INVERTED — check that."
          : "The rare end never crosses 1."
      }\n` +
      `\n` +
      `  ⚠️ That closes the pollinator route. What remains is not a resource axis at all:\n` +
      `  the frequency dependence is generated by MATE-FINDING, and every mechanism that\n` +
      `  leaves mate-finding conformist inherits its sign no matter how many pollinators,\n` +
      `  budgets or offspring slots it adds.`,
  );
} else if (held.length) {
  console.log(
    `  ⚠️ AN ARM MAINTAINS BOTH LINEAGES — a first for this project. Check it hard before\n` +
      `  believing it: does the DOUBLE-BUDGET arm do it too (then it is volume, not\n` +
      `  limiting factors)? Does the null hold at the same separation? Arms that held:\n    ` +
      held.map((r) => r.label.trim()).join("\n    "),
  );
} else {
  console.log("  Mixed outcome across arms — read the table, not a headline.");
}
console.log("=".repeat(96));
