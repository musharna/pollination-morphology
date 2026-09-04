/*
 * #60 — SURVIVAL IS NOT RECOVERY.
 *
 * Registered in docs/2026-09-03-survival-recovery-prereg.md, which discloses
 * that the one-generation point estimates were visible before registration
 * (the pre-flight that tested whether `k` is safe to use produces the same
 * classification as the outcome). This computes what was NOT visible: seed-level
 * bootstrap intervals, the 5- and 10-generation windowed statistics, and the
 * PURE/INCLUSIVE convention comparison.
 *
 * THE QUESTION. #58 and #59 measured one gap from opposite sides — a lineage can
 * be rescued at k=1 and still not coexist. Being rescued at k=1 is SURVIVAL;
 * coexisting needs RECOVERY, getting back to a k where the floor stops binding.
 * #56 measured w = 0.000 at k=1, 0.734 at k=2, 1.646 at k=3, so k>=3 is the
 * registered escape threshold.
 *
 * ⚠️⚠️ `k` IS ITSELF A TRACER QUANTITY. It is nMin over the PURE labels
 * (rare-floor.js:157) and label() returns -1 for anything strictly between 0 and
 * 1 (:70), so a hybrid is in NEITHER lineage count. A minority plant whose
 * offspring are all hybrids reads as EXTINCTION while her genes are still in the
 * population. Measured: that route is 0.0-7.9% of exits, rising with cost. Not
 * dominant, so `k` is usable — but the convention's effect is MEASURED here
 * rather than assumed, which is the same move #58 had to make for ancNull and
 * the fourth consecutive task in this arc to need it.
 *
 *   node experiments/survival-recovery.js
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
/* the outcome classifier lives in its own module so it can be tested without
 * running a sweep — the #59 single-sourcing lesson, applied before it bites */
const { classify, ESCAPE } = require("./lineage-outcome.js");

/* mulberry32 — NOT an LCG. #55 used one and its bootstrap distribution did not
 * contain its own point estimate, because `1103515245 * s` exceeds 2^53 in
 * float64. Math.imul is the whole point. */
function mb32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const qq = (xs, q) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(q * s.length)))];
};

/* events grouped BY SEED, because generations within a seed are not independent
 * and the whole arc's estimator resamples seeds */
function eventsBySeed(reps, K, W, inclusive) {
  return reps.map((rep) => {
    const out = [];
    for (let i = 0; i < rep.rows.length; i++) {
      const r = rep.rows[i];
      if (!r.informative || r.k !== K) continue;
      out.push(classify(rep.rows, i, W, inclusive));
    }
    return out;
  });
}

const flat = (gs) => gs.reduce((a, g) => a.concat(g), []);

/* P(outcome) over KNOWN outcomes, bootstrapped over seeds */
function boot(groups, want, seedRng) {
  const rnd = mb32(seedRng);
  const bs = [];
  for (let b = 0; b < 2000; b++) {
    const rs = [];
    for (let i = 0; i < groups.length; i++)
      rs.push(groups[(rnd() * groups.length) | 0]);
    const ev = flat(rs).filter((e) => e !== "CENSORED");
    if (!ev.length) continue;
    bs.push(ev.filter((e) => e === want).length / ev.length);
  }
  return bs;
}

function rate(groups, want) {
  const ev = flat(groups).filter((e) => e !== "CENSORED");
  return ev.length ? ev.filter((e) => e === want).length / ev.length : NaN;
}

const loaded = CELLS.map(([lbl, path, key]) => {
  const reps = (load(path).cells || {})[key];
  if (!reps || !reps.length) {
    console.error(`FATAL: ${path} has no cell ${key}`);
    process.exit(2);
  }
  return { lbl, key, reps };
});

/* ---------------------------------------------------------- C-class guard */
/*
 * A non-informative generation means ONE pure count hit zero, and this code must
 * not assume WHICH. If the MAJORITY vanished that is the minority WINNING, and
 * calling it an exit would invert the result. Vanishingly unlikely from k=1 in
 * one step — which is exactly why it would never be noticed if it happened.
 */
{
  let minGone = 0,
    majGone = 0;
  for (const { reps } of loaded)
    for (const rep of reps)
      for (let i = 0; i < rep.rows.length; i++) {
        const r = rep.rows[i];
        if (!r.informative || r.k > 2) continue;
        const nx = rep.rows[i + 1];
        if (!nx || nx.informative) continue;
        const minorIs0 = r.n0 < r.n1;
        if ((minorIs0 ? nx.n0 : nx.n1) === 0) minGone++;
        else majGone++;
      }
  console.log(
    `#60 C-class — every exit is the MINORITY vanishing, not the majority`,
  );
  console.log(
    `  minority-gone ${minGone}   majority-gone ${majGone}   ` +
      (majGone === 0
        ? "PASS"
        : "FAIL — an exit is a minority WIN and the sign is inverted"),
  );
  if (majGone !== 0) process.exit(3);
}

/* ----------------------------------------------------------- C-seed counts */
console.log(
  `\n#60 C-seed — how many DISTINCT SEEDS carry each conditioning set?` +
    `\n  ⚠️ 23 generations could be 3 seeds. An interval resting on a handful of runs is not an interval.`,
);
console.log(`  cell                 k=1 gens / seeds     k=2 gens / seeds`);
for (const { lbl, reps } of loaded) {
  const count = (K) => {
    let g = 0,
      s = 0;
    for (const rep of reps) {
      const n = rep.rows.filter((r) => r.informative && r.k === K).length;
      if (n) {
        s++;
        g += n;
      }
    }
    return `${g} / ${s}`;
  };
  console.log(`  ${lbl.padEnd(20)} ${count(1).padEnd(20)} ${count(2)}`);
}

/* ------------------------------------------------------------- the primary */
for (const W of [5, 10]) {
  for (const K of [1, 2]) {
    console.log(
      `\n#60 PRIMARY — from k=${K}, window W=${W} generations, PURE convention` +
        `\n  recovery = minority reaches k>=${ESCAPE} before exiting; bootstrap over SEEDS, 2000 resamples`,
    );
    console.log(
      `  cell                 P(recover) [95% CI]        P(survive) [95% CI]        P(exit)   n(known)  censored`,
    );
    const base = {};
    for (const { lbl, reps } of loaded) {
      const gs = eventsBySeed(reps, K, W, false);
      const all = flat(gs);
      const known = all.filter((e) => e !== "CENSORED");
      if (!known.length) {
        console.log(`  ${lbl.padEnd(20)} no informative k=${K} generations`);
        continue;
      }
      const rec = boot(gs, "RECOVER", 20260910 + K * 7 + W);
      const sur = boot(gs, "SURVIVE", 20260911 + K * 7 + W);
      base[lbl] = { gs, rec: rate(gs, "RECOVER") };
      console.log(
        `  ${lbl.padEnd(20)} ${rate(gs, "RECOVER").toFixed(3)} [${qq(rec, 0.025).toFixed(3)}, ${qq(rec, 0.975).toFixed(3)}]      ` +
          `${rate(gs, "SURVIVE").toFixed(3)} [${qq(sur, 0.025).toFixed(3)}, ${qq(sur, 0.975).toFixed(3)}]      ` +
          `${rate(gs, "EXIT").toFixed(3)}     ${String(known.length).padStart(6)}    ${all.length - known.length}`,
      );
    }
    /* the registered discriminator: cost 0 (selfing on) against arm A */
    const a = base["arm A (no selfing)"],
      b = base["rate 2.0 cost 0.00"],
      z = base["rate 2.0 cost 0.95"];
    const diff = (x, y, want, s) => {
      if (!x || !y) return null;
      const rnd = mb32(s);
      const d = [];
      const pick = (gs) => {
        const rs = [];
        for (let i = 0; i < gs.length; i++)
          rs.push(gs[(rnd() * gs.length) | 0]);
        const ev = flat(rs).filter((e) => e !== "CENSORED");
        return ev.length
          ? ev.filter((e) => e === want).length / ev.length
          : null;
      };
      for (let i = 0; i < 2000; i++) {
        const u = pick(x.gs),
          v = pick(y.gs);
        if (u != null && v != null) d.push(u - v);
      }
      return d;
    };
    for (const [nm, x, y] of [
      ["selfing ON  (cost 0 − arm A)", b, a],
      ["depression  (cost .95 − cost 0)", z, b],
    ]) {
      for (const want of ["RECOVER", "SURVIVE"]) {
        const d = diff(x, y, want, 20260912 + K + W);
        if (!d || !d.length) continue;
        const lo = qq(d, 0.025),
          hi = qq(d, 0.975);
        const hw = (hi - lo) / 2;
        console.log(
          `    ${nm.padEnd(32)} ΔP(${want.toLowerCase()}) = ${((lo + hi) / 2 >= 0 ? "+" : "") + ((lo + hi) / 2).toFixed(3)} [${lo.toFixed(3)}, ${hi.toFixed(3)}]` +
            `${lo > 0 || hi < 0 ? "  EXCLUDES 0" : hw > 0.15 ? "  (half-width " + hw.toFixed(3) + " > 0.15 — NO VERDICT)" : ""}`,
        );
      }
    }
  }
}

/* ------------------------------------------- C-conv: does the tracer decide? */
console.log(
  `\n#60 C-conv — PURE vs INCLUSIVE (hybrids count as the lineage still alive)` +
    `\n  ⚠️ registered: if the two disagree on a verdict, the verdict is the TRACER'S, not the biology's.` +
    `\n  Same conditioning set in both; only the OUTCOME rule changes.`,
);
console.log(
  `  cell                 W  P(recover) pure / incl   P(exit) pure / incl`,
);
for (const W of [5, 10]) {
  for (const { lbl, reps } of loaded) {
    const p = eventsBySeed(reps, 1, W, false);
    const q = eventsBySeed(reps, 1, W, true);
    if (!flat(p).filter((e) => e !== "CENSORED").length) continue;
    console.log(
      `  ${lbl.padEnd(20)} ${W}  ${rate(p, "RECOVER").toFixed(3)} / ${rate(q, "RECOVER").toFixed(3)}` +
        `            ${rate(p, "EXIT").toFixed(3)} / ${rate(q, "EXIT").toFixed(3)}`,
    );
  }
}

/*
 * EVERY ARM AGAINST ARM A, UNDER BOTH CONVENTIONS.
 *
 * The registered discriminator named one contrast (cost 0 vs arm A). That is the
 * weakest of the selfing arms to test it on — arm A's P(recover) is EXACTLY 0
 * with zero variance, so the difference interval is just the selfing arm's own,
 * and whether it clears zero depends on how many SEEDS carry a recovery. Every
 * arm is therefore reported, and both conventions, because C-conv above shows
 * they disagree precisely where the effect is largest.
 */
console.log(
  `\n#60 EVERY ARM vs ARM A at k=1, W=10 — ΔP(recover), bootstrap over seeds` +
    `\n  ⚠️ arm A is EXACTLY 0.000 with no variance, so these differences are the arms' own intervals.`,
);
console.log(
  `  cell                 PURE convention            INCLUSIVE convention`,
);
for (const conv of [false]) void conv;
{
  const armA = loaded.find((c) => c.lbl.startsWith("arm A"));
  for (const { lbl, reps } of loaded) {
    if (lbl.startsWith("arm A")) continue;
    const cells = [false, true].map((inc) => {
      const gs = eventsBySeed(reps, 1, 10, inc);
      const ga = eventsBySeed(armA.reps, 1, 10, inc);
      const rnd = mb32(20260913 + (inc ? 1 : 0));
      const pick = (g) => {
        const rs = [];
        for (let i = 0; i < g.length; i++) rs.push(g[(rnd() * g.length) | 0]);
        const ev = flat(rs).filter((e) => e !== "CENSORED");
        return ev.length
          ? ev.filter((e) => e === "RECOVER").length / ev.length
          : null;
      };
      const d = [];
      for (let i = 0; i < 2000; i++) {
        const u = pick(gs),
          v = pick(ga);
        if (u != null && v != null) d.push(u - v);
      }
      const lo = qq(d, 0.025),
        hi = qq(d, 0.975);
      return `${((lo + hi) / 2 >= 0 ? "+" : "") + ((lo + hi) / 2).toFixed(3)} [${lo.toFixed(3)}, ${hi.toFixed(3)}]${lo > 0 ? " EXCL" : "     "}`;
    });
    console.log(`  ${lbl.padEnd(20)} ${cells[0]}   ${cells[1]}`);
  }
}
