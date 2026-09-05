/*
 * #64 — IS COVERAGE A DOSE? SWEEP A FLAT FLOOR WITHHELD AT RANDOM.
 *
 * Registered in docs/2026-09-05-selfing-cover-prereg.md before any of this
 * existed, and this file is committed before the sweep produces any data.
 *
 * Eight cells at N0=30, rate 2.0, cost 0, differing ONLY in how many plants the
 * floor reaches:
 *   30:A        no floor at all — the anchor for what the floor is worth
 *   30:R200     the flat floor, every plant                        (#58-#61)
 *   30:R200q0   coverage 0 — C-NULL, must be BIT-IDENTICAL to R200
 *   30:R200q25  coverage 0.25
 *   30:R200q50  coverage 0.50
 *   30:R200q69  coverage 0.69 — matched to clip's measured 69.1%   (PRIMARY)
 *   30:R200q85  coverage 0.85
 *   30:R200r    #63's clip, re-run — the matched-coverage head-to-head
 *
 *   RF_SEEDS=120 RF_CONFIGS=30:A,30:R200,30:R200q0,30:R200q25,30:R200q50,\
 *     30:R200q69,30:R200q85,30:R200r RF_DUMP=x.json node experiments/rare-floor.js
 *   node experiments/selfing-cover.js x.json
 *
 * ⚠️ THE PRIMARY IS HELD, AND THE SWITCH IS DISCLOSED RATHER THAN HIDDEN. #63
 * registered `motheredTotal` and it returned H2 while HELD — a secondary —
 * excluded zero. Registering HELD here was a choice made AFTER seeing that, and
 * the pre-registration says so in those words. `motheredTotal` ships on every
 * contrast so #63's comparison survives; if the two disagree the disagreement is
 * reported, not resolved in favour of whichever excludes zero.
 *
 * ⚠️ THE PRIMARY IS ALSO UNCONDITIONAL. #62 registered a primary conditioned on
 * reaching k=1 — a state the treatment moves — and #63 measured what that costs:
 * on the same arm and the same seeds the collider-conditioned estimand said
 * +9.247 [7.069, 11.519] while the unconditional one said −0.138 [−0.257,
 * −0.018]. Both excluded zero, opposite signs. That statistic is printed below,
 * labelled, and CANNOT change the verdict.
 *
 * exit 0 reported · 2 bad input · 3 a control FAILED
 */
const fs = require("node:fs");
const zlib = require("node:zlib");

const path = process.argv[2] || "_scratch/rf64-sweep.json";
if (!fs.existsSync(path)) {
  console.error(`no sweep at ${path} — run rare-floor.js with RF_DUMP first`);
  process.exit(2);
}
const raw = path.endsWith(".gz")
  ? zlib.gunzipSync(fs.readFileSync(path))
  : fs.readFileSync(path);
const doc = JSON.parse(raw.toString("utf8"));

const NONE = "30:A",
  FLAT = "30:R200",
  Q0 = "30:R200q0",
  Q25 = "30:R200q25",
  Q50 = "30:R200q50",
  Q69 = "30:R200q69",
  Q85 = "30:R200q85",
  CLIP = "30:R200r";

/* nominal q for each coverage cell, so the realised share can be checked
 * against what the name promised rather than against itself */
const QOF = new Map([
  [Q0, 0],
  [Q25, 0.25],
  [Q50, 0.5],
  [Q69, 0.69],
  [Q85, 0.85],
]);
const CELLS = [NONE, FLAT, Q0, Q25, Q50, Q69, Q85, CLIP];
const LABEL = new Map([
  [NONE, "no floor"],
  [FLAT, "flat"],
  [Q0, "q=0.00"],
  [Q25, "q=0.25"],
  [Q50, "q=0.50"],
  [Q69, "q=0.69"],
  [Q85, "q=0.85"],
  [CLIP, "#63 clip"],
]);

for (const k of CELLS)
  if (!doc.cells[k] || !doc.cells[k].length) {
    console.error(
      `sweep has no cell ${k} — has: ${Object.keys(doc.cells)
        .filter((c) => doc.cells[c].length)
        .join(", ")}`,
    );
    process.exit(2);
  }
const C = Object.fromEntries(CELLS.map((k) => [k, doc.cells[k]]));

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
 * ⚠️ BOOTSTRAP OVER SEEDS, PAIRED — the #55 lesson, unchanged from #63. A seed
 * is one trajectory and its generations are not independent draws. The arms
 * share founding populations seed for seed, so the pairing removes founding
 * variance; it is NOT the shared-rng pairing that decayed in #45, because the
 * streams desync the moment the arms diverge and nothing here assumes
 * otherwise. 10,000 resamples as registered.
 */
function bootDiff(pairs, nb = 10000) {
  const rnd = mulberry32(20260905);
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

const RUNS = Object.fromEntries(CELLS.map((k) => [k, C[k].map(perRun)]));

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
    `  ${labelText.padEnd(40)} ${f(mean(p.map((x) => x[0])))} -> ${f(
      mean(p.map((x) => x[1])),
    )}   diff ${f(mean(d))} [${f(lo)}, ${f(hi)}]   (${p.length} seeds)`,
  );
  return { lo, hi, d: mean(d), n: p.length };
}

console.log(`#64 — coverage as a dose: a flat floor withheld at random`);
console.log(`sweep: ${path}`);
console.log(
  `runs: ${CELLS.map((k) => `${LABEL.get(k)} ${C[k].length}`).join("  ")}\n`,
);

/* =============================================================== CONTROLS */
console.log(`CONTROLS`);

/*
 * C-NULL — and it is the strongest control in this experiment because it is
 * BIT-LEVEL rather than distributional. The coverage path at q=0 starves nobody
 * and pays target/n, which is the flat branch's own expression, and its shuffle
 * draws from a dedicated stream (sim/ibm.js coverRng) so the main stream never
 * moves. If these two cells are not the same numbers, every coverage arm is
 * confounded with an rng shift and nothing below means anything.
 */
{
  const a = C[FLAT],
    b = C[Q0];
  let vals = 0,
    bad = 0,
    firstBad = null;
  const IGNORE = new Set(["arm"]); /* the one field that MUST differ */
  const walk = (pa, x, y) => {
    const leaf = pa.slice(pa.lastIndexOf(".") + 1);
    if (IGNORE.has(leaf)) return;
    if (x === null || y === null || typeof x !== "object") {
      vals++;
      if (!Object.is(x, y)) {
        bad++;
        if (!firstBad) firstBad = `${pa}: ${x} vs ${y}`;
      }
      return;
    }
    if (Array.isArray(x)) {
      if (!Array.isArray(y) || x.length !== y.length) {
        bad++;
        if (!firstBad) firstBad = `${pa}: array shape`;
        return;
      }
      for (let i = 0; i < x.length; i++) walk(`${pa}[${i}]`, x[i], y[i]);
      return;
    }
    for (const k of new Set([...Object.keys(x), ...Object.keys(y || {})]))
      walk(`${pa}.${k}`, x[k], y[k]);
  };
  const bySeed = new Map(b.map((r) => [r.seed, r]));
  let n = 0;
  for (const r of a) {
    const o = bySeed.get(r.seed);
    if (!o) continue;
    n++;
    walk("rep", r, o);
  }
  console.log(
    `  C-null    q=0 vs flat, every shipped field: ${vals} values over ${n} seeds, ${bad} disagreements`,
  );
  if (bad)
    fail(
      `C-NULL FAILED — the coverage path moves the model at q=0 (${firstBad}). ` +
        `Every coverage arm is confounded with an rng shift.`,
    );
}

/*
 * C-MATCH. Scoped honestly to g=0, as in #63: from g=1 the arms hold DIFFERENT
 * populations and demanding equal totals there would be demanding the
 * intervention do nothing. `30:A` is excluded because it has no floor to match
 * and `30:R200q100` is not swept for the same reason.
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
  const F = at0(C[FLAT]);
  let worst = 0,
    n = 0;
  for (const k of [Q0, Q25, Q50, Q69, Q85, CLIP]) {
    const M = at0(C[k]);
    for (const [seed, v] of M) {
      if (!F.has(seed)) continue;
      const a = F.get(seed);
      const rel = a > 0 ? Math.abs(v - a) / a : Math.abs(v - a);
      if (rel > worst) worst = rel;
      n++;
    }
  }
  console.log(
    `  C-match   every arm spends the flat total at g=0: worst relative gap ${worst.toExponential(1)} over ${n} arm-seeds`,
  );
  if (!(worst < 1e-9))
    fail(
      `C-MATCH FAILED — the arms do not spend the same assurance (${worst})`,
    );
}

/*
 * C-COVER — the realised starved share against what the arm's NAME promised.
 * `round(q*n)` means the two differ by design (at n=30, q=0.25 realises 8/30 =
 * 0.267), so this is not a tautology: it checks the treatment actually withheld
 * from the number of plants the rule says, on the rows that shipped, rather than
 * on a pre-flight of a different arm.
 */
{
  console.log(`  C-cover   realised starved share vs nominal q:`);
  for (const k of [Q0, Q25, Q50, Q69, Q85, CLIP]) {
    let z = 0,
      tot = 0;
    for (const r of C[k])
      for (const row of r.rows) {
        if (row.selfWZero == null) continue;
        z += row.selfWZero;
        tot += row.n0 + row.n1 + (row.nh || 0);
      }
    const realised = tot ? z / tot : null;
    const nominal = QOF.has(k) ? QOF.get(k) : null;
    console.log(
      `              ${LABEL.get(k).padEnd(9)} realised ${f(realised)}` +
        (nominal === null
          ? `   (nominal: n/a — #63's rule starves by residual)`
          : `   nominal ${f(nominal)}`),
    );
    /* n varies a little with the population, so the tolerance is the rounding
     * granularity (1 plant in 30) plus slack, not an invented number */
    if (
      nominal !== null &&
      realised !== null &&
      Math.abs(realised - nominal) > 0.05
    )
      fail(
        `C-COVER FAILED — ${k} starved ${f(realised)} of plants, its name says ${f(nominal)}`,
      );
  }
}

/*
 * ⚠️ C-KILL — THE MECHANISM MEASUREMENT, AND WHAT SEPARATES THE TWO HYPOTHESES
 * ON THE SHIPPED DATA RATHER THAN BY ARGUMENT.
 *
 * Only a plant with `received === 0` can be KILLED by losing the floor: her
 * maternal weight is entirely the floor, so withholding it leaves her at exactly
 * zero and `pick()` never returns her (#61). Everyone else is demoted.
 *
 * `recvZero` is the size of the exposed class, a property of the pollination and
 * not of the treatment — so it should be roughly FLAT across arms, and this is a
 * control on that too. `killed / recvZero` is the kill rate.
 *
 * The registered expectation: under a random cut the kill rate SITS ON the arm's
 * overall starved share (a blind rule cannot distinguish the exposed class),
 * while under #63's clip it sits clearly BELOW it, because `received ≈ 0` gives
 * a large positive residual. That is pre-flight A's mechanism, re-measured on
 * the rows that shipped.
 */
{
  console.log(
    `  C-kill    the exposed class (received === 0) and how much of it each rule zeroes:`,
  );
  console.log(
    `              arm       exposed%   killed/exposed   overall starved   minority killed / majority killed`,
  );
  const stat = {};
  for (const k of [FLAT, Q0, Q25, Q50, Q69, Q85, CLIP]) {
    let plants = 0,
      exposed = 0,
      killed = 0,
      starved = 0,
      kMin = 0,
      kMaj = 0;
    for (const r of C[k])
      for (const row of r.rows) {
        if (row.recvZero == null) continue;
        const n = row.n0 + row.n1 + (row.nh || 0);
        plants += n;
        exposed += row.recvZero;
        if (row.killed != null) killed += row.killed;
        if (row.selfWZero != null) starved += row.selfWZero;
        if (row.killedMin != null) kMin += row.killedMin;
        if (row.killedMaj != null) kMaj += row.killedMaj;
      }
    const rate = exposed ? killed / exposed : null;
    const overall = plants ? starved / plants : null;
    stat[k] = { exposedShare: plants ? exposed / plants : null, rate, overall };
    console.log(
      `              ${LABEL.get(k).padEnd(9)} ${f(stat[k].exposedShare)}      ${f(rate)}` +
        `            ${f(overall)}             ${kMin} / ${kMaj}`,
    );
  }
  /* the exposed class must not itself be a treatment effect, or "kill rate" is
   * measured against a moving denominator */
  const shares = [FLAT, Q25, Q50, Q69, Q85, CLIP]
    .map((k) => stat[k].exposedShare)
    .filter((x) => x != null);
  const spread = Math.max(...shares) - Math.min(...shares);
  console.log(
    `              exposed-class share varies by ${f(spread)} across arms`,
  );
  if (spread > 0.15)
    fail(
      `C-KILL WARNING — the exposed class itself moves by ${f(spread)} across arms, ` +
        `so the kill RATE has a treatment-movable denominator and must be read as such`,
    );
  /* the flat arm cannot kill anyone: it starves nobody, by construction */
  if (stat[FLAT].rate) fail(`C-KILL FAILED — the flat floor killed somebody`);
}

/*
 * C10 — every selfing arm actually selfs, at the rate asked. Asks
 * selfing-arms.js rather than re-reading the arm name; see the long note in
 * that file about C10 crying wolf twice on correct cells.
 */
{
  const { selfingFor } = require("./selfing-arms.js");
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
  const parts = [];
  for (const k of CELLS) {
    const arm = k.split(":")[1];
    const cfg = selfingFor(arm);
    const v = rate(C[k]);
    parts.push(`${LABEL.get(k)} ${f(v)}`);
    /*
     * ⚠️ THE GATE IS UNCONDITIONAL, in both directions. An arm that does not
     * self would produce a confident null about a mechanism that never ran; an
     * arm with no floor that DOES self would mean the anchor is not an anchor.
     * `30:R200q100` is not swept, so no selfing arm here legitimately reads 0.
     */
    if (cfg && !(v > 0))
      fail(`C10 FAILED — ${k} asks for selfing and ${v} of its matings selfed`);
    if (!cfg && v)
      fail(
        `C10 FAILED — ${k} has no floor and yet ${f(v)} of its matings selfed`,
      );
  }
  console.log(`  C10       selfed share of matings: ${parts.join("  ")}`);
}

/* C-seed — distinct seeds beside every count, printed with each contrast. */
console.log(
  `  C-seed    seeds per cell: ${CELLS.map((k) => `${LABEL.get(k)} ${new Set(C[k].map((r) => r.seed)).size}`).join("  ")}`,
);

/* ================================================== THE FLOOR IS WORTH SOMETHING */
console.log(`\nIS THERE ANYTHING TO WITHDRAW? (registered pre-condition)`);
const anchor = report(
  "HELD: no floor -> flat floor",
  pairOn(RUNS[NONE], RUNS[FLAT]),
  "held",
);
if (anchor && anchor.lo <= 0 && anchor.hi >= 0)
  console.log(
    `  ⚠️  the floor's own benefit interval INCLUDES ZERO on these seeds. The\n` +
      `      pre-registration says this makes the coverage axis uninterpretable:\n` +
      `      there is no benefit to withdraw and the q arms are measuring noise.`,
  );

/* ============================================================ THE PRIMARY */
console.log(`\nREGISTERED PRIMARY — HELD, q=0.69 vs flat, unconditional`);
const primary = report(
  "HELD (coexistence)",
  pairOn(RUNS[FLAT], RUNS[Q69]),
  "held",
);
if (primary) {
  const excl = primary.lo > 0 || primary.hi < 0;
  const verdict = !excl ? "H2" : primary.d < 0 ? "H1" : "H3";
  console.log(`\n  VERDICT (by the rule fixed in advance): ${verdict}`);
  if (verdict === "H1")
    console.log(
      `    Random coverage loss at q=0.69 DESTROYS coexistence.\n` +
        `    Against #63's clip-vs-flat point estimate of −0.138, this is ` +
        `${primary.d < -0.138 ? "MORE" : "LESS"} negative.`,
    );
  if (verdict === "H2")
    console.log(
      `    Coverage at 69% does not move coexistence when the starved set is\n` +
        `    RANDOM. #63's harm would then be on the TARGETING axis after all,\n` +
        `    and #63's conclusion requires revision.`,
    );
  if (verdict === "H3")
    console.log(
      `    Withdrawing assurance from 69% of plants at random IMPROVED\n` +
        `    coexistence. No registered mechanism predicts this; reported as an\n` +
        `    anomaly, NOT explained after the fact.`,
    );
}

/* ========================================================= THE DOSE CURVE */
console.log(`\nSECONDARY 1 — the dose curve (registered)`);
const curve = [];
for (const k of [Q0, Q25, Q50, Q69, Q85]) {
  const r = report(
    `HELD: flat -> ${LABEL.get(k)}`,
    pairOn(RUNS[FLAT], RUNS[k]),
    "held",
  );
  curve.push([k, r, mean(RUNS[k].map((x) => x.held))]);
}
{
  const pts = curve.map(([, , m]) => m);
  const mono = pts.every((v, i) => i === 0 || v <= pts[i - 1] + 1e-12);
  console.log(
    `\n  monotone non-increasing in q?  ${mono ? "YES" : "NO"}   ` +
      `[${pts.map((x) => f(x)).join(", ")}]`,
  );
  console.log(
    `  ⚠️ descriptive only — five ordered point estimates is weak evidence, as registered.`,
  );
  const lowStep = pts[1] - pts[2]; /* q25 -> q50 */
  const highStep = pts[3] - pts[4]; /* q69 -> q85 */
  console.log(
    `  shape: q25->q50 step ${f(lowStep)}   q69->q85 step ${f(highStep)}   ` +
      `=> ${Math.abs(highStep) > Math.abs(lowStep) ? "CONVEX (accelerating): favours LOTTERY" : "not accelerating: favours KILL"}`,
  );
  report("HELD: q=0.25 -> q=0.85", pairOn(RUNS[Q25], RUNS[Q85]), "held");
}

/* ================================================== SECONDARY 2 — the crossing */
console.log(
  `\nSECONDARY 2 — does any coverage arm fall BELOW having no floor?`,
);
console.log(
  `  (KILL forbids it: coverage can at most remove the floor's benefit.\n` +
    `   LOTTERY predicts q=0.85 does, because a matched total paid to a\n` +
    `   shrinking fraction adds variance the no-floor arm never had.)`,
);
for (const k of [Q50, Q69, Q85, CLIP])
  report(
    `HELD: no floor -> ${LABEL.get(k)}`,
    pairOn(RUNS[NONE], RUNS[k]),
    "held",
  );

/* ============================================ SECONDARY 3 — the head-to-head */
console.log(
  `\nSECONDARY 3 — random vs residual starvation at matched coverage (registered)`,
);
console.log(
  `  Predicted negative: pre-flight A found #63's clip spares the lone k=1\n` +
    `  minority plant 90% of the time against a 69.1% nominal cut.`,
);
report("HELD: #63 clip -> q=0.69", pairOn(RUNS[CLIP], RUNS[Q69]), "held");

/* ==================================== SECONDARY 4 — #63's primary, carried */
console.log(
  `\nSECONDARY 4 — motheredTotal (#63's registered primary), every contrast`,
);
for (const k of [Q25, Q50, Q69, Q85, CLIP])
  report(
    `total minority offspring: flat -> ${LABEL.get(k)}`,
    pairOn(RUNS[FLAT], RUNS[k]),
    "motheredTotal",
  );
report(
  "total minority offspring: no floor -> flat",
  pairOn(RUNS[NONE], RUNS[FLAT]),
  "motheredTotal",
);

/* ===================================================== SECONDARY 5 — the rest */
console.log(
  `\nSECONDARY 5 — other unconditional measures, flat vs each coverage arm`,
);
for (const key of ["informativeGens", "k1gens", "everK1"]) {
  console.log(`  [${key}]`);
  for (const k of [Q25, Q50, Q69, Q85, CLIP])
    report(`  flat -> ${LABEL.get(k)}`, pairOn(RUNS[FLAT], RUNS[k]), key);
}

/* ========================== SECONDARY 6 — the collider, printed and disarmed */
console.log(
  `\nSECONDARY 6 — ⚠️ COLLIDER-CONDITIONED, CANNOT CHANGE ANY VERDICT ABOVE`,
);
console.log(
  `  #62's registered primary: minMothered among generations at k=1. #63 showed\n` +
    `  this statistic INVERTS — same arm, same seeds, +9.247 [7.069, 11.519]\n` +
    `  against an unconditional −0.138 [−0.257, −0.018]. Conditioning on k=1\n` +
    `  selects generations where the minority still EXISTS, so runs whose lottery\n` +
    `  lost are already extinct and never counted. Carried only to see whether\n` +
    `  the inversion recurs on a second, independent treatment.`,
);
console.log(
  `\n              arm       mean minMothered   share mothering nothing   gens   seeds`,
);
for (const k of CELLS) {
  const vals = [];
  const seeds = new Set();
  for (const r of C[k])
    for (const row of r.rows) {
      if (!row.informative || row.k !== 1 || row.minMothered == null) continue;
      vals.push(row.minMothered);
      seeds.add(r.seed);
    }
  const zero = vals.filter((x) => x === 0).length;
  console.log(
    `              ${LABEL.get(k).padEnd(9)} ${f(mean(vals))}` +
      `              ${f(vals.length ? zero / vals.length : null)}` +
      `                   ${String(vals.length).padStart(4)}   ${String(seeds.size).padStart(4)}`,
  );
}

/* --------------------------------------------------------------- verdict */
console.log(
  `\n${failed ? `⚠️  ${failed} CONTROL(S) FAILED — the numbers above are not trustworthy` : "all controls passed"}`,
);
process.exit(failed ? 3 : 0);
