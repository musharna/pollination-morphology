/*
 * #56 — IS THE RARE-LINEAGE FLOOR A COUNT OR A FREQUENCY?
 *
 * Registered in docs/2026-09-03-rare-floor-prereg.md before this ran.
 *
 * #55 found that the premium's rare-lineage VISIT advantage (3.52x below
 * minority frequency 0.1) fails to become offspring exactly where it is largest
 * (fitness 0.477 there). Mate finding is the candidate, and at N0=30 it could
 * not be tested because a minority FREQUENCY of 0.1 IS a minority COUNT of 3.
 *
 * Varying N0 separates them, and the predictions are opposite in p and identical
 * in k. Per-plant pollinator service is held constant with `visitsPerPlant`,
 * which is a verified no-op at N0=30 — so that arm is a byte-level anchor to
 * #55 — and verified live elsewhere.
 *
 *   RF_SEEDS=40 RF_CONFIGS=30:A node experiments/rare-floor.js
 *   RF_FROM=a.json,b.json node experiments/rare-floor.js     re-report, no re-sim
 */
const I = require("../sim/ibm.js");
const E = require("../sim/evolve.js");
const fs = require("node:fs");

const SITE_N = 160,
  D_EXCL = 8,
  SLICES = 8,
  WIDTH = 0.12;
const VPP = 800; /* per-plant service; 800*30 === the 24000 total #52-#55 used */
const N_SEEDS = Number(process.env.RF_SEEDS || 40);
const DUMP = process.env.RF_DUMP || null;
const FROM = process.env.RF_FROM || null;
const REPRO_SEEDS = 40;

/* generations scale with N0 so drift time is comparable in units of population
 * size; 35 at N0=30 keeps the anchor exactly as #55 ran it */
const gensFor = (N0) => Math.round((35 * N0) / 30);

const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
const sd = (xs) => {
  if (xs.length < 2) return null;
  const m = mean(xs);
  return Math.sqrt(
    xs.reduce((a, b) => a + (b - m) * (b - m), 0) / (xs.length - 1),
  );
};
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

/* lineage label; anything strictly between 0 and 1 is a hybrid and is counted
 * separately rather than rounded into a side */
function label(x) {
  const a = x.anc || 0;
  if (a === 0) return 0;
  if (a === 1) return 1;
  return -1;
}

function replicate(seed, N0, arm) {
  const GENS = gensFor(N0);
  const rng = E.makeRng(seed);
  const srng = I.signalRng(seed);
  const brng = I.bloomRng(seed);
  const phen = { slices: SLICES, width: WIDTH };
  const opts = {
    ...I.DEFAULTS,
    siteN: SITE_N,
    phenology: phen,
    visitsPerPlant: VPP,
  };
  /* Bx: arm B handed enough extra budget that its realised SPEND matches arm
   * A's. ⚠️ NOT a "budget-matched" arm in the sense #55's limitation described —
   * both arms were always GIVEN the same budget; they differ in how much of it
   * the allocation rule CONSUMES. */
  if (arm === "Bx") opts.visitsPerPlant = VPP * 1.574;
  const built = I.foundTwoLineages(N0, rng, srng, D_EXCL, opts);
  if (!built) return null;

  let pop = built.pop;
  const ancVar0 = I.ancestryVar(pop);
  const rows = [];
  let extinct = false;

  for (let g = 0; g < GENS; g++) {
    if (pop.length < 2) {
      extinct = true;
      break;
    }
    phen.displayProportionalVisits = arm === "B" || arm === "Bx";

    const labels = pop.map(label);
    let n0 = 0,
      n1 = 0,
      nh = 0;
    for (const L of labels) {
      if (L === 0) n0++;
      else if (L === 1) n1++;
      else nh++;
    }

    const res = I.step(pop, opts, rng, g, srng, brng);

    const informative = n0 > 0 && n1 > 0;
    let k = null,
      p = null,
      r = null,
      w = null,
      selfShare = null,
      consPC = null,
      minorIs0 = null;
    if (informative) {
      minorIs0 = n0 < n1;
      const nMin = minorIs0 ? n0 : n1;
      const nMaj = minorIs0 ? n1 : n0;
      k = nMin;
      p = nMin / (nMin + nMaj);
      const minor = minorIs0 ? 0 : 1;

      if (res.visitsTo) {
        let vMin = 0,
          vMaj = 0;
        for (let i = 0; i < labels.length; i++) {
          if (labels[i] < 0) continue;
          if (labels[i] === minor) vMin += res.visitsTo[i];
          else vMaj += res.visitsTo[i];
        }
        const pcMaj = vMaj / nMaj;
        r = pcMaj > 0 ? vMin / nMin / pcMaj : null;
      }

      let o0 = 0,
        o1 = 0;
      for (const c of res.pop) {
        const L = label(c);
        if (L === 0) o0++;
        else if (L === 1) o1++;
      }
      const wMaj = (minorIs0 ? o1 : o0) / nMaj;
      w = wMaj > 0 ? (minorIs0 ? o0 : o1) / nMin / wMaj : null;

      /*
       * THE GEITONOGAMY MEASUREMENT. T has a diagonal and `received` skips it
       * (sim/ibm.js:1751, "selfing is not mating success"), so self-pollen is
       * separately visible. For the MINORITY lineage only: how much of what its
       * plants receive is their own pollen, and how much conspecific outcross
       * pollen does each of its plants get?
       */
      if (res.T) {
        let selfSum = 0,
          consSum = 0;
        for (let j = 0; j < labels.length; j++) {
          if (labels[j] !== minor) continue;
          selfSum += res.T[j][j];
          for (let i = 0; i < labels.length; i++) {
            if (i === j) continue;
            if (labels[i] === minor) consSum += res.T[i][j];
          }
        }
        const tot = selfSum + consSum;
        selfShare = tot > 0 ? selfSum / tot : null;
        consPC = consSum / nMin;
      }
    }

    /* the flat budget's lineage-free signature */
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

    rows.push({
      g,
      n0,
      n1,
      nh,
      informative,
      k,
      p,
      r,
      w,
      selfShare,
      consPC,
      crowdCorr,
      spent: res.visitsSpent,
    });
    pop = res.pop;
  }

  return {
    seed,
    N0,
    arm,
    rows,
    fate: I.fateOf(pop, ancVar0, extinct),
  };
}

/* --------------------------------------------------------------- run/load */
const N0S = [20, 30, 60];
const out = {}; /* key "N0:arm" -> [replicate] */
const keyOf = (N0, arm) => `${N0}:${arm}`;
const ALL = [];
for (const N0 of N0S) for (const arm of ["A", "B"]) ALL.push([N0, arm]);
ALL.push([30, "Bx"]);
for (const [N0, arm] of ALL) out[keyOf(N0, arm)] = [];

if (FROM) {
  for (const f of FROM.split(",")) {
    const loaded = JSON.parse(fs.readFileSync(f.trim(), "utf8"));
    for (const key of Object.keys(loaded.cells))
      if (loaded.cells[key].length)
        out[key] = (out[key] || []).concat(loaded.cells[key]);
  }
  process.stderr.write(
    `re-reporting from ${FROM}: ` +
      Object.entries(out)
        .filter(([, v]) => v.length)
        .map(([k, v]) => `${k}=${v.length}`)
        .join(" ") +
      `\n`,
  );
}

/* RF_CONFIGS picks which cells to simulate, e.g. "30:A" or "20:A,20:B". One cell
 * is a job; all seven together are not, on the evidence of #55's two kills. */
const WANT = process.env.RF_CONFIGS
  ? process.env.RF_CONFIGS.split(",").map((s) => s.trim())
  : ALL.map(([n, a]) => keyOf(n, a));

function writeDump(tag) {
  if (!DUMP) return;
  fs.writeFileSync(
    DUMP,
    JSON.stringify({
      config: { SITE_N, D_EXCL, SLICES, WIDTH, VPP, N_SEEDS, N0S },
      cells: out,
    }),
  );
  process.stderr.write(`  ${tag} dump updated: ${DUMP}\n`);
}

if (!FROM)
  for (const [N0, arm] of ALL) {
    const key = keyOf(N0, arm);
    if (!WANT.includes(key)) continue;
    out[key] = [];
    for (let s = 1; s <= N_SEEDS; s++) {
      const rep = replicate(s, N0, arm);
      if (rep) out[key].push(rep);
      process.stderr.write(
        `  [${key}] seed ${s}/${N_SEEDS} founded=${out[key].length}\n`,
      );
      if (s % 5 === 0) writeDump(`[${key}] seed ${s}:`);
    }
    writeDump(`[${key}] cell complete:`);
  }

/* ------------------------------------------------------------------ report */
const have = (key) => out[key] && out[key].length;
console.log(
  `\n#56 rare-floor — visitsPerPlant=${VPP}, cells: ` +
    ALL.map(([n, a]) => keyOf(n, a))
      .filter(have)
      .map((k) => `${k}(${out[k].length})`)
      .join(" ") +
    (FROM ? `  [re-reported]` : ``),
);
console.log(
  `generations: ` + N0S.map((n) => `N0=${n}->${gensFor(n)}`).join("  "),
);

/* ---- controls */
const HELD = (key) => {
  if (!have(key)) return null;
  const r = out[key].filter((x) => x.seed <= REPRO_SEEDS);
  return r.length ? r.filter((x) => x.fate === "HELD").length / r.length : null;
};
const heldA = HELD("30:A"),
  heldB = HELD("30:B");
const C1 = heldA != null && Math.abs(heldA - 0.289) < 0.0005;
const C2 = heldB != null && Math.abs(heldB - 0.026) < 0.0005;
console.log("\ncontrols");
console.log(
  `  C1 N0=30 arm A HELD = ${heldA != null ? heldA.toFixed(3) : "—"} vs 0.289   ${heldA == null ? "not run" : C1 ? "PASS" : "FAIL"}`,
);
console.log(
  `  C2 N0=30 arm B HELD = ${heldB != null ? heldB.toFixed(3) : "—"} vs 0.026   ${heldB == null ? "not run" : C2 ? "PASS" : "FAIL"}`,
);
let c5 = true;
for (const [N0, arm] of ALL) {
  const key = keyOf(N0, arm);
  if (!have(key)) continue;
  for (const rep of out[key])
    for (const row of rep.rows) if (row.n0 + row.n1 + row.nh !== N0) c5 = false;
}
console.log(
  `  C5 lineage counts exhaust the population: ${c5 ? "PASS" : "FAIL"}`,
);
console.log(
  "  C3 corr(slice crowding, visits) — negative under the premium, ~0 without",
);
for (const [N0, arm] of ALL) {
  const key = keyOf(N0, arm);
  if (!have(key)) continue;
  const xs = [];
  for (const rep of out[key])
    for (const row of rep.rows)
      if (row.crowdCorr != null) xs.push(row.crowdCorr);
  const m = mean(xs);
  console.log(
    `     ${key.padEnd(6)} ${m != null ? m.toFixed(3) : "—"}  (n=${xs.length} generations)`,
  );
}
console.log(
  `  C4 visits spent per generation (reported, not asserted — the allocation rule decides the SPEND)`,
);
for (const [N0, arm] of ALL) {
  const key = keyOf(N0, arm);
  if (!have(key)) continue;
  const xs = [];
  for (const rep of out[key]) for (const row of rep.rows) xs.push(row.spent);
  console.log(
    `     ${key.padEnd(6)} ${mean(xs) != null ? mean(xs).toFixed(0) : "—"}`,
  );
}

/* ---- the two binnings */
function cells(key, field, lo, hi, byCount) {
  const xs = [];
  if (!have(key)) return xs;
  for (const rep of out[key])
    for (const row of rep.rows) {
      if (!row.informative || row[field] == null) continue;
      const v = byCount ? row.k : row.p;
      if (v == null || v < lo || v >= hi) continue;
      xs.push(row[field]);
    }
  return xs;
}
const K_BINS = [];
for (let k = 1; k <= 10; k++) K_BINS.push([k, k + 1, `k=${k}`]);
const P_BINS = [];
for (let b = 0; b < 10; b++)
  P_BINS.push([
    b / 20,
    (b + 1) / 20,
    `${(b / 20).toFixed(2)}-${((b + 1) / 20).toFixed(2)}`,
  ]);

function table(field, bins, byCount, arm) {
  console.log(
    `\n  ${field === "w" ? "realised fitness ratio w" : field === "r" ? "per-capita visit ratio r" : field} by minority ${byCount ? "COUNT" : "FREQUENCY"}, arm ${arm}`,
  );
  console.log(
    `    bin        ` + N0S.map((n) => `N0=${String(n).padEnd(12)}`).join(""),
  );
  for (const [lo, hi, name] of bins) {
    const cellsFor = N0S.map((n) =>
      cells(keyOf(n, arm), field, lo, hi, byCount),
    );
    if (!cellsFor.some((c) => c.length)) continue;
    console.log(
      `    ${name.padEnd(10)} ` +
        cellsFor
          .map((c) => {
            const m = mean(c);
            return (
              (m == null ? "  —  " : m.toFixed(3)) +
              ` (${String(c.length).padStart(3)})   `
            );
          })
          .join(""),
    );
  }
}

/*
 * THE SPEND-MATCHED COMPARISON, at N0=30 only. All three arms there share a
 * population size, so they can be put side by side: A has the premium, B does
 * not, and Bx does not but is handed enough extra budget that its realised SPEND
 * matches A's. If A's advantage were really about delivering more visits rather
 * than about allocating them differently, Bx would look like A.
 */
function armsAt30(field, bins, byCount) {
  const arms = ["A", "B", "Bx"];
  if (!arms.every((a) => have(keyOf(30, a)))) return;
  console.log(
    `\n  ${field === "w" ? "fitness ratio w" : "visit ratio r"} by minority ${byCount ? "COUNT" : "FREQUENCY"}, N0=30, all three arms`,
  );
  console.log(`    bin        ` + arms.map((a) => `${a.padEnd(15)}`).join(""));
  for (const [lo, hi, name] of bins) {
    const cs = arms.map((a) => cells(keyOf(30, a), field, lo, hi, byCount));
    if (!cs.some((c) => c.length)) continue;
    console.log(
      `    ${name.padEnd(10)} ` +
        cs
          .map((c) => {
            const m = mean(c);
            return (
              (m == null ? "  —  " : m.toFixed(3)) +
              ` (${String(c.length).padStart(3)})  `
            );
          })
          .join(""),
    );
  }
}

/* ---- primary: which axis collapses the three curves */
const MIN_OBS = 5;
const MIN_BINS = 4;
function dispersion(bins, byCount, arm) {
  const sds = [],
    devs = [];
  let shared = 0;
  for (const [lo, hi] of bins) {
    const ms = N0S.map((n) => {
      const c = cells(keyOf(n, arm), "w", lo, hi, byCount);
      return c.length >= MIN_OBS ? mean(c) : null;
    });
    if (ms.some((m) => m == null)) continue;
    shared++;
    sds.push(sd(ms));
    devs.push(Math.abs(mean(ms) - 1));
  }
  if (shared < MIN_BINS) return { shared, D: null };
  const scale = mean(devs);
  if (!(scale > 0.02)) return { shared, D: null, degenerate: true };
  return { shared, D: mean(sds) / scale, scale };
}

/*
 * AN INTERVAL ON THE RATIO, not just a point. The registered thresholds are 1.25
 * and 0.80 and a point estimate landing outside them says nothing about how
 * firmly. Seeds are resampled WITHIN each cell — a seed is one trajectory and
 * its generations are not independent draws, so resampling generations would
 * understate the spread the way it would have in #55.
 */
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
function bootstrapRatio(arm, nb) {
  const rnd = mulberry32(20260903);
  const orig = {};
  for (const n of N0S) orig[keyOf(n, arm)] = out[keyOf(n, arm)];
  const ratios = [];
  for (let b = 0; b < nb; b++) {
    for (const n of N0S) {
      const key = keyOf(n, arm);
      const src = orig[key];
      const res = [];
      for (let i = 0; i < src.length; i++)
        res.push(src[(rnd() * src.length) | 0]);
      out[key] = res;
    }
    const dk = dispersion(K_BINS, true, arm);
    const dp = dispersion(P_BINS, false, arm);
    if (dk.D != null && dp.D != null && dk.D > 0) ratios.push(dp.D / dk.D);
  }
  for (const n of N0S) out[keyOf(n, arm)] = orig[keyOf(n, arm)];
  return ratios;
}
const quant = (xs, p) => {
  const s = xs.slice().sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))];
};

for (const arm of ["A", "B"]) {
  if (!N0S.every((n) => have(keyOf(n, arm)))) continue;
  table("w", K_BINS, true, arm);
  table("w", P_BINS, false, arm);
}
table("r", K_BINS, true, "A");
armsAt30("r", K_BINS, true);
armsAt30("w", K_BINS, true);
{
  const h = (a) => {
    const v = HELD(keyOf(30, a));
    return v == null ? "—" : v.toFixed(3);
  };
  if (have(keyOf(30, "Bx")))
    console.log(
      `\n  HELD at N0=30 (seeds 1..${REPRO_SEEDS}):  A ${h("A")}   B ${h("B")}   Bx ${h("Bx")}` +
        `\n  Bx is arm B handed enough budget to SPEND what arm A spends. If A's advantage were` +
        `\n  about the number of visits delivered rather than their allocation, Bx would match A.`,
    );
}

console.log(
  `\nPRIMARY — does w collapse on COUNT or on FREQUENCY? (arm A; >1.25 count, <0.80 frequency)`,
);
for (const arm of ["A", "B"]) {
  if (!N0S.every((n) => have(keyOf(n, arm)))) {
    console.log(`  arm ${arm}: not all three N0 present, skipped`);
    continue;
  }
  const dk = dispersion(K_BINS, true, arm);
  const dp = dispersion(P_BINS, false, arm);
  if (dk.D == null || dp.D == null) {
    console.log(
      `  arm ${arm}: NOT ESTIMABLE — shared bins count=${dk.shared} freq=${dp.shared} ` +
        `(need ${MIN_BINS})${dk.degenerate || dp.degenerate ? ", or |w-1| too small to normalise by" : ""}. ` +
        `No ratio is reported; a collapse statistic over too few bins is not a result.`,
    );
    continue;
  }
  const ratio = dp.D / dk.D;
  const verdict =
    ratio > 1.25
      ? "COUNT"
      : ratio < 0.8
        ? "FREQUENCY"
        : "NO VERDICT (0.80-1.25)";
  const boot = bootstrapRatio(arm, 2000);
  const lo = boot.length ? quant(boot, 0.025) : null;
  const hi = boot.length ? quant(boot, 0.975) : null;
  const pCount = boot.length
    ? boot.filter((x) => x > 1.25).length / boot.length
    : null;
  console.log(
    `  arm ${arm}: D_count=${dk.D.toFixed(3)} (${dk.shared} bins)  D_freq=${dp.D.toFixed(3)} (${dp.shared} bins)  ` +
      `ratio D_p/D_k = ${ratio.toFixed(3)}  ->  ${verdict}` +
      (lo != null
        ? `\n          bootstrap over seeds: [${lo.toFixed(3)}, ${hi.toFixed(3)}], ` +
          `P(ratio > 1.25) = ${pCount.toFixed(3)}  (n=${boot.length}/2000 resamples estimable)`
        : ``),
  );
}

/* ---- secondary: crossing points */
function crossing(bins, byCount, arm, N0) {
  let prev = null;
  for (const [lo, hi] of bins) {
    const c = cells(keyOf(N0, arm), "w", lo, hi, byCount);
    if (c.length < MIN_OBS) continue;
    const m = mean(c);
    const x = (lo + hi) / 2;
    if (prev && prev.m < 1 && m >= 1) {
      const f = (1 - prev.m) / (m - prev.m);
      return prev.x + f * (x - prev.x);
    }
    prev = { x, m };
  }
  return null;
}
console.log(
  `\nSECONDARY — where does w cross 1?  (count hypothesis: k* agrees, p* does not)`,
);
for (const N0 of N0S) {
  if (!have(keyOf(N0, "A"))) continue;
  const ks = crossing(K_BINS, true, "A", N0);
  const ps = crossing(P_BINS, false, "A", N0);
  console.log(
    `  N0=${String(N0).padStart(2)}   k* = ${ks == null ? "—" : ks.toFixed(2)}    p* = ${ps == null ? "—" : ps.toFixed(3)}` +
      (ks != null ? `   (k*/N0 = ${(ks / N0).toFixed(3)})` : ""),
  );
}

/* ---- secondary 2: geitonogamy, measured */
console.log(
  `\nSECONDARY 2 — is it geitonogamy? minority self-pollen share and conspecific outcross receipt`,
);
console.log(
  `  (mate limitation predicts self share RISES and conspecific receipt FALLS as the minority thins)`,
);
for (const N0 of N0S) {
  const key = keyOf(N0, "A");
  if (!have(key)) continue;
  console.log(`  N0=${N0}, arm A`);
  console.log(
    `     k        self share       conspecific outcross receipt / plant     n`,
  );
  for (const [lo, hi, name] of K_BINS) {
    const ss = cells(key, "selfShare", lo, hi, true);
    const cp = cells(key, "consPC", lo, hi, true);
    if (ss.length < MIN_OBS) continue;
    console.log(
      `     ${name.padEnd(6)}  ${mean(ss).toFixed(4)}            ${mean(cp).toFixed(2)}                        ${ss.length}`,
    );
  }
}
