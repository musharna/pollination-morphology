# The advantage is a scaling law, not a multiplier — and the control was under-resourced

**Date:** 2026-08-02 · **Code:** `experiments/ablation.js`, `experiments/pool-scaling.js`,
`experiments/precision-audit.js`, `experiments/head-exposure.js` · Follows
[the continuous-metric re-baseline](2026-08-02-continuous-metric-rebaseline.md).

## What this started as

Re-basing the last two headline-bearing diagnostics off the retired histogram metric. It turned into
something larger, because `precision-audit.js` reported a ratio that could not be right.

## The tell

`precision-audit.js` re-runs the 1-D steelman at the precision of the species L2 actually selected.
Its steelman scored **10** at tau = 0.2 while the ablation's scored **16** — despite being handed
_tighter_ blobs and _more_ candidates. A control cannot be strictly better-equipped and strictly
worse unless something is wrong with how it is built.

Three things were, and all three ran the same way — toward the control:

1. **The steelman was confined to a smaller animal.** Its centres spread over `s in [0, 1]` while
   L2's placements run from the head cap at `S_LO` to the tail. `ablation.js` had been corrected for
   exactly this; this file never was. Worth 9 -> 10 on its own.
2. **The overlap metric was the saturating histogram** — and this file deliberately re-runs the
   steelman at _tight_ precision, which is precisely where it saturates.
3. **⚠️ It repeated the error `ablation.js` had already fixed:** every candidate got the _median_ of
   the selected species' spread rather than their distribution.

## Precision heterogeneity is worth most of a doubling

```
  homogeneous @ selected median (0.0415, 0.2243)  ->  10
  homogeneous @ pool median     (0.0436, 0.4614)  ->  10
  HETEROGENEOUS, drawn pairs from the pool        ->  18
```

A packer offered candidates of differing spread can **cherry-pick the tight ones**; a uniform pool
gives it nothing to choose between, so its ceiling is just span / spacing. This is the same lesson
`packing.js` already carries — "matched precision, properly" — arriving in a second file.

With all three corrected, precision-audit's ratio at tau = 0.2 falls **3.90x -> 1.50x**.

## ⚠️ Which exposed the real problem: the arms were never given the same number of candidates

The fixed pool-limit check no longer flattens. It climbs — so the steelman had been **pool-limited
all along**, and the ablation hands it `scaled(200)` = 234 candidates while L2 draws on 309 species
and CTRL-2D-ideal on 3760.

**A ratio taken across mismatched pools is two points on two different curves.** Measured at matched
N, at tau = 0.2:

```
  morphologies   pool N   L1-free   L2    ratio
           400      309        19   40    2.11x
           800      608        20   52    2.60x
          1600     1209        21   65    3.10x
          3200     2381        25   77    3.08x
```

**Neither arm is saturated in absolute terms** — each doubling of the candidate pool buys the 1-D arm
roughly +1 to +4 species and the 2-D arm a steady +12 or +13. **But the RATIO is not unbounded: it
climbs from 2.11x and levels off near 3.1x**, and the last two points (3.10, 3.08) are flat within
the resolution of a randomised-greedy packer that only ever reports a lower bound.

## The finding

**The advantage depends on pool size, and the ablation's own pool understates it.** At the 309
species the ablation samples, 2-D out-packs a precision-matched 1-D control **2.11x**; give both arms
a large enough candidate set and it settles at about **3.1x**. A 1-D placement axis runs out of line
— there are only so many distinguishable positions along a body at a given precision — so it gains
almost nothing from a bigger pool, while a 2-D surface keeps finding room until the ratio stabilises.

That explains a long-running annoyance: **"the ratio" has moved every single time this project
re-measured it** — 3.3x, 3.0x, 2.7x, 2.5x, 1.24x. Some of that was genuine correction, but part was
simply that the ratio is not a constant at small pools, so each measurement reported wherever its
pool size happened to sit — and the two arms were not even at the same one. **A quoted ratio must
name its pool size.**

## What the ablation looks like with every arm matched

```
  arm                            pool  t=0.05  t=0.1  t=0.2  t=0.3  t=0.5
  L0 (no placement)               309       1      1      1      1      1
  L1-strict (roll discarded)      309       7      8      9     10     17
  L1-free, drawn precision        309      11     12     19     24     48
  L1-free, EVOLVED precision      309      24     28     35     42     66
  L2 (from morphology)            309      24     31     40     58    124
  CTRL-2D-ideal [CEILING]         310      33     43     62     87    170
```

Two things fall out beyond the headline:

- **CTRL-2D-ideal is a valid ceiling again, and a meaningful one.** L2 reaches **65%** of the ideal
  placement surface at matched N, against 33% when the "ideal" arm was quietly handed twelve times
  the candidates. Both are true statements about different questions; only one is a comparison.
- The run went from **1461s to 60s**, because the ideal arm's 3760 candidates were most of the cost.

## Also re-based, and it survives

`head-exposure.js` on the continuous metric: **the s = 0 coordinate edge is still not what the 2-D
advantage is made of.** 38.5% of morphologies touch the boundary, and dropping every one of them
moves the L2/L1 ratio by an amount whose 95% interval spans zero at all five tolerances.

```
    tau    mean delta        95% CI            excludes 0?
   0.05   +0.092      [-0.322, +0.506]            no
    0.1   +0.322      [-0.242, +0.886]            no
    0.2   +0.154      [-0.374, +0.682]            no
    0.3   -0.152      [-0.677, +0.373]            no
    0.5   +0.039      [-0.434, +0.512]            no
```

## The pattern worth keeping

Every correction in this pass and the last one moved the same direction: **toward the control.** The
metric flattered L2, the candidate counts flattered L2, the domain flattered L2, the homogeneous
steelman flattered L2. None was deliberate and each looked reasonable in isolation. The shared cause
is that a control is built once and then inherited, while the measured arm keeps being improved — so
handicaps accumulate on the side nobody is actively working on.

**The check that catches it is cheap:** when a control is beaten, ask whether it was given the same
budget — same surface, same candidate count, same precision distribution, same metric resolution —
before believing the result. Here the tell was a control that was strictly better-equipped and
strictly worse.
