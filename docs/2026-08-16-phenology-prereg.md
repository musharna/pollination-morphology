# Pre-registration: flowering time, an assortment axis independent of placement

**Written before any run.** Registered 2026-08-16 against master `0adb892`.

## Why this axis

Roadmap `:536` has named it since the mechanism list was written: temporal
assortment by flowering time is _"an assortment axis genuinely independent of
placement"_. Every other candidate acted on **where pollen lands** or on **what
the animal wants to visit**. Two plants that never flower together cannot
exchange pollen whatever their shapes are.

It is also the textbook allochronic-speciation mechanism rather than something
invented for this model, and nothing in `sim/` implemented it (verified by grep,
2026-08-16: no phenology anywhere).

## The mechanism

A heritable bloom allele on a ring; each plant is in flower for `width` of the
season around it; the season runs as `slices` successive bouts and a plant not
in flower has an **abundance of zero** in that slice.

⚠️ **No new bout mechanism.** `runBout` has always taken abundance as an
argument, so the season is a sequence of ordinary bouts with a time-varying
abundance vector — the same "separate bouts, summed" convention two pollinators
already use. Nothing inside the bout knows what time it is.

⚠️ **The visit budget is split across slices, not duplicated**, or "temporal
assortment helps" would be indistinguishable from "more visits help".

⚠️ **The cost, stated:** the animal starts each slice with an empty body, so
pollen does not carry between slices. Between days that is right; within one
continuous bout it is a real loss of carryover. It applies equally to every arm
including the controls, which is why the baseline cell below also runs sliced.

## Predictions (registered) — and I expect the primary one to be NULL

**H-free (the expected outcome):** with free recombination, a narrow season
**sorts flowering times without sorting shapes**. HELD is unchanged from
baseline.

The mechanism for that null is specific and worth stating in advance, because a
null with no mechanism is just a failure: an unlinked bloom allele is torn away
from whatever placement allele it arose beside **within one generation**. The
season can therefore assort the population by _when it flowers_ while the
placement genes shuffle straight through the temporal barrier. Assortment on an
axis that is genuinely independent of placement is assortment that **cannot
transmit to placement**.

That is the informative result if it holds, and it is a prediction rather than
an excuse: the run measures whether the SEASON itself split (bloom bimodality)
separately from whether the SHAPES did. "The season split and the shapes did
not" is a much stronger statement than "nothing happened".

**H-link:** with the supergene arm (`link`), where the bloom locus
co-segregates with the three anther loci, HELD rises **without FUSED rising**.

- **Refuted** if HELD does not move in the linked arm.
- **Refuted as a speciation mechanism** if HELD and FUSED rise together.
- ⚠️ **Discounted, and it must be said plainly if it happens:** the linked arm
  builds the association it needs. If it works, the finding is _"placement
  divergence is available IF a flowering-time allele is already linked to the
  anther loci"_ — a conditional, and the condition is doing much of the work.
  It is not evidence that phenology creates the association from nothing.

## ⚠️ The baseline is a WIDE season, not phenology switched off

A `phenology: null` baseline would differ from the treatment in the sliced-bout
structure, the carryover loss and the random draws as well as in the mechanism.
The baseline is therefore `width: 1.0` — every plant in flower in every slice —
which keeps every one of those identical and removes only the assortment.

## ⚠️ Positive control: the assortment must be OBSERVED

`bloomAssort` — mean bloom-time distance between donor and recipient weighted by
grains delivered, over the same quantity across all pairs. It must fall below 1
in the narrow arms and sit at 1 in the wide baseline. **If it does not separate,
the run reports NO RESULT rather than a negative**, because a window wide enough
that everything overlaps everything leaves the arms differing in a parameter and
in nothing else.

## ⚠️ Negative control

The random-mating null on the linked arm. Any HELD rise that survives severing
placement from parentage is drift and demography, not the mechanism.

## Registered analysis

- `K = 40` seeds per cell, fixed in advance, paired across cells.
- Fate by the shared `I.fateOf` predicate, not a new one.
- Differences by paired bootstrap over seeds, reported with intervals.
- Bloom bimodality reported separately from placement fate, so "the season split
  but the shapes did not" is visible rather than collapsed into a null.
