# Reward currency — what the animal is paid, and what it costs

**Date:** 2026-08-01 · **Code:** `sim/reward.js`, dispensing in `sim/carryover.js`,
`experiments/reward.js`, `tests/reward.test.js` · Roadmap item C, second mechanism class.

Every result before this treated a visit as free to the flower. It is not, and the reason is that
one currency is also the gamete. **Pollen is simultaneously the reward and the male gamete**, so a
grain packed into a bee's corbiculae is a grain that will never reach a stigma — the "pollen
dilemma" (Oliveira et al. 2020, [10.3390/plants9121685](https://doi.org/10.3390/plants9121685);
heteranthery is the documented way out, Saab et al. 2021,
[10.1093/aobpla/plab054](https://doi.org/10.1093/aobpla/plab054)). **Nectar** costs carbon, not
gametes, so it decouples attraction from male fitness.

Three published claims to check against, rather than three numbers to admire.

## A. The male gain curve — reproduced, and the mechanism is not the obvious one

Harder & Thomson 1989 ([10.1086/284922](https://doi.org/10.1086/284922), Am Nat) measured bumble
bees depositing **0.6% of removed pollen** onto subsequent stigmas in _Erythronium grandiflorum_,
and — the load-bearing part — _"the proportion deposited declined as the amount removed increased"_.

```
  dose/visit   delivered per grain RELEASED    (pool 60, stigma pickup 5)
           3        5.602%
           6        5.536%
          15        5.356%
          30        4.697%
          60        3.202%          falls 1.75x
```

The shape is **flat then declining**, and that is the mechanism rather than a blemish: while the
dose sits below what a stigma can accept, capacity does not bind and delivery per grain cannot
improve. It only falls once the dose exceeds capacity.

⚠️ **I assumed grooming caused the decline. It does not.** Measured, by removing one mechanism at a
time:

| variant                     | small dose | large dose | ratio     |
| --------------------------- | ---------- | ---------- | --------- |
| full model                  | 5.602%     | 3.202%     | 1.75×     |
| no grooming, no harvest     | 24.838%    | 3.447%     | 7.21×     |
| **unbounded stigma pickup** | 5.602%     | 5.528%     | **1.01×** |
| unbounded carry cap         | 5.602%     | 3.202%     | 1.75×     |

**Finite stigma capacity bends the curve; grooming and harvest only set its level** (0.25 → 0.06),
and the carry cap is irrelevant at these doses. That is also the biology — a stigma has a bounded
receptive surface, so a larger dose cannot be proportionally deposited. The test suite pins the
control in the form that actually discriminates: make the stigma unbounded and the curve must go
flat, while the same harness must still detect the decline when it is finite.

**Level, honestly:** ours is 3–6% where Harder & Thomson measured 0.6%. Five to ten times too
generous, because this bout has two well-separated species and a real meadow has many competitors
and more ways to lose a grain. The **shape** is reproduced; the **level** is not calibrated, and
roadmap item E is where that gets settled.

## B. The two-sided prediction — three cells of four

Castellanos et al. 2006 ([10.1086/498854](https://doi.org/10.1086/498854), Am Nat): _"Simultaneous
pollen presentation should be favored when pollinators are infrequent or efficient at delivering the
pollen they remove, whereas gradual dosing should optimize delivery by frequent and wasteful
pollinators."_ Two-sided, so a model that answers "dispense gradually" everywhere has reproduced
nothing.

Scored as delivered conspecific grains per grain the plant **committed** — pollen a short-lived
flower never released counts as wasted, which is the whole point.

| regime                   | gradual (dose 3) | simultaneous (dose 60) | winner       | predicted       |
| ------------------------ | ---------------- | ---------------------- | ------------ | --------------- |
| frequent + wasteful      | 5.007%           | 2.990%                 | GRADUAL      | ✅ gradual      |
| **frequent + efficient** | 19.356%          | 10.812%                | GRADUAL      | ❌ simultaneous |
| infrequent + wasteful    | 0.502%           | 2.990%                 | SIMULTANEOUS | ✅ (infrequent) |
| infrequent + efficient   | 1.938%           | 10.812%                | SIMULTANEOUS | ✅              |

The frequency axis works and is sharply mechanistic. Sweeping visits per flower under an efficient
pollinator, gradual fitness rises **linearly** (0.969% per visit) up to **exactly 20 visits** — dose
3 × 20 = the whole 60-grain pool — then saturates dead flat, while simultaneous is flat throughout.
The crossover sits between 10 and 15 visits. The winner is decided by whether the flower lives long
enough to shed its pollen.

## ⚠️ B2. The cell that fails, and three explanations of mine that also failed

A partial reproduction whose failure is unexplained is indistinguishable from a bug, so:

1. **"Efficient" was the wrong knob?** A2 showed delivery-per-removed-grain is governed by stigma
   capacity, not grooming — so efficiency should mean high `pickup`. Re-run that way: still GRADUAL
   (19.356% vs 10.812%). **Refuted.**
2. **Deterministic lifetimes remove gradual's risk?** A flower guaranteed 25 visits can never be
   stranded. Made the lifetime geometric with the same mean: gradual falls 19.36% → 13.20%, but
   simultaneous is unchanged and still loses. **Refuted.**
3. **The per-visit contact ceiling forbids a big single export?** A stigma only takes grains within
   `radius` of its contact point. Relaxing it: the two strategies **converge to a tie** (48.5% vs
   48.6%, inside seed noise) rather than reversing. **Refuted.**

That convergence is the tell. **In this model gradual dispensing has no cost except stranding** —
no penalty for staying open longer, no pollen senescence in the anther. With no such cost, once
visits are plentiful gradual can tie but can never lose. The missing ingredient is a **cost of
prolonged presentation**, not anything about the pollinator's efficiency. Named, not hand-waved,
and it is the concrete next thing to build if this cell matters.

## C. The pollen dilemma, quantified

Under pollen reward the dispensing schedule **is** the advertisement: dispense meanly and fewer
animals come. Under nectar the advertisement is a separate budget.

```
  dose/visit   POLLEN reward     NECTAR reward     (male fitness per grain committed)
           3          0.251%          11.110%
           6          1.525%          11.032%
          12          4.995%          10.314%
          30          4.237%           6.925%
          60          2.990%           3.614%

  best under POLLEN : dose 12    best under NECTAR : dose 3
```

**Nectar's optimum is four times more gradual and yields 2.2× the male fitness.** A pollen-rewarding
flower is pushed to over-dispense because dispensing is the only way it can advertise; at the
schedule that would be best for siring (dose 3) it attracts so few visitors that its pollen dies in
the anther — 0.251% against nectar's 11.110%.

That is the dilemma as a number rather than a phrase, and it is a reason nectar is worth its carbon:
not because nectar attracts better, but because it lets the flower stop using its gametes as
advertising.

## Limits

Two species, deliberately well separated, so this measures dispensing rather than mixing. The
delivery **level** is uncalibrated (see A). Harvest is a flat fraction rather than a foraging
decision — real bees adjust effort to what is on offer. And none of this is inside the evolution
loop yet: these are fixed strategies compared against each other, not strategies that evolved. The
carryover mechanism took the same two steps in that order.
