/*
 * #61 — WHAT IS THE k = 1 WALL MADE OF?
 *
 * Registered in docs/2026-09-04-k1-wall-prereg.md. A re-analysis of #58/#59's
 * archives; no new simulation.
 *
 * THE DISCONTINUITY. #56 measured per-capita fitness 0.000 / 0.734 / 1.646 at
 * k = 1 / 2 / 3. #60 added that from k = 2 the minority recovers to k >= 3 about
 * 30% of the time IN EVERY ARM INCLUDING THE ONE WITH NO SELFING (0.298
 * [0.175, 0.419]), while from k = 1 arm A recovers 0.000 on 23 lone-generations
 * across 23 distinct seeds. k = 2 is an ordinary state; k = 1 is an exact zero.
 * That is a wall, and nothing so far has said what it is made of.
 *
 * THREE HYPOTHESES, committed at 36fae2b before this data was touched:
 *   H1 NEVER POLLINATED   — she is never drawn as a mother. minMothered = 0.
 *   H2 DEFINITIONALLY HYBRIDISED — she mothers fine, but her only sires carry a
 *      different `anc`, so every offspring is scored a hybrid BY THE AVERAGING
 *      RULE. minMothered > 0, hybrids rise.
 *   H3 DEMOGRAPHIC       — she mothers pure offspring that never compound.
 *
 * ⚠️ P1, registered from the source in advance: outcrossed offspring take
 * anc = (anc_m + anc_f)/2 (sim/ibm.js:2015), a selfed seed takes anc_mother
 * EXACTLY (sim/ibm.js:1952), and label() is pure only at exactly 0 or 1
 * (rare-floor.js:74-78). So at k = 1 the lone plant is the only carrier of her
 * value and NO assignment of fathers yields a pure offspring. A pure lineage
 * needs TWO pure parents. ⚠️ But P1 says what CANNOT happen; it does not
 * establish that the thing that fails is the thing it forbids. If minMothered
 * is 0, H1 is the mechanism and P1 is vacuous — the prereg fixes that in
 * advance so the arithmetic cannot claim a win it did not earn.
 *
 *   node experiments/k1-wall.js
 */
const fs = require("node:fs");
const zlib = require("node:zlib");

function load(path) {
  const raw = path.endsWith(".gz")
    ? zlib.gunzipSync(fs.readFileSync(path))
    : fs.readFileSync(path);
  return JSON.parse(raw.toString("utf8"));
}

const D = "docs/data/";
const CELLS = [
  ["arm A (no selfing)", `${D}2026-09-03-selfing-rate-r000.json.gz`, "30:A"],
  ["rate 2.0 cost 0.00", `${D}2026-09-03-selfing-cost-c000.json.gz`, "30:R200"],
  [
    "rate 2.0 cost 0.25",
    `${D}2026-09-03-selfing-cost-c025.json.gz`,
    "30:R200c25",
  ],
  [
    "rate 2.0 cost 0.50",
    `${D}2026-09-03-selfing-cost-c050.json.gz`,
    "30:R200c50",
  ],
  [
    "rate 2.0 cost 0.75",
    `${D}2026-09-03-selfing-cost-c075.json.gz`,
    "30:R200c75",
  ],
  [
    "rate 2.0 cost 0.95",
    `${D}2026-09-03-selfing-cost-c095.json.gz`,
    "30:R200c95",
  ],
];

/* mulberry32 — NOT an LCG (#55's bootstrap did not contain its own estimate) */
function mb32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
const qq = (xs, q) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const i = (s.length - 1) * q;
  const lo = Math.floor(i),
    hi = Math.ceil(i);
  return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (i - lo);
};

/* bootstrap over SEEDS — generations within a run are not independent, and this
 * arc has been burned by forgetting that */
function bootBySeed(bySeed, stat, B = 2000, seed = 12345) {
  const seeds = [...bySeed.keys()];
  if (!seeds.length) return [NaN, NaN];
  const rng = mb32(seed);
  const out = [];
  for (let b = 0; b < B; b++) {
    const pool = [];
    for (let i = 0; i < seeds.length; i++)
      pool.push(...bySeed.get(seeds[Math.floor(rng() * seeds.length)]));
    out.push(stat(pool));
  }
  return [qq(out, 0.025), qq(out, 0.975)];
}

/*
 * THE CONDITIONING SET, defined ONCE on the PURE labels and held fixed across
 * every arm and convention — #60's handling of the same reflexivity. A k = 1
 * generation is defined by the pure labels, so if H2 holds the conditioning set
 * is shaped by the thing under test; nothing below re-conditions on a quantity
 * downstream of the hypothesis.
 */
function episodes(runs, K) {
  const out = [];
  for (const run of runs) {
    const rows = run.rows;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.informative || r.k !== K) continue;
      const minorIs0 = r.n0 < r.n1;
      const nx = rows[i + 1] || null;
      out.push({
        seed: run.seed,
        r,
        minorIs0,
        next: nx,
        nextPure: nx ? (minorIs0 ? nx.n0 : nx.n1) : null,
        nextHyb: nx ? nx.nh : null,
      });
    }
  }
  return out;
}

const bySeedOf = (eps, f) => {
  const m = new Map();
  for (const e of eps) {
    if (!m.has(e.seed)) m.set(e.seed, []);
    m.get(e.seed).push(f(e));
  }
  return m;
};

console.log("#61 — WHAT IS THE k = 1 WALL MADE OF?");
console.log("=".repeat(78));

const loaded = CELLS.map(([name, file, key]) => {
  const runs = load(file).cells[key];
  if (!runs) throw new Error(`missing cell ${key} in ${file}`);
  return { name, runs, k1: episodes(runs, 1), k2: episodes(runs, 2) };
});

/* ------------------------------------------------------------------ */
console.log("\nTHE PRIMARY DISCRIMINATOR — does she reproduce at all?");
console.log("`minMothered` is the ABSOLUTE count of matings with a minority");
console.log(
  "mother (rare-floor.js:252), built by #57 for exactly this question.\n",
);
console.log(
  "cell                | n(k=1) | seeds | share with minMothered=0 [95% CI]  | mean mothered",
);
console.log("-".repeat(96));
for (const c of loaded) {
  const eps = c.k1.filter((e) => e.r.minMothered != null);
  const bs = bySeedOf(eps, (e) => (e.r.minMothered === 0 ? 1 : 0));
  const share = mean(eps.map((e) => (e.r.minMothered === 0 ? 1 : 0)));
  const [lo, hi] = bootBySeed(bs, mean);
  const mm = mean(eps.map((e) => e.r.minMothered));
  console.log(
    `${c.name.padEnd(19)} | ${String(eps.length).padStart(6)} | ` +
      `${String(new Set(eps.map((e) => e.seed)).size).padStart(5)} | ` +
      `${share.toFixed(3)} [${lo.toFixed(3)}, ${hi.toFixed(3)}]`.padEnd(34) +
      ` | ${mm.toFixed(3)}`,
  );
}

/* ------------------------------------------------------------------ */
console.log("\nTHE SAME QUANTITY AT k = 2 — the state that DOES escape (~30%)");
console.log(
  "cell                | n(k=2) | seeds | share with minMothered=0 | mean mothered | per plant",
);
console.log("-".repeat(96));
for (const c of loaded) {
  const eps = c.k2.filter((e) => e.r.minMothered != null);
  const share = mean(eps.map((e) => (e.r.minMothered === 0 ? 1 : 0)));
  const mm = mean(eps.map((e) => e.r.minMothered));
  console.log(
    `${c.name.padEnd(19)} | ${String(eps.length).padStart(6)} | ` +
      `${String(new Set(eps.map((e) => e.seed)).size).padStart(5)} | ` +
      `${share.toFixed(3)}`.padEnd(25) +
      ` | ${mm.toFixed(3)}`.padEnd(15) +
      ` | ${(mm / 2).toFixed(3)}`,
  );
}

/* ------------------------------------------------------------------ */
console.log("\nH2's OWN SIGNATURE — do hybrids appear when she is alone?");
console.log("If she mothers offspring that are scored hybrid by the averaging");
console.log(
  "rule, the hybrid count must MOVE. nh is the whole population's.\n",
);
console.log(
  "cell                | mean nh at k=1 | mean nh next gen | max nh at k=1 | gens with nh>0",
);
console.log("-".repeat(96));
for (const c of loaded) {
  const eps = c.k1;
  const nh = eps.map((e) => e.r.nh);
  const nhn = eps.filter((e) => e.next).map((e) => e.nextHyb);
  console.log(
    `${c.name.padEnd(19)} | ${mean(nh).toFixed(3)}`.padEnd(37) +
      ` | ${mean(nhn).toFixed(3)}`.padEnd(19) +
      ` | ${Math.max(...nh, 0)}`.padEnd(16) +
      ` | ${nh.filter((x) => x > 0).length}/${nh.length}`,
  );
}

/* ------------------------------------------------------------------ */
console.log(
  "\nWHAT ACTUALLY HAPPENS NEXT — pure minority count one generation on",
);
console.log(
  "cell                | n | ->0    | ->1    | ->2    | ->3+   | mean next pure",
);
console.log("-".repeat(96));
for (const c of loaded) {
  const eps = c.k1.filter((e) => e.next);
  const b = [0, 0, 0, 0];
  for (const e of eps) b[Math.min(e.nextPure, 3)]++;
  const n = eps.length || 1;
  console.log(
    `${c.name.padEnd(19)} | ${String(eps.length).padStart(3)} | ` +
      b.map((x) => `${(x / n).toFixed(3)}`).join("  ") +
      `  | ${mean(eps.map((e) => e.nextPure)).toFixed(3)}`,
  );
}

/* ------------------------------------------------------------------ */
console.log("\nC-ARITY — the control that can FALSIFY P1");
console.log(
  "P1 says a pure offspring needs two pure parents. If pure minority",
);
console.log(
  "offspring never appear at k = 2 either, the arity story is wrong.\n",
);
console.log(
  "cell                | from k=2: share ->0 | ->2+ | mean next pure",
);
console.log("-".repeat(96));
for (const c of loaded) {
  const eps = c.k2.filter((e) => e.next);
  const n = eps.length || 1;
  const z = eps.filter((e) => e.nextPure === 0).length / n;
  const up = eps.filter((e) => e.nextPure >= 2).length / n;
  console.log(
    `${c.name.padEnd(19)} | ${z.toFixed(3)}`.padEnd(42) +
      ` | ${up.toFixed(3)}` +
      ` | ${mean(eps.map((e) => e.nextPure)).toFixed(3)}`,
  );
}

/* ------------------------------------------------------------------ */
console.log("\nWHAT SHE RECEIVES — H1's own prediction");
console.log("selfShare is self/(self + conspecific outcross). At k=1 the");
console.log("conspecific-outcross term is structurally 0, so a non-null value");
console.log(
  "means self-pollen receipt > 0 and a null means she received NOTHING",
);
console.log(
  "of either kind. consPC is conspecific outcross pollen per plant.\n",
);
console.log(
  "cell                | n | selfShare non-null | mean consPC | mean matings | mean selfed",
);
console.log("-".repeat(96));
for (const c of loaded) {
  const eps = c.k1;
  const nn = eps.filter((e) => e.r.selfShare != null).length;
  console.log(
    `${c.name.padEnd(19)} | ${String(eps.length).padStart(3)} | ` +
      `${nn}/${eps.length}`.padEnd(19) +
      ` | ${mean(eps.map((e) => e.r.consPC)).toFixed(3)}`.padEnd(14) +
      ` | ${mean(eps.map((e) => e.r.matingsN)).toFixed(2)}`.padEnd(15) +
      ` | ${mean(eps.map((e) => e.r.selfedN)).toFixed(3)}`,
  );
}

/* ------------------------------------------------------------------ */
/*
 * ⚠️ THE NULL FOR "NO HYBRIDS AT k = 1". Arm A shows nh = 0 in all 23 of its
 * k = 1 generations, which LOOKS like reproductive isolation making a sire
 * impossible. It is not evidence of that: cross-lineage mating does happen in
 * arm A, just rarely. Against the arm's OWN base rate the expected count in 23
 * draws is well under one, so zero is exactly what chance predicts and the
 * observation carries no mechanism. Printed so the reader can see the null
 * rather than take the zero at face value.
 */
console.log("\nTHE BASE RATE — is 'no hybrids at k=1' surprising? (it is not)");
console.log(
  "cell                | rows | rows nh>0 | base rate | n(k=1) | expected | observed",
);
console.log("-".repeat(96));
for (const c of loaded) {
  let rows = 0,
    pos = 0;
  for (const run of c.runs)
    for (const r of run.rows) {
      rows++;
      if (r.nh > 0) pos++;
    }
  const base = pos / rows;
  const obs = c.k1.filter((e) => e.r.nh > 0).length;
  console.log(
    `${c.name.padEnd(19)} | ${String(rows).padStart(4)} | ${String(pos).padStart(9)} | ` +
      `${base.toFixed(4)}`.padStart(9) +
      ` | ${String(c.k1.length).padStart(6)} | ${(base * c.k1.length).toFixed(2)}`.padEnd(
        12,
      ) +
      ` | ${obs}`,
  );
}

/* ------------------------------------------------------------------ */
/*
 * THE INHERITED OPEN QUESTION from #59/#60: lone-generation counts RISE then
 * FALL with cost (23 / 69 / 91 / 74 / 49 / 40) and #59's registered prediction
 * that they would fall monotonically was falsified and left unexplained. The
 * primary above supplies the missing piece: the count is a DWELL TIME, and
 * dwell is geometric in P(k=1 -> k=1), which selfing raises and cost lowers.
 *
 * ⚠️ P(stay) must NOT be conditioned on the next row being informative — an
 * exit makes it non-informative, so that conditions on SURVIVAL and the
 * no-selfing arm (which always exits) drops out entirely. Read the PURE count.
 */
console.log(
  "\nTHE INHERITED PUZZLE — why lone-generation counts rise then fall",
);
console.log(
  "cell                | k=1 gens | episodes | P(k=1->k=1) | dwell | 1/(1-p)",
);
console.log("-".repeat(96));
const P = [],
  K = [];
for (const c of loaded) {
  let entries = 0,
    stay = 0,
    withNext = 0;
  for (const run of c.runs) {
    const R = run.rows;
    for (let i = 0; i < R.length; i++) {
      if (!R[i].informative || R[i].k !== 1) continue;
      const prev = R[i - 1];
      if (!(prev && prev.informative && prev.k === 1)) entries++;
      const nx = R[i + 1];
      if (nx) {
        withNext++;
        if ((R[i].n0 < R[i].n1 ? nx.n0 : nx.n1) === 1) stay++;
      }
    }
  }
  const p = stay / withNext;
  P.push(p);
  K.push(c.k1.length);
  console.log(
    `${c.name.padEnd(19)} | ${String(c.k1.length).padStart(8)} | ${String(entries).padStart(8)} | ` +
      `${p.toFixed(3)}`.padStart(11) +
      ` | ${(c.k1.length / entries).toFixed(3)}`.padEnd(8) +
      ` | ${(1 / (1 - p)).toFixed(3)}`,
  );
}
{
  const m = (x) => x.reduce((s, v) => s + v, 0) / x.length;
  const ma = m(P),
    mb = m(K);
  let sab = 0,
    saa = 0,
    sbb = 0;
  for (let i = 0; i < P.length; i++) {
    sab += (P[i] - ma) * (K[i] - mb);
    saa += (P[i] - ma) ** 2;
    sbb += (K[i] - mb) ** 2;
  }
  console.log(
    `\ncorr( P(stay at k=1), lone-generation count ) = ${(sab / Math.sqrt(saa * sbb)).toFixed(4)}` +
      `  ⚠️ n = 6 CELLS, not seeds — descriptive, no interval, and it cannot be`,
  );
  console.log(
    "   promoted to an inferential claim without a seed-level design.",
  );
}
