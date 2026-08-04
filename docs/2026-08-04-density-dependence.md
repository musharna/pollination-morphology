# Is the exclusion result an artefact of fixed population size? (roadmap B)

**Date:** 2026-08-04 · **Code:** `sim/ibm.js`, `experiments/density-dependence.js`

Secondary contact found that two lineages founded past d≈8 do not fuse — one is **lost outright**, in
every seed, and not by drift. A second pollinator did not rescue it. That leaves a prediction the
world contradicts, because orchid communities plainly contain coexisting congeners, and the
two-pollinator write-up named the leading suspect: **population size is fixed.**

## The assumption has a name, and naming it says what to do about it

Filling a constant number of offspring slots is **soft selection** (Wallace 1975): the recruit count
is a constant, so only _relative_ success can matter and one lineage's seed is by construction
another's loss. Letting the count follow total seed set is **hard selection**, where absolute fitness
matters and a population that sets fewer seeds _shrinks_ rather than surrendering slots to a
competitor.

The probe that motivated the run supports the premise: total cross-pollen delivered falls from
**72,009 grains** in a well-mixed population to **55,681** at d=8, a 23% drop. Placement mismatch
really does reduce total seed set, so there is something for absolute fitness to bite on.

## ⚠️ It is two assumptions, not one — and the obvious version of this run would have been inert

`visits` is **also** a constant total, shared out over however many plants exist, so per-plant service
is forced to scale as 1/n. With that left in place, total delivered pollen barely depends on _n_, so
the recruit count is nearly constant too: "population size follows seed set" would have pinned the
population at a different number and changed nothing. Lifting only the offspring-slot constant tests a
model that is still zero-sum through the pollinator.

So both constants are lifted, separately and together, as a 2×2:

|                 | constant TOTAL service   | constant PER-PLANT service |
| --------------- | ------------------------ | -------------------------- |
| **fixed N**     | the published model      | —                          |
| **regulated N** | recruits follow seed set | both lifted                |

## ⚠️ What is deliberately not done

Giving each lineage its own quota, or its own carrying capacity, would **assume** coexistence rather
than test it — the failure mode this project has hit before. The ceiling `K` is **shared**, and the
model is never told which lineage an individual belongs to: `anc` remains a neutral tracer that reads
nothing and decides nothing, which is asserted directly in the tests.

The fecundity constant is calibrated from a **single well-mixed lineage** — a different construction
from the two-lineage arms under test — and set to exact replacement there, because a constant
calibrated from the artifact under test encodes that artifact's behaviour. `K` is then placed well
_above_ the resulting equilibrium so that regulation comes from the pollen supply rather than from the
cap. A population sitting **on** its ceiling would be fixed-N wearing a different hat, and that is
what anchor 3 exists to rule out.
