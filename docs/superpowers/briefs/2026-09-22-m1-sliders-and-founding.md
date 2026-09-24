# Executor brief: M1, the sandbox's eight sliders, hand-set founding, the page loop as a file.

Repo `/home/<user>/pollination-morphology`, master `09ffee0`. Authority: the spec
`docs/superpowers/specs/2026-09-12-northstar-design.md` — §3 items 1–4 (:108-165), §9 M1 row (:384)
and the "ONE rng protocol" paragraphs after the table (:392-420), §6 (bands). Read them fresh
before writing anything; the spec wins over this brief wherever they differ. Engine `sim/` must
NOT change in M1 (`git diff master -- sim/` empty at the end).

## Scope
1. `population.html`: two gene panels (lineage 1, lineage 2), eight sliders each, bounds read from
   `Evolve.GENE_BOUNDS` at load (never retyped) + `antherTheta` in [-π, π]; labels per the §3
   table; the herkogamy note under the panel; `reach` and `bodyLen` sliders labelled "bee, fixed
   for the run"; both lineages' anther + stigma sites drawn live on the bee via
   `Placement.placementDistribution` / `IBM.placementOf(sitesOf)`; "never touches the bee" state;
   realised separation (as `foundTwoLineages` computes `realised`) with its §6 band and the
   level-1 target "reach 8" shown at load, labelled distinctly from the cluster-separation tile.
2. Founding from the two hand-set genomes by the recipe of §3 item 4: two `foundPopulation` calls,
   `half` and `N - half`, `base` = genome + `[SIGNAL_GENE]: srng()` (lineage 1 then 2), `anc` 0 / 1,
   spread 0.02; the `d` input and `foundTwoLineages` stay behind a "found at target d" switch
   (default: hand-set). Level 1's start genome = `Evolve.randomGenome(Evolve.makeRng(1))` with
   `signal` 0.5 for both lineages.
3. The page's generation loop moves out of the inline script into `population-run.js`, loaded by
   `<script src>`, exposing `window.SandboxRun.runGenerations(found, opts, rng, srng, gens)`;
   `buildRun` calls it and keeps only DOM reads. Add the file to `tools/build-site.sh`'s allowlist.
4. `tests/browser-bundle.test.js` fidelity test (:157-200) rewritten: loads `population-run.js` into
   the fake browser after the bundle and EXECUTES `runGenerations`, sharing `rng`/`srng` with
   founding (page protocol: make both once, found, then step with the same two), and asserts the
   frames' fate + quantities equal the null tables' rows (target 8 seed 1 `one lost`, 0 of 24 hybrid
   generations, realised 8.124; target 4 seed 16 `one lost`, 1 of 24, ratio 0.111 — see
   `docs/2026-09-13-northstar-null-tables.md` and `tools/northstar-null-tables.js` for the exact
   statistics). A check asserts the test file contains no call to `I.step`.
5. Acceptance tests (new `tests/sandbox-m1.test.js` or inside the bundle test):
   - slider sensitivity: at `DEFAULT_BEE` on the fixed start genome, each of the seven moving genes
     swept bound to bound shifts lineage 2's anther dot ≥ 0.1 body distance; `curve` carries the
     "no effect at this bee" label (expected magnitudes in the M1 row: antherT 11.216, throatR
     7.544, antherTheta 7.465, axisLen 4.376, polarity 0.642, mouthR 0.415, antherProject 0.188,
     curve 0.000).
   - founders: every allele at every `IBM.ALL_KEYS` key on both haplotypes finite for both
     lineages; N = 5 → exactly 5 plants, 2 `anc` 0 + 3 `anc` 1; N = 30 → 30, 15 + 15.
   - the target reads beside the separation before any click (DOM assertion in the fake browser).
6. `tools/smoke-site.py`: one assertion for the M1 acceptance line (sliders present with the
   GENE_BOUNDS ranges; separation + target visible at load) if the smoke drives a page today;
   otherwise leave a TODO comment naming M2.

## Reference (read-only)
Verified recipe + probes: `/home/<user>/.claude/jobs/<job>/tmp/v6-pollen/probe6.js` (F2b
block = the founding recipe exactly as the spec means it, and the fixed-bee stall fixture for M2);
`/home/<user>/.claude/jobs/<job>/tmp/v4-pollen/probe5_gene_sensitivity.out` (slider magnitudes).

## Rules
- Branch `m1-sliders` off master; small commits; NO push; no attribution lines.
- TDD: each test seen to FAIL for the stated reason before it passes (report the failing output
  for the sensitivity test and the founder-count test at least). A test that passes on the
  pre-change page is a test that cannot fail — say so and fix the test.
- Full suite `node --test tests/` green at the end (381 today + yours); it takes ~3 min — run it
  in the background with output to a file, not in a foreground call.
- Run `tools/build-site.sh` and open the built page in the fake browser; assert the eight
  sliders exist with the GENE_BOUNDS min/max attributes.
- The a11y commit `4502d69` added labels/ARIA to population.html — keep every existing a11y
  attribute; `tests/a11y.test.js` must stay green.
- Stay inside `/home/<user>/pollination-morphology`. Touch no other repo, not the memory dir.
- Final report: commits, test counts before/after, the measured slider magnitudes vs the spec's,
  and anything that did NOT match (say so plainly; a mismatch is a finding, never a rounding).
