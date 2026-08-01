# The head-tip boundary — diagnosed, fixed, and what it cost

**Date:** 2026-08-01 · **Code:** `sim/placement.js` (forward cap), `sim/packing.js` (binning),
`experiments/head-boundary.js`, `experiments/head-exposure.js`, `tests/head-cap.test.js` ·
Roadmap item D.

`contactSite` finds the point on the body **closest** to an organ by sweeping the spine over
s ∈ [0,1]. The sweep stops dead at s=0, so an organ sitting deeper in the tube than the head can
reach has its nearest spine point pinned at s=0 no matter where it actually is — every such
morphology collapses onto one coordinate. Four of the nine species v1 evolved sat exactly there.

This mattered because **s is the only axis the L1 arms are allowed to use.** If a whole class of
morphologies were unresolvable in s but still resolvable in φ, the coordinate edge would be
manufacturing part of the headline rather than reporting it.

## The diagnosis, and the hypothesis that died

Three hypotheses, one probe (`experiments/head-boundary.js`):

|        | claim                                                                                                                         | verdict       |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **H1** | cap-less coordinate edge: organs ahead of the head pin at s=0 by construction                                                 | **confirmed** |
| **H2** | φ is computed from a perpendicular that vanishes near the body axis, so the roll separating pinned species is numerical noise | **refuted**   |
| **H3** | no artefact — the face is reachable by every geometry, so selection genuinely piles species there                             | not needed    |

H1 is exact. The pin tracks "organ deeper than the head reached" perfectly: 0.000 for every unpinned
species, 0.65–1.00 for every pinned one.

**H2 was mine and it was wrong, which is the useful part.** I predicted `perp = w − (w·fwd)fwd`
would vanish for forward organs, making φ noise. It measures 0.87–0.99 — nowhere near vanishing.
The geometry I had in my head was wrong: the organ is ahead in _axial depth_, but tube curvature,
`antherProject` and the body's own lift all push it off the axis. φ is consequently well conditioned
(sd 0.010–0.091 rad under re-drawn wobble, inside the 0.007–0.092 range of unpinned species). The
roll separating those four species is real.

The probe duplicates the spine sweep so `sim/` stayed untouched while being measured, and
self-checks against the real function on every site — 1108 of 1108 agreed, so the numbers describe
the model rather than the copy.

## Exposure, and why the obvious test was the wrong one

Counting stigma as well as anther contacts, **38.5% of sampled morphologies touch the boundary**
across six independent pools. Dropping every one of them and re-measuring gave, paired by pool:

| τ       | mean Δ in the L2/L1 ratio | 95% CI               |
| ------- | ------------------------- | -------------------- |
| 0.05    | −0.352                    | [−0.776, +0.072]     |
| 0.1     | −0.021                    | [−0.341, +0.299]     |
| **0.2** | **−0.266**                | **[−1.063, +0.530]** |
| 0.3     | −0.505                    | [−1.173, +0.163]     |
| 0.5     | −0.688                    | [−1.273, −0.103]     |

Unresolvable at the headline tolerance. But **drop-the-pinned is a proxy for the wrong
intervention** — deleting those species removes their contribution to _both_ arms, while the actual
fix re-resolves them, handing L1 resolution across 38.5% of the pool and leaving L2 alone. That
asymmetry is invisible to a drop test, so the fix itself had to be the measurement.

## The fix: relabel, don't re-geometry

The contact **test** was already right. For a capsule whose spine ends in a hemisphere of radius r0,
surface distance is d − r0 — and `bodyRadius(bee, 0)` is exactly r0, so the clearance computed was
already the cap's. Only the **label** was degenerate.

So a contact in unit direction u from the spine end is relabelled onto the cap at
s = −r0·(u·fwd)/L. A point directly ahead still maps to the front pole, but that is a real geometric
pole with measure-zero degeneracy — like a globe's — rather than a cutoff pinning a third of the
pool. The mechanism is removed, not moved.

Binning gained six bins ahead of the spine end **at the same width**, so s ≥ 0 binning is a pure
index shift and every species that never touches the cap keeps a numerically identical histogram.
Without that the fix would have silently moved every number in the project and the before/after
comparison would have been worthless. `tests/head-cap.test.js` pins it.

⚠️ Contact counts are pinned as regression values (108 and 200 for the two probe flowers) precisely
because the fix must not change whether anything is touched. They did not move.

## A second defect the fix exposed: the ceiling was not a ceiling

With the cap in, **L2 exceeded the CTRL-2D-ideal "ceiling"** at two tolerances. A ceiling the
measured arm beats is not a ceiling.

Density was part of it — the grid was under-resolved in φ — but not the cause. The cause is that
`packing.js` states the rule "precision must be MATCHED across arms or the comparison is rigged",
and the implementation matched only the **median**. Real precision is strongly heterogeneous:

```
  s sd    p05 0.0270  med 0.0436  p95 0.0591
  phi sd  p05 0.1208  med 0.4614  p95 0.8451 rad
  species tighter than median on BOTH axes: 71 of 309
```

A quarter of the real pool is individually sharper than any blob in the "ideal" arm, so L2 could
beat it. The synthetic arms now draw (s sd, φ sd) **pairs** from the pool's own distribution — the
project's stated rule, fully implemented rather than approximated by its midpoint.

The packer was also undercounting: 200 restarts returned 21 at τ=0.05 where 2000 restarts returned
21–23 across seeds. Raised to 600 restarts × best-of-3 seeds, applied identically to every arm.

## What moved

| quantity                             | before       | after              |
| ------------------------------------ | ------------ | ------------------ |
| ablation τ=0.2, L2 vs steelman       | 3.33× (30/9) | **3.00×** (36/12)  |
| ablation τ=0.2, L2 vs L1-strict      | 5.0× (30/6)  | **4.5×** (36/8)    |
| τ→0 ceiling, L2 / L1-free            | 14 / 5       | **16 / 6**         |
| v1 evolved species (L2)              | 9            | **8.3** (8, 7, 10) |
| v1 % of achievable ceiling           | 64%          | **52%**            |
| v1 2-D advantage, evolved            | 2.7×         | **3.07×**          |
| L2 against the ideal 2-D ceiling     | 88%          | **39%**            |
| check 2, advantage over 4 body plans | 2.3–3.6×     | **2.1–3.0×**       |
| check 4, stigma-side advantage       | 3.00×        | **2.67×**          |

**The headline survives.** 2-D placement supports about three times the species a 1-D gene does,
and the fix moved it from 3.33× to 3.00× — the same claim, measured on a surface without an
arbitrary edge in it. L1-strict gained most in relative terms (6 → 8, +33%), which is exactly what
should happen if the boundary had been costing the 1-D arm resolution: the fix helped the arm it was
hurting.

**One conclusion is materially rewritten.** L2 was reported at 88% of the ideal 2-D ceiling; that
comparison was against a control built at median precision and it is now **39%**. Real morphology
leaves far more of the placement surface unexploited than the old number implied — a more
interesting result than the one it replaces, and one that only appeared because the control was
fixed. v1's "% of the achievable ceiling" falls from 64% to 52% for the same reason.

⚠️ **And one sub-claim was falsified outright.** Check 2 originally read "the 2-D advantage is
largest for small compact pollinators", on the strength of the small-slender plan leading at 3.57×.
After the fix it does not lead — the default bee does, 3.00× against 2.60×. The advantage still
clears 2× on all four plans and compact plans still sit above elongated ones, but the specific
ordering that produced that sentence was not robust, and it should not be quoted.

## Limits, and one open modelling question

The τ=0.5 row of the drop test excluded zero and the other four did not; five correlated tolerances
were tested, so that is roughly what chance produces. It is not treated as a finding.

⚠️ **v1's L1 arm still hands every species the median precision** (`sim/evolve.js`, `ctx.sSd` /
`ctx.phiSd`), while L2 species inherit heterogeneous precision from their own morphology. That is
the same asymmetry corrected in the ablation, but inside the evolution loop it is a **modelling
choice rather than a bug**: in the L1 arm placement is the gene and precision is not heritable,
whereas in L2 precision emerges from zygomorphy, which is. Making L1's precision heritable would
give it a second evolvable axis and change what the arm means. Left deliberately unchanged and
flagged rather than quietly switched — it deserves a decision, not a default.
