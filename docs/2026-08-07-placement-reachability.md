# Is the placement axis connected? — 2026-08-07

**Answer: yes, for every body plan the project has. Discreteness does not emerge
from the existing geometry, so the discrete-axis route needs a modelling choice
rather than a measurement.**

## Why this was asked

#25 established that rare-biased visitation is self-defeating on a continuous
trait axis. Weighting by `dens^(a-1)` makes the lowest-density placement the
**gap between the two clusters**, so a preference for rare morphs pours visits —
136× — onto exactly the intermediates that bridge them. The same document drew
the contrast that matters: deception splits the **advertisement** and not the
plant, because a colour dimorphism is discrete and _has no intermediate to
subsidise_.

That suggests an experiment: make the placement axis discrete and rare-bias may
stop feeding the bridge. Before building anything, the cheap version had to be
ruled in or out — **is the axis already effectively discrete?** `DEFAULT_BEE` is
a capsule chain of named regions with a radius step at the face/scutum junction
(0.32 → 0.42), which looks like it might do the job for free.

⚠️ **The regions are not evidence for it.** They exist because retention and
grooming reach differ per region (groundwork §4.4). Reading them as a discrete
placement axis would project a purpose onto them they were not built for.

## The distinction the measurement had to respect

⚠️ **Reachability, not density.** A merely _sparse_ gap is still subsidised by
rare-bias — that is the whole mechanism. A subsidy only starves the bridge if the
intermediate placements **cannot exist**. So the object of study is the _image of
genome space under the contact map_, not the occupancy of an evolved cloud.

Method: draw random genomes, place each with the model's own `sitesOf` /
`placementOf`, and look for interior intervals of `s` that nothing reaches.

## ⚠️⚠️ The first pass was a false positive, and the fix is the contribution

At a single sample size the probe reported holes in **three of four** body plans.
All three were artefacts. An empty bin in a sparse tail is a fact about the draw,
not about the geometry, and a verdict that cannot tell those apart will find
"discreteness" in any sparse distribution.

**The discriminator is that a real hole is STATIONARY.** Every plan is now probed
at two sample sizes and a hole counts only if it survives _in place_:

- `long slender` became **connected** outright at 4× the draws.
- `large robust`'s hole **moved with the tail**, 0.454 → 0.491, as its observed
  range extended 0.476 → 0.540.
- The pinched control's hole **stayed put**: [0.158, 0.417] against a waist
  constructed at [0.16, 0.42].

## Result

12,000 then 48,000 random genomes per plan:

| plan              | placed         | s range        | verdict                               |
| ----------------- | -------------- | -------------- | ------------------------------------- |
| default bee       | 9,759 / 38,915 | −0.160 … 0.632 | **connected**                         |
| small slender     | 4,475 / 17,635 | −0.119 … 0.780 | **connected** (1 unstable discarded)  |
| large robust      | 6,487 / 25,982 | −0.194 … 0.540 | **connected** (1 unstable discarded)  |
| long slender      | 4,418 / 17,453 | −0.069 … 0.440 | **connected** (1 unstable discarded)  |
| PINCHED (control) | 4,322 / 17,560 | −0.155 … 0.640 | **1 stable hole**, s ∈ [0.158, 0.417] |

⚠️ **The positive control is what licenses the nulls.** "Connected" is the
expected answer and a probe that could never find a hole would report it on every
input. The pinched plan has an unreachable mid-body by construction; the probe
finds it, to within a bin width of where it was built.

⚠️ **The four plans could not have differed, and that is worth stating.**
`checks.js` builds all of them with `scaleBee`, multiplying the default's radii
by `k` and its length by `lenK`. They share `s` boundaries by construction, so
none can introduce a hole the default lacks. The enumeration is therefore
exhausted rather than sampled — measured anyway rather than argued from
construction, but no fifth scaling would change it.

## What this means for the northstar

The cheap version of the discrete-axis proposal is dead: the geometry does not
supply discreteness, not even at the face/scutum step.

A discrete axis would need a body plan with a **genuine constriction**, and the
control shows that such a plan does produce a disconnected axis. That is
defensible morphology — Apocrita are named for the wasp waist, and _Platanthera_
attaches pollinaria to proboscis versus eyes, which are discrete structures, not
points on a continuum.

⚠️⚠️ **But it is a MODELLING CHOICE, and the trap is the one #30 already fell
into.** Choosing a constricted body _because_ it delivers the discreteness the
mechanism needs is close to the per-lineage quota #25 ruled out as
question-begging. The honest form: fix the constriction from real wasp
morphometry, treat the reachability gap as a **prediction that follows**, and
only then ask whether exclusion changes. If the constriction is tuned until the
exclusion result moves, the result is the tuning.

Not established here: nothing about whether a disconnected axis would actually
rescue coexistence. This measures the premise only.
