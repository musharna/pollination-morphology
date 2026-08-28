# Pre-registration — a flowering season should SPREAD a fixed display, not MANUFACTURE more

**Date:** 2026-08-28 · **Status:** registered, locus not yet written
**Follows:** [`2026-08-25-evolving-width-result.md`](2026-08-25-evolving-width-result.md) (#47, NEGATIVE)
**Attacks:** the northstar at `ROADMAP.md:237` — can a minority advantage be DERIVED from
pollination rather than IMPOSED?

## The claim this registers against

#47 found that flowering width evolves **wider**, hard, at every slice count, and diagnosed the
cause as a **missing cost term**: "there is no cost to flowering longer. Duration is a free trait,
so selection maximises it." It then flagged the trap in its own remedy — adding a cost makes the
evolved width a statement about the cost coefficient, "which is the imposition this experiment was
built to escape, wearing a different hat."

**That diagnosis is wrong, and the trap is avoidable, because the defect is not an absent cost. It
is a conservation violation.**

`sim/ibm.js:1290` computes `base = allocWeights(...)` once per generation — a display share
normalised to sum to 1 over the population. `:1367` then re-offers **the same `base[i]` in every
slice that plant is in flower**:

```js
const w = base.map((b, i) => ringDist(blooms[i], t) <= halfOf(i) ? b : 0);
```

Nothing divides by the number of slices occupied, or by width. A plant's season-integrated floral
display is therefore `base[i] × k_i`, where `k_i` is the number of slices it attends. A plant in
flower all season does not merely *have more opportunities* to be visited — it **manufactures S
times the floral display** of a plant flowering once, out of nothing. Both fitness paths consume
this uncapped: maternal success is raw `received[j]` (`:1490`) and siring is raw `T[i][mother]`
(`:1698`).

**This is not a cost that is missing. It is a resource that is being created.**

## Why the distinction decides the experiment

A cost term is a new free parameter and it leaves the duplication in place, taxing it. The evolved
width then reports where the cost curve crosses a benefit curve that is itself an artefact — #47's
own objection, and it is correct.

Conservation adds **no parameter**. `base` is already a normalised share; the constraint is that
the sum over slices is invariant, which is a statement that a plant has a finite reproductive
investment, not a coefficient anyone chose. It is the same kind of object as "placement must never
be a gene" in this roadmap's standing constraints: a structural fact about the model, not a dial.

## The measurement that already discriminates

Ratio of focal pollen flow at width 1.0 to width → 0, against a saturated (width 1.0) resident
population, from `tools/width-gradient.js`:

| S | flow(w=1.0) | flow(w→0) | measured ratio | duplication predicts |
| -: | -: | -: | -: | -: |
| 8 | 3494.2 | 423.3 | **8.26** | 8 |
| 16 | 3581.5 | 216.8 | **16.52** | 16 |

Under uniform `allocWeights` every plant present in a slice offers `1/n`, so every occupied slice
holds 30 plants and the share is `1/30` regardless of width; a plant attending `k` slices collects
`k · (per/S) · (1/30)`, giving a ratio of exactly **S**. A missing cost term predicts nothing about
`S`. Duplication predicts `S` and gets it, at two values, with the **same +3.3% residual** at both —
a systematic multiplicative offset, not noise, and one this pre-registration does not claim to
explain.

## What is being built

`PH.conserveDisplay`, a boolean, **default off**. When on, a plant's per-slice display is
`base[i] / k_i` where `k_i` is the number of slices in which it is in flower, so that
`Σ_slices display_i = base[i]` exactly, invariant in width **and in S**.

⚠️ **Off means the code path does not run** — that, and not an argument that the arithmetic is a
no-op, is what keeps every earlier result bit-identical. The three draws in `sim/carryover.js`
(`:295`, `:331`, `:362`) are all scale-invariant in exact arithmetic, so an equal-width population
*should* be unaffected even with the flag on; that is a property to **measure**, not to assert,
because `r = rng() * acc` compared against `cum[i]` can flip at a boundary under rounding.

## Registered predictions — analytic point values, not directions

With residents at width 1.0 (so `k_R = S`) and uniform allocation, a focal plant occupying `k_f`
slices collects, under conservation:

```
visits(k_f) ∝ k_f · (1/S) · [ (1/k_f) / ((1/k_f) + 29/S) ]  =  k_f / (S + 29·k_f)
```

so the wide-to-narrow ratio collapses from `S` to **`(S + 29)/30`**.

| S | ratio now | **P1: ratio under conservation** |
| -: | -: | -: |
| 8 | 8.26 | **1.233** |
| 16 | 16.52 | **1.500** |

**P2 — the full S=8 gradient**, relative to `k_f = 8`, is monotone but nearly flat with strong
diminishing returns: `k_f` = 1, 2, 4, 6, 8 → **0.811, 0.909, 0.968, 0.989, 1.000**.

**P3 — equal-width invariance.** With every plant at the same width, turning conservation on
changes no reported number, because it divides every plant's display by the same constant and all
three draws are scale-invariant. **This is the prediction that protects #37**, whose arms are all
fixed-width.

⚠️ **Tolerance: ±5% multiplicative**, inheriting the unexplained +3.3% residual above. A miss
outside that band means the share model in this document is incomplete, and it reports as that —
not as a bug in the implementation and not as a surprise about biology.

## What would refute the whole framing

- **P1 lands near `S` rather than near `(S+29)/30`.** Then the duplication is not what drives the
  gradient and the missing-cost reading is back on the table.
- **P3 fails.** Then conservation is not neutral on equal-width populations, every fixed-width
  result in the project is entangled with it, and #37 has to be re-run rather than protected.
- **The residual after conservation is still large** (say > 2× at S=8). Then something other than
  duplication dominates and this change is a partial fix wearing a causal label.

## What this does NOT claim

It does **not** claim narrow flowering will now evolve. Conservation removes a manufactured reward;
it does not add a reason to be narrow. The residual pro-wide bias it leaves is **H3, and it is
separable and expected**: the per-slice visit budget is `per/S` **regardless of how much display is
present in that slice**, so a thinly-occupied slice pays the same as a crowded one and attending
more slices still pays a little.

⚠️ That residual is not a defect to patch in the same change. It is the model's existing,
long-committed assumption, and it is exactly where the northstar lives: **fixed per-slice effort
makes empty time valuable, which is negative frequency-dependence on flowering time arising from
pollination rather than imposed on it.** The duplication has been swamping it by a factor of S.
Whether that NFD is strong enough to deliver assortment and HELD is the NEXT experiment, and
registering it here would be registering a hypothesis about a measurement that does not exist yet.
