# Pollinator heterogeneity does not break the symmetry

**Date:** 2026-08-02 · **Code:** `experiments/two-pollinators.js` · Roadmap item B, third step.

Placement selection converges (−48.9% ± 16.2pp) and placement inheritance blends (detour 1.01).
Hybrids pay 19.1%, so reinforcement has something to act on — but reinforcement cannot start until
divergence starts, and nothing so far makes divergence pay.

**"Add assortative mating" is not the answer on its own.** Mating here is _already_ assortative by
placement: the transfer matrix _is_ placement matching, which is the point of the whole project. And
the panmictic population still converged, because assortment on a trait whose payoff rises with
commonness produces conformity. A rare placement has to be worth something first.

So: **pollinator heterogeneity**. A plant visited by two animals with different geometry faces two
placement optima, and the resident is a compromise between them. A morph that specialises on one
animal might beat the compromise there by more than it loses elsewhere. This is the documented route
to pollination-syndrome divergence, and it needs no new mechanism — only a second animal.

## ⚠️ The first version of this experiment was worthless, and only the positive control said so

It measured invasion fitness of **one rare mutant against 20 identical resident clones** and returned
**0% invaders everywhere** — under one animal, under two, at every body-plan separation. A perfectly
uniform null.

It was an artefact of the readout. With 20 identical residents, a resident is perfectly matched to 19
partners while the mutant is at best partially matched to 20, so relative fitness is bounded near
N/(N−1) ≈ 1.05 and "the mutant wins" can essentially never happen **regardless of the biology**. The
experiment was structurally incapable of answering its own question.

What exposed it was the positive control: a deliberately mediocre resident, which mutants _must_ be
able to beat, also returned 0%. Without it this would have been written up as a fact about
pollinators. A second design flaw was caught the same way — the two-pollinator arm required mutants
to be viable on _both_ animals, which silently dropped exactly the specialists the hypothesis was
about, cutting n from 90 to 16.

## What is measured now: frequency dependence

The same morph at two frequencies in the same population, rare (4 of 24) and common (20 of 24).
Quality is held constant by construction because it is the same genome, so the ratio isolates the
frequency effect:

- **rare/common < 1** — positive frequency dependence, being common pays, the population converges;
- **rare/common > 1** — negative frequency dependence, a rare placement gains, which is what
  disruptive selection needs.

**Calibration control:** a morph identical to the resident must score 1.00, since there is then no
difference for frequency to act on. It does — **1.018** under one pollinator, **1.021** under two.
The readout is unbiased, and part C below produces values above 1, so it can report a rare advantage
when one exists.

## The result

```
  placement distance   rare/common per-capita success
                       one pollinator      two pollinators
        ~2                   0.889               0.793
        ~4                   0.552               0.459
        ~7                   0.319               0.331
        ~10                  0.258               0.325

  morphs with a rare advantage (>1):    0%                  0%
```

Frequency dependence is **strongly positive** in both. A morph at distance ~10 gets roughly a quarter
to a third of the per-capita mating success when rare that it gets when common. Two pollinators lift
the far bin from 0.258 to 0.325 — a real 26% relief — but nowhere near the 1.0 needed for a rare
morph to hold its own.

Pushing the two body plans apart does not help either:

```
  second animal                 rare-advantage morphs
  0.7x radius, 0.85x length              9%
  1.35x radius, 1.15x length             5%
  2.2x radius, 1.6x length               0%
  3.5x radius, 2.4x length               0%
```

The few rare-advantage morphs appear at the _smallest_ separations, which is the wrong direction for
the hypothesis and is consistent with noise.

**Within the body plans this model reaches, pollinator heterogeneity alone does not break the
symmetry.**

## What this says about where to look next

The numbers point somewhere specific. `rare/common ≈ 0.26` is the classic **rare-morph mate-finding
problem**: a novel placement is penalised not because it is badly built but because there is nobody
to exchange pollen with. A second pollinator does not fix that, because it does not give a rare morph
partners of its own kind.

So the next mechanisms to try are the ones that let a rare morph **meet itself**:

- **spatial structure / limited dispersal** — a new morph clusters with its own offspring rather than
  being diluted through a panmictic population;
- **pollinator constancy** — an animal that keeps visiting the morph it last visited, which is real
  bee behaviour and directly converts a rare morph's disadvantage into an advantage;
- **temporal assortment** (flowering time) — an assortment axis genuinely independent of placement,
  unlike placement-based assortment which is already present and conformist.

That is a sharper target than "add assortative mating", and it comes from the measurement rather than
from the literature.

## Limits

n is small in the primary arms — 12 morphs under one pollinator, 26 under two, because many mutants
fail to contact an animal at all. The gradient is monotone and steep in both, so the direction is not
in doubt, but the bin values are coarse.

Only two body plans at a time, all generated by scaling the default bee's radius and length. A truly
different pollinator — a hummingbird, a moth, a fly with a different approach posture — is not
reachable by scaling, and that is a real restriction on the claim: this rules out heterogeneity
_within the scalable family_, not heterogeneity in general.

Frequencies are 4/24 and 20/24; the ratio is not swept across a continuum. Populations are a single
bout with no demography, so this measures instantaneous frequency dependence rather than whether a
polymorphism would actually be protected over generations.
