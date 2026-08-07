# Pre-registered replication: does forced balance really prevent exclusion?

_2026-08-07. Replicates the post-hoc finding in [hybrids or balance](2026-08-07-hybrids-or-balance.md) (#29)._

## Why this exists

#29 intervened and found that forcing ancestry balance without gene flow (`BAL`) cut
exclusion from 9/23 to 2/23, Fisher p = 0.035 — converting `one lost` into `HELD`. That
is a **coexistence** result, and this project has spent eight mechanisms failing to find
one, which is exactly why it must not be believed on the evidence that produced it:

- the pre-registration in #29 named **fusion rate** as the outcome, not exclusion rate,
  so the contrast was **post hoc**;
- it ran at a single dose (J = 2) with **no dose-response**;
- it was scored on the same seeds that generated the hypothesis.

## ⚠️ PRE-REGISTRATION — written and committed before the run

**Primary outcome: exclusion rate**, the fraction of replicates ending `one lost`.

**Primary contrast: BAL vs CLONE at J = 2**, one-sided (BAL < CLONE), Fisher exact,
α = 0.05. The direction is predicted from #29, which is what licenses one-sided; the
two-sided p is reported alongside regardless.

**Secondary, declared now:**

1. **Dose-response.** Exclusion rate falls monotonically across BAL at J = 1, 2, 4.
   Each dose has its own dose-matched CLONE control.
2. **Fusion rate is expected to show NO effect** (#29: p = 0.555). A replication that
   moved fusion instead of exclusion would refute the "different levers" reading.
3. **Manipulation check.** \|ancMean − 0.5\| falls monotonically across BAL doses. An
   arm that did not shift composition is inert and its outcome means nothing.

**Seeds: 101–132 (n = 32), disjoint from the 1–24 used in #29.** The hypothesis was
generated on those draws and must not be tested on them.

**What would refute this:** BAL vs CLONE at J = 2 failing to reach one-sided p < 0.05 on
exclusion rate. A non-monotone dose-response weakens but does not by itself refute, and
will be reported as measured either way.

## Method

Runs the **merged experiment from #29 unchanged**, driven by its existing `HB_J`,
`HB_ARMS` and `HB_SEEDS` knobs plus one addition, `HB_SEED0`, so it can draw fresh
seeds. No generation loop is written for this run — the loop is the one already asserted
bit-identical to `I.run()`, and re-implementing it here is precisely the failure this
project has recorded.

⚠️ `HB_SEED0` defaults to 1, so every number in #29 reproduces unchanged. The anchor gate
asserts that.

## Results

**The regression arm reproduces #29 exactly** — old defaults give NONE 5 HELD / 6 FUSED /
12 one lost, the same row. The seed-offset patch is inert.

28 of 32 seeds founded per arm.

### Primary outcome: exclusion rate

| dose                | BAL              | CLONE             | one-sided p | two-sided p |
| ------------------- | ---------------- | ----------------- | ----------- | ----------- |
| J = 1               | 12/28 (0.429)    | 15/28 (0.536)     | 0.297       | 0.593       |
| **J = 2 (primary)** | **5/28 (0.179)** | **16/28 (0.571)** | **0.0026**  | 0.0052      |
| J = 4               | **0/28 (0.000)** | 14/28 (0.500)     | 0.00001     | 0.00001     |

**The pre-registered primary passes at p = 0.0026**, against a declared α of 0.05. At
J = 4 exclusion is eliminated outright: not one replicate in 28 lost a lineage.

### Secondaries, all three as declared

1. **Dose-response is monotone** — 12 → 5 → 0. Cochran–Armitage trend **z = −3.85,
   p = 0.00006**.
2. **Fusion rate is unmoved**: BAL 0.286 / 0.321 / 0.250 across doses, flat. The
   "different levers" reading survives — BAL acts on exclusion, not on fusion.
3. **Manipulation check passes**: \|ancMean − 0.5\| falls 0.239 → 0.214 → 0.114 across
   BAL doses while CLONE sits at ~0.28 throughout.

⚠️ **J = 1 is not significant** (p = 0.297). The effect needs dose; the smallest one does
not deliver it. Reported rather than dropped.

⚠️ **BAL creates no gene flow, confirmed rather than assumed**: hybrids-anywhere is
0.120 / 0.080 / 0.110 for BAL against 0.109 / 0.078 / 0.089 for CLONE — indistinguishable.
Whatever prevents exclusion here, it is not hybridisation.

## ⚠️⚠️ The objection this result has to survive, and it is mine

**BAL is a demographic subsidy to the minority, and that is uncomfortably close to the
per-lineage quota this project already ruled out as question-begging.** The
density-dependence run (#25) rejected giving each lineage its own quota on the grounds
that it would _assume_ coexistence rather than derive it. BAL does not fix frequencies at
50/50 — it replaces J recruits per generation with minority-lineage offspring — but at
J = 4 that is ~13% of the population redirected toward whichever lineage is losing, every
generation. Imposed negative frequency-dependence preventing competitive exclusion is
close to a restatement of what negative frequency-dependence _means_.

So the honest reading is narrower than "coexistence found":

- **Tautological part:** impose a minority advantage demographically, and the minority
  stops being lost. That much was arguably guaranteed.
- **NOT tautological, and the actual content:** the rescued lineages **stay distinct**.
  Fusion rate does not move at any dose, hybrid frequency does not move, and HELD rises
  8 → 14 → 21. A demographic subsidy could just as easily have produced merger, since it
  keeps both lineages present and available to interbreed. It does not.
- **Also not tautological:** it locates the exclusion in **demography rather than
  pollination**. Placement-mediated mating is untouched by BAL, and exclusion still
  vanishes.

**What this therefore does NOT show is a coexistence mechanism the model produced on its
own.** The next question is whether a minority advantage can be _derived_ from pollination
rather than imposed by fiat — that is the experiment this result argues for, and it is
the one that would actually close roadmap C's gap.

## What else this does NOT establish

⚠️ The J-dose is in units of individuals per generation out of N = 30; no attempt was made
to express it as a selection coefficient, so "13% of the population" is a description of
this model, not a general threshold.

⚠️ 28 of 32 seeds founded per arm; four draws failed to reach the target separation.

⚠️ Repo has no CI; the local run is the only evidence.
