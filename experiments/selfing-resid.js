/*
 * #63 — DOES ABLATING THE DOSE/VISITATION CORRELATION MAKE THE RESCUE AGGREGATE?
 *
 * Registered in docs/2026-09-04-selfing-resid-prereg.md before the sweep ran,
 * and this file is committed before the sweep produces any data.
 *
 * Four cells at N0=30, rate 2.0, differing ONLY in how a matched total of
 * maternal assurance is distributed:
 *   30:R200   flat  — one shared scalar, rate x mean(received)   (#58-#61)
 *   30:R200d  dose  — proportional to the plant's own self-pollen (#62)
 *   30:R200r  clip  — proportional to self-pollen RESIDUALISED on received,
 *                     negatives clipped to zero                   (#63 PRIMARY)
 *   30:R200s  shift — the same residual, shifted rather than clipped (#63
 *                     discriminator: same ordering, almost no starvation)
 *
 *   RF_SEEDS=120 RF_CONFIGS=30:R200,30:R200d,30:R200r,30:R200s \
 *     RF_DUMP=x.json node experiments/rare-floor.js
 *   node experiments/selfing-resid.js x.json
 *
 * ⚠️ THE PRIMARY IS UNCONDITIONAL AND THAT IS THE POINT. #62 registered a
 * primary conditioned on reaching k=1 — a state the treatment changes — and the
 * rule fired H1 on a collider-conditioned estimand while every unconditional
 * measure included zero. The primary here is a per-run total with no filter the
 * treatment can move. #62's k=1 statistic is still printed, labelled, and
 * CANNOT change the verdict.
 *
 * exit 0 reported · 2 bad input · 3 a control FAILED
 */
const fs = require("node:fs");
const zlib = require("node:zlib");

const path = process.argv[2] || "_scratch/rf63-sweep.json";
if (!fs.existsSync(path)) {
  console.error(`no sweep at ${path} — run rare-floor.js with RF_DUMP first`);
  process.exit(2);
}
const raw = path.endsWith(".gz")
  ? zlib.gunzipSync(fs.readFileSync(path))
  : fs.readFileSync(path);
const doc = JSON.parse(raw.toString("utf8"));

const FLAT = "30:R200",
  DOSE = "30:R200d",
  CLIP = "30:R200r",
  SHIFT = "30:R200s";
for (const k of [FLAT, DOSE, CLIP, SHIFT])
  if (!doc.cells[k] || !doc.cells[k].length) {
    console.error(
      `sweep has no cell ${k} — has: ${Object.keys(doc.cells)
        .filter((c) => doc.cells[c].length)
        .join(", ")}`,
    );
    process.exit(2);
  }
const flat = doc.cells[FLAT],
  dose = doc.cells[DOSE],
  clip = doc.cells[CLIP],
  shift = doc.cells[SHIFT];

let failed = 0;
const fail = (msg) => {
  console.log(`  ⚠️  ${msg}`);
  failed++;
};

/* ---------------------------------------------------------------- helpers */
const mean = (x) => (x.length ? x.reduce((a, b) => a + b, 0) / x.length : null);
const f = (x, d = 3) =>
  x === null || x === undefined ? "  —   " : Number(x).toFixed(d);
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const quant = (xs, p) => {
  const s = xs.slice().sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))];
};

/*
 * ⚠️ BOOTSTRAP OVER SEEDS, PAIRED — the #55 lesson. A seed is one trajectory and
 * its generations are not independent draws. The arms share founding populations
 * seed for seed, so the pairing removes founding variance; it is NOT the
 * shared-rng pairing that decayed in #45, because the streams desync the moment
 * the arms diverge and nothing here assumes otherwise. 10,000 resamples as
 * registered.
 */
function bootDiff(pairs, nb = 10000) {
  const rnd = mulberry32(20260904);
  const out = [];
  for (let b = 0; b < nb; b++) {
    let a = 0,
      c = 0;
    const n = pairs.length;
    for (let i = 0; i < n; i++) {
      const j = Math.floor(rnd() * n);
      a += pairs[j][0];
      c += pairs[j][1];
    }
    out.push((c - a) / n);
  }
  return out;
}

/* one row per run, all UNCONDITIONAL — every run contributes exactly one value */
const perRun = (r) => {
  let informativeGens = 0,
    motheredTotal = 0,
    k1gens = 0;
  for (const row of r.rows) {
    if (!row.informative) continue;
    informativeGens++;
    if (row.minMothered != null) motheredTotal += row.minMothered;
    if (row.k === 1) k1gens++;
  }
  return {
    seed: r.seed,
    informativeGens,
    motheredTotal,
    k1gens,
    everK1: k1gens > 0 ? 1 : 0,
    held: r.fate === "HELD" ? 1 : 0,
  };
};

const pairOn = (A, B) => {
  const b = new Map(B.map((r) => [r.seed, r]));
  return A.filter((r) => b.has(r.seed)).map((r) => [r, b.get(r.seed)]);
};

function report(labelText, pairs, key) {
  const p = pairs
    .map(([x, y]) => [x[key], y[key]])
    .filter(([a, b]) => a != null && b != null);
  if (!p.length) return null;
  const d = bootDiff(p);
  const lo = quant(d, 0.025),
    hi = quant(d, 0.975);
  console.log(
    `  ${labelText.padEnd(44)} ${f(mean(p.map((x) => x[0])))} -> ${f(
      mean(p.map((x) => x[1])),
    )}   diff ${f(mean(d))} [${f(lo)}, ${f(hi)}]   (${p.length} seeds)`,
  );
  return { lo, hi, d: mean(d) };
}

console.log(`#63 — residualised selfing assurance`);
console.log(`sweep: ${path}`);
console.log(
  `runs: flat ${flat.length}  dose ${dose.length}  clip ${clip.length}  shift ${shift.length}\n`,
);

/* =============================================================== CONTROLS */
console.log(`CONTROLS`);

/*
 * C-MATCH. Scoped honestly to g=0. From g=1 the arms hold DIFFERENT populations,
 * and demanding equal totals there would be demanding the intervention do
 * nothing. At g=0 every arm starts from the identical founding population, so
 * any difference in the assurance budget is the scaling being wrong.
 */
{
  const at0 = (cells) => {
    const m = new Map();
    for (const r of cells) {
      const row = r.rows && r.rows[0];
      if (row && row.selfWTot != null) m.set(r.seed, row.selfWTot);
    }
    return m;
  };
  const F = at0(flat);
  let worst = 0,
    n = 0;
  for (const [name, cells] of [
    ["dose", dose],
    ["clip", clip],
    ["shift", shift],
  ]) {
    const M = at0(cells);
    for (const [seed, v] of M) {
      if (!F.has(seed)) continue;
      const a = F.get(seed);
      const rel = a > 0 ? Math.abs(v - a) / a : Math.abs(v - a);
      if (rel > worst) worst = rel;
      n++;
    }
    void name;
  }
  console.log(
    `  C-match   every arm spends the flat total at g=0: worst relative gap ${worst.toExponential(1)} over ${n} arm-seeds`,
  );
  if (!(worst < 1e-9))
    fail(
      `C-MATCH FAILED — the arms do not spend the same assurance (${worst})`,
    );
}

/* C10 — an arm that does not actually self would produce a confident null */
{
  const rate = (cells) => {
    let s = 0,
      m = 0;
    for (const r of cells)
      for (const row of r.rows) {
        s += row.selfedN || 0;
        m += row.matingsN || 0;
      }
    return m ? s / m : null;
  };
  console.log(
    `  C10       share of matings selfed: flat ${f(rate(flat))}  dose ${f(rate(dose))}  clip ${f(rate(clip))}  shift ${f(rate(shift))}`,
  );
  for (const [name, cells] of [
    ["flat", flat],
    ["dose", dose],
    ["clip", clip],
    ["shift", shift],
  ])
    if (!(rate(cells) > 0)) fail(`C10 FAILED — ${name} does not self at all`);
}

/*
 * ⚠️ C-RESID — THE ABLATION, MEASURED ON THE DATA THAT SHIPPED. The pre-flight
 * measured rho(self, received) = 0.402 falling to 0.096 after residualising, but
 * it measured that on a RE-RUN OF A DIFFERENT ARM, which makes it a premise.
 * These are the same quantities on the rows that actually produced the result.
 *
 * ⚠️⚠️ BOTH STATISTICS, AND THEY MAY NOT BE MIXED. The pre-flight's numbers are
 * SPEARMAN, because the diagonal is heavy-tailed and a rank statistic is the
 * honest summary of "does assurance track visitation". The shifted arm's
 * defining property is PEARSON — OLS residuals are exactly Pearson-orthogonal
 * to the regressor, and nothing else proves the ablation happened. Quoting one
 * against the other would be the #62(b) error in a new costume: a number
 * computed a different way, presented as the same quantity.
 */
{
  const rho = (cells, key) => {
    const v = [];
    for (const r of cells)
      for (const row of r.rows) if (row[key] != null) v.push(row[key]);
    return v.length ? { m: mean(v), n: v.length } : null;
  };
  const P = (c) => rho(c, "selfWRho"),
    S = (c) => rho(c, "selfWRhoS");
  const rd = P(dose),
    rc = P(clip),
    rs = P(shift);
  const sd = S(dose),
    sc = S(clip),
    ss = S(shift);
  const premise = rho(flat, "selfRecvRhoS");

  console.log(
    `  C-resid   SPEARMAN rho(assurance, received):  dose ${f(sd && sd.m)}   clip ${f(sc && sc.m)}   shift ${f(ss && ss.m)}`,
  );
  console.log(
    `  C-resid   PEARSON  rho(assurance, received):  dose ${f(rd && rd.m)}   clip ${f(rc && rc.m)}   shift ${f(rs && rs.m)}`,
  );
  console.log(
    `  C-resid   the PREMISE re-measured here — SPEARMAN rho(self-pollen, received) on the flat arm: ` +
      `${f(premise && premise.m)}  (pre-flight quoted 0.402 / 0.438)`,
  );

  /* the ablation must show up on the rank statistic the premise was stated in */
  if (sd && sc && !(Math.abs(sc.m) < Math.abs(sd.m)))
    fail(
      `C-RESID FAILED — clipped arm does not carry less rank-correlation with received than dose ` +
        `(clip ${sc.m} vs dose ${sd.m})`,
    );
  /* and the shift arm must be Pearson-orthogonal, which is what makes it a
   * residual at all rather than merely a differently-shaped floor */
  if (rs && !(Math.abs(rs.m) < 1e-6))
    fail(
      `C-RESID FAILED — the shifted arm should be exactly Pearson-orthogonal to received, got ${rs.m}`,
    );
}

/*
 * ⚠️ C-ZERO — the starved class, and its lineage split. #62 refuted the
 * abandoned-plant mechanism partly BECAUSE the class was small (4.3%) and
 * unbiased. At the clipped arm's scale that refutation has to be re-earned.
 */
{
  const starve = (cells) => {
    let z = 0,
      n = 0,
      zMin = 0,
      nMin = 0,
      zMaj = 0,
      nMaj = 0;
    for (const r of cells)
      for (const row of r.rows) {
        if (row.selfWZero == null) continue;
        z += row.selfWZero;
        n += row.n0 + row.n1 + (row.nh || 0);
        if (row.selfWNMin != null) {
          zMin += row.selfWZeroMin;
          nMin += row.selfWNMin;
          zMaj += row.selfWZeroMaj;
          nMaj += row.selfWNMaj;
        }
      }
    return {
      all: n ? z / n : null,
      min: nMin ? zMin / nMin : null,
      maj: nMaj ? zMaj / nMaj : null,
    };
  };
  for (const [name, cells] of [
    ["dose ", dose],
    ["clip ", clip],
    ["shift", shift],
  ]) {
    const s = starve(cells);
    console.log(
      `  C-zero    ${name} plants at ZERO assurance: ${f(s.all)}   minority ${f(s.min)}   majority ${f(s.maj)}`,
    );
  }
}

/* ================================================= THE REGISTERED PRIMARY */
console.log(
  `\n⚠️ REGISTERED PRIMARY — UNCONDITIONAL, no k filter, paired on founding seed`,
);
console.log(
  `   total offspring mothered by the minority, per run: CLIP vs FLAT`,
);

const F = flat.map(perRun),
  D = dose.map(perRun),
  C = clip.map(perRun),
  S = shift.map(perRun);

const primary = report(
  "TOTAL offspring mothered by the minority",
  pairOn(F, C),
  "motheredTotal",
);

if (!primary) {
  console.error("no paired runs — cannot evaluate the registered rule");
  process.exit(2);
}
console.log(`\n   THE REGISTERED RULE, AS WRITTEN:`);
if (primary.lo > 0)
  console.log(
    `   ⇒ H1 — interval excludes zero, POSITIVE. Ablating the correlation aggregates.`,
  );
else if (primary.hi < 0)
  console.log(
    `   ⇒ H3 — interval excludes zero, NEGATIVE. The clip backfires; starvation dominates.`,
  );
else
  console.log(
    `   ⇒ H2 — interval includes zero. At a matched total the shape still does not aggregate.`,
  );

/* ==================================================== SECONDARY, UNCONDITIONAL */
console.log(
  `\nSECONDARY — unconditional, and none of these can carry the verdict`,
);
console.log(`  clip vs flat:`);
const pcf = pairOn(F, C);
report("generations with both lineages present", pcf, "informativeGens");
report("generations spent at k=1", pcf, "k1gens");
report("ever reached k=1 (share of runs)", pcf, "everK1");
report("HELD (coexistence)", pcf, "held");

console.log(`\n  shift vs flat — the ordering-vs-starvation discriminator:`);
const psf = pairOn(F, S);
const shiftPrimary = report(
  "TOTAL offspring mothered by the minority",
  psf,
  "motheredTotal",
);
report("HELD (coexistence)", psf, "held");

console.log(`\n  dose vs flat — #62's arm, re-derived here for comparability:`);
const pdf = pairOn(F, D);
report("TOTAL offspring mothered by the minority", pdf, "motheredTotal");
report("HELD (coexistence)", pdf, "held");

console.log(`\n  clip vs DOSE — does ablating beat #62's rule directly?`);
const pcd = pairOn(D, C);
report("TOTAL offspring mothered by the minority", pcd, "motheredTotal");
report("HELD (coexistence)", pcd, "held");

/* ========================================= SECONDARY, COLLIDER-CONDITIONED */
console.log(
  `\n⚠️ SECONDARY — #62's REGISTERED PRIMARY, CONDITIONED ON REACHING k=1.`,
);
console.log(
  `   Reaching k=1 is downstream of the treatment, so this compares differently-`,
);
console.log(
  `   selected sets of generations. Reported for comparability with #62 ONLY.`,
);
console.log(`   ⚠️ WHATEVER IT SHOWS, IT DOES NOT CHANGE THE VERDICT ABOVE.\n`);
{
  const k1 = (cells) => {
    const m = new Map();
    for (const r of cells) {
      const v = [];
      for (const row of r.rows)
        if (row.informative && row.k === 1 && row.minMothered != null)
          v.push(row.minMothered);
      if (v.length) m.set(r.seed, mean(v));
    }
    return m;
  };
  const stat = (cells) => {
    const v = [];
    let nothing = 0,
      seeds = new Set();
    for (const r of cells)
      for (const row of r.rows)
        if (row.informative && row.k === 1 && row.minMothered != null) {
          v.push(row.minMothered);
          if (row.minMothered === 0) nothing++;
          seeds.add(r.seed);
        }
    return {
      m: mean(v),
      n: v.length,
      seeds: seeds.size,
      nothing: nothing / (v.length || 1),
    };
  };
  for (const [name, cells] of [
    ["flat ", flat],
    ["dose ", dose],
    ["clip ", clip],
    ["shift", shift],
  ]) {
    const s = stat(cells);
    console.log(
      `   ${name}  mean minMothered at k=1 ${f(s.m, 3)}   mothering nothing ${f(s.nothing)}   (${s.n} gens / ${s.seeds} seeds)`,
    );
  }
  const A = k1(flat),
    B = k1(clip);
  const p = [...A.keys()]
    .filter((s) => B.has(s))
    .map((s) => [A.get(s), B.get(s)]);
  if (p.length) {
    const d = bootDiff(p);
    console.log(
      `   paired clip-vs-flat over the ${p.length} seeds reaching k=1 in BOTH arms: ` +
        `${f(mean(d))} [${f(quant(d, 0.025))}, ${f(quant(d, 0.975))}]`,
    );
  }
}

/* ------------------------------------------------------------------ verdict */
console.log(
  `\nthe discriminator: clip ${primary.lo > 0 || primary.hi < 0 ? "MOVED" : "did not move"} the primary; ` +
    `shift ${shiftPrimary && (shiftPrimary.lo > 0 || shiftPrimary.hi < 0) ? "MOVED" : "did not move"} it.`,
);
console.log(`  both move  => the residual ORDERING is doing the work`);
console.log(
  `  only clip  => the STARVATION is doing the work, not the ablation`,
);
console.log(
  `  neither    => shape still does not aggregate at a matched total`,
);

if (failed) {
  console.log(
    `\n${failed} CONTROL(S) FAILED — the result above is not reportable`,
  );
  process.exit(3);
}
console.log(`\nall controls passed`);
