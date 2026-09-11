# Changelog

All notable changes to this project are recorded here. This file starts at the first
public release; the full research history is in `docs/ROADMAP.md`, which is canonical.

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
