# Result — #50: evolving flowering width under conserved display

**Date:** 2026-08-31 · **Status:** run · **Job:** 3572, desktop, 29.8 min, exit 0
**Build:** `sim/ibm.js` md5 `bdfdbf29f8b0977f3e45345021cd5487` = `0370482:sim/ibm.js`
**Re-run with** `node experiments/evolving-width.js` and `EW_CONSERVE=1 node experiments/evolving-width.js`
**Design:** 30 plants · 35 generations · 12 seeds · d=8 · widthMut=0.03 · S ∈ {8, 16, 32}
**Registered in** `docs/2026-08-28-conserved-display-prereg.md`; #49's fix is `f71f975` + `0370482`

Both arms ran in one job on one host, so the comparison is not across machines. The
unconserved arm is there to reproduce job 3529's regime on today's build, not as a result.

## The headline

#49 showed that `sim/ibm.js` re-offered a plant's whole display share in every slice it was
in flower, so flowering all season manufactured `S` times the floral display of flowering
once. #47's finding — that flowering **width evolves wider** — was measured against that.
The question here is what survives once the display is conserved.

| S   | evolved width A → B | treatment − shuffled A → B | treatment − non-heritable A → B |
| --- | ------------------- | -------------------------- | ------------------------------- |
| 8   | 0.915 → **0.808**   | +0.422 → **+0.291**        | +0.411 → **+0.304**             |
| 16  | 0.915 → **0.731**   | +0.445 → **+0.084**        | +0.410 → **+0.226**             |
| 32  | 0.929 → **0.795**   | +0.444 → **+0.233**        | +0.424 → **+0.291**             |

Conserved intervals (n=12, t): S=8 **[0.140, 0.442]**, S=16 **[−0.061, 0.228]**,
S=32 **[0.115, 0.352]**.

**The drift toward wider windows is roughly halved, and it does not reverse.** It stays
clear of zero at S=8 and S=32 and no longer does at S=16. The three conserved contrasts have
heavily overlapping intervals, so **S=16 being the lowest is not itself a finding** — it is
one of three draws at n=12, and reading a trend into it would be reading the noise.

All four registered conditions still fail in both arms, so the verdict on #47's actual
question is unchanged: **narrow flowering does not arise on its own here.** What changed is
the explanation. #47 attributed the wider drift to there being no cost to flowering longer;
#49 showed the model was manufacturing display instead. Removing the manufacture cuts the
effect by 31–81% and leaves it standing.

## ⚠️ So something else is still pushing width wider, and this run does not identify it

The residual is the interesting part. The project's standing candidate — recorded in
`ROADMAP.md` when #49 closed — is the more specific one, and this result is consistent with
it: **the per-slice pollinator budget is `per/S` regardless of how much display is in the
slice** (`sim/ibm.js:1364`, `perSlice = max(1, round(per/S))`, spent at `:1465`). A slice with
few plants in flower therefore pays a high per-capita return, so **empty time is valuable**,
and a plant in flower in more slices collects more of it. That is negative frequency-dependence
in time arising from the pollination model rather than imposed on it — a finding rather than a
second bug — and the duplication was swamping it by a factor of `S`.

⚠️ **Stated as the leading hypothesis, not as a result: this run does not test it.** The
discriminator is to make the per-slice budget scale with the display actually present in the
slice instead of holding it fixed. If the residual pro-wide drift survives that, empty time is
not the mechanism and the candidate is wrong. Not run here.

## ⚠️⚠️ The built-in control fired, and P3 is false as registered

The two fixed-width cells carry the flag, so they are a control on it rather than two rows
reported beside it. Arm A vs arm B:

| cell                  |    S=8    |         S=16          |         S=32          |
| --------------------- | :-------: | :-------------------: | :-------------------: |
| fixed wide (w=1.0)    | unchanged |       unchanged       |       unchanged       |
| fixed narrow (w=0.12) | unchanged | **MOVED** 0.819→0.860 | **MOVED** 0.887→0.837 |

These are seeded, paired runs, so identity is the test and it failed.

**Root cause: the invariance is a property of occupancy, not of width.** Conservation divides
by `occ[i]`, the number of slice centres inside plant `i`'s window — and a window of length
`w` on centres `1/S` apart catches `floor(w·S)` or `floor(w·S)+1` of them **depending on its
phase**. Equal width is a stand-in for equal occupancy, and the two coincide only when

- `w·S` is an integer — every plant catches exactly `w·S`; or
- the only nonzero occupancy is 1 — below `w = 1/S`, where `occ = 0` contributes nothing
  either way, so the divisor actually applied is 1 for everyone.

Verified directly rather than argued (`node` probe, live `I.ringDist`, phase swept not
sampled). The occupancy column predicts the model-level byte comparison in all seven cells:

| w    |  S  | w·S   | nonzero occ | predicted | model says |
| ---- | :-: | ----- | ----------- | --------- | ---------- |
| 1.0  |  8  | 8.00  | {8}         | no-op     | identical  |
| 1.0  | 16  | 16.00 | {16}        | no-op     | identical  |
| 1.0  | 32  | 32.00 | {32}        | no-op     | identical  |
| 0.12 |  8  | 0.96  | {1}         | no-op     | identical  |
| 0.12 | 16  | 1.92  | {1,2}       | **moves** | **moved**  |
| 0.12 | 32  | 3.84  | {3,4}       | **moves** | **moved**  |
| 0.5  |  8  | 4.00  | {4}         | no-op     | identical  |

Two competing explanations were ruled out by the same observation. **RNG desync** would move
fixed-wide too, and the flag's block contains no `rng()` call. **A leak through the `...cons`
spread** would not produce an S-dependent, width-dependent pattern. Only occupancy makes the
invariance a function of the _product_ `w·S`, and fixed-wide is invariant at every S while
fixed-narrow moves only at S≥16.

### How far it reaches: not far, and not for the registered reason

The task's own registered expectation said that if the control moved, "every fixed-width
result in the project is entangled with conservation." **That was too strong.** Every
fixed-width call site in the repository — `experiments/phenology.js` (#37),
`tests/phenology.test.js`, `tests/evolving-width.test.js` — runs at **S = 8**, and #37's two
widths are 1.0 (`w·S = 8`) and 0.12 (`w·S = 0.96`). Both sit in the no-op regime, confirmed
by direct byte comparison. Checked across every file containing `slices` in `experiments/`,
`tools/` and `tests/` (seven files).

So **no published result moves.** The entanglement reaches exactly the two fixed-narrow
control cells this experiment runs at S=16 and S=32, which carry no result of their own.
⚠️ But #37 is protected **by its parameters, not by the principle that was registered**, and
that distinction bites the moment anyone raises S. `tests/conserved-display.test.js` now reads
#37's own `SLICES` and `WIDTH` out of its source and fails if either moves into the moving
regime, instead of a comment asserting the same thing.

### ⚠️ And the flag removes a second defect nobody registered

Under the old duplication, a plant's season-integrated display was `base[i] · occ[i]` — so at
`w·S = 1.92` **phase alone was worth up to a factor of two in fitness**, between a bloom that
happened to straddle a second slice centre and one that did not, at identical width. That is
a discretisation artefact, not pollination. `sim/ibm.js:1355` already warns about the
discretisation **below** `w = 1/S` (the coverage gap); this lottery lives **above** it and was
not previously named. Conservation deletes it along with the duplication.

## ⚠️⚠️ The test that was supposed to catch this passed

`tests/conserved-display.test.js` test 2 swept `width` over `[1.0, 0.12, 0.5]` with `slices`
held at 8. All three satisfy the no-op condition at S=8, for three _different_ reasons:
`1.0·8 = 8`, `0.5·8 = 4`, `0.12·8 = 0.96`. **It swept the stand-in and held fixed the one axis
the invariance actually depends on** — the product.

That is the same tell recorded when #49 closed — _a guard that covers only the regime where
its change is invisible_ — recurring **one commit later, inside the test written to catch that
class**, on the axis that was not swept. The recurrence is the finding: naming a failure mode
in a document does not stop it reappearing in the next artefact, because the axis it hides on
changes each time.

### What replaced it

Test 2 now asserts **both directions from the live occupancy predicate**: where occupancy is
constant the run must be byte-identical, and where it is not the run **must move**. The
prediction is computed from `I.ringDist` rather than hardcoded, so the test fails if the model
and the predicate ever disagree. A degeneracy guard requires at least two cells on each side,
so a cell list that collapsed to one regime cannot pass vacuously.

**Seen to fail.** Mutating the divisor from `occ[i]` to the constant `S` — scale-invariant,
therefore a no-op everywhere, therefore leaving the duplication in place — is a mutant the
_old_ assertion would have welcomed in every cell. It is now killed, with the failure naming
the S=16 narrow cell. The harness holds the original in memory and restores from it, never
`git checkout`; the restore was verified byte-identical to `bdfdbf29…`.

The prereg is left exactly as written. It is a record of what was predicted, not a place to
put what turned out to be true.

## What this changes

- **#47's direction stands, its explanation is now #49's, and its magnitude is halved.** Width
  evolves wider under conserved display too; "no cost to flowering longer" was never the
  mechanism.
- **#37 is untouched**, verified rather than assumed, and now guarded by a test that reads its
  constants.
- **P3 is retired in its registered form.** The invariant is occupancy, and it is stated that
  way in `sim/ibm.js`, in `experiments/evolving-width.js`, and in the test.
- The residual wider-drift is **open** and has a named discriminator that has not been run.
