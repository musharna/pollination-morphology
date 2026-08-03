# Four checks before v1

**Date:** 2026-08-01 · **Code:** `experiments/checks.js` · Run before the evolution loop was
written, because each could change its design and all four were nearly free.

> ⚠️ **SUPERSEDED IN PART, 2026-08-03.** Every number here was measured on the retired histogram
> metric and at unmatched pool sizes. Re-based in
> [the checks re-baseline](2026-08-03-checks-rebaseline.md), which is the current source. Three
> conclusions hold; what moved:
>
> - **§1's "unlooked-for finding" is RETRACTED** — it named the wrong organ. See below.
> - **§2's body-plan modulation was ~1.5×, is ~1.2×**; the range is 2.06–2.47×, not 2.1–3.0×.
> - **§1's 60° survivor is gone** — all three thetas are noise, which strengthens the conclusion.
> - §3 and §4's conclusions are unchanged.

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

> ⛔ **RETRACTED 2026-08-03. This was inferred from overlaps that printed as `0.000`, never
> measured.** Measured, the stigma contacts 81% of visits at separation 0.270, and contact is
> non-monotonic. The overlap collapse there is the two organs touching at _different places_ —
> herkogamy working — not contact loss. A hard bound does exist, but it acts on the **anther**, which
> retreats out of the visitor's reach past ~0.4. Wrong organ, wrong threshold, wrong mechanism.
> [detail](2026-08-03-checks-rebaseline.md)

## 2. Other pollinator body plans — **holds everywhere, 2.1–3.0×; compact plans gain most**

> ⚠️ **Re-based 2026-08-03 to 2.06–2.47× at a common N = 337.** These pools differ in size (153–309)
> and the ratio depends strongly on pool size, so the spread below is mostly a data-quantity
> artefact. The Limits section's dismissal — "no ceiling appeared pool-limited" — is falsified.

Re-run 2026-08-01 after the head-cap fix. Each body plan now gets its own cap extent (r0/bodyLen
differs per animal) and the steelman draws precision pairs from that plan's own pool.

```
  body plan          pool (rejected)   s sd     L1-free   L2    ratio
  default bee         309 ( 91)       0.0436       12    36    3.00x
  small slender       153 (247)       0.0540       10    26    2.60x
  large robust        219 (181)       0.0325       18    37    2.06x
  long slender        185 (215)       0.0307       13    28    2.15x
```

_As originally run: 3.33 / 3.57 / 2.45 / 2.27, range 2.3–3.6×._

The 2-D advantage is not a fact about one bee — it clears 2× on every plan. It is **modulated by
body plan** in a way that makes mechanical sense: a long or large body gives the 1-D arm more room
to spread along (L1-free rises 12 → 18 on the large robust plan), so the marginal value of the
second dimension falls.

> ⚠️ **One sub-claim did not survive the re-run.** The original read "small animals gain most",
> on the strength of small slender leading at 3.57×. It no longer leads — the default bee does, at
> 3.00× against small slender's 2.60×. What survives is the coarser pattern: the two compact plans
> sit above the two elongated/large ones. The specific ordering that produced the original phrasing
> was not robust to fixing the coordinate edge, and "small animals gain most" should not be quoted.

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
  anther placement    pool 309   L1-free 12   L2  36   3.00x
  stigma placement    pool 285   L1-free 12   L2  32   2.67x
```

_As originally run: 3.33× and 3.00×._

No separate treatment needed. One transfer routine serves both organs.

## What v1 inherits

- **Symmetric transfer.** No directional matrix.
- **One routine for both organs.**
- **Precision as a modifier**, not a packing dimension.
- **Pollinator body plan is a real parameter** — it moves the ceiling by ~1.5× across plausible
  animals, which supports treating body plans as the columns of the combinatorial table rather than
  as set dressing. ⚠️ **~1.2×, not ~1.5×** — see the 2026-08-03 re-baseline. Still a real parameter,
  but a weaker one.
- **Herkogamy is bounded**, not traded off: past a threshold the stigma stops contacting entirely.

## Limits

τ remains a stand-in for reproductive isolation rather than a measured transfer rate. Pools differ
in size across body plans (153–309), and while no ceiling appeared pool-limited, the small-bee arm
had the least headroom. Check 1's 60° result is one survivor from three thetas and should not be
treated as a positive finding without a proper multiple-comparison correction.

> ⚠️ **Both limits resolved 2026-08-03, in opposite directions.** The pool-size caveat was correctly
> spotted and **wrongly dismissed** — every arm is pool-limited at these sizes, and matching N cut
> the body-plan spread by more than half. The 60° caveat was right: that survivor does not exist on
> the continuous metric, so no multiple-comparison correction is needed.
