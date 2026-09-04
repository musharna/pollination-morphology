/*
 * #62 — DOES THE SHAPE OF THE SELFING FLOOR MATTER, OR ONLY ITS SIZE?
 *
 * Registered in docs/2026-09-04-selfing-dose-prereg.md before the sweep ran.
 *
 * Two cells at N0=30, rate 2.0, differing only in how the maternal assurance is
 * distributed: 30:R200 spends it as one shared scalar (rate x mean(received)),
 * 30:R200d spends it in proportion to each plant's own self-pollen. They spend
 * the SAME TOTAL per generation by construction (sim/ibm.js, C-match).
 *
 *   RF_SEEDS=120 RF_CONFIGS=30:R200,30:R200d RF_DUMP=x.json node experiments/rare-floor.js
 *   node experiments/selfing-dose.js x.json
 *
 * exit 0 reported · 2 bad input · 3 a control FAILED
 */
const fs = require("node:fs");
const zlib = require("node:zlib");

const path = process.argv[2] || "_scratch/rf62-sweep.json";
if (!fs.existsSync(path)) {
  console.error(`no sweep at ${path} — run rare-floor.js with RF_DUMP first`);
  process.exit(2);
}
const raw = path.endsWith(".gz")
  ? zlib.gunzipSync(fs.readFileSync(path))
  : fs.readFileSync(path);
const doc = JSON.parse(raw.toString("utf8"));

const FLAT = "30:R200",
  DOSE = "30:R200d";
for (const k of [FLAT, DOSE])
  if (!doc.cells[k] || !doc.cells[k].length) {
    console.error(
      `sweep has no cell ${k} — has: ${Object.keys(doc.cells)
        .filter((c) => doc.cells[c].length)
        .join(", ")}`,
    );
    process.exit(2);
  }
const flat = doc.cells[FLAT],
  dose = doc.cells[DOSE];

let failed = 0;
const fail = (msg) => {
  console.log(`  ⚠️  ${msg}`);
  failed++;
};

/* ---------------------------------------------------------------- helpers */
const mean = (x) => (x.length ? x.reduce((a, b) => a + b, 0) / x.length : null);
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
 * ⚠️ BOOTSTRAP OVER SEEDS, PAIRED. A seed is one trajectory and its generations
 * are not independent draws, so resampling generations would understate the
 * spread — the #55 lesson. The two arms share founding populations seed for
 * seed, so the pairing removes founding variance; it is NOT the shared-rng
 * pairing that decayed in #45, because the streams desync the moment the arms
 * diverge and nothing here assumes they do not. Unpaired is reported beside it.
 */
function bootDiff(pairs, nb = 2000) {
  const rnd = mulberry32(20260904);
  const out = [];
  for (let b = 0; b < nb; b++) {
    let a = 0,
      c = 0,
      n = 0;
    for (let i = 0; i < pairs.length; i++) {
      const p = pairs[(rnd() * pairs.length) | 0];
      a += p[0];
      c += p[1];
      n++;
    }
    if (n) out.push(c / n - a / n);
  }
  return out;
}

/* ------------------------------------------------- C-MATCH, on the real data */
console.log(`#62 — dose vs flat selfing floor, N0=30 rate 2.0`);
console.log(`  ${FLAT}: ${flat.length} runs   ${DOSE}: ${dose.length} runs\n`);

console.log(`CONTROLS`);
{
  /*
   * ⚠️ WHY ONLY GENERATION 0. C-match is a WITHIN-generation identity: given the
   * same population and the same transfer matrix, the two rules spend the same
   * total. At g=0 the arms share a founding population and an rng state, so the
   * totals must be identical. From g=1 the dose arm has changed WHO reproduced,
   * so the populations genuinely differ and the totals legitimately differ too —
   * demanding equality there would be demanding the intervention do nothing.
   * The per-generation identity is asserted on fixed populations in
   * tests/selfing-dose.test.js; this is the same control on the shipped sweep.
   */
  const bySeed = new Map(dose.map((r) => [r.seed, r]));
  let checked = 0,
    bad = 0,
    worst = 0;
  for (const f of flat) {
    const d = bySeed.get(f.seed);
    if (!d || !f.rows.length || !d.rows.length) continue;
    const a = f.rows[0].selfWTot,
      b = d.rows[0].selfWTot;
    if (a == null || b == null) continue;
    checked++;
    const rel = Math.abs(a - b) / Math.max(1, Math.abs(a));
    if (rel > worst) worst = rel;
    if (rel > 1e-9) bad++;
  }
  if (!checked)
    fail(
      `C-match: no generation-0 rows carried selfWTot — the control did not run`,
    );
  else if (bad)
    fail(
      `C-match FAILED on ${bad}/${checked} seeds (worst relative gap ${worst.toExponential(2)}) — ` +
        `the arms do NOT spend the same assurance, so this compares AMOUNT, not shape`,
    );
  else
    console.log(
      `  C-match  g=0 total assurance identical across arms: PASS (${checked} seeds, worst ${worst.toExponential(2)})`,
    );
}

/* C10 — both arms must actually self, or a null here is about nothing */
for (const [name, runs] of [
  ["flat", flat],
  ["dose", dose],
]) {
  let selfed = 0,
    matings = 0;
  for (const r of runs)
    for (const row of r.rows) {
      selfed += row.selfedN || 0;
      matings += row.matingsN || 0;
    }
  const share = matings ? selfed / matings : null;
  if (!share)
    fail(`C10: the ${name} arm recorded no selfed matings — it is not selfing`);
  else
    console.log(
      `  C10      ${name} selfed share of matings: ${(share * 100).toFixed(1)}%`,
    );
}

/* ------------------------------------------------------- PRIMARY: k=1 floor */
const k1 = (runs) => {
  const bySeed = new Map();
  for (const r of runs) {
    const v = [];
    for (const row of r.rows)
      if (row.informative && row.k === 1 && row.minMothered != null)
        v.push(row.minMothered);
    if (v.length) bySeed.set(r.seed, v);
  }
  return bySeed;
};
const kf = k1(flat),
  kd = k1(dose);

console.log(`\nPRIMARY — does the lone minority plant mother anything?`);
const line = (name, m) => {
  const gens = [...m.values()].flat();
  console.log(
    `  ${name.padEnd(5)} k=1 generations ${String(gens.length).padStart(3)} over ${String(m.size).padStart(3)} seeds   ` +
      `mean minMothered ${gens.length ? mean(gens).toFixed(4) : "  —   "}   ` +
      `share zero ${gens.length ? (gens.filter((x) => x === 0).length / gens.length).toFixed(3) : " — "}`,
  );
  return gens;
};
const gf = line("flat", kf),
  gd = line("dose", kd);

/* paired on the seeds that reach k=1 in BOTH arms */
const shared = [...kf.keys()].filter((s) => kd.has(s));
if (shared.length < 5) {
  console.log(
    `\n  only ${shared.length} seeds reach k=1 in both arms — TOO THIN to difference, reported as such`,
  );
} else {
  const pairs = shared.map((s) => [mean(kf.get(s)), mean(kd.get(s))]);
  const d = bootDiff(pairs);
  const pt = mean(pairs.map((p) => p[1] - p[0]));
  console.log(
    `\n  paired difference (dose - flat) over ${shared.length} shared seeds: ` +
      `${pt.toFixed(4)} [${quant(d, 0.025).toFixed(4)}, ${quant(d, 0.975).toFixed(4)}]`,
  );
  const lo = quant(d, 0.025),
    hi = quant(d, 0.975);
  console.log(
    `  REGISTERED READING: ${lo <= 0 && hi >= 0 ? "CI includes zero -> H2 (shape does not matter)" : pt > 0 ? "CI excludes zero, positive -> H1 (rare-favouring)" : "CI excludes zero, negative -> H3 (rich-get-richer)"}`,
  );
}

/* ------------------------------------------------------------------- HELD */
console.log(`\nSECONDARY — coexistence`);
const held = (runs) => runs.map((r) => (r.fate === "HELD" ? 1 : 0));
const hf = held(flat),
  hd = held(dose);
console.log(
  `  flat HELD ${mean(hf).toFixed(3)} (${flat.length} runs)   dose HELD ${mean(hd).toFixed(3)} (${dose.length} runs)`,
);
{
  const bySeed = new Map(dose.map((r) => [r.seed, r.fate === "HELD" ? 1 : 0]));
  const pairs = flat
    .filter((r) => bySeed.has(r.seed))
    .map((r) => [r.fate === "HELD" ? 1 : 0, bySeed.get(r.seed)]);
  if (pairs.length >= 5) {
    const d = bootDiff(pairs);
    console.log(
      `  paired difference (dose - flat) over ${pairs.length} seeds: ` +
        `${mean(pairs.map((p) => p[1] - p[0])).toFixed(4)} [${quant(d, 0.025).toFixed(4)}, ${quant(d, 0.975).toFixed(4)}]`,
    );
  }
}

console.log(
  `\n${failed ? `${failed} CONTROL(S) FAILED — the numbers above do not mean what they say` : "all controls passed"}`,
);
process.exit(failed ? 3 : 0);
