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

## 5. Cost — MEASURED 2026-09-11

⚠️ **Correction to this document's first draft:** it said "all four ship a SMOKE mode". **Three do**
— `DD_SMOKE`, `LF_SMOKE`, `SC_SMOKE`. `hybrid-placement.js` has none, so it was timed at full size
instead, which turned out to be cheap enough not to need one.

Probe run under `heavy-run` on a loaded host (1-min load ≈ 16 on 16 cores), so these are
conservative:

| run | mode | wall time | exit |
| --- | ---- | --------- | ---- |
| `hybrid-placement` | **FULL SIZE — measured, not extrapolated** | **48.6 s** | 0 |
| `density-dependence` | smoke (`DD_SMOKE=1`) | 18.0 s | 0 |
| `limiting-factors` | smoke (`LF_SMOKE=1`) | 17.1 s | 0 |
| `secondary-contact` | smoke (`SC_SMOKE=1`) | 11.5 s | 0 |

**Extrapolation, with its assumption stated.** Smoke→full scales three parameters together:
`N0` 12→30 (2.5×), `GENS` 4→35 (8.75×), `SEEDS` 2→5 (2.5×) — a product of **≈54.7×** if cost is
linear in each. (`SITE_N` 50→160 affects a separate phase and is not in the product.)

| experiment | full-size estimate | basis |
| ---------- | ------------------ | ----- |
| `hybrid-placement` | **48.6 s** | measured directly |
| `density-dependence` | ≈ **16 min** | 18.0 s × 54.7 |
| `limiting-factors` | ≈ **16 min** | 17.1 s × 54.7 |
| `secondary-contact` | ≈ **10 min** | 11.5 s × 54.7 |
| **one arm, all four** | **≈ 43 min** | |
| **two arms (§2)** | **≈ 1.5 h** | plus checkout overhead per pin |

⚠️ **Treat the three extrapolated figures as a FLOOR, not a point estimate.** The IBM's per-generation
cost is unlikely to be linear in `N0` — mating is pairwise over the living population — so the true
multiplier is probably above 54.7×. The measured `hybrid-placement` number carries no such caveat.
Linearity was not tested, because `N0`/`GENS`/`SEEDS` are derived from one boolean and cannot be
varied independently without editing the runners, which is out of scope for a cost probe.

**This is small enough to change the plan.** At ≈1.5 h for both arms the abandon condition in §6 is
unlikely to fire, and there is no reason to run `density-dependence` alone.

## 6. Pinning — RESOLVED 2026-09-11, and one conflict found

The first draft's abandon condition was "if the publishing commit cannot be identified". **All four
were identified, and all four are genuine study commits** (each adds its own runner):

| experiment | publishing commit | runner changed since? | PIN |
| ---------- | ----------------- | --------------------- | --- |
| `hybrid-placement` | `9d4df53` (2026-08-02) | **no** | clean — pin `sim/`, swap estimator, run today's runner |
| `density-dependence` | `7f58d96` (2026-08-04) | **no** | clean |
| `limiting-factors` | `16e40aa` (2026-08-04) | **no** | clean |
| `secondary-contact` | `4b1eebd` (2026-08-04) | **yes, 66+/51−** | ⚠️ **conflicted — see below** |

⚠️ **`secondary-contact` cannot be pinned without un-fixing a known defect.** Two commits changed its
runner after publication, and one of them is **`a084f5b` — "four controls were wired only to the
branch that did not need them"**, itself one of the instrument-debt repairs this project already
landed (ROADMAP instrument-debt table, `✅ FIXED @a084f5b`). Pinning the runner to `4b1eebd` to
isolate the estimator would therefore **re-introduce the gate defect**, and the run would be
measuring two corrections against each other.

**Registered in advance, because it must not be decided after seeing output** — the three options,
none of which is a default:

1. **Supersede-only.** Drop `secondary-contact` to arm B and label its numbers *superseded, not
   corrected*. Honest, loses the estimator isolation for this one document.
2. **Pin `sim/` only, keep today's runner.** Arm A then measures "estimator + the two runner
   commits" for this document, and must say so. Cheapest, and the runner commits are both
   corrections, so the direction of any change is at least interpretable.
3. **Three-way**: `4b1eebd` runner, today's runner, today's runner + t. Isolates both, costs ~10 min
   extra given §5.

**Option 2 is the recommendation** — the confound is named rather than hidden, and it does not
require shipping a run whose runner is knowingly defective. The choice is the coordinator's and is
recorded here before any run.

Remaining abandon condition: if arm A's P2 fails — point estimates do not reproduce under the pin —
stop and treat that as the finding, because it means the published numbers did not come from the
committed runner. That is the `v2` situation and is worth more than the estimator work.

## 7. Related

`sim/paired-stats.js`'s own header names this: _"Task #43 in the tracker is exactly this."_ The
duplication it was extracted to end is still live in the four sites above.

---

## 8. Addendum — 2026-09-11, before the full runs: §6's recommendation was WRONG

**Option 2 is infeasible and is withdrawn.** This document recommended "pin `sim/` only, keep
today's runner" for `secondary-contact`. It cannot execute:

```
secondary-contact @ 4b1eebd — sim/ present: carryover, deception, evolve, ibm, packing, placement, reward
today's runner requires:      ibm.js  evolve.js  carryover.js  verdict-gates.js
                                                               ^^^^^^^^^^^^^^^^ MISSING at the pin
```

`sim/verdict-gates.js` was **created** by `a084f5b` — the same commit that changed the runner and
that made option 2 look attractive. So "keep today's runner, pin the old `sim/`" requires a module
the old `sim/` does not contain. The recommendation was made without checking that the pinned tree
could satisfy today's imports, which is the same class of error as citing a line number without
re-deriving it.

**Adopted instead: option 3's isolating leg.** For `secondary-contact` **only**, arm A runs the
**published runner at `4b1eebd`** against **`sim/` at `4b1eebd`**. That configuration contains the
gate defect `a084f5b` later fixed — **deliberately**, because it is the only configuration that can
reproduce the published numbers, which is what P2 tests. Arm B has the fix. Consequences, stated so
they cannot be quietly forgotten:

- `secondary-contact` arm A numbers are a **reproduction check, not a publishable corrected
  interval.** The corrected interval for that document comes from arm B and is labelled
  **superseded**, not corrected.
- For the other three, arm A's runner is unchanged since publication, so arm A *is* both the
  reproduction check and the correction.

## 9. Method note — what was copied into the pinned trees

`sim/paired-stats.js` **does not exist at any of the four pins** (verified absent at `9d4df53`,
`7f58d96`, `4b1eebd`, `16e40aa`), so today's copy is placed into each pinned worktree. This does not
contaminate the model:

- only `interval()` is called, and `interval()` is pure arithmetic — mean, sd, `tCrit`. It touches
  no model state and no RNG (the only `E.makeRng` use in the file is inside `pairedCI`, the
  bootstrap, which is not called here);
- the module's top-level `require("./evolve.js")` resolves at every pin — `makeRng` is exported in
  all four.

Each patched `ci()` returns the **t** half-width and writes a `CIPROBE` line to stderr carrying
`n`, `mean`, `z_half` and `t_half`. The `z_half` column is the P2 instrument: it must reproduce the
published half-width exactly.

## 10. First result — `hybrid-placement` arm A, P2 PASSES exactly

Run before the remaining six, as a cheap validation of the whole design (48.6 s).

| row | published (z) | arm A measured | published corrected (t) | arm A (t) |
| --- | ------------- | -------------- | ----------------------- | --------- |
| rare among both parent morphs | 0.751 ± 0.091 | **0.750980 ± 0.091342** | ± 0.093 | **± 0.093322** |
| clonal control | 0.960 ± 0.040 | **0.959545 ± 0.040300** | ± 0.041 | **± 0.041174** |
| NET matching effect (19.1%) | 0.809 ± 0.101 | **0.808513 ± 0.101189** | ± 0.103 | **± 0.103384** |

`n = 58` as the document states. **P2 holds**: the pin reproduces the published point estimates and
z half-widths to every printed digit, which also confirms the published numbers did come from the
committed runner. **P1 holds here**: 1 − 0.808513 = **19.1%**, and the t interval excludes 1.0.

⚠️ **One rounding detail, recorded rather than smoothed.** RELEASE-1.0 §2.3 prints the corrected NET
interval as `[0.706, 0.912]`; the exact computation gives **`[0.705129, 0.911897]`**. The difference
is that §2.3 rounded the mean to `0.809` *before* subtracting, while the run subtracts first. Not a
correction — an artefact of rounding order — but the lower bound differs in the third decimal and
`[0.705, 0.912]` is the more accurate rendering.
