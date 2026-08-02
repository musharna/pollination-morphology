# The metric re-baseline — and the two artefacts it exposed on the way

**Date:** 2026-08-02 · **Code:** `sim/packing.js`, `sim/evolve.js`, `experiments/ablation.js`,
`experiments/tau-zero-ceiling.js`, `experiments/v1.js` · Closes the switch-over left open by
[the L1-precision decision](2026-08-02-l1-precision-decision.md).

## What was outstanding

The previous session built a continuous overlap metric, validated it against the histogram where the
histogram worked, and then **did not switch anything over to it.** The ablation, the ceiling and the
evolution loop all still scored placement with a 24-bin histogram that saturates below one bin width.
This closes that.

## Scope: the loop, not just the ablation

The written next step was "switch the ablation's default metric". That would have been a **tripwire
removal**. `sim/evolve.js` scored placement with the same histogram, and L1's precision is heritable
now and evolves to sSd 0.0077 against a 0.0556 bin — so the evolution loop was saturating too.

Measured directly, two clouds half a bin apart:

```
  sSd      histogram   continuous
  0.0670     0.767        0.767     <- agree at coarse precision
  0.0443     0.729        0.705
  0.0200     0.554        0.486
  0.0077     0.475        0.075     <- 6x apart at the precision L1 evolves to
```

The histogram over-states overlap **six-fold** for tight placements while being accurate at L2's
median spread. The bias is therefore asymmetric, it suppresses the tight arm, and it flatters L2 —
in the loop as much as in the ablation. Fixing only the ablation would have left the project's own
headline resting on it.

`sim/` is now entirely on the continuous metric.

## ⚠️ Artefact 1 — the first result was wrong, and it was wrong in my favour to report

Switched over, the loop **inverted**: L1 8.3, L2 7.0 — a 0.84x advantage where the histogram gave
1.24x. That is a publishable-sounding reversal ("the cheap 1-D control beats morphology"), and it was
an artefact.

Two hypotheses could produce it without any geometry:

1. **Thin sampling.** L2's clouds come from real contact rates and 6.2% of species have fewer than 8
   hits; L1's synthetic blobs always get ~60. Thin clouds get noisy bandwidths and inflated overlap.
2. **Estimator shape bias.** L1's blobs are exactly gaussian — the kernel estimator's ideal case —
   while L2's are irregular and multimodal.

**Hypothesis 1 is refuted.** Raising the visit count so every survivor has full support does not
close the gap; it widens it slightly (0.84x -> 0.76x). The thin tail dies during evolution and never
reaches the survivors.

**Hypothesis 2 is real, and it decides the comparison.** Against a much finer reference estimator,
the fast estimator over-reported mean pairwise overlap by +0.0145 on real clouds against +0.0056 on
synthetic ones — 2.6x more bias against the arm derived from morphology.

## ⚠️ Artefact 2 — my fix for that was falsified by its own control

The obvious mechanism was Silverman's bandwidth rule assuming gaussian data, so I applied the
standard robust variant, `0.9 * min(sd, IQR/1.34)`.

It lowered absolute bias on both cloud types and made the **lopsidedness worse**, 2.57x -> 3.90x.

Decomposing the estimator's error into a sample-size part and a bandwidth part shows why:

```
                    sample-size bias                    bandwidth
                M=48      M=96     M=192                  bias
  real         +0.0036   +0.0014   +0.0002               +0.0108
  synthetic    -0.0050   -0.0024   -0.0011               +0.0106
```

**The bandwidth bias is symmetric** (+0.0108 vs +0.0106), so it very largely cancels in a ratio and
was never the asymmetry. The entire asymmetry is **retained sample size**, and it is opposite in
sign: too few points over-state overlap for an irregular cloud and under-state it for a clean
gaussian one, so the two errors add rather than cancel.

The "lopsidedness" figure that sent me to the bandwidth rule was itself meaningless — it divided two
quantities each dominated by the same large symmetric term. The decomposition is what settled it.

The robust rule was reverted. A change justified by a mechanism that turned out not to exist does not
get to stay because it sounds more careful. `KDE_M` went 48 -> 96 instead.

## The result, after both artefacts are removed

Conclusions that compare a morphology-derived arm against a synthetic one must now be shown **stable
in M**, not quoted at one setting:

```
  M       L1     L2    L2/L1
   48    8.3    7.0    0.84x   <- artefact
   96    8.3    7.7    0.92x
  192    8.3    7.7    0.92x   <- converged
```

**In the evolution loop, L2 and a precision-evolving L1 are indistinguishable: 0.92x**, with
replicate counts of 6/10/9 against 10/7/6. The difference is far inside replicate scatter. This is a
tie, not a win for either arm — and reporting the M=48 number would have claimed the opposite.

## The static ablation, re-based

```
  arm                                pool   t=0.05  t=0.1  t=0.2  t=0.3  t=0.5
  L0 (no placement)                    60       1      1      1      1      1
  L1-strict (roll discarded)          309       7      8      9     10     17
  L1-free, drawn precision            234      10     11     16     24     43
  L1-free, EVOLVED precision          234      24     28     35     42     62
  L2 (from morphology)                309      24     31     40     58    124
  CTRL-2D-ideal [CEILING]            3760      50     71    121    212    542
```

The saturated row is gone. The evolved-precision arm now varies with tolerance (24 -> 62) where the
histogram pinned it flat at 21 across every tau. **The resolution control passes**: halving precision
moves the ceiling 34 -> 65, where the histogram returned 21 either way.

At tau = 0.2, **L2 out-packs a precision-matched 1-D control 2.5x** (40 vs 16), and that figure is
2.4-2.9x across every tolerance. Against a 1-D control granted the pool's best precision it is 1.14x,
but that comparison is asymmetric — it precision-selects one arm and not the other — and the
symmetric version is the loop result above.

(The prior session's symmetric static comparison, 1.05x from a matched-N draw, was computed at the
old KDE_M = 48 and has **not** been re-run at 96. Its bias runs in L2's favour, so it is a slight
under-statement rather than an over-statement, but it is not a current number.)

## The ceiling: the tau -> 0 framing was itself an artefact

v1 scored evolution against a ceiling computed "as tau -> 0", justified by evolved communities
showing max pairwise overlap `0.000`.

That zero was **rounding on a metric that quantised placement into bins.** Continuous overlap has
gaussian tails and is never exactly zero, so at tau = 0 every pair conflicts and the ceiling
collapses — L2 scores 3 against L1's 6, which is not a fact about geometry.

The tolerance is now read off the measured arm. Survivors sit under 1e-3, so the bound is taken at
tau = 0.001:

```
  tau      L1-drawn  L1-evolved   L2
  0.001        7         17       19
  0            3          6        3   <- DEGENERATE
```

`CEIL` is now `{L2: 19, L1: 17, L0: 1}`, and L1's is taken from the 1-D arm **at evolved precision**,
which is what it now is. That resolves the 111%-of-its-own-ceiling anomaly: the bound was wrong, not
the measurement.

**The check is mechanical now.** "A ceiling arm must be re-checked against the measured arm every
time" has failed twice as a comment — once on the head-cap ideal arm, once on this constant. `v1.js`
throws if any arm exceeds its bound. The bound and the measurement are computed from different pools,
which is exactly the drift that lets them disagree silently.

## Two silent-failure guards

- `overlap()` **refuses** a continuous signature. It used to skip its loop and return `0` — "these
  species do not overlap" — with no error, inflating every ceiling downstream while producing a table
  that looks entirely normal. `tau-zero-ceiling.js` was one line from doing exactly this.
- `kdeOverlap()` **refuses** a 1-D signature against a 2-D one. A dimension mismatch still returns a
  plausible number in [0, 1], which is precisely the failure a bounded output hides.

## What did not move

**"Precision is a modifier, not a niche axis" survives unchanged.** It was the most exposed published
claim — it is specifically about fine differences in repeatability, the regime where the histogram
saturated — so it was re-measured on both metrics against its own positive control:

```
           precision-only        position-only [CONTROL]
  tau    hist   continuous      hist   continuous
  0.05     1        1             3        3
  0.2      1        2             4        4
  0.5      3        3             7        6
```

L0 still collapses to 1 species in every arm, so the negative control holds and placement is still
doing the work.

## Tests

Six tests added on the live metric, because every structural property the headline rests on was
tested **only** on the retired histogram path — inert tests that would keep passing while the live
metric broke the same way the histogram did.

The saturation test asserts the **histogram fails** the same ladder on purpose: a test never seen
failing is not known to be able to fail, and this one would otherwise pass on any metric with a
resolution floor, including the finer-binned histogram that was the band-aid this replaced. Its
threshold comes from gaussian theory (`OVL = 2*Phi(-d/2sigma)`), not from the output it checks.

The estimator test guards **convergence in M** rather than a tolerance, since a fixed threshold
calibrated from these clouds would encode whatever bias they have.

## Still on the histogram

Named rather than left to be discovered: `experiments/checks.js` (checks 1, 2 and 4 — check 3 is
re-measured above), `carryover.js`, `head-exposure.js`, `precision-audit.js`. Their published claims
were measured on the retired metric and have not been re-run. `head-exposure.js` and
`precision-audit.js` both bear on the headline directly and should be re-based next.
