/*
 * selfing.js — does reproductive assurance move the frequency-dependence that
 * every other candidate left alone? (pre-registered in
 * docs/2026-08-07-selfing-prereg.md, written before this file existed)
 *
 * THE BAR THIS RUN IS SCORED AGAINST. The limiting-factors run pinned receipt at
 * `ratio ~ odds^0.70` and called it a property of MATE-FINDING rather than of
 * provisioning. Four mechanisms have since failed to move it, all of them
 * attacking visitation or attraction. Assurance attacks mate-finding directly.
 *
 * ⚠️⚠️ THE EXISTING 0.70 ESTIMATOR CANNOT SCORE THIS MECHANISM, AND REUSING IT
 * WOULD HAVE BEEN A SCREEN THAT COULD NOT FIRE. `perCapita` in
 * rare-biased-visits.js measures pollen RECEIVED in a single bout — it never
 * reaches the mating step. Selfing acts at the MOTHER DRAW, strictly downstream
 * of receipt, so by construction it cannot move a receipt exponent no matter
 * what it does to reproduction. Two exponents are therefore reported:
 *
 *   receipt   — the published quantity, on pollen received. Selfing MUST leave
 *               this alone; it is the specificity control, not the result. If it
 *               moves, something leaked upstream into the bout.
 *   realised  — the slope on REALISED GENOME SHARE after one generation of
 *               mating, read off the ancestry tracer. This is where assurance
 *               can act, and it is the number the prediction is about.
 *
 * Both use the same log-odds regression as the published estimator so the
 * receipt column stays comparable to 0.70 rather than becoming a new statistic.
 *
 * ⚠️ This file runs the EXPONENT SCREEN only. Whether rescued lineages then stay
 * distinct is a multi-generation question the pre-registration also asks, and it
 * is deliberately NOT answered here.
 */

const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const C = require("../sim/carryover.js");
const { claim } = require("../sim/verdict-gates.js");

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const f3 = (x) => (x == null ? "    -  " : x.toFixed(3).padStart(7));

const SMOKE = process.env.SELF_SMOKE === "1";
const N0 = SMOKE ? 12 : 30;
const SEEDS = SMOKE ? [1, 2] : [1, 2, 3, 4, 5, 6, 7, 8];
const SITE_N = SMOKE ? 50 : 160;
const FREQS = SMOKE ? [0.25, 0.5, 0.75] : [0.1, 0.25, 0.5, 0.75, 0.9];
const D_EXCL = 8;
/*
 * ⚠️ THE RATE IS NOW AN INPUT, defaulting to the 0.5 this experiment published.
 * The pre-registration asked for a SWEEP and the 2026-08-07 run tested exactly
 * one rate; roadmap :300 has carried that as an open item since. Rather than
 * writing a second experiment that re-implements this one's estimator — the
 * failure this project has already recorded, where a helper that recomputes the
 * behaviour under test ends up testing the recomputation —
 * experiments/selfing-sweep.js drives THIS file once per rate.
 *
 * The default is unchanged, so the published run reproduces bit-for-bit.
 */
const RATE = Number(process.env.SELF_RATE || 0.5);

const optsAt = (extra = {}) => ({ ...I.DEFAULTS, siteN: SITE_N, ...extra });

if (SMOKE)
  console.log(
    "\n*** SELF_SMOKE=1 — tiny configuration. Exercises the code path and the\n" +
      "*** reporting, and checks the ARMS DISCRIMINATE. NOT RESULTS.\n",
  );

const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));

/* ---------------------------------------------------------------- founding */

/* carried verbatim from rare-biased-visits.js so the receipt column stays
 * comparable to the published 0.70 rather than becoming a new estimator */
function foundAtFreq(n, rng, srng, targetD, fB) {
  const b = I.foundTwoLineages(n, rng, srng, targetD, optsAt());
  if (!b) return null;
  const nB = Math.min(n - 1, Math.max(1, Math.round(n * fB)));
  const nA = n - nB;
  const pop = [
    ...I.foundPopulation(nA, rng, { spread: 0.02, srng, base: b.gA, anc: 0 }),
    ...I.foundPopulation(nB, rng, { spread: 0.02, srng, base: b.gB, anc: 1 }),
  ];
  return { pop, nA, nB, fReal: nB / n };
}

/* ------------------------------------------------------------- the two axes */

/* pollen received per capita, single bout — the published quantity. Selfing is
 * downstream of this and must not touch it. */
function receiptRel(built) {
  const o = optsAt();
  const n = built.pop.length;
  const ab = new Array(n).fill(1 / n);
  const ss = I.sitesOf(built.pop, o, 0);
  const rb = C.runBout(ss, ab, { visits: o.visits, seed: 7 });
  const rec = new Array(n).fill(0);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) if (i !== j) rec[j] += rb.T[i][j];
  const A = mean(rec.slice(0, built.nA));
  const B = mean(rec.slice(built.nA));
  return A > 0 ? B / A : null;
}

/* realised genome share of lineage B after ONE generation of mating, per capita
 * and relative to A. `anc` is 0 for every A founder and 1 for every B founder,
 * so the offspring mean IS B's share of the next gene pool — it counts maternal
 * and paternal routes together, which is what a mate-finding statistic has to
 * do. Selfed offspring carry the mother's label, which is exactly the asymmetry
 * under test. */
function realisedRel(built, seed, extra) {
  const out = I.run({
    n: built.pop.length,
    generations: 1,
    seed,
    found: built.pop,
    siteN: SITE_N,
    ...extra,
  });
  if (!out.pop || out.pop.length < 2) return null;
  const shareB = mean(out.pop.map((i) => (i.anc === undefined ? 0 : i.anc)));
  const fB = built.fReal;
  /* a lineage that contributed nothing has no finite log-ratio; drop the row
   * rather than let it decide the slope */
  if (!(shareB > 0) || !(shareB < 1)) return null;
  return shareB / fB / ((1 - shareB) / (1 - fB));
}

/* slope of log(relative per-capita) on log-ODDS of own frequency: 1 = pure
 * partner-counting, 0 = no frequency dependence, <0 = a RARE ADVANTAGE. Same
 * regression as the published estimator. */
function fit(rows) {
  const ok = rows.filter((r) => r && r.rel > 0);
  if (ok.length < 2) return null;
  const xs = ok.map((r) => Math.log(r.fReal / (1 - r.fReal)));
  const ys = ok.map((r) => Math.log(r.rel));
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

const ci = (xs) => {
  if (xs.length < 2) return null;
  const m = mean(xs);
  const v = xs.reduce((a, x) => a + (x - m) * (x - m), 0) / (xs.length - 1);
  /* t at 95% by df, same table the boundary-interior run uses */
  const T = { 1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 7: 2.365 };
  const t = T[xs.length - 1] || 2.145;
  return { m, h: (t * Math.sqrt(v)) / Math.sqrt(xs.length) };
};
const show = (c) => (c ? `${f3(c.m)} +/- ${c.h.toFixed(3)}` : "     -");

/* -------------------------------------------------------------------- arms */

const ARMS = [
  ["off (baseline)", {}],
  [`selfing rate=${RATE}`, { selfing: { rate: RATE } }],
  [`floorOnly rate=${RATE}`, { selfing: { rate: RATE, floorOnly: true } }],
  [`ancNull rate=${RATE}`, { selfing: { rate: RATE, ancNull: true } }],
  ["ALWAYS (triviality)", { selfing: { always: true } }],
  [`cost 0.5 rate=${RATE}`, { selfing: { rate: RATE, cost: 0.5 } }],
  [`cost 1.0 rate=${RATE}`, { selfing: { rate: RATE, cost: 1 } }],
];

console.log("=".repeat(78));
console.log(
  "  REPRODUCTIVE ASSURANCE — does it move the mate-finding exponent?",
);
console.log("=".repeat(78));
console.log(
  `\n  n=${N0}, d=${D_EXCL}, ${SEEDS.length} seeds x ${FREQS.length} frequencies, siteN=${SITE_N}`,
);

/* built populations are shared across arms, so arms differ ONLY in the mating
 * treatment and never in the geometry they were handed */
const BUILT = [];
for (const seed of SEEDS) {
  const row = [];
  for (const fB of FREQS) {
    const rng = E.makeRng(seed * 1000 + Math.round(fB * 100));
    const srng = I.signalRng(seed);
    row.push(foundAtFreq(N0, rng, srng, D_EXCL, fB));
  }
  BUILT.push(row);
}
const nBuilt = BUILT.flat().filter(Boolean).length;
if (nBuilt < SEEDS.length * FREQS.length)
  console.log(
    `  ⚠️ ${SEEDS.length * FREQS.length - nBuilt} of ${SEEDS.length * FREQS.length} foundings FAILED and are dropped`,
  );

rule(
  "EXPONENTS (slope on log-odds of own frequency; 0 = no frequency dependence)",
);
console.log(
  "  arm                        receipt exponent      realised exponent",
);
console.log("  " + "-".repeat(70));

const results = {};
for (const [name, extra] of ARMS) {
  const recSlopes = [];
  const realSlopes = [];
  /* ⚠️ A lineage that receives NOTHING has rel = 0 and no finite log-ratio, so
   * the row cannot enter the regression. Those drops are NOT random — they are
   * precisely the most disadvantaged cells, so dropping them silently biases the
   * slope DOWNWARD, toward "less frequency dependence than there really is".
   * They are counted and reported rather than quietly skipped. Measured: 0 of 19
   * at the full configuration, but common at smoke sizes. */
  let dropRec = 0;
  let dropReal = 0;
  /* per-cell realised values, kept so arms can be compared PAIRWISE — every arm
   * was handed the SAME founded populations, so the unpaired comparison throws
   * away most of the design's power */
  const cells = [];
  for (let s = 0; s < SEEDS.length; s++) {
    const recRows = [];
    const realRows = [];
    const row = [];
    for (let f = 0; f < FREQS.length; f++) {
      const built = BUILT[s][f];
      if (!built) {
        row.push(null);
        continue;
      }
      const rr = receiptRel(built);
      if (rr != null && rr > 0) recRows.push({ fReal: built.fReal, rel: rr });
      else dropRec++;
      const vr = realisedRel(built, SEEDS[s], extra);
      if (vr != null && vr > 0) realRows.push({ fReal: built.fReal, rel: vr });
      else dropReal++;
      row.push(vr != null && vr > 0 ? vr : null);
    }
    cells.push(row);
    const a = fit(recRows);
    const b = fit(realRows);
    if (a != null) recSlopes.push(a);
    if (b != null) realSlopes.push(b);
  }
  const rc = ci(recSlopes);
  const vc = ci(realSlopes);
  results[name] = {
    receipt: rc,
    realised: vc,
    nRec: recSlopes.length,
    nReal: realSlopes.length,
    slopes: realSlopes,
    cells,
    /* ⚠️ A dropped realised row means the rare lineage reached 0 or 1 — it went
     * EXTINCT in a single generation. That is not merely a missing datum, it is
     * the outcome the mechanism exists to prevent, so it is reported as a
     * quantity in its own right. */
    lost: dropReal,
  };
  /* ⚠️ The seed count is PRINTED, not implied. A slope silently dropped -- a
   * founding that failed, a lineage that hit 0 and has no finite log-ratio --
   * looks exactly like a slope that was never asked for, and an arm reporting
   * "-" from one surviving seed reads identically to an arm that could not be
   * measured at all. */
  console.log(
    "  " +
      name.padEnd(24) +
      `${show(rc)} [${recSlopes.length}/${SEEDS.length}]`.padEnd(26) +
      `${show(vc)} [${realSlopes.length}/${SEEDS.length}]` +
      (dropReal ? `  ⚠️ ${dropReal} zero-receipt rows dropped` : ""),
  );
}

/* ------------------------------------------------------------------ verdict */

const base = results["off (baseline)"];
const treat = results[`selfing rate=${RATE}`];
const floor = results[`floorOnly rate=${RATE}`];
const dead = results[`cost 1.0 rate=${RATE}`];

const sep = (a, b) =>
  a && b ? Math.abs(a.m - b.m) > a.h + b.h : null; /* non-overlapping 95% CIs */

/* ---- paired comparison, which is the test this design actually earns.
 *
 * ⚠️ Every arm was handed the SAME founded populations, so arm-vs-arm is PAIRED
 * and comparing two independent CIs discards most of the power — the seed-to-seed
 * variation in the founding is common to both sides and cancels. The unpaired
 * columns above are still printed, because the paired test is the one that can
 * be talked into significance and the reader should see both.
 *
 * ⚠️ DISCLOSURE: the pre-registration named the exponent as the quantity but did
 * NOT name the test. Adopting the paired test AFTER seeing overlapping unpaired
 * intervals is a post-hoc choice, and is labelled as one wherever it is quoted. */
const pairedBetween = (nameA, nameB) => {
  const a = results[nameA];
  const b = results[nameB];
  if (!a || !b) return null;
  const d = [];
  for (let s = 0; s < SEEDS.length; s++)
    if (a.slopes[s] != null && b.slopes[s] != null)
      d.push(a.slopes[s] - b.slopes[s]);
  return d.length >= 2 ? { ...ci(d), n: d.length } : null;
};
const pairedDelta = (armName) => pairedBetween(armName, "off (baseline)");
const excludes0 = (d) => d && Math.abs(d.m) > d.h;

rule(
  "LINEAGE LOSS — how often the rare lineage went extinct in ONE generation",
);
console.log(
  "  ⚠️ POST HOC. This was not pre-registered; it was noticed because the dropped\n" +
    "  rows differed so sharply between arms. A dropped row IS an extinction, so\n" +
    "  the censoring and the outcome are the same event seen twice.\n",
);
const CELLS = SEEDS.length * FREQS.length;
for (const [name] of ARMS) {
  const r = results[name];
  if (!r) continue;
  const pct = ((100 * r.lost) / CELLS).toFixed(0);
  console.log(
    "  " +
      name.padEnd(24) +
      `${String(r.lost).padStart(3)}/${CELLS} cells lost  (${pct}%)`,
  );
}
console.log(
  "\n  ⚠️ This also biases the exponents ABOVE, and NOT symmetrically: a lost cell\n" +
    "  is a maximally-disadvantaged cell, so an arm that loses more has its slope\n" +
    "  pulled DOWN more. The baseline loses more than the treatment, which pushes\n" +
    "  the two exponents TOGETHER — so the censoring works AGAINST the hypothesis,\n" +
    "  and any gap that survives it is understated rather than manufactured.",
);

rule("PAIRED DELTA vs baseline (same founded populations; post-hoc test)");
for (const [name] of ARMS) {
  if (name === "off (baseline)") continue;
  const d = pairedDelta(name);
  console.log(
    "  " +
      name.padEnd(24) +
      (d
        ? `${f3(d.m)} +/- ${d.h.toFixed(3)} [n=${d.n}]` +
          (Math.abs(d.m) > d.h ? "  excludes 0" : "  spans 0")
        : "     -"),
  );
}

/* ---- the two gates the pre-registration demanded, and which the first version
 * of this verdict did not implement at all.
 *
 * ⚠️⚠️ ADMISSIBILITY. The prereg says: "the claim is only admissible in the
 * regime where the full-selfing control and the test arm are DISTINGUISHABLE. If
 * the rescue appears only where the arm is indistinguishable from full selfing,
 * there is no result." A treatment that behaves like the trivial arm IS the
 * trivial arm, whatever its rate says.
 *
 * ⚠️⚠️ ATTRIBUTION. floorOnly carries the weight flattening WITHOUT the selfing,
 * so the selfing-specific effect is selfing-minus-floorOnly, not
 * selfing-minus-baseline. Quoting the latter credits the flattening to the
 * mechanism. */
const admissible = pairedBetween(`selfing rate=${RATE}`, "ALWAYS (triviality)");
const attribution = pairedBetween(
  `selfing rate=${RATE}`,
  `floorOnly rate=${RATE}`,
);

/* ⚠️⚠️ AND THE SECOND VERSION IMPLEMENTED THEM ON THE WRONG PATH. Both gates
 * were computed here, printed below, and then consulted ONLY inside the "effect
 * not established" arm of the verdict. The ✅ branch was reached without reading
 * either — so the two gates the pre-registration wrote could caveat a failure
 * and were structurally incapable of blocking a success, which is the one thing
 * a gate is for. Repaired by building the list ONCE and routing the positive
 * text through `claim()`, which cannot return it while any gate is unmet.
 *
 * `ok: null` means the control did not fit. It fails closed: an unmeasured gate
 * licenses nothing. */
const GATES = [
  {
    name: "admissibility (selfing vs ALWAYS)",
    ok: admissible ? excludes0(admissible) : null,
    failText:
      "The treatment is INDISTINGUISHABLE from the full-selfing triviality control,\n" +
      "which is precisely the regime the pre-registration ruled out in advance: a\n" +
      "rescue that only appears where the arm behaves like total selfing is not a\n" +
      "rescue, it is total selfing.",
  },
  {
    name: "attribution (selfing vs floorOnly)",
    ok: attribution ? excludes0(attribution) : null,
    failText:
      "Selfing is not separable from floorOnly — the weight flattening WITHOUT the\n" +
      "selfing — so any movement is maternal-weight FLATTENING rather than\n" +
      "reproductive assurance. The mechanism is not what it says on the label.",
  },
];

rule("PRE-REGISTERED GATES");
console.log(
  "  admissibility  selfing vs ALWAYS      " +
    (admissible
      ? `${f3(admissible.m)} +/- ${admissible.h.toFixed(3)}  ` +
        (excludes0(admissible)
          ? "DISTINGUISHABLE — admissible"
          : "⚠️ INDISTINGUISHABLE — INADMISSIBLE")
      : "     -"),
);
console.log(
  "  attribution    selfing vs floorOnly   " +
    (attribution
      ? `${f3(attribution.m)} +/- ${attribution.h.toFixed(3)}  ` +
        (excludes0(attribution)
          ? "selfing-specific effect survives"
          : "⚠️ NOT separable from the floor")
      : "     -"),
);
/* ⚠️ REPORTED, NOT GATED, AND THAT IS A DELIBERATE CHANGE. An earlier version
 * made "floorOnly separates from baseline" a branch of the verdict and printed
 * ATTRIBUTION FAILS on it. That is the wrong predicate: the flattening moving
 * the exponent at all is EXPECTED, and does not invalidate a selfing effect that
 * is separably larger. The pre-registered question is selfing-minus-floorOnly,
 * which is the gate above; this line stays as context so the two cannot be
 * confused for one another again. */
console.log(
  "  context        floorOnly vs baseline  " +
    (floor && floor.realised && base && base.realised
      ? sep(base.realised, floor.realised)
        ? "the floor moves the exponent on its own"
        : "the floor alone does not move it"
      : "     -"),
);

rule("VERDICT");

/* ⚠️⚠️ THE PRECONDITION, AND THE SMOKE RUN PRINTED "REFUTED" WITHOUT IT.
 * `sep()` returns null when either side has no interval, null is falsy, and the
 * chain below then fell straight through to "indistinguishable from baseline" —
 * announcing a refutation on a baseline arm that produced NO DATA AT ALL. A
 * verdict must first establish that it measured both things it is comparing. */
if (!base || !treat || !base.realised || !treat.realised) {
  console.log(
    "  ⚠️ INCONCLUSIVE — the baseline or the treatment produced no fittable\n" +
      "  interval, so there is nothing to compare. This is NOT a refutation:\n" +
      `  baseline realised ${base ? base.nReal : 0}/${SEEDS.length} seeds, ` +
      `treatment ${treat ? treat.nReal : 0}/${SEEDS.length}. Raise the seed\n` +
      "  count or the population size until both arms fit.",
  );
} else if (!base.receipt || !treat.receipt) {
  console.log(
    "  ⚠️ INCONCLUSIVE — the RECEIPT specificity control did not fit, so a move\n" +
      "  in the realised exponent cannot be shown to come from the mating step\n" +
      "  rather than from something leaking upstream into the bout.",
  );
} else if (sep(base.receipt, treat.receipt)) {
  console.log(
    "  ⚠️⚠️ SPECIFICITY CONTROL FAILED. Selfing moved the RECEIPT exponent, which it\n" +
      "  cannot do by construction — it acts strictly downstream of the bout. Something\n" +
      "  leaked upstream and NO realised number here is interpretable.",
  );
} else if (!sep(base.realised, treat.realised)) {
  /* The UNPAIRED intervals overlap. That is the pre-registered comparison and it
   * is reported as such — but on a paired design it is the weak test, so the
   * paired delta is quoted beside it rather than instead of it. */
  const d = pairedDelta(`selfing rate=${RATE}`);
  console.log(
    "  ❌ H-assurance NOT ESTABLISHED on the pre-registered unpaired comparison:\n" +
      `  baseline ${show(base.realised)} against ${show(treat.realised)}, intervals overlapping.`,
  );
  if (excludes0(d) && d.m < 0)
    console.log(
      `\n  The paired delta DOES exclude 0 (${f3(d.m)} +/- ${d.h.toFixed(3)}), and paired is the\n` +
        "  test this design earns. ⚠️ Post-hoc: the prereg named the quantity, not the\n" +
        "  test, and this one was chosen after seeing the overlap.",
    );
  /* the SAME list the positive branch is routed through, so a gate cannot be
   * live on one path and absent from the other */
  console.log(
    claim({
      gates: GATES,
      positive:
        "\n  (The pre-registered gates were themselves met — the effect simply was not\n" +
        "  established. Had it been, nothing here would have blocked it.)",
      heading:
        "\n  AND THE PRE-REGISTERED GATES WOULD NOT HAVE LICENSED IT EITHER:",
    }).text,
  );
} else if (treat.realised.m >= base.realised.m) {
  console.log(
    "  ❌ H-assurance REFUTED, and in the WRONG DIRECTION: the realised exponent ROSE.\n" +
      "  Assurance made frequency-dependence stronger, not weaker.",
  );
} else {
  /* ⚠️⚠️ THE ✅ TEXT LIVES INSIDE `claim()` AND NOWHERE ELSE. It was previously
   * an `else` at the end of the chain, reachable without either pre-registered
   * gate having been read. There is no longer a branch that can print it. */
  console.log(
    claim({
      gates: GATES,
      positive:
        "  ✅ The realised exponent MOVED, it is separable from floorOnly, and the\n" +
        "  treatment is distinguishable from full selfing. So the effect is the selfing\n" +
        "  rather than the flattening, and it is not the triviality control in disguise.\n" +
        "  ⚠️ This is the SCREEN only: it says assurance repairs mate-finding, NOT that\n" +
        "  rescued lineages stay distinct.",
      heading:
        "  ⚠️ THE REALISED EXPONENT MOVED IN THE PREDICTED DIRECTION, AND IT IS STILL\n" +
        "  NOT A RESULT — the pre-registered gates are unmet:",
    }).text,
  );
}

/* ⚠️ THE COST CHECK ASKED THE WRONG QUANTITY FIRST. It compared EXPONENTS, whose
 * intervals are wide, and printed "COST DID NOT BITE" while the loss counts in
 * the same run went 1 -> 14 out of 40 cells between the free and the fully-costed
 * arm. Inbreeding depression obviously bites; the exponent simply is not where it
 * shows. Extinction count is, so that is what is tested. */
if (dead && treat)
  console.log(
    dead.lost > treat.lost
      ? `\n  ✅ Cost bites: lineage loss rises ${treat.lost} -> ${dead.lost} of ${CELLS} cells when every\n` +
          "  selfed seed dies, so the assurance is genuinely being paid for."
      : `\n  ⚠️ COST DID NOT BITE — loss ${treat.lost} vs ${dead.lost} of ${CELLS}. A mechanism that helps\n` +
          "  even when every selfed seed dies is not paying for itself, and the knob may\n" +
          "  be inert.",
  );

console.log(
  "\n  ⚠️ The ALWAYS arm is a CONTROL, not a candidate: it severs mating from\n" +
    "  pollination entirely, so an exponent near 0 there is arithmetic, not biology.",
);

/*
 * ---- machine-readable line, for experiments/selfing-sweep.js.
 *
 * ⚠️ EMITTED FROM THE SAME OBJECTS THE VERDICT ABOVE READS, so the sweep cannot
 * disagree with a single-rate run of this file. The alternative — a sweep that
 * re-implements the estimator and the gates — would be testing its own copy,
 * which is exactly how this project once had two green tests over a step() that
 * ignored the flag they claimed to exercise.
 */
if (process.env.SELF_JSON === "1") {
  const pack = (d) => (d ? { m: d.m, h: d.h, n: d.n } : null);
  console.log(
    "##JSON## " +
      JSON.stringify({
        rate: RATE,
        admissible: pack(admissible),
        attribution: pack(attribution),
        realised: pack(pairedDelta(`selfing rate=${RATE}`)),
        lostTreat: treat ? treat.lost : null,
        lostDead: dead ? dead.lost : null,
        cells: CELLS,
      }),
  );
}
