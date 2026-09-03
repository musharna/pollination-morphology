/*
 * #55 — IS THE PER-SLICE PREMIUM A RARE-LINEAGE ADVANTAGE?
 *
 * Registered in docs/2026-09-02-rare-advantage-prereg.md before this ran.
 *
 * WHY THIS AND NOT THE PULSE THAT #55 WAS FILED AS. On the instrumented build,
 * only 2 of 39,900 matings in arm A joined parents that differed in ancestry.
 * The tracer is a two-valued LINEAGE LABEL in this configuration, so ancestry
 * variance is p(1-p) and it falls by EXCLUSION of a lineage, never by blending.
 * "Assortment retains ancestry" therefore cannot be the third link of the
 * two-step: there is no cross-lineage mating for assortment to act against. What
 * the premium must be doing is stopping the minority lineage from being lost —
 * which is a per-generation SELECTIVE FORCE, and a force can be measured rather
 * than inferred from the shape of a trajectory. Six attempts across #53, #54 and
 * this task's pre-flight tried to infer it from shape; every one failed on its
 * own control.
 *
 * THE MECHANISM UNDER TEST. displayProportionalVisits=false gives every occupied
 * slice a flat budget regardless of display. A minority lineage holds less
 * display, so under proportional allocation it draws proportionally fewer
 * visits; under the flat budget its slice draws a FULL budget split among fewer
 * plants, so its PER-CAPITA rate rises as it gets rarer. That is negative
 * frequency dependence.
 *
 *   RA_SEEDS=40 node experiments/rare-advantage.js
 *   RA_DUMP=_scratch/ra-data.json  to archive the per-generation rows
 */
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const { interval } = require("../sim/paired-stats.js");
const fs = require("node:fs");

const N0 = 30,
  GENS = 35,
  SITE_N = 160,
  D_EXCL = 8,
  SLICES = 8,
  WIDTH = 0.12;
const N_SEEDS = Number(process.env.RA_SEEDS || 40);
const DUMP = process.env.RA_DUMP || null;
/* C1/C2 are 40-seed fractions and MUST be read on seeds 1..40 whatever N_SEEDS
 * is — #54 amendment A5. At 272 seeds the same arms read 0.246/0.007, so
 * comparing at full n would fail on correct code. */
const REPRO_SEEDS = 40;

const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
function corr(a, b) {
  const n = a.length;
  if (n < 3) return null;
  const ma = mean(a),
    mb = mean(b);
  let sab = 0,
    saa = 0,
    sbb = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma,
      y = b[i] - mb;
    sab += x * y;
    saa += x * x;
    sbb += y * y;
  }
  return saa > 0 && sbb > 0 ? sab / Math.sqrt(saa * sbb) : null;
}

/* Lineage label. Founders carry anc 0 or 1; anything strictly between is a
 * hybrid and is COUNTED SEPARATELY rather than rounded into a lineage, so the
 * rarity of blending stays visible instead of being absorbed. */
function label(x) {
  const a = x.anc || 0;
  if (a === 0) return 0;
  if (a === 1) return 1;
  return -1;
}

/* Total-variation distance between the two lineages' distributions over bloom
 * slices, using the model's OWN in-flower predicate rather than a bin index.
 * 0 = the lineages flower alike; 1 = they occupy disjoint slices. */
function segregation(blooms, labels) {
  const c = [];
  for (let s = 0; s < SLICES; s++) c.push([0, 0]);
  let t0 = 0,
    t1 = 0;
  for (let s = 0; s < SLICES; s++) {
    const t = (s + 0.5) / SLICES;
    for (let i = 0; i < blooms.length; i++) {
      const L = labels[i];
      if (L < 0) continue;
      if (I.ringDist(blooms[i], t) <= WIDTH / 2) {
        c[s][L]++;
        if (L === 0) t0++;
        else t1++;
      }
    }
  }
  if (!t0 || !t1) return null;
  let tv = 0;
  for (let s = 0; s < SLICES; s++) tv += Math.abs(c[s][0] / t0 - c[s][1] / t1);
  return tv / 2;
}

function replicate(seed, arm) {
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const brng = I.bloomRng(seed);
  const phen = { slices: SLICES, width: WIDTH };
  const opts = { ...I.DEFAULTS, siteN: SITE_N, phenology: phen };
  if (arm === "RM") opts.randomMating = true;
  /* the realized parentage, so gene flow between lineages is COUNTED rather than
   * inferred from how the tracer moved */
  opts.logMatings = true;
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  if (!built) return null;

  let pop = built.pop;
  const ancVar0 = I.ancestryVar(pop);
  const rows = [];
  let extinct = false,
    hybridsEverSeen = 0;

  for (let g = 0; g < GENS; g++) {
    if (pop.length < 2) {
      extinct = true;
      break;
    }
    /* THE ONLY LINE THAT DIFFERS BETWEEN A AND B. false = flat per-slice budget
     * = the premium; true apportions by display and removes it. */
    phen.displayProportionalVisits = arm === "B";

    const labels = pop.map(label);
    let n0 = 0,
      n1 = 0,
      nh = 0;
    for (const L of labels) {
      if (L === 0) n0++;
      else if (L === 1) n1++;
      else nh++;
    }
    hybridsEverSeen += nh;

    const res = I.step(pop, opts, rng, g, srng, brng);

    /* GENE FLOW, counted. A mating whose parents carry different lineage labels
     * is a cross; a mating involving a hybrid is excluded from the denominator
     * rather than assigned to a side. */
    let crossed = 0,
      pure = 0,
      ancDiff = 0;
    for (const m of res.matings || []) {
      /* ⚠️ TWO DEFINITIONS, BOTH REPORTED, because they diverge the moment a
       * hybrid exists and quoting one against the other would be a silent
       * mismatch. `crossed` is a true founding-lineage cross: both parents pure
       * and on opposite sides. `ancDiff` is the looser "parents differ in anc at
       * all", which also counts hybrid x pure. */
      if ((pop[m.m].anc || 0) !== (pop[m.f].anc || 0)) ancDiff++;
      const a = labels[m.m],
        b = labels[m.f];
      if (a < 0 || b < 0) continue;
      if (a === b) pure++;
      else crossed++;
    }

    /* THE DIRECT SIGNATURE OF THE FLAT BUDGET, needing no lineages at all: under
     * a flat per-slice budget the visits in a slice are shared among whoever
     * flowers there, so a plant in a CROWDED slice should collect fewer visits
     * than one in an empty slice; under proportional allocation there is no such
     * relation. Correlation across plants, within a generation, between a
     * plant's visits and how many plants it co-flowers with. */
    let crowdCorr = null;
    if (res.visitsTo && res.blooms) {
      const co = [],
        vis = [];
      for (let i = 0; i < res.blooms.length; i++) {
        let c = 0;
        for (let j = 0; j < res.blooms.length; j++)
          if (j !== i && I.ringDist(res.blooms[i], res.blooms[j]) <= WIDTH) c++;
        co.push(c);
        vis.push(res.visitsTo[i]);
      }
      crowdCorr = corr(co, vis);
    }

    /* one lineage already gone: there is no minority to advantage, and the
     * generation carries no information about the mechanism. Recorded so the
     * count is visible, but excluded from every statistic below. */
    const informative = n0 > 0 && n1 > 0;
    let r = null,
      w = null,
      p = null,
      S = null;
    if (informative) {
      const minor = n0 < n1 ? 0 : 1;
      const nMin = minor === 0 ? n0 : n1;
      const nMaj = minor === 0 ? n1 : n0;
      p = nMin / (nMin + nMaj);

      /* per-capita visits, indexed against the PRE-step population */
      let vMin = 0,
        vMaj = 0;
      if (res.visitsTo) {
        for (let i = 0; i < labels.length; i++) {
          if (labels[i] < 0) continue;
          if (labels[i] === minor) vMin += res.visitsTo[i];
          else vMaj += res.visitsTo[i];
        }
        const pcMin = vMin / nMin,
          pcMaj = vMaj / nMaj;
        r = pcMaj > 0 ? pcMin / pcMaj : null;
      }

      /* per-capita REALISED offspring — the selection coefficient itself */
      let o0 = 0,
        o1 = 0;
      for (const c of res.pop) {
        const L = label(c);
        if (L === 0) o0++;
        else if (L === 1) o1++;
      }
      const oMin = minor === 0 ? o0 : o1;
      const oMaj = minor === 0 ? o1 : o0;
      const wMin = oMin / nMin,
        wMaj = oMaj / nMaj;
      w = wMaj > 0 ? wMin / wMaj : null;

      /* blooms describe the PARENTS (sim/ibm.js:1168), so they align with
       * `labels`, which were taken before the step. See the alignment note in
       * the pre-registration. */
      S = res.blooms ? segregation(res.blooms, labels) : null;
    }

    rows.push({
      g,
      n0,
      n1,
      nh,
      informative,
      p,
      r,
      w,
      S,
      crossed,
      pure,
      ancDiff,
      crowdCorr,
      spent: res.visitsSpent,
    });
    pop = res.pop;
  }

  return {
    seed,
    arm,
    rows,
    hybridsEverSeen,
    fate: I.fateOf(pop, ancVar0, extinct),
    vEnd: ancVar0 > 0 ? I.ancestryVar(pop) / ancVar0 : null,
  };
}

/* ---------------------------------------------------------------- run arms
 * ⚠️ THE ANALYSIS IS SEPARABLE FROM THE SIMULATION. RA_FROM=<dump> re-reports
 * from an existing dump instead of re-simulating, using THIS FILE's own
 * statistics — not a second copy of them, which is how #43 ended up with two
 * implementations of one predicate disagreeing in silence. It exists because a
 * 40-minute run that is killed near its timeout would otherwise be unanalysable
 * even though the per-arm dump on disk is complete for the arms that finished.
 */
const ARMS = ["A", "B", "RM"];
const out = {};
const FROM = process.env.RA_FROM || null;
if (FROM) {
  const loaded = JSON.parse(fs.readFileSync(FROM, "utf8"));
  for (const arm of ARMS) out[arm] = loaded.arms[arm] || [];
  process.stderr.write(
    `re-reporting from ${FROM}: ` +
      ARMS.map((a) => `${a}=${out[a].length} seeds`).join(", ") +
      `\n`,
  );
}
for (const arm of FROM ? [] : ARMS) {
  out[arm] = [];
  for (let s = 1; s <= N_SEEDS; s++) {
    const rep = replicate(s, arm);
    if (rep) out[arm].push(rep);
    /* ⚠️ PROGRESS ON STDERR, AND THE DUMP WRITTEN PER ARM. A 40-seed run is ~44
     * minutes and the first version printed nothing until every arm was done, so
     * when it was killed at its timeout it left an empty log and no dump — three
     * quarters of an hour of compute with nothing to show. Progress goes to
     * stderr so it never mixes into the report on stdout. */
    process.stderr.write(
      `  [${arm}] seed ${s}/${N_SEEDS} founded=${out[arm].length}\n`,
    );
  }
  if (DUMP) {
    fs.writeFileSync(
      DUMP,
      JSON.stringify({
        config: { N0, GENS, SITE_N, D_EXCL, SLICES, WIDTH, N_SEEDS },
        arms: out,
      }),
    );
    process.stderr.write(`  [${arm}] arm complete, dump updated: ${DUMP}\n`);
  }
}

/* ------------------------------------------------------------- the primary
 * ONE BOUNDED NUMBER PER SEED: the proportion of that seed's informative
 * generations in which the minority lineage out-reproduced the majority per
 * capita. In [0,1] by construction — no denominator that can blow up, no tail,
 * and no seed dropped on the strength of its own outcome. */
function primary(rep) {
  let n = 0,
    hit = 0;
  for (const row of rep.rows) {
    if (!row.informative || row.w == null) continue;
    n++;
    if (row.w > 1) hit++;
  }
  return n >= 3 ? { p: hit / n, n } : null;
}

function armPrimary(arm) {
  const ps = [];
  for (const rep of out[arm]) {
    const q = primary(rep);
    if (q) ps.push(q.p);
  }
  return { ps, iv: ps.length >= 2 ? interval(ps) : null };
}

const HELD = (reps) => {
  const r = reps.filter((x) => x.seed <= REPRO_SEEDS);
  return r.length ? r.filter((x) => x.fate === "HELD").length / r.length : null;
};

/* ⚠️ the header reports what was ACTUALLY analysed, not what was requested. When
 * re-reporting from a partial dump these differ, and a header claiming 40 seeds
 * over 2 seeds of data is the kind of mislabelling that outlives the run. */
console.log(
  `\n#55 rare-advantage — ${GENS} generations, founded seeds per arm: ` +
    ARMS.map((a) => `${a}=${out[a].length}`).join(" ") +
    (FROM ? `  (re-reported from ${FROM})` : ` of ${N_SEEDS} requested`),
);
console.log(
  `arms: A premium ON, B premium OFF, RM premium ON + randomMating\n`,
);

/* ------------------------------------------------------------- the controls */
const heldA = HELD(out.A),
  heldB = HELD(out.B);
const C1 = heldA != null && Math.abs(heldA - 0.289) < 0.0005;
const C2 = heldB != null && Math.abs(heldB - 0.026) < 0.0005;
/* ⚠️ PER ARM, NEVER POOLED. Random mating dissolves the lineages outright, so a
 * pooled hybrid count is dominated by the RM arm and hides the 400-fold
 * difference between A and B that is the point. */
const flow = {};
for (const arm of ARMS) {
  let crossed = 0,
    pure = 0,
    ancDiff = 0,
    hybrids = 0,
    plantGens = 0;
  for (const rep of out[arm]) {
    hybrids += rep.hybridsEverSeen;
    for (const row of rep.rows) {
      crossed += row.crossed;
      pure += row.pure;
      ancDiff += row.ancDiff;
      plantGens += row.n0 + row.n1 + row.nh;
    }
  }
  flow[arm] = { crossed, pure, ancDiff, hybrids, plantGens };
}
/* C4: the arms must differ in how the budget is ALLOCATED, not in its size.
 * Compared as ONE STEP at each generation, never as a run total. */
let c4worst = 0;
for (let g = 0; g < GENS; g++) {
  const a = mean(
    out.A.map((r) => (r.rows[g] ? r.rows[g].spent : null)).filter(
      (x) => x != null,
    ),
  );
  const b = mean(
    out.B.map((r) => (r.rows[g] ? r.rows[g].spent : null)).filter(
      (x) => x != null,
    ),
  );
  if (a != null && b != null) c4worst = Math.max(c4worst, Math.abs(a - b));
}
/* C5: every offspring is labelled; the counts must exhaust the population. */
let c5 = true;
for (const arm of ARMS)
  for (const rep of out[arm])
    for (const row of rep.rows) if (row.n0 + row.n1 + row.nh !== N0) c5 = false;

console.log("controls");
console.log(
  `  C1 arm A HELD on seeds 1..${REPRO_SEEDS} = ${heldA != null ? heldA.toFixed(3) : "—"} vs 0.289   ${C1 ? "PASS" : "FAIL"}`,
);
console.log(
  `  C2 arm B HELD on seeds 1..${REPRO_SEEDS} = ${heldB != null ? heldB.toFixed(3) : "—"} vs 0.026   ${C2 ? "PASS" : "FAIL"}`,
);
/* ⚠️ C4 IS REPORTED, NOT ASSERTED, AND THE LEVELS COME WITH IT. The flat budget
 * spends a full allowance on every OCCUPIED slice, so the arms are not expected
 * to spend the same total — and if they do not, part of any difference between
 * them is budget SIZE rather than budget ALLOCATION. That is a limitation of the
 * contrast and is stated as one instead of being asserted away. */
const spentA = mean(
  out.A.flatMap((r) => r.rows.map((x) => x.spent)).filter((x) => x != null),
);
const spentB = mean(
  out.B.flatMap((r) => r.rows.map((x) => x.spent)).filter((x) => x != null),
);
console.log(
  `  C4 visits spent per generation: A ${spentA != null ? spentA.toFixed(0) : "—"}  ` +
    `B ${spentB != null ? spentB.toFixed(0) : "—"}  ` +
    `(largest per-generation gap ${c4worst.toFixed(0)}; ratio ` +
    `${spentA && spentB ? (spentA / spentB).toFixed(3) : "—"})`,
);
console.log(
  `  C5 lineage counts exhaust the population: ${c5 ? "PASS" : "FAIL"}`,
);

console.log("\ngene flow between the lineages, per arm");
console.log(
  "  arm   lineage crosses   pure    cross rate   parents' anc differ   hybrid plant-gens",
);
for (const arm of ARMS) {
  const f = flow[arm];
  const rate = f.crossed + f.pure > 0 ? f.crossed / (f.crossed + f.pure) : null;
  console.log(
    `  ${arm.padEnd(4)}  ${String(f.crossed).padStart(9)}  ${String(f.pure).padStart(9)}  ` +
      `${(rate != null ? (100 * rate).toFixed(3) + "%" : "—").padStart(9)}  ` +
      `${String(f.ancDiff).padStart(14)}       ${f.hybrids}/${f.plantGens}`,
  );
}

/* C3, the direct signature of the flat budget, and it needs no lineages: does a
 * plant in a crowded slice collect fewer visits? Negative under the premium,
 * ~0 without it. This is the control the randomMating arm could not be, because
 * random mating dissolves the lineages and leaves no minority to measure. */
console.log(
  "\nC3 — visits vs slice crowding (corr across plants, per generation)",
);
for (const arm of ARMS) {
  const xs = [];
  for (const rep of out[arm])
    for (const row of rep.rows)
      if (row.crowdCorr != null) xs.push(row.crowdCorr);
  const m = mean(xs);
  console.log(
    `  ${arm.padEnd(4)} mean corr(co-flowering count, visits) = ${m != null ? m.toFixed(3) : "—"}  (n=${xs.length} generations)`,
  );
}

/* ------------------------------------------------------- Q1 does it exist? */
console.log("\nQ1 — does the minority out-reproduce the majority per capita?");
const prim = {};
for (const arm of ARMS) {
  prim[arm] = armPrimary(arm);
  const iv = prim[arm].iv;
  console.log(
    `  ${arm.padEnd(2)}  primary ${iv ? iv.mean.toFixed(3) : "—"} ` +
      `[${iv ? iv.t[0].toFixed(3) : "—"}, ${iv ? iv.t[1].toFixed(3) : "—"}]  (n=${prim[arm].ps.length} seeds)`,
  );
}
/* C6: the statistic must be able to tell arm A from arm B at all. Registered
 * because its predecessor scored 0.746 vs 0.687 and carried nothing. */
const sep = prim.A.iv && prim.B.iv ? prim.A.iv.mean - prim.B.iv.mean : null;
const pooledSd =
  prim.A.iv && prim.B.iv
    ? Math.sqrt((prim.A.iv.sd ** 2 + prim.B.iv.sd ** 2) / 2)
    : null;
const C6 = sep != null && pooledSd > 0 && Math.abs(sep / pooledSd) >= 0.5;
console.log(
  `  C6 endpoint separation ${sep != null ? sep.toFixed(3) : "—"}, pooled sd ` +
    `${pooledSd != null ? pooledSd.toFixed(3) : "—"}, d=${sep != null && pooledSd ? (sep / pooledSd).toFixed(2) : "—"}  ${C6 ? "PASS" : "FAIL — statistic cannot separate the arms; no verdict"}`,
);

/* ------------------------------------------ per-capita visit ratio by rarity */
console.log(
  "\n  per-capita visit ratio r (minority/majority), binned by minority frequency",
);
console.log("    p bin      arm A            arm B            arm RM");
const BINS = [
  [0.0, 0.1],
  [0.1, 0.2],
  [0.2, 0.3],
  [0.3, 0.4],
  [0.4, 0.5],
];
for (const [lo, hi] of BINS) {
  const cell = (arm) => {
    const xs = [];
    for (const rep of out[arm])
      for (const row of rep.rows)
        if (row.informative && row.r != null && row.p >= lo && row.p < hi)
          xs.push(row.r);
    const m = mean(xs);
    return m == null
      ? "     —      "
      : `${m.toFixed(3)} (n=${String(xs.length).padStart(4)})`;
  };
  console.log(
    `    ${lo.toFixed(1)}-${hi.toFixed(1)}  ${cell("A")}  ${cell("B")}  ${cell("RM")}`,
  );
}

/* The same binning on realised FITNESS rather than visits. Printed beside the
 * visit table because the gap between them is the finding: visits can favour the
 * rare lineage while offspring do not follow it. */
console.log(
  "\n  realised per-capita fitness ratio w (minority/majority), binned by minority frequency",
);
console.log("    p bin      arm A            arm B            arm RM");
for (const [lo, hi] of BINS) {
  const cell = (arm) => {
    const xs = [];
    for (const rep of out[arm])
      for (const row of rep.rows)
        if (row.informative && row.w != null && row.p >= lo && row.p < hi)
          xs.push(row.w);
    const m = mean(xs);
    return m == null
      ? "     —      "
      : `${m.toFixed(3)} (n=${String(xs.length).padStart(4)})`;
  };
  console.log(
    `    ${lo.toFixed(1)}-${hi.toFixed(1)}  ${cell("A")}  ${cell("B")}  ${cell("RM")}`,
  );
}

/* ------------------------------------------------------- Q2 is it mediated? */
console.log(
  "\nQ2 — within arm A only: is the advantage concentrated where the",
);
console.log(
  "     lineages flower apart? (H1 mediated: rises with S. H2 direct: flat.)",
);
console.log("     S bin        mean r-1        n");
const SB = [
  [0.0, 0.25],
  [0.25, 0.5],
  [0.5, 0.75],
  [0.75, 1.01],
];
for (const [lo, hi] of SB) {
  const xs = [];
  for (const rep of out.A)
    for (const row of rep.rows)
      if (
        row.informative &&
        row.r != null &&
        row.S != null &&
        row.S >= lo &&
        row.S < hi
      )
        xs.push(row.r - 1);
  const m = mean(xs);
  console.log(
    `     ${lo.toFixed(2)}-${hi.toFixed(2)}    ${m == null ? "   —   " : m.toFixed(4).padStart(7)}      ${xs.length}`,
  );
}

/* ----------------------------------------------------- Q3 is it sufficient?
 * A two-type Wright-Fisher on N=30 driven by the MEASURED w(p), with no free
 * parameters, must reproduce HELD. Anything else means the per-generation
 * advantage does not account for the outcome. */
/*
 * ⚠️ IT REFUSES RATHER THAN FALLING BACK. The first version binned p in 0.02
 * steps, needed 5 observations a bin, and substituted w = 1 wherever it had
 * none. At 6 seeds arm B populated NO bin, so every bin became 1 and Q3 silently
 * ran a NEUTRAL model — then reported "the measured advantage does not account
 * for the outcome" about a model that contained no measured advantage at all. A
 * fallback that turns an unestimable quantity into a plausible number is worse
 * than an error, because the output still looks like a result.
 */
const W_BINS = 10; /* over p in [0, 0.5] */
const W_MIN_PER_BIN = 5;
const W_MIN_BINS = 6;
function measuredW(arm) {
  const grid = [];
  let filled = 0;
  for (let b = 0; b < W_BINS; b++) {
    const lo = (b * 0.5) / W_BINS,
      hi = ((b + 1) * 0.5) / W_BINS;
    const xs = [];
    for (const rep of out[arm])
      for (const row of rep.rows)
        if (row.informative && row.w != null && row.p >= lo && row.p < hi)
          xs.push(row.w);
    const ok = xs.length >= W_MIN_PER_BIN;
    if (ok) filled++;
    grid.push(ok ? mean(xs) : null);
  }
  if (filled < W_MIN_BINS) return { grid: null, filled };
  /* carry the nearest MEASURED bin outward. Never a constant. */
  for (let b = 0; b < grid.length; b++)
    if (grid[b] == null) {
      let best = null,
        bd = 1e9;
      for (let c = 0; c < grid.length; c++)
        if (grid[c] != null && Math.abs(c - b) < bd) {
          bd = Math.abs(c - b);
          best = grid[c];
        }
      grid[b] = best;
    }
  return { grid, filled };
}
/*
 * ⚠️ Ne IS MEASURED, NOT ASSUMED TO BE N. A first version of this sampled N0=30
 * offspring binomially and predicted HELD 0.73 for arm B where the truth is
 * 0.026 — because a handful of plants sire most of a generation, so the drift in
 * the real process is far stronger than binomial sampling at N=30. Ne is taken
 * from the observed spread of the one-generation frequency change, which is a
 * WITHIN-run quantity and is not the HELD outcome being predicted:
 *
 *     Var(dp | p) = p(1-p) / Ne     =>     Ne = mean over generations of
 *                                          p(1-p) / (dp)^2
 */
function measuredNe(arm) {
  const xs = [];
  for (const rep of out[arm])
    for (let k = 0; k + 1 < rep.rows.length; k++) {
      const a = rep.rows[k],
        b = rep.rows[k + 1];
      /* ⚠️ ONLY THE STARTING generation must have both lineages. Requiring the
       * NEXT one too would drop every transition that ENDS in a lineage being
       * lost — the largest jumps there are — which selects the sample on the
       * outcome and inflates Ne. A first version did exactly that and put Ne at
       * 20.8 against a census of 30, predicting arm B would usually persist when
       * it never does. */
      if (!a.informative) continue;
      if (b.n0 + b.n1 === 0) continue;
      const pa = a.n0 / (a.n0 + a.n1),
        pb = b.n0 / (b.n0 + b.n1);
      const d = pb - pa;
      const v = pa * (1 - pa);
      if (v <= 0) continue;
      xs.push((d * d) / v);
    }
  const m = mean(xs);
  return m && m > 0 ? { ne: 1 / m, n: xs.length } : { ne: null, n: xs.length };
}
function wfHeld(grid, ne, reps, seed0) {
  const rng = E.makeRng(seed0);
  /* draw the next frequency with the MEASURED sampling variance: a binomial of
   * `ne` trials has variance q(1-q)/ne, which is the target. */
  const N = Math.max(2, Math.round(ne));
  let held = 0;
  for (let k = 0; k < reps; k++) {
    let p = 0.5; /* founders are 15/15 */
    const v0 = p * (1 - p);
    for (let g = 0; g < GENS && p > 0 && p < 1; g++) {
      const pm = Math.min(p, 1 - p);
      const w = grid[Math.min(W_BINS - 1, Math.floor((pm / 0.5) * W_BINS))];
      const minorIsP = p <= 0.5;
      const wp = minorIsP ? w : 1,
        wq = minorIsP ? 1 : w;
      const num = p * wp;
      const q = num / (num + (1 - p) * wq);
      let hit = 0;
      for (let d = 0; d < N; d++) if (rng() < q) hit++;
      p = hit / N;
    }
    const v = p * (1 - p);
    if (v0 > 0 && v / v0 > 0.4) held++;
  }
  return held / reps;
}
console.log(
  "\nQ3 — a two-type Wright-Fisher driven by the MEASURED w(p) and the MEASURED Ne,",
);
console.log("     both taken from within-run quantities; no free parameters");
for (const arm of ["A", "B"]) {
  const { ne, n } = measuredNe(arm);
  const { grid, filled } = measuredW(arm);
  if (ne == null || grid == null) {
    console.log(
      `  ${arm}: NOT ESTIMABLE — Ne from ${n} transitions${ne == null ? " (failed)" : ` = ${ne.toFixed(1)}`}, ` +
        `w(p) populated in ${filled}/${W_BINS} bins (needs ${W_MIN_BINS}). No prediction is reported; ` +
        `substituting w=1 here would run a NEUTRAL model and call it a measured one.`,
    );
    continue;
  }
  const pred = wfHeld(grid, ne, 4000, 99);
  const obs = arm === "A" ? heldA : heldB;
  const band = arm === "A" ? 0.1 : 0.05;
  const ok = obs != null && Math.abs(pred - obs) <= band;
  console.log(
    `  ${arm}: Ne ${ne.toFixed(1)} (from ${n} transitions, census N=${N0})  ` +
      `predicted HELD ${pred.toFixed(3)}  observed ${obs != null ? obs.toFixed(3) : "—"}  ` +
      `band +/-${band}  ${ok ? "WITHIN" : "OUTSIDE — the measured advantage does not account for the outcome"}`,
  );
}

if (DUMP) {
  fs.writeFileSync(
    DUMP,
    JSON.stringify({
      config: { N0, GENS, SITE_N, D_EXCL, SLICES, WIDTH, N_SEEDS },
      arms: out,
    }),
  );
  console.log(`\nper-generation rows written to ${DUMP}`);
}
