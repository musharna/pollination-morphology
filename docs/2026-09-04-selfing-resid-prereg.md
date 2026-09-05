# #63 pre-registration — ablate the correlation: assurance on self-pollen residualised on `received`

_2026-09-04. Written and committed before the implementation exists and before
any sweep runs. Two new arms at N0 = 30, rate 2.0, cost 0._

## The gap

[#62](2026-09-04-selfing-dose.md) made reproductive assurance proportional to a
plant's own pollen load and found it **relocates rescue without creating any**:
the lone minority plant's `minMothered` at k = 1 rose roughly six-fold, and
every unconditional measure included zero.

Its surviving mechanism, **M3**, is that self-pollen tracks visitation
(Spearman 0.438), so most of the matched budget flowed to well-visited plants
that would have outcrossed anyway. The lone plant is the conspicuous exception —
heavily selfed _because_ heavily visited, with no partner to receive from.

⚠️ **M3 rests on a correlation plus a refuted alternative, not on an
intervention.** #62 said so in its own limitations. This is the intervention:
make assurance proportional to the part of self-pollen that `received` does
**not** predict. If M3 is the reason the dose arm's gain did not aggregate, then
removing the correlation should aggregate.

## ⚠️ Premise pre-flight — disclosed, and it ran before this document

`_scratch/rf63-preflight.js`, on arm A of
`docs/data/2026-09-03-selfing-rate-r000.json.gz`, carrying the same archive
anchor as #62's pre-flight. **Both passes reproduced the archive exactly: 875
re-run rows (population-wide, 25 seeds) and 805 rows (the 23 seeds that visit
k = 1), 0 disagreements.** Every statistic below replicates across the two.

The residual is the within-generation OLS residual of `selfReceived` (the
transfer-matrix diagonal `T[i][i]`) on `received` (the same matrix with the
diagonal skipped, `sim/ibm.js:1749-1753`).

| pre-flight question                     | measured                                                                         | verdict                             |
| --------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------- |
| is any signal left after residualising? | R² of self ~ received median **0.153** / 0.182 (k=1 seeds)                       | **survives** — ~85% is residual     |
| is the residual flat?                   | CV of the clipped residual **2.45** (raw diagonal: 1.43)                         | **survives** — sharper, not blunter |
| did the ablation ablate?                | rho(self, recv) 0.402 → rho(resid, recv) **0.096**                               | **partial, ~¾ removed**             |
| does the clip eat the population?       | **66.7%** of plants at zero assurance (#62 dose: 4.3%)                           | ⚠️ **forces a second arm**          |
| ⚠️ where does the lone plant sit?       | residual percentile **0.933**; her own `received` **0.000×** the population mean | **points the intended way**         |

Three things in that table changed this design, and all three were unknown when
the task was filed.

**1. The clip eats the population, and #62's refutation does not cover it.**
Assurance cannot be negative, so negative residuals clip to zero. That zeroes
**two-thirds** of plants. #62 measured the abandoned zero-assurance class at
4.3%, evenly split by lineage, and **refuted** it as the mechanism — but a
refutation at 4.3% says nothing about 66.7%. The lineage split stays small and
runs in the minority's favour (minority 66.7% zeroed vs majority 68.4%
population-wide; 62.8% vs 69.1% on the k=1 seeds), which is a co-mechanism that
must be disclosed rather than a confound that can be dismissed.

**2. So a second arm is registered, and it is a discriminator, not a spare.**
Shifting instead of clipping — `resid − min(resid)` — preserves the **identical
residual ordering** while zeroing almost nobody (3.3%, comparable to #62's
4.3%). If the clipped arm moves the primary and the shifted arm does not, the
**zeroing** did the work and not the ablation. ⚠️ The shifted arm is
deliberately the blunter instrument and cannot be primary: OLS residuals sum to
zero, so `resid − min(resid)` is a flat floor plus a zero-sum perturbation _by
construction_, and it is nearer the flat floor than #62's dose arm was.

**3. The decisive question points the intended way — but not safely.** #61 found
the lone plant is drenched in her own pollen and never drawn as a mother because
`received` skips the diagonal. The pre-flight confirms it from the other side:
her own `received` is **0.000×** the population mean while her self-pollen is
4.18×, putting her residual in the **top 7%** of her generation. C-matched to an
identical total, her assurance weight is:

| rule                  | her median weight | vs flat  |
| --------------------- | ----------------- | -------- |
| flat floor (#58–#61)  | 2,170.7           | 1×       |
| dose (#62)            | 8,040.5           | 3.7×     |
| **residual, clipped** | **16,062.7**      | **7.4×** |
| residual, shifted     | 5,395.3           | 2.5×     |

⚠️ **And the clip zeroes her outright in 17.4% of k = 1 generations.** A rule
that is much better for her on average is catastrophic for her in the tail, and
extinction is absorbing. That is not a footnote; it is the whole content of H3
below.

## The intervention, and the control that makes it a test of SHAPE

Two new arms, `R200r` (clipped) and `R200s` (shifted), alongside the existing
flat `R200` and #62's dose `R200d`.

**C-match is retained and is still the whole experiment.** A scale factor `s` is
solved _per generation_ so the total selfed weight equals the flat floor's total
exactly — `sum_i selfW[i] == rate * sum(received) == n * floor`. All four arms
therefore spend an identical assurance budget and differ **only** in how it is
distributed. Scaled any other way this silently becomes a test of how _much_
selfing there is, which #58 already answered and which would swamp this.

## Three hypotheses, and they disagree about the sign

**H1 — M3 is right, and ablating the correlation aggregates.** The dose arm's
gain did not survive aggregation because most of the budget went to plants never
at risk. Residualising sends it instead to plants whose self-pollen is high
_relative to their outcross receipt_ — partnerless-but-visited plants, which is
what the lone minority plant is (residual percentile 0.933). **Prediction: the
paired difference in total minority offspring is POSITIVE and its interval
excludes zero.**

**H2 — the null, and #62 already saw it.** At a matched total the shape is not
what any outcome here is sensitive to; the total is (#58 swept size and moved
coexistence, #62 swept shape and moved nothing unconditional). The floor's job
(#61) is only to give a partnerless plant _non-zero_ draw weight, and any rule
that does so is sufficient. **Prediction: the interval includes zero.**

**H3 — the clip backfires, and M2 revives at 66.7%.** The floor exists to keep a
partnerless plant reproductively alive. The clipped rule withdraws assurance
entirely from two-thirds of plants and, in 17.4% of k = 1 generations, from the
lone minority plant herself. Extinction is absorbing and a mean cannot undo it,
so a rule that is better on average and occasionally zero may be worse where it
counts. **Prediction: the paired difference is NEGATIVE.**

H1 and H3 disagree in sign; H2 splits them. No outcome is unsurprising.

## ⚠️ The decision rule, fixed now — and the primary is UNCONDITIONAL

**This is #62's lesson made operative.** #62 registered a primary conditioned on
reaching k = 1, which the treatment itself changes (45 seeds vs 40). The rule
fired H1 on a collider-conditioned estimand while every unconditional measure
included zero. The tell it produced — _a pre-registered decision rule protects
against reading the data wrong; it does not protect against registering the
wrong estimand_ — is answered here by registering an estimand with no filter the
treatment can move.

**PRIMARY (registered):** `motheredTotal` — total offspring mothered by the
minority lineage, summed over every generation in which both lineages are
present, **one value per run, no `k` filter**, paired on founding seed,
`R200r` vs `R200`. Every run contributes exactly one number; a treatment that
causes early extinction shows up as a _lower_ total rather than as a removed row.

- interval **excludes zero, positive** ⇒ **H1**
- interval **excludes zero, negative** ⇒ **H3**
- interval **includes zero** ⇒ **H2**

95% percentile bootstrap over founding seeds (not generations), paired on the
founding seed, 10,000 resamples.

**SECONDARY, and explicitly unable to carry the verdict:**

1. `HELD` (coexistence), same pairing — the project's standing outcome.
2. **`minMothered` at k = 1** — #62's registered primary. Reported for
   comparability with #62 and **labelled collider-conditioned**. ⚠️ Whatever it
   shows, it does not change the verdict. If it disagrees with the primary, that
   disagreement is itself the result to report.
3. The `R200s` (shifted) arm against the same primary, as the
   ordering-vs-zeroing discriminator described above.

## What this CANNOT test

1. **The ablation is partial.** rho falls 0.402 → 0.096, not to 0. A residual
   arm that still carries a tenth of the correlation cannot establish that the
   correlation is irrelevant, only that three-quarters of it is.
2. **The residualisation is LINEAR.** OLS on the raw scale. If self-pollen
   depends on `received` nonlinearly, structure survives in the residual and is
   attributed to the ablation.
3. **One cell.** Rate 2.0, N0 = 30, cost 0, inheriting #58's design. Neither new
   arm is swept over rate or cost.
4. **Concentration and zeroing are not fully separable** under a matched total —
   concentrating on the top third necessarily starves the rest. `R200s` bounds
   this rather than eliminating it.
5. **P1 remains untested**, as in #62. Assurance of any shape produces selfed
   seed, which keeps `anc` unaveraged, so these arms bypass the averaging wall
   rather than probe it.

## Controls

| id           | control                                                          | fails if                                                                                                             |
| ------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **C-match**  | every arm spends the same total assurance, solved per generation | the arms differ in SIZE, not just shape                                                                              |
| **C-null**   | the default path is unchanged by the `ibm.js` edit               | any non-selfing result moves; baseline md5 **`6d6ec287c608ce7a4e32cebbc7d0ed44`** (⚠️ _not_ the pre-#62 `5d034187…`) |
| **C-anchor** | a fresh flat arm reproduces the archived flat arm                | `experiments/archive-agree.js` reports any disagreement                                                              |
| **C10**      | every arm actually selfs, at the rate asked                      | an arm silently does not self                                                                                        |
| **C-resid**  | ⚠️ the ablation happened **in the arm that shipped**             | rho(selfW, received) on the shipped data is not far below the dose arm's                                             |
| **C-zero**   | the zeroed fraction and its lineage split, on shipped data       | the pre-flight's 66.7% / small bias does not hold up                                                                 |
| **C-seed**   | distinct seed counts beside every count                          | a count is read as independent replication                                                                           |

C-resid and C-zero are new and exist because this design's two load-bearing
pre-flight numbers were measured on a _re-run of a different arm_. Measuring them
again on the data that actually ships is the difference between a premise and a
finding.

## Cost

Four cells at N0 = 30 — the two new arms (`R200r`, `R200s`) plus fresh `R200`
and `R200d`. Re-running the two existing arms rather than reusing #62's archives
costs roughly double, and buys three things: C-resid and C-zero become
measurable on the rows that shipped instead of inherited from a pre-flight on a
different arm; the flat and dose arms get an independent reproduction check
against #62's archive; and every row carries the same field set, so no
comparison depends on which archive a number came from — the exact error #62(b)
had to correct.

## ⚠️ Correction, recorded BEFORE the sweep ran

While smoke-testing the analysis end-to-end on a 6-seed dump — before submitting
the real sweep, and with no primary result in existence — the C-resid control
was found to be reporting a **Pearson** correlation while this document's
premise numbers are **Spearman**. Both now ship, separately labelled, and the
write-up may not mix them. Recomputing on the same rows changes what this design
can claim:

| quantity                                     | measured | reading                                        |
| -------------------------------------------- | -------- | ---------------------------------------------- |
| Spearman rho(assurance, received), dose arm  | 0.331    | the association to be ablated                  |
| Spearman, **shift** arm (unclipped residual) | 0.282    | ⚠️ only ~15% of the rank association removed   |
| Spearman, clip arm                           | 0.126    | deflated by ties — see below                   |
| Pearson, shift arm                           | −0.000   | the linear association is removed **entirely** |

**The "partial, ~¾ removed" line in the pre-flight table above is inflated, and
is withdrawn.** It was computed on the CLIPPED residual, and clipping collapses
about two-thirds of plants into a single zero-valued tie block, which
mechanically deflates a rank statistic. The shifted arm is a strictly monotone
transform of the residual, so its 0.282 is the honest unconfounded figure.

Stated correctly, what the intervention does: **a linear residualisation removes
the LINEAR dependence of assurance on visitation completely, and most of the
MONOTONE dependence survives it.** That follows from regressing on the raw scale
against a heavy-tailed diagonal. It is a limitation of this design, not a result
of it.

This changes no hypothesis and no decision rule — H1/H2/H3 and the rule stand
exactly as registered above, and the primary is about outcomes rather than about
the correlation. It changes only what may be said about MECHANISM if the primary
moves: a mover cannot be attributed to "the correlation was removed" while three
quarters of the rank association is still there. That makes the `R200s`
discriminator more important, not less.
