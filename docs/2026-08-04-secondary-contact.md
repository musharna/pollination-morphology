# No separation maintains divergence — and the failure changes character (roadmap B)

**Date:** 2026-08-04 · **Code:** `sim/ibm.js`, `experiments/secondary-contact.js`

Seven mechanisms have now been tested against roadmap B's barrier and none of them moves placement.
Deception, the last candidate with a documented rare-morph advantage, turned out to diversify the
_advertisement_ and not the plant. So the roadmap's own standing alternative — written down after the
fifth failure — is no longer a fallback but the front-runner:

> "NOTHING in this model pushes a rare placement past parity, and placement divergence needs DRIFT
> plus the measured 19.1% HYBRID COST rather than a rare-morph advantage."

**That is a different question from the one already answered.** Every run so far asked whether a
split can _arise_. This asks whether one _persists_ once it exists. Origin and maintenance are
different problems, and a negative on the first says nothing about the second.

The IBM is the right tool because it already contains the hybrid cost **natively** — hybrids inherit
shape additively, land between their parents, and are charged for mismatch by the transfer matrix
itself. Nothing is imposed.

## ⚠️ Three outcomes look identical, and only one statistic separates them

"The split went away" can be **fusion** (they interbred), **extinction** (drift removed a lineage —
nothing fused), or the split can simply **hold**. Placement separation cannot tell the first two
apart and they are opposite mechanisms. So a neutral ancestry tracer is carried: it is not on a
haplotype, decides nothing, and draws no random numbers (verified bit-identical to `c5267d1`).

That decision turned out to be load-bearing. **Every arm below ends at ancestry variance 0.000.**
Without the tracer, fusion and extinction are the same row.

## The result

```
  PART A — placement decides mating          PART B — random-mating null
  target d   final ancVar   fate             target d   final ancVar   fate
    0.5         0.000       FUSED 5/5          0.5         0.000       FUSED 5/5
    1           0.000       FUSED 5/5          1           0.000       FUSED 5/5
    2           0.000       FUSED 5/5          2           0.000       FUSED 5/5
    4           0.000       FUSED 5/5          4           0.000       FUSED 5/5
    8           0.000       ONE LOST 5/5       8           0.000       FUSED 5/5
```

No stalls and no unmated mothers in any cell, so these are real outcomes rather than frozen runs.

**Nothing holds at any separation.** But the failure is not one failure:

- **Below d≈4 the lineages interbreed and fuse**, exactly as the null does.
- **At d=8 they do not fuse at all.** They are too far apart to exchange pollen, and one lineage is
  **lost outright in every seed** — while the null at the _same_ separation fuses. Same demography,
  same drift, same N, same mutation, differing only in whether mating depends on placement. **The
  exclusion is caused by the geometry.**

### It is not drift

```
   d      N=16        N=30        N=60
   2    FUSED 5/5   FUSED 5/5   FUSED 5/5
   8    lost 5/5    lost 5/5    lost 5/5
```

The lineage is still lost at the largest population size tested. Small-population noise was never the
explanation.

### The hybrid cost is separation-dependent, which is why it cannot rescue anything

The IBM's own additive F1, measured at each separation (net matching effect, 1.0 = no cost):

```
   d      0.5     1       2       4       8
        1.018   0.997   1.105   1.109   0.268
```

Essentially no cost across the whole range where the lineages are close enough to interbreed, and a
73% cost only at the separation where they have already stopped exchanging genes. **The force assumed
to maintain a split is absent exactly where it would be needed and arrives only when it is
irrelevant.**

## What it means

**Reproductive isolation does not protect a lineage here.** Once two groups stop exchanging genes
they stop competing for _mates_ and compete for _offspring slots_ instead — and one is excluded.

That completes a picture three experiments in the making. Placement-mediated mating erases a minority
whether it **arises** (seven mechanisms, none past the barrier), is **imposed** (2026-08-03: fecundity
selection toward two reachable placements _contracted_ the population, spread 0.73 against a null's
1.97), or is **founded** (here). And when it cannot erase it by gene flow, it erases it by
competitive exclusion. It is positively frequency-dependent at every scale tested.

## ⚠️ The tension this creates, which is the interesting part

Sympatric _Platanthera_ diverged in placement far enough to move pollen from proboscis to cheek and
still shares a gene pool — that is the fusion regime, and it is **consistent**.

But the model now also predicts that a pair pushed past the exclusion separation should end with **one
member lost rather than two coexisting** — and orchid communities plainly do contain coexisting
congeners. Something outside this model must permit that. The obvious candidate is the thing roadmap C
already measures: **more than one pollinator**. Two lineages competing for the same offspring slots
under one animal is a zero-sum game; under two animals it need not be.

## ⚠️ The anchor gate stopped this run three times, and was right every time

1. **The wrong frequency.** The first hybrid-cost anchor measured intermediates one generation after a
   50/50 founding and read **−18.7%** — hybrids doing _better_. The source document says the cost is
   "underdominance arising from **frequency dependence**", and the 19.1% is defined for a hybrid
   **rare among two parental morphs**. After free mating the intermediates are the _majority_ at the
   modal placement, where this model's stabilising selection favours them. Inverting the frequency
   condition inverted the sign.
2. **The wrong construction.** Corrected to one hybrid among 10+10 parentals it read 1.145 ± 0.252 and
   still found nothing. The published pairs are two **independent** genomes; mine were a genome and
   its own **mutant**, sharing almost everything. The published hybrid is a **recombinant**; mine was
   an additive F1.
3. **The wrong sample size.** Rebuilt as the published construction at n=12 it read 0.877 ± 0.305 — a
   point estimate on top of the published 0.809 with an interval three times too wide to exclude 1.
   Underpowered, not contradictory. Matched to the published `makePairs(41, 60, 2.0)` it reads
   **0.628 ± 0.121, upper 0.749** — a reproduction in kind (the published interval was [0.708, 0.910];
   mine overlaps only at the edge, likely from 160-site flowers against their 140).

The gate is now split: **2a** is the published construction and is the only thing gated on, because it
proves the measurement can detect a cost known to be there; **2b** is the IBM's own F1 and is reported
rather than gated, because whatever it reads is an input to the result rather than a check on the
harness. That distinction is what turned a blocked run into the separation-dependence finding above.

⚠️ **And the verdict block itself was wrong once**: it printed "EVERYTHING FUSES" over a run whose
widest separation did not fuse at all. Fusion and exclusion are opposite mechanisms and the tracer
exists to tell them apart, so the summary now reads the tracer instead of assuming the common case.
