/*
 * CROSS-ARCHIVE AGREEMENT — do two archives that claim the same cell agree?
 *
 * WHY THIS EXISTS. Several archives in this arc overlap by design. #56's arm A
 * at N0=30, #58's rate-0 cell and #59's cost-0 cell are all meant to be the SAME
 * configuration — experiments/rare-floor.js says so in as many words ("Arm A is
 * the rate=0 cell of this sweep, so it is not duplicated here"). Nothing checked
 * it. #61 leaned on that overlap as a control (C8"), and #62 found the two
 * archives publishing DIFFERENT numbers for the same quantity — w at k=2 reads
 * 0.7344 in one and 0.8096 in the other.
 *
 * ⚠️ THAT DIFFERENCE TURNED OUT TO BE INNOCENT — different seed sets, 38 vs 109
 * runs — but it was indistinguishable from a configuration drift until someone
 * compared the shared seeds. This script is that comparison, kept so the next
 * overlap does not need the same detective work.
 *
 * ⚠️ IT CAN FAIL, which is the point. It compares two files written by two
 * different scripts on two different days: if a shared default moves under one
 * of them, the shared-seed rows stop matching and this exits non-zero. A control
 * that compares a run to its own archive (C8' as originally built) cannot do
 * that — it checks a file against itself.
 *
 * The seed-set difference is REPORTED, not failed on: publishing a cell at two
 * sample sizes is legitimate, quoting one as if it were the other is not.
 *
 *   node experiments/archive-agree.js <file.json.gz>:<cell> <file.json.gz>:<cell> [--field w]
 *
 * exit 0 agree · 3 disagree · 4 no shared seeds · 2 bad arguments
 */
const fs = require("fs"),
  zlib = require("zlib");

const args = process.argv.slice(2);
const specs = args.filter((a) => !a.startsWith("--"));
const fieldArg = (() => {
  const i = args.indexOf("--field");
  return i >= 0 ? args[i + 1] : "w";
})();

if (specs.length !== 2) {
  console.error(
    "usage: node experiments/archive-agree.js <file>:<cell> <file>:<cell> [--field w]",
  );
  process.exit(2);
}

function open(spec) {
  /* ⚠️ FIRST colon, not last: cell names contain one ("30:A", "30:R200c25"), so
   * lastIndexOf splits inside the cell name and opens a path that cannot exist.
   * Archive paths here carry no colon. */
  const i = spec.indexOf(":");
  if (i < 0) {
    console.error(`bad spec ${spec} — expected <file>:<cell>`);
    process.exit(2);
  }
  const path = spec.slice(0, i),
    cell = spec.slice(i + 1);
  const raw = path.endsWith(".gz")
    ? zlib.gunzipSync(fs.readFileSync(path))
    : fs.readFileSync(path);
  const doc = JSON.parse(raw.toString("utf8"));
  if (!doc.cells || !doc.cells[cell]) {
    console.error(
      `${path} has no cell "${cell}" — has: ${Object.keys(doc.cells || {}).join(", ")}`,
    );
    process.exit(2);
  }
  return { path, cell, runs: doc.cells[cell] };
}

const L = open(specs[0]),
  R = open(specs[1]);
const seeds = (rs) => rs.map((r) => r.seed);
console.log(
  `LEFT   ${L.path}:${L.cell}  ${L.runs.length} runs, seeds ${Math.min(...seeds(L.runs))}..${Math.max(...seeds(L.runs))}`,
);
console.log(
  `RIGHT  ${R.path}:${R.cell}  ${R.runs.length} runs, seeds ${Math.min(...seeds(R.runs))}..${Math.max(...seeds(R.runs))}`,
);

const bySeed = new Map(R.runs.map((r) => [r.seed, r]));
const shared = L.runs.filter((r) => bySeed.has(r.seed));
console.log(`shared seeds: ${shared.length}`);
if (!shared.length) {
  console.error("NO SHARED SEEDS — nothing was compared, this is NOT a pass");
  process.exit(4);
}

let rows = 0,
  values = 0,
  bad = 0,
  lenMismatch = 0;
const badFields = new Map();
const REL = 1e-12;
for (const a of shared) {
  const b = bySeed.get(a.seed);
  if (a.rows.length !== b.rows.length) {
    lenMismatch++;
    continue;
  }
  for (let i = 0; i < a.rows.length; i++) {
    rows++;
    const ra = a.rows[i],
      rb = b.rows[i];
    for (const k of Object.keys(ra)) {
      if (!(k in rb)) continue;
      const x = ra[k],
        y = rb[k];
      if (typeof x !== "number" || typeof y !== "number") continue;
      values++;
      if (!(Math.abs(x - y) <= REL * Math.max(1, Math.abs(x), Math.abs(y)))) {
        bad++;
        badFields.set(k, (badFields.get(k) || 0) + 1);
      }
    }
  }
}

console.log(
  `\nrows ${rows}   numeric values ${values}   disagreements ${bad}   run-length mismatches ${lenMismatch}`,
);
if (badFields.size) {
  console.log("fields that disagree:");
  for (const [k, n] of [...badFields].sort((p, q) => q[1] - p[1]))
    console.log(`   ${k}: ${n}`);
}

/*
 * The same statistic on each FULL archive and on the SHARED subset. A gap
 * between the two full columns with agreement on the shared rows is a seed-set
 * difference — legitimate to publish, illegitimate to quote interchangeably.
 */
const mean = (x) => (x.length ? x.reduce((a, b) => a + b, 0) / x.length : null);
const byK = (runs, K) => {
  const v = [];
  for (const run of runs)
    for (const r of run.rows)
      if (r.informative && r.k === K && r[fieldArg] != null)
        v.push(r[fieldArg]);
  return v;
};
const sharedSeeds = new Set(shared.map((r) => r.seed));
const cols = [
  ["LEFT full", L.runs],
  ["RIGHT full", R.runs],
  ["LEFT shared", L.runs.filter((r) => sharedSeeds.has(r.seed))],
  ["RIGHT shared", R.runs.filter((r) => sharedSeeds.has(r.seed))],
];
console.log(`\nmean ${fieldArg} by minority count k`);
for (let K = 1; K <= 4; K++) {
  const parts = cols.map(([name, runs]) => {
    const v = byK(runs, K);
    return `${name} ${v.length ? mean(v).toFixed(4) : "  —   "} (n=${String(v.length).padStart(3)})`;
  });
  console.log(`  k=${K}  ${parts.join("   ")}`);
}

if (bad || lenMismatch) {
  console.error(
    `\nFAIL — the two archives are not the same simulation on their shared seeds.`,
  );
  process.exit(3);
}
console.log(
  `\nPASS — same simulation on all ${shared.length} shared seeds. Any difference in the` +
    `\npublished numbers is a SEED-SET difference, not a configuration difference.`,
);
