# Card 1 under hand-set founding: no statistic separates (2026-09-24)

**Question.** Card 1 ("hybrids received less than the rest of the field") opens below 0.603, the
floor of its random-mating null under `foundTwoLineages` founding. Under the page's hand-set
founding that null reaches 0.344, below every placed run (spec, card-1 cell). Is there a receipt
statistic that separates placed from null under hand-set founding?

**Answer: no.** The card stays grey under hand-set founding and its text says so.

**Method.** `node tools/card1-hand-set-diag.js`: the `tools/northstar-null-tables.js` `run()`
loop with `hand: true`, page configuration (N 18, 24 generations, siteN 90), seeds 1–30 at
targets 4 and 8, 58 builds, each run as the random-mating null and placed. It reproduces
the tables' 0.344 (target 4 seed 20, null) and 0.577 (target 8 seed 25, placed).

| statistic | lowest null | lowest placed | separates |
|---|---|---|---|
| last generation with both sets (the card's) | 0.344 | 0.577 | no |
| pooled over every generation with both sets | 0.156 | 0.745 | no |
| median over those generations | 0.633 | 0.704 | no |

- The low null values are not small-sample noise: the 0.344 run's last generation holds 17
  hybrids. The placed 0.577 rests on **one** hybrid.
- Pooling removes that run's low value (it pools to 1.176), but other null runs pool lower
  than any placed run.
- Paired by seed, placed pooled over its own null's pooled is below 1 in 19 of 27 seeds
  (median 0.913, lowest 0.687): an average geometric cost near 9%, too small against the
  seed-to-seed spread to open a card on a single run.

Statistics were chosen before looking (three, each naming a hypothesis for the 0.344: small
numbers, founding, generation choice); none was tuned.
