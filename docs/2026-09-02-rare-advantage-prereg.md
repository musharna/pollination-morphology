# #55 pre-registration — is the premium a rare-lineage advantage?

_2026-09-02. Registered before the run. Supersedes the pulse design filed with #55;
[why](#why-the-pulse-design-was-abandoned) is below and rests on a measurement, not a preference._

## The finding that forced the redesign

`anc` is documented as "the standard admixture tracker" (`sim/ibm.js:431-449`) and exists to
tell three outcomes apart: FUSION, EXTINCTION, PERSISTENCE. Nobody had read off which one
the phenology runs were producing. Measured, on the instrumented build, 40 seeds, 38 founded:

| quantity                                     | arm A (premium on) | arm B (premium off) |
| -------------------------------------------- | ------------------ | ------------------- |
| matings                                      | 39,900             | 39,900              |
| matings whose parents differed in ancestry   | **2**              | **842**             |
| largest number of distinct `anc` values ever | 3                  | 29                  |
| runs ending with one lineage gone            | 27/38              | 36/38               |
| HELD                                         | 11/38 = **0.289**  | 1/38 = **0.026**    |

Both HELD figures reproduce #52-#54 exactly on the instrumented build, so this is the same
experiment rather than a near-miss of it.

⚠️ **The arms differ 400-fold in gene flow.** Under the premium, cross-lineage mating is
0.005% of matings and the tracer stays a two-valued **lineage label** — ancestry variance is
`p(1-p)` in the lineage frequency and can only fall by **exclusion**. Without the premium,
2.1% of matings cross and up to 29 distinct `anc` values appear: real admixture. Arm B loses
ancestry variance by _both_ routes at once; arm A has only one route open to it.

An earlier draft of this document read the arm-A number alone and concluded the configuration
does not blend at all. That was wrong, and wrong in the direction that understates what the
premium does. Fusion is reachable elsewhere in this model too —
[fusion-vs-exclusion](2026-08-07-fusion-vs-exclusion.md) reports 12 FUSED of 38 at the same
`d = 8` under strong rare-bias `a = 0.25`.

That does not overturn #52, #53 or #54 — every HELD number stands. What changes is the
**mechanism sentence**. The two-step was written as

> premium maintains the flowering-time polymorphism -> the polymorphism assorts -> assortment
> retains ancestry

with "assorts" doing unexamined work. The measurement says bloom separation has **two**
consequences, not one, and they are the same cause seen twice:

> premium keeps the lineages in **separate bloom slices** -> **(a)** they seldom co-flower, so
> pollen rarely crosses (isolation), **and (b)** each lineage's slice draws a FULL flat budget,
> so whichever lineage is rarer gains per capita (negative frequency dependence)

Route (b) is what #52-#54 never measured, and it is what this run is for.

## The mechanism this registers, and why it is the obvious one

`PH.displayProportionalVisits = false` gives every occupied slice a flat visit budget
regardless of how much display it holds. A lineage that has drifted to minority holds less
display. Under proportional allocation it therefore draws proportionally fewer visits and
has no defence; under the flat budget its slice draws a **full** budget shared among fewer
plants, so its **per-capita** visit rate rises as it becomes rarer. That is negative
frequency dependence, and negative frequency dependence is exactly what prevents loss of a
minority type.

This also explains, without any new assumption, why #54 found the premium **not bankable**:
the protected quantity is a frequency, and a frequency has no memory beyond its present
value. Twenty-five generations of protection leave nothing banked because there is nothing
to bank.

## Hypotheses

| #      | mechanism                                                                                                                                   | discriminating column                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **H1** | **mediated** — the premium keeps the lineages in distinct bloom slices, and the flat per-slice budget then favours whichever slice is rarer | the per-capita advantage is concentrated where slice segregation `S` is high |
| **H2** | **direct** — the flat budget favours rare plants whether or not the lineages are bloom-separated                                            | the advantage is present at all `S`                                          |
| **H3** | **no advantage** — the premium changes HELD by something other than per-capita visit rate                                                   | `r` and `w` are ~1 in both arms while HELD still differs                     |

H3 is a live possibility and is the reason the run reports `r` and `w` for both arms whatever
the answer.

## Measurements, per generation, per seed

Taken **before** the step for lineage composition and **from** the step for outcome:

- `n0, n1` — plants per lineage; `p` = minority frequency.
- `r` — minority per-capita visits over majority per-capita visits, from `res.visitsTo`
  (per-plant landings, `sim/ibm.js:2058`), indexed against the pre-step population.
- `w` — minority per-capita **realised** offspring over majority per-capita offspring,
  counted from the offspring's own `anc`. This is the selection coefficient itself, not a
  proxy for it.
- `S` — bloom-slice segregation between lineages, from `res.blooms` (which describes the
  **parents**, so it aligns with the pre-step indices; see the alignment note below).

## Statistics, fixed now

**Primary, bounded, one number per seed.** The proportion of that seed's generations in
which the minority lineage's per-capita realised fitness exceeded the majority's. A
proportion in `[0,1]`: no denominator that can blow up, no tail, and no sample selected on
the outcome. Reported per arm with a paired interval across seeds.

**Q1 — does the advantage exist?** The registered comparison is **arm A against arm B**, not
either against 0.5. H1 and H2 predict the primary is higher in arm A; H3 predicts the arms
are equal.

> **Amendment A1, made after a 6-seed pilot and before the run.** The original wording
> predicted "above 0.5 in arm A". The pilot reads 0.323 (A) and 0.196 (B): the minority is
> _usually disadvantaged in both arms_, which is unsurprising once stated — lineages are lost
> in 27/38 arm-A runs, and they could not be if the minority were generally favoured. So an
> absolute 0.5 threshold tests nothing the design cares about, and the A-vs-B contrast is
> what both hypotheses actually differ on. The pilot's direction is not treated as a result;
> only the form of the comparison is fixed here.
>
> The pilot also shows a **dissociation worth reporting whatever the outcome**: the per-capita
> _visit_ ratio at low minority frequency is strongly above 1 (2.998 for p < 0.1) while
> realised _fitness_ is not. Visits favour the rare lineage; offspring do not follow. The
> obvious candidate is mate finding — bloom separation isolates the rare lineage's plants from
> compatible pollen at the same time as it wins them visits — and the run reports `r` and `w`
> side by side so the gap between them is visible rather than averaged away.

**Q2 — is it mediated?** Within arm A only, the excess `r - 1` binned by `S`. H1 predicts the
excess is concentrated in the high-`S` bins and absent from the low ones; H2 predicts it is
flat in `S`.

**Q3 — is it sufficient?** A two-type Wright-Fisher on `N = 30` driven by the _measured_
`w(p)`, with **no free parameters**, run to 35 generations, must reproduce HELD. Registered
bands: arm A `0.289 +/- 0.10`, arm B `0.026 +/- 0.05`. Missing them means the measured
per-generation advantage does not account for the outcome and the mechanism is incomplete —
which is a reportable result, not a failure of the run.

## Controls, and what each can fail on

| id     | control                                                                      | fails if                                                     |
| ------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **C1** | arm A HELD on seeds 1..40 = 0.289                                            | the instrumented build no longer reproduces #52-#54          |
| **C2** | arm B HELD on seeds 1..40 = 0.026                                            | same, other arm                                              |
| **C3** | `randomMating: true` arm shows no per-capita advantage                       | the advantage is an artefact of the machinery, not the rule  |
| **C4** | `visitsSpent` matched between arms at each generation, as ONE step           | the arms differ in total budget, not in its allocation       |
| **C5** | per-lineage offspring counts sum to the population size                      | the counting is wrong                                        |
| **C6** | the primary statistic's endpoints are separated in a calibration on arms A/B | the statistic cannot tell the arms apart and carries nothing |

C6 is registered because the equivalent statistic in the abandoned design **failed exactly
this check** — arm A scored 0.746 and arm B 0.687, six hundredths apart — and it was only
caught by calibrating before running.

C1 and C2 are evaluated on **seeds 1..40 whatever N_SEEDS is**, carried over from #54's
amendment A5: 0.289/0.026 are 40-seed fractions, and at 272 seeds the same arms read
0.246/0.007, so comparing at full `n` would fail on correct code.

## Kill conditions, stated before the run

1. **C6 fails** — no verdict, and the statistic is reported as uncalibrated rather than
   quoted.
2. **C3 fails** — the advantage appears under random mating too, so it is not the allocation
   rule and nothing about the premium is claimed.
3. **Arm B shows the same advantage as arm A** — the premium is not its source; the framing
   in this document is wrong and is retracted rather than patched.

## Alignment note, inherited from #54

`res.blooms` is built from the **input** population (`sim/ibm.js:1168`) while the offspring
are `res.pop`. So a bloom-derived quantity at index `g` describes the parents of generation
`g`, and an offspring-derived quantity at index `g` describes their children. #54's
`ancGap`/`polyGap` compared the two **unshifted**, which biases the comparison toward
"ancestry lags". It does not change #54's NO VERDICT, which rested on the shuffle null and on
estimator disagreement, but it is recorded here because this run compares bloom-derived `S`
with offspring-derived `w` and must not repeat it.

## Why the pulse design was abandoned

The pulse was to separate a one-stage filter from a two-stage cascade by the shape of the
response. Four instruments were built and every one failed on its own control before any
compute was spent:

| instrument                                       | why it was dropped                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `t90/t50` against the textbook 3.32 vs 2.32      | the in-system one-stage reference R1 read 2.57, so the bands do not apply here  |
| `S = (t90-t50)/(t50-t10)`, shift- and scale-free | control passed, but bootstrap put S(ancestry) anywhere in [2.55, 6.21]          |
| whole-curve least squares, M1 vs M2              | R1 — which must prefer M1 — preferred M2 in 63% of resamples                    |
| bounded per-seed slope score                     | endpoints 0.746 vs 0.687; and its floor censored 63-93% of seeds on the outcome |

The common cause is not the estimators. Under a single step, the premium and the polymorphism
are **collinear for the whole trajectory**, so the two hypotheses differ only in fine curve
shape, which noise swamps. Six attempts across #53, #54 and this pre-flight sit in that one
class. The rule this project already carries — two failures in a mechanism class means change
the class, not the estimator — says to stop, and the zero-blending measurement above says
which class to move to: measure the selective force per generation instead of inferring the
pathway from trajectories.
