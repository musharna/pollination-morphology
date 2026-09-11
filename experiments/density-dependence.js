/*
 * density-dependence.js — is the exclusion result an artefact of FIXED
 * POPULATION SIZE? (roadmap B)
 *
 * WHERE THIS COMES FROM. Secondary contact (2026-08-04) found that two lineages
 * founded past d≈8 do not fuse — one is LOST OUTRIGHT, in every seed, and not by
 * drift. A second pollinator did not rescue it either. That leaves a prediction
 * the world contradicts, because orchid communities plainly contain coexisting
 * congeners, and the two-pollinator write-up named the leading suspect:
 *
 *   "The leading remaining candidate is not biology at all but a MODELLING
 *    ASSUMPTION: population size is fixed. Every generation the IBM fills exactly
 *    N offspring slots, so two reproductively isolated lineages are forced into a
 *    zero-sum contest for them."
 *
 * ⚠️ THAT ASSUMPTION HAS A NAME, and naming it says what to do about it. Filling
 * a constant number of slots is SOFT SELECTION (Wallace 1975): the recruit count
 * is fixed, so only RELATIVE success can matter and one lineage's seed is by
 * construction another's loss. Letting the count follow total seed set is HARD
 * selection, where absolute fitness matters and a population that sets fewer
 * seeds SHRINKS rather than surrendering slots to a competitor.
 *
 * ⚠️ AND IT IS TWO ASSUMPTIONS, NOT ONE — which is why the first attempt at this
 * would have been inert. `visits` is ALSO a constant total, shared out over
 * however many plants exist, so per-plant service is forced to scale as 1/n. With
 * that in place total delivered pollen barely depends on n, the recruit count is
 * nearly constant too, and "population size follows seed set" would have pinned
 * the population at a different number while changing nothing. Both constants are
 * therefore lifted, separately and together, as a 2x2.
 *
 * ⚠️ WHAT IS DELIBERATELY NOT DONE. Giving each lineage its own quota, or its own
 * carrying capacity, would assume coexistence rather than test it — the failure
 * mode this project has hit before. The ceiling K is SHARED and the model is
 * never told which lineage an individual belongs to; `anc` remains a neutral
 * tracer that reads nothing and decides nothing.
 *
 * ⚠️ AND THE PART THAT MATTERS MOST IS PART C. Running arms can only ever say
 * WHETHER the assumption mattered. Part C measures WHY, using the criterion
 * ecology already has for this exact question — mutual invasibility. If neither
 * lineage can do better when rare than its competitor does when common, then
 * exclusion is forced by frequency dependence and NO demographic arrangement can
 * prevent it. That is a statement about the whole class of fixes, not about the
 * one tried here.
 */

const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const C = require("../sim/carryover.js");
const PS = require("../sim/paired-stats.js");

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(
    xs.reduce((s, x) => s + (x - m) * (x - m), 0) / (xs.length - 1),
  );
};
/* Single correct estimator; records n. See docs/2026-09-11-estimator-unification.md */
const ci = PS.makeCi("density-dependence");
const f2 = (x) =>
  x === null || x === undefined ? "   -  " : x.toFixed(2).padStart(6);
const f3 = (x) =>
  x === null || x === undefined ? "    -  " : x.toFixed(3).padStart(7);

/* Smoke mode, for the same reason as every other run here: a long run with no
 * way to exercise its own reporting is how a verdict bug survives. */
const SMOKE = process.env.DD_SMOKE === "1";
const N0 = SMOKE ? 12 : 30;
const GENS = SMOKE ? 4 : 35;
const SEEDS = SMOKE ? [1, 2] : [1, 2, 3, 4, 5];
const SITE_N = SMOKE ? 50 : 160;
const VISITS = I.DEFAULTS.visits;
if (SMOKE)
  console.log(
    "\n*** DD_SMOKE=1 — tiny configuration. Exercises the code path and the\n" +
      "*** reporting. THE NUMBERS BELOW ARE NOT RESULTS.\n",
  );

/* The two separations that matter: the fusion regime, where nothing about this
 * run should change anything, and the exclusion separation the whole question is
 * about. */
const D_FUSE = 2;
const D_EXCL = 8;

const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));
const optsAt = (extra = {}) => ({ ...I.DEFAULTS, siteN: SITE_N, ...extra });

/*
 * ⚠️ THE FECUNDITY CONSTANT, AND WHERE IT IS ALLOWED TO COME FROM.
 *
 * `seedsPerGrain` converts delivered pollen into recruits, so it sets whether the
 * population grows or shrinks. Calibrating it from the two-lineage arms under
 * test would encode their behaviour into the constant that then judges them —
 * the circular-calibration failure. So it is measured ONCE from a different
 * construction: a single well-mixed lineage at n = N0, which is the reference
 * this model has always used, and set to exact replacement there.
 *
 * The ceiling K is then placed well ABOVE the resulting equilibrium, so that
 * regulation comes from the pollen supply rather than from the cap. That matters:
 * a population sitting ON its ceiling is fixed-N wearing a different hat, and
 * anchor 3 checks it is not.
 */
function calibrate() {
  const tot = [];
  for (const seed of SEEDS) {
    const rng = E.makeRng(seed);
    const srng = I.signalRng(seed);
    const pop = I.foundPopulation(N0, rng, { srng });
    const sites = I.sitesOf(pop, optsAt(), 0);
    const r = C.runBout(sites, new Array(N0).fill(1 / N0), {
      visits: VISITS,
      seed: 7,
    });
    let s = 0;
    for (let i = 0; i < N0; i++)
      for (let j = 0; j < N0; j++) if (i !== j) s += r.T[i][j];
    tot.push(s);
  }
  const sigmaRef = mean(tot);
  return { sigmaRef, seedsPerGrain: N0 / sigmaRef };
}

const CAL = calibrate();
const C0 = CAL.seedsPerGrain;
const K = 2 * N0; /* a ceiling, not a target */
const PER_PLANT = VISITS / N0;

/* The four demographic regimes. `demography` lifts the offspring-slot constant;
 * `visitsPerPlant` lifts the pollinator-service constant. */
const REGIMES = [
  ["fixed N, constant TOTAL service   (reference)", {}],
  [
    "regulated N, constant TOTAL service         ",
    { demography: { seedsPerGrain: C0, K } },
  ],
  [
    "fixed N, constant PER-PLANT service         ",
    { visitsPerPlant: PER_PLANT },
  ],
  [
    "regulated N, constant PER-PLANT service     ",
    { demography: { seedsPerGrain: C0, K }, visitsPerPlant: PER_PLANT },
  ],
];

const ancMean = (pop) => (pop.length ? mean(pop.map((i) => i.anc || 0)) : 0);

/*
 * The classification, unchanged from secondary-contact.js so the two runs are
 * directly comparable — plus the one outcome that model could not produce.
 * ancVar starts at 0.25 for an even 0/1 split and falls to 0 under fusion or
 * extinction alike; ancMean tells those apart, because fusion converges on 0.5
 * while the loss of a lineage converges on 0 or 1.
 */
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
 * ANCHOR 1 — the new demography changed NOTHING when it is off. Two goldens,
 * both generated from commit 3089e77 BEFORE any of this existed, so they are
 * external to the code they gate. The second one carries a two-lineage founding
 * so that the ancestry tracer and the population size are non-trivial fields
 * rather than constants.
 */
const PRE_DEMOG_1 = [
  [0.6426076918656048, 3.0637323268730365, 0, 0],
  [0.8843517599890253, 3.6807972859897253, 0, 0],
  [0.8257455458521449, 3.61632994537921, 0, 0],
  [0.49249979315034653, 2.269042873658907, 0, 0],
  [0.6023262955018738, 2.172879959409133, 0, 0],
];
const PRE_DEMOG_2 = [
  [
    8.098155996012254,
    12,
    [4.0336027799771506, 0.25, 0],
    [3.9618302217997967, 0.24305555555555558, 0],
    [4.079102344131324, 0.24305555555555558, 0],
    [3.1490498690911735, 0.1875, 0],
  ],
  [
    8.055323184091645,
    12,
    [4.105644790614217, 0.25, 0],
    [3.981654591281874, 0.25, 0],
    [4.1097341646211945, 0.25, 0],
    [3.6408729149947394, 0.2222222222222223, 0],
  ],
];

const goldenOne = (extra = {}) =>
  I.run({
    n: 12,
    generations: 5,
    seed: 3,
    siteN: 60,
    visits: 6000,
    ...extra,
  }).history.map((r) => [r.spread, r.separation, r.ancVar, r.unmated]);

function goldenTwo(extra = {}) {
  const rows = [];
  for (const seed of [1, 2]) {
    const rng = E.makeRng(seed);
    const srng = I.signalRng(seed);
    const b = I.foundTwoLineages(12, rng, srng, 8, {
      ...I.DEFAULTS,
      siteN: 60,
      visits: 6000,
    });
    const out = I.run({
      n: 12,
      generations: 4,
      seed,
      siteN: 60,
      visits: 6000,
      found: b.pop,
      ...extra,
    });
    rows.push([
      b.realised,
      out.pop.length,
      ...out.history.map((r) => [r.spread, r.ancVar, r.unmated]),
    ]);
  }
  return rows;
}

function anchorInert() {
  const a = JSON.stringify(goldenOne()) === JSON.stringify(PRE_DEMOG_1);
  const b = JSON.stringify(goldenTwo()) === JSON.stringify(PRE_DEMOG_2);
  console.log("  1. with demography OFF the model is unchanged");
  console.log(
    `     single-lineage history bit-identical to 3089e77    ${a ? "ok" : "FAIL"}`,
  );
  console.log(
    `     two-lineage history + sizes bit-identical          ${b ? "ok" : "FAIL"}`,
  );
  return a && b;
}

/*
 * ANCHOR 2 — the service rescaling is a NO-OP at the founding size, which is what
 * makes the 2x2 readable. visitsPerPlant * n reproduces the constant total
 * exactly when n has not moved, so any difference the per-plant arms show is
 * caused by the population having CHANGED SIZE and not by a different budget
 * being handed out on generation zero.
 */
function anchorServiceNoop() {
  const got = goldenOne({ visitsPerPlant: 6000 / 12 });
  const ok = JSON.stringify(got) === JSON.stringify(PRE_DEMOG_1);
  console.log(
    "\n  2. constant PER-PLANT service is identical to the constant total at n = N0",
  );
  console.log(
    `     visitsPerPlant = visits/n reproduces the golden      ${ok ? "ok" : "FAIL"}`,
  );
  return ok;
}

/*
 * ⚠️ ANCHOR 3 — IS THE DENSITY DEPENDENCE ACTUALLY DOING ANYTHING?
 *
 * This is the inertness gate and it is the one that matters. A regulated
 * population that sits on its ceiling every generation is fixed-N with extra
 * steps, and an arm like that would report "the assumption did not matter" no
 * matter what the assumption was. So the population size has to be shown to
 * MOVE, and to move BELOW the cap.
 */
function anchorRegulates() {
  console.log(
    "\n  3. density dependence REGULATES rather than pinning to the ceiling",
  );
  console.log(
    `     (calibrated from a single well-mixed lineage: sigma_ref ${CAL.sigmaRef.toFixed(0)} grains,` +
      ` 1 seed per ${(1 / C0).toFixed(0)} grains, ceiling K=${K})`,
  );
  console.log("        d      mean N    min    max    at ceiling");
  let ok = true;
  for (const d of [D_FUSE, D_EXCL]) {
    const ns = [];
    let atCap = 0;
    let tot = 0;
    for (const seed of SEEDS) {
      const r = contactRun(d, seed, { demography: { seedsPerGrain: C0, K } });
      if (!r) continue;
      r.sizes.forEach((x) => {
        ns.push(x);
        tot++;
        if (x >= K) atCap++;
      });
    }
    if (!ns.length) continue;
    const capFrac = atCap / tot;
    /* it must vary, and it must not live on the cap */
    const good = sd(ns) > 1 && capFrac < 0.05;
    ok = ok && good;
    console.log(
      `      ${f2(d)}   ${f2(mean(ns))}   ${String(Math.min(...ns)).padStart(4)}   ${String(
        Math.max(...ns),
      ).padStart(
        4,
      )}     ${(100 * capFrac).toFixed(1)}%       ${good ? "ok" : "FAIL"}`,
    );
  }
  return ok;
}

/*
 * ⚠️ ANCHOR 4 — CAN THIS HARNESS REPORT "HELD" AT ALL?
 *
 * Every arm below can only return one of four tags, and three of them mean the
 * split went away. A pipeline that is structurally unable to emit HELD would
 * report exclusion no matter what the model did, and the negative would be an
 * artefact of the reporting.
 *
 * There is no way to construct a DYNAMICAL positive control for coexistence
 * without assuming coexistence, which is precisely the trap this run is trying to
 * avoid. But there is one that begs no question: at the exclusion separation the
 * lineages barely exchange pollen, so over a HANDFUL of generations they should
 * usually still be distinct. Running the real arm, unmodified, for 3 generations
 * therefore exercises the identical code path with nothing assumed.
 *
 * ⚠️ THE FIRST VERSION OF THIS GATE DEMANDED HELD IN EVERY SEED AND FAILED AT
 * 4/5, WHICH WAS THE GATE'S FAULT AND NOT THE HARNESS'S. Seed 5 genuinely loses a
 * lineage inside three generations — ancestry collapses to {0} with no unmated
 * mothers and no stalls — so the strict predicate was asserting "no lineage is
 * ever lost that fast", a claim about the MODEL that is simply false, rather than
 * the claim it exists to protect, which is that HELD is REACHABLE. A guard whose
 * scope exceeds its claim cannot discriminate between the thing it is guarding
 * against and ordinary behaviour.
 *
 * So the gate is now the actual claim — HELD appears at least once — and the
 * tally is printed rather than reduced to ok/FAIL, because "4/5" is information
 * about how fast exclusion can be and hiding it behind a tick would waste it. The
 * remaining seeds must still land on a legitimate tag, so a crash or an unknown
 * state cannot pass as a fast exclusion.
 */
function anchorCanHold() {
  const rs = SEEDS.map((s) => contactRun(D_EXCL, s, {}, N0, 3)).filter(Boolean);
  const held = rs.filter((r) => r.fate.tag === "HELD").length;
  const legit = rs.every((r) => TAGS.includes(r.fate.tag));
  const ok = held >= 1 && legit && rs.length > 0;
  const tally = TAGS.map(
    (t) => `${t} ${rs.filter((r) => r.fate.tag === t).length}`,
  ).join(", ");
  console.log(
    "\n  4. the harness CAN report HELD — it is not structurally negative",
  );
  console.log(
    `     the same d=${D_EXCL} arm run for only 3 generations   HELD ${held}/${rs.length}   ${ok ? "ok" : "FAIL"}`,
  );
  console.log(
    `     full tally over seeds: ${tally}` +
      `${held < rs.length ? "   <-- exclusion can happen inside 3 generations" : ""}`,
  );
  return ok;
}

/*
 * ANCHOR 5 — the founding hits its targets and the tracer starts at its maximum.
 * A run that founded both lineages on top of each other would report fusion no
 * matter what the mating system did.
 */
function anchorFounding() {
  console.log(
    "\n  5. two lineages can be founded at the requested separations",
  );
  console.log("       target   realised   ancVar at founding");
  let ok = true;
  for (const d of [D_FUSE, D_EXCL]) {
    const got = [];
    const vars = [];
    for (const seed of SEEDS) {
      const rng = E.makeRng(seed);
      const srng = I.signalRng(seed);
      const b = I.foundTwoLineages(N0, rng, srng, d, optsAt());
      if (!b) continue;
      got.push(b.realised);
      vars.push(I.ancestryVar(b.pop));
    }
    const mg = mean(got);
    const mv = mean(vars);
    const good = mg > d / 2 && mg < d * 2 && Math.abs(mv - 0.25) < 0.02;
    ok = ok && good;
    console.log(
      `     ${f2(d)}   ${f2(mg)}      ${f3(mv)}   ${good ? "ok" : "FAIL"}`,
    );
  }
  return ok;
}

// ========================================================================
// the arms
// ========================================================================

function contactRun(d, seed, extra = {}, n = N0, gens = GENS) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const built = I.foundTwoLineages(n, rng, srng, d, optsAt());
  if (!built) return null;
  const v0 = I.ancestryVar(built.pop);
  const out = I.run({
    n,
    generations: gens,
    seed,
    siteN: SITE_N,
    found: built.pop,
    ...extra,
  });
  const last = out.history[out.history.length - 1] || {};
  return {
    realised: built.realised,
    v0,
    fate: fate(out.pop, v0, out.extinct),
    sizes: out.history.map((h) => h.popN),
    finalN: out.pop.length,
    sep: last.separation ?? null,
    /* ⚠️ stalling is not fusion and must stay visible: a generation that cannot
     * fill itself falls back on the parents when demography is off, and a frozen
     * run would otherwise read as a clean result. */
    stalled: out.history.some((h) => h.stalled),
    unmated: mean(out.history.map((h) => h.unmated)),
  };
}

function regimeSweep(d) {
  console.log(`\n  separation d = ${d}`);
  console.log(
    "    regime                                         mean N   final N   " +
      TAGS.join(" / ") +
      "   stalls",
  );
  const rows = [];
  for (const [label, extra] of REGIMES) {
    const rs = SEEDS.map((s) => contactRun(d, s, extra)).filter(Boolean);
    if (!rs.length) continue;
    const tally = Object.fromEntries(TAGS.map((t) => [t, 0]));
    rs.forEach((r) => tally[r.fate.tag]++);
    const stalls = rs.filter((r) => r.stalled).length;
    rows.push({ d, label, tally, rs });
    console.log(
      `    ${label}   ${f2(mean(rs.flatMap((r) => r.sizes)))}   ${f2(
        mean(rs.map((r) => r.finalN)),
      )}      ${TAGS.map((t) => tally[t]).join(" / ")}        ${stalls}/${rs.length}`,
    );
  }
  return rows;
}

// ========================================================================
// PART C — the invasion criterion
// ========================================================================

/*
 * ⚠️ THIS IS THE PART THAT EXPLAINS THE OTHERS.
 *
 * Coexistence theory has a criterion for exactly this question and it is not
 * "did anyone go extinct": two types coexist if each can INCREASE WHEN RARE
 * against the other at its equilibrium (Turelli 1978; Chesson 2000). Mutual
 * invasibility requires a STABILISING niche difference — each type must limit
 * itself more than it limits the other.
 *
 * So per-capita pollen receipt is measured as a function of a lineage's own
 * frequency. If a lineage does WORSE when rare, the frequency dependence is
 * POSITIVE, neither type can invade, and exclusion is forced by the mating system
 * — in which case no demographic arrangement whatsoever can produce coexistence
 * and Part B's negative is a property of the whole class of fixes rather than of
 * the one tried.
 *
 * ⚠️ AND IT NEEDS ITS OWN POSITIVE CONTROL, because a statistic that always
 * reports "worse when rare" would be indistinguishable from an inert one. The
 * control is the SAME measurement at ZERO separation, where the two labels sit on
 * top of each other and there is no placement difference to be frequency
 * dependent about: it must read ~1.
 *
 * ⚠️ `same: true` gives both labels the IDENTICAL founding genome, and the first
 * version of this control did not — it asked for a target separation of 0.05.
 * That was the wrong construction: the founding search selects on REALISED
 * placement (placement is not a gene, so a separation cannot be assigned) and it
 * cannot reach below d≈0.2, so the control silently ran at a real separation and
 * read 0.66 instead of 1. An apparent control failure that was entirely the
 * control's own fault. Two labels on one lineage cannot differ in placement.
 */
function foundAtFreq(n, rng, srng, targetD, fB, same = false) {
  const b = I.foundTwoLineages(n, rng, srng, targetD, optsAt());
  if (!b) return null;
  const nB = Math.min(n - 1, Math.max(1, Math.round(n * fB)));
  const nA = n - nB;
  const pop = [
    ...I.foundPopulation(nA, rng, {
      spread: 0.02,
      srng,
      base: b.gA,
      anc: 0,
    }),
    ...I.foundPopulation(nB, rng, {
      spread: 0.02,
      srng,
      base: same ? b.gA : b.gB,
      anc: 1,
    }),
  ];
  return { pop, nA, nB, realised: same ? 0 : b.realised };
}

/* Per-capita cross-pollen receipt of each lineage in a single bout. This is the
 * quantity density dependence converts into recruits, so it IS the per-capita
 * growth rate up to the constant. */
function perCapita(built) {
  const n = built.pop.length;
  const sites = I.sitesOf(built.pop, optsAt(), 0);
  const r = C.runBout(sites, new Array(n).fill(1 / n), {
    visits: VISITS,
    seed: 7,
  });
  const rec = new Array(n).fill(0);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) if (i !== j) rec[j] += r.T[i][j];
  const A = rec.slice(0, built.nA);
  const B = rec.slice(built.nA);
  return { A: mean(A), B: mean(B) };
}

function invasion(d, label, same = false) {
  const FREQS = SMOKE ? [0.25, 0.75] : [0.1, 0.25, 0.5, 0.75, 0.9];
  console.log(`\n  ${label}`);
  console.log(
    "     freq of B   realised d   per-capita A   per-capita B   B relative to A",
  );
  const rows = [];
  for (const f of FREQS) {
    const ra = [];
    const rb = [];
    const ds = [];
    for (const seed of SEEDS) {
      const rng = E.makeRng(seed);
      const srng = I.signalRng(seed);
      const built = foundAtFreq(N0, rng, srng, d, f, same);
      if (!built) continue;
      const pc = perCapita(built);
      if (!(pc.A > 0) || !(pc.B > 0)) continue;
      ra.push(pc.A);
      rb.push(pc.B);
      ds.push(built.realised);
    }
    if (!ra.length) continue;
    const rels = rb.map((x, i) => x / ra[i]);
    const rel = mean(rels);
    const relCi = ci(rels);
    rows.push({ f, d: mean(ds), A: mean(ra), B: mean(rb), rel, relCi });
    console.log(
      `      ${f2(f)}      ${f2(mean(ds))}      ${f2(mean(ra))}        ${f2(mean(rb))}        ${f3(rel)} +/- ${relCi.toFixed(3)}`,
    );
  }
  return rows;
}

// ========================================================================
// main
// ========================================================================

console.log("=".repeat(94));
console.log(
  "Density dependence: is the exclusion result an artefact of fixed population size?",
);
console.log("=".repeat(94));

rule("PART 0 — the anchor gate");
const gate = [
  anchorInert(),
  anchorServiceNoop(),
  anchorRegulates(),
  anchorCanHold(),
  anchorFounding(),
];
if (!gate.every(Boolean)) {
  console.log(
    SMOKE
      ? "\n(anchors do not all apply at smoke size — informational only)"
      : "\nANCHORS FAILED — refusing to compute a result.",
  );
  if (!SMOKE) process.exit(1);
}

rule("PART A — the 2x2: does lifting either constant change the outcome?");
console.log(
  "  ⚠️ Both constants are MODELLING ASSUMPTIONS. `demography` lifts the fixed number of\n" +
    "  offspring slots (soft selection -> hard). `visitsPerPlant` lifts the fixed total of\n" +
    "  pollinator service. The ceiling K is SHARED — a quota each would assume the answer.",
);
const excl = regimeSweep(D_EXCL);
const fuse = regimeSweep(D_FUSE);

rule("PART B — the null: mating severed from placement");
console.log(
  "  ⚠️ THE CONTROL THAT MAKES PART A MEAN ANYTHING. If lineages are lost here too, the\n" +
    "  outcome is demographic rather than geometric, and nothing above is about placement.",
);
console.log(
  "\n    regime                                         mean N   final N   " +
    TAGS.join(" / "),
);
const nulls = [];
for (const [label, extra] of [REGIMES[0], REGIMES[1]]) {
  const rs = SEEDS.map((s) =>
    contactRun(D_EXCL, s, { ...extra, randomMating: true }),
  ).filter(Boolean);
  if (!rs.length) continue;
  const tally = Object.fromEntries(TAGS.map((t) => [t, 0]));
  rs.forEach((r) => tally[r.fate.tag]++);
  nulls.push({ label, tally });
  console.log(
    `    ${label}   ${f2(mean(rs.flatMap((r) => r.sizes)))}   ${f2(
      mean(rs.map((r) => r.finalN)),
    )}      ${TAGS.map((t) => tally[t]).join(" / ")}`,
  );
}

rule("PART C — the invasion criterion: CAN either lineage increase when rare?");
const inv = invasion(D_EXCL, `at the exclusion separation d = ${D_EXCL}`);
const ctl = invasion(
  D_EXCL,
  "POSITIVE CONTROL — the same measurement with ONE lineage wearing both labels (must read ~1)",
  true,
);

// ---------------------------------------------------------------- verdict

console.log("\n" + "=".repeat(94));

/*
 * ⚠️ A REGIME WHOSE POPULATION DIED OUT SAYS NOTHING ABOUT COEXISTENCE, and it
 * must not be allowed to count as agreement. "BOTH LOST" is not a quieter version
 * of "one lost" — it means the arm never got to answer the question, and lumping
 * the two together would let a broken demography masquerade as confirmation.
 * Constant PER-PLANT service is expected to land here: it removes the fixed
 * limiting factor and with it any density regulation at all, so the population
 * random-walks (probed: one seed in three extinct within 20 generations).
 */
const viable = excl.filter((r) => r.tally["BOTH LOST"] <= SEEDS.length / 2);
const dead = excl.filter((r) => r.tally["BOTH LOST"] > SEEDS.length / 2);
const exclLost = viable.filter(
  (r) => r.tally["one lost"] > r.tally.FUSED + r.tally.HELD,
);
const exclHeld = viable.filter((r) => r.tally.HELD > 0);
const nullFuses = nulls.every((n) => n.tally.FUSED > n.tally["one lost"]);

/* Does the rare lineage do WORSE than the common one? Read at the extreme
 * frequencies, where "rare" actually means rare. */
const lo = inv[0];
const hi = inv[inv.length - 1];
const pfd = lo && hi && lo.rel < hi.rel;
const controlFlat =
  ctl.length && ctl.every((r) => Math.abs(r.rel - 1) < 0.25 + r.relCi);

console.log(
  `  regimes that stayed viable at d=${D_EXCL} : ${viable.length}/${excl.length}` +
    `${dead.length ? `   (population died out in: ${dead.map((r) => r.label.trim()).join("; ")})` : ""}`,
);
console.log(
  `  of those, losing a lineage : ${exclLost.length}/${viable.length}` +
    `      HELD both : ${exclHeld.length}/${viable.length}\n`,
);

if (
  viable.length &&
  exclHeld.length === 0 &&
  exclLost.length === viable.length
) {
  console.log(
    `  LIFTING THE FIXED-POPULATION-SIZE ASSUMPTION DOES NOT RESCUE COEXISTENCE.\n` +
      `\n` +
      `  All ${viable.length} viable demographic regimes lose a lineage at d=${D_EXCL} — including the one where the\n` +
      `  population genuinely tracks its own seed set and is nowhere near its ceiling.\n` +
      `  ${nullFuses ? "The random-mating null still fuses, so this is still the geometry." : "⚠️ THE NULL DOES IT TOO — this would be demographic, not geometric."}\n`,
  );
  if (pfd && controlFlat) {
    console.log(
      `  AND PART C SAYS WHY, WHICH IS THE USEFUL PART. Per-capita receipt RISES with a\n` +
        `  lineage's own frequency (${f3(lo.rel).trim()} at ${lo.f} against ${f3(hi.rel).trim()} at ${hi.f}), so a rare lineage does\n` +
        `  WORSE, not better. That is POSITIVE frequency dependence, and it means neither\n` +
        `  lineage can increase when rare — the mutual-invasibility criterion fails.\n` +
        `\n` +
        `  ⚠️ THAT GENERALISES BEYOND THE FIX TRIED HERE. Coexistence needs a STABILISING\n` +
        `  niche difference — each type limiting itself more than it limits the other. This\n` +
        `  model has the opposite sign, so NO demographic arrangement can produce\n` +
        `  coexistence: the constant was never the cause. The zero-separation control reads\n` +
        `  flat, so the statistic is capable of reporting an absence of frequency dependence.\n` +
        `\n` +
        `  ⚠️ AND IT UNIFIES THE PROJECT'S TWO OPEN QUESTIONS. Coexistence needs a rare\n` +
        `  lineage to do better than a common one; so does the origin of a split. They are\n` +
        `  the SAME requirement, and eight mechanisms have now failed to supply it. The\n` +
        `  coexistence gap is not a second problem — it is the first one seen from the far\n` +
        `  side.`,
    );
  } else {
    console.log(
      `  ⚠️ Part C did not deliver a clean reading (${pfd ? "" : "no monotone frequency dependence"}` +
        `${!controlFlat ? (pfd ? "the zero-separation control is NOT flat" : "; control not flat") : ""}).\n` +
        `  Do not quote the invasion argument until that is understood — an inert control\n` +
        `  means the statistic cannot report the absence it is being used to rule out.`,
    );
  }
} else if (exclHeld.length) {
  console.log(
    `  ⚠️ A DEMOGRAPHIC REGIME MAINTAINS BOTH LINEAGES. That is a first for this project,\n` +
      `  so check it hard before believing it: is the population sitting on its ceiling\n` +
      `  (anchor 3), does the null hold at the same separation, and is the shared K really\n` +
      `  shared? Regimes that held:\n    ` +
      exclHeld.map((r) => r.label.trim()).join("\n    "),
  );
} else {
  console.log(
    `  Mixed outcome across regimes — read the table rather than a headline.`,
  );
}
console.log("=".repeat(94));
