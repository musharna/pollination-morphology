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

## P4 — the evolutionary run FAILS its registered prediction, and is not rescued

**Job 3619**, desktop, 26.2 min, exit 0, same build. **Arm A reproduces #50 exactly** at all three
slice counts (+0.291 / +0.084 / +0.233; widths 0.808 / 0.731 / 0.795), so the baseline is sound.

P4 registered that treatment − shuffled should move **down at every S**:

| S   | conserved only |                 + ablation | direction |
| --- | -------------: | -------------------------: | --------- |
| 8   |         +0.291 | **+0.131** [−0.012, 0.275] | down ✅   |
| 16  |         +0.084 |  **+0.136** [0.023, 0.250] | **UP ❌** |
| 32  |         +0.233 |  **+0.289** [0.084, 0.493] | **UP ❌** |

**It moved down at 1 of 3. The registered prediction fails.**

⚠️ **And it is not rescued by the quantity that did move as predicted.** Evolved width fell at all
three S — 0.808 → 0.709, 0.731 → 0.682, 0.795 → 0.714 — and the ablation made width markedly more
S-invariant (`CV(width)` 0.0531 → 0.0246), which is mechanistically coherent because the premium
`(29+S)/30` is itself S-dependent. But **width was not the registered statistic**, the runner
computes no A-vs-B interval for it, and that S-invariance observation is **post-hoc**. The
experiment's own verdict text says a partial pass is not a positive with a caveat, and that applies
to its author.

**The honest reading: P4 is uninformative, exactly as the prereg warned.** Every arm-A/arm-B
interval overlaps its counterpart, so a change of the size the gradient tool measures cannot be
resolved at n=12. The prereg said a null here would not be evidence of absence; symmetry requires
saying these moves are not evidence of presence either. **The gradient tool remains the sharp
test.** Both arms still return NEGATIVE on all four registered conditions.

## ⚠️⚠️ The finding this run actually produced: the premium is holding the lineages apart

The fixed-narrow cell is not a no-op under the ablation — its per-slice display totals differ, so
it is _meant_ to move — and what it does is decisive rather than marginal:

| S   | HELD, conserved only | HELD, + ablation |
| --- | -------------------: | ---------------: |
| 8   |   0.417 (5/12 seeds) | **0.000 (0/12)** |
| 16  |         0.250 (3/12) | **0.000 (0/12)** |
| 32  |         0.250 (3/12) | **0.000 (0/12)** |

**Under the ablation a lineage is lost in 36 of 36 seeds.** Verified per-seed at S=8 outside the
runner: `ancVar/ancVar0` is **0.0000 in every seed** with the flag on, against five seeds above the
0.4 threshold with it off. This is not a CI that straddles zero; it is a clean sweep.

**Mechanism.** Under a constant per-slice budget, a plant blooming in a sparsely-occupied slice
takes a larger share of that slice's fixed visits — so being temporally rare pays. That is
**negative frequency-dependence generated by the allocation rule**, and it is what lets a minority
lineage persist. Apportioning visits by display sets every plant's expected visits to `V·base_i`
regardless of which slice it sits in, the rarity advantage disappears, and the minority lineage
loses its refuge.

⚠️ **So temporal assortment retains ancestry here because of the per-slice budget, not because of
assortment as such.** That is a scope condition on roadmap B and, at two removes, on #37 — whose
cells run without conservation and without this flag, so this does not retract it. It says the
mechanism #37's positive depends on is the rarity premium, and names the run that would test it
directly. Filed as its own task rather than folded into this result.

## Instrument note — a rounding coincidence that looked like a bug

The fixed-narrow S=8 row printed **identical** `lineage` and `gridPull` (0.848, 0.881) in both arms
while `HELD` differed, which reads as a flag failing to reach the cell. It is not: 11 of 12 seeds
differ, and the arm means are **0.8477 vs 0.8481** — distinct, and both rounding to 0.848 at the
table's three decimals. ⚠️ The first probe written to check this disagreed with the job because it
averaged `bloomLineage` over all 35 generations while the runner uses **the first 10**
(`evolving-width.js:141`), deliberately: once a lineage is lost there is no ancestry variation left
for flowering time to associate with. **The instrument was wrong, not the run** — and the tell was
that it disagreed with a job whose fate column it otherwise reproduced exactly.

## Still open

- **The rarity premium as the mechanism behind roadmap B's assortment result** — the finding above,
  now its own task.
- The **higher-order concentration penalty**, ~19% of the gradient, named since #49 and still not
  modelled. Fitting a third term to the table that produced it would be calibrating a constant
  from the artefact it is meant to explain.
