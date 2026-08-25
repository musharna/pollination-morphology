# Pre-registration — does a narrow flowering season EVOLVE?

**Date:** 2026-08-25 · **Status:** registered, NOT run · **Model version:** `0638a70`
**Target:** the northstar at `ROADMAP.md:219` — _can a minority advantage be **derived** from
pollination rather than **imposed**?_

Nothing in this document has been measured. It is written before the locus exists so that the
bar for a positive cannot be set after seeing the sweep.

## Why this experiment

Seven route families have been tried. Six are spent. The seventh — temporal assortment (#37) —
is the project's only positive that survives its own controls: **+0.289 [0.158, 0.447]** under
free recombination, absent from the random-mating null, and not explained by the supergene or by
small mating pools.

⚠️ **But it does not answer the northstar, and the roadmap says so itself.** A narrow flowering
season is a number this model sets — `PH.width`, a single global constant at `sim/ibm.js:1194`
applied identically to every plant. That is as imposed as the BAL demographic subsidy already
ruled question-begging. The finding is that temporal assortment _reaches_ placement, not that
pollination ecology _produced_ it.

**This experiment makes flowering-window width a heritable per-plant locus and asks whether
narrow flowering arises on its own.** If it does, the one mechanism that works stops being an
assumption and becomes a result. That is the only move on the board that converts an imposed
parameter into a derived one.

## ⚠️⚠️ AN ARTEFACT FOUND WHILE DESIGNING THIS, BEFORE ANY RUN

The season is cut into `S` slices (`SLICES = 8`) with centres at `k/S`, and a plant is in flower
in slice `k` iff `ringDist(bloom, k/S) <= width/2` (`sim/ibm.js:1198`). Slice centres are
`0.125` apart. Enumerating the predicate over bloom-space:

```
  width 0.06    0 slices: 52.0%   1 slice: 48.0%
  width 0.10    0 slices: 20.0%   1 slice: 80.0%
  width 0.12    0 slices:  4.0%   1 slice: 96.0%   <- the published narrow arm
  width 0.125                     1 slice: 100%
  width 0.15                      1 slice:  80.0%   2 slices: 20.0%
  width 0.25                                        2 slices: 100%
  width 1.00                                        8 slices: 100%
```

Two consequences, both structural rather than biological:

1. **Below `width = 1/S` no plant is ever in two slices at once**, so the "season" is not a
   season — it is `S` disjoint mating bins. At the published `WIDTH = 0.12` this is already true
   for every plant.
2. **Below `width = 1/S` gaps open between coverage regions**, and a plant whose bloom falls in
   one catches zero slices and is reproductively invisible. At `WIDTH = 0.12` that is **4.0% of
   bloom-space**, by grid alignment alone.

✅ **This does NOT retract #37.** `shuffleBloom` permutes expressed schedules while holding the
multiset of bloom times fixed, so the grid structure — dead zone included — is **identical in
the shuffled and unshuffled arms**. HELD still collapses 0.289 → 0.000. Whatever the grid does,
it does equally to both, so it cannot be what produces the positive. The artefact is a caveat on
how the narrow arm should be _described_, not on whether the effect is real.

⚠️⚠️ **But it is decisive for THIS experiment, because width is the quantity that moves across
those thresholds.** A width locus left alone would climb a staircase whose steps are set by
`SLICES`. Any result of the form "width evolved to X" is uninterpretable until it is shown that
X is not a property of the grid.

## What changes in the code

A `WIDTH_GENE` locus alongside `BLOOM_GENE`, following the pattern already established at
`sim/ibm.js:316`:

- Diploid, expressed as the **plain mean** of `h1`/`h2` and clamped — width is a magnitude, not
  a circular coordinate, so it must NOT use `wrap01`/`meanRing` the way bloom does. A width that
  wraps would let 0.99 and 0.01 average to a narrow window, which is meaningless.
- Its **own rng stream**, and — non-negotiable, this is the discipline the bloom locus already
  follows — **guarded so that with the locus off not a single extra draw is taken from any
  stream**, and every published phenology number reproduces bit-for-bit. The guard is verified by
  a test that runs the existing phenology config with the locus off and asserts byte-identity,
  not by inspection.
- `sim/ibm.js:1194` changes from one global `half` to a per-plant `half_i`.

## Registered predictions

Stated now, before the locus exists.

**P1 — width evolves narrower than the wide baseline.** Direction only. The mechanism is that a
narrow plant mates within its own bin, and if bins correlate with lineage, its offspring are
less likely to be hybrids.

**P2 — and it stops.** Width does **not** collapse toward zero, because presence in fewer slices
buys fewer siring opportunities: the visit budget is **split** across slices, not duplicated
(`perSlice = per / S`, `sim/ibm.js:1195`), so a plant absent from a slice simply forgoes it.

⚠️ **P2 is the prediction I distrust most, and it is the one most likely to be an artefact.**
Under the current grid the cost of narrowing below `1/S` is dominated by the zero-slice dead
zone — 4% at 0.12, 20% at 0.10, 52% at 0.06 — which is discretisation, not biology. If width
settles just above `1/S = 0.125`, that is the grid talking, and P2 is **not** confirmed by it.

**P3 — the null.** With lineage shuffled relative to width (see controls), no directional change
in width.

## The bar for a positive, set now

A positive requires **all** of:

1. Evolved mean width is below the wide baseline, with a paired interval excluding zero, over
   n ≥ 8 seeds. Interval is **Student's t**, not a normal approximation — see the v2 correction
   for why that distinction is not cosmetic.
2. **S-invariance.** The same qualitative outcome at `S = 8`, `16` and `32` with the biology
   held fixed. ⚠️ **If the evolved width tracks `1/S`, the result is an artefact and is reported
   as one.** This is the single most important control in the design, and it is the one that
   would not have existed had the enumeration above not been run first.
3. The evolved narrow width **actually delivers assortment** — `bloomLineage` (not
   `bloomAssort`, which is blind to a permutation; see `sim/ibm.js:1276`) rises with it.
4. HELD rises relative to a fixed-wide-width control, i.e. the derived narrowing reproduces the
   imposed effect of #37.

Failing (2) while passing (1), (3) and (4) is a **negative** result reported as such, not a
positive with a caveat.

## Controls

- **Shuffled width** — permute expressed widths across plants each generation, preserving the
  multiset and destroying only the width-to-lineage tie. Same shape as the `shuffleBloom` control
  that carried #37. This is the confound arm.
- **Non-heritable width** — width drawn fresh each generation from the same distribution.
  Separates "narrow windows help" from "narrow windows are inherited".
- **Fixed-wide control** — `width = 1.0` held constant, the #37 baseline, so the derived result
  is comparable to the imposed one.
- **Locus-off byte-identity** — the rng guard above, as an executable test.

⚠️ Every arm must consume the **same number of draws** whether or not its mechanism is active:
draw unconditionally, apply conditionally. The v2 audit found the existing evolution loop
violating exactly this — `sim/evolve.js` draws inside loops over `live`, so arms desync as soon
as survivor counts differ (task #45, still open). That defect must not be reproduced here.

## Traps, named in advance

1. **Width → 0 wins trivially** if narrowness is free. It is not free here, but the cost that
   exists is partly a grid artefact — hence control (2).
2. **Selection toward grid alignment.** Blooms may be pulled toward slice centres, which is an
   `S`-periodic attractor with no biological referent. Worth measuring directly: the distribution
   of `ringDist(bloom, nearest centre)` against the uniform expectation.
3. **A positive that is really "fewer competitors".** A narrow plant shares its slice with fewer
   plants and takes a larger share of that slice's visits. If narrowing pays through reduced
   competition rather than through assortative mating, `bloomLineage` will not move — which is
   why (3) is a required condition and not a nice-to-have.
4. **Declaring victory on the mean.** Report the dispersion of evolved width, not only its
   centre. A bimodal outcome — some lineages narrow, some wide — is a different and more
   interesting result than a uniform shift, and a mean would hide it.

## What would falsify the northstar claim even on a positive

Width evolving narrow shows that _this model_ rewards temporal isolation. It does **not** show
that pollination ecology produces it, if the reward turns out to come from the visit-splitting
bookkeeping rather than from who mates with whom. Trap 3 is the discriminator, and it is the
reason this is registered as a test of a mechanism rather than of an outcome.
