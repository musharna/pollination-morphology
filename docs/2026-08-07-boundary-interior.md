# Boundary vs interior plants — 2026-08-07

**The rare-morph penalty inside a patch is a COMPOSITION effect. A rare plant and
a common plant in the same structural position do equally well; the rare patch is
penalised for being mostly boundary, not for being rare.**

Closes the item the patch-size run left open: _"measure boundary and interior
plants separately."_

## Why not just grow the ring

The patch-size run tried to settle this by growing the patch and returned
**±0.492** — an interval spanning penalty to advantage, reported as a failure to
measure. Going further costs **9× per row**, because a locally foraging bee
diffuses and visits must scale as the square of the ring. This asks the same
question at 4/24 and buys precision with **draws**, which is linear.

## The prediction, sharper than the roadmap's phrasing

Boundary dilution says an edge plant wastes transfer on neighbours of the other
morph. Note what that claims: dilution depends on **structural position, not on
which morph you carry**. A boundary plant is diluted whether it is rare or
common. The rare patch suffers only because _more of it is boundary_ — on a ring,
an arc of any length k has exactly **two** boundary members, so the boundary
fraction is 2/4 against 2/20.

So the mechanism predicts **both sub-ratios at parity** while the pooled ratio
sits below 1. It is **refuted** if either sub-ratio is clearly below 1 — that
would be a rare plant doing worse in the _same_ structural position, which
boundary dilution cannot explain.

## Result (4/24, local foraging, 24 draws × 3 bout seeds)

| subset                       | corrected rare/common (95% CI) |
| ---------------------------- | ------------------------------ |
| boundary (2 of 4 / 2 of 20)  | **1.172 ± 0.457**              |
| interior (2 of 4 / 18 of 20) | **0.878 ± 0.298**              |
| pooled                       | **0.754 ± 0.234** — excludes 1 |

Both sub-ratios span parity against a pooled penalty that is real. **H-comp
holds.**

## The control, which is a result in its own right

⚠️ "Boundary and interior look the same" is one of the possible answers, so a
broken split would produce it on every input. Under **global** foraging the bee
ignores the arrangement, so the two sets are the same plants wearing different
labels and must read equal; under **local** foraging they must differ.

| foraging     | boundary / interior per-capita |
| ------------ | ------------------------------ |
| local (0.03) | **0.570 ± 0.118** — excludes 1 |
| global (∞)   | **1.085 ± 0.191** — spans 1    |

Boundary plants receive **about half** the per-capita transfer of interior
plants, and the effect vanishes when foraging goes global. That is the premise
the whole patch-size prediction rested on, measured directly for the first time.

⚠️⚠️ **The first version of this control could not have fired.** It used the
_identical-morph_ layout, reasoning that holding placement constant leaves
position as the only variable. But if every plant carries the same morph there is
**no other morph to be diluted by**, so boundary dilution cannot occur there at
any foraging range — the control had removed the mechanism it was certifying.
Caught by the smoke run reporting b/i _above_ 1. The fix keeps placement constant
in the way that matters: within the focal arc every plant carries the same
genome, and only the neighbourhood differs.

## ⚠️ The verdict logic also had to be fixed, and this one nearly published

At 6 draws every interval spanned 1.0 (pooled 0.711 ± 0.503) and the code printed
**✅ H-comp HELD** — because _"both sub-ratios span 1"_ is satisfied
automatically when the intervals are wide enough to span everything, including by
a run with no signal at all. The composition claim is only meaningful if there is
a pooled penalty **to decompose**, so a pooled ratio that does not exclude 1 is
now routed to UNDERPOWERED. Verified against the measured values rather than
reasoned about: the old predicate fires `true` on them, the corrected one does
not.

## Post hoc: composition predicts the penalty's SIZE

The b/i ratio is measured on the **20-plant arc** in the control, independently of
the 4-vs-20 pooled comparison. With interior per-capita `I` and boundary
`B = (b/i)·I`, an arc of k plants has mean `((b/i)·2 + (k−2))·I / k`, so:

```
predicted pooled = arcMean(4) / arcMean(20) = 0.820
observed  pooled = 0.754 ± 0.234
```

The prediction lands inside, and it could have missed — it ties the penalty's
_magnitude_ to a quantity measured elsewhere, not just its sign. ⚠️ **Post hoc**,
and labelled so: it was not pre-registered, and #29 already taught this project
what an unregistered contrast is worth before replication.

## What is not established

⚠️ **Spanning 1.0 is not proving parity.** At these widths an interior penalty of
~10–15% would not have been detected. The claim is that no _large_
position-independent penalty survives spatial structure, not that none does.

⚠️ The interior of the rare patch is **2 plants** — the arithmetic of a 4-arc on a
ring, which no sample size fixes. A wide interior interval is a fact about the
design.

Nothing here says spatial structure produces an _advantage_. It says the residual
penalty at 4/24 is attributable to boundary composition, which is consistent with
the patch-size prediction that the ratio approaches 1 from below as patches grow
and does not cross — spatial structure buying **neutrality**, not advantage.
