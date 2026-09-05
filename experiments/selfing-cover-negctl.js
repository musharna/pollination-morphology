/*
 * #64 — NEGATIVE CONTROL FOR THE CONTROLS THEMSELVES.
 *
 * C-null, C-match, C-cover, C-kill and C10 have only ever been seen to PASS. A
 * control that has never been seen to fail is not yet a control — it may be
 * asserting something that cannot be false on any input the analysis will ever
 * receive. #63 promoted this pattern out of scratch after it caught nothing and
 * proved four things; #64 inherits it and adds the two controls that are new.
 *
 * ⚠️ THE ONE THAT MATTERS MOST IS C-NULL. It is the only bit-level control in
 * the project, and a bit-level comparison is exactly the kind of assertion that
 * can silently degrade into a tautology — compare a thing to itself, or compare
 * a field set that happens to be empty, and it passes forever. Case 1 below
 * perturbs a single number in a single row of the q=0 cell; if the analysis does
 * not notice, the C-null is decoration.
 *
 * This doctors a copy of a smoke dump so each control's premise is violated in
 * turn, and asserts the analysis NOTICES and exits 3. It touches nothing a
 * queued sweep reads: input and output are both scratch JSON.
 *
 *   node experiments/selfing-cover-negctl.js _scratch/rf64-smoke.json
 */
const fs = require("fs");
const { execFileSync } = require("child_process");

const SRC = process.argv[2] || "_scratch/rf64-smoke.json";
if (!fs.existsSync(SRC)) {
  console.error(`no dump at ${SRC} — pass a sweep dump with all eight cells`);
  process.exit(2);
}
const base = JSON.parse(fs.readFileSync(SRC, "utf8"));

const run = (doc, tag) => {
  const p = `_scratch/rf64-negctl-${tag}.json`;
  fs.writeFileSync(p, JSON.stringify(doc));
  let out = "",
    code = 0;
  try {
    out = execFileSync("node", ["experiments/selfing-cover.js", p], {
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
    console.log(
      `    ⚠️⚠️ NOT DETECTED — the control passed a violated premise`,
    );
  return code === 3;
};

const clone = () => JSON.parse(JSON.stringify(base));
let ok = 0,
  n = 0;

/* 1. THE C-NULL. One number, one row, one seed — the q=0 arm stops being the
 * flat arm. If a whole-cell perturbation were needed to trip this, the control
 * would not be bit-level in any useful sense. */
{
  const d = clone();
  const r = d.cells["30:R200q0"][0];
  r.rows[0].selfWTot = r.rows[0].selfWTot * (1 + 1e-9);
  n++;
  if (run(d, "cnull-one-value-in-one-row")) ok++;
}

/* 2. the C-null again, on a field the primary actually reads, so a pass here
 * cannot be explained by the walk visiting only inert bookkeeping */
{
  const d = clone();
  for (const r of d.cells["30:R200q0"]) r.fate = "LOST";
  n++;
  if (run(d, "cnull-fate-diverges")) ok++;
}

/* 3. the arms stop spending the same total (C-match) */
{
  const d = clone();
  for (const r of d.cells["30:R200q69"])
    if (r.rows[0] && r.rows[0].selfWTot != null) r.rows[0].selfWTot *= 1.5;
  n++;
  if (run(d, "match-arms-spend-different-totals")) ok++;
}

/* 4. an arm withholds from a share its NAME does not claim (C-cover) */
{
  const d = clone();
  for (const r of d.cells["30:R200q25"])
    for (const row of r.rows)
      if (row.selfWZero != null)
        row.selfWZero = row.n0 + row.n1 + (row.nh || 0);
  n++;
  if (run(d, "cover-realised-share-contradicts-the-name")) ok++;
}

/* 5. the flat floor kills somebody, which it cannot do — it starves nobody
 * (C-kill) */
{
  const d = clone();
  for (const r of d.cells["30:R200"])
    for (const row of r.rows) if (row.killed != null) row.killed = 1;
  n++;
  if (run(d, "kill-the-flat-floor-killed-somebody")) ok++;
}

/* 6. the exposed class itself becomes a treatment effect, so the kill RATE
 * acquires a treatment-movable denominator (C-kill's own guard) */
{
  const d = clone();
  for (const r of d.cells["30:R200q85"])
    for (const row of r.rows)
      if (row.recvZero != null) row.recvZero = row.n0 + row.n1 + (row.nh || 0);
  n++;
  if (run(d, "kill-exposed-class-moves-with-treatment")) ok++;
}

/* 7. an arm stops selfing entirely (C10) */
{
  const d = clone();
  for (const r of d.cells["30:R200q50"])
    for (const row of r.rows) row.selfedN = 0;
  n++;
  if (run(d, "c10-a-coverage-arm-never-selfs")) ok++;
}

/* 8. the no-floor anchor starts selfing, which would mean it is not an anchor
 * (C10, the other direction — a control that only fires one way is half a
 * control) */
{
  const d = clone();
  for (const r of d.cells["30:A"])
    for (const row of r.rows) {
      row.selfedN = Math.max(1, Math.round((row.matingsN || 10) / 2));
      row.matingsN = row.matingsN || 10;
    }
  n++;
  if (run(d, "c10-the-no-floor-anchor-selfs")) ok++;
}

/* 9. an arm selfs at a rate that is NONZERO BUT WRONG — the exact shape the
 * killed mutation run left in the tree, where `w = target / n` stood in place
 * of `target / nKeep` and every coverage arm spent only nKeep/n of the budget.
 * The weak C10 above ("does it self at all") passed that mutant happily: the
 * arms read 0.590 / 0.496 / 0.372 / 0.210, all comfortably above zero. Cases 7
 * and 8 would both have passed it too, so without this case the sharpened C10
 * is the one assertion in this file with no negative control of its own. */
{
  const d = clone();
  for (const r of d.cells["30:R200q69"])
    for (const row of r.rows) {
      const m = row.matingsN || 0;
      if (m) row.selfedN = Math.round(m * 0.4);
    }
  n++;
  if (run(d, "c10-an-arm-selfs-at-the-wrong-rate")) ok++;
}

/* 10. POSITIVE CONTROL — untouched input must still pass, or the harness itself
 * is broken and every "detected" above would be meaningless */
{
  const d = clone();
  const p = "_scratch/rf64-negctl-clean.json";
  fs.writeFileSync(p, JSON.stringify(d));
  let code = 0;
  try {
    execFileSync("node", ["experiments/selfing-cover.js", p], {
      encoding: "utf8",
    });
  } catch (e) {
    code = e.status;
  }
  console.log(`--- POSITIVE CONTROL (untouched): exit ${code}`);
  n++;
  if (code === 0) ok++;
  else console.log(`    ⚠️⚠️ the clean input FAILED — the harness is broken`);
}

console.log(
  `\n${ok}/${n} — every violated premise detected, clean input still passes`,
);
process.exit(ok === n ? 0 : 1);
