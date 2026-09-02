# Result — #52: roadmap B's positive rests on the per-slice rarity premium

**Date:** 2026-09-01 · **Status:** run · **Job:** 3631, desktop, 46.7 min, exit 0
**Build:** `sim/ibm.js` md5 `9a27e8425a2478ca4a3640e2ec8b760e`, node v18.20.8, logged by the job itself
**Registered in** [2026-09-01-rarity-premium-prereg.md](2026-09-01-rarity-premium-prereg.md),
**before `phenology.js` had any ablation flag**
**Re-run with** `./tools/run-rarity-premium.sh`

## The gate: arm A reproduces #37 exactly

| cell                   | HELD published | HELD, arm A |
| ---------------------- | -------------: | ----------: |
| wide season (baseline) |          0.000 |   **0.000** |
| narrow · free          |          0.289 |   **0.289** |
| narrow · linked        |          0.368 |   **0.368** |
| wide · linked          |          0.000 |   **0.000** |
| narrow · shuffled      |          0.000 |   **0.000** |

Every published figure returns: `bloomLineage` 0.886 → 1.000, co-flowering 4.743
against 4.343 (ratio 0.916), R1/R2 to three decimals, and all four contrasts.
**The baseline is sound, which is what licenses the comparison at all.**

## The registered predictions — all four pass, so the outcome is COLLAPSE

| #      | prediction                                  | measured                                   |     |
| ------ | ------------------------------------------- | ------------------------------------------ | --- |
| **P1** | narrow·free HELD 0.289 → ≤ 0.079            | **0.026** (1 of 38 seeds)                  | ✅  |
| **P2** | H-link no longer excludes zero              | **0/38 vs 0/38**, no interval, bound 7.58% | ✅  |
| **P3** | H-pool no longer excludes zero              | **+0.026 [0.000, 0.079]**                  | ✅  |
| **P4** | both wide cells byte-identical between arms | **38/38 on blooms, budget, whole step**    | ✅  |

H-link was +0.368 [0.211, 0.526] and H-pool was +0.289 [0.158, 0.447]. Both are
gone. **P3 is the one that matters**: it is the contrast that licensed
"heritable temporal assortment" over "small mating pools", and it no longer
supports the claim.

**So the answer is yes.** At the configuration #37 tested, its positive rests on
the per-slice rarity premium. Removing that convention — while leaving the
season, the genome, the population and the total visit budget untouched — takes
retained ancestry variance from 0.289 to 0.026.

## ⚠️⚠️ The mechanism is NOT the one registered, and my own statistic is what refuted it

The prereg's H_A said sparse slices pay a per-capita premium, bloom tracks
lineage, so a rare **lineage** is paid for it. **M2 was registered to test
exactly that, and it does not support it:**

| cell            | M2, arm A | M2, arm B |
| --------------- | --------: | --------: |
| wide season     | **1.327** | **1.327** |
| wide · linked   | **1.331** | **1.331** |
| narrow · free   |     1.291 |     0.981 |
| narrow · linked |     1.245 |     0.987 |

The rarer lineage draws ~33% more visits per capita **in the wide cells, where
the premium provably cannot operate** — every plant flowers in every slice, M1 is
undefined for want of crowd variation, and wCrowd is exactly 1.000. And the
narrow control cells read **1.291, below the wide baseline's 1.327**. If the
premium were subsidising minority ancestry directly, narrow would sit above wide.
It sits below. **The direct-subsidy reading of H_A is refuted by its own
registered statistic**, and M2's movement inside the narrow cells is not clean
evidence for anything.

### What the run actually shows: a two-step through flowering-time variation

| cell            | R1 arm A |  R1 arm B | R2 arm A |  R2 arm B | reading                      |
| --------------- | -------: | --------: | -------: | --------: | ---------------------------- |
| narrow · free   |    0.457 | **0.941** |    0.368 | **0.849** | scattered → **CONCENTRATED** |
| narrow · linked |    0.387 | **0.965** |    0.432 | **0.870** | scattered → **CONCENTRATED** |
| narrow·SHUFFLED |    0.708 |     0.690 |    0.435 |     0.427 | unchanged                    |
| wide            |    0.679 |     0.679 |    0.428 |     0.428 | unchanged                    |

Under the ablation the **flowering-time distribution itself collapses**: the
narrow arms go from a maintained scatter to near-fixation, co-flowering rises
4.743 → 6.366, and pollen assortment weakens 0.151 → 0.477.

⚠️ **And it collapses only where bloom is heritable.** The shuffled arm permutes
schedules every generation, so there is no locus to concentrate — and its R1 does
not move (0.708 → 0.690), while the arms with a heritable bloom locus go to 0.94.
That contrast was not registered and is **post-hoc**, but it is the internal
control the two-step story predicts and the direct-subsidy story does not.

So the chain the evidence supports is:

> the flat per-slice budget makes rare flowering times pay → that negative
> frequency-dependence **maintains flowering-time polymorphism** → the
> polymorphism is what assorts mating → assortment retains ancestry.

Remove the premium and the first link goes; everything downstream follows. It is
a fact about what sustains the _variation_, not about who gets subsidised.

## The two rival mechanisms, both excluded

| cell            |   M1 arm A |   M1 arm B | M4 arm A |  M4 arm B | excess A |   excess B | empty |
| --------------- | ---------: | ---------: | -------: | --------: | -------: | ---------: | ----: |
| narrow · free   | **−0.843** | **+0.001** |    0.677 | **0.082** |   −0.285 | **−0.000** | 0.000 |
| narrow · linked |     −0.841 |     +0.004 |    0.679 |     0.085 |   −0.285 |     −0.000 | 0.000 |
| narrow·SHUFFLED |     −0.824 |     −0.000 |    0.773 |     0.082 |   −0.407 |     +0.000 | 0.000 |

- **M1 is the positive control on the ablation itself** and it passes decisively:
  −0.843 → +0.001. The premium was real, large, and is gone.
- **H_B (reproductive variance / lower Ne) is contradicted.** It _requires_ the CV
  of visits to rise. It **falls**, 0.677 → 0.082 — apportioning by display makes
  visits markedly more even, not less.
- **H_C (season collapse) is excluded** for the fixed-bloom sense in which it was
  registered: the excess over what apportionment mathematically entails is
  **−0.000**, and no slice carrying display went unvisited in any cell.

## Instrument notes — three of my own guards were wrong, in three different ways

⚠️ **1. M3's weighted crowd could not discriminate, and that was caught BEFORE the
run.** Apportioning by display sends visits where the plants are, so with equal
display per plant the visit-weighted crowd is `1 + CV²(occupancy)` **exactly** —
verified on hand cases to 4 dp and confirmed live (measured excess −0.000 in
every narrow ablation cell, and wCrowd tracking `expected` to three decimals:
1.544/1.544, 1.511/1.511, 1.396/1.396). A statistic that is a function of the
occupancy distribution cannot tell a collapsed season from an ablation that
merely ran. Reporting the **excess** is what gives it information; reporting
wCrowd alone would have been a guard that could not observe its referent.

⚠️ **2. M2 was contaminated, and only the wide cells revealed it.** It reads 1.33
where the premium cannot exist. Had the design carried narrow cells only, M2's
1.29 would have looked like confirmation of the registered mechanism. The cells
that were there to be a no-op control are what falsified the hypothesis.

⚠️⚠️ **3. The registered generation-0 criterion was MIS-SPECIFIED BY ME.** The
prereg said gen-0 `bloomAssort`, `bloomLineage`, `coflower` and `blooms` must all
be identical between arms or the run is uninterpretable. Measured, that criterion
fails 0/38 — but decomposed it is my error, not the model's:

| statistic      | identical @ g0 | should it be?                                                                                                  |
| -------------- | -------------: | -------------------------------------------------------------------------------------------------------------- |
| `blooms`       |      **38/38** | yes — who flowers when, untouched by visits                                                                    |
| `coflower`     |      **38/38** | yes — counted before the visit check, deliberately                                                             |
| `bloomLineage` |      **38/38** | yes — computed from blooms and ancestry                                                                        |
| `bloomAssort`  |       **0/38** | **no** — read off the transfer matrix, so it is downstream of where the animal went, which IS the intervention |

Three of the four are byte-identical; the fourth was never a fact about who
flowers when. **The flag touches visits and nothing else**, which is what the
criterion was trying to establish.

⚠️ **4. The `visits` column is a trajectory, not a budget.** Arm A's narrow·free
spends 558,474 and arm B's 354,711, and read naively that trips the prereg's own
budget criterion. It must not be read that way: it sums 35 generations of two
arms which, being different models, diverge after generation 0 — the exact error
#51 made and fixed. **The budget question is only well posed on one step of the
same population, and there the arms match 38/38 in every cell.** The ablated arm
spends less over a run because the season it produces occupies fewer slices, not
because it was handed a smaller pot.

⚠️ **5. Arm B's own pool-size gate fires** (ratio 0.667, co-flowering 6.366 vs
4.248) and the experiment prints that its confound contrast cannot attribute.
That is correct and is a consequence of the collapse described above, not an
independent defect — but it means P3's `+0.026 [0.000, 0.079]` should be read as
"there is no effect left to attribute", not as a clean attribution of a small one.

## What this does and does not do to #37

**It does not retract #37.** #37 was pre-registered, ran its controls, reported
them, and every one of its numbers reproduces here exactly. The supergene still
does nothing (linkage alone 0/38, bound 7.58%). Its pool-size confound is still
excluded in the arm it was tested in.

**It narrows the claim's scope.** "Temporal assortment reaches placement" holds
_given a constant per-slice visit budget_, and that budget is a modelling
convention rather than a derived fact: a fixed forager population working
whatever is in bloom. The alternative — foragers aggregating on floral abundance
— is equally defensible biology, and under it the result is not there. Real
pollinators sit between the two, so the honest statement is that **#37's positive
is conditional on where in that range the model sits, and nothing in the project
has yet established where that is.**

⚠️ This also sharpens what roadmap `:219` is owed. #37 was already flagged as not
answering the northstar because `WIDTH = 0.12` is imposed. The imposition is
deeper than that: the _mechanism sustaining the flowering-time variation_ is also
imposed, by the allocation rule.

## Still open

- **The two-step is inferred, not isolated.** The ablation removes the premium
  **and**, as a downstream consequence, the flowering-time polymorphism. Within
  this run those are confounded. The clean test holds the bloom **distribution**
  fixed while removing the premium — re-imposing arm A's realised bloom multiset
  on the ablated arm each generation — so that only the premium differs. Until
  that runs, the chain above is the best-supported reading, not a demonstrated
  one.
- **Why M2 reads 1.33 with no temporal structure at all.** Unexplained, and it
  should be, before M2 is quoted anywhere again.
- The **higher-order concentration penalty** from #49/#51, ~19% of the width
  gradient, still unmodelled.

[prereg](2026-09-01-rarity-premium-prereg.md) · [#37](2026-08-25-phenology.md) ·
[#51](2026-09-01-empty-time.md) · raw output: jobd 3631
