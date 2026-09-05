# #63 — the ablation did no harm; the starvation did, and the collider said the opposite

_2026-09-05. Registered in [the pre-registration](2026-09-04-selfing-resid-prereg.md)
before the sweep ran, with the analysis committed before the data existed and a
correction to the pre-registration recorded before the sweep was submitted. Four
cells at N0 = 30, rate 2.0, cost 0, 109 seeds each._

## The answer in one line

Making assurance proportional to self-pollen **residualised on visitation**
changes nothing the project measures — unless you also withdraw assurance from
two-thirds of the population to do it, in which case it **significantly destroys
coexistence**. Two arms ablate the correlation identically; only the one that
starves does harm. **The shape of the floor is not what matters. The floor is.**

## The registered primary, and the rule as written

| clip vs flat, per run, no `k` filter         | flat    | clip (`R200r`) | paired difference             |
| -------------------------------------------- | ------- | -------------- | ----------------------------- |
| **TOTAL offspring mothered by the minority** | 205.450 | 185.532        | **−20.201 [−64.550, 25.523]** |

The interval includes zero. By the rule fixed in advance that is **H2**: at a
matched total, shape still does not aggregate. That agrees with #62.

**But two unconditional secondaries exclude zero, and both are negative:**

| clip vs flat, per run, no `k` filter   | flat   | clip   | paired difference           |
| -------------------------------------- | ------ | ------ | --------------------------- |
| generations with both lineages present | 21.945 | 16.927 | **−5.044 [−8.413, −1.550]** |
| **HELD (coexistence)**                 | 0.404  | 0.266  | **−0.138 [−0.257, −0.018]** |
| generations spent at k = 1             | 0.633  | 0.642  | +0.011 [−0.248, 0.266]      |
| ever reached k = 1                     | 0.413  | 0.422  | +0.010 [−0.128, 0.147]      |

So the clipped arm is not merely another null. It **loses coexistence outright**
— a third of it — and the lineages spend five fewer generations together. It is
also significantly worse than #62's dose rule head to head: **HELD 0.385 → 0.266,
−0.119 [−0.229, −0.009]**.

## ⚠️ The result: a collider-conditioned statistic did not overstate. It INVERTED.

The same arm, the same 109 seeds, #62's registered primary — `minMothered` among
generations at k = 1:

| at k = 1                | flat    | dose    | **clip**  | shift   |
| ----------------------- | ------- | ------- | --------- | ------- |
| mean `minMothered`      | 0.580   | 3.427   | **7.543** | 2.286   |
| share mothering nothing | 0.594   | 0.253   | **0.114** | 0.329   |
| generations / seeds     | 69 / 45 | 75 / 40 | 70 / 46   | 70 / 43 |

Paired over the 18 seeds reaching k = 1 in both arms:
**+9.247 [7.069, 11.519]** — a thirteen-fold lift, a tight interval, nowhere near
zero.

> ⚠️⚠️ **THE TELL.** #62 established that a pre-registered rule protects against
> reading the data wrong but not against registering the wrong estimand. #63
> measures what that costs. Had #63 registered #62's primary again, it would have
> reported **+9.247 [7.069, 11.519]** and called the clipped rule a spectacular
> success. The unconditional data says the same arm **destroys a third of all
> coexistence, −0.138 [−0.257, −0.018]**. Same arm, same seeds, same sweep. Both
> intervals exclude zero. **They have opposite signs.**
>
> A collider-conditioned estimand is not a noisy version of the right one. It can
> point the other way.

The mechanism of the inversion is visible in the table. Conditioning on k = 1
selects generations in which the minority _still exists_. The clipped rule is a
lottery: when the lone plant lands in the top third of residuals it is
magnificently funded and mothers 7.5 offspring, and when it does not it gets
**exactly zero** — which is #61's death sentence verbatim, because a partnerless
plant with no assurance is never drawn as a mother at all. The runs where the
lottery loses do not appear among the k = 1 generations, because those lineages
are already gone.

## The discriminator fires cleanly: it is the starvation, not the ablation

`R200r` and `R200s` residualise **identically** — same regression, same residual,
same ordering. They differ only in what happens to the negative half: clip sets
it to zero, shift subtracts the minimum.

| arm                | plants at ZERO assurance | HELD vs flat                | minority offspring vs flat |
| ------------------ | ------------------------ | --------------------------- | -------------------------- |
| dose (`R200d`)     | 4.4%                     | −0.019 [−0.138, 0.101]      | −12.960 [−48.064, 22.339]  |
| **clip (`R200r`)** | **69.1%**                | **−0.138 [−0.257, −0.018]** | −20.201 [−64.550, 25.523]  |
| shift (`R200s`)    | 4.7%                     | +0.054 [−0.073, 0.183]      | +14.926 [−25.642, 56.220]  |

**Only the starving arm harms.** The arm with the same ablation and no starvation
is, if anything, the best of the four — it leans positive on both measures, though
both intervals include zero.

⚠️ **This revives a mechanism #62 refuted.** #62 measured the abandoned
zero-assurance class at 4.3% of plants, evenly split by lineage, and refuted it
as an explanation. #63 confirms that refutation _at that size_ — the dose arm's
starved class here is 4.4% and it does no measurable harm. But the clipped arm
starves **69.1%**, and there the same mechanism is decisive.

> ⚠️ **A refutation is scoped to the magnitude it was measured at.** "Too small to
> matter" at 4.3% says nothing whatever about 69%. #62's M2 was not wrong; it was
> answered for one size and quietly assumed for all sizes. The only reason #63 can
> see this is that the pre-flight measured the clip's starved fraction _before the
> design was fixed_ and a second arm was registered to bound it.

⚠️ Honest scoping: clip and shift differ on a single knob, and "starves the
bottom" and "concentrates on the top" are two faces of it under a matched total.
#63 separates the **starvation/concentration axis** from the **ablation axis**;
it does not separate starving from concentrating.

## What the ablation actually did — measured on the shipped rows

| control | statistic                             | dose  | clip   | shift      |
| ------- | ------------------------------------- | ----- | ------ | ---------- |
| C-resid | **Spearman** rho(assurance, received) | 0.353 | 0.167  | 0.252      |
| C-resid | **Pearson** rho(assurance, received)  | 0.050 | −0.054 | **−0.000** |

As the pre-sweep correction warned, the residualisation removes the **linear**
dependence entirely (shift reads Pearson −0.000, exactly as OLS orthogonality
requires) and leaves most of the **monotone** dependence in place (Spearman
0.353 → 0.252, about 29% removed). The clip arm's lower 0.167 is substantially a
ties artifact of collapsing 69% of plants onto zero.

The premise itself, re-measured on the shipped flat arm rather than inherited
from the pre-flight: **Spearman(self-pollen, received) = 0.366**, against the
pre-flight's 0.402 / 0.438 on smaller seed subsets — a seed-set difference, not a
configuration one.

⚠️ **Therefore #63 does not establish what removing the dose/visitation
correlation does.** It removed a third of it and found no effect either way. What
it establishes is about the floor's _coverage_, not its _shape_.

## Controls

| id           | control                                            | result                                                                                               |
| ------------ | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **C-match**  | every arm spends the same total assurance          | **PASS** — worst relative gap **1.7e−15** over 327 arm-seeds at g=0                                  |
| **C-anchor** | flat and dose reproduce #62's archive              | **PASS** — 3,815 rows each, **133,563 numeric values, 0 disagreements**, 109 seeds                   |
| **C-null**   | the default path is unchanged by the `ibm.js` edit | **PASS** — the flat arm is byte-identical to #62's, which predates the edit                          |
| **C10**      | every arm actually selfs, at the rate asked        | **PASS** — 0.668 / 0.668 / 0.667 / 0.668 of matings                                                  |
| **C-resid**  | the ablation happened in the arm that shipped      | **PASS** — shift Pearson −0.000; clip below dose on the rank statistic                               |
| **C-zero**   | the starved class and its lineage split            | reported above; clip 69.1%, minority 62.2% vs majority 72.0%                                         |
| **C-seed**   | distinct seeds beside every count                  | reported throughout (109 seeds; 45 / 40 / 46 / 43 at k=1)                                            |
| **negctl**   | ⚠️ the controls can FAIL                           | **4/4 violated premises detected, clean input still passes** — `experiments/selfing-resid-negctl.js` |

The C-anchor is worth stating plainly: **#62 reproduces exactly.** Its flat arm
(205.450, HELD 0.404), its dose arm (192.596, HELD 0.385), its dose-vs-flat
difference (−12.960 here vs −12.853 published, the gap being bootstrap
resamples), and its k=1 table (0.580 / 0.594 / 69 gens / 45 seeds and
3.427 / 0.253 / 75 gens / 40 seeds) all come back identical on an independent
re-run through changed code.

## What this says about the model

#58 swept the floor's **size** and moved coexistence. #62 swept its **shape** at
matched size and moved nothing. #63 sweeps its **coverage** — how many plants the
floor reaches — and finds the first thing since #58 that moves coexistence at all,
in the **negative** direction.

That is a coherent reading of the whole selfing arc: the floor's job (#61) is to
give a partnerless plant non-zero draw weight. **Any** rule that does so is
sufficient, and this is why shape has never mattered. But a rule that stops doing
so for two-thirds of plants stops doing the job, and coexistence falls
accordingly. The floor is a coverage device, not a targeting device.

## Limitations

1. **The ablation is linear only**, as recorded before the sweep. About 29% of
   the rank association is removed. #63 cannot say what a complete ablation does.
2. **Starving and concentrating are not separated** — one knob, two faces, under
   a matched total.
3. **The registered primary and a registered secondary disagree.** `motheredTotal`
   includes zero while `HELD` excludes it. Both are unconditional and neither is
   collider-conditioned; the honest reading is that the harm shows up more
   sharply in the binary outcome than in the noisy count, not that one refutes
   the other. The verdict is reported as the rule wrote it — **H2 on the
   registered primary** — with the coexistence loss reported beside it as a
   secondary that the rule did not license as the headline.
4. **One cell.** Rate 2.0, N0 = 30, cost 0. Neither new arm was swept.
5. **P1 remains untested**, as in #62 — assurance of any shape produces selfed
   seed, which keeps `anc` unaveraged, so these arms bypass the averaging wall.
