# #54 pre-registration — switch-time ablation: does the premium act through the polymorphism, or per generation?

Written before `experiments/bloom-switch.js` exists. `sim/ibm.js` is not modified by
this experiment.

## Why the crossed design was abandoned

#53 tried to separate the per-slice rarity premium from the flowering-time
polymorphism it maintains by crossing them, imposing one arm's realised bloom
multiset on the other. C7 killed it: imposing **any** foreign trajectory collapses
retained ancestry from 0.289 to 0.000 with the premium still on and the
distribution still A-type (`Aself` 0.289 → `Ashift` 0.000, foreignness 100.0%).
The hook is destructive, so no exogenous trajectory may be imposed here.

## The design

Run with the premium **ON** for generations `0 … k-1`, then **OFF** from generation
`k` onward, on the population's own uninterrupted trajectory. Nothing is imposed
from outside, so #53's confound cannot arise.

Mechanically the premium is `PH.displayProportionalVisits`: false = flat `perSlice`
budget per occupied slice = **premium ON**; true = visits apportioned by display =
**premium OFF**. The runner already mutates the phenology object between generations
(that is how `forceBloomDist` reached `step`), so the switch is
`phen.displayProportionalVisits = (g >= k)` and nothing in `sim/ibm.js` changes.

Arms, 40 seeds, n=30, 35 generations, 8 slices, width 0.12, d=8 — identical to #53:

| arm | premium | expectation |
| --- | --- | --- |
| `A` (k=35) | ON throughout | reproduces #37 / #53-A, HELD **0.289** |
| `B` (k=0) | OFF throughout | reproduces #52 / #53-B, HELD **0.026** |
| `k=5,10,15,20,25` | ON then OFF at `k` | the sweep |

## ⚠️ The k-sweep ALONE cannot discriminate. Registering that now.

Under both hypotheses `HELD(k)` is monotone increasing in `k`. They differ only by a
**shift**: if the polymorphism carries the effect, ancestry keeps decaying at the
premium-ON rate for however long the polymorphism takes to relax after the switch,
so the whole curve slides right by that lag. The lag is exactly the unknown. A
sweep that fits one curve cannot recover a shift whose size it is trying to measure.

So the sweep is **supporting evidence only**, and the verdict is read off a contrast
that measures the lag directly.

## The primary contrast — which one moves first

Everything is paired within seed against that seed's own `A` and `B` runs.

For each post-switch generation `g ≥ k`, with `v(g) = ancestryVar(g)/ancestryVar(0)`
and `R1(g)` the first circular moment of the realised bloom multiset:

    ancGap(g)  = (v(g)  - v_A(g))  / (v_B(g)  - v_A(g))
    polyGap(g) = (R1(g) - R1_A(g)) / (R1_B(g) - R1_A(g))

Both are 0 at the switch by construction and both approach 1 if the arm converges
onto `B`. The question is **which reaches 1 first**.

    Δ(g) = ancGap(g) - polyGap(g)

**Primary statistic: `Δ` = mean of `Δ(g)` over admissible post-switch generations,
per seed, at k=15.** Reported as a paired t interval over seeds (`interval`).

- `Δ > 0` — ancestry moves toward `B` **ahead of** the polymorphism ⇒ the premium
  acts **per generation**, directly. This falsifies #52's mechanism paragraph.
- `Δ ≈ 0` — they move together ⇒ consistent with the **two-step**, ancestry tracking
  the polymorphism. Consistent with, not proof of: co-movement is what #52 already
  had, and it is the shape of claim this project has been wrong about before.
- `Δ < 0` — ancestry **lags** the polymorphism ⇒ strongest available support for the
  two-step, since the polymorphism must change before ancestry does.

### Decision bands, committed now

Let `CI` be the 95% paired t interval on `Δ` over seeds at k=15.

- **DIRECT** if `CI` lies entirely above `+0.15`.
- **THROUGH THE POLYMORPHISM** if `CI` lies entirely below `+0.15` **and** its lower
  bound is at or below `0`.
- **INCONCLUSIVE** otherwise — including the case where `CI` straddles `+0.15`.

`+0.15` rather than `0` because `ancGap` and `polyGap` are ratios of differences
between noisy arms and are not expected to co-move to better than that. The
asymmetry is deliberate: DIRECT is the reading that would overturn #52, so it
carries the burden.

## ⚠️⚠️ The gate that decides whether this design can answer anything

The contrast is a comparison of two timescales. **If those timescales are not
separable, both hypotheses predict the same thing and there is no verdict to read.**
This is the same class of failure that voided #53, so it is checked FIRST and the
verdict is not printed unless it passes.

- **G1 — the polymorphism actually relaxes.** `mean polyGap over the last 5
  generations ≥ 0.5`. If the polymorphism does not move toward `B` after the switch
  there is nothing for ancestry to track, and `Δ` is measuring `ancGap` alone.
- **G2 — it does not relax INSTANTLY.** `polyGap(k+1) ≤ 0.5`. If the polymorphism is
  already most of the way to `B` one generation after the switch, then `Δ ≈ 0` under
  BOTH hypotheses and the design is inert. **This is the gate most likely to fire.**
- **G3 — non-degenerate denominators.** A generation `g` is admissible only if
  `|v_B(g) - v_A(g)| ≥ 0.05` and `|R1_B(g) - R1_A(g)| ≥ 0.05`. Fewer than 5
  admissible generations ⇒ inert.

Failing G1, G2 or G3 ⇒ **NO VERDICT**, reported as such, with #52's mechanism
paragraph again neither confirmed nor refuted. An instrument that cannot resolve the
two hypotheses has not chosen between them.

## Controls

- **C1 — positive control, premium-ON end.** `k=35` reproduces A: HELD **0.289**.
- **C2 — positive control, premium-OFF end.** `k=0` reproduces B: HELD **0.026**.
  C1 and C2 must reproduce to the printed digit or nothing below counts.
- **C3 — the polymorphism is intact at the switch.** `|R1(k) - R1_A(k)| ≤ 0.05` at
  every k. If the switch arm has already drifted off A before the switch fires, the
  design is not switching a maintained polymorphism off.
- **C4 — budget matched at the switch.** `visitsSpent` at generation `k` compared
  between the switch arm and A, **as one step on the same population**, never as a
  run total. Flat and proportional allocation nominally spend the same
  `perSlice * occupied`, but proportional allocation can round a low-display slice to
  zero visits, so the match is measured rather than assumed. Reported, and any
  generation-`k` mismatch above 2% is flagged beside the verdict.
- **C5 — pre-switch identity.** For `g < k`, the switch arm must be byte-identical to
  A on the per-generation fingerprint. If it is not, the switch is not the only
  difference between them.

## What this cannot settle

`Δ ≈ 0` does not establish the two-step. It establishes that ancestry and the
polymorphism relax on the same timescale, which is what #52 already observed and what
#53 set out to break apart. Only `Δ > 0` (DIRECT) is a falsification; the other
branch leaves #52's mechanism paragraph exactly where #53 left it — untested by a
design that could have refuted it, and now also untested by one that could not.

Still open and not addressed here: why M2 reads 1.33 with no temporal structure
(#52); the ~19% higher-order concentration penalty (#49/#51); and why #53's forced
cells showed a HIGHER `bloomLineage` (0.959/0.965) than the free arms (0.886/0.877)
while ancestry collapsed completely.
