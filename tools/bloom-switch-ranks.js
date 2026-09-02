/*
 * bloom-switch-ranks.js — the rank companions registered in amendment A9 of
 * docs/2026-09-02-bloom-switch-prereg.md.
 *
 * WHY THIS EXISTS. #54's per-seed `Δ` is heavy-tailed: A1 divides a within-seed
 * numerator by an across-seed denominator, so a seed whose own A-vs-B separation
 * is far from average over- or under-shoots badly. The pilot measured sd 1.115 on
 * a statistic whose across-seed mean lives near zero. A t interval assumes tails
 * that quantity does not have, so a Wilcoxon signed-rank and a sign test are
 * reported beside it — same question, no assumption about tail shape.
 *
 * It reads the per-seed JSON dump rather than re-simulating, so it runs on
 * EXACTLY the trajectories that produced the published numbers.
 *
 * ⚠️⚠️ THIS IS A SECOND IMPLEMENTATION OF THE GAP ARITHMETIC, which is how this
 * project has been bitten before — task #43, a predicate corrected in one copy
 * while the other kept reporting the old answer. So it does not merely compute:
 * it takes the experiment's OWN PRINTED Δ as an argument and refuses to report
 * anything if the two disagree. A duplicated formula with an exact-agreement
 * gate is a duplicated formula that cannot silently drift.
 *
 *   node tools/bloom-switch-ranks.js _scratch/bloom-switch-data.json <k> [expectedDelta]
 */
const fs = require("node:fs");

const DENOM_FLOOR = 0.05;
const MIN_ADMISSIBLE = 5;

const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

const path = process.argv[2] || "_scratch/bloom-switch-data.json";
const K = Number(process.argv[3]);
const EXPECTED = process.argv[4] == null ? null : Number(process.argv[4]);

const data = JSON.parse(fs.readFileSync(path, "utf8"));
const { GENS } = data.config;
const arms = data.arms;
const A = arms[String(GENS)];
const B = arms[String(0)];
const S = arms[String(K)];
if (!A || !B || !S) {
  console.error(
    `no arm for k=${K} in ${path}; arms present: ${Object.keys(arms).join(", ")}`,
  );
  process.exit(2);
}

/* the across-seed A→B scale, exactly as the experiment computes it */
const meanAt = (rows, field, g) => {
  const xs = [];
  for (const r of rows)
    if (r[field].length > g && r[field][g] != null) xs.push(r[field][g]);
  return xs.length ? mean(xs) : null;
};
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
const adm = [];
for (let g = K; g < GENS; g++)
  if (
    SCALE[g].dv != null &&
    SCALE[g].dr != null &&
    Math.abs(SCALE[g].dv) >= DENOM_FLOOR &&
    Math.abs(SCALE[g].dr) >= DENOM_FLOOR
  )
    adm.push(g);

const deltas = [];
for (let i = 0; i < S.length; i++) {
  const r = S[i],
    a = A[i];
  const ag = [],
    pg = [];
  for (const g of adm) {
    if (r.v.length <= g || a.v.length <= g) continue;
    if (r.v[g] == null || r.R1[g] == null) continue;
    if (a.v[g] == null || a.R1[g] == null) continue;
    ag.push((r.v[g] - a.v[g]) / SCALE[g].dv);
    pg.push((r.R1[g] - a.R1[g]) / SCALE[g].dr);
  }
  if (ag.length < MIN_ADMISSIBLE) continue;
  deltas.push(mean(ag) - mean(pg));
}

const n = deltas.length;
const m = mean(deltas);

/* ⚠️ THE AGREEMENT GATE, BEFORE ANY RANK STATISTIC IS PRINTED. */
if (EXPECTED != null) {
  const off = Math.abs(m - EXPECTED);
  if (off > 0.0005) {
    console.error(
      `DISAGREEMENT: this file computes Δ=${m.toFixed(4)} but the run printed ` +
        `${EXPECTED.toFixed(4)} (off by ${off.toFixed(4)}). The two implementations ` +
        `of the gap arithmetic have drifted; nothing is reported.`,
    );
    process.exit(3);
  }
  console.log(
    `agreement gate: Δ=${m.toFixed(4)} matches the run's printed ${EXPECTED.toFixed(4)}  PASS`,
  );
}

/* ---- Wilcoxon signed-rank, normal approximation with tie correction ---- */
function wilcoxon(xs) {
  const nz = xs.filter((x) => x !== 0);
  const N = nz.length;
  if (N < 6) return null;
  const byAbs = nz
    .map((x, i) => ({ x, a: Math.abs(x), i }))
    .sort((p, q) => p.a - q.a);
  /* average ranks within ties */
  let i = 0;
  const rank = new Array(N);
  let tieSum = 0;
  while (i < N) {
    let j = i;
    while (j + 1 < N && byAbs[j + 1].a === byAbs[i].a) j++;
    const r = (i + j + 2) / 2;
    const t = j - i + 1;
    if (t > 1) tieSum += t * t * t - t;
    for (let q = i; q <= j; q++) rank[q] = r;
    i = j + 1;
  }
  let Wp = 0;
  for (let q = 0; q < N; q++) if (byAbs[q].x > 0) Wp += rank[q];
  const mu = (N * (N + 1)) / 4;
  const sig = Math.sqrt((N * (N + 1) * (2 * N + 1)) / 24 - tieSum / 48);
  const z = sig > 0 ? (Wp - mu) / sig : 0;
  return { N, W: Wp, z, p: 2 * (1 - normCdf(Math.abs(z))) };
}

function normCdf(z) {
  /* Abramowitz & Stegun 7.1.26 on erf */
  const t = 1 / (1 + 0.3275911 * (z / Math.SQRT2));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp((-z * z) / 2);
  return 0.5 * (1 + y);
}

/* ---- sign test, exact two-sided binomial ---- */
function signTest(xs) {
  const pos = xs.filter((x) => x > 0).length;
  const neg = xs.filter((x) => x < 0).length;
  const N = pos + neg;
  if (!N) return null;
  const lc = (k, nn) => {
    let s = 0;
    for (let q = 0; q < k; q++) s += Math.log(nn - q) - Math.log(q + 1);
    return s;
  };
  let tail = 0;
  const lo = Math.min(pos, neg);
  for (let k = 0; k <= lo; k++) tail += Math.exp(lc(k, N) - N * Math.LN2);
  return { N, pos, neg, p: Math.min(1, 2 * tail) };
}

const w = wilcoxon(deltas);
const s = signTest(deltas);

console.log(`\nbloom-switch rank companions — k=${K}, ${path}`);
console.log(
  `  admissible generations: ${adm.length} (${adm[0]}..${adm[adm.length - 1]})`,
);
console.log(`  seeds: ${n}`);
console.log(`  mean Δ  : ${m.toFixed(4)}`);
const sorted = deltas.slice().sort((a, b) => a - b);
const med =
  n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
console.log(`  median Δ: ${med.toFixed(4)}`);
console.log(
  `  Wilcoxon signed-rank: ${w ? `N=${w.N} z=${w.z.toFixed(3)} p=${w.p.toFixed(4)}` : "—"}`,
);
console.log(
  `  sign test           : ${s ? `${s.pos}+ / ${s.neg}- of ${s.N}, p=${s.p.toFixed(4)}` : "—"}`,
);
console.log(
  `\n  A9 reading: the t interval remains primary. If these DISAGREE with it in\n` +
    `  direction or significance, the result is estimator-dependent and no branch\n` +
    `  is claimed — a verdict that depends on which summary of the same numbers is\n` +
    `  used has not been measured.`,
);
