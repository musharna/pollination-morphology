# #54 — NO VERDICT. The one significant signal is the artefact's signature, not the mechanism's.

Registered in `docs/2026-09-02-bloom-switch-prereg.md`, with three amendments, all
committed before any run that could produce a result.

**#54 replaced #53's dead crossed design with a switch-time ablation: premium ON for k
generations, then OFF, on the population's own uninterrupted trajectory. Nothing is
imposed, so #53's forcing-hook confound cannot arise — and it did not. The design
nevertheless cannot separate the two hypotheses, for a reason that can be named
precisely: the lag it detects is exactly what the instrument produces on its own.**

## What ran

`sim/ibm.js` is **untouched** at md5 `39980f6f0a4b057572e6f9d8c573fe32` — the build #53
ran. The switch is one mutated property between `step` calls, so arms A and B are a free
cross-experiment reproduction rather than a self-check.

Two runs: the sweep (7 arms × 40 seeds, 38 founded) and the contrast (arms B/k=15/A ×
300 seeds, 272 founded). Suite 289/289.

### Controls — all pass

| | |
| --- | --- |
| C1 `k=35` reproduces #37/#53-A, HELD 0.289 | **0.289** PASS |
| C2 `k=0` reproduces #52/#53-B, HELD 0.026 | **0.026** PASS |
| C3 polymorphism intact at the switch, max abs dR1 | 0.000 PASS |
| C4 budget matched at generation k, one step | 0.000 PASS |
| C5 pre-switch fingerprint identical to A | 0/4080 differing PASS |

⚠️ **A5 earned itself.** At 272 seeds arm A reads HELD **0.246** and arm B **0.007** —
neither is 0.289 or 0.026. Those are 40-seed fractions, so a control comparing the
300-seed number against them would have **FAILED on correct code**. C1/C2 evaluate on
seeds 1..40 whatever `N_SEEDS` is, and pass exactly.

## The finding that needs none of the contrast machinery

```
premium ON for   0     5     10    15    20    25    35  generations
HELD           .026  .000  .026  .000  .026  .053  .289
```

Paired over seeds, at n=272: `k=15` sits **−0.235 [−0.287, −0.188]** below A and
**+0.004 [−0.011, +0.018]** from B. At n=38 even `k=25` is −0.237 [−0.395, −0.105] below
A and +0.026 [−0.053, +0.132] from B.

**The premium's effect on retained ancestry is not bankable.** Twenty-five of thirty-five
generations of it leaves a population statistically indistinguishable from one that never
had it. Retention is a rate property, not a stock: ten generations of decay at B's rate
erase what twenty-five at A's rate built. This is not a scaffold that raises a structure
and comes away — it has to be running at the end.

That bears directly on the question #23 asked of roadmap B: whether divergence, once
started, maintains itself. Here it does not.

## The contrast — and why it decides nothing

At k=15, n=272 seeds, 20 admissible generations:

| statistic | value |
| --- | --- |
| mean `ancGap` / `polyGap` | 0.726 / 0.670 |
| **Δ, registered primary (paired t)** | **+0.057 [−0.090, +0.204]** |
| Δ, ratio-of-sums robustness check | +0.049 [−0.098, +0.196] |
| Δ, seed-shuffled null | +0.057 [−0.105, +0.218] |
| spread ratio sd(real)/sd(shuffled) | 0.913 |
| median Δ | **−0.394** |
| sign test | **91+ / 181−, p < 0.0001** |
| Wilcoxon signed-rank | p = 0.111 |

All three gates PASS: the polymorphism does relax (G1 0.941), not instantly (G2 0.000),
over 20 admissible generations (G3).

⚠️ **The run was NOT underpowered — A4's target was met.** Achieved half-width **0.147**
against the 0.15 band, with n≈271 required and 272 obtained. The straddle is real, not a
sample-size artefact. That distinction is the whole reason A4 required the power line to
print on every branch.

### Why no branch is claimed

**A9 fires: the summaries disagree in significance.** The sign test is p < 0.0001 and
negative; the t interval is not significant; Wilcoxon is p = 0.111. Two thirds of seeds
(181/272) have ancestry **lagging** the polymorphism, while the mean is dragged positive
by a heavy right tail — the unbounded per-seed gap that A9 predicted from A1's mixed
within/across-seed normalisation. The same split appears at every switch time in the
sweep (median negative at all five k, sign test p ≤ 0.034 at four of them) while every
mean is near zero or positive. **A verdict that depends on which summary of the same
numbers is used has not been measured.**

### ⚠️⚠️ And the deeper reason, which no amount of extra seeding would fix

A6 registered the artefact in advance: ancestry variance is a **stock** that accumulates
and decays and cannot jump, while `R1` is **recomputed from scratch** each generation, so
**ancestry must lag the polymorphism whether or not anything couples them.**

The one significant result in this run is that ancestry lags the polymorphism.
**That is the artefact's signature, stated before the run, and it is indistinguishable
from what the two-step predicts.**

The seed shuffle exists precisely to tell them apart: the two-step requires ancestry to
track *its own seed's* polymorphism, and the artefact requires no such coupling. The
observed spread ratio is **0.913**, above the registered 0.8 threshold — a variance
reduction of 8.7%, weak coupling at best, and it does not meet the bar committed in
advance. **The observation matches the artefact and not the mechanism.**

Note this is not a tension with the sign test. Lead/lag is a comparison of two *marginal*
distributions, which a shuffle preserves by construction and therefore cannot null; the
shuffle tests coupling, which is a different claim. Both readings are correct and they
answer different questions.

## What is retracted, and what is not

**Not retracted, not confirmed, for the second experiment running:** #52's mechanism
paragraph — that the premium acts on ancestry through the flowering-time polymorphism it
maintains — **stands exactly where #53 left it.** #54 did not test it either. #53 failed
because its instrument destroyed what it measured; #54 fails because its discriminator
and its artefact have the same signature.

**Nothing from #52 or #53 is overturned.** The HELD sweep above is new and stands on its
own.

## Next

The obstacle is now specific rather than general, which is progress. Two changes are
needed and neither is a re-run:

1. **A bounded per-seed statistic.** The mixed normalisation of A1 removed a selection
   bias and bought heavy tails; a per-generation binary — is the arm nearer B on ancestry
   than on the polymorphism at this generation? — is a proportion in [0,1], has no tail,
   and asks the same "which arrived first" question. Derivable from the dumped
   trajectories at zero compute cost.
2. **A design in which the two-step and the inertia artefact predict DIFFERENT things.**
   Lead/lag does not, which is the lesson here. A **pulse** does: switch the premium off
   and on again over varying durations. A stock responding directly to the premium is a
   low-pass filter of it; a cascade through the polymorphism adds a second lag and a
   distinguishable phase delay. Separating a one-stage filter from a two-stage one is a
   question about *dynamics*, not about levels, and inertia alone does not answer it.

Filed as #55.

Still open and untouched: why M2 reads 1.33 with no temporal structure (#52); the ~19%
higher-order concentration penalty (#49/#51); and #53's unexplained higher `bloomLineage`
in the forced cells (0.959/0.965 against 0.886/0.877) while ancestry collapsed.
