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
what anchor 3 exists to rule out — it does: the regulated population averages 28.5 at d=8, ranges
7–45, and is **at the ceiling 0.0% of the time**.

## The result

```
  separation d = 8 (the exclusion separation)
    regime                                     mean N   final N   HELD / FUSED / lost / BOTH LOST
    fixed N, constant TOTAL service              30.0     30.0      0 / 0 / 5 / 0    <- the published model
    regulated N, constant TOTAL service          28.5     25.8      0 / 0 / 5 / 0    <- the lift
    fixed N, constant PER-PLANT service          30.0     30.0      0 / 0 / 5 / 0
    regulated N, constant PER-PLANT service      44.0     21.8      0 / 0 / 2 / 3    <- no regulation at all

  separation d = 2 (the fusion regime)
    fixed N, constant TOTAL service              30.0     30.0      0 / 5 / 0 / 0
    regulated N, constant TOTAL service          29.8     36.0      0 / 5 / 0 / 0
    fixed N, constant PER-PLANT service          30.0     30.0      0 / 5 / 0 / 0
    regulated N, constant PER-PLANT service      31.6     14.6      0 / 2 / 0 / 3
```

**Lifting the assumption does not rescue coexistence.** Every viable regime loses a lineage 5/5 at
d=8 — including the one where population size genuinely tracks its own seed set and never touches its
ceiling. The random-mating null still fuses, so the exclusion is still the geometry. At d=2 everything
still fuses, so nothing here changed the model's general behaviour.

⚠️ **One cell of the 2×2 cannot be evaluated, and that is itself a finding.** Constant per-plant
service with regulated N died out in 3 of 5 seeds. It has no density regulation _at all_: seed set
scales with _n_, so per-capita growth is independent of density and the population is a critical
branching process that either wanders to extinction or pins to the ceiling (probed separately: 1 seed
in 3 extinct within 20 generations at replacement, pinned at K at 1.5× replacement). Removing the
fixed limiting factor removes the regulation with it. A regime whose population died is **not**
quieter agreement with the others — it never got to answer the question, and the verdict counts it
separately for that reason.

## ⚠️ Part C is the part that matters: exclusion is forced, not incidental

Running arms can only say _whether_ the assumption mattered. Ecology already has the criterion for
_why_ — **mutual invasibility**: two types coexist if each can increase when rare against the other
(Turelli 1978; Chesson 2000), which requires a **stabilising** niche difference, each type limiting
itself more than it limits the other.

Per-capita cross-pollen receipt, as a function of a lineage's own frequency, at d=8:

```
   frequency of B     0.10     0.25     0.50     0.75     0.90
   B relative to A   0.214    0.580    0.981    1.789    4.654
                    ±0.072   ±0.120   ±0.142   ±0.173   ±0.556
```

> ⚠️ **INTERVALS ARE TOO NARROW — qualifier added 2026-09-10 (release 1.0).** The `±` values
> above are normal-approximation (z) half-widths from a hand-rolled helper
> (`experiments/density-dependence.js:58`), and the sample is small: the runner averages over
> `SEEDS = [1,2,3,4,5]` with guards that can drop seeds, so **n ≤ 5**. At n = 5 the correct
> t(df = 4) critical value makes every interval **42% wider**; if seeds dropped it is wider
> still. **n was not recorded in this document, so the exact interval cannot be
> reconstructed** and is deliberately not re-stated here. What can be shown is a bound: at the
> worst admissible n = 3 the intervals become `0.214 ± 0.158`, `0.981 ± 0.312` and
> `4.654 ± 1.221` — and the rare end stays below 1.0, the common end stays above it, and the
> midpoint still spans it. **Every directional verdict below survives the correction at every
> admissible n**; only the precision was overstated.

**The sign is backwards.** A rare lineage does **worse**, not better — monotonically, across the whole
range. Neither lineage can increase when rare, so the invasibility criterion fails in both directions
and exclusion is forced.

Three details make this readable:

- **It is frequency dependence and not an intrinsic advantage.** At 50/50 the ratio is 0.981 — neither
  lineage is better. And the two ends are almost exactly reciprocal (1/0.214 = 4.67 against a measured
  4.654), which is what pure symmetric frequency dependence looks like.
- **The rare penalty is the same barrier this project has been circling.** 0.214 at 10% frequency sits
  on the same order as the rare/common ≈ 0.26 proxy that six of the eight mechanism tests were scored
  against — arrived at here from a completely different construction.
- **The control is flat.** The same measurement with **one lineage wearing both labels** — an exact
  null, since two labels on one lineage cannot differ in placement — reads 1.011 / 0.991 / 0.992 /
  0.947 / 0.997. The statistic is capable of reporting an absence of frequency dependence, so its
  reporting a presence means something.

⚠️ The first version of that control asked for a target separation of 0.05 instead and read 0.66. That
was the control's own fault, not a failure: the founding search **selects on realised placement**
(placement is not a gene, so a separation cannot be assigned) and cannot reach below d≈0.2, so the
"zero-separation" control was quietly running at a real separation.

## What this changes

**The constant was never the cause.** Because the frequency dependence has the wrong sign, _no_
demographic arrangement can produce coexistence here — the negative generalises past the specific fix
attempted, which is worth more than the fix would have been.

⚠️ **And it unifies the project's two open questions.** Coexistence needs a rare lineage to do better
than a common one. So does the origin of a split. They are the **same requirement**, and eight
mechanisms have now failed to supply it. The coexistence gap is not a second problem — it is the
first one seen from the far side.

That also sharpens what would count as progress. The missing ingredient is not demography, not
pollinator number, and not a bigger population: it is **negative** frequency dependence on placement,
or a genuinely second limiting factor. ⚠️ Note that the two-pollinator run could not have supplied the
latter: its visit budget was **split** from one pool — correctly, to control for total pollination —
which keeps a single limiting factor and therefore forces exclusion regardless of how different the
two animals are. Two pollinators become two limiting factors only with independent budgets, and
testing that needs a one-animal double-budget control to separate "two limiting factors" from "more
visits".

## ⚠️ The anchor gate stopped this run once, and the gate was wrong

Anchor 4 asks whether the harness can emit HELD at all — three of its four possible tags mean the
split went away, and a pipeline structurally unable to say HELD would report exclusion no matter what
the model did. It demanded HELD in **every** seed and failed at 4/5.

The gate was at fault, not the harness. Seed 5 genuinely loses a lineage inside three generations —
ancestry collapses to `{0}`, with no unmated mothers and no stalls. The strict predicate was really
asserting "no lineage is ever lost that fast", a claim about the **model** that happens to be false,
rather than the claim it exists to protect, which is that HELD is **reachable**. A guard whose scope
exceeds its claim cannot discriminate between what it is guarding against and ordinary behaviour.

It now gates on the actual claim and prints the tally instead of a tick, because "HELD 4, one lost 1"
is information — exclusion can complete inside three generations — and hiding it behind a pass would
have wasted it.

Also worth recording: ancestry at d=8 takes only the values 0 and 1, never 0.5. There are **no
hybrids at all** at that separation, which is the direct confirmation that the lineages are not
exchanging genes and the loss is competitive rather than introgressive.
