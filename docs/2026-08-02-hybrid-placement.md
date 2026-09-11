# Is placement inheritance blending? — and what a hybrid actually pays

**Date:** 2026-08-02 · **Code:** `experiments/hybrid-placement.js` · Roadmap item B, second step.

Blending inheritance is the classic enemy of speciation: if a hybrid sits halfway between its
parents, gene flow drags diverging morphs back together and divergence cannot persist without
assortative mating. That argument assumes the trait under selection is inherited additively.

**Here it might not have been.** Genes are shape; placement is _computed_ from shape by the contact
model, and that map is geometric and nonlinear. A hybrid inheriting intermediate shape need not have
intermediate placement — it could land outside both parents, where nothing matches it. If so,
geometry-derived placement would generate stronger isolation than a placement gene ever could, and
the ablation's ecological result (L2 out-packs L1) would have a genetic counterpart.

That was the hypothesis. It is **mostly wrong**, and the part that survives is more interesting than
the part that doesn't.

## The statistics, and the control that licenses them

On the body metric that actually decides whether two plants exchange pollen:

- **detour** = (d(h,p₁) + d(h,p₂)) / d(p₁,p₂) — 1.0 means the hybrid sits exactly on the segment
  between its parents; >1 means it is off-axis.
- **nearest** = min(d(h,p₁), d(h,p₂)) / d(p₁,p₂) — 0.5 is a true midpoint, ~0 means it snaps onto
  one parent.
- **outside** — fraction further from _both_ parents than they are from each other.

⚠️ The **L1 arm is the control, not a comparison**: where placement itself is the gene, an additive
hybrid is the arithmetic midpoint and _must_ score 1.00 / 0.50 / 0%. It does. A statistic that
cannot report blending where blending is guaranteed could not be trusted to report its absence.

## A. Placement inheritance is approximately blending

```
  cross                          detour   nearest   outside
  L1 additive (control)            1.00      0.50        0%     n=188
  L1 free recombination            1.02      0.02        0%     n=188
  ---
  free recombination               1.17      0.26        2%     n=123
  additive blending                1.01      0.45        0%     n=140
```

**Additive inheritance of shape produces almost perfectly blending placement** (detour 1.01, nearest
0.45) — indistinguishable from the L1 control. The nonlinearity of the shape→placement map does
_not_ rescue divergence from blending. Free recombination does somewhat better (detour 1.17, and
nearest 0.26 rather than 0.45, so whole-gene inheritance pulls hybrids toward one parent), but
transgressive hybrids are **rare at 2%**.

The hypothesis that geometry-derived placement is strongly non-blending is refuted. The classic
problem applies to this model with full force.

## ⚠️ C. But hybrids still pay — and the control took a quarter of the effect away

A hybrid mating badly among its parents is not yet evidence of a matching cost: it may simply be a
worse flower. So every hybrid is measured twice — rare among the two parental morphs, and common
among clones of itself, where mismatch is impossible by construction. Only the ratio is a matching
effect.

```
  hybrid / parent mating success     median   mean +/- 95% CI    SUPERSEDED (z)
  rare among both parent morphs       0.812   0.751 +/- 0.091  ->  0.751 +/- 0.093
  among clones of itself (control)    0.949   0.960 +/- 0.040  ->  0.960 +/- 0.041
  NET matching effect (ratio)         0.879   0.809 +/- 0.101  ->  0.809 +/- 0.103   n=58
                                              ^^^^^^^^^^^^^^^      ^^^^^^^^^^^^^^^
                                              as published (z)     corrected t(df=57)
```

⚠️ **The middle column is the superseded z estimator; the right-hand column is current.**
Both are shown rather than the old one deleted, because this document's subject is
measurement, and see the correction note below.

Hybrids **are** slightly worse flowers — the clonal arm sits at 0.960, so about 6 of the 25 raw
percentage points were intrinsic quality rather than placement. ⚠️ That deduction is the weakest
number here and its interval contains 1.0 — see [Limits](#limits). Removing it, the net cost is
**19.1%, interval ~~[0.708, 0.910]~~ → corrected `[0.706, 0.912]`, excluding 1.0 under either
estimator**.

> ⚠️ **CORRECTION 2026-09-10 (release 1.0).** The three intervals above are
> normal-approximation (z) intervals, the same estimator the v2 correction was written to
> retire; at n = 58 the correct critical value is t(df = 57) = 2.002, which is 2.2% wider.
> The corrected intervals are `0.751 ± 0.093`, `0.960 ± 0.041` and **`0.809 ± 0.103`, i.e.
> [0.706, 0.912]**. The headline is unaffected — the net effect still excludes 1.0 — but the
> clonal control is not, see [Limits](#limits). Corrected by exact rescale
> (`h_t = h_z · t/z`) from the published half-widths, which needs no re-run.

**Geometry alone imposes a hybrid mating cost, with no genetic incompatibility of any kind.** The
isolation comes from where the pollen lands: an intermediate placement matches neither parental
morph well, which is underdominance arising from frequency dependence rather than from transgression.

## What this means for roadmap B

The two results pull in opposite directions and together they name the next mechanism precisely:

- placement inheritance **blends**, so gene flow will erode divergence — geometry does not solve
  speciation on its own;
- but hybrids **pay ~19%**, so selection against them is real and reinforcement has something to act
  on.

That is the textbook setup for **assortative mating to be favoured**, and it is the next thing to
build: without it, blending wins; with it, the hybrid cost measured here is what pays for it. Roadmap
B's order (recombination → assortative mating → hybrids) is unchanged, but it now rests on a measured
hybrid disadvantage rather than an assumed one.

## Limits

Hybrids are F1 only — no backcrossing, no segregation across generations, so this measures the
immediate cost of one cross rather than the fate of a hybrid zone. The genome is haploid-style
parameters, so "additive blending" is a stand-in for many small additive loci rather than a diploid
model with dominance.

Parent pairs are required to be ≥ 2.0 body units apart, which is a substantial separation; hybrids
between nearer parents will pay less, and the 19% figure should not be read as a constant. n = 58
pairs in part C, and the clonal control is the weakest number here — the split between intrinsic
quality and matching rests on it.

> ⚠️ **CORRECTED 2026-09-10 (release 1.0).** This paragraph previously read "the clonal
> control's own interval (0.960 ± 0.040) only just excludes 1.0". **It does not exclude 1.0,
> and did not under the published estimator either** — as printed, `0.960 + 0.040 = 1.000`
> lands exactly on the null, so the claim was never supported by its own numbers. Under the
> correct t(df = 57) the interval is `0.960 ± 0.041 = [0.919, 1.001]`, which contains 1.0
> outright. The right reading is that **the clonal control cannot distinguish hybrids from
> their own clones at this sample size**, so the 6-point intrinsic-quality deduction is an
> estimate without a resolvable interval, not a measured non-unity. The NET matching effect
> is unaffected: it excludes 1.0 under both estimators. This is the same defect class the v2
> document was written to record — a boundary verdict resting on the narrower estimator —
> found here by the release-1.0 inventory rather than by reading.

Populations are 21 plants and one bout per measurement. Mating success is summed over both sex roles
with selfing excluded.
