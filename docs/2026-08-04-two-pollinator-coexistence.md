# A second pollinator does not rescue coexistence (roadmap B/C)

**Date:** 2026-08-04 · **Code:** `sim/ibm.js`, `experiments/two-pollinator-coexistence.js`

Secondary contact found that two lineages founded far enough apart do not fuse — one is **lost
outright**, in every seed, and not by drift. The reasoning was that once two groups stop exchanging
genes they stop competing for _mates_ and start competing for _offspring slots_.

**That is a prediction about the world, and the world disagrees.** Orchid communities plainly contain
coexisting congeners. So either the mechanism is wrong or something outside the model permits
coexistence — and the model had one obvious candidate it had never been given: **more than one
pollinator**.

The argument was specific enough to be worth testing. Under one animal, two isolated lineages play
zero-sum, because there is a single pool of visits to divide. Under two animals with different body
plans, a lineage placing pollen where animal A carries it is not obviously taking anything from a
lineage placing on animal B. Coexistence would then need no new mechanism at all — just a second axis
for the competition to spread across.

## The result

```
  separation d = 8 (the exclusion separation)
    arm                              final ancVar   HELD / FUSED / lost
    one animal (reference)             0.000       0 / 0 / 5
    two IDENTICAL animals              0.000       0 / 0 / 5      <- control: machinery only
    two DIFFERENT animals              0.000       0 / 0 / 5
    two DIFFERENT + random mating      0.000       0 / 5 / 0      <- null
```

**It does not work.** One lineage is still lost in every seed with two animals of very different body
plan. No stalls and no unmated mothers anywhere, so these are real outcomes.

The random-mating null fuses at 5/5, as it has in every run — confirming once more that the exclusion
is placement-mediated rather than demographic.

At the fusion separation (d = 2) every arm fuses, so nothing here changed the model's behaviour
generally; the d = 8 result is not a side effect of the extension.

## Why the controls make this readable

**Two bouts is not two pollinators.** Summing two bouts changes the sampling even when the animals are
identical, so the decisive control is **two identical animals** — same number of bouts, same split
budget, same summation, no new geometry. It loses a lineage 5/5, exactly like one animal. Whatever the
two-different arm did or did not do, it was not the machinery.

**The visit budget is split, not duplicated.** Giving each animal a full budget would have meant the
two-pollinator arm also received twice the pollination, and "two pollinators permit coexistence" would
have been indistinguishable from "more visits permit coexistence".

**And the animals really do differ.** This is the inertness gate, and it passes by a wide margin: the
same plants placed pollen **11.910 apart** on BEE*A versus BEE_B, against a **0.111** floor measured
from two \_identical* animals drawing their contact sites independently — **106.9×**. The floor is
measured here rather than assumed, because two identical animals still sample independently and a
naive "they differ" check would have counted that as signal.

The single-animal path is bit-identical to `ef7180d` across 45 fields, and the exclusion result it
exists to explain reproduces at full size (one lost 5/5) before anything is varied.

## What this leaves

The discrepancy with real orchid communities **stands and sharpens**: it is not pollinator number.

The leading remaining candidate is not biology at all but a **modelling assumption**, and it should be
named plainly: **population size is fixed.** Every generation the IBM fills exactly _N_ offspring
slots, so two reproductively isolated lineages are forced into a zero-sum contest for them — the
competition is built into the demography, not derived from the pollination. In nature two species
each have their own regulation, and there is no reason one must lose a slot for the other to gain one.

That makes the exclusion result a statement about **constant-size populations** rather than about
placement, and it is testable: let total population size follow total seed set instead of being
pinned, so a lineage that sets fewer seeds shrinks rather than surrendering slots to its competitor.
⚠️ It has to be done carefully — giving each lineage its own quota would simply _assume_ coexistence,
which is the failure mode this project has hit before.

The other candidate is spatial structure at the scale of populations rather than patches, which the
model also does not have.

## ⚠️ Two process errors worth recording

**I reported a running job as dead, twice.** `kill -0` on a wrapper PID and `pgrep -f <pattern>`
both lied — the second because the pattern matches the grep's own command line. The second time I
relaunched on that basis and briefly had **two copies of the same experiment running**, which is the
duplicate-pipeline failure the pre-launch check exists to prevent. What actually resolves it is
reading `/proc/<pid>/fd/1` to see which process owns the log file.
