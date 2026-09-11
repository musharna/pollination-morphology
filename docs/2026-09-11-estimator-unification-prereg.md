# Pre-registration — retire the hand-rolled `ci()` helpers

**Date:** 2026-09-11 · **Status:** registered, NOT run · **Registers:** disposition row 8 of
[RELEASE-1.0.md](RELEASE-1.0.md) §2.4, deferred there as "future work" because it changes
experiment output.

The causal fix is to delete the duplicated normal-approximation helpers and route every interval
through `sim/paired-stats.js`, the single correct estimator. This document registers what that is
expected to move **before** it is run, because the only reason to do it is trustworthiness, and a
correction whose outcome was decided after seeing the output buys none.

## 1. The inventory, adjudicated

`grep -rn '1\.96' experiments/ sim/` returns six sites. **Four are defects; two are correct by
design** and must not be "fixed":

| site                                                  | verdict                                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `sim/paired-stats.js` `Z_CRIT`                        | **not a defect** — `interval()` returns `t` and `z` side by side deliberately, so a reader can see the difference  |
| `experiments/boundary-interior.js:177` `let t = 1.96` | **not a defect** — the df > 30 fallback, where z _is_ the correct asymptote; a table supplies proper t for df ≤ 30 |
| `experiments/hybrid-placement.js:325`                 | **defect** — bare `1.96`; publishes to `2026-08-02-hybrid-placement.md`; n = 58                                    |
| `experiments/density-dependence.js:58`                | **defect** — bare `1.96`; publishes to `2026-08-04-density-dependence.md`; **n never recorded**                    |
| `experiments/secondary-contact.js:255`                | **defect** — bare `1.96`; publishes to `2026-08-04-secondary-contact.md`; n ≈ 12                                   |
| `experiments/limiting-factors.js:56`                  | **defect in code only** — the helper exists, no `±` reaches any document                                           |

⚠️ This corrects a miscount made while scoping: a file-level grep for `1.96` suggests **five**
experiments. Two of the six hits are correct, and one of the four defects publishes nothing, so the
number of **published** intervals at stake is **three**.

`interval(d)` in `sim/paired-stats.js` is the mathematically correct replacement for all four: it is
mean ± t(n−1)·se on a vector, which is what each `ci()` is computing with the wrong critical value.
It also refuses to fall back to z — `tCrit` throws on a df it cannot serve — and flags `degenerate`
when sd = 0. No new statistics are being introduced.

## 2. ⚠️ The finding that decides the design: this cannot be run on today's code

**Every one of the four experiments sits downstream of code that has moved since it published.**

```
git log --oneline --since=2026-08-04 -- sim/     →  34 commits
touched: carryover.js  evolve.js  ibm.js  verdict-gates.js  paired-stats.js  browser-bundle.js
```

| experiment           | depends on                                                                |
| -------------------- | ------------------------------------------------------------------------- |
| `hybrid-placement`   | `placement.js`, **`carryover.js`**, **`evolve.js`**                       |
| `density-dependence` | **`ibm.js`**, **`evolve.js`**, **`carryover.js`**                         |
| `limiting-factors`   | **`ibm.js`**, **`evolve.js`**, **`carryover.js`**, `placement.js`         |
| `secondary-contact`  | **`ibm.js`**, **`evolve.js`**, **`carryover.js`**, **`verdict-gates.js`** |

So a naive re-run produces numbers that differ from the published ones for **two confounded
reasons** — the estimator changed _and_ the model changed — and no amount of care afterwards can
separate them. This is precisely the trap `2026-08-01-v2-result.md` fell into and that the ROADMAP's
instrument-debt section records as its lesson: _"a result is not unreproducible merely because
today's code disagrees with it; pin the model version before concluding that."_

**Registering the design in advance for that reason:**

- **Arm A — PIN.** Check out `sim/` at each document's publishing commit, swap only the estimator,
  re-run. Isolates the estimator exactly. This is the arm that can make a _correction_ claim.
- **Arm B — CURRENT.** Run on today's `sim/`. Produces today's numbers. This arm can only
  **supersede**, never correct, and any difference from the published value is uninterpretable on
  its own.

**Both arms are required, and A is what licenses the claim.** Running B alone is the v2 mistake
repeated knowingly.

## 3. Registered predictions

**P1 — no published directional verdict moves.** Every verdict in the three publishing documents
holds under the t estimator. Already shown analytically in RELEASE-1.0 §2.3 by exact rescale
(`h_t = h_z · t(df)/z`), down to the worst admissible n. **Refuted** if any directional claim
flips in arm A.

**P2 — the point estimates in arm A reproduce the published ones exactly.** Same seeds, same pinned
model, and the estimator touches only the half-width, never the mean. **Refuted** if any point
estimate moves at all in arm A — which would mean the pin is wrong or the published number never
came from the committed runner, and that is a bigger finding than the estimator.

**P3 — `density-dependence`'s n lands in [3, 5].** The runner draws `SEEDS = [1,2,3,4,5]` with
`continue` guards that can drop seeds, so n ≤ 5; RELEASE-1.0 §2.3 could only bound the interval
because n was never recorded. **This is the one place the work gains information rather than
tidiness** — it converts a bounded claim into an exact one. **Refuted** if n < 3 (the published
interval would then be more than 2.19× too narrow, which is interpretation-changing even though the
direction survives).

**P4 — arm B differs from arm A somewhere.** 34 commits including a transfer-rate recalibration and
a continuous-overlap-metric change should move something. **If arm B matches arm A everywhere, that
is the surprise**, and it means these four experiments are insensitive to the drift — worth
recording either way.

**Not predicted, deliberately:** the size of any interval widening. It is `t(df)/z` exactly and is
arithmetic, not a result. Computed with the repo's own `tCrit` against its `Z_CRIT` = 1.959964:
**1.0217** at n = 58 (+2%), **1.1230** at n = 12 (+12%), **1.4166** at n = 5 (+42%), **2.1953**
at n = 3 (+120%).

## 4. What this is NOT

Not a re-opening of any headline finding. None of the four is a pre-registered headline result;
they are foundation and diagnostic documents. The four FINDINGS headlines already route through
`sim/paired-stats.js` and are untouched by this work.

## 5. Cost — unmeasured, and how to measure it

**No runtime is recorded for any of the four.** None of the documents carries a job line. Rather
than invent an estimate:

- all four ship a **SMOKE mode** (`SMOKE`/`LF_SMOKE`, `SEEDS = [1,2]`, `N = 12` vs 30) designed for
  exactly this — a smoke run of each gives a per-seed cost to extrapolate from, in minutes not hours;
- full runs are `SEEDS = [1..5]` at `N = 30`.

**Step 0 of the work is therefore: smoke-run all four, record wall time, extrapolate, and write the
number into this document** — and into the four result documents, which is a gap this release
already flagged for findings 2 and 4.

Doubling for the two-arm design (§2) applies to whatever that measurement returns.

## 6. Abandon conditions

- If arm A cannot be pinned — the publishing commit for a document cannot be identified — that
  document drops to arm B only and is explicitly labelled **superseded, not corrected**.
- If the smoke extrapolation puts the two-arm total beyond a session's patience, run
  `density-dependence` alone: it is the only one with information to gain (P3), and the other three
  are code hygiene whose published intervals are already corrected in RELEASE-1.0 §2.3.

## 7. Related

`sim/paired-stats.js`'s own header names this: _"Task #43 in the tracker is exactly this."_ The
duplication it was extracted to end is still live in the four sites above.
