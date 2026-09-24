# Executor brief: card 1 under the hand-set founding — the 30-seed null, and the stall-fixture sentence.

Repo `/home/<user>/pollination-morphology`, master (after `c3ad780`). Context: M2's re-measurement
(`docs/2026-09-13-northstar-null-tables.md`, last section) found that under the hand-set recipe card 1's
control (t4 s16) reads 2/24, ratio 1.167, and random-mating nulls t8 s4 0.592 / t4 s4 0.590 fall BELOW the
0.603 edge. Card 4 still works. Spec: §4 trigger/edge rules (edges = most extreme null seed, rounded
outward via `tools/northstar-null-tables.js edges`), §9 M2 row last sentence.

1. Extend the tool (`card14hand` or a sibling mode) to run card 1's statistic under the hand-set recipe,
   seeds 1–30, BOTH targets, placement-mediated AND `randomMating` null, page configuration; also card 4's
   hybrid-generation count on the same runs. Output rows in the doc's format; commit tool + regenerated
   section (never hand-typed).
2. Derive the hand-set edges with the same outward-rounding rule. Report: card 1's null edge; how many
   placement-mediated seeds clear it; whether ANY clean positive control exists (a seed that clears it
   with its own null FUSED). If the null reaches every placement-mediated value (no separation), say
   card 1 has no edge under hand-set founding.
3. Card 4 under hand-set: confirm null 23/24 in 30/30 and list the placement-mediated seeds at 0.
4. Spec edit (`docs/superpowers/specs/2026-09-12-northstar-design.md`): the stall fixture runs at the
   LEVEL configuration, where card 1 is grey ("no edge"); fix §4's precedence paragraph and the M2 row
   to say card 1 `grey`, card 4 `closed`, 2/3/5/6 `grey` (matching what M2 shipped). Add a short
   "hand-set founding" paragraph to the card-1 row with the new numbers from step 2 and what they mean
   for removing the `d` switch — do NOT remove the switch and do NOT change any page code.
- Branch `card1-hand-null`; no push/merge; no attribution. Suite `node --test tests/` green (background,
  > 3 min). Final report: SHAs, the 30-seed tables' key numbers, the edge(s), the verdict on card 1.
