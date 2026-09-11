# Changelog

All notable changes to this project are recorded here. This file starts at the first
public release; the full research history is in `docs/ROADMAP.md`, which is canonical.

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
13. `docs/2026-07-31-groundwork-axes.md` referenced a local `~/sim-zoo` path in three places;
    replaced with "a sibling project (not published)".
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
