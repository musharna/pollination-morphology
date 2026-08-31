# Pre-registration — #51: is EMPTY TIME what still selects for wider flowering?

**Date:** 2026-08-31 · **Status:** registered **BEFORE** the flag exists
**Follows:** #50 ([detail](2026-08-31-evolving-width-conserved.md)), #49
([detail](2026-08-28-conserved-display.md))
**Written against:** `sim/ibm.js` md5 `bdfdbf29f8b0977f3e45345021cd5487` (= `0370482`, and
unchanged at `5602460` — the #50 commit touched only comments in this file)

## The question

#50 showed the pro-wide drift **survives** conserved display at roughly half strength. So a
real driver of wider flowering remains and it is not the manufacture. What is it?

This registers an **ablation**, not a fix. Nothing here is a bug; the point is to remove one
candidate mechanism and see whether the gradient goes with it.

## The three candidates

**H1 — empty time is valuable.** The per-slice pollinator budget is `per/S` **regardless of how
much display is in the slice** (`sim/ibm.js:1364`, `perSlice = max(1, round(per/S))`, spent at
`:1465`), and within a slice the draw is renormalised over the plants present
(`sim/carryover.js:293-300`, `r = rng() * acc`). So concentrating display into one slice hits
diminishing returns — your share saturates — while spreading into a thinly-occupied slice earns
full marginal return.

**H2 — geitonogamy.** `T[0][j]` excludes `j === 0`, so a plant that dominates a thin slice
spends much of its visitation on itself. Outcrossed transfer goes as `s(1−s)`, not `s`, where
`s` is the within-slice share. #49 fitted this and it accounted for most of P1's miss.

**H3 — carryover across bouts.** Each slice is a separate bout and the animal starts it with an
empty body, so a plant present in more slices participates in more independent bouts. This is
tied to `perSlice` magnitude and carryover depth rather than to occupancy as such.

H1 and H2 are **both real and both pro-wide** — #49's own table separates them. The purpose of
this run is to measure H1's share, not to pick a winner in advance.

## The arithmetic, and the check that it is the right arithmetic

Configuration is `tools/width-gradient.js`: `N = 30`, blooms evenly spread (`b = i/30`), focal
is index 0 pinned to bloom 0, residents saturated at width 1.0, display conserved. Each plant's
total display share is `1/30`.

- **Focal narrow** (`k_f = 1`): all `1/30` in one slice. Residents contribute `29/(30S)`.
  Within-slice share `s_n = S/(29+S)`.
- **Focal wide** (`k_f = S`): `1/(30S)` per slice; slice total `1/S`; share `s_w = 1/30`.

Naive share model, constant per-slice budget:
`ratio = [S·s_w] / [s_n] = (29+S)/30` → **1.233** at S=8, **1.500** at S=16.

⚠️ **That is exactly `(S+29)/30`, the P1 registered in the #49 prereg.** The derivation
reproduces a number registered independently a week ago, which is the positive control on it —
without that check this document would be arithmetic with nothing holding it to the model.

With geitonogamy, `flow ∝ visits · s(1−s)`:
`ratio = [S·s_w(1−s_w)] / [s_n(1−s_n)]` → **1.521** at S=8, **2.250** at S=16, reproducing #49's
corrected column to three decimals.

## The ablation

`PH.displayProportionalVisits`: apportion the **same total** visits across slices in proportion
to the total display present in each slice, instead of giving every slice `perSlice`.

⚠️ **Same total, redistributed** — `perSlice · S` visits, apportioned by largest remainder so the
total is exact and the arithmetic is deterministic (no new `rng()` draw, so no stream shift).
Giving the proportional arm a different total would confound "empty time is worthless" with
"fewer visits", which is the trap the slice-splitting comment at `:1334` already names.

Under it, slice `k` receives `V·D_k` and the focal takes share `w_fk/D_k`, so its expected visits
are `V·Σ_k w_fk = V·base_f` — **independent of width and of phase**.

## Registered predictions

**P1 — the outcrossed-flow ratio (`tools/width-gradient.js`, CONSERVE=1, REPS=24).** The
empty-time factor goes to exactly 1.000 and the geitonogamy factor survives unchanged, since
within-slice share does not depend on the budget:

| S   | measured now (#49) | predicted, `s(1−s)` only | predicted × #49's unexplained factor |
| --- | -----------------: | -----------------------: | -----------------------------------: |
| 8   |          **1.698** |                **1.233** |                            **1.377** |
| 16  |          **2.707** |                **1.500** |                            **1.805** |

The right-hand column carries #49's own unexplained higher-order concentration penalty
(1.698/1.521 = 1.116 at S=8; 2.707/2.250 = 1.203 at S=16) forward **unchanged**, because nothing
here should touch it. **Registered band: the two columns bracket the prediction**, i.e.
**[1.233, 1.377] at S=8 and [1.500, 1.805] at S=16.**

Committed in advance, three distinguishable outcomes:

- **Inside the band** → H1 measured and removed cleanly; the residual is H2 plus the named
  higher-order term. Empty time was worth `(29+S)/30` of the gradient and no more.
- **≈ 1.000** → geitonogamy is **not** operating as #49 fitted it, which would put that fit in
  question rather than confirm this one.
- **Still ≈ 1.7 / 2.7** → the ablation did nothing and **H1 was never the mechanism.** The
  roadmap's standing candidate is then wrong and H3 or something unenumerated is in play.

**P2 — the decisive separator: raw VISITS, not flow.** `rb.visitsTo` is returned
(`sim/carryover.js:708`) and visits are blind to geitonogamy. Summed over slices, the focal's
visit count must become **equal for narrow and wide: ratio 1.000**, within sampling noise, at
both S. This isolates H1 completely — it is the one prediction that cannot be rescued by any
value of the `s(1−s)` term. **If P2 fails while P1 lands in the band, the band was hit for the
wrong reason and this document says so rather than claiming the win.**

**P3 — the control, stated in the variable that governs it.** ⚠️ P3 in the #49 prereg was
registered as an equal-**width** claim and was **false**; the governing variable was occupancy
(see [2026-08-31-evolving-width-conserved.md](2026-08-31-evolving-width-conserved.md)). The
governing variable here is the **per-slice display total**:

- Where every slice carries **equal total display**, proportional apportionment returns exactly
  `perSlice` to each slice, so the run must be **byte-identical**. Width 1.0 gives this both with
  conservation on and off.
- ⚠️ **And cells where it must NOT be a no-op are registered too** — any configuration whose
  per-slice display totals differ. A no-op test with no such cell cannot tell "correctly neutral"
  from "never ran", which is the lesson #50 paid for.
- With the flag **off**, byte-identical to the pre-flag build, compared against an extracted
  earlier `sim/ibm.js` rather than against today's code agreeing with itself.

**P4 — the evolutionary run, confirmatory only.** `EW_CONSERVE=1` plus the new flag should move
treatment − shuffled **down** from #50's +0.291 / +0.084 / +0.233 at S = 8/16/32, without
reaching zero if H2 is real. ⚠️ **Registered as directional only.** At n=12 those intervals are
wide and already overlap each other; the sharp test is P1/P2 on the gradient tool, which holds
the population fixed. A null here at n=12 is not evidence of absence and will not be reported as
one.

## What would make this uninterpretable

- **Total visits differing between arms.** Asserted in the test, not assumed.
- **A slice receiving zero visits.** Legitimate under the ablation — that is what "empty time is
  worthless" means — but it must be **counted and reported**, not silently dropped, because a
  slice with no visits and a slice that never ran look identical downstream.
- **`max(1, …)` reintroducing a floor.** The current code floors `perSlice` at 1. Under
  proportional apportionment that floor would hand every empty slice a visit and quietly restore
  the very premium being ablated. **No floor**, and the test asserts an empty slice gets zero.
- Reading the S=16 evolutionary cell as special. #50 established its interval overlaps the
  others; it is not a signal.
