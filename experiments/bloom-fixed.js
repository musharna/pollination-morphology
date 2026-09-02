/*
 * bloom-fixed.js — the 2026-09-01 pre-registration
 * (docs/2026-09-01-bloom-fixed-prereg.md), written before this file.
 *
 * THE QUESTION. #52 showed roadmap B's positive rests on the per-slice rarity
 * premium: HELD 0.289 -> 0.026 once visits are apportioned by display. But that
 * ablation moves TWO things — the premium, and (downstream, over generations)
 * the flowering-time polymorphism, which collapses from a maintained scatter to
 * near-fixation. #52's two-step reading is inferred from two quantities that
 * moved together, which is exactly the shape of claim this project has been
 * wrong about before.
 *
 * So both factors are CROSSED rather than ablated again:
 *
 *                        bloom free to evolve   bloom distribution FORCED
 *   flat per-slice        A  = #37 (0.289)      D  premium KEPT, polymorphism KILLED
 *   visits ∝ display      B  = #52 (0.026)      C  premium GONE, polymorphism RESTORED
 *
 * C takes A's realised multiset each generation, D takes B's. If the premium
 * acts ONLY through the variation it sustains, C recovers and D collapses. If it
 * acts directly on ancestry, the opposite. Both are registered, and DIRECT would
 * falsify the mechanism paragraph written into #52's result.
 *
 * ⚠️ A FORCED BLOOM DISTRIBUTION IS NOT A MODEL OF ANYTHING. It is an instrument
 * for holding one variable still, and nothing here claims real flowering-time
 * distributions are externally imposed.
 */
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const { pairedCI, degenerate, zeroUpper } = require("../sim/paired-stats.js");

const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const f3 = (x) =>
  x == null || Number.isNaN(x) ? "     - " : x.toFixed(3).padStart(7);
const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));

const SMOKE = process.env.BF_SMOKE === "1";
const N0 = SMOKE ? 12 : 30;
const GENS = SMOKE ? 6 : 35;
const SITE_N = SMOKE ? 50 : 160;
const D_EXCL = 8;
const SLICES = 8;
const WIDTH = 0.12;
const N_SEEDS = SMOKE ? 4 : Number(process.env.BF_SEEDS || 40);
const SEEDS = Array.from({ length: N_SEEDS }, (_, i) => i + 1);

if (SMOKE)
  console.log(
    "\n*** BF_SMOKE=1 — tiny configuration. Exercises the code path and the\n" +
      "*** reporting. THE NUMBERS BELOW ARE NOT RESULTS.\n",
  );

function bloomMoments(blooms) {
  if (!blooms || blooms.length < 4) return null;
  const n = blooms.length;
  let c1 = 0,
    s1 = 0,
    c2 = 0,
    s2 = 0;
  for (const b of blooms) {
    const a = 2 * Math.PI * b;
    c1 += Math.cos(a);
    s1 += Math.sin(a);
    c2 += Math.cos(2 * a);
    s2 += Math.sin(2 * a);
  }
  return { R1: Math.hypot(c1 / n, s1 / n), R2: Math.hypot(c2 / n, s2 / n) };
}

/*
 * One replicate. `donor` is null (bloom free) or an array indexed by generation
 * holding the multiset to impose. The phenology object is MUTATED between steps
 * rather than rebuilt, so the generation's donor reaches `step` without changing
 * its signature; when donor is null the property is falsy and the hook in
 * sim/ibm.js does not run at all.
 */
function replicate(seed, { dpv, donor }) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const brng = I.bloomRng(seed);
  const phen = {
    slices: SLICES,
    width: WIDTH,
    ...(dpv ? { displayProportionalVisits: true } : {}),
  };
  const opts = { ...I.DEFAULTS, siteN: SITE_N, phenology: phen };
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  if (!built) return null;

  let pop = built.pop;
  const ancVar0 = I.ancestryVar(pop);
  const bloomsByGen = [];
  const r1 = [];
  const r2 = [];
  const lineage = [];
  const coflow = [];
  /* size mismatches between donor and recipient, counted rather than assumed
   * away — a silent index mismatch would stop this being the donor's
   * distribution without changing anything visible */
  let sizeMismatch = 0;
  let gen0Spent = null;
  let extinct = false;
  const trace = [];
  for (let g = 0; g < GENS; g++) {
    if (pop.length < 2) {
      extinct = true;
      break;
    }
    const d = donor ? donor[g] || null : null;
    if (d && d.length !== pop.length) sizeMismatch++;
    phen.forceBloomDist = d;
    const res = I.step(pop, opts, rng, g, srng, brng);
    if (g === 0) gen0Spent = res.visitsSpent;
    bloomsByGen.push(res.blooms ? Array.from(res.blooms) : null);
    if (res.bloomLineage != null) lineage.push(res.bloomLineage);
    if (res.coflower != null) coflow.push(res.coflower);
    const m = bloomMoments(res.blooms);
    if (m != null) {
      r1.push(m.R1);
      r2.push(m.R2);
    }
    /* a compact per-generation fingerprint, for the self-donation identity */
    trace.push(
      `${res.bloomAssort}|${res.bloomLineage}|${res.coflower}|${res.visitsSpent}|${I.ancestryVar(res.pop)}|${res.pop.length}`,
    );
    pop = res.pop;
  }
  return {
    seed,
    fate: I.fateOf(pop, ancVar0, extinct),
    ancRatio: ancVar0 > 0 ? I.ancestryVar(pop) / ancVar0 : null,
    /* EARLY window, matching phenology.js: once a lineage is lost there is no
     * ancestry variation left for flowering time to be associated with */
    lineage: lineage.length ? mean(lineage.slice(0, 10)) : null,
    coflower: coflow.length ? mean(coflow.slice(0, 10)) : null,
    /* LAST few generations — the bloom distribution settles over time */
    R1: mean(r1.slice(-5)),
    R2: mean(r2.slice(-5)),
    bloomsByGen,
    sizeMismatch,
    gen0Spent,
    trace: trace.join("\n"),
  };
}

const fracOf = (f) => (rows) =>
  rows.filter((r) => r.fate === f).length / rows.length;
const HELD = fracOf("HELD");
const ciStr = (ci) =>
  ci
    ? `${ci.point >= 0 ? "+" : ""}${ci.point.toFixed(3)} [${ci.lo.toFixed(3)}, ${ci.hi.toFixed(3)}]`
    : "—";

console.log(
  `bloom-fixed 2x2 — ${N_SEEDS} seeds, n=${N0}, ${GENS} generations, ` +
    `${SLICES} slices, width ${WIDTH}, d=${D_EXCL}`,
);

/* ---------------------------------------------------------------- the cells */
const A = [],
  B = [],
  C = [],
  D = [],
  Aself = [],
  Bself = [];
for (const s of SEEDS) {
  const a = replicate(s, { dpv: false, donor: null });
  const b = replicate(s, { dpv: true, donor: null });
  if (!a || !b) continue;
  A.push(a);
  B.push(b);
  /* C: premium removed, A's polymorphism restored. D: premium kept, B's
   * polymorphism imposed. */
  const c = replicate(s, { dpv: true, donor: a.bloomsByGen });
  const d = replicate(s, { dpv: false, donor: b.bloomsByGen });
  if (c) C.push(c);
  if (d) D.push(d);
  /* ⚠️ C2 — SELF-DONATION. Rank-mapping a multiset onto itself is the identity,
   * so these must reproduce A and B exactly. This is the positive control on
   * the forcing mechanism and nothing else can stand in for it: without it,
   * "C differs from A" cannot be told apart from "forcing perturbs whatever it
   * touches". */
  const as = replicate(s, { dpv: false, donor: a.bloomsByGen });
  const bs = replicate(s, { dpv: true, donor: b.bloomsByGen });
  if (as) Aself.push(as);
  if (bs) Bself.push(bs);
}

rule("THE 2x2");
console.log(
  "  cell                                    HELD   ancVar/0   R1      R2    bloomLin  coflow",
);
const show = (label, rows) =>
  console.log(
    `  ${label.padEnd(38)}${f3(HELD(rows))}${f3(
      mean(rows.map((r) => r.ancRatio).filter((x) => x != null)),
    )}${f3(mean(rows.map((r) => r.R1)))}${f3(mean(rows.map((r) => r.R2)))}` +
      `${f3(mean(rows.map((r) => r.lineage).filter((x) => x != null)))}` +
      `${f3(mean(rows.map((r) => r.coflower).filter((x) => x != null)))}`,
  );
show("A  flat budget, bloom free  (=#37)", A);
show("B  visits∝display, bloom free (=#52)", B);
show("C  visits∝display, bloom FORCED to A", C);
show("D  flat budget,   bloom FORCED to B", D);

/* ------------------------------------------------------------- the controls */
rule("THE CONTROLS — the run is uninterpretable unless these hold");

/* C2 first: it gates everything else. */
const identical = (xs, ys) => {
  let k = 0;
  for (let i = 0; i < Math.min(xs.length, ys.length); i++)
    if (xs[i].trace === ys[i].trace) k++;
  return k;
};
const selfA = identical(A, Aself);
const selfB = identical(B, Bself);
const C2 = selfA === A.length && selfB === B.length;
console.log(
  `  C2  SELF-DONATION IS THE IDENTITY: A vs A-forced-with-A ${selfA}/${A.length}, ` +
    `B vs B-forced-with-B ${selfB}/${B.length}`,
);
console.log(
  C2
    ? "      ✅ forcing an arm with its own trajectory reproduces it exactly, so a\n" +
        "         difference in C or D is the DONOR's distribution and not the hook."
    : "      ⚠️⚠️ FAILED — the forcing perturbs what it touches. Every difference in\n" +
        "         C and D is then confounded with the instrument and NOTHING may be\n" +
        "         concluded from either cell.",
);

/* C1 — the forcing LANDED: a forced arm's bloom distribution is its donor's.
 * R1 and R2 depend on the multiset and on nothing else, so if the hook did what
 * it says these must agree to three decimals. */
const avg = (rows, k) => mean(rows.map((r) => r[k]));
const near = (x, y) => Math.abs(x - y) < 5e-4;
const c1 =
  near(avg(C, "R1"), avg(A, "R1")) &&
  near(avg(C, "R2"), avg(A, "R2")) &&
  near(avg(D, "R1"), avg(B, "R1")) &&
  near(avg(D, "R2"), avg(B, "R2"));
console.log(
  `\n  C1  FORCING LANDED: C (R1 ${f3(avg(C, "R1"))} R2 ${f3(avg(C, "R2"))}) vs donor A ` +
    `(R1 ${f3(avg(A, "R1"))} R2 ${f3(avg(A, "R2"))})`,
);
console.log(
  `                      D (R1 ${f3(avg(D, "R1"))} R2 ${f3(avg(D, "R2"))}) vs donor B ` +
    `(R1 ${f3(avg(B, "R1"))} R2 ${f3(avg(B, "R2"))})`,
);
console.log(
  c1
    ? "      ✅ each forced cell carries its donor's flowering-time distribution."
    : "      ⚠️⚠️ FAILED — a forced cell does NOT hold its donor's distribution, so\n" +
        "         the variable this run exists to hold still did not stay still.",
);

/* C3 — the lineage tie survives the rank mapping. The sort cuts the ring at 0,
 * so relatives at 0.99 and 0.01 are ring-close but rank-far; if that scrambles
 * who flowers with whom, the forced cells no longer carry the mechanism. */
const lin = (rows) => mean(rows.map((r) => r.lineage).filter((x) => x != null));
const c3 = lin(C) < 0.99 && lin(D) < 0.99;
console.log(
  `\n  C3  LINEAGE TIE SURVIVES: bloomLineage  A ${f3(lin(A))}  B ${f3(lin(B))}` +
    `  C ${f3(lin(C))}  D ${f3(lin(D))}   (<0.99 required in C and D)`,
);
console.log(
  c3
    ? "      ✅ relatives still flower together after the rank mapping."
    : "      ⚠️⚠️ FAILED — the mapping destroyed the bloom-to-lineage tie, which is\n" +
        "         the mechanism under test. The forced cells say nothing about it.",
);

/* C5 — the budget guard, ONE STEP ON THE SAME POPULATION. Never a run total:
 * the arms diverge after generation 0, so a sum over generations compares
 * trajectories. #51 made that error and fixed it; #52's prereg re-made it. */
const g0 = (rows) => mean(rows.map((r) => r.gen0Spent));
const c5 = near(g0(A), g0(D)) && near(g0(B), g0(C));
console.log(
  `\n  C5  BUDGET @ GENERATION 0 (same population): A ${Math.round(g0(A))}  ` +
    `D ${Math.round(g0(D))}  |  B ${Math.round(g0(B))}  C ${Math.round(g0(C))}`,
);
console.log(
  c5
    ? "      ✅ each forced cell spends exactly what its budget-matched free cell spends."
    : "      ⚠️⚠️ FAILED — the arms did not start from the same budget.",
);

/* C6 — donor/recipient size mismatch, reported rather than hidden */
const mm = (rows) => mean(rows.map((r) => r.sizeMismatch));
console.log(
  `\n  C6  donor/recipient size mismatches per replicate: C ${f3(mm(C))}  D ${f3(mm(D))}` +
    `  (of ${GENS} generations; mapped by quantile when they differ)`,
);

/* ---------------------------------------------------- registered predictions */
rule("PART 3 — the registered predictions");
const hA = HELD(A),
  hB = HELD(B),
  hC = HELD(C),
  hD = HELD(D);
const P1 = hC >= 0.158;
const P2 = hD <= 0.079;
console.log(`  A (=#37) HELD ${f3(hA)}   B (=#52) HELD ${f3(hB)}`);
console.log(
  `  P1  C recovers, HELD >= 0.158:  ${f3(hC)}  ${P1 ? "✅ PASS" : "❌ FAIL"}`,
);
console.log(
  `  P2  D collapses, HELD <= 0.079: ${f3(hD)}  ${P2 ? "✅ PASS" : "❌ FAIL"}`,
);
const paired = (x, y, label) => {
  if (x.length !== y.length) return `${label}: unequal n, no paired interval`;
  return degenerate(x, y, HELD)
    ? `${label}: ${x.filter((r) => r.fate === "HELD").length}/${x.length} vs ` +
        `${y.filter((r) => r.fate === "HELD").length}/${y.length} — ⚠️ NO INTERVAL ` +
        `(exact 95% upper bound ${(zeroUpper(x.length) * 100).toFixed(2)}%)`
    : `${label}: ${ciStr(pairedCI(x, y, HELD))}`;
};
console.log("\n  " + paired(C, B, "C − B  (restoring the polymorphism)"));
console.log("  " + paired(D, A, "D − A  (destroying the polymorphism)"));

rule("VERDICT");
if (!C2)
  console.log(
    "  ⚠️⚠️ NO RESULT — C2 failed. Self-donation is not the identity, so the\n" +
      "  forcing perturbs whatever it touches and every difference in C and D is\n" +
      "  confounded with the instrument. No verdict is issued.",
  );
else if (!c1 || !c3 || !c5)
  console.log(
    "  ⚠️⚠️ NO RESULT — a registered control failed (C1, C3 or C5 above). The\n" +
      "  variable this run exists to hold still did not stay still, or the arms\n" +
      "  did not start from the same budget.",
  );
else if (P1 && P2)
  console.log(
    "  ✅ TWO-STEP CONFIRMED. Restoring the flowering-time polymorphism restores\n" +
      `     retained ancestry with the premium still gone (C ${f3(hC)}), and destroying\n` +
      `     it collapses retained ancestry with the premium still present (D ${f3(hD)}).\n` +
      "     The premium acts on ancestry ONLY through the variation it sustains, so\n" +
      "     the causal variable is the VARIATION, not the allocation rule as such.",
  );
else if (hC <= 0.079 && hD >= 0.158)
  console.log(
    "  ⛔ DIRECT — AND #52's MECHANISM PARAGRAPH IS REFUTED AND MUST BE RETRACTED.\n" +
      `     C stays collapsed (${f3(hC)}) with the polymorphism restored, and D stays\n` +
      `     high (${f3(hD)}) with it destroyed. The premium acts on ancestry directly;\n` +
      "     the bloom collapse #52 reported carried none of the work. Registered in\n" +
      "     advance in docs/2026-09-01-bloom-fixed-prereg.md.",
  );
else if (hC >= 0.158 && hD >= 0.158)
  console.log(
    "  ⚠️ BOTH — each factor suffices on its own and neither is necessary.\n" +
      `     C ${f3(hC)}, D ${f3(hD)}, against A ${f3(hA)} and B ${f3(hB)}.`,
  );
else if (hC <= 0.079 && hD <= 0.079)
  console.log(
    "  ⚠️⚠️ NEITHER — both factors are necessary and neither is sufficient.\n" +
      `     C ${f3(hC)} and D ${f3(hD)} are both collapsed, so the effect lives in the\n` +
      "     COMBINATION and NO SINGLE MECHANISM MAY BE NAMED.",
  );
else
  console.log(
    "  ⚠️ PARTIAL — the cells fall between the registered bands.\n" +
      `     C ${f3(hC)} (band >= 0.158), D ${f3(hD)} (band <= 0.079).\n` +
      "     No mechanism is named, and the run does not get to pick whichever half\n" +
      "     reads better.",
  );
