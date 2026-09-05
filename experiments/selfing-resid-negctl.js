/*
 * #63 — NEGATIVE CONTROL FOR THE CONTROLS THEMSELVES.
 *
 * C-resid, C-match and C-zero have only ever been seen to PASS. A control that
 * has never been seen to fail is not yet a control — it may be asserting
 * something that cannot be false on any input the analysis will ever receive.
 *
 * This doctors a copy of the smoke dump so each control's premise is violated in
 * turn, and asserts the analysis NOTICES and exits 3. It touches nothing the
 * queued sweep reads: input and output are both scratch JSON.
 *
 *   node _scratch/rf63-control-negctl.js
 */
const fs = require("fs");
const { execFileSync } = require("child_process");

const SRC = process.argv[2] || "_scratch/rf63-smoke2.json";
if (!fs.existsSync(SRC)) {
  console.error(`no dump at ${SRC} — pass any sweep dump with all four cells`);
  process.exit(2);
}
const base = JSON.parse(fs.readFileSync(SRC, "utf8"));

const run = (doc, tag) => {
  const p = `_scratch/rf63-negctl-${tag}.json`;
  fs.writeFileSync(p, JSON.stringify(doc));
  let out = "",
    code = 0;
  try {
    out = execFileSync("node", ["experiments/selfing-resid.js", p], {
      encoding: "utf8",
    });
  } catch (e) {
    out = (e.stdout || "") + (e.stderr || "");
    code = e.status;
  }
  const flagged = out
    .split("\n")
    .filter((l) => l.includes("⚠️") && l.includes("FAILED"));
  console.log(`--- ${tag}: exit ${code}`);
  for (const l of flagged) console.log(`    ${l.trim()}`);
  if (code !== 3)
    console.log(`    ⚠️⚠️ NOT DETECTED — the control passed a violated premise`);
  return code === 3;
};

const clone = () => JSON.parse(JSON.stringify(base));
let ok = 0,
  n = 0;

/* 1. the shifted arm stops being orthogonal to received */
{
  const d = clone();
  for (const r of d.cells["30:R200s"]) for (const row of r.rows) row.selfWRho = 0.5;
  n++;
  if (run(d, "resid-shift-not-orthogonal")) ok++;
}

/* 2. the clipped arm carries MORE rank-correlation than the dose arm */
{
  const d = clone();
  for (const r of d.cells["30:R200r"]) for (const row of r.rows) row.selfWRhoS = 0.9;
  n++;
  if (run(d, "resid-clip-more-correlated-than-dose")) ok++;
}

/* 3. the arms stop spending the same total (C-match) */
{
  const d = clone();
  for (const r of d.cells["30:R200r"])
    if (r.rows[0] && r.rows[0].selfWTot != null) r.rows[0].selfWTot *= 1.5;
  n++;
  if (run(d, "match-arms-spend-different-totals")) ok++;
}

/* 4. an arm stops selfing entirely (C10) */
{
  const d = clone();
  for (const r of d.cells["30:R200s"]) for (const row of r.rows) row.selfedN = 0;
  n++;
  if (run(d, "c10-shift-arm-never-selfs")) ok++;
}

/* 5. POSITIVE CONTROL — untouched input must still pass, or the harness itself
 * is broken and every "detected" above would be meaningless */
{
  const d = clone();
  const p = "_scratch/rf63-negctl-clean.json";
  fs.writeFileSync(p, JSON.stringify(d));
  let code = 0;
  try {
    execFileSync("node", ["experiments/selfing-resid.js", p], { encoding: "utf8" });
  } catch (e) {
    code = e.status;
  }
  console.log(`--- POSITIVE CONTROL (untouched): exit ${code}`);
  n++;
  if (code === 0) ok++;
  else console.log(`    ⚠️⚠️ the clean input FAILED — the harness is broken`);
}

console.log(`\n${ok}/${n} — every violated premise detected, clean input still passes`);
process.exit(ok === n ? 0 : 1);
