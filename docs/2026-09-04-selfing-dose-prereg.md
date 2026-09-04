# #62 pre-registration — selfing has no dose, and the floor may be the wrong shape

_2026-09-04. Registered before any sweep cell is run. The premise pre-flight ran
FIRST and is disclosed in full below, because it is what licensed the task._

## The gap

`sim/ibm.js:1822-1826`, live:

```js
const floor = (opts.selfing.rate * received.reduce((a, b) => a + b, 0)) / n;
selfW = new Array(n).fill(floor);
weight = weight.map((w) => w + floor);
```

Every plant receives **the same scalar**. The floor is `rate × mean(received)` —
a population-level quantity — and it is added to a plant's maternal weight with
**no reference to how much of its own pollen is actually sitting on its stigma**.
A plant carrying thousands of grains of self-pollen and a plant carrying none get
byte-identical reproductive assurance.

This is not an oversight in the code; the comment block at `:1791-1815` argues
carefully for attaching assurance at the maternal weight rather than the sire
draw, and it is right. But it makes the amount of assurance independent of the
dose, and in a model whose entire selfing result (#58, #59, #60, #61) rests on
that floor, the shape of the floor is load-bearing.

## ⚠️ Premise pre-flight — disclosed, and it ran before this document

**The task must not run if the diagonal is flat.** If every plant deposits about
the same amount on itself, then a dose-dependent floor `s × selfReceived[i]` is
just the flat floor with extra steps, and the sweep would measure nothing. So the
distribution was measured first, on an anchored re-run of arm A (`_scratch/rf62-preflight.js`,
**1,050 rows checked against the archive, 0 disagreements**):

| quantity                                                 | measured                       |
| -------------------------------------------------------- | ------------------------------ |
| plant-generations                                        | 31,500 (1,050 gens)            |
| mean self-pollen per plant                               | 566.5                          |
| **CV of self-pollen WITHIN a generation, median**        | **1.431** (p10 0.55, p90 2.81) |
| **max/min within a generation, median**                  | **29.5×**                      |
| generations containing a plant with **zero** self-pollen | **677 / 1,050**                |
| Spearman(selfReceived, received), median                 | 0.408 (p10 0.06, p90 0.70)     |

Replicated on the k=1-reaching seed set (23 seeds, 805 rows anchored, 24,150
plant-generations): CV 1.372, max/min 29.6×, zero-diagonal generations 525/805,
rho 0.438. **The two subsamples agree.**

**The premise survives.** The diagonal is not flat, not close to flat, and not a
copy of `received`. The CV is computed _within_ a generation on purpose —
pooling across generations would manufacture spread out of drift in population
size.

The row that matters most is the zero one: **a plant with no self-pollen at all
is present in roughly two of every three generations**, and the flat floor hands
that plant exactly the same reproductive assurance as the plant beside it
carrying 30× the median. Whatever the sweep returns, that is the shape the model
currently asserts.

⚠️ The last row is the one that cuts both ways and it is why H3 below is a live
hypothesis rather than a foil: at rho ≈ 0.41 self-pollen partly **tracks** outcross
receipt, so redistributing assurance by dose partly means giving it to plants
that are already well pollinated.

## The intervention, and the control that makes it a test of SHAPE

Arm **DOSE** replaces the scalar with `selfW[i] = s × selfReceived[i]`, where
`selfReceived[i] = T[i][i]` — the diagonal the mating-weight sum deliberately
skips (`:1749-1753`).

⚠️ **C-match is the whole experiment.** `s` is chosen per generation so that

```
sum_i selfW[i]  ==  n × floor  ==  rate × sum_i received[i]
```

i.e. `s = rate × sum(received) / sum(selfReceived)`. The two arms then spend
**exactly the same total selfed weight** and differ only in how it is
distributed. Without this the comparison is confounded with the AMOUNT of
selfing, which #58 already showed dominates everything. If C-match fails, the
result is about amount and must not be reported as being about shape.

## Three hypotheses, and they disagree about the sign

**H1 — the distribution is rare-favouring, and the flat floor throws that away.**
Arm A's rare-visit premium hands the lone minority plant **4.587×** the per-capita
visits (#56, `r` at k=1). With no conspecific partner, every one of those visits
deposits self-pollen (#61: she receives 4,590 grains and every one is her own).
If she is therefore among the _most_ self-pollinated plants in her population,
dose-dependence concentrates the same total assurance onto exactly her.
_Prediction:_ `minMothered` at k=1 rises vs the flat arm at matched total; `HELD` rises.

> ⚠️ **H1's premise was nearly established the wrong way, and the wrong way is the
> error this task was filed to fix.** The tempting comparison is #61's 4,590 grains
> against the pre-flight's population mean of 566.5 — but those come from
> **different samples** (23 k=1 generations vs all generations of 30 runs), so
> their ratio, 8.1×, is a cross-sample digit comparison: the very mistake corrected
> in `2026-09-04-k1-wall.md` earlier today.
>
> Measured properly — her self-pollen against the mean **in her own generation**,
> on the 23 k=1 generations (23 seeds, anchor 805 rows / 0 disagreements) — the
> median ratio is **4.879×**, against a population mean of 729.1 in those same
> generations. **The premise holds, and the sloppy version overstated it by 66%.**
>
> ⚠️ It is also not universal: the ratio runs **0.156 to 19.909**. In at least one
> k=1 generation she carries _less_ self-pollen than her neighbours' average, so
> dose-dependence would give her _less_ than the flat floor there. The registered
> prediction is therefore about the median, and a secondary reports the share of
> k=1 generations in which dose-dependence helps versus hurts.

**H2 — shape is irrelevant; only the total matters.**
The floor's job is to give a partnerless plant _any_ non-zero weight, and it
already does. Redistributing a fixed total changes who is drawn only marginally.
_Prediction:_ `minMothered` at k=1 and `HELD` statistically indistinguishable between arms.

**H3 — dose-dependence makes it WORSE (rich-get-richer).**
rho ≈ 0.41 population-wide: self-pollen tracks outcross receipt, so dose-dependence
amplifies the already-well-pollinated, and the majority is most of the population,
so it absorbs most of the redistributed total.
_Prediction:_ minority floor rises LESS than flat; `HELD` falls.

**Discriminator:** `minMothered` at k=1, dose vs flat at matched total, bootstrapped
over **seeds** (a seed is one trajectory; its generations are not independent draws).

H1 and H3 rest on the same pre-flight and disagree on sign, which is the point:
rho = 0.41 supports H3's premise _population-wide_, while r = 4.587 supports H1's
premise _exactly where the floor is load-bearing_. The pre-flight cannot settle it.

## ⚠️ The decision rule, fixed now

Written before the data because #61's equivalent rule is the only thing that
stopped an attractive derivation being published as a cause:

> If the difference in `minMothered` at k=1 has a CI including zero, **report H2**,
> however good the H1 story sounds and however much the pre-flight seems to set it up.
> A mechanism that is real in the pre-flight and absent in the outcome is a
> mechanism that does not do the work — that is the #61 lesson and it applies here
> to a hypothesis I want to be true.

And, symmetrically:

> If `minMothered` rises but **C-match failed**, the result is about the amount of
> selfing and must be reported as a failed experiment, not as a shape effect.

## What this CANNOT test

**P1 remains untested, and this arm does not test it.** #61 derived that at k = 1
no assignment of fathers yields a pure offspring, because outcrossed offspring take
`(anc_m + anc_f)/2` (`:2015`) while a selfed seed keeps `anc_mother` exactly
(`:1952`). Dose-dependent selfing produces _selfed_ seed, which keeps `anc` exactly
and is therefore pure — so this arm **bypasses** the averaging wall rather than
probing it. Any lift measured here says nothing about whether that second wall
would bind if the first one were removed. It may not be testable within this model.

## Controls

| id           | control                                                                       | fails how                                        |
| ------------ | ----------------------------------------------------------------------------- | ------------------------------------------------ |
| **C-match**  | `sum(selfW)` identical across arms per generation to 1e-12                    | exit non-zero; result is about amount, not shape |
| **C-null**   | DOSE with the option absent reproduces the default path byte-for-byte         | any archived field differs                       |
| **C-anchor** | the flat arm reproduces #58's `r000` archive exactly                          | `experiments/archive-agree.js` exit 3            |
| **C-base**   | any zero count is compared to its own base rate before a mechanism is claimed | #61's C-base fired; assume this one will         |
| **C-seed**   | distinct seed count reported beside every generation count                    | —                                                |

C-null matters more than it looks: this is the **first change to `sim/ibm.js` in
this arc** — the file has been byte-identical at `5d034187cb79cdbefb61c1f6bf9e9a0d`
through #56–#61. The new behaviour is gated behind `opts.selfing.dose`, and the
default path must stay identical or every archive above becomes incomparable.

## Cost

Two arms × the k=1-reaching seed set, at N0 = 30, rate 2.0 (the one rate where
#58 saw coexistence move and #59 saw depression take it away). Submitted through
jobd, not run inline.
