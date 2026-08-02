# The deferred decision, taken — and it costs most of the evolved advantage

**Date:** 2026-08-02 · **Code:** `sim/evolve.js` (L1 arm), `experiments/v1.js` · Roadmap item D's
open modelling choice.

## The decision

**In a world where placement _is_ the gene, what is precision?**

Precision is how repeatable a species' placement is. In the **L2** arm it is free — it falls out of
geometry, so a tight tube produces repeatable placement, precision varies across species, and a
mutated shape inherits a new precision automatically. In the **L1** control, placement is handed over
directly as a gene, so precision is not derived from anything and must be assigned.

It was assigned as a single **median** value given to every L1 species, permanently
(`experiments/v1.js`). Meanwhile the ablation's L1 had been upgraded during the head-cap work to draw
`(sSd, phiSd)` pairs from the real pool's distribution. **The same control arm was held to two
different standards in two experiments, and v1's was the weaker one.**

**Decided: precision is a second heritable gene, bounded by what real morphologies achieve.** L1 may
be as precise as the tightest real flower and no more. Granting direct genetic control of _where_
pollen goes while withholding control of _how tightly_ is an arbitrary handicap, and this project's
claim rests on L1 being a steelman. The bound matters: unbounded precision would let L1 shrink its
footprint to nothing and pack unlimited species, which is not a fact about placement dimensionality.

Measured range from the real pool: `s sd 0.0077–0.0670`, `phi sd 0.0788–0.9655 rad` (the old fixed
median was 0.0443 / 0.4235).

**Implementation note.** The two loci L1 now reads for precision (`throatR`, `curve`) were previously
**inert for that arm** — L1 reads only `antherT`. So genome construction and mutation are untouched
and L2's results cannot move. The 65-test suite is the regression guard, and L2 indeed comes out at
8.3 exactly as before.

## ⚠️ The result: the evolved 2-D advantage collapses

```
  arm   surviving species (3 replicates)   mean
  L0        1   1   1                      1.0
  L1        6   8   6                      6.7     (was 2.7)
  L2        8   7  10                      8.3     (unchanged)
```

**The 2-D advantage under evolution falls from 3.07× to 1.24×.**

That number is measured/measured and does not depend on any ceiling constant, so it is not affected
by the caveat below. A steelmanned L1 — one allowed to evolve its own precision within real
biological limits — very nearly matches morphology-derived 2-D placement inside the evolution loop.

## ⚠️ Two consequences that must not be buried

**1. L1's ceiling constant is now stale, and its "reached %" column is meaningless.** `CEIL.L1 = 6`
was computed when L1's precision was drawn from the pool's distribution. With precision heritable,
evolution drives it to the tight end, and tighter placements pack more — so L1 now reports 111% of
its own ceiling. That is the bound being wrong, not L1 beating a real limit. It is precisely the
standing constraint this project already adopted: _a ceiling arm must be checked against the measured
arm every time it is used, and if the measured arm can beat the bound, the bound is a lower bound
wearing the wrong label._ It fired again, on the arm I had just changed.

**2. The same objection now applies to the ablation's headline 3.0×.** In the ablation, L1's
candidate pool draws precision from the real distribution — a mix, mostly near median — while the
optimiser is free to pick any _placement_. If precision is a gene, the optimiser should be able to
pick candidates at the **best** precision too, and it currently cannot. The ablation's L1 is now the
weaker steelman, and there is no principled reason to steelman the loop but not the optimiser.

**So the project's headline result is provisionally in question.** The static 3.0× has not been
re-measured under evolvable precision, and this loop result suggests it may fall substantially. That
should be settled before the 3× figure is quoted anywhere else.

## What this does not change

L0 still collapses to 1 species, so placement is still doing the work — the negative control holds.
Survivors in every arm still reach zero pairwise overlap. The mechanism results (carryover, reward
currency, presentation cost, dispersal unit) do not depend on the L1/L2 contrast at all.

And the decision is the right one regardless of which way the number moved. A control that can be
beaten only because it was handicapped tells you nothing; this one can now lose honestly.

## Part 2 — the ablation, re-run: the metric cannot answer the question

Following the recommendation above, the static ablation gained an `L1-free, EVOLVED precision` arm:
every candidate at the pool's tightest precision on each axis, since an optimiser free to pick
candidates would pick the tightest ones.

```
  arm                                 pool   t=0.05  t=0.1  t=0.2  t=0.3  t=0.5
  L1-free, drawn precision             234      9     10     12     18     35
  L1-free, EVOLVED prec [SATURATED]    234     21     21     21     21     21
  L2 (from morphology)                 309     24     25     36     54    118
```

At τ=0.2 that is 36/21 = **1.71×**, down from 3.00×. **But it is not a measurement.**

⚠️ **The evolved row is flat at 21 across every τ**, which no real geometric limit produces. The
packing metric is a **24-bin histogram** over the body, bin width **0.0556** in s units, while the
evolved precision is **0.0109** — five times finer than one bin. The built-in check now probes it
directly, and the test has to go in the *fine* direction:

```
  ceiling at sSd 0.0109 = 21; at HALF that (0.0054, finer) = 21.   IDENTICAL
```

Making the placement twice as precise buys **nothing**. The metric has bottomed out, so 21 is a
**floor imposed by binning, not a ceiling imposed by geometry.** The true L1-evolved ceiling is ≥21
and unknown.

**Therefore 1.71× is an upper bound on the advantage, not its value** — the true advantage is ≤1.71×
and could be far less, and the bias runs in the direction that flatters L2.

_(The first version of this check doubled `sSd` rather than halving it and reported "resolves".
Doubling moves out of the saturated zone, so that test could only ever pass.)_

## The root cause is one this project has already named

The bin width was implicitly calibrated to the *median* precision (0.044, comparable to the 0.056
bin). Change the precision assumption and the metric is no longer fit for the quantity it is
measuring. That is exactly the standing constraint adopted after the carry-cap artefact: **a constant
calibrated under one regime must be re-checked by any sweep that varies that regime.** It has now
fired twice.

## Where this leaves the headline

Both routes agree in direction and neither pins the number:

- **evolution loop:** 3.07× → **1.24×** (measured, ceiling-independent, trustworthy)
- **static ablation:** 3.00× → **≤1.71×** (upper bound only; metric saturated)

**The 3× headline does not survive steelmanning the control.** What the true figure is cannot be
stated at current resolution.

## Next

1. **Re-baseline the packing metric at finer resolution.** This is now the blocking job. It moves
   every packing number in the project and breaks the pinned golden tests (`tests/head-cap.test.js`
   pins an overlap of `0.170000` and the histogram resolution), so it is a deliberate re-baseline
   with test updates, not a tweak.
2. Recompute L1's τ→0 ceiling on that grid, so v1's "reached %" column means something again.
3. Only then restate the headline, in every place it appears.
