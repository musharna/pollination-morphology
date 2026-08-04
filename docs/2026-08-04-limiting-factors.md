# A second limiting factor does not permit coexistence either — and the exponent says why (roadmap B/C)

**Date:** 2026-08-04 · **Code:** `sim/ibm.js`, `experiments/limiting-factors.js`

## This run exists because an earlier control was too good

The two-pollinator run asked whether a second animal lets two lineages coexist past the exclusion
separation, and answered no. Its central control was that the visit budget is **split** between the
animals, so "two pollinators permit coexistence" could not be confused with "more visits permit
coexistence". That control was right for the question as asked — **and it also guaranteed the answer.**

Splitting one budget keeps **one limiting factor**. The animals divide a single pool of visits, so
both lineages still compete for the same resource however different their pollinators are, and
competitive exclusion follows from a single limiting factor almost by definition (Levin 1970: _n_
coexisting types need _n_ limiting factors). Two animals become two limiting factors only with
**independent budgets** — which reintroduces exactly the confound the split removed, and is therefore
only interpretable beside a **one-animal double-budget** arm carrying the same total visits.

## The result

```
  d = 8, per-capita cross-pollen receipt of B relative to A

   frequency of B          0.10     0.25     0.50     0.75     0.90    log-slope
   two animals, SPLIT     0.205    0.571    0.967    1.849    4.651      3.46
   two animals, INDEP.    0.213    0.574    0.971    1.847    4.616      3.42
   ONE animal, DOUBLE     0.216    0.581    0.977    1.793    4.751      3.41
   CONTROL (one lineage)  1.018    0.992    0.978    0.942    0.946     -0.10
```

```
    arm                                       HELD / FUSED / one lost / BOTH LOST
    1. one animal, base budget  (reference)     0 / 0 / 5 / 0
    2. two animals, SPLIT budget    (1 factor)  0 / 0 / 5 / 0
    3. two animals, INDEPENDENT     (2 factors) 0 / 0 / 5 / 0
    4. ONE animal, DOUBLE budget    (1 factor)  0 / 0 / 5 / 0
    null: arm 3 + random mating                 0 / 5 / 0 / 0
```

**Nothing moves.** Independent budgets deliver almost exactly twice the pollen (103,738 against
51,985, measured) and the _absolute_ per-capita receipt duly doubles — 2,419 → 4,837 at f=0.1 — but
the **ratio between the lineages is untouched**, to within a percent, at every frequency. Every arm
loses a lineage 5/5, the double-budget control included, so it is not about volume. The null still
fuses.

## ⚠️ The exponent is the useful number

If the frequency dependence were nothing but **mate availability** — a plant's receipt simply
proportional to how many compatible partners it has — then the ratio would equal the odds `f/(1-f)`
exactly. It does not, and the departure is measurable. Fitting the ratio against the odds:

```
   receipt ratio  ≈  (own-frequency odds) ^ 0.70
```

consistently, at both tails and in **all three service regimes** (0.72/0.70 split, 0.70/0.70
independent, 0.70/0.71 double). An exponent of 0 would be no frequency dependence and 1 would be pure
partner-counting; **0.70 is mostly partner-counting**, softened by carryover, which delivers some
conspecific pollen to a rare plant that pure counting would not.

That exponent is a property of **mate-finding**, not of pollinator provisioning — which is why
tripling the ways of supplying visits leaves it unchanged. Partners are not a resource a pollinator
can deliver: they are the other lineage members, and a rare lineage has few by definition.

**So a second limiting factor was never available by this route.** You cannot manufacture one by
adding a pollinator or a budget, because the factor actually limiting a rare lineage is compatible
mates, and mate availability is not partitionable between animals.

## ⚠️ On the control's residual column

The run also prints a "mate-availability residual" (ratio ÷ odds; 1 = pure partner-counting). For the
real arms it reads 1.85 / 1.57 / 0.97 / 0.56 / 0.52 — symmetric about 1, the sub-proportionality
above. **For the control it reads 9.16 / 2.73 / 0.98 / 0.29 / 0.11, and that is correct rather than a
failure:** one lineage wearing two labels has receipt independent of label frequency, so the residual
is forced to `(1-f)/f`, which is 9 at f=0.1. It confirms the control has _no_ frequency dependence at
all. The verdict gates on the ratio's slope (−0.10, flat), not on this column.

## What this leaves

The pollinator route is closed for any mechanism that leaves mate-finding conformist — it inherits the
sign no matter how many animals, budgets, or offspring slots are added. Across the arc:

| tried                                | result                                      |
| ------------------------------------ | ------------------------------------------- |
| six mechanism classes                | no rare-morph advantage on placement        |
| deception (NFD on signal)            | splits the **advertisement**, not the plant |
| two pollinators, split budget        | one lineage lost 5/5                        |
| fixed population size lifted         | one lineage lost 5/5                        |
| two pollinators, independent budgets | one lineage lost 5/5                        |

What would actually change the sign is **rare-biased visit allocation** strong enough to beat an
exponent of 0.70 — an animal that preferentially visits the rarer morph. That is precisely what
deception was recruited to supply, and it acted on the advertisement axis instead. ⚠️ Note the bar is
now quantitative rather than rhetorical: a candidate mechanism has to move the exponent, and the
exponent is cheap to measure, so future mechanisms can be screened in single bouts before anyone
spends 35 generations on them.

## ⚠️ A surviving mutant caught two worthless tests

The first version of the test file measured delivered pollen with a helper that **reimplemented the
budget rule**. A deliberate mutant making `step()` ignore the flag entirely left both tests using it
green — they were exercising the reimplementation, not the model. Only the one test asserting against
the model's own output caught it.

Rewritten to read `history[].totalSeed` — the model's own sum of received pollen, which exists because
density dependence needed it — the same mutant now fails 3 tests instead of 1. The surviving mutant
was the coverage report, and the lesson is narrow enough to state exactly: **a test that recomputes
the behaviour under test is testing the recomputation.**
