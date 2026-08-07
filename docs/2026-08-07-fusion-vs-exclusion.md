# What decides fusion vs exclusion — and the measure that turned out to be redundant

_2026-08-07. Closes the box left open by [the gap-occupancy run](2026-08-05-gap-occupancy.md)._

The gap-occupancy run established that intermediates arise, and that they arise before
ancestry variance collapses. It also reported, rather than buried, that this cannot be
the whole story: `one lost` replicates fill the gap too, peaking at 0.43–0.67. Gap
occupancy is **necessary but not sufficient**, and nothing identified the remainder.

At d = 8 under strong rare-bias (a = 0.25) the same parameters give all three outcomes
across seeds, so the difference cannot be a parameter. 40 seeds, of which **38 founded**
(two draws failed to reach the target separation and are excluded by construction, not
by choice): **8 HELD / 12 FUSED / 18 one lost**.

## Three hypotheses, declared before the run

| #   | mechanism                                                                                                                                                        | discriminating column                                             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| H1  | **parentage** — the gap fills in every outcome, but only fusion fills it with _hybrids_; elsewhere it holds pure-lineage plants, i.e. geometry without gene flow | hybrid-gap occupancy separates where plain gap occupancy does not |
| H2  | **race** — whichever lineage drifts to minority first is excluded                                                                                                | early \|ancMean − 0.5\| separates                                 |
| H3  | **founding** — the outcome is set before generation 0                                                                                                            | a generation-0 quantity separates                                 |

## H3 is refuted: the outcome is not set at founding

| generation-0 quantity | HELD  | FUSED | one lost | p     |
| --------------------- | ----- | ----- | -------- | ----- |
| realised separation   | 8.011 | 7.995 | 8.059    | 0.290 |
| founding spread       | 3.997 | 3.984 | 4.055    | 0.127 |
| founding ancVar       | 0.250 | 0.250 | 0.250    | 1.000 |

Nothing measurable at founding predicts the outcome. The dynamics are doing the work.

## Both dynamical hypotheses have signal (window 0..8, pre-resolution)

Mean ancVar at generation 9 is **0.577 of founding**, so the window is measured to be
pre-resolution rather than assumed to be.

| predictor             | HELD  | FUSED | one lost  | F − L  | p          |
| --------------------- | ----- | ----- | --------- | ------ | ---------- |
| gap occupancy         | 0.000 | 0.060 | 0.005     | 0.055  | 0.0071     |
| — of which **hybrid** | 0.000 | 0.047 | **0.000** | 0.047  | **0.0007** |
| — of which pure       | 0.000 | 0.013 | 0.005     | 0.008  | 0.199      |
| hybrids anywhere      | 0.000 | 0.095 | **0.000** | 0.095  | **0.0007** |
| \|ancMean − 0.5\|     | 0.125 | 0.091 | 0.269     | −0.178 | 0.0019     |
| minority fraction     | 0.375 | 0.410 | 0.387     | 0.023  | 0.313      |

The gap decomposes exactly as H1 predicted: the **hybrid** component carries the signal
(p = 0.0007) and the **pure** component does not (p = 0.199). And H2 holds too — losing
replicates run a much larger early ancestry imbalance (0.269 vs 0.091, p = 0.0019).

⚠️ **In `one lost` replicates the hybrid count is EXACTLY ZERO** through generation 8 —
not small, zero. That clean separation is what the statistics are reading.

## ⚠️⚠️ The control fails in the window where the signal lives

PART B permutes ancestry labels within each generation. It destroys the parentage link
and nothing else — plain gap occupancy is arithmetically untouched. Hybrid-gap occupancy
should lose its discrimination, or it was never reading parentage.

| window | measure              | FUSED | one lost | p                               |
| ------ | -------------------- | ----- | -------- | ------------------------------- |
| 0..4   | hybrid-gap, shuffled | 0.005 | 0.000    | 0.399 ✅ control passes         |
| 0..8   | hybrid-gap, shuffled | 0.037 | 0.000    | **0.0020** ❌ **control fails** |

**The signal survives destruction of the thing it was supposed to measure.** The reason
is visible in the table above: `one lost` replicates contain no hybrids _at all_, so
there is nothing for a permutation to move, and hybrid-gap occupancy stays zero however
the labels are shuffled. The measure is reading **whether hybrids exist**, not **where
they are**.

The corroborating tell was in PART A the whole time: hybrid-gap and hybrids-anywhere
return the **identical p-value (0.0007)** despite hybrid-gap being a strict subset. Two
measures that agree to four decimal places on a permutation test are one measure.

**So the spatial claim is not established.** What is established is weaker and simpler
than the hypothesis I wrote: fusion is predicted by hybrids **forming at all**, and the
gap-specific framing adds nothing. The 0..4 window's control passes, but that is the
window where the signal is weak — reporting only that one would be choosing the
criterion after seeing the data.

## What this does NOT establish

⚠️ **H1-reduced and H2 are not separated.** "Hybrids form" and "ancestry stays balanced"
may be one event read two ways: with no gene flow, imbalance grows unopposed. This run
cannot say which is cause and which is consequence.

⚠️ **PART D is uninterpretable and was flagged in advance.** Giving each replicate a
window ending at its own resolution produces window lengths of 31.1 / 15.5 / 10.0
generations for HELD / FUSED / one lost, so a longer-surviving replicate simply has more
generations in which to accumulate hybrids. Its p = 0.0000 is an exposure confound, and
is reported rather than quoted.

⚠️ **Group sizes are small by construction** — the arm was chosen _because_ it splits.

⚠️ **No new unit tests ship with this run**, unlike the last one. The two experiment-local
helpers are covered by the anchor gate (per-plant membership is asserted equal to
`I.gapOccupancy` on 35 real traced clouds; the hybrid classifier is checked in both
directions). Promoting `gapMembers` into `sim/ibm.js` beside `gapOccupancy`, with tests,
is the follow-up.

## Anchor gate

1. traced model still reproduces the pre-`allocExponent` golden — ok
2. per-plant membership == `I.gapOccupancy` on 35 real clouds — ok
3. classifier: pure founders 0/4 hybrid, F1-like 4/4 hybrid — ok
4. ancVar at generation 9 is 0.556 of founding — window measured unresolved

⚠️ Repo has no CI; the local run is the only evidence.
