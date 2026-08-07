# Hybrids cause fusion; balance prevents exclusion — they are different levers

_2026-08-07. Closes the box left open by [fusion vs exclusion](2026-08-07-fusion-vs-exclusion.md)._

That run found that fused replicates both form hybrids and keep ancestry balanced, while
losing replicates do neither — and said plainly that it could not order them. The two are
correlated in every seed by construction: without gene flow imbalance grows unopposed,
and once imbalance runs away there is nothing left to hybridise with. **No observational
window can break that**, so this run intervenes.

## Design

Three manipulations at d = 8, a = 0.25, J = 2 replacements per generation, 24 seeds
(**23 founded**):

| arm       | what it does                                                                                                                                   |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **HYB**   | force gene flow — replace J recruits with real F1s built by crossing a pure-A with a pure-B parent using the model's own `gamete()`            |
| **BAL**   | force balance **without** gene flow — replace J majority-lineage recruits with same-lineage offspring of _minority_ parents. Creates no hybrid |
| **CLONE** | matched disturbance control — same replacement count, same `gamete()` calls, same construction, no gene flow and no rebalancing                |
| **NONE**  | untouched, and asserted bit-identical to `I.run()`                                                                                             |

Predictions declared before the run: hybrids upstream ⇒ HYB beats CLONE and BAL does not;
balance upstream ⇒ the reverse.

## The anchor caught a real bug before it became a result

Driving the generation loop from an experiment is the reimplementation this project has
been burned by once, so the NONE arm is asserted **bit-identical to `I.run()`** over every
history field. **It failed on the first attempt.** `I.run()` builds a fresh rng from the
seed _even when handed a `found` population_, so founding and the run consume separate
streams — while this loop was carrying the founding stream forward. That is a different
model, and it would have silently become the answer.

## The manipulations actually manipulated

| arm   | acted/gen | could not | hybrids anywhere | \|ancMean − 0.5\| |
| ----- | --------- | --------- | ---------------- | ----------------- |
| NONE  | 0.00      | 0.00      | 0.152            | 0.269             |
| CLONE | 35.00     | 0.00      | 0.141            | 0.251             |
| HYB   | **4.91**  | 30.09     | **0.728**        | 0.159             |
| BAL   | 34.09     | 0.91      | 0.212            | **0.162**         |

HYB raises hybrid frequency 5× over its control; BAL lowers imbalance. Both checks pass,
which is what licenses reading the outcomes below.

## The outcome: they are different levers

| arm     | HELD | FUSED  | one lost | fusion rate |
| ------- | ---- | ------ | -------- | ----------- |
| NONE    | 5    | 6      | 12       | 0.261       |
| CLONE   | 6    | 8      | 9        | 0.348       |
| **HYB** | 0    | **19** | 4        | **0.826**   |
| **BAL** | 10   | 11     | **2**    | 0.478       |

**Pre-declared contrasts:**

- **HYB vs CLONE: 0.826 vs 0.348, p = 0.0029.** Forcing gene flow causes fusion.
- **BAL vs CLONE: 0.478 vs 0.348, p = 0.555.** Forcing balance does **not** cause fusion.
- **CLONE vs NONE: p = 0.756.** The disturbance itself does nothing — the control that
  makes the other two readable.

**So hybrid formation is UPSTREAM and balance is not.** H1 is causal for fusion; the
ancestry balance that accompanied it in the previous run is a consequence, not the driver.

## ⚠️ But balance is not inert — it acts on a different outcome

BAL cuts exclusion from 9/23 to **2/23** (Fisher p = 0.035) while leaving fusion
unchanged. It converts _one lost_ into _HELD_: both lineages persist, distinct. The
increase in HELD alone (10 vs 6) is not significant (p = 0.353).

⚠️ **This contrast is POST HOC** — the pre-registration named fusion rate, not exclusion
rate. It needs a pre-registered replication before it is believed. Flagged because it is
the more interesting of the two findings: it is a coexistence result, and this project has
spent eight mechanisms failing to find one.

## What this does NOT establish

⚠️ **HYB could act in only 4.9 of 35 generations** (it needs both pure classes present,
and stops once hybrids dominate or a lineage is lost). The arms therefore differ in dose:
CLONE acted every generation, HYB in a seventh of them. This cuts _toward_ the conclusion
— less disturbance, larger effect — but the arms are not dose-matched and no
dose-response was run.

⚠️ **HYB's own reduction in exclusion is not significant** (4/23 vs 9/23, p = 0.189).

⚠️ **n = 23 seeds per arm**, one draw of 24 failing to found.

⚠️ Repo has no CI; the local run is the only evidence.
