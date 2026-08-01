# The L1-vs-L2 ablation — result

**Date:** 2026-08-01 · **Code:** `sim/packing.js`, `experiments/ablation.js`,
`experiments/precision-audit.js` · **Predictions:** groundwork §4.4, written before this ran.

This is the delete-the-grid test for the project. It ran **before** the evolution loop was built,
because if a 1-D placement gene matches 3-D-derived placement, the geometry is decoration and v1
should not be written.

## What was measured

How many species can coexist on **one shared pollinator**, where coexistence requires pairwise
placement overlap ≤ τ. That count is the **packing ceiling**.

Five arms, one overlap metric, one packing algorithm, identical restart counts — an arm can differ
only in the geometry of the placement space, never in how it is scored.

| Arm               | Placement space                     | Role                    |
| ----------------- | ----------------------------------- | ----------------------- |
| **L0**            | none — undifferentiated encounters  | the standard ABM        |
| **L1-strict**     | L2's own placements, roll discarded | direction forced        |
| **L1-free**       | free 1-D gene, whole body length    | **steelman, can win**   |
| **L2**            | 2-D, derived from real morphology   | the project             |
| **CTRL-2D-ideal** | free 2-D gene, whole body surface   | ceiling / positive ctrl |

## Result

```
morphologies sampled : 400   rejected (contact < 0.5): 91 (22.8%)   viable pool: 309
matched precision (median of L2): s sd 0.0412, phi sd 0.4614 rad
reachable body bins  : 269 of 360 (74.7%), 15 of 18 along the body

arm                             pool  t=0.05   t=0.1   t=0.2   t=0.3   t=0.5
L0 (no placement)                 60       1       1       1       1       1
L1-strict (roll discarded)       309       5       5       6       7      10
L1-free (1-D gene) [STEELMAN]    200       6       7       9      10      16
L2 (from morphology)             309      18      22      30      45     100
CTRL-2D-ideal [CEILING]          560      18      23      34      51     101
```

**L2 out-packs the best 1-D arm by 3.0–4.5× at every threshold.** The §4.4 packing prediction is
confirmed on its geometric leg, with margin.

## Reading the arms honestly

**L2 ≥ L1-strict is forced, not found.** Marginalising a joint histogram cannot lower min-sum
overlap — that is a theorem about projection. Only the _magnitude_ is informative there, and the
informative fact is that it is large: discarding roll costs L2 two thirds of its ceiling, so roll is
carrying real information rather than being a nominal third axis.

**L1-free is the real comparison and it could have won.** It is handed the whole body as a free gene
at precision matched to L2's own, while L2 can only reach what its morphology space produces. It
lost 3×.

**L0 = 1 at every τ, measured rather than asserted.** Two species with equal match scores must
exchange pollen. This is the gap the field names in its own words (Mailly & Lihoreau 2025: models
"assume random pollen movements").

## The confound I expected, and what the audit found

The synthetic arms were matched to the **median** L2 spread. If the packer preferentially selected
unusually tight L2 species, L2 would win on precision rather than dimensionality and the headline
would be an artefact of the matching.

It does select roll-tight species — φ sd 0.21–0.24 against a pool median of 0.46. But re-running the
steelman at the **exact selected precision** moves it not at all:

```
  tau   L1-free@selected   L2   ratio
  0.05                 6   18   3.00x
  0.1                  7   22   3.14x
  0.2                  9   30   3.33x
  0.3                 10   45   4.50x
```

Roll precision is worth nothing to an arm that has no roll to spend. That is the mechanism, not a
bias. The steelman is also **saturated, not pool-limited** — 50/100/200/400/800 candidates give
ceilings 8/8/9/9/9.

## The genuine surprise

**L2 sits at 88–100% of the free-2-D ideal** (18/18, 22/23, 30/34, 45/51). I expected the morphology
space to reach only a thin ribbon of the animal — a few roll angles near the tube's dorsal line —
which would have made the third dimension nominal. It reaches **74.7% of the body surface**. Flower
shape is a nearly-surjective map onto placement, not a narrow one.

The magnitude is also mechanistically sensible rather than inflated: at φ sd ≈ 0.22 the body
circumference supports roughly 3–5 distinguishable roll slots, and the observed advantage is
3.0–4.5×. The win is exactly "2-D multiplies by the number of resolvable roll positions," which is
what it should be if nothing is broken.

## Harness controls

`tests/packing.test.js`, 8 tests. The load-bearing one: **an ideal 2-D surface must out-pack an ideal
1-D axis at matched precision.** An inert harness returns "no difference between arms", which reads
exactly like "the third dimension is decorative" — the conclusion this experiment is meant to be able
to reach honestly. Also a negative control (identical species pack to exactly 1), a disjoint positive
control, τ-monotonicity, determinism, spread recovery, and an empirical check of the projection
theorem asserted in `packing.js`'s own comment.

## ⬜ What this does NOT establish

The §4.4 prediction had **two** legs. The geometric leg is confirmed. The empirical leg is not:

> "…and real Stanhopeinae richness on shared euglossine pollinators sits above the L1 ceiling."

**That number is not in hand.** The figure recorded in the enumeration doc — 15 sympatric _Euglossa_
(Zimmermann, Ramírez & Eltz 2009) — is **bee** richness, a different quantity. What is needed is
orchid species per _shared_ pollinator species, to compare against the L1 ceiling of ~9 at τ=0.2.

Checked: two OpenAlex sweeps on euglossine pollinator-sharing, 2026-08-01. Both came back thin. That
is a **qualified** null over one registry, not a world null. Named place to look next: **Ackerman,
Phillips, Tremblay, Karremans & Reiter 2023**, `10.1093/botlinnean/boac082` — a global orchid
reproductive-biology database, >2900 species, pollinator identity tabulated. Closed access; needs a
real retrieval rather than a search.

Until that lands, the claim is **"L2 out-packs L1 in this model"**, not **"real richness exceeds what
1-D placement can support."** The second is the one that is about the world.

Other limits: τ is a stand-in for reproductive isolation, not a measured transfer rate — overlap
still ignores carryover, packaging efficiency and last-male advantage. The 22.8% contact-rate
rejection selects for flowers that touch the animal; the precision audit shows the survivors sit at
the pool median for along-body spread, so it is not smuggling in a precision advantage, but it does
mean the pool is "flowers that work" rather than all morphologies.

## Verdict

**The 3-D contact model earns its place.** A free 1-D placement gene — the standard model, and the
cheap version of this project — reaches roughly a third of the coexistence ceiling that
morphology-derived 2-D placement reaches, at matched precision, with the pool saturated on both
sides. The delete-the-grid test is **passed**, and v1 (the evolution loop) is worth building.

The remaining exposure is empirical, not architectural.
