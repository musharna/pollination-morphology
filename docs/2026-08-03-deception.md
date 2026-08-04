# Deception — the sixth mechanism, and the first one that breaks the symmetry

**Date:** 2026-08-03 · **Code:** `sim/deception.js`, `experiments/deception.js`, `sim/carryover.js`
· Roadmap C's last un-built mechanism class, and roadmap B's sixth candidate symmetry-breaker.

## Why this one was worth building

Five mechanisms have been tested against roadmap B's barrier — a rare placement is penalised because
it has nobody to exchange pollen with, `rare/common ≈ 0.26`. Pollinator heterogeneity, flower
constancy, larger patches and recombination all failed; spatial structure helped partially. **Every
one of them changes who the animal meets, not whether the animal wants to be there.** Deception is
the first that acts on the visitor's motivation, and the only one with field-measured negative
frequency-dependence behind it.

## ⚠️ The literature is split, so frequency-dependence is an output here, not an input

- **Gigord, Macnair & Smithson 2001** (`10.1073/pnas.111162598`, PNAS) varied the frequency of the
  two colour morphs of the rewardless orchid _Dactylorhiza sambucina_ in its natural habitat: rare
  morphs gained through **both male and female** components.
- ⚠️ **Smithson, Juillet, Macnair & Gigord 2007** (`10.1890/05-1445`, Ecology) — the **same group**,
  six years later — found **no** diversity advantage in the same species, and monomorphic yellow
  arrays had significantly _greater_ pollinia removal.
- ⚠️ **Whitehead & Peakall 2012** (`10.1093/beheco/ars149`) found **short-term but not long-term**
  patch avoidance in the wasp pollinating _Chiloglottis trapeziformis_. Whatever the animal learns,
  it forgets.

Wiring in a rare-morph advantage would have assumed the answer to the question the module exists to
ask. What is built instead is **Rescorla–Wagner associative learning over a signal space with a
stimulus-generalisation gradient** — the textbook account of a foraging bee. Whether that _produces_
frequency-dependence is the measurement.

Signal space is a ring, for the same reason plant positions are: on a line the extreme signals would
look distinctive for a reason that is an artefact of the coordinate.

## A. A rare cheat gains — but only if the animal can tell it apart

Two morphs of the same deceptive plant: identical placement, identical rewardlessness, differing
only in advertised signal.

```
   signal gap   rare/common (learning)   rare/common [NO LEARNER]
         0.00                   1.000                      1.025
         0.05                   1.174                      1.025
         0.10                   1.623                      1.025
         0.20                   1.994                      1.025
         0.35                   2.013                      1.025
         0.50                   2.013                      1.025
```

**Null band, 8 independent draws with identical morphs and no learner: mean 0.991, sd 0.028.** A
result counts above 1.075. Five of six gaps clear it, peaking at **2.013**.

**At gap 0 the effect is exactly absent (1.000).** The two morphs are the same stimulus to the
animal, so there is nothing to discriminate — the mechanism switches off precisely where the theory
says it must, which is a stronger check than the positive result.

### ⚠️ The control caught me writing a bad check, not a bad harness

The first version asserted the no-learner column "must sit at 1.000" and flagged a harness fault at
1.025. Chasing it properly — three hypotheses, then measurement — showed the offset **varies in
sign** across genome draws (1.025, 0.976, 1.045, 0.979, 0.985, 0.980, 0.988). It is sampling noise
between the two arms' site realisations, not bias.

So the check was the defect: **it asserted flatness of a stochastic quantity from a single draw**,
which is already a standing constraint in this project's own roadmap. The null is now estimated as a
distribution from the same code and the effect judged against mean + 3sd. Double-counting of
focal-focal pairs was the leading hypothesis and was **refuted by sign** — it predicts rare/common
below 1, and the observation is above.

## B. It does not need the long memory the field ruled out

```
    forget   half-life (visits)   rare/common
     0.000                never         1.794
     0.002                  346         2.080
     0.010                   69         2.013
     0.050                   14         1.816
     0.200                    3         1.355
     0.600                    1         1.085
```

The effect survives at a **3-visit half-life** (1.355), so it does not depend on the long-term
avoidance Whitehead & Peakall failed to find. That was the main threat to transferring part A to the
field, and it does not bite.

**⚠️ And the relationship is not monotonic — a perfect memory is worse than a leaky one.** Never
forgetting (1.794) underperforms a 346-visit half-life (2.080), because saturated aversion
generalises onto the rare morph's own signal too. **The mechanism has an optimum memory length**,
which is a prediction rather than a fitted result: too little memory and cheating is unpunished, too
much and the punishment spreads to everyone.

## C. A cheat is punished by honest neighbours — Internicola & Harder reproduced

```
   resident rewardP   cheat per-capita   [NO LEARNER]   ratio
               0.00             7319.8         4325.0   1.692
               0.25             4118.5         4325.0   0.952
               0.50             2859.3         4325.0   0.661
               0.75             2249.8         4325.0   0.520
               1.00             1833.5         4325.0   0.424
```

**Internicola & Harder 2011** (`10.1098/rspb.2011.1849`) found generalised food-deceptive orchids
"compete poorly with rewarding species for pollinator services". The model reproduces it — the
cheat's advantage falls **1.69× → 0.42×** as its neighbours become reliable — and supplies a
mechanism for it: **every honest visit restores the expectation the cheat's signal spends.** A cheat
among cheats is exploiting a resource nobody replenishes; a cheat among honest flowers is
discriminated against by an animal whose expectations keep getting topped up.

⚠️ The write-up asserted the opposite direction when first drafted. The model agreed with the paper
and the interpretation did not; corrected against the abstract.

## D. The roadmap B result — the first mechanism of six to cross parity

Focal morph differs from the resident in **both** placement and signal.

```
   morph   rare/common (learning)   rare/common [NO LEARNER]   lift
       1                   0.916                      0.253   3.620
       2                   0.928                      0.249   3.721
       3                   0.956                      0.296   3.230
       4                   1.308                      0.479   2.732
       5                   1.615                      0.679   2.377
       6                   1.231                      0.408   3.017
       7                   0.895                      0.236   3.799
       8                   1.207                      0.414   2.917
```

**4 of 8 morphs cross `rare/common = 1`. Mean lift from learning: 3.18×.** The no-learner arm never
crosses — its maximum is 0.679.

**The no-learner column independently reproduces the published barrier.** Its tightest morphs land at
0.236, 0.249 and 0.253 against the 0.26 measured under one pollinator in a different experiment
written months earlier. That number was not tuned for and is not an input here, so it is a real check
that the harness is measuring the thing it claims.

**This is the first mechanism of six to push a rare placement past parity.** It is also the only one
that could have: the other five redistribute visits among plants the animal already wants to visit,
whereas deception changes how much it wants to visit them at all.

> ✅ **RE-SCORED 2026-08-04 AND IT HOLDS.** This number is a **summed transfer**, and the IBM later
> proved that the choice of statistic can invert a conclusion in this codebase — scoring by pollen
> received read +0.149 where realized parentage reads −0.842. Transfer is a raw sum; parentage is a
> normalised share per mother, so a rare morph delivering to already-saturated mothers can score high
> on one and near-zero on the other. Re-scored from the identical bout: **4 of 8 under both**
> statistics (parentage mean 1.040 vs transfer 1.132). Parentage is systematically a little harsher,
> but the claim stands. [detail](2026-08-04-deception-ibm.md)
>
> ⚠️ **What it does NOT license is a claim about speciation.** Wired into a model that can breed,
> deception diversifies the **advertisement ~4×** and does not move placement at all — even when the
> advertisement is genetically linked to the anther loci. Past parity is the condition for a
> _protected polymorphism_, which is the opposite of a completed split.

## What this does and does not license

**It does not say placement diverges by deception in nature.** It says the barrier that stopped five
mechanisms is not insurmountable, and names the property a mechanism needs to clear it — acting on
motivation rather than on encounter rate.

Three limits stated plainly:

- **Half the morphs still fail.** 4 of 8 cross parity; the ones that do not start from the deepest
  penalty. Deception lifts everything by about 3×, so whether that clears 1.0 depends on where the
  morph started.
- **It requires a signal gap**, and signal is modelled as a free axis. Whether a new placement morph
  actually carries a new signal is an assumption this model makes rather than measures — real
  pleiotropy between placement and advertisement is unmodelled and could run either way.
- **The community must be deceptive for the cheat to gain** (part C). A rare morph in an honest
  community is punished, not rewarded — so this is the _Dactylorhiza_ situation, where both morphs
  are rewardless, and not a general rare-morph advantage.

## Tests

14 new tests, and **five mutants run against them — four killed on the first pass, one survived.**

The survivor is the one worth recording. The inertness test — the one protecting every published
result, since deception adds a branch inside `runBout`'s visit loop — compared a bout with the
options omitted against a bout with them null. **Both arms are the same build, so an injected `rng()`
on the shared default path moved both together and the test stayed green.** It could not fail for the
reason it existed.

Fixed by pinning against `sim/carryover.js` **as it stood on master before deception existed**
(`git show master:...`), which is a historical fact rather than a value the current code derived
about itself — the difference between a golden constant and a circular one. That mutant is now
killed.

The behavioural test carries its positive control in the same run: "the cheat lost visits" passes on
a harness that simply lost visits, so the same test asserts the rewarding species **gained** them.
