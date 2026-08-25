# Pre-registration: spatial structure inside the IBM

**Written before any code, any run, any result.** Registered 2026-08-16 against
master `0adb892`.

## Why this, and why it is not a sixth variation

Five routes to the northstar are spent and the roadmap tabulates them at `:219`.
Four attacked visitation or attraction; the fifth attacked mate-finding and came
back inadmissible. But the table has a hole in it, and the hole is the reason
this experiment exists:

**Spatial structure is the only mechanism ever measured to move the barrier, and
it has never been run in the model that can speciate.**

`rare/common` went **0.26 → 0.360** in the 2×2 of 2026-08-02, and it moved only
in the clustered × local cell — each factor alone was _worse_ than doing neither
(scattered/local 0.048, because the bee gets trapped among the wrong
neighbours). That was measured on the v1 mating-success harness, which has no
standing variation, no recombination and no hybrids. The IBM has all three and
is **panmictic**: verified 2026-08-16 by grep — `sim/ibm.js` contains no
`positions`, no `forageRange`, no spatial term of any kind.

So the one route with a positive result was measured in machinery that cannot
speciate, and the machinery that can has never seen it.

## Why it might work here when five other things did not

The IBM's exclusion result is specific and it is **not about pollination**:

> _"once two groups stop competing for MATES they compete for OFFSPRING SLOTS,
> and one is excluded"_ — and the BAL replication located it in **demography**,
> since placement-mediated mating is untouched by the subsidy and exclusion
> still vanishes.

Every mechanism tried so far acts on the pollination half. Limited dispersal is
the first that localises **both** halves at once: a rare morph's offspring land
beside it, so it is locally common while globally rare — which supplies
_partners_ rather than _visits_ — and its competitors for a seed slot are its
own neighbours rather than the whole patch.

## The mechanism, and why it is DERIVED rather than IMPOSED

Two parameters, both already present in `sim/carryover.js`'s bout
(`positions`, `forageRange`) — this adds no new bout mechanism, it gives the
IBM's plants coordinates and passes them down:

- **`forageRange`** — the bee's next visit is drawn from a Gaussian kernel
  around the plant it is standing on. Infinity = the global forager of every
  previous IBM run.
- **`seedRange`** — an offspring's position is its **mother's**, displaced by a
  Gaussian. Infinity = a uniformly redrawn position, i.e. global dispersal.

⚠️ **CLUSTERING IS NOT IMPOSED.** The 2026-08-02 run _placed_ the morphs in
arcs, which asserts the structure whose consequences it then measures. Here
founders are placed at random positions and any clustering must **emerge** from
limited dispersal over generations. The roadmap asks for exactly this at `:528`
— _"clustering that EMERGES from limited dispersal rather than being imposed"_.

## The design: a 2×2, because a mechanism that works in three cells is a knob

|                       | global forage             | local forage              |
| --------------------- | ------------------------- | ------------------------- |
| **global dispersal**  | the published IBM         | bee is local, kin are not |
| **limited dispersal** | kin are local, bee is not | both                      |

The prediction is an **interaction**: only the bottom-right cell pays. Local
foraging with global dispersal gives the animal a neighbourhood that is not a
family; limited dispersal with a global forager builds a family the animal
ignores. Either main effect alone appearing as large as the interaction refutes
the mechanism as stated.

## Predictions (registered)

**H-spatial (primary):** in the local × limited cell, the **HELD** fraction
rises relative to the published IBM cell.

**⚠️ H-distinct — THE LOAD-BEARING ONE.** HELD alone is close to worthless here
and I want that on the record _before_ the numbers exist. "Aggregation promotes
coexistence" is canonical Chesson-era theory; a result that only says two
lineages persist longer when they clump is a restatement of standard ecology
with flowers drawn on it. The non-tautological claim is:

> **the rescued lineages stay DISTINCT — HELD rises without FUSED rising.**

- **Refuted as a speciation mechanism** if HELD rises and FUSED rises with it,
  i.e. the lineages persist by merging.
- **Refuted as a mechanism at all** if the effect is a main effect rather than
  the interaction above.
- **Demoted to known ecology** — reported, not claimed as novel — if HELD rises,
  FUSED is flat, and the emergence control below shows no ancestry clustering,
  because then something other than the stated mechanism did the work.

## ⚠️ Positive control: the clustering must be OBSERVED, not assumed

This is the trap this project keeps falling into — a guard whose predicate
cannot observe its referent. "Limited dispersal" is an _input_; whether kin
actually ended up near each other is an _outcome_, and if the kernel is too wide
relative to the ring the arms differ in a parameter and in nothing else.

So the run reports **ancestry autocorrelation**: mean |anc difference| between
ring-adjacent plants against the mean over all pairs. The ratio must fall below
1 in the limited-dispersal arms and must sit at 1 in the global ones.

**If that ratio does not separate, the experiment reports NO RESULT** — not a
negative. An unmoved outcome under an intervention that provably did nothing is
a broken harness, not evidence about biology.

## ⚠️ Negative control: the random-mating null

Every arm is also run with `randomMating`, which severs placement from parentage
while leaving demography, mutation and recombination untouched. Clustering that
raises HELD in the null is raising it through **drift and demography**, not
through placement-mediated mating, and the effect must be reported as such.

## What would make this a real result

A rise in HELD that (a) appears only in the interaction cell, (b) leaves FUSED
flat, (c) is accompanied by measured ancestry clustering, and (d) is larger in
the placement-mediated arm than in the random-mating null. Anything less is a
partial and will be written as one.

## Registered analysis

- `K = 40` seeds per cell, fixed in advance; no seed added after seeing results.
- Fate classified by the existing shared predicate (HELD / one lost / FUSED /
  both lost) — not a new one written for this run.
- Cell-vs-cell differences by paired bootstrap on the same seed set, reported
  with an interval; the interaction as the difference of differences.
- ⚠️ Any post-hoc cut is labelled POST HOC in the result document.
