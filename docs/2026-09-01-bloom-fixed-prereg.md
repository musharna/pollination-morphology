# Pre-registration — #53: is the premium's effect ONLY through the polymorphism it maintains?

**Date:** 2026-09-01 · **Status:** registered, not yet run
**Written before `sim/ibm.js` has any bloom-forcing hook** — as with
[#51](2026-08-31-empty-time-prereg.md) and
[#52](2026-09-01-rarity-premium-prereg.md), the predictions are committed before
the code that could tune them exists.

## The confound this exists to break

[#52](2026-09-01-rarity-premium.md) established that roadmap B's positive rests
on the per-slice rarity premium: `HELD` 0.289 → 0.026, and `H-pool` — the
contrast that licensed "heritable temporal assortment" over "small mating
pools" — fell to +0.026 [0.000, 0.079].

It could not say **why**, because the ablation moves two things:

1. it removes the **premium** (rare flowering times stop paying), and
2. downstream, the **flowering-time polymorphism collapses** — R1 0.457 → 0.941,
   scattered → concentrated, co-flowering 4.743 → 6.366.

#52's best-supported reading is a two-step — premium maintains variation,
variation assorts, assortment retains ancestry — but it is **inferred from a
correlation between two things that moved together**, which is precisely the
kind of claim this project has been wrong about before.

## The design: a 2×2 that crosses the two factors

Rather than one more ablation, both factors are crossed. `forceBloomDist`
re-imposes a **donor multiset** of flowering times each generation by
rank-preserving assignment: sort the arm's own expressed blooms, sort the
donor's, and give the k-th smallest plant the k-th smallest donor value.

|                           | bloom free to evolve       | bloom distribution FORCED                                 |
| ------------------------- | -------------------------- | --------------------------------------------------------- |
| **flat per-slice budget** | **A** = #37 (`HELD` 0.289) | **D** — premium KEPT, polymorphism DESTROYED (donor: B)   |
| **visits ∝ display**      | **B** = #52 (`HELD` 0.026) | **C** — premium REMOVED, polymorphism RESTORED (donor: A) |

C and D are the new cells. A and B are re-run in the same process so the donors
are that run's own trajectories rather than numbers copied across builds.

⚠️ **Rank-preserving, not value-preserving.** The mapping forces the _marginal
distribution_ to match the donor exactly while keeping each plant's position in
the order its genotype gives it — so relatives who would flower near each other
still do. It does **not** preserve ring distances, and the sort cuts the ring at
0, so two relatives at 0.99 and 0.01 are ring-close but rank-far. Whether the
lineage tie survives that is a registered gate below, not an assumption.

## Registered predictions

| #      | prediction                                                                                       | band                                          |
| ------ | ------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| **P1** | **C recovers**: restoring the polymorphism restores retained ancestry even with the premium gone | `HELD` ≥ **0.158** (#37's own lower CI bound) |
| **P2** | **D collapses**: destroying the polymorphism kills it even with the premium intact               | `HELD` ≤ **0.079**                            |

### All outcomes committed in advance

| outcome      | criterion                   | reading                                                                                                                                                                                                     |
| ------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TWO-STEP** | P1 **and** P2               | The premium acts ONLY through the flowering-time polymorphism it sustains. #52's inferred chain is demonstrated, and the causal variable is the VARIATION, not the allocation rule as such.                 |
| **DIRECT**   | C ≤ 0.079 **and** D ≥ 0.158 | The reverse: the premium acts on ancestry independently, and the bloom collapse in #52 was a side-effect that carried none of the work. #52's mechanism paragraph would be **wrong** and must be retracted. |
| **BOTH**     | C ≥ 0.158 **and** D ≥ 0.158 | Each factor suffices on its own; neither is necessary.                                                                                                                                                      |
| **NEITHER**  | C ≤ 0.079 **and** D ≤ 0.079 | Both are necessary and neither sufficient — the effect lives in the combination and **no single mechanism may be named**.                                                                                   |
| **PARTIAL**  | anything else               | Reported as partial. No mechanism named, and the run does not get to pick whichever half reads better.                                                                                                      |

⚠️ **DIRECT and NEITHER are live outcomes, not formalities.** DIRECT would
falsify the mechanism paragraph I wrote into #52's result and its ROADMAP entry
yesterday. That is stated here so the retraction is pre-committed rather than
negotiated after the numbers arrive.

## Controls — the run is uninterpretable unless all of these hold

- **C1 — the forcing landed.** C's `R1`/`R2` must equal A's and D's must equal
  B's to three decimals, because a forced multiset is the donor's multiset and
  those statistics depend on nothing else. If they do not match, the hook did
  not do what it says.
- **C2 — SELF-DONATION IS THE IDENTITY.** Forcing an arm with **its own**
  realised trajectory must reproduce that arm **byte-identically**: rank-mapping
  a multiset onto itself is the identity map. ⚠️ This is the positive control on
  the whole mechanism — it separates "the forcing works" from "the forcing
  perturbs everything it touches", and no other check can.
- **C3 — the lineage tie survives.** `bloomLineage` in C and D must stay below
  0.99. Rank-mapping across the ring cut could scramble which relatives flower
  together; if it does, the forced cells no longer carry the mechanism under
  test and nothing may be concluded from them.
- **C4 — exact-off.** With the hook absent, every earlier number is
  bit-identical. Verified against the current build, not asserted.
- **C5 — the budget guard is ONE STEP ON THE SAME POPULATION.** Never a sum over
  generations. #51 made that error, fixed it, and #52's prereg re-made it in
  prose: a run-total is a trajectory, because the arms diverge after generation 0.
- **C6 — donor/recipient size mismatch is reported, not hidden.** The arms
  diverge demographically, so at generation `g` the donor may hold a different
  number of plants. The mapping interpolates by quantile, and the run reports how
  often the sizes differed and by how much.

## What would make this uninterpretable

- A does not reproduce #37 (0.000 / 0.289 / 0.368 / 0.000 / 0.000) or B does not
  reproduce #52 (0.026 in `narrow·free`).
- **C2 fails** — self-donation is not the identity.
- C1 fails — a forced arm's bloom distribution does not match its donor's.
- C3 fails — `bloomLineage` goes to 1.0 in a forced cell.
- The budget differs between arms on one step of the same population.

## Scope, stated before the numbers exist

Still one width, one slice count, `n=30`, and the same 40 seeds. A forced bloom
distribution is **not** a biological model of anything: it is an instrument for
holding one variable still. Whatever it shows is a statement about which factor
carries the effect **inside this model**, not a claim that real flowering-time
distributions are externally imposed.

⚠️ And it does not revisit whether the constant per-slice budget is the right
allocation. #52 established that question as open and it stays open: both
allocations remain defensible, real pollinators sit between them, and nothing
here measures where.
