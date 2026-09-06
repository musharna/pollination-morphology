# #64 — a floor given to few is worse than no floor at all

_2026-09-06. Registered in [the pre-registration](2026-09-05-selfing-cover-prereg.md)
before the sweep ran, with the analysis and its negative controls committed
before the data existed. Eight cells at N0 = 30, rate 2.0, cost 0, 35
generations, 109 seeds each — 872 replicates, every contrast paired on founding
seed._

## The answer in one line

Hold the total selfing budget **exactly constant** and withhold it from a growing
random fraction of plants, and coexistence does not merely lose the floor's
benefit — it falls **below the arm that never had a floor at all**. At q = 0.85,
`HELD` is **0.055 against the no-floor anchor's 0.266, −0.211 [−0.303, −0.119]**.
The same assurance, spent in full, distributed to fewer plants, is actively
worse than spending none. **Coverage is not a way of delivering the floor. It is
a separate, harmful thing the floor can do.**

## The registered primary

**HELD, per run, no `k` filter, no conditioning, `30:R200q69` vs `30:R200`,
paired on founding seed, 10,000 bootstrap resamples over seeds.**

| q = 0.69 vs flat       | flat  | q = 0.69 | paired difference           |
| ---------------------- | ----- | -------- | --------------------------- |
| **HELD (coexistence)** | 0.404 | 0.183    | **−0.221 [−0.339, −0.101]** |

The interval excludes zero and is negative. By the rule fixed in advance that is
**H1: random coverage loss destroys coexistence.** The pre-registration also
required recording whether the estimate is more negative than #63's clip-vs-flat
**−0.138**. It is.

**The registered pre-condition held**, so there was something to withdraw:
no floor → flat is **0.266 → 0.404, +0.138 [0.028, 0.248]**.

## The dose curve, and the discriminator it was built for

| arm      | q realised | HELD      | vs flat                      |
| -------- | ---------: | --------- | ---------------------------- |
| flat     |      0.000 | 0.404     | —                            |
| q = 0.00 |      0.000 | 0.404     | 0.000 [0.000, 0.000]         |
| q = 0.25 |      0.267 | 0.330     | −0.074 [−0.183, 0.037]       |
| q = 0.50 |      0.500 | 0.275     | −0.129 [−0.239, −0.018]      |
| q = 0.69 |      0.700 | 0.183     | −0.221 [−0.339, −0.101]      |
| q = 0.85 |      0.867 | **0.055** | **−0.349 [−0.450, −0.248]**  |
| no floor |          — | 0.266     | −0.138 (the floor's benefit) |

Monotone non-increasing across all five doses. The step from q = 0.25 to q = 0.50
is **0.055**; the step from q = 0.69 to q = 0.85 is **0.128** — the curve
**accelerates**.

⚠️ As registered, the shape is **descriptive only**: five ordered point estimates
is weak evidence on its own. The load-bearing test is the next section, which is
a single pre-registered contrast with an interval.

The three mechanisms and their registered predictions:

| #       | mechanism       | predicted                                                     | observed                                                                 |
| ------- | --------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **H-a** | KILL            | harm ~linear, **bounded by the floor's whole benefit**        | ❌ harm at q = 0.85 is **0.349**, the floor's whole benefit is **0.138** |
| **H-b** | LOTTERY         | harm **convex**; q = 0.85 falls **below** the no-floor anchor | ✅ convex, and it does — **−0.211 [−0.303, −0.119]**                     |
| **H-c** | CONSERVED TOTAL | **no** coverage effect at any q                               | ❌ four of five doses move it; the largest excludes zero comfortably     |

**H-a cannot be the whole story by the bound written into the pre-registration.**
Coverage removes 0.349 of coexistence while the floor only ever supplied 0.138 of
it. A rule that could only take back what the floor gave cannot take back two and
a half times as much.

## ⚠️ The result: below the no-floor anchor

The pre-registration named this as the clean split between KILL and LOTTERY.
KILL forbids it — if coverage acts only by zeroing plants that were already at
`received === 0`, the worst it can do is return the population to its unassured
state. LOTTERY predicts it, because a matched total paid to a shrinking fraction
at 1/(1 − q)× injects variance the no-floor arm never carried.

| vs the no-floor anchor | no floor | arm       | paired difference           |
| ---------------------- | -------- | --------- | --------------------------- |
| q = 0.50               | 0.266    | 0.275     | +0.009 [−0.101, 0.119]      |
| q = 0.69               | 0.266    | 0.183     | −0.083 [−0.174, 0.009]      |
| **q = 0.85**           | 0.266    | **0.055** | **−0.211 [−0.303, −0.119]** |
| #63 clip               | 0.266    | 0.266     | 0.000 [−0.119, 0.119]       |

> ⚠️⚠️ **THE TELL.** Every arm in this table spends the identical selfing budget
> — C-match holds to **1.3e-15** across 654 arm-seeds. The no-floor arm spends
> **nothing**. And the arm that spends the full budget on 13% of plants coexists
> **a fifth less often than the arm that spends none**.
>
> Reproductive assurance is not a quantity a population can be given. It is a
> quantity a population can be given **unevenly**, and unevenness is a cost that
> the total does not see. A conservation law over the treatment does not make the
> treatment conservative.

Note also where #63's clip lands: **exactly on the no-floor anchor**, 0.266 vs
0.266, interval symmetric about zero. #63's rule destroys the floor's entire
benefit and stops there — the KILL-shaped outcome. Random coverage at the matched
dose goes past it.

## The two measures disagree again, and that is reported as a disagreement

#63's registered primary, `motheredTotal`, ships here as a registered secondary
on every contrast. The pre-registration committed in advance that if the two
disagreed the disagreement would be **reported, not resolved in favour of
whichever excludes zero**.

| total minority offspring | flat    | arm     | paired difference               |
| ------------------------ | ------- | ------- | ------------------------------- |
| q = 0.25                 | 205.450 | 189.312 | −16.314 [−51.404, 19.881]       |
| q = 0.50                 | 205.450 | 184.349 | −21.424 [−56.697, 13.679]       |
| **q = 0.69 (primary q)** | 205.450 | 167.899 | **−37.791 [−77.468, 1.358]**    |
| q = 0.85                 | 205.450 | 111.734 | **−93.948 [−127.193, −60.229]** |
| #63 clip                 | 205.450 | 185.532 | −20.109 [−64.220, 24.963]       |
| no floor → flat          | 135.936 | 205.450 | **+69.818 [33.156, 106.844]**   |

At the primary dose the two measures **disagree**: HELD excludes zero at
−0.221, `motheredTotal` includes zero (just — its upper bound is +1.358). At
q = 0.85 they agree decisively. This is the same pattern #63 reported, on an
independent treatment, and it is the second time the binary has been sharper than
the count. That is consistent with the reason given in advance for the switch —
`motheredTotal` is a sum over informative generations, and the treatment moves
the number of informative generations — but it remains a disagreement, and it is
not being resolved here.

## Random versus residual starvation, at matched coverage

| matched-dose head to head | #63 clip | q = 0.69 | paired difference      |
| ------------------------- | -------- | -------- | ---------------------- |
| HELD                      | 0.266    | 0.183    | −0.083 [−0.183, 0.018] |

The interval includes zero. **At matched coverage, random starvation is not
distinguishable from residual-targeted starvation** on 109 seeds. The point
estimate favours random being worse, and the two arms sit either side of the
no-floor anchor, but this sweep cannot separate them. #63's harm is therefore
attributable to **starvation at 69% coverage**, not to the residual rule; the
targeting adds nothing detectable on top of the dose.

## What C-kill shows about the two rules

| arm      | exposed % | killed/exposed | overall starved |
| -------- | --------- | -------------- | --------------- |
| flat     | 0.094     | 0.000          | 0.000           |
| q = 0.25 | 0.090     | 0.268          | 0.267           |
| q = 0.50 | 0.084     | 0.498          | 0.500           |
| q = 0.69 | 0.078     | 0.700          | 0.700           |
| q = 0.85 | 0.073     | 0.868          | 0.867           |
| #63 clip | 0.088     | **0.461**      | **0.691**       |

Random coverage is **blind**: the share of the exposed class it kills equals its
overall starved share, to three decimals, at every dose. #63's clip is
**targeted**: it starves 69.1% of plants overall but only 46.1% of the plants
that have `received === 0` — it systematically _spares_ the exposed class, which
is #63's mechanism reproduced at arm level from shipped rows.

The exposed class itself moves by only **0.021** across arms, so the kill rate's
denominator is close to fixed and the comparison is not a denominator artefact.

## The collider inverted again — but only on the clip arm

| at k = 1                | flat    | q = 0.69 | q = 0.85 | **#63 clip** |
| ----------------------- | ------- | -------- | -------- | ------------ |
| mean `minMothered`      | 0.580   | 0.667    | 0.797    | **7.543**    |
| share mothering nothing | 0.594   | 0.745    | 0.847    | **0.114**    |
| generations / seeds     | 69 / 45 | 51 / 43  | 59 / 54  | 70 / 46      |

#62's registered primary, conditioned on k = 1, again reads the clip arm as a
thirteen-fold success — while unconditionally that same arm is
**indistinguishable from having no floor at all**. The inversion is reproduced on
a second, independent sweep.

⚠️ **But the random-coverage arms do not invert.** q = 0.69 and q = 0.85 read
0.667 and 0.797 against flat's 0.580 — mildly up, nothing like 7.543 — while
unconditionally they are the most harmful arms in the study. So the inversion is
a property of **the residual rule's lottery over a single surviving plant**, not
a general consequence of starvation. Conditioning on k = 1 selects generations in
which the minority still exists; the clip rule's surviving minority plant is
either magnificently funded or dead, and the dead ones are not counted. Random
coverage kills a smaller fraction of the exposed class per generation and so
leaves a less extreme surviving sample.

This section is carried as **registered, collider-conditioned, and unable to
change any verdict above**.

## Controls

All controls passed; the analysis exits 0.

| control     | result                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------- |
| **C-null**  | q = 0 vs flat, every shipped field: **121,499 values over 109 seeds, 0 disagreements**      |
| **C-match** | every arm spends the flat total at g = 0: worst relative gap **1.3e-15** over 654 arm-seeds |
| **C-cover** | realised starved share tracks nominal within `round(q·n)` at every dose                     |
| **C-kill**  | flat and q = 0 kill nobody; exposed-class share varies by only 0.021 across arms            |
| **C10**     | selfed share of matings **0.667–0.668 at every q**, against `rate/(1+rate) = 0.667`         |
| **C-seed**  | 109 seeds in every cell                                                                     |

**C10 is the one worth dwelling on.** A killed mutation run left a mutant in the
tree during this task's implementation — `target / n` where `target / nKeep`
belonged — under which the selfed share fell monotonically with coverage
(0.672 → 0.590 / 0.496 / 0.372 / 0.210). That looks exactly like a real confound
between coverage and realised selfing, and it nearly bought four extra
rate-matched arms. It is not a confound: mothers are drawn ∝ `weight`, the coin
is `rng() * weight[mother] < selfW[mother]` (`sim/ibm.js:2192`), and
`weight = received + selfW`, so under a matched total the selfed share is
`rate/(1+rate)` **independently of how that total is distributed**. The measured
0.667 at every q is that arithmetic confirmed. Five minutes of algebra replaced
four arms and a sweep.

The weak form of C10 — "does a selfing arm self at all" — passed that mutant
happily. _A control asserting a property with no upper edge cannot catch a scale
error._ C10 now asserts the invariant, and the negative-control file carries the
case that isolates it.

**Negative controls: 10/10.** Every deliberately violated premise is detected and
named, and the untouched input still passes.

**Mutation testing: 7/7 killed, 0 survived**, including `no-cmatch-rescale` — the
mutant that escaped the first time — now killed by two independent tests.

## Limitations

- **One population size, one rate, one cost.** N0 = 30, rate 2.0, cost 0. The
  q = 0.85 inversion is measured at that point in parameter space only.
- **`round(q·n)` at n = 30 is coarse.** Nominal 0.25/0.69/0.85 realise as
  0.267/0.700/0.867. Realised values are what the tables report.
- **The dose curve's convexity is five point estimates.** It is consistent with
  LOTTERY and inconsistent with a linear KILL, but the interval-backed claim is
  the single below-anchor contrast, not the curve.
- **Random vs residual is not resolved** — the matched-coverage contrast includes
  zero. Separating them needs more seeds or a wider coverage grid.
- **`motheredTotal` and HELD disagree at the primary dose** and the disagreement
  is unresolved by design.
- **The k = 1 section is collider-conditioned** and cannot bear weight.
- The founding step drops the same **11 of 120 seeds in every arm** (placement
  failures, treatment-blind — verified by re-running founding across all ten arm
  configurations), so n = 109 and pairing is intact.

## What ships

- `docs/data/2026-09-06-selfing-cover.json.gz` — the full 872-replicate archive,
  8 cells, verified to decompress byte-identically to the merged sweep.
- `experiments/selfing-cover.js` — the analysis, committed before the data existed.
- `experiments/selfing-cover-negctl.js` — 10 negative controls over that analysis.
