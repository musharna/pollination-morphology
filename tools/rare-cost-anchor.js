/*
 * C8' — #59's exact-agreement gate.
 *
 * #59 RE-RUNS #58's cost-0 cell (30:R200) rather than reloading it, so that
 * every cell in the sweep carries the recruits/unmated/target fields on
 * identical terms. That re-run is only legitimate if it is the SAME
 * simulation: `cost: 0` makes `S.cost > 0` false, so no random number is drawn
 * (sim/ibm.js:1941) and the stream is untouched. The re-run must therefore
 * reproduce #58's archived R200 row for row, not merely in its means.
 *
 * ⚠️ THE COMPARISON IS THE INTERSECTION OF THE TWO ROWS' FIELDS, AND IT SAYS SO.
 * The reference was written before recruits/unmated/target existed, so those
 * fields cannot be compared — but a gate that silently narrows what it checks
 * is the failure this whole arc keeps re-learning. It prints the fields it
 * compared AND the fields it skipped, so the coverage is visible rather than
 * assumed, and it refuses to pass on a thin comparison.
 *
 *   node tools/rare-cost-anchor.js _scratch/rf59-30R200.json \
 *        docs/data/2026-09-03-selfing-rate-r200.json.gz [30:R200]
 *
 * exit 0 agree · 2 nothing to compare · 3 disagreement · 4 too little checked
 */
const fs = require("node:fs");
const zlib = require("node:zlib");

function load(path) {
  const raw = path.endsWith(".gz")
    ? zlib.gunzipSync(fs.readFileSync(path))
    : fs.readFileSync(path);
  return JSON.parse(raw.toString("utf8"));
}

const minePath = process.argv[2] || "_scratch/rf59-30R200.json";
const refPath =
  process.argv[3] || "docs/data/2026-09-03-selfing-rate-r200.json.gz";
const KEY = process.argv[4] || "30:R200";

const mine = (load(minePath).cells || {})[KEY] || [];
const theirs = (load(refPath).cells || {})[KEY] || [];

if (!mine.length || !theirs.length) {
  console.error(
    `nothing to compare — THIS IS NOT A PASS:\n` +
      `  ${minePath} cell ${KEY} has ${mine.length} seeds\n` +
      `  ${refPath} cell ${KEY} has ${theirs.length} seeds`,
  );
  process.exit(2);
}

const bySeed = new Map();
for (const r of theirs) bySeed.set(r.seed, r);

/* every field the reference rows actually carry a value for */
const refFields = new Set();
for (const r of theirs)
  for (const row of r.rows)
    for (const k of Object.keys(row)) if (row[k] != null) refFields.add(k);
const mineFields = new Set();
for (const r of mine)
  for (const row of r.rows)
    for (const k of Object.keys(row)) if (row[k] != null) mineFields.add(k);

const compared = [...mineFields].filter((k) => refFields.has(k)).sort();
const onlyMine = [...mineFields].filter((k) => !refFields.has(k)).sort();
const onlyRef = [...refFields].filter((k) => !mineFields.has(k)).sort();

let seeds = 0,
  rowsChecked = 0,
  valuesChecked = 0,
  fatesChecked = 0;
const bad = [];
for (const a of mine) {
  const b = bySeed.get(a.seed);
  if (!b) {
    bad.push(`seed ${a.seed}: present in #59 but not in the #58 archive`);
    continue;
  }
  seeds++;
  if (a.fate !== b.fate) {
    bad.push(`seed ${a.seed}: fate ${a.fate} vs archived ${b.fate}`);
  } else fatesChecked++;
  if (a.rows.length !== b.rows.length) {
    bad.push(
      `seed ${a.seed}: ${a.rows.length} generations vs archived ${b.rows.length}`,
    );
    continue;
  }
  for (let g = 0; g < a.rows.length; g++) {
    const x = a.rows[g],
      y = b.rows[g];
    rowsChecked++;
    for (const f of compared) {
      const u = x[f],
        v = y[f];
      if (u == null && v == null) continue;
      if (u == null || v == null) {
        bad.push(`seed ${a.seed} gen ${g}: ${f} is ${u} vs ${v}`);
        continue;
      }
      if (typeof u === "number" && typeof v === "number") {
        if (Math.abs(u - v) > 1e-12)
          bad.push(`seed ${a.seed} gen ${g}: ${f} ${u} vs ${v}`);
      } else if (u !== v) {
        bad.push(`seed ${a.seed} gen ${g}: ${f} ${u} vs ${v}`);
      }
      valuesChecked++;
    }
  }
}

console.log(`C8' exact agreement, cell ${KEY}`);
console.log(`  ${minePath}  vs  ${refPath}`);
console.log(`  seeds matched: ${seeds}   generations: ${rowsChecked}`);
console.log(
  `  fates compared: ${fatesChecked}   values compared: ${valuesChecked}`,
);
console.log(`  fields compared (${compared.length}): ${compared.join(", ")}`);
console.log(
  `  ⚠️ NOT compared, absent from the archive (${onlyMine.length}): ` +
    (onlyMine.length ? onlyMine.join(", ") : "none"),
);
if (onlyRef.length)
  console.log(
    `  ⚠️ present in the archive but MISSING from the new run (${onlyRef.length}): ${onlyRef.join(", ")}`,
  );

/* a gate that checked almost nothing must not report a pass */
const MIN_ROWS = 200;
const MIN_FIELDS = 8;
if (bad.length) {
  console.error(`\nDISAGREEMENT — ${bad.length} difference(s). First 20:`);
  for (const m of bad.slice(0, 20)) console.error(`  ${m}`);
  process.exit(3);
}
if (rowsChecked < MIN_ROWS || compared.length < MIN_FIELDS) {
  console.error(
    `\nTOO LITTLE CHECKED TO BE A PASS: ${rowsChecked} generations (need ${MIN_ROWS}), ` +
      `${compared.length} fields (need ${MIN_FIELDS}).`,
  );
  process.exit(4);
}
console.log(`\nC8' PASS — every compared value agrees to 1e-12.`);
