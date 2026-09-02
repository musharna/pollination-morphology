/*
 * bloom-switch.js — the 2026-09-02 pre-registration
 * (docs/2026-09-02-bloom-switch-prereg.md), written before this file.
 *
 * THE QUESTION. #52 showed roadmap B's assortment result rests on the per-slice
 * rarity premium, and read that as a two-step: the premium maintains the
 * flowering-time polymorphism, the polymorphism assorts, assortment retains
 * ancestry. #53 tried to break those apart by crossing them and FAILED — C7
 * showed the forcing hook collapses retained ancestry to 0.000 on its own, so no
 * exogenous bloom trajectory may be imposed.
 *
 * This design imposes nothing. It runs the premium ON for k generations, then
 * switches it OFF, on the population's own uninterrupted trajectory.
 *
 * ⚠️⚠️ THE k-SWEEP ALONE CANNOT DISCRIMINATE, and the prereg says so before any
 * number exists. Both hypotheses make HELD(k) monotone in k; they differ only by
 * a SHIFT equal to however long the polymorphism takes to relax after the switch,
 * which is precisely the unknown. So the verdict is read off a paired within-seed
 * contrast between two travel times: how fast ancestry moves from arm A toward
 * arm B, against how fast the polymorphism does.
 *
 *   ancGap(g)  = (v(g)  - v_A(g))  / (v_B(g)  - v_A(g))
 *   polyGap(g) = (R1(g) - R1_A(g)) / (R1_B(g) - R1_A(g))
 *   D(g)       = ancGap(g) - polyGap(g)
 *
 * D > 0 ⇒ ancestry outruns the polymorphism ⇒ the premium acts PER GENERATION,
 * which falsifies #52's mechanism paragraph. D <= 0 ⇒ they co-move or ancestry
 * lags ⇒ consistent with the two-step, and consistent-with is all it can be.
 *
 * ⚠️ AND THE WHOLE CONTRAST IS A COMPARISON OF TWO TIMESCALES, SO IT IS VOID IF
 * THEY ARE NOT SEPARABLE. If the polymorphism relaxes instantly, both hypotheses
 * predict D ≈ 0 and the design has not chosen between them. That is the same
 * class of failure that voided #53, so it is gated FIRST and the verdict is not
 * printed unless the gate passes.
 */
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const { interval, pairedCI } = require("../sim/paired-stats.js");

const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const f3 = (x) =>
  x == null || Number.isNaN(x) ? "     - " : x.toFixed(3).padStart(7);
const rule = (s) => console.log("\n" + s + "\n" + "-".repeat(s.length));

const SMOKE = process.env.BS_SMOKE === "1";
const N0 = SMOKE ? 12 : 30;
const GENS = SMOKE ? 8 : 35;
const SITE_N = SMOKE ? 50 : 160;
const D_EXCL = 8;
const SLICES = 8;
const WIDTH = 0.12;
const N_SEEDS = SMOKE ? 4 : Number(process.env.BS_SEEDS || 40);
const SEEDS = Array.from({ length: N_SEEDS }, (_, i) => i + 1);

/* the switch times. 0 is arm B (premium never on), GENS is arm A (never off) —
 * they are not separate code paths, which is what makes C1 and C2 real positive
 * controls on the switch machinery rather than on a parallel implementation. */
/* ⚠️ `BS_KS` exists so the two positive controls can be validated on the seed set
 * that produced them WITHOUT paying for the whole sweep: `BS_KS=0,35 BS_SEEDS=40`
 * runs exactly arms B and A. It selects which arms run, never how any of them
 * behaves — every arm is the same code path with a different switch time. */
const KS = process.env.BS_KS
  ? process.env.BS_KS.split(",")
      .map((s) => Number(s.trim()))
      .filter((k) => Number.isFinite(k) && k >= 0 && k <= GENS)
      .sort((a, b) => a - b)
  : SMOKE
    ? [0, 2, 4, GENS]
    : [0, 5, 10, 15, 20, 25, GENS];
if (!KS.includes(0) || !KS.includes(GENS))
  throw new Error(
    `BS_KS must include both reference arms 0 and ${GENS} — every gap is measured against them`,
  );
/* the interior switch times, i.e. everything that is not a reference arm */
const KMID = KS.filter((k) => k !== 0 && k !== GENS);
const WANT_PRIMARY = SMOKE ? 4 : 15;
const K_PRIMARY = KMID.includes(WANT_PRIMARY)
  ? WANT_PRIMARY
  : KMID.length
    ? KMID[Math.floor((KMID.length - 1) / 2)]
    : null;

/* G3 — a generation is admissible only where BOTH denominators are big enough
 * that the gap is not a ratio of noise. */
const DENOM_FLOOR = 0.05;
const MIN_ADMISSIBLE = 5;
/* the DIRECT band from the prereg */
const DIRECT_BAND = 0.15;

if (SMOKE)
  console.log(
    "\n*** BS_SMOKE=1 — tiny configuration. Exercises the code path and the\n" +
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
 * One replicate. The premium is ON while `g < switchAt` and OFF from then on.
 * `PH.displayProportionalVisits` false means every occupied slice receives the
 * flat `perSlice` budget REGARDLESS of display — that flat budget IS the premium.
 * The phenology object is mutated between steps rather than rebuilt, the same
 * way #53 delivered its per-generation donor, so `sim/ibm.js` is not touched by
 * this experiment at all and A/B are a free cross-experiment reproducibility
 * check against #53.
 */
function replicate(seed, switchAt) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const brng = I.bloomRng(seed);
  const phen = { slices: SLICES, width: WIDTH };
  const opts = { ...I.DEFAULTS, siteN: SITE_N, phenology: phen };
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  if (!built) return null;

  let pop = built.pop;
  const ancVar0 = I.ancestryVar(pop);
  /* indexed BY GENERATION, with nulls preserved — an array that silently skips
   * the generations where a moment was undefined would misalign against A and B
   * and the gaps would compare different generations to each other. */
  const v = [];
  const R1 = [];
  const spent = [];
  const trace = [];
  const lineage = [];
  const coflow = [];
  let extinct = false;

  for (let g = 0; g < GENS; g++) {
    if (pop.length < 2) {
      extinct = true;
      break;
    }
    /* THE SWITCH, and the only line that differs between every arm here. */
    phen.displayProportionalVisits = g >= switchAt;
    const res = I.step(pop, opts, rng, g, srng, brng);
    const av = I.ancestryVar(res.pop);
    v.push(ancVar0 > 0 ? av / ancVar0 : null);
    const m = bloomMoments(res.blooms);
    R1.push(m ? m.R1 : null);
    spent.push(res.visitsSpent);
    if (res.bloomLineage != null) lineage.push(res.bloomLineage);
    if (res.coflower != null) coflow.push(res.coflower);
    trace.push(
      `${res.bloomAssort}|${res.bloomLineage}|${res.coflower}|${res.visitsSpent}|${av}|${res.pop.length}`,
    );
    pop = res.pop;
  }
  const r1tail = R1.filter((x) => x != null).slice(-5);
  return {
    seed,
    switchAt,
    fate: I.fateOf(pop, ancVar0, extinct),
    ancRatio: ancVar0 > 0 ? I.ancestryVar(pop) / ancVar0 : null,
    lineage: lineage.length ? mean(lineage.slice(0, 10)) : null,
    coflower: coflow.length ? mean(coflow.slice(0, 10)) : null,
    R1tail: mean(r1tail),
    v,
    R1,
    spent,
    gens: v.length,
    trace,
  };
}

const HELD = (rows) =>
  rows.length ? rows.filter((r) => r.fate === "HELD").length / rows.length : 0;
const ANCM = (rows) => {
  const xs = rows.map((r) => r.ancRatio).filter((x) => x != null);
  return xs.length ? mean(xs) : 0;
};
const ciStr = (ci) =>
  ci
    ? `${ci.point >= 0 ? "+" : ""}${ci.point.toFixed(3)} [${ci.lo.toFixed(3)}, ${ci.hi.toFixed(3)}]`
    : "—";
const tStr = (iv) =>
  iv && Number.isFinite(iv.t[0])
    ? `${iv.mean >= 0 ? "+" : ""}${iv.mean.toFixed(3)} [${iv.t[0].toFixed(3)}, ${iv.t[1].toFixed(3)}]`
    : "—";

console.log(
  `bloom-switch — ${N_SEEDS} seeds, n=${N0}, ${GENS} generations, ` +
    `${SLICES} slices, width ${WIDTH}, d=${D_EXCL}`,
);
console.log(
  `switch times k = ${KS.join(", ")}; ` +
    (K_PRIMARY == null
      ? "no interior arm — CONTROLS ONLY, no contrast will be computed"
      : `primary contrast at k=${K_PRIMARY}`),
);

/* ------------------------------------------------------------------- the run */
/* by k, then a parallel list of seeds so every arm is paired seed-for-seed */
const byK = new Map(KS.map((k) => [k, []]));
const kept = [];
for (const s of SEEDS) {
  const runs = new Map();
  let ok = true;
  for (const k of KS) {
    const r = replicate(s, k);
    if (!r) {
      ok = false;
      break;
    }
    runs.set(k, r);
  }
  if (!ok) continue;
  kept.push(s);
  for (const k of KS) byK.get(k).push(runs.get(k));
}

const A = byK.get(GENS);
const B = byK.get(0);
console.log(`\nseeds founded in every arm: ${kept.length} / ${N_SEEDS}`);

/*
 * ⚠️ THE PER-SEED TRAJECTORIES ARE WRITTEN OUT BEFORE ANY ANALYSIS RUNS.
 * The simulation is hours; every statistic below it is milliseconds. Dumping the
 * raw per-generation `v`, `R1` and `visitsSpent` means a later question about the
 * estimator — a different window, a different null, the decay-rate form instead
 * of the level form — costs no compute and, more importantly, is answered on
 * EXACTLY the run that produced the published numbers rather than on a re-run
 * that might not reproduce. Written first so an exception in the analysis cannot
 * cost the run.
 */
try {
  const fs = require("node:fs");
  const path = process.env.BS_DUMP || "_scratch/bloom-switch-data.json";
  fs.writeFileSync(
    path,
    JSON.stringify({
      config: {
        N0,
        GENS,
        SITE_N,
        D_EXCL,
        SLICES,
        WIDTH,
        N_SEEDS,
        KS,
        K_PRIMARY,
      },
      ibmMd5: "39980f6f0a4b057572e6f9d8c573fe32",
      arms: Object.fromEntries(
        KS.map((k) => [
          k,
          byK.get(k).map((r) => ({
            seed: r.seed,
            fate: r.fate,
            ancRatio: r.ancRatio,
            v: r.v,
            R1: r.R1,
            spent: r.spent,
          })),
        ]),
      ),
    }),
  );
  console.log(`per-seed trajectories written to ${path}`);
} catch (e) {
  /* fail loud — a silently missing dump would be discovered only when it was
   * needed, which is after the run is gone */
  console.log(`⚠️ FAILED to write the per-seed dump: ${e.message}`);
}

/* ---------------------------------------------------------------- the sweep */
rule("The sweep — HELD against switch time");
console.log("     k   premium ON for   HELD   ancVar/0   R1(last 5)");
for (const k of KS) {
  const rows = byK.get(k);
  const tag = k === 0 ? " (=B, #52)" : k === GENS ? " (=A, #37)" : "";
  console.log(
    `  ${String(k).padStart(4)}   ${String(k + " gens").padStart(9)}   ` +
      `${f3(HELD(rows))}   ${f3(ANCM(rows))}   ${f3(mean(rows.map((r) => r.R1tail)))}${tag}`,
  );
}

/* ------------------------------------------------------------- the controls */
/* C1/C2 — the two ends of the sweep ARE arms A and B, produced by the same
 * switch code path. #53 measured A 0.289 and B 0.026 on this configuration.
 *
 * ⚠️⚠️ EVALUATED ON SEEDS 1..40 ONLY, WHATEVER `N_SEEDS` IS. 0.289 and 0.026 are
 * 40-seed fractions; at any other seed count the arm can reproduce #53 exactly
 * and still print a different number, so comparing a 300-seed HELD against them
 * would turn a PASSING control into a FAILING one and vice versa. The contrast
 * below uses every seed; the reproduction check uses the identical seed set #53
 * ran. Founding does not depend on the arm — `foundTwoLineages` is called from
 * the same streams before any stepping — so the kept subset here is the same
 * subset #53 kept. */
const REPRO_SEEDS = 40;
const first = (rows) => rows.filter((r) => r.seed <= REPRO_SEEDS);
const heldA = HELD(first(A));
const heldB = HELD(first(B));
const nRepro = first(A).length;
const C1 = Math.abs(heldA - 0.289) < 0.0005;
const C2 = Math.abs(heldB - 0.026) < 0.0005;

/* C5 — pre-switch identity. For g < k the switch arm has the premium ON, exactly
 * like A, from the same seeds and the same streams, so the per-generation
 * fingerprint must be IDENTICAL. If it is not, the switch is not the only thing
 * that differs between them and every gap below is measuring something else. */
let c5bad = 0,
  c5checked = 0;
for (const k of KS) {
  if (k === 0 || k === GENS) continue;
  const rows = byK.get(k);
  for (let i = 0; i < rows.length; i++) {
    const n = Math.min(k, rows[i].gens, A[i].gens);
    for (let g = 0; g < n; g++) {
      c5checked++;
      if (rows[i].trace[g] !== A[i].trace[g]) c5bad++;
    }
  }
}

/* C3 — the polymorphism is intact at the switch: the switch arm has not drifted
 * off A by generation k. Follows from C5 when C5 passes, and is reported anyway
 * because it is the quantity the design actually depends on. */
/* C4 — budget matched at the switch generation, ONE STEP on the same population.
 * Never a run total: a run total can match while every individual step differs. */
const c3 = [],
  c4 = [];
for (const k of KS) {
  if (k === 0 || k === GENS) continue;
  const rows = byK.get(k);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].gens <= k || A[i].gens <= k) continue;
    if (rows[i].R1[k] != null && A[i].R1[k] != null)
      c3.push(Math.abs(rows[i].R1[k] - A[i].R1[k]));
    const sa = A[i].spent[k],
      sk = rows[i].spent[k];
    if (sa > 0) c4.push(Math.abs(sk - sa) / sa);
  }
}
const c3max = c3.length ? Math.max(...c3) : 0;
const c4max = c4.length ? Math.max(...c4) : 0;

rule("Controls");
console.log(
  `  C1 A end (k=${GENS}) reproduces #37/#53-A HELD 0.289 : ${f3(heldA)}  ${C1 ? "PASS" : "FAIL"}  (seeds 1..${REPRO_SEEDS}, n=${nRepro})`,
);
console.log(
  `  C2 B end (k=0)  reproduces #52/#53-B HELD 0.026 : ${f3(heldB)}  ${C2 ? "PASS" : "FAIL"}  (seeds 1..${REPRO_SEEDS}, n=${nRepro})`,
);
console.log(
  `  C5 pre-switch fingerprint identical to A        : ${c5bad}/${c5checked} differing  ${c5bad === 0 ? "PASS" : "FAIL"}`,
);
console.log(
  `  C3 polymorphism intact at the switch (max |dR1|): ${f3(c3max)}  ${c3max <= 0.05 ? "PASS" : "FAIL"}`,
);
console.log(
  `  C4 budget matched at generation k (max rel diff): ${f3(c4max)}  ${c4max <= 0.02 ? "PASS" : "FLAG"}`,
);

/* ------------------------------------------------- the gaps and the contrast */
/*
 * ⚠️⚠️ THE DENOMINATOR AND THE WINDOW ARE ACROSS-SEED; THE NUMERATOR IS WITHIN
 * SEED. The first version of this used seed i's OWN A-vs-B separation for both,
 * and the 6-seed pilot showed why that is wrong: a seed in which the premium
 * happened to do little never clears `DENOM_FLOOR`, contributes no admissible
 * generations, and is DROPPED — 4 of 6 seeds went that way. That selects the
 * sample on the size of the very effect being measured, and it hands every
 * surviving seed a different averaging window, so `Δ` would be a mean over
 * windows that are not the same quantity.
 *
 * So:
 *   - the admissible window comes from the MEAN A and MEAN B trajectories, and
 *     is therefore ONE window shared by every seed and every switch arm;
 *   - the denominator is that same across-seed A→B scale, so no seed can divide
 *     by its own near-zero separation and return a ratio of noise;
 *   - the numerator stays paired WITHIN seed, `v_i(g) - v_{A,i}(g)`, which is
 *     what the paired t interval over seeds needs and what removes the
 *     seed-level variation the shared founding draws exist to remove.
 *
 * Amended into docs/2026-09-02-bloom-switch-prereg.md BEFORE the full run. The
 * pilot's Δ was +0.029 [-1.070, 1.127] — entirely uninformative — so the change
 * cannot have been steered by the answer; it was made on a coverage
 * observation, not on a result.
 */
const meanAt = (rows, field, g) => {
  const xs = [];
  for (const r of rows)
    if (r.gens > g && r[field][g] != null) xs.push(r[field][g]);
  return xs.length ? mean(xs) : null;
};

/* the shared A→B scale at each generation, computed once from the reference
 * arms alone and before any switch arm is looked at */
const SCALE = [];
for (let g = 0; g < GENS; g++) {
  const va = meanAt(A, "v", g),
    vb = meanAt(B, "v", g);
  const ra = meanAt(A, "R1", g),
    rb = meanAt(B, "R1", g);
  SCALE.push({
    dv: va != null && vb != null ? vb - va : null,
    dr: ra != null && rb != null ? rb - ra : null,
  });
}
const admissibleAt = (g) =>
  SCALE[g].dv != null &&
  SCALE[g].dr != null &&
  Math.abs(SCALE[g].dv) >= DENOM_FLOOR &&
  Math.abs(SCALE[g].dr) >= DENOM_FLOOR;

function gapsFor(k) {
  const rows = byK.get(k);
  const per = [];
  const adm = [];
  for (let g = k; g < GENS; g++) if (admissibleAt(g)) adm.push(g);

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i],
      a = A[i];
    const ag = [],
      pg = [],
      gs = [];
    /* ratio-of-sums accumulators, see the note below */
    let an = 0,
      ad = 0,
      pn = 0,
      pd = 0;
    for (const g of adm) {
      if (r.gens <= g || a.gens <= g) continue;
      if (r.v[g] == null || r.R1[g] == null) continue;
      if (a.v[g] == null || a.R1[g] == null) continue;
      ag.push((r.v[g] - a.v[g]) / SCALE[g].dv);
      pg.push((r.R1[g] - a.R1[g]) / SCALE[g].dr);
      an += r.v[g] - a.v[g];
      ad += SCALE[g].dv;
      pn += r.R1[g] - a.R1[g];
      pd += SCALE[g].dr;
      gs.push(g);
    }
    if (gs.length < MIN_ADMISSIBLE) continue;
    per.push({
      seed: r.seed,
      gens: gs,
      ancGap: mean(ag),
      polyGap: mean(pg),
      delta: mean(ag) - mean(pg),
      /*
       * ⚠️ RATIO OF SUMS, not mean of ratios. Same estimand — how far along the
       * A→B path the arm has travelled across the window — but the per-
       * generation ratio explodes wherever `SCALE[g]` sits just above
       * `DENOM_FLOOR`, and those generations then dominate the variance of a
       * plain average. Summing numerator and denominator separately weights
       * each generation by how much A→B separation it actually carries.
       */
      ancGapW: ad !== 0 ? an / ad : null,
      polyGapW: pd !== 0 ? pn / pd : null,
      deltaW: ad !== 0 && pd !== 0 ? an / ad - pn / pd : null,
      /* the FIRST admissible post-switch generation, for G2 */
      firstPoly: pg[0],
      firstGen: gs[0],
      lastPoly: mean(pg.slice(-5)),
    });
  }
  return { per, adm };
}

/* controls-only mode (`BS_KS=0,35`) has no interior switch arm, so there is no
 * contrast to compute — the gates then read FAIL and the verdict says so
 * explicitly rather than reporting an empty statistic as a finding. */
const primary = K_PRIMARY == null ? { per: [], adm: [] } : gapsFor(K_PRIMARY);
const nAdm = primary.adm ? primary.adm.length : 0;

/* ⚠️ G2 is evaluated at the FIRST ADMISSIBLE post-switch generation, not
 * literally at k+1. At k+1 the A-vs-B separation has not opened yet, so
 * polyGap(k+1) is a ratio of two numbers near zero — it would report whatever
 * the noise happened to do and the gate would not be measuring relaxation
 * speed. Registered as an amendment to the prereg BEFORE this ran; the raw
 * k+1 value is printed beside it so the substitution is visible. */
const g1 = primary.per.length
  ? mean(primary.per.map((p) => p.lastPoly)) >= 0.5
  : false;
const firstPolyMean = primary.per.length
  ? mean(primary.per.map((p) => p.firstPoly))
  : 0;
const g2 = primary.per.length ? firstPolyMean <= 0.5 : false;
const g3 = nAdm >= MIN_ADMISSIBLE && primary.per.length >= 2;
const INERT = !(g1 && g2 && g3);

rule(
  K_PRIMARY == null
    ? "The contrast — NOT RUN (controls-only arm selection)"
    : `The contrast at k=${K_PRIMARY}`,
);
console.log(
  `  admissible post-switch generations: ${nAdm}` +
    (nAdm ? ` (${primary.adm[0]}..${primary.adm[nAdm - 1]})` : "") +
    `, seeds contributing: ${primary.per.length}`,
);
console.log(
  `  mean ancGap  (0 = still arm A, 1 = arrived at arm B): ${f3(mean(primary.per.map((p) => p.ancGap)))}`,
);
console.log(
  `  mean polyGap (0 = still arm A, 1 = arrived at arm B): ${f3(mean(primary.per.map((p) => p.polyGap)))}`,
);

console.log(
  `  weighted ancGap / polyGap (ratio of sums)           : ` +
    `${f3(mean(primary.per.map((p) => p.ancGapW)))} / ${f3(mean(primary.per.map((p) => p.polyGapW)))}`,
);

/*
 * ⚠️⚠️ THE NULL THE `Δ ≈ 0` READING NEEDS, AND WOULD OTHERWISE NOT HAVE.
 *
 * Ancestry variance is a STOCK — it accumulates and decays and cannot jump —
 * while `R1` is recomputed from scratch out of each generation's bloom multiset.
 * They therefore have different intrinsic inertia REGARDLESS of any causal link
 * between them, and both are being dragged along by the same common trend as the
 * run proceeds. That is enough to produce co-movement, and co-movement is
 * exactly what the THROUGH-THE-POLYMORPHISM branch reads as support. Without a
 * null, that branch is a control that cannot fail — the same defect that made
 * #53's C2 structurally blind, arriving by a different route.
 *
 * So `Δ` is recomputed with the pairing DELIBERATELY BROKEN: seed i's `ancGap`
 * against seed σ(i)'s `polyGap`, σ a fixed cyclic shift. Everything shared —
 * the window, the A→B scale, the generation trend, the inertia asymmetry —
 * survives the shuffle. Only the seed-specific coupling does not.
 *
 * If the real `Δ` sits inside the shuffled `Δ`'s interval, then whatever
 * co-movement the run shows is the common trend and not a coupling, and NO
 * two-step reading may be taken from it. Registered before the run.
 */
const perm = primary.per.map((p, i) => ({
  delta: p.ancGap - primary.per[(i + 1) % primary.per.length].polyGap,
}));
const ivPerm =
  primary.per.length >= 3 ? interval(perm.map((p) => p.delta)) : null;

/*
 * ⚠️ THE PRE-REGISTERED FORM IS PRIMARY; ratio-of-sums is a reported robustness
 * check that the verdict does NOT read. It was added expecting it to cut the
 * variance — generations where `SCALE[g]` sits just above `DENOM_FLOOR` should
 * have made a plain mean of ratios explode — and on the 6-seed pilot it did
 * not: ±1.230 against ±1.185. The hypothesis was wrong. The spread is genuine
 * seed-to-seed variation in how far each seed travels, so there is no
 * evidence-based reason to depart from the registered statistic, and departing
 * from it on theory alone after seeing pilot output is exactly the move this
 * project pre-registers to prevent. Kept and printed because a robustness
 * check that DISAGREED would matter.
 */
const deltas = primary.per.map((p) => p.delta);
const iv = deltas.length >= 2 ? interval(deltas) : null;
const deltasW = primary.per.map((p) => p.deltaW).filter((x) => x != null);
const ivW = deltasW.length >= 2 ? interval(deltasW) : null;
console.log(`  Δ  PRIMARY (registered), paired t over seeds  : ${tStr(iv)}`);
console.log(`  Δ  ratio-of-sums robustness check (not used) : ${tStr(ivW)}`);
console.log(`  Δ  SEED-SHUFFLED NULL (pairing broken)       : ${tStr(ivPerm)}`);
/*
 * ⚠️⚠️ THE COUPLING SHOWS UP IN THE VARIANCE, NOT THE MEAN — comparing the two
 * means would be the wrong test and would pass on uncoupled data. If `ancGap`
 * and `polyGap` genuinely track each other WITHIN a seed, their difference is
 * tighter than it is once the pairing is broken; if both are simply riding the
 * same common trend, breaking the pairing costs nothing and the two spreads
 * match. So the statistic is the ratio of spreads.
 *
 * `sdRatio ≈ 1` ⇒ no seed-specific coupling ⇒ "ancestry and the polymorphism
 * move together" is a statement about the shared time trend and NOT about a
 * relationship between them, and the two-step reading cannot rest on it.
 */
const sdRatio = iv && ivPerm && ivPerm.sd > 0 ? iv.sd / ivPerm.sd : null;
const coupled = sdRatio != null && sdRatio <= 0.8;
console.log(
  `  spread ratio sd(real)/sd(shuffled)           : ` +
    `${sdRatio == null ? "     - " : f3(sdRatio)}  ${coupled ? "COUPLED" : "NOT DISTINGUISHABLE FROM THE COMMON TREND"}`,
);
if (iv && iv.n > 2 && Number.isFinite(iv.sd)) {
  /* ⚠️ REPORTED ALWAYS, not only when the run comes out inconclusive — a power
   * statement produced only on the branch where it excuses the outcome is not
   * a power statement. */
  const need = Math.ceil((iv.sd / (DIRECT_BAND / 2.0)) ** 2);
  console.log(
    `  per-seed sd ${iv.sd.toFixed(3)}, half-width ${(iv.t[1] - iv.mean).toFixed(3)} ` +
      `against the ${DIRECT_BAND} band ⇒ n≈${need} seeds would be needed`,
  );
}

rule("Gates — is the design able to answer at all?");
console.log(
  `  G1 the polymorphism DOES relax   (mean last-5 polyGap >= 0.5): ${f3(mean(primary.per.map((p) => p.lastPoly)))}  ${g1 ? "PASS" : "FAIL"}`,
);
console.log(
  `  G2 it does NOT relax instantly   (polyGap at first admissible gen <= 0.5): ${f3(firstPolyMean)}  ${g2 ? "PASS" : "FAIL"}`,
);
console.log(
  `  G3 enough admissible generations (>= ${MIN_ADMISSIBLE}): ${nAdm}  ${g3 ? "PASS" : "FAIL"}`,
);

/* --------------------------------------------------------------- the verdict */
rule("VERDICT");
const controlsOk = C1 && C2 && c5bad === 0 && c3max <= 0.05;
if (K_PRIMARY == null) {
  console.log(
    "  CONTROLS ONLY — no interior switch arm was run, so there is no contrast and\n" +
      `  no verdict. The controls above are the whole output: C1 ${C1 ? "PASS" : "FAIL"}, C2 ${C2 ? "PASS" : "FAIL"}.`,
  );
} else if (!controlsOk) {
  console.log(
    "  NO RESULT — a control failed. A/B must reproduce #53 to the printed digit\n" +
      "  and the pre-switch trajectory must be identical to A, or the switch is not\n" +
      "  the only difference between the arms.",
  );
} else if (INERT) {
  console.log(
    "  NO VERDICT — the design cannot resolve the two hypotheses.\n" +
      (!g1
        ? "  The polymorphism does not relax after the switch, so there is nothing for\n" +
          "  ancestry to track and Δ measures ancGap alone.\n"
        : "") +
      (!g2
        ? "  The polymorphism relaxes essentially immediately, so BOTH hypotheses predict\n" +
          "  Δ ≈ 0 and the contrast has not chosen between them. The two timescales this\n" +
          "  design compares are not separable in this model.\n"
        : "") +
      (!g3
        ? "  Too few generations where A and B are far enough apart for the gaps to be\n" +
          "  anything but a ratio of noise.\n"
        : "") +
      "  #52's mechanism paragraph again stands neither confirmed nor refuted.",
  );
} else if (iv.t[0] > DIRECT_BAND) {
  console.log(
    `  DIRECT — Δ's 95% interval lies entirely above +${DIRECT_BAND}. Ancestry moves\n` +
      "  toward arm B ahead of the polymorphism, so the premium acts per generation\n" +
      "  and NOT only through the variation it maintains. #52's mechanism paragraph\n" +
      "  is FALSIFIED.",
  );
} else if (iv.t[1] < DIRECT_BAND && iv.t[0] <= 0) {
  console.log(
    `  THROUGH THE POLYMORPHISM — Δ's 95% interval lies below +${DIRECT_BAND} and\n` +
      "  includes zero or less. Ancestry and the polymorphism relax on the same\n" +
      "  timescale. CONSISTENT WITH #52's two-step, and no more than that: co-movement\n" +
      "  is exactly what #52 already had, and #53 was built to break it apart.",
  );
  if (!coupled)
    console.log(
      "\n  ⚠️⚠️ BUT THE COUPLING NULL IS NOT BEATEN. Breaking the seed pairing costs\n" +
        `  nothing (spread ratio ${sdRatio == null ? "—" : sdRatio.toFixed(3)}), so ancestry and the polymorphism are\n` +
        "  NOT shown to track each other within a seed — they are both riding the same\n" +
        "  common trend after the switch. Ancestry variance is a stock and R1 is\n" +
        "  recomputed each generation, so they relax at different intrinsic rates with\n" +
        "  or without any causal link between them. ON THIS OUTPUT THE TWO-STEP READING\n" +
        "  IS NOT SUPPORTED, and the branch above must be reported as a timescale\n" +
        "  coincidence rather than as evidence for #52.",
    );
} else {
  console.log(
    `  INCONCLUSIVE — Δ's interval straddles the +${DIRECT_BAND} band. The sweep below\n` +
      "  is not a substitute: it cannot recover the shift it would have to measure.",
  );
}

/* --------------------------------------------- the sweep, per switch time */
rule("Δ by switch time (supporting only — see the prereg)");
console.log("     k   seeds   ancGap   polyGap        Δ (95% t)");
for (const k of KS) {
  if (k === 0 || k === GENS) continue;
  const gp = gapsFor(k);
  const d = gp.per.map((p) => p.delta);
  const ivk = d.length >= 2 ? interval(d) : null;
  console.log(
    `  ${String(k).padStart(4)}   ${String(gp.per.length).padStart(5)}   ` +
      `${f3(mean(gp.per.map((p) => p.ancGapW)))}   ${f3(mean(gp.per.map((p) => p.polyGapW)))}   ${tStr(ivk)}`,
  );
}

/* HELD against A and B, so the sweep has an interval and not just a point */
rule("HELD vs the two ends, paired over seeds");
for (const k of KS) {
  if (k === 0 || k === GENS) continue;
  const rows = byK.get(k);
  console.log(
    `  k=${String(k).padStart(2)}  vs A: ${ciStr(pairedCI(rows, A, HELD))}   vs B: ${ciStr(pairedCI(rows, B, HELD))}`,
  );
}
