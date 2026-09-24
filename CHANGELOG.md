# Changelog

All notable changes to this project are recorded here. This file starts at the first
public release; the full research history is in `docs/ROADMAP.md`, which is canonical.

## [Unreleased]

### Added

- Northstar M4, consolidation: `population.html` is renamed `sandbox.html` and the landing
  page leads with it; `greybox.html` is removed (the sandbox carries its reveal); the
  browser smoke (`tools/smoke-site.py`) now runs in the Pages workflow after the build,
  so a page that loads with console errors or a sandbox whose `#run` does not evolve
  blocks the deploy.
- Northstar cards are founding-aware: cards 1, 2, 3, 5 and 6 are grey unless the run is
  founded at the target d their edges were measured under, and levels 2 to 6 load it.
- Basic accessibility on `visit.html` and `population.html`: every control is labelled, each
  canvas carries `role="img"` + `aria-label` and a visually-hidden `aria-live` text mirror of the
  readouts the page already computes, landmarks (`<main>`, `<section aria-label="Controls">`),
  a `:focus-visible` style, and `prefers-reduced-motion` (CSS animations off; the render loop
  drops to ~4 fps — the model is untouched, since both pages compute results independently of
  the frame clock). `tests/a11y.test.js` asserts this and fails against the pre-change pages.
  (Independent review panel, 2026-09-15.)

### Fixed

- `visit.html` and `population.html` had no `<meta name="viewport">`, so phones rendered them
  desktop-scaled; only `greybox.html` had one. Both now carry it. (Independent review panel,
  2026-09-15.)

### Changed

- The Pages deploy is now gated on the simulation suite: `node --test tests/` runs in the build
  job before `site/` is assembled. Previously the workflow only asserted that files existed, so a
  broken simulation still shipped green.

## [1.0.1] — 2026-09-11

A documentation-only release, closing the punch list from a ten-judge review panel convened after
1.0.0 shipped. **Every change is to what is _said_, never to what was _measured_.** No experiment
was re-run, no analysis re-registered, nothing under `sim/` touched. The test suite is unchanged at
363/363.

### Corrected — claims that disagreed with their own sources

1. `README.md` said an evolving community reaches **40%** of the achievable ceiling. The document of
   record says **52%** (evolved L2 8.3 against a ceiling of 16, after the head-cap correction,
   `docs/2026-08-01-v1-result.md:51`). Corrected, and the number now cites its source.
2. **Finding 1 was titled with its registered _secondary_.** "Worse than no floor at all" is the
   anchor crossing (−0.211), a secondary endpoint; the registered **primary** is −0.221 against the
   flat floor. Retitled to the primary, secondary kept and still labelled. The same misstatement on
   the landing page (`tools/site-index.html`) is corrected. Added beside finding 1: the disclosure —
   already in the pre-registration — that the primary endpoint was chosen **after seeing #63's data**.
3. **Finding 2's headline number was labelled `H-pool`, which was never registered.** The
   pre-registration registers `H-free` (predicted **NULL**) and `H-link` only. +0.289 [0.158, 0.447]
   is relabelled as the registered `H-free` contrast, the **refutation of the registered null** is
   now stated plainly, and `H-pool` is marked a post-hoc control.
4. `docs/ROADMAP.md` printed the retracted z-interval `[0.708, 0.910]`; annotated in place to the
   corrected `[0.706, 0.912]`. Its "pool-size confound excluded by measurement" bullet is annotated
   to match FINDINGS: under the proportional visit rule `H-pool` spans zero. "Last updated" refreshed.
5. `README.md` said the empirical ceiling number was "not yet in hand". It has been measured —
   14 orchid species per euglossine bee within one region against the 1-D arm's 19 — and the
   paragraph now carries the result, the bound's looseness in both directions, and the caveat.
6. `README.md` promised "four pre-registered results" without listing them. Added a **What was
   measured** table (number, interval, caveat, link per finding); the lab notebook that preceded
   pre-registration moved under a **Foundation** heading below it; **L0/L1/L2, τ and IBM** are now
   defined once, with sources.

### Corrected — reproducibility and links

7. `docs/2026-08-28-euglossine-ceiling.md` gave a re-run command pointing into the gitignored
   `_scratch/`. The parser was never committed and is **not recoverable** — searched across every
   git ref and disk-wide. The document now says so, states the input and procedure so the count can
   be re-derived by a fresh parse, and the gap is recorded in FINDINGS.
8. The three playables' footers linked `index.html`, which exists only inside the built `site/`.
   "Home" now points at the published site, so the link works from a local file too.
9. "Node 18 or newer" understated what the repo needs. FINDINGS and README now carry a requirements
   table: the suite is verified on **v18.19.1**; `tools/run-*.sh` require `NODE_BIN`;
   `tools/smoke-site.py` requires Playwright + Chromium and is optional.
10. Re-run cost is now stated. **Only finding 1 re-derives from a shipped archive** (seconds);
    findings 2–4 re-run a full sweep with no archive. Finding 3's published run is recorded at
    29.8 min; findings 2 and 4 record no runtime, and none is invented for them.
11. `README.md` cited "Mailly & Lihoreau 2025", a thesis with no DOI. Now cites the paper —
    Mailly, Riotte-Lambert & Lihoreau 2025, `10.3389/fevo.2025.1504480` — byline and year verified
    against CrossRef. The DOI was already in `docs/dois.txt`.

### Corrected — hygiene and metadata

12. `docs/RELEASE-1.0.md` waived "a non-verbatim quote" without naming it. It was the Ballantyne
    quotation at `README.md:20-21`, whose ellipsis concealed a dropped word; the quote is now
    verbatim and the waiver names it. The log's three conflicting commit counts (7 / 8 / "Eight"
    over nine entries) are reconciled to the measured **9**. A banner marks the file as a **release
    evidence log, not a findings document**.
13. `docs/2026-07-31-groundwork-axes.md` referenced a local home-directory path belonging to an
    unpublished sibling project, in three places; replaced with "a sibling project (not published)".
14. `greybox.html`'s title dropped its stale "v0".
15. `CITATION.cff` licence note corrected. CFF 1.2.0 _does_ accept a list of licences, but its
    schema reads multiple licences as **OR**, while this repo's split is **AND**, by file class — so
    a list would tell a reader they may take the whole work under either. The single identifier plus
    an explicit note is the closest honest encoding, and `license-url` is deliberately unset because
    the schema reserves it for non-SPDX licences.
16. This entry.
17. `docs/2026-08-01-v2-result.md`'s Round-2 table now carries a warning box at the table itself:
    it mixes a 250-generation row with a 120-generation reference while presenting itself as a
    visit-budget sweep.

### Also corrected — found by this release's own critic pass, not by the panel

An independent pass over the landing page, `README.md` and `FINDINGS.md` found one defect of the
class the release calls **non-waivable** (a number disagreeing with its source), plus several
smaller ones. All are fixed:

18. **A front-page number had no source and the verdict attached to it was inverted.**
    `README.md` read "converting Gigord et al. 2001 gives an exponent of −0.24 against the −0.30
    needed" — asserting a **shortfall** in the same breath as "Real animals reach that". Neither
    −0.24 nor −0.30 appears anywhere in the repository. The source gives exponents of
    **−0.259 / −0.248 / −0.228**, i.e. `a ≈ 0.43` against a crossing at `a ≤ 0.5`, and says plainly
    "**it clears the crossing**" — as does `ROADMAP.md`, "the bar IS met in nature". Corrected to
    the measured exponents and the real threshold; the mechanism still fails, for the reason the
    rest of the paragraph already gave.
19. **Finding 3 quoted three values and no intervals, and one of the three spans zero.** Both
    `README.md` and `FINDINGS.md` now carry `[0.140, 0.442]` / `[−0.061, 0.228]` / `[0.115, 0.352]`,
    and FINDINGS says in terms that `S=16` is a null and that the direction claim rests on `S=8`
    and `S=32`. The landing page promises numbers "and their intervals"; for this finding it had
    not been keeping that promise.
20. **`2026-08-25-phenology.md` headed its contrast table "The registered contrasts" while listing
    `H-pool`, which was never registered.** Heading corrected and annotated. This is the same defect
    as item 3, in the source document rather than in the summary — fixing only the summary would
    have left FINDINGS and its own cited source disagreeing about what was registered.
21. **`README.md` described the 1-D steelman as getting "the whole body surface".** It gets the
    whole body **length**; the whole body _surface_ is the 2-D ceiling control, a different arm —
    and the README's own new terms table said so two paragraphs earlier.
22. **"the stigma contacts 81% of visits there"** pointed at ~0.15 herkogamy, where the measured
    value is 67%. The 81% is at separation 0.270. Both are now named.
23. **A blockquote labelled "verbatim" was not.** The northstar quote in FINDINGS silently dropped
    a date from inside a bolded span. Restored.
24. **"A correction shipped with this release"** described the **1.0.0** erratum. Retitled, with a
    note that 1.0.1 changed no measurement at all.
25. **Finding 4's heading co-headlined an unregistered readout.** "the half that acts, acts against
    it" rests on a continuous ancestry-variance readout (−0.082 [−0.143, −0.030]), which the source
    itself files apart from the registered fate-based endpoints. Now labelled as such, as `H-pool`
    is in finding 2.
26. Four line-level citations added in this release pointed at pre-edit line numbers in a file this
    release had itself shifted. Corrected and re-verified.

One critic finding was **rejected on re-checking**: "three independent re-measurements" in
`README.md` is correct — `docs/2026-08-03-checks-rebaseline.md:114` says "it survives its **third**
independent re-measurement".

Full per-item dispositions, including what was **not** fixed and why, are in
`docs/RELEASE-1.0.1.md`.

## [1.0.0] — 2026-09-10

First public release. The science is unchanged from what was already measured — this
release makes it readable, playable and citable by someone who has never seen the repo.

### What ships

- **Three browser playables**, no build step and no dependencies: `visit.html` (one bee
  loading pollen in one flower and failing to deliver it to the next), `greybox.html` (the
  same reveal stripped to its mechanism), `population.html` (a community evolving on one
  shared pollinator).
- **`docs/FINDINGS.md`** — the results for a stranger. Four headline findings, selected
  under a stated rule: **pre-registered primary endpoints only**, each with its number,
  interval, study number, source document, generating command and producing commit.
- **A static site** published to GitHub Pages from an allowlisted `site/` staging
  directory, assembled by `tools/build-site.sh` and verified by `tools/smoke-site.py`.
- **Licensing**: MIT for code, CC-BY-4.0 for text, figures and data tables.
  `CITATION.cff`, `docs/THIRD-PARTY.md` (nothing third-party, verified by listing) and
  `docs/dois.txt` (176 DOIs, checked for retraction and resolvability).

### Erratum

- **The z→t correction was verified independently, and the inventory it required found
  the same defect in four more places.** `docs/2026-08-01-v2-result.md` had already
  corrected its normal-approximation intervals to Student's t in August; that arithmetic
  was re-derived from scratch here and reproduces exactly. Sweeping the whole tree then
  found bare `1.96` critical values still live in four experiments.
- **One claim was withdrawn.** `docs/2026-08-02-hybrid-placement.md` described its clonal
  control as an interval that "only just excludes 1.0". It does not, and did not under the
  published estimator either — as printed, `0.960 + 0.040 = 1.000` sits exactly on the
  null. Under the correct t(df = 57) it is `[0.919, 1.001]`. The paragraph now says what
  the number supports: the control cannot distinguish hybrids from their own clones at
  this sample size.
- **No headline finding moved.** The 19.1% hybrid mating cost still excludes 1.0
  (`[0.706, 0.912]`), and the density-dependence invasibility verdict survives at every
  admissible sample size — checked to the worst case, where the intervals are 119% wider.
- Intervals in `docs/2026-08-04-density-dependence.md` and
  `docs/2026-08-04-secondary-contact.md` carry qualifiers. Where the sample size was never
  recorded the interval is **bounded rather than re-stated**, because it cannot be
  reconstructed and re-running was out of scope.
- `README.md` advertised a **71-test** suite; it is **363**.

Full dispositions, with the commands and controls behind each, are in
`docs/RELEASE-1.0.md`.

### Known limitations

- **The northstar is open.** A narrow flowering season cannot be derived in this model —
  width evolves wider. Its cause has been corrected three times without the answer ever
  reversing.
- **The empirical ceiling leg is not cleared.** Restricted to one named region the maximum
  is 14 orchid species per euglossine bee against the 1-D arm's 19, so this project says
  "2-D out-packs 1-D _in this model_" and cannot say real richness exceeds what 1-D
  placement supports.
- `docs/2026-08-01-v2-result.md` Round 3 does not reproduce, and its Round-2 table mixes
  run lengths. The conclusion those support survives; the provenance is incomplete.
- Four experiments still compute intervals with a hand-rolled normal approximation instead
  of `sim/paired-stats.js`. No published verdict depends on it. Routing them through the
  single correct estimator is registered as post-1.0 work, because it changes experiment
  output and re-running was outside this release's scope.
