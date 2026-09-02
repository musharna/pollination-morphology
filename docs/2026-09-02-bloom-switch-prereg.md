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

---

# Amendment, before the full run

Everything below was decided after a **6-seed pilot at full configuration** and
**before** any run that could produce a result. The pilot's primary statistic came
out `Δ = +0.029 [-1.070, 1.127]`, then `-0.015 [-1.185, 1.155]` after A1 — an
interval nine times the width of the decision band, i.e. entirely uninformative
about which branch the verdict will take. None of these changes can have been
steered by the answer, because the pilot did not contain one. Each was made on a
coverage or precision observation, and the pilot numbers are recorded here so the
record shows what was in front of me when I made them.

## A1 — the gap denominator and window are across-seed; the numerator is within-seed

The prereg wrote `v_A` and `v_B` without saying whether they are seed `i`'s own A
and B runs or the mean over seeds. Implemented first as per-seed, and the pilot
showed why that is wrong: **4 of 6 seeds contributed nothing.** A seed in which the
premium happened to do little never clears the `0.05` denominator floor, so it has
no admissible generations and is dropped — which **selects the sample on the size of
the very effect being measured**, and hands every surviving seed a different
averaging window.

Resolved as:

    ancGap_i(g)  = (v_i(g)  - v_{A,i}(g))  / (mean_B v(g)  - mean_A v(g))
    polyGap_i(g) = (R1_i(g) - R1_{A,i}(g)) / (mean_B R1(g) - mean_A R1(g))

One window for every seed and every arm, decided by the reference arms alone; no
seed divides by its own near-zero separation; the numerator stays paired within
seed, which is what the paired t interval needs. After the change all 6 pilot seeds
contributed at every k.

## A2 — a ratio-of-sums variant was tried and is NOT adopted

Expected the mean of per-generation ratios to be inflated by generations where the
A→B scale sits just above the floor, and added `Σnumerator / Σdenominator` to damp
it. **It did not help: ±1.230 against ±1.185 on the same pilot.** The hypothesis was
wrong — the spread is genuine seed-to-seed variation in how far each seed travels,
not small denominators. The registered statistic therefore stands as primary and the
variant is printed as a robustness check the verdict does not read. Swapping the
primary statistic on theory alone, after seeing pilot output, is the move this
project pre-registers to prevent.

## A3 — G2 is evaluated at the first ADMISSIBLE post-switch generation

The prereg said `polyGap(k+1) ≤ 0.5`. At `k+1` the A-vs-B separation has not opened
yet, so `polyGap(k+1)` is a ratio of two near-zero numbers and reports whatever the
noise did — it would not be measuring relaxation speed at all. G2 is therefore read
at the first generation that clears the `0.05` floor. The substitution is printed
beside the gate, so it is visible in the run output and not only here.

## A4 — 300 seeds, and why

The pilot's per-seed `Δ` has sd ≈ 1.1. At the registered n=40 the 95% half-width
would be ≈ 0.36 against a decision band of 0.15: **the design would return
INCONCLUSIVE for lack of power almost regardless of the truth**, and that branch
would then be uninterpretable — indistinguishable from a real straddle. Closing the
band needs n ≈ (1.1 / 0.075)² ≈ 220, so the full run is at **300 seeds**, all seven
arms.

The run reports the measured per-seed sd, the achieved half-width, and the n the
band would require, **on every branch and not only when the result is
inconclusive** — a power statement produced only where it excuses the outcome is not
a power statement.

## A5 — C1 and C2 are always evaluated on seeds 1..40

`0.289` and `0.026` are 40-seed fractions. At 300 seeds an arm can reproduce #53
exactly and still print a different HELD, so comparing a 300-seed fraction against
them would turn a passing control into a failing one. The reproduction check runs on
the identical seed set #53 used; the contrast uses all 300. Founding does not depend
on the arm — `foundTwoLineages` is called from the same streams before any stepping
— so the kept subset is the same subset #53 kept.

## What is NOT amended

The decision bands (`+0.15`, the asymmetry, and which branch carries the burden),
the three gates, the five controls, and the reading of each branch are unchanged.

---

# Second amendment — the null the `Δ ≈ 0` reading needs

Added before any full run, after an adversarial re-read of the design. The first
amendment's runs were stopped ten minutes in and discarded; nothing below was
written with a result in view.

## A6 — ancestry is a stock, `R1` is not, and that alone produces co-movement

`ancestryVar` is a **stock**: it accumulates over generations, decays, and cannot
jump. `R1` is **recomputed from scratch** out of each generation's realised bloom
multiset. The two therefore relax at different intrinsic rates **whether or not
anything couples them**, and after the switch both are dragged along by the same
common trend.

That is enough to produce co-movement — and co-movement is exactly what the
THROUGH-THE-POLYMORPHISM branch reads as support. Without a null, **that branch is
a control that cannot fail**: the same structural defect that made #53's C2 blind,
reached by a different route. Left unaddressed it would have been the second
consecutive result resting on a control narrower than the claim it carried.

## A7 — the seed-shuffled null, and why it is a variance test

`Δ` is recomputed with the pairing deliberately broken: seed `i`'s `ancGap`
against seed `σ(i)`'s `polyGap`, `σ` a fixed cyclic shift. Everything shared
survives the shuffle — the window, the A→B scale, the generation trend, the
inertia asymmetry. **Only the seed-specific coupling does not.**

The test is on the **spread, not the mean**. If `ancGap` and `polyGap` really track
each other within a seed, their difference is tighter than it is once the pairing
is broken. If both merely ride the common trend, breaking the pairing costs
nothing and the two spreads match. Comparing the two *means* would be the wrong
test and would pass on uncoupled data.

    sdRatio = sd(Δ real) / sd(Δ shuffled)

Committed reading: **the THROUGH-THE-POLYMORPHISM branch additionally requires
`sdRatio ≤ 0.8`.** If the branch is reached with `sdRatio` near 1, the run prints
the verdict *and* prints that the coupling null was not beaten, and the result is
to be reported as a **timescale coincidence, not as evidence for #52's two-step**.

Note the asymmetry this creates, and that it is the right way round: the inertia
bias pushes `Δ` **downward**, so it works *against* DIRECT. A `Δ` above `+0.15`
despite that bias is strong; a `Δ` near zero is weak, which is what the bands
already said and now say for a named mechanical reason rather than out of caution.

## A8 — the per-seed trajectories are written out before any analysis runs

Every per-generation `v`, `R1` and `visitsSpent` is dumped to JSON before a single
statistic is computed. The simulation is hours and the analysis is milliseconds,
so a later question about the estimator — a different window, a different null,
the decay-rate form instead of the level form — costs no compute **and is answered
on exactly the run that produced the published numbers**, rather than on a re-run
that might not reproduce.

---

# Third amendment — a rank companion, and why the per-seed gaps are unbounded

Registered while the full runs were in flight and before any of their output was
read. Computed afterwards from the per-seed JSON dump (A8), on exactly the run
that produces the published numbers — no re-simulation, and no opportunity to
choose the estimator against the answer.

## A9 — the per-seed gaps are NOT bounded in [0,1], and the t interval is the wrong summary

The across-seed *mean* gap runs 0 → 1: it is 0 at the switch by C5's pre-switch
identity, and approaches 1 as the arm converges onto B. An individual seed's gap
is not so bounded, because A1 divides a **within-seed numerator** by an
**across-seed denominator**. A seed whose own A-vs-B separation is much smaller
than the average overshoots; one whose separation is larger undershoots.

That is the price of A1 — the alternative, per-seed denominators, reintroduces the
selection bias A1 exists to remove — and it is the real source of the pilot's
sd ≈ 1.115 on a statistic whose mean lives near zero. **A quantity that heavy-tailed
is badly summarised by a t interval**, which assumes the tails it does not have.

So alongside the registered t interval, the analysis reports a **Wilcoxon signed-rank
test and a sign test** on the per-seed `Δ`. These ask the same question — is `Δ`
displaced from zero, and in which direction — without assuming the tail shape.

**Reading, committed now:** the t interval remains the registered primary and decides
the bands. If the rank tests **disagree in direction or significance** with it, the
result is reported as **estimator-dependent** and no branch is claimed, because a
verdict that depends on which summary of the same numbers is used has not been
measured. If they agree, the branch stands as registered.

## A10 — what H3 does and does not damage

Both gaps sharing endpoints compresses the *scale* of `Δ` but does not destroy the
signal: over a fixed window, a curve that rises sooner still has the larger average.
The DIRECT reading — ancestry arriving before the polymorphism — remains measurable.
What H3 does is explain why `|Δ|` is small in magnitude relative to its noise, which
is the same power problem A4 already answered with 300 seeds, arriving from a second
direction and agreeing.
