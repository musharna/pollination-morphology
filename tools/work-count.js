#!/usr/bin/env node
/*
 * Work count for the seeded runs the Pages smoke times (tools/smoke-site.py).
 *
 * The smoke bounds those runs at 60 s of wall clock. On CI they take 9-15 s
 * (the level-2 run) and 21-29 s (the slowest M3b run), and the same run varies
 * about 1.5x between deploys, so a 4x slowdown in sim/ still deploys green and
 * the bound cannot be tightened. This counts calls instead: each workload runs
 * in a child with NODE_V8_COVERAGE set, and the count is the sum of every
 * function's call count in sim/*.js and population-run.js. The runs are
 * seeded, so the total is identical on every run and every machine.
 *
 * The workloads use the smoke's seeds and option sets at the PAGE configuration
 * (N 18, 24 generations, siteN 90), not the level one: the same functions run,
 * and a count has no headroom, so any change in calls fails at either size --
 * at about a third of the cost (the level-2 run is 3.4e9 calls, ~40 s under
 * coverage). Each run is pinned by a hash of its final population, which only
 * that seed and option set produce.
 *
 * It sees any change in how many times a function runs; it does not see work
 * added inside a function without a call (a new inner loop over the same data).
 *
 *   node tools/work-count.js                 compare against the baseline
 *   node tools/work-count.js --update        write a LOWER total into the baseline
 *   node tools/work-count.js --allow-increase  also accept a higher one
 */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");

const ROOT = path.join(__dirname, "..");
const BASELINE = path.join(__dirname, "work-count-baseline.json");

/* The page's own loop and stream construction (population-run.js), founded at
 * target d 8 by foundTwoLineages -- NOT hand-set founding, which draws a
 * different RNG stream (docs/northstar-design.md, M2). */
const PAGE = { n: 18, gens: 24, siteN: 90 }; // population-run.js CONFIGS.page
const WORKLOADS = {
  // tools/smoke-site.py M3a: level 2 seed 1 target 8, no option set.
  "plain-s1-d8": { seed: 1, extra: {} },
  // tools/smoke-site.py M3b "c6 s3": level 5's width-locus object, the slowest
  // M3b run on CI (22-29 s).
  "width-s3-d8": {
    seed: 3,
    extra: { phenology: { slices: 8, widthLocus: true, widthMut: 0.03, conserveDisplay: true } },
  },
};

function runWorkload(name) {
  const w = WORKLOADS[name];
  if (!w) throw new Error(`unknown workload ${name}`);
  const I = require(path.join(ROOT, "sim", "ibm.js"));
  const E = require(path.join(ROOT, "sim", "evolve.js"));
  globalThis.IBM = I;
  globalThis.Evolve = E;
  require(path.join(ROOT, "population-run.js"));
  const SR = globalThis.SandboxRun;
  const opts = { ...I.DEFAULTS, siteN: PAGE.siteN, ...w.extra };
  const rng = E.makeRng(w.seed);
  const srng = I.signalRng(w.seed);
  const built = I.foundTwoLineages(PAGE.n, rng, srng, 8, opts);
  if (!built) throw new Error(`${name}: nothing founded`);
  const v0 = I.ancestryVar(built.pop);
  const out = SR.runGenerations(built.pop, opts, rng, srng, PAGE.gens, SR.streamsFor(w.seed, opts));
  const fate = I.fateOf(out.final, v0, out.extinct, out.stalledGens > 0);
  const hash = require("crypto").createHash("sha256").update(JSON.stringify(out.final)).digest("hex");
  return { fate, n: out.final.length, final: hash.slice(0, 16) };
}

/* Child: run one workload, print its outcome; coverage is written on exit. */
if (process.argv[2] === "--child") {
  process.stdout.write(JSON.stringify(runWorkload(process.argv[3])));
  process.exit(0);
}

async function measure(name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "work-count-"));
  try {
    const stdout = await new Promise((resolve, reject) =>
      execFile(
        process.execPath,
        [__filename, "--child", name],
        { env: { ...process.env, NODE_V8_COVERAGE: dir }, encoding: "utf8" },
        (err, out, errOut) => (err ? reject(new Error(`${name}: ${err.message}\n${errOut}`)) : resolve(out)),
      ),
    );
    const outcome = JSON.parse(stdout);
    const perFn = {};
    for (const f of fs.readdirSync(dir)) {
      for (const script of JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")).result) {
        const rel = script.url.startsWith("file://")
          ? path.relative(ROOT, new URL(script.url).pathname)
          : "";
        if (!(rel.startsWith("sim" + path.sep) || rel === "population-run.js")) continue;
        for (const fn of script.functions) {
          const count = fn.ranges[0].count;
          if (!count) continue;
          const key = `${rel}:${fn.functionName || "(anonymous)"}`;
          perFn[key] = (perFn[key] || 0) + count;
        }
      }
    }
    const total = Object.values(perFn).reduce((a, b) => a + b, 0);
    return { outcome, total, perFn };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function compare({ update = false, allowIncrease = false } = {}) {
  const baseline = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, "utf8")) : {};
  const failures = [];
  const next = {};
  const lines = [];
  const names = Object.keys(WORKLOADS);
  const measured = await Promise.all(names.map(measure));
  for (const [i, name] of names.entries()) {
    const m = measured[i];
    const b = baseline[name];
    next[name] = { total: m.total, outcome: m.outcome, perFn: m.perFn };
    if (!b) {
      lines.push(`${name}: ${m.total} calls (no baseline)`);
      if (!update) failures.push(`${name}: no baseline; run with --update`);
      continue;
    }
    if (JSON.stringify(m.outcome) !== JSON.stringify(b.outcome))
      failures.push(`${name}: outcome ${JSON.stringify(m.outcome)} != baseline ${JSON.stringify(b.outcome)}`);
    const delta = m.total - b.total;
    lines.push(`${name}: ${m.total} calls (baseline ${b.total}, ${delta >= 0 ? "+" : ""}${delta})`);
    if (delta !== 0) {
      const keys = new Set([...Object.keys(m.perFn), ...Object.keys(b.perFn || {})]);
      const top = [...keys]
        .map((k) => [k, (m.perFn[k] || 0) - ((b.perFn || {})[k] || 0)])
        .filter(([, d]) => d !== 0)
        .sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]))
        .slice(0, 8);
      for (const [k, d] of top) lines.push(`    ${d > 0 ? "+" : ""}${d}  ${k}`);
      if (delta > 0 && !allowIncrease)
        failures.push(`${name}: +${delta} calls over baseline (accept with --allow-increase)`);
      if (delta < 0 && !update)
        failures.push(`${name}: ${delta} calls under baseline -- lower it with --update`);
    }
  }
  if (update && failures.length === 0)
    fs.writeFileSync(BASELINE, JSON.stringify(next, null, 2) + "\n");
  return { failures, lines };
}

module.exports = { WORKLOADS, runWorkload, measure, compare };

if (require.main === module) (async () => {
  const args = process.argv.slice(2);
  const { failures, lines } = await compare({
    update: args.includes("--update") || args.includes("--allow-increase"),
    allowIncrease: args.includes("--allow-increase"),
  });
  for (const l of lines) console.log(l);
  for (const f of failures) console.error("FAIL " + f);
  process.exit(failures.length ? 1 : 0);
})();
