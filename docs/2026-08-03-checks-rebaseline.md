# The four pre-v1 checks, re-based — one finding was about the wrong organ

**Date:** 2026-08-03 · **Code:** `experiments/checks.js`, `experiments/carryover.js` · Completes the
metric switch begun in [the re-baseline](2026-08-02-continuous-metric-rebaseline.md) and applies the
matched-N correction from [pool scaling](2026-08-02-pool-scaling.md).

These were the last two files still scoring placement with the retired 24-bin histogram. Their
published claims had never been re-measured. Three of the four checks hold; the corrections are to
the size of one effect, and to a finding that was inferred rather than measured.

## 1. Reciprocal direction — the conclusion strengthens, its one exception dies

The check asks whether herkogamy makes pollen flow one way and not back. It concluded "no
directional isolation, symmetric within noise", with one survivor: at 60° the sign was consistent
across all seven seeds.

**That survivor is gone.** On the continuous metric:

```
     30deg  mean +0.0127  range [-0.032, 0.055]  4/7 seeds positive   <- SIGN FLIPS, noise
     45deg  mean +0.0194  range [-0.017, 0.069]  5/7 seeds positive   <- SIGN FLIPS, noise
     60deg  mean +0.0125  range [-0.026, 0.030]  6/7 seeds positive   <- SIGN FLIPS, noise
```

against the previously published 5/7, 6/7 and **7/7**. All three thetas are noise. The write-up had
already hedged the 60° result — "one survivor from three thetas... should not be treated as a
positive finding without a proper multiple-comparison correction" — and the better metric removes the
need for the hedge. **v1's symmetric-overlap design consequence is now unqualified.**

## ⚠️ 1b. The "unlooked-for finding" was inferred from a rounding artefact, and it is wrong

The original recorded:

> herkogamy past ~0.15 in depth separation drives stigma contact to **zero outright** — the stigma
> stops touching the animal at all.

That was never measured. It was **inferred from overlaps that printed as `0.000`** — the same
histogram rounding that produced the retired τ→0 framing. Contact rate is a field sitting right on
the distribution object. Printed:

```
    separation   anther contact   stigma contact
         0.000           1.0000           1.0000
         0.050           1.0000           1.0000
         0.150           1.0000           0.6667
         0.270           0.8333           0.8083
         0.400           0.0000           0.8250   <- ANTHER lost
         0.530           0.0000           0.4417   <- ANTHER lost
```

**At separation 0.270 the stigma contacts 81% of visits.** Both organs are still touching, at a
separation where overlap has already fallen ~23 orders of magnitude. So that collapse is the two
organs contacting at **different places** — herkogamy working exactly as intended — not contact
failure. Nor is stigma contact monotonic: it dips to 0.67 at 0.150 and recovers to 0.83.

Contact loss is real, but it happens to the **anther**, which retreats out of the visitor's reach as
the separation opens. The claim named the wrong organ, at the wrong separation, for the wrong reason.

The bound v1 relies on still exists, so nothing downstream breaks — but it is an anther-reach bound,
not a stigma-contact one, and it bites past ~0.4 rather than ~0.15.

**The general fault:** an unmeasured quantity was inferred from a displayed zero. The measurement
cost one line.

## ⚠️ 2. Body plans — the effect is real and about half the size it was published at

Check 2's whole question is a comparison _across_ body plans. The contact filter rejects a very
different fraction per animal, so each plan was scored on whatever pool it happened to accept — 153
to 309 candidates. **The packing ceiling climbs steeply with candidate count**, so those ratios were
never comparable to each other.

The previous write-up spotted the variation and dismissed it: _"Pools differ in size across body
plans (153–309), and while no ceiling appeared pool-limited..."_ — a dismissal the pool-scaling
measurement has since falsified. Every arm is pool-limited at these sizes.

Drawing from 900 candidates and truncating every plan to a common N:

```
  accepted out of 900 drawn: default 688, small slender 337, large robust 494, long slender 423
  every plan scored at the common N = 337

  body plan          rejected   s sd     L1-free   L2    ratio
  default bee           24%    0.0442      17      42    2.47x
  small slender         63%    0.0553      13      31    2.38x
  large robust          45%    0.0324      25      53    2.12x
  long slender          53%    0.0310      18      37    2.06x
```

|                      | published  | re-based       |
| -------------------- | ---------- | -------------- |
| range across plans   | 2.06–3.00× | **2.06–2.47×** |
| body-plan modulation | ~1.5×      | **1.20×**      |

**The advantage still clears 2× on every animal**, and the coarse pattern survives — the two compact
plans sit above the two elongated/large ones, and a longer or larger body gives the 1-D arm more room
to spread along (L1-free 17 → 25 on large robust), so the second dimension is worth less.

But **"body plan moves the ceiling by ~1.5×" was inflated by the pool-size confound and should be
quoted as ~1.2×.** Most of the apparent spread across animals was the spread in how many candidates
each animal's pool happened to contain.

## 3. Precision alone — unchanged on both metrics

```
   tau    precision-only   position-only [POSITIVE CONTROL]
   0.05        1                3
   0.2         2                4
   0.5         3                6
```

Against the published 1 / 1 / 3 and 3 / 4 / 7. **Precision is still a modifier, not a niche axis**,
and the positive control still rules out an inert harness. This was the most exposed claim in the set
— it is specifically about fine differences in repeatability, the regime where the histogram
saturated — and it survives its third independent re-measurement.

## 4. Stigma side — matched, and the small gap reverses

```
  both organs at the common N = 625
  anther placement    L1-free 19   L2 53   2.79x
  stigma placement    L1-free 17   L2 49   2.88x
```

Published: 3.00× and 2.67×, at pools of 309 and 285. At matched N the stigma is marginally _ahead_,
and the difference is nothing. **One routine still serves both organs** — a conclusion that is now
stronger, since the apparent 0.33× gap was mostly the 24-candidate pool difference.

**A within-file confirmation of the scaling law:** the same bee, same organ, same arm scores 2.47× at
N = 337 in check 2 and 2.79× at N = 625 in check 4. Nothing about the biology changed between those
two lines — only the candidate count.

## carryover.js — two constants standing in for computations

The histogram appeared only in a descriptive statistic, but re-basing it exposed the contrast it fed:

```
  12 unevolved species, mean heterospecific overlap 5.03e-2
  the evolved community, same metric and same code path: 7.95e-6  (6328.9x separated)
```

The second number was **hardcoded as `0.000`** — a constant standing in for a computation, and a
rounding artefact of a metric that could return exact zeros. The contrast it was drawing is real and
large (6300×), but it was not a measurement.

The same file's part B carries the warning that catches this, twenty lines earlier: _"A claim stated
as a constant cannot track the computation it describes."_ It was written after that exact error was
caught in the line above it — and the file committed it twice more.

The second instance: _"The species the limit does not recover sat at abundance 0.004."_ Derived now:

```
  Mean-field abundance of the 1 species the limit does NOT recover: 0.0038
  against a survivor range of 0.0055 to 0.2497 and an extinction floor of 0.002.
  Every lost species was rarer than every survivor.
```

**This one was right** — 0.004 ≈ 0.0038, and it is strictly the rarest. But it was right by luck: it
had not been re-measured since the evolution loop changed metric. It now carries a branch that
reports the opposite finding if carryover ever stops removing the marginal tail.

## What this run cost, and the pattern it confirms

Three published claims moved and one was retracted, from files nobody suspected — they were on the
list only because a grep for the retired metric found them.

Every correction ran the same direction the last two passes ran: **toward the control, and toward
smaller effects.** Body-plan modulation 1.5× → 1.2×. Stigma-side gap 0.33× → −0.09×. Directional
asymmetry 1-of-3 surviving → 0-of-3. The mechanism is the one already named — a comparison is set up
once and inherited, while attention goes to the measured arm — and it now has a second signature:
**an effect size is inflated whenever the thing being compared also varies in how much data it got.**

The check-2 confound is the third appearance of one bug. `ablation.js`, `precision-audit.js` and now
`checks.js` each compared arms at different candidate counts, each was found separately, and each
time the file looked fine in isolation. It is a property of how the comparisons are written, not of
any one file — the pool size is set where the candidates are generated and read where the ratio is
taken, and nothing makes the two agree.
