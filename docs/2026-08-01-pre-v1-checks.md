# Four checks before v1

**Date:** 2026-08-01 · **Code:** `experiments/checks.js` · Run before the evolution loop was
written, because each could change its design and all four were nearly free.

## 1. Is isolation reciprocal? — **No directional isolation; symmetric within noise**

A species' anther and stigma move together, but sit at _different depths_ — herkogamy — which is the
only thing in the model that could make pollen flow one way and not back.

```
   B theta     A->B     B->A     asymmetry
       0deg  0.537    0.537    0.000     <- control: identical species must agree, and do
      30deg  0.350    0.371    0.021
      60deg  0.183    0.192    0.008
      90deg  0.025    0.037    0.012
     120deg+ 0.000    0.000    0.000
```

Every measurable pair had B→A > A→B, which looked systematic. **It is not.** Re-running across
seven independent seeds:

```
    30deg  mean +0.0065  range [-0.033, 0.037]  5/7 positive   <- SIGN FLIPS
    45deg  mean +0.0226  range [-0.017, 0.079]  6/7 positive   <- SIGN FLIPS
    60deg  mean +0.0232  range [ 0.000, 0.050]  7/7 positive
```

The consistent sign in the first table was one shared seed appearing twice. Only 60° survives, at a
mean of 0.023 against overlaps near 0.19, from one of three thetas tested — too weak to build on.

⚠️ **Two harness faults caught here, both of which would have produced a confident wrong answer.**
The first version probed herkogamy at θ=90°, where wide separations drive _both_ directions to
exactly zero; the asymmetry then reads 0.000 for a **floor effect** and is indistinguishable from
real symmetry. Floored pairs are now flagged rather than counted. The second was the shared seed.

**Design consequence:** v1 can carry a symmetric overlap. No directed transfer matrix needed.

**Unlooked-for finding:** herkogamy past ~0.15 in depth separation drives stigma contact to **zero
outright** — the stigma stops touching the animal at all. Herkogamy has a hard ceiling set by the
visitor's body, not a smooth trade-off.

## 2. Other pollinator body plans — **holds everywhere, 2.3–3.6×, and small animals gain most**

```
  body plan          pool (rejected)   s sd     L1-free   L2    ratio
  default bee         309 ( 91)       0.0412        9    30    3.33x
  small slender       153 (247)       0.0520        7    25    3.57x
  large robust        219 (181)       0.0275       11    27    2.45x
  long slender        185 (215)       0.0298       11    25    2.27x
```

The 2-D advantage is not a fact about one bee. But it is **modulated by body plan**, and in a way
that makes mechanical sense: a long body gives the 1-D arm more room to spread along (L1-free rises
9 → 11), so the marginal value of the second dimension falls. **The second placement dimension is
worth most on small, compact pollinators.**

Also visible: rejection rates swing from 23% to 62%. Small-bodied visitors are far harder for a
flower to touch at all, which is a selective pressure the evolution loop will feel.

## 3. Can precision alone isolate? — **No. Precision is a modifier, not a niche axis**

24 species with _identical_ anther position, differing only in polarity, giving circular spreads
from 0.11 to 0.91 rad:

```
   tau    precision-only   position-only [POSITIVE CONTROL]
   0.05             1                3
   0.1              1                3
   0.2              1                4
   0.3              2                4
   0.5              3                7
```

At any realistic isolation threshold, **species differing only in repeatability cannot coexist** —
a tight distribution sits inside a broad one, and a nested pair overlaps almost completely. The
positive control in the same units rules out an inert harness.

**Design consequence:** precision sharpens position-based isolation but must not be treated as an
independent packing dimension in v1. This narrows Armbruster's two axes to one _isolating_ axis
plus one modifier, which is a stronger claim than the framework itself makes.

## 4. Stigma-side placement — **same machinery, same answer**

```
  anther placement    pool 309   L1-free  9   L2  30   3.33x
  stigma placement    pool 285   L1-free  9   L2  27   3.00x
```

No separate treatment needed. One transfer routine serves both organs.

## What v1 inherits

- **Symmetric transfer.** No directional matrix.
- **One routine for both organs.**
- **Precision as a modifier**, not a packing dimension.
- **Pollinator body plan is a real parameter** — it moves the ceiling by ~1.5× across plausible
  animals, which supports treating body plans as the columns of the combinatorial table rather than
  as set dressing.
- **Herkogamy is bounded**, not traded off: past a threshold the stigma stops contacting entirely.

## Limits

τ remains a stand-in for reproductive isolation rather than a measured transfer rate. Pools differ
in size across body plans (153–309), and while no ceiling appeared pool-limited, the small-bee arm
had the least headroom. Check 1's 60° result is one survivor from three thetas and should not be
treated as a positive finding without a proper multiple-comparison correction.
