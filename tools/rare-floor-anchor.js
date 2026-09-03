/*
 * C8 — the #43 guard for #56.
 *
 * experiments/rare-floor.js computes the per-capita fitness ratio `w`, the visit
 * ratio `r` and the lineage counts a SECOND time; #55 already published them
 * from experiments/rare-advantage.js. Two implementations of one quantity
 * disagree in silence the moment somebody edits one — that is #43, and it cost a
 * corrected predicate that kept reporting the old answer from its other copy.
 *
 * The registered control was "reproduce #55's w-by-frequency table". A STRONGER
 * check is available and is what runs here: `visitsPerPlant=800` is bit-identical
 * to `visits=24000` at N0=30 (verified), so the two runs are the SAME
 * simulation, seed for seed and generation for generation. Their per-generation
 * ROWS must therefore agree exactly, not merely their binned means.
 *
 *   node tools/rare-floor-anchor.js _scratch/rf-30A.json <#55 arm-A dump>
 */
const fs = require("node:fs");
const zlib = require("node:zlib");

function load(path) {
  const raw = path.endsWith(".gz")
    ? zlib.gunzipSync(fs.readFileSync(path))
    : fs.readFileSync(path);
  return JSON.parse(raw.toString("utf8"));
}

const floorPath = process.argv[2] || "_scratch/rf-30A.json";
const refPath =
  process.argv[3] || "docs/data/2026-09-02-rare-advantage-armA-40seed.json.gz";

const floor = load(floorPath);
const ref = load(refPath);

const mine = floor.cells["30:A"] || [];
/* deliberately arm A only: C8 anchors the N0=30 PREMIUM cell, which is the one
 * bit-identical to #55's arm A. Pointing this at another arm's dump finds
 * nothing rather than disagreeing, so the message has to say so out loud. */
const theirs = (ref.arms && ref.arms.A) || [];
if (!mine.length || !theirs.length) {
  console.error(
    `nothing to compare — THIS IS NOT A PASS:\n` +
      `  ${floorPath} cell 30:A has ${mine.length} seeds\n` +
      `  ${refPath} arm A has ${theirs.length} seeds` +
      (theirs.length === 0
        ? `\n  (arm A is empty in the reference. This tool anchors cell 30:A against #55's\n` +
          `   ARM A specifically; it does not compare other arms, so a wrong dump lands here.)`
        : ``),
  );
  process.exit(2);
}

const bySeed = new Map();
for (const r of theirs) bySeed.set(r.seed, r);

let seeds = 0,
  rowsChecked = 0,
  informativeChecked = 0;
const bad = [];
for (const a of mine) {
  const b = bySeed.get(a.seed);
  if (!b) {
    bad.push(`seed ${a.seed}: present in #56 but not in #55`);
    continue;
  }
  seeds++;
  if (a.rows.length !== b.rows.length) {
    bad.push(
      `seed ${a.seed}: ${a.rows.length} generations vs #55's ${b.rows.length}`,
    );
    continue;
  }
  for (let g = 0; g < a.rows.length; g++) {
    const x = a.rows[g],
      y = b.rows[g];
    rowsChecked++;
    /* the population itself must be the same simulation */
    if (x.n0 !== y.n0 || x.n1 !== y.n1 || x.nh !== y.nh)
      bad.push(
        `seed ${a.seed} gen ${g}: lineage counts ${x.n0}/${x.n1}/${x.nh} vs ${y.n0}/${y.n1}/${y.nh}`,
      );
    if (x.spent !== y.spent)
      bad.push(
        `seed ${a.seed} gen ${g}: visits spent ${x.spent} vs ${y.spent}`,
      );
    if (!!x.informative !== !!y.informative)
      bad.push(`seed ${a.seed} gen ${g}: informative flag differs`);
    if (!x.informative) continue;
    informativeChecked++;
    for (const f of ["p", "r", "w"]) {
      const u = x[f],
        v = y[f];
      if (u == null && v == null) continue;
      if (u == null || v == null) {
        bad.push(`seed ${a.seed} gen ${g}: ${f} is ${u} vs ${v}`);
        continue;
      }
      if (Math.abs(u - v) > 1e-12)
        bad.push(`seed ${a.seed} gen ${g}: ${f} ${u} vs ${v}`);
    }
  }
  if (a.fate !== b.fate)
    bad.push(`seed ${a.seed}: fate ${a.fate} vs #55's ${b.fate}`);
}

console.log(
  `C8 anchor — #56 cell 30:A against #55 arm A\n` +
    `  seeds compared      : ${seeds}\n` +
    `  generation rows     : ${rowsChecked}\n` +
    `  informative rows    : ${informativeChecked} (these carry p, r and w)`,
);
if (bad.length) {
  console.error(`\n  C8 FAIL — ${bad.length} disagreements, first 10:`);
  for (const b of bad.slice(0, 10)) console.error(`    ${b}`);
  console.error(
    `\n  The two implementations of w/r have drifted, or the N0=30 configuration is\n` +
      `  no longer the one #55 ran. Nothing is reported about any N0 until this passes.`,
  );
  process.exit(3);
}
/* ⚠️ a check that compared nothing would print the same PASS */
if (informativeChecked < 200) {
  console.error(
    `\n  C8 INCONCLUSIVE — only ${informativeChecked} informative rows compared. ` +
      `A gate that inspects almost nothing passes on almost anything.`,
  );
  process.exit(4);
}
console.log(
  `\n  C8 PASS — every row identical to 1e-12. The second implementation of w and r\n` +
    `  agrees with #55's exactly, on the same simulation.`,
);
