# Flower constancy reinforces the majority — the hypothesis was backwards

**Date:** 2026-08-02 · **Code:** `sim/carryover.js` (`constancy`), `experiments/constancy.js` ·
Roadmap item B, fourth step.

Three results bracket the problem: placement selection is stabilising, placement inheritance blends,
and pollinator heterogeneity does not break the symmetry. That last experiment ended by naming the
barrier precisely — `rare/common` per-capita mating success ≈ 0.26. **A novel placement is not
punished for being badly built; it is punished because there is nobody to exchange pollen with.**

So the obvious candidate was **flower constancy**: a foraging bee tends to keep visiting the kind of
flower it last visited (Waser 1986; Chittka, Thomson & Waser 1999). It should help a rare morph
disproportionately — a common morph gets revisited by chance anyway, a rare one does not — giving
negative frequency dependence from pollinator _behaviour_ with no new floral mechanism at all.

**It does the opposite.**

## The measurement

The harness validated in the previous step: the same genome at two frequencies (4 of 24 rare, 20 of
24 common) in the same population, so quality is constant by construction and the ratio isolates
frequency. `constancy = 0` reproduces the previous regime and consumes no rng draw, so every earlier
result is untouched.

**Calibration control** — an identical morph must score 1.00, since there is then nothing for
frequency to act on: 0.968, 1.013, 0.981, 0.943 across constancy 0 → 0.9. ⚠️ Note the drift at 0.9.

## A. Constancy deepens the penalty

```
  constancy    near      mid       far    morphs with rare advantage
  0           0.655    0.344    0.296            0%
  0.4         0.651    0.314    0.271            0%
  0.8         0.677    0.257    0.200            0%
  0.95        0.676    0.196    0.198            0%
```

The far-bin ratio falls **0.296 → 0.198**. Not a single morph at any constancy gains a rare
advantage. The hypothesis is refuted, and in the wrong direction.

## ⚠️ B. My explanation for the refutation was also wrong

The obvious reading was partner exhaustion: with only four rare plants, a constant forager gets
trapped circulating among the same few individuals, and a revisit to a plant it has already emptied
earns nothing. The calibration control's own drift (0.968 → 0.943, where there is no real difference)
seemed to support it — that drift can only be about how many plants carry the focal label.

The discriminator holds **frequency fixed at 1/6** and scales the absolute counts:

```
  rare/total plants   constancy 0   constancy 0.8   change
     4/24                   0.471           0.260   -0.211
     8/48                   0.547           0.335   -0.212
    12/72                   0.550           0.367   -0.183
```

**The constancy penalty is scale-invariant** (−0.211 → −0.183 while the rare morph triples). If it
were partner exhaustion it would have collapsed. It is a genuine frequency effect.

What separates cleanly is that the **baseline** penalty _does_ ease with population size (0.471 →
0.550) — that part is partner availability, and it is a different thing from what constancy adds.

## What constancy actually does

Constancy amplifies whatever the encounter rate already is. A bee that lands on the majority stays
on the majority, so the common morph captures a disproportionate share of all visits — positive
feedback on abundance. It **reinforces the majority rather than protecting the minority**.

That is not a quirk of this model: minority disadvantage under flower constancy is the documented
expectation, and is a standard explanation for why rare colour morphs are selected against in
polymorphic populations. The model reproduces a known phenomenon; my hypothesis was simply backwards
relative to established theory, and I did not check it before building.

## Where this leaves roadmap B

Four mechanisms tried, four negative results, and the barrier is now sharply characterised rather
than merely named:

- placement selection converges (stabilising, −48.9%);
- placement inheritance blends (detour 1.01), so gene flow erodes divergence;
- hybrids do pay 19.1%, so reinforcement would have something to act on;
- pollinator heterogeneity does not create a rare advantage;
- **constancy makes it worse, and does so as a genuine frequency effect.**

Two candidates remain from the mate-finding list, and one is now clearly favoured. **Spatial
structure** is the strong one: it is the only mechanism proposed so far that gives a rare morph
_neighbours of its own kind_ rather than merely more visits — a new morph's offspring land near it,
so the rare morph is locally common even while globally rare. That directly attacks the measured
barrier in a way neither a second pollinator nor constancy does. **Temporal assortment** (flowering
time) is the other, and is genuinely independent of placement.

## Limits

One bee, one continuous bout. Real constancy operates per-forager across many independent bees, and
while a run of ~1/(1−c) visits per species is well within this bout at every level tested, a
many-forager model could in principle behave differently — that is the least-tested assumption here.

Frequencies are 4/24 and 20/24 with a single intermediate step for the scaling arm; the ratio is not
swept across a continuum. No demography — this is instantaneous frequency dependence, not whether a
polymorphism would be protected across generations.
