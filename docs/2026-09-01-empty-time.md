# Result — #51: empty time is about 40% of the pro-wide gradient, and it is now measured

**Date:** 2026-09-01 · **Status:** run · **Job:** 3606, desktop, 4.2 min, exit 0
**Build:** `sim/ibm.js` md5 `7da6ce55eb3b599a48f83e6e6909145f` (= `6f31f5c`), logged by the job itself
**Registered in** [2026-08-31-empty-time-prereg.md](2026-08-31-empty-time-prereg.md), **before the flag existed**
**Re-run with** `CONSERVE=1 REPS=24 node tools/width-gradient.js <S> 1.0` and the same with `DPV=1`

## P2 — the decisive prediction, and it passes

Visits are blind to geitonogamy: `T[0][j]` excludes self-transfer, `visitsTo` counts every
landing. So the visit column isolates the empty-time premium from the concentration penalty in
a way no flow number can, which is why the prereg made it the separator.

| S   | derived premium `(29+S)/30` | control, measured | after the ablation |
| --- | --------------------------: | ----------------: | -----------------: |
| 8   |                  **1.2333** |        **1.2494** |         **1.0080** |
| 16  |                  **1.5000** |        **1.5031** |         **1.0053** |

**The derivation predicted the measured premium to 1.3% and 0.2%, and the ablation collapses it
to within 0.8% and 0.5% of 1.000.** Registered prediction was exactly 1.000. The mechanism named
as H1 is real, is the size the arithmetic said, and is now removed.

⚠️ The control column is a **prediction confirmed, not a fit.** `(29+S)/30` was derived from the
allocation rule and independently equals `(S+29)/30`, the P1 registered in the #49 prereg a week
earlier — so this is one number arrived at twice by different routes and then measured.

## P1 — one hit, one miss, and the miss is reported as a miss

| S   | control (reproduces #49) | registered band | measured after ablation |                         |
| --- | -----------------------: | --------------: | ----------------------: | ----------------------- |
| 8   |               **1.6984** |  [1.233, 1.377] |              **1.3680** | inside                  |
| 16  |               **2.7066** |  [1.500, 1.805] |              **1.8135** | ⚠️ **outside, by 0.5%** |

The control reproduces #49's published 1.698 and 2.707 exactly, which is what licenses the
comparison at all.

**S=16 landed 0.49% above the top of the registered band.** The band was built by carrying #49's
unexplained higher-order factor forward _unchanged_; it actually rose slightly, 1.203 → 1.209.
That is a small, real drift and the registered interval did not contain the result, so this
records a miss rather than rounding 1.8135 into 1.805.

## What the three factors are worth

The prereg's decomposition — flow ratio = empty-time × geitonogamy × higher-order — is
quantitatively confirmed at both slice counts:

| S   | empty time | geitonogamy `s(1−s)` | higher-order | product | measured control |
| --- | ---------: | -------------------: | -----------: | ------: | ---------------: |
| 8   |     1.2333 |               1.2336 |        1.116 |   1.698 |       **1.6984** |
| 16  |     1.5000 |               1.5000 |        1.203 |   2.707 |       **2.7066** |

and after the ablation the first factor becomes 1.000:

| S   | predicted `1.000 × geiton. × higher-order` | measured ablation |
| --- | -----------------------------------------: | ----------------: |
| 8   |                                      1.369 |        **1.3680** |
| 16  |                                      1.814 |        **1.8135** |

As shares of the log gradient, stable across S:

| S   | empty time | geitonogamy | higher-order |
| --- | ---------: | ----------: | -----------: |
| 8   |  **39.6%** |       39.7% |        20.7% |
| 16  |  **40.7%** |       40.7% |        18.6% |

## The answer to the question the task asked

**No — empty time is not what still selects for wider flowering. It is about 40% of it.**

Removing it leaves the gradient at **1.368 / 1.814**, still far above 1.0 and still pro-wide.
The roadmap's standing candidate was real and correctly identified, and it was _not_ the whole
residual: geitonogamy is an equal partner at both slice counts, and the named-but-unmodelled
higher-order concentration penalty carries the remaining fifth.

⚠️ **So this closes a mechanism, not the northstar.** "Narrow flowering does not arise on its
own" survives every ablation tried so far, and the reason has now moved twice — from "duration
is free" (#47, wrong), to the manufacture (#49, real but only half), to a three-way split of
which the manufacture was one part. Each correction has reduced the effect without reversing it.

## ⚠️ Is the ablation the _right_ model? It is not a bug fix and does not claim to be

Both allocations are defensible biology. A constant per-slice budget is a fixed forager
population that forages whatever is in bloom; a display-proportional budget is foragers
aggregating on floral abundance. Real pollinators sit between. **This run does not establish
which is correct** — it establishes what the choice is worth, which is a scope condition on
every width result in the project: about 40% of the pro-wide gradient is a consequence of the
allocation convention rather than of pollination.

## Instrument notes

- ⚠️ **The budget guard caught a real bug on its first run.** The apportionment originally
  divided the nominal `perSlice · S`, but the unablated arm skips slices carrying no display and
  _loses_ those visits deliberately — so the ablated arm was also spending the visits the other
  arm discards. **A bigger budget is exactly the confound this ablation must not have.** It now
  apportions `perSlice × (occupied slices)`, and the printed `spent` column reads 24000 in every
  cell of all four tables.
- ⚠️ **And the guard was wrong in the other direction first.** It summed spend over six
  generations of two arms which, being different models, diverge after generation 0 — comparing
  trajectories, not budgets. It compares one step on the same population now.
- ⚠️ **`emptyVisitSlices` is deliberately uncovered.** A slice carrying display and still
  receiving zero visits needs a display share below about `1/(2·total)`; probed across budgets
  24000/800/80/16 and widths 0.12/0.3, it never fires, and it reads 0.0 in all four tables. It is
  structurally unreached, like `occ[i] || 1`, and is retained as a belt rather than claimed as
  tested — a test named for it would be a name without coverage.
- **Seen to fail.** Two mutants, both killed: apportioning the nominal total (revives the budget
  bug), and apportioning uniformly (the flag does nothing). Restore verified byte-identical.
- The wide arm is byte-identical between control and ablation at both `S` — at resident width
  1.0 every slice carries equal display, so proportional apportionment returns exactly the
  uniform budget. That is the no-op control holding, visible in the table rather than asserted.

## Still open

- **P4, the evolutionary confirmation** — job 3619, registered as directional only.
- The **higher-order concentration penalty**, ~19% of the gradient, named since #49 and still not
  modelled. Fitting a third term to the table that produced it would be calibrating a constant
  from the artefact it is meant to explain.
