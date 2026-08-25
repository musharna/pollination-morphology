# Result — a narrow flowering season does NOT evolve. It is selected against.

**Date:** 2026-08-25 · **Status:** run, NEGATIVE · **Model version:** `1a43e7c`
**Pre-registration:** [`2026-08-25-evolving-width-prereg.md`](2026-08-25-evolving-width-prereg.md), written before the locus existed
**Run:** jobd 3529, 33 min · 12 seeds · 30 plants · 35 generations · `S ∈ {8, 16, 32}` · `widthMut` 0.03
**Raw output:** `_scratch/evolving-width-full.txt` · re-run with
`EW_SEEDS=12 EW_SLICES=8,16,32 node experiments/evolving-width.js`

## The answer

The northstar at `ROADMAP.md:219` asks whether a minority advantage can be **derived** from
pollination rather than **imposed**. Temporal assortment (#37) is the project's only surviving
positive, and it depends on a narrow flowering season set by a global constant. Making that
constant a heritable per-plant locus was the one move on the board that could convert it into a
result.

**It converted it into a refutation.** Width does not evolve narrower. It evolves _wider_, hard,
at every slice count tested, and the effect is large and unambiguous.

|   S | treatment | shuffled | treatment − shuffled (t, n=12) | bloomLineage Δ         |  HELD |
| --: | --------: | -------: | ------------------------------ | ---------------------- | ----: |
|   8 |     0.915 |    0.493 | **+0.422 [0.292, 0.551]**      | +0.001 [−0.026, 0.028] | 0.000 |
|  16 |     0.915 |    0.469 | **+0.445 [0.323, 0.567]**      | −0.004 [−0.085, 0.078] | 0.000 |
|  32 |     0.929 |    0.485 | **+0.444 [0.310, 0.578]**      | −0.020 [−0.097, 0.057] | 0.000 |

Founders start at width ≈ 0.503. The treatment climbs to ≈ 0.92; the shuffled control, which has
identical mutation and clamping and differs only in whether a plant's width is tied to its own
fitness, stays at ≈ 0.48. The gap is the selection.

### Against the four registered conditions

1. **Evolved width below the shuffled arm** — ❌ **NO**, and the interval excludes zero _in the
   opposite direction_ at every S. This is not a failure to detect an effect; it is a large
   effect with the wrong sign.
2. **S-invariance** — ✅ **YES.** `CV(width) = 0.0086` against `CV(width·S) = 0.6630`: width is by
   far the steadier quantity across S, so the outcome is not the slice grid talking. The control
   the design existed for passed — and it passed for the outcome the design did not expect.
3. **`bloomLineage` falls with it** — ❌ **NO.** All three intervals span zero. No assortment was
   delivered, which follows from (1): a population at width 0.92 overlaps almost completely.
4. **HELD rises against fixed-wide** — ❌ **NO**, and the interval is **degenerate**: HELD is
   0.000 in both arms at every S, so every paired difference is 0 and the printed
   `[0.000, 0.000]` is a statement about the sample being constant, not a precision.

Failing (1) while passing (2) is not the artefact case the pre-registration anticipated. It is a
cleaner negative than that: the grid is not responsible, so the direction is real.

## Why — measured before the run finished, not inferred after

The pre-registration's P2 reasoned that narrowing would stop short of zero because "the visit
budget is **split** across slices, not duplicated, so a plant absent from a slice simply forgoes
it". Every clause of that is true. **The conclusion does not follow.**

`sim/carryover.js:295-341` builds the pollinator's cumulative choice array from the abundances it
is handed and draws `r = rng() * acc`, where `acc` sums only the plants **in flower in that
slice**. The draw is renormalised over whoever is present. So skipping a slice costs you its
visits, and attending one costs you nothing. **Flowering longer is a free lunch in this model.**

`tools/width-gradient.js` measures the gradient directly on a fixed population — one focal
plant's width varied, everyone else's held, its pollen flow read off the transfer matrix:

```
  focal width    vs wide resident (1.0)   vs narrow resident (0.12)
  0.02                     423.3                     2747.2
  0.06                     423.3                     2747.2
  0.12                     423.3                     2747.2
  0.125                    423.3                     2747.2
  0.25                    1338.2                     5598.8
  0.50                    2208.2                     8333.8
  0.75                    3074.5                    11141.0
  1.00                    3494.2                    12946.3
```

Monotone at both resident widths, with no interior optimum. A wide mutant invading a narrow
population takes **4.7×** the pollen flow of a resident. P1 predicted the wrong sign, and the
model says so at the level of one generation's transfer matrix — no evolutionary run required.

⚠️ **And the grid artefact appears in the gradient itself.** The first four rows are
byte-identical, because below `width = 1/S` every width puts a plant in exactly one slice. Flow
steps with the number of slices occupied, not with width. The staircase registered as a hazard
for the evolved mean turns out to be visible one level lower down.

## ⚠️⚠️ The finding this run produced that was not on the list

**The #37 positive is a property of the disjoint-bin regime, and it degrades when the bins
overlap.** The fixed-narrow arm is the only cell in the whole sweep with any HELD at all:

|   S |    1/S | `WIDTH`=0.12 covers | fixed-narrow HELD |
| --: | -----: | ------------------: | ----------------: |
|   8 | 0.1250 |             1 slice |         **0.417** |
|  16 | 0.0625 |           ~2 slices |         **0.417** |
|  32 | 0.0313 |           ~4 slices |         **0.083** |

At S=8 and S=16 the narrow arm holds two lineages in 5 of 12 seeds. At S=32, where a plant of the
same width is in flower in about four slices at once and genuinely overlaps its neighbours, that
collapses to 1 of 12. The published #37 result was run at S=8.

This is mechanistically coherent rather than alarming — more overlap means less assortment means
less retained ancestry — but it converts the slice-grid note from a caveat about _description_
into a measured **scope condition**: #37 holds in the regime where flowering windows are
effectively disjoint, and weakens as they stop being. Anything quoting +0.289 should quote
`SLICES = 8` beside it.

## What this closes, and what it opens

**Closed.** Temporal assortment cannot be derived from pollination in this model. The route is
spent, and it is spent for a reason that is stated rather than mysterious: there is **no cost to
flowering longer**. Duration is a free trait, so selection maximises it and the assortment
disappears. #37 remains true and remains imposed.

**Open, and this is the honest next question.** Real flowering windows are not free — they cost
resources, maintenance, and exposure to herbivory and floral antagonists, and that cost is the
reason real plants have bounded seasons at all. The experiment as registered asked whether
pollination alone selects for a narrow season. It does not, and it cannot, because the trade-off
that makes season length a trade-off is absent from the model. Adding a duration cost is not a
patch to rescue a negative — it is the missing biology, and #17 (cost of prolonged presentation)
already established that this project models presentation costs elsewhere.

⚠️ **But adding one would make the answer partly a choice of parameter.** With a cost term, the
evolved width is set by where the cost curve crosses the flow curve above, and the flow curve is
known: it is roughly linear in slices occupied. So an evolved narrow season would be a statement
about the cost coefficient, not about pollination — which is the imposition this experiment was
built to escape, wearing a different hat. Any follow-up has to say in advance what would make the
cost non-arbitrary, or it is #37 again with extra steps.
