# Executor brief: M2, RUN on the hand-set pair, the engine's fate with STALLED, cards 1 and 4.

Repo `/home/mjarnold/pollination-morphology`, master `0617b47`. Authority: the spec
`docs/superpowers/specs/2026-09-12-northstar-design.md` — §3 "A stall is a loss" (:193-227), §4 the
trigger rule, signature rule, **precedence (grey wins)** and cards 1 and 4 (:235-280), §9 M2 row (:385)
and the smoke/`data-state` paragraphs (:424-434), §8's one sanctioned `sim/` change (:362-363). Read them
fresh; the spec wins over this brief wherever they differ. The spec's `population.html:NNN` refs predate
M1 (which moved the loop into `population-run.js`); locate code by content, not line number.

## Scope
1. **Engine (the only `sim/` change):** `fateOf(finalPop, ancVar0, extinct, stalled = false)` in
   `sim/ibm.js:539` returns `"STALLED"` when `stalled`, tested AFTER the `BOTH LOST` line and BEFORE
   the HELD line. Every existing 3-arg caller unchanged. Engine test in `tests/`: the §3 reach-switch
   protocol (`foundTwoLineages(30, rng, srng, 8, {...DEFAULTS, siteN: 160})` at `DEFAULT_BEE`, every
   `step` at `bee.reach` 0) → 35 of 35 generations recruit 0 and fate STALLED; its control at reach
   0.85 recruits > 0 and is not STALLED; plus a unit case that `BOTH LOST` still wins over `stalled`.
2. **Tool:** `tools/northstar-null-tables.js:130` passes `stalled` (any generation's `recruits` === 0).
   Regenerate the tables it prints and diff against `docs/2026-09-13-northstar-null-tables.md`; any row
   that changes is a finding to report, not to paper over (expected: none).
3. **Page loop (`population-run.js` + `population.html`):** keep the FINAL offspring (`res.pop` after
   the last step), score `IBM.fateOf(finalPop, v0, extinct, stalled)` on it (drop the page's own
   `fateOf` copy and its "one lineage lost" string — the engine's five strings verbatim); `stalled` =
   any generation's `recruits` === 0; the fate tile prints "k of G generations recruited nothing" and
   label counts beside the fate.
4. **Tiles:** hybrid fraction and gap occupancy tiles; every tile shows its band and signature.
5. **Cards 1 and 4** under the fate tile, each `data-state` in `open | closed | grey`, decided by the
   §4 precedence: outside the card's signature → `grey` whatever the quantities (prints "measured at
   ...; this run ..."); inside → `open` iff the measured quantity is beyond the edge (card 1: receipt
   ratio < 0.603 on PARENTS' `anc`, last generation both sets non-empty, closed if either set always
   empty, and "no edge" → grey at the level configuration; card 4: 0 hybrid generations with fate
   `one lost`). STALLED opens no card. Cards 2, 3, 5, 6 exist as `grey` placeholders only (their
   state is asserted by the stall fixture); they are built in M3.
6. **Acceptance (node tests in the fake browser, `tools/fake-dom.js`, executing `population-run.js`):**
   - card 4: target 8 seed 1 via the "found at target d" switch (`foundTwoLineages`) → `one lost`,
     0 of 24 hybrid generations, realised 8.124, card 4 `open`;
   - card 1: target 4 seed 16 → `one lost`, 1 of 24, ratio 0.111, card 1 `open`;
   - both equal `node tools/northstar-null-tables.js card14 page 16 16` / `1 1` (run the tool in the
     test, do not hand-copy its numbers);
   - null block: seeds 1–5 × targets 4 and 8 under `randomMating` → 23 of 24 hybrid generations all
     10, ratios ≥ 1.146 or Infinity, `data-state` grey on cards 1 AND 4 for all ten;
   - stall fixture: both lineages `Evolve.randomGenome(Evolve.makeRng(4))` with `antherT` 0.825, M1's
     recipe (`SandboxRun.foundFromGenomes`), seed 1, level configuration, `DEFAULT_BEE` → STALLED,
     35 stalled generations, cards 1 and 4 `closed`, 2/3/5/6 `grey`; control `antherT` 0.80 → FUSED,
     0 stalled. Also assert 0.85 → null placement and the page declines to found.
7. **Re-measurement (spec M2 row, last sentence):** under the hand-set recipe, re-measure the two
   positive seeds and the seeds 1–5 null block, write the table into the null-tables doc as a new
   section (tool mode or script committed under `tools/`, never hand-typed). Do NOT recalibrate any
   edge. Do NOT remove the `d` switch in M2 — report whether the re-measured positives still open.
8. **Smoke:** `tools/smoke-site.py` gains one assertion per acceptance line reading `data-state` from
   the DOM (positive seed, null block sample, the STALLED run). Local only until M4.

## Reference (read-only)
`/home/mjarnold/.claude/jobs/0276dcca/tmp/v6-pollen/probe6.js` + `controls.out` — the verified
fixed-bee fixture and its 0.80/0.85 controls. M1's brief for conventions:
`docs/superpowers/briefs/2026-09-22-m1-sliders-and-founding.md`.

## Rules
- Branch `m2-run-cards` off master; small commits; NO push; no attribution lines.
- TDD: every new test seen to FAIL for its stated reason before it passes (report the failing output
  for STALLED, card-state precedence, and the null block). A test that passes on the pre-change code
  cannot fail — fix it.
- `git diff master -- sim/` = the `fateOf` change only.
- Full suite `node --test tests/` green (391 today + yours); run it in the background to a file
  (> 3 min). `tools/build-site.sh` builds; `tests/a11y.test.js` stays green; keep every a11y attribute;
  new cards/tiles get labels.
- Stay inside this repo. Touch no other repo, not the memory dir.
- Final report: commits, test counts before/after, the tool's regenerated-table diff, the
  re-measurement table, every number that did NOT match the spec (a mismatch is a finding, never a
  rounding).
