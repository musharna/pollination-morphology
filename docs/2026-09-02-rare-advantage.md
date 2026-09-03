# #55 — the premium is a rare-lineage advantage, and it has a floor

_2026-09-02. Registered in [the pre-registration](2026-09-02-rare-advantage-prereg.md) before the
run. Follows [#54](2026-09-02-bloom-switch.md), which returned NO VERDICT._

<!-- RESULTS SECTION PENDING: the 40-seed run is in flight. Everything below this
     point is established independently of it. -->

## What #52-#54 were actually measuring

`anc` is documented as "the standard admixture tracker" (`sim/ibm.js:431-449`), and it exists to
separate three outcomes that all look like "the split went away": FUSION, EXTINCTION,
PERSISTENCE. The tracker was built to answer that question and nobody had read the answer off
it. Measured on the instrumented build, 40 seeds, 38 founded, 39,900 matings per arm:

| quantity                                     | arm A (premium on) | arm B (premium off) |
| -------------------------------------------- | ------------------ | ------------------- |
| matings whose parents differed in ancestry   | **2**              | **842**             |
| largest number of distinct `anc` values ever | 3                  | 29                  |
| runs ending with one lineage gone            | 27/38              | 36/38               |
| HELD                                         | 11/38 = **0.289**  | 1/38 = **0.026**    |

Both HELD figures reproduce #52-#54 exactly, so this is the same experiment rather than a
near-miss of it.

**The arms differ 400-fold in gene flow.** Under the premium, cross-lineage mating is 0.005% of
matings and the tracer stays a two-valued lineage label — ancestry variance is `p(1-p)` in the
lineage frequency, and it can only fall by **exclusion**. Without the premium, 2.1% of matings
cross and up to 29 distinct `anc` values appear: real admixture, so arm B loses ancestry
variance by _both_ routes at once.

That reframes the two-step. It was written as

> premium maintains the flowering-time polymorphism -> the polymorphism assorts -> assortment
> retains ancestry

with "assorts" doing unexamined work. Bloom separation has **two** consequences, not one, and
they are one cause seen twice:

> premium keeps the lineages in **separate bloom slices** -> **(a)** they seldom co-flower, so
> pollen rarely crosses, **and (b)** each lineage's slice draws a FULL flat budget, so whichever
> lineage is rarer gains per capita

Route (b) is what #52-#54 never measured.

⚠️ Nothing in #52, #53 or #54 is overturned. Every HELD number stands. What changes is the
mechanism sentence attached to them.

## The #54 sweep, re-derived from its archive

Quoted here from `docs/data/2026-09-02-bloom-switch-sweep-40seed.json.gz` rather than from the
earlier write-up, because a remembered number is not a verified one:

| k (premium on for k gens) | 0    | 5    | 10   | 15   | 20   | 25   | 35       |
| ------------------------- | ---- | ---- | ---- | ---- | ---- | ---- | -------- |
| HELD                      | .026 | .000 | .026 | .000 | .026 | .053 | **.289** |
| ancVar/0 (last)           | .012 | .000 | .015 | .000 | .021 | .053 | .247     |
| R1 (last 5)               | .941 | .946 | .927 | .944 | .877 | .766 | .457     |

Flat at arm B's level until k=25: twenty-five of thirty-five generations of premium leave a
population indistinguishable from one that never had it. Under the reading above this is what a
frequency-protecting mechanism must look like — the protected quantity is a frequency, and a
frequency has no memory beyond its present value.

## A one-generation misalignment in #54, quantified

`res.blooms` is built from the **input** population (`sim/ibm.js:1168`) — the parents — while `v`
is measured on `res.pop`, the offspring. So `R1[g]` and `v[g]` describe different cohorts, and
`v[g]` pairs with `R1[g+1]`. #54 compared them unshifted. Recomputed both ways on the archived
272-seed trajectories, changing nothing else:

| R1 index       | mean Delta                   | median | sign test |
| -------------- | ---------------------------- | ------ | --------- |
| as #54 ran it  | +0.0568 [-0.090, +0.204]     | -0.394 | 91+/181-  |
| cohort-aligned | **+0.0091** [-0.137, +0.155] | -0.426 | 89+/183-  |

The first row reproduces #54's published headline to the digit, which is an independent check on
that result. Correcting the alignment collapses the mean by ~84% to essentially zero and leaves
the median and the sign test where they were.

**#54's NO VERDICT is unchanged, and the reason for it is sharpened rather than weakened**: it
rested on estimator disagreement and on the discriminator sharing the artefact's signature, and
after correction the disagreement is starker — a mean of 0.009 against a median of -0.426 with
sign p < 0.0001.

## Why the pulse design was abandoned

#55 was filed as a pulse experiment, to separate a one-stage filter from a two-stage cascade by
the shape of the response. Four instruments were built for it and **every one failed on its own
control, before any compute was spent**:

| instrument                                       | why it was dropped                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `t90/t50` against the textbook 3.32 vs 2.32      | the in-system one-stage reference R1 read 2.57, so the bands do not apply here  |
| `S = (t90-t50)/(t50-t10)`, shift- and scale-free | control passed, but bootstrap put S(ancestry) anywhere in [2.55, 6.21]          |
| whole-curve least squares, M1 vs M2              | R1 — which must prefer M1 — preferred M2 in 63% of resamples                    |
| bounded per-seed slope score                     | endpoints 0.746 vs 0.687; and its floor censored 63-93% of seeds on the outcome |

The common cause is not the estimators. Under a single step the premium and the polymorphism are
**collinear for the whole trajectory**, so the two hypotheses differ only in fine curve shape,
which noise swamps. Counting #53 and #54 that is six attempts in one mechanism class. The
project's own rule — two failures in a class means change the class, not the estimator — says
stop, and the gene-flow measurement above says which class to move to: **measure the selective
force per generation instead of inferring the pathway from trajectories**.

A fifth instrument was nearly added on top: a bootstrap whose distribution did not contain its
own point estimate. The cause was a textbook LCG whose multiplier overflows float64 in
JavaScript, degenerating the generator; `Math.imul`-based mulberry32 fixed it and reconciled the
two. It is recorded because the symptom looked like a statistical subtlety and was arithmetic.
