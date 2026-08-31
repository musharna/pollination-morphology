# Result — the season was manufacturing display, and that is why width evolved wider

**Date:** 2026-08-28 · **Status:** run · **Model version:** `f71f975`
**Pre-registration:** [`2026-08-28-conserved-display-prereg.md`](2026-08-28-conserved-display-prereg.md), written before the flag existed
**Supersedes the DIAGNOSIS in:** [`2026-08-25-evolving-width-result.md`](2026-08-25-evolving-width-result.md) (#47)
**Re-run with** `CONSERVE=1 REPS=24 node tools/width-gradient.js 8 1.0`

⚠️ Every number below was produced at `f71f975` exactly. `sim/ibm.js` changed afterwards — the
in-flower predicate was single-sourced in response to a surviving mutant — and that change is a
refactor covered by the byte-identity guard, so the tables stand. **Stated because "model version"
is only meaningful if it names the build the numbers came off**, and this project has already
published a result whose model moved underneath it.

## The answer

#47 found that flowering width evolves **wider**, and concluded: "there is **no cost to
flowering longer**. Duration is a free trait, so selection maximises it." It then flagged the trap
in its own remedy — a cost coefficient makes the evolved width a statement about the coefficient,
"which is the imposition this experiment was built to escape, wearing a different hat."

**The direction #47 measured is real. Its explanation is not, and the trap was avoidable.**

`sim/ibm.js:1290` computes `base` — a display share normalised to sum to 1 over the population —
**once** per generation, and the slice loop re-offered **the same `base[i]` in every slice the
plant was in flower**. A plant's season-integrated display was therefore `base[i] × k_i`. Flowering
all season did not merely give a plant more opportunities to be visited; it **manufactured `S`
times the floral display** of a plant flowering once, out of nothing. Both fitness paths consumed
it uncapped — maternal success is raw `received[j]` (`:1490`), siring is raw `T[i][mother]`
(`:1698`).

**That is not an absent cost. It is a resource being created.**

## The discriminator, registered in advance

Under uniform `allocWeights`, every plant present in a slice offers `1/n`, so every occupied slice
holds all 30 plants and the share is `1/30` regardless of width. A plant attending `k` slices
collects `k · (per/S) · (1/30)`, so the wide-to-narrow ratio against a saturated resident is
**exactly `S`**.

|   S | flow(w=1.0) | flow(w→0) | measured ratio | duplication predicts |
| --: | ----------: | --------: | -------------: | -------------------: |
|   8 |      3494.2 |     423.3 |       **8.26** |                    8 |
|  16 |      3581.5 |     216.8 |      **16.52** |                   16 |

A missing cost term predicts nothing whatsoever about `S`. Duplication predicts `S`, and gets it at
both values with the same +3.3% residual. **The hypothesis was chosen by a measurement that could
have refuted it, not by which story read better.**

## The change, and why it costs no parameter

`PH.conserveDisplay` spreads `base[i]` over the slices occupied: per-slice display is
`base[i] / k_i`, so `Σ_slices display_i = base[i]`, invariant in width **and in S**.

A cost term would have been a new free parameter that left the duplication in place and merely
taxed it. Conservation adds nothing to tune — `base` is already normalised, and the constraint is
that a plant has a finite reproductive investment. It is the same sort of object as this roadmap's
standing "placement must never be a gene": a structural fact, not a dial.

⚠️ **It is not, however, the only conservation scheme, and the choice is stated rather than
buried.** Dividing by `k_i` conserves display over the **slices** the model actually simulates;
dividing by `w_i` would conserve it over continuous season time. They differ below `width = 1/S`,
where a window covers less than one slice. `k_i` was chosen because it makes the season integral
invariant in `S` as well as in width, which turns S-invariance from a property that has to be
tested into one that holds by construction — and this project has already had the slice grid
impersonate a result once. **That is a defensible choice, not a forced one**, and a scheme
conserving over `w_i` would be a different model rather than a bug fix to this one.

## What it did — the gradient collapses by four fifths

24 seeds, resident width 1.0. `k_f` is the focal's measured occupancy, read off the run rather than
assumed, because width maps to `k_f` through a step function whose steps belong to `S`.

|   S | unconserved ratio | **conserved ratio** | gradient removed |
| --: | ----------------: | ------------------: | ---------------: |
|   8 |              8.26 |           **1.698** |        **79.4%** |
|  16 |             16.52 |           **2.707** |        **83.6%** |

⚠️ **There is no interior optimum.** At 6 seeds `k_f = 7` appeared to beat `k_f = 8` by 1.8%, which
would have been the first interior optimum this gradient has ever shown. At 24 seeds it is gone and
the curve is monotone. It was noise, and this project's own standing constraint — "a single-seed
assertion about a stochastic quantity can be green and backwards at the same time" — is why it was
checked before it was written down.

## ⚠️ P1 MISSED, at both slice counts, and the pre-registration said what that means

Registered: the ratio falls to `(S+29)/30` — **1.233** at S=8 and **1.500** at S=16, ±5%. Measured
**1.698** and **2.707**. Outside the band at both. The pre-registration committed in advance that a
miss "means the share model in this document is incomplete, and it reports as that".

**It is incomplete in a way the registered arithmetic can name: it counts visits, and the
measurement counts outcrossed pollen.** `T[0][j]` skips `j === 0`, so self-visits are excluded. A
plant that dominates a thinly-occupied slice spends a large share of its visits on itself —
geitonogamy. Transfer should go as `s(1−s)` per visit, not `s`.

|   S | observed | registered (naive `s`) | corrected (`s(1−s)`) |
| --: | -------: | ---------------------: | -------------------: |
|   8 |    1.698 |                  1.233 |            **1.521** |
|  16 |    2.707 |                  1.500 |            **2.250** |

Per-occupancy, the correction is close where the focal is dilute and still short where it is
concentrated:

|   S | `k_f` | observed rel | `s(1−s)` rel |      error |
| --: | ----: | -----------: | -----------: | ---------: |
|   8 |     7 |       0.9906 |       0.9905 |      −0.0% |
|   8 |     5 |       0.9739 |       0.9612 |      −1.3% |
|   8 |     3 |       0.8798 |       0.8975 |      +2.0% |
|   8 |     1 |       0.5888 |       0.6574 | **+11.7%** |
|  16 |     9 |       0.9354 |       0.9501 |      +1.6% |
|  16 |     3 |       0.7088 |       0.7635 |      +7.7% |
|  16 |     1 |       0.3695 |       0.4444 | **+20.3%** |

⚠️ **The residual error is monotone in the focal's within-slice share** — 11.7% at `s = 0.216`,
20.3% at `s = 0.356`. That is the signature of a **higher-order** concentration penalty that a
per-visit `s(1−s)` term linearises: runs of consecutive self-visits, and load displacement under
the carryover cap. It is **named and not modelled**; adding a third term fitted to this table would
be calibrating a constant from the artefact it is meant to explain.

## ⚠️ P2 WAS MIS-SPECIFIED, and the fix was to stop assuming a number the run can report

P2 registered the S=8 gradient shape at occupancies **1, 2, 4, 6, 8**. The real occupancies are
**1, 3, 5, 7, 8**. The predictions were right about the _model_ and wrong about _which widths land
in how many slices_ — I guessed `k_f ≈ w·S` instead of enumerating the step function, which is the
same discretisation this roadmap already records as a hazard for anything that lets width vary.

`tools/width-gradient.js` now **prints `k_f` beside every row**, so the per-occupancy predictions
above are driven by measured occupancy rather than by an assumption about it. That is the only
reason a missed prediction here can be attributed to the share model rather than to a guess about
the grid — and the prereg is left as written rather than quietly re-fitted.

## 🛑 P3 — RETRACTED 2026-08-31: it was registered in the wrong variable

> ⚠️⚠️ **This section said "P3 HELD". It did not.** The claim below is an equal-**WIDTH** claim, and
> the quantity conservation divides by is **OCCUPANCY**. #50 (job 3572) ran the fixed-width control
> cells at `S = 8, 16, 32`: fixed WIDE was unchanged at every `S`, fixed NARROW **MOVED at `S=16`
> and `S=32`**. A window of length `w` on centres `1/S` apart catches `floor(w·S)` or
> `floor(w·S)+1` of them **depending on its phase**, so equal width gives equal occupancy only when
> `w·S` is an integer or the only nonzero occupancy is 1. The test that was supposed to catch this
> swept `width` over `[1.0, 0.12, 0.5]` with `slices` **held at 8**, where all three land in the
> invisible regime for three different reasons — it held fixed the one axis the invariance depends
> on, the product. **The conclusion below survives; the reason given for it does not.**
> ✅ #37 is still untouched — every fixed-width call site in the project runs at `S = 8` — but it is
> protected **by its parameters, not by the principle**.
> Full account: [2026-08-31-evolving-width-conserved.md](2026-08-31-evolving-width-conserved.md).

On an equal-width population, turning conservation on changes nothing: conservation divides every
plant's display by the same constant and all three draws in `sim/carryover.js` (`:295`, `:331`,
`:362`) are scale-invariant. Asserted by test rather than by that argument, because `r = rng() *
acc` compared against `cum[i]` can flip at a boundary under rounding.

**Every arm of #37 is fixed-width, so #37 is untouched.** The two fixed-width cells inside
`experiments/evolving-width.js` carry the flag too and come back byte-identical, which makes them a
live control on the flag rather than two rows that merely sit beside it.

## ⚠️⚠️ Three mutants survived, and every one of them was real

- **Forcing conservation ON regardless of the flag left the byte-identity guard GREEN.** Every cell
  in that guard was equal-width — the one regime where conservation is invisible, by P3. **The
  inertness test was covering only the regime in which the change it guards cannot be seen.** Fixed
  by adding a differing-widths cell; the mutant now dies.
- **Deleting the `|| 1` zero-occupancy guard killed nothing.** `occ[i] === 0` holds exactly when the
  plant is in flower in no slice, so the in-flower predicate is false everywhere and the division is
  never evaluated. The guard is **unreachable**, and the test's name over-claimed it. The occupancy
  count and the display map are now single-sourced through one `inFlower` predicate, so that
  unreachability is structural rather than a coincidence, and the mutant is retired as unkillable
  by construction rather than left to report a permanent meaningless red.
- **Turning the in-flower predicate's `<=` into `<` broke nothing.** Every other test in the file
  draws blooms at random, where landing exactly on a slice centre has probability zero — so the
  boundary was untested although it **decides the published occupancies**: at bloom 0, width 0.25
  and S = 8 the window reaches the neighbouring centre exactly, which is what makes `k_f` 3 rather
  than 1. This is the `fateOf` boundary lesson a second time, and it takes the same repair — build
  the case from **dyadic rationals** so it lands ON the threshold instead of near it. ⚠️ Both sides
  are asserted: at width 0.25 the focal must outcross, and at 0.24 it must move **exactly zero**
  grains, because "the boundary plant has flow" would otherwise pass on a harness that reports flow
  for any input.

⚠️⚠️ **AND THE MUTATION HARNESS SILENTLY CORRUPTED FOUR MEASUREMENTS WHILE IT RAN.** It rewrites
`sim/ibm.js` in place; two smoke runs and two probes were launched during its window and read a
mutated model. The tell was a _too-clean_ result — a conserved and an unconserved run agreeing
byte-for-byte on every number, which is what a mutant that disables the flag produces and is not
otherwise plausible. All four were discarded and re-run sequentially on the verified-clean tree.
**A background job that mutates the code under test is not a background job.**

## What #47 keeps, and what it loses

**Keeps.** Width still evolves wider, not narrower. The direction is not retracted.

**Loses its explanation, and most of its magnitude.** The cause is not that flowering longer is
free; it is that flowering longer was _paid_. Removing the manufacture removes about four fifths of
the gradient at S=8 and more at S=16. At smoke scale the evolved treatment−shuffled contrast falls
from +0.153 to +0.063 — indicative only, at n=4 with intervals spanning zero, which is why the
evolutionary re-run is its own task rather than a sentence here.

## What is still open, and it is the northstar

The residual pro-wide gradient is **H3, declared out of scope in the pre-registration before any of
this was measured**: the per-slice visit budget is `per/S` **regardless of how much display is
present in that slice**, so a thinly-occupied slice pays as well as a crowded one and attending
more slices still pays a little. That the residual keeps growing with `S` (1.70 → 2.71) is exactly
what that predicts.

⚠️ **That is not a defect to patch. It is where the northstar lives.** Fixed per-slice effort makes
**empty time valuable**, which is negative frequency-dependence on flowering time arising _from
pollination_ rather than imposed on it — the thing `ROADMAP.md:237` has been asking for through
seven spent route families. The duplication was swamping it by a factor of `S`.

⚠️ It also has a limiting case with a known answer, which is what makes it testable rather than
hopeful: if pollinator effort scaled **exactly** with the display present, a plant's expected
visits would be `V · base_i / Ā` — **perfectly flat in width, and flat in bloom position too**, so
all temporal frequency-dependence would vanish. Real pollinator populations track floral abundance
but neither instantly nor proportionally, so the model sits between two ends whose behaviour is
known. Whether the NFD in that interval is strong enough to deliver assortment and HELD is the next
experiment, and registering it here would be registering a hypothesis about a measurement that does
not exist yet.
