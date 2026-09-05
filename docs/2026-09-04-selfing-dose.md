# #62 — the shape of the selfing floor relocates rescue without creating any

_2026-09-04. Registered in [the pre-registration](2026-09-04-selfing-dose-prereg.md)
before the sweep ran, with the analysis committed before the data existed. Two
new cells, N0 = 30, rate 2.0._

## The answer in one line

Making reproductive assurance proportional to a plant's own pollen load **lifts
what the lone minority plant mothers at k = 1 by roughly six-fold** — and changes
**nothing** about how long lineages persist, how much the minority reproduces
overall, or whether the two lineages coexist. At a matched total, shape moves the
rescue around. It does not make more of it.

## ⚠️ The result that matters most is about my own pre-registration

The registered primary returned **H1**, cleanly and by the rule fixed in advance:

| statistic (at k = 1)                       | flat    | dose      |
| ------------------------------------------ | ------- | --------- |
| mean `minMothered`                         | 0.580   | **3.427** |
| share of k=1 generations mothering nothing | 0.594   | **0.253** |
| k=1 generations / seeds                    | 69 / 45 | 75 / 40   |

Paired difference over the 18 seeds reaching k = 1 in both arms:
**+2.435 [1.028, 3.944]**, excluding zero. By the registered rule that is H1,
the rare-favouring hypothesis, confirmed.

**It is also conditioned on a state the treatment changes.** Reaching k = 1 is
downstream of the intervention — 45 seeds reach it under the flat floor and 40
under dose — so "among k = 1 generations" compares two differently-selected sets
of generations. That is the same class of error as #61's dwell bug, where
conditioning the successor row on `informative` conditioned on survival, the very
exit being counted.

So the same quantities were computed **unconditionally**, over every run with no
`k` filter at all (added after seeing the data, and labelled as such — it is a
validity check on the registered hypothesis, not a new one):

| per run, no `k` filter                       | flat    | dose    | paired difference             |
| -------------------------------------------- | ------- | ------- | ----------------------------- |
| generations with both lineages present       | 21.945  | 20.991  | −0.954 [−4.147, 2.183]        |
| **total offspring mothered by the minority** | 205.450 | 192.596 | **−12.853 [−47.927, 22.468]** |
| generations spent at k = 1                   | 0.633   | 0.688   | +0.055 [−0.220, 0.339]        |
| ever reached k = 1                           | 0.413   | 0.367   | −0.046 [−0.174, 0.073]        |
| **HELD (coexistence)**                       | 0.404   | 0.385   | **−0.018 [−0.138, 0.101]**    |
| the primary's estimand, uncollided           | 7.952   | 7.216   | **−0.736 [−1.495, 0.016]**    |

**Every one of them includes zero, and every point estimate leans negative.** The
six-fold conditional lift buys nothing that survives aggregation, and the
uncollided version of the primary's own estimand very nearly excludes zero on the
_wrong_ side.

> ⚠️ **THE TELL, AND IT IS NEW.** #61's lesson was that a pre-registered decision
> rule stops an attractive derivation winning by default. This one is the limit of
> that protection: **a pre-registered decision rule protects against reading the
> data wrong. It does not protect against registering the wrong estimand.** The
> rule here was fixed in both directions, it fired exactly as written, and it
> returned an answer that the unconditional data does not support — because what
> was registered was a comparison conditioned on a treatment-affected state. The
> rule was obeyed and the conclusion would still have been wrong.

The registered verdict is therefore reported as **H1 conditionally, H2
unconditionally**, with the unconditional reading carrying the weight.

## Why the gain does not aggregate — three mechanisms, one measured out

The total assurance is matched by construction, so a gain somewhere is paid for
somewhere. That is a derivation, and #61 is the standing reminder that a
derivation about what _must_ happen does not establish what did.

**M1 — zero-sum by construction.** True, and insufficient on its own: a fixed
total reallocated to where it is scarcer _could_ buy more. That is exactly what
H1 predicted would happen.

**M2 — dose-dependence abandons the plants with no self-pollen**, for whom the
flat floor is the only reproductive route. The pre-flight made this the obvious
candidate: a plant carrying exactly zero self-pollen is present in 677 of 1,050
generations. **Measured and REFUTED** — under dose only **4.3%** of plants receive
zero assurance (median 3.3%), and the loss falls evenly on both lineages
(minority 4.1%, majority 4.5%, n = 487 generations each). The abandoned class is
small and unbiased; it cannot pay for a six-fold lift.

**M3 — the assurance flows to plants that do not need it.** Self-pollen load
tracks total visitation: the pre-flight measured Spearman(selfReceived, received)
= **0.438**. Under the flat floor the assurance is uncorrelated with pollination
by construction; under dose it is correlated at 0.44, so most of the redistributed
weight goes to well-visited plants that would have reproduced by outcrossing
anyway. The lone minority plant is the conspicuous **exception** — she is heavily
self-pollinated precisely because she is heavily visited (4.587× per-capita) and
has no partner to receive from. Dose-dependence finds her, and it also finds
every well-pollinated majority plant, and there are far more of the latter.

That is the coherent reading of the whole result: **the rule locates the one plant
the floor exists for, and simultaneously hands most of the budget to plants that
were never at risk.**

## Controls

| id           | control                                            | result                                                               |
| ------------ | -------------------------------------------------- | -------------------------------------------------------------------- |
| **C-match**  | both arms spend the same total assurance           | **PASS** — identical at g=0 across 109 seeds, worst gap 1.0e−15      |
| **C-null**   | the default path is unchanged by the `ibm.js` edit | **PASS** — post-change re-run BYTE-IDENTICAL to pre-change, 805 rows |
| **C-anchor** | the fresh flat arm reproduces #58's archive        | **PASS** — 51,952 values over 3,815 rows, 0 disagreements            |
| **C10**      | both arms actually self                            | **PASS** — 66.8% of matings in _both_, identically                   |
| **C-seed**   | distinct seeds beside every count                  | reported throughout (45 / 40 seeds at k=1)                           |
| **C-base**   | no zero is read as a mechanism                     | did not fire — there is no zero to explain here                      |

C10 is worth pausing on: the two arms self at **exactly the same rate**, 66.8% of
matings each. Same amount of selfing, differently distributed — which is the
experiment the design was trying to run, confirmed on the shipped data rather
than assumed.

## What this does and does not say about the model

The flat floor **is** the wrong shape as a piece of biology — a plant drowning in
its own pollen and a plant carrying none should not receive identical assurance,
and the pre-flight showed the difference is large (within-generation CV 1.43, a
29.5× spread between the most- and least-selfed plant). #62 does not retract that.

What it says is that **fixing the shape does not change any outcome this project
measures.** The floor's job in #58–#61 was to give a partnerless plant non-zero
draw weight, and _any_ rule that does so is enough; making the amount track the
dose changes who benefits without changing the total, and the total is what the
coexistence result was ever sensitive to.

This is #60's finding arriving from a new direction. #60 separated survival from
recovery and found selfing buys the first and not the second. #62 separates the
_shape_ of the assurance from its _size_ and finds shape buys a much better
rescue at k = 1 and still not recovery.

## Limitations

1. **One rate, one N0, one premium setting.** Rate 2.0 at N0 = 30, inheriting
   #58's design. The dose arm was not swept.
2. **The registered primary is collider-conditioned** and is reported as such
   rather than dropped — the conditional effect is real and large, and it is not
   the estimand that answers the question.
3. **The paired k=1 difference rests on 18 shared seeds.** Wide interval, and
   "reaching k=1 in both arms" is itself a selected set.
4. **M3 is supported by a correlation (rho = 0.438) plus a refuted alternative,
   not by a direct intervention.** The clean test would ablate the correlation —
   assurance proportional to self-pollen _residualised_ on `received` — and was
   not run.
5. **P1 remains untested**, exactly as the pre-registration said it would.
   Dose-dependent selfing produces selfed seed, which keeps `anc` unaveraged, so
   this arm bypasses the averaging wall rather than probing it.
6. **The dose arm's apparent longer dwell at k=1** (75 generations over 40 seeds
   vs 69 over 45) is **not established**: the unconditional difference is
   +0.055 [−0.220, 0.339] and includes zero. It is not reported as a finding.
