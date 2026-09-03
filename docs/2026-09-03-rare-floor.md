# #56 — the floor is a COUNT, and a lineage of one has no fitness at any size

_2026-09-03. Registered in [the pre-registration](2026-09-03-rare-floor-prereg.md) before the
run. Answers the question [#55](2026-09-02-rare-advantage.md) could not._

## The result

#55 found that the premium's rare-lineage visit advantage fails exactly where it is largest,
and could not say whether that floor sits at a **count** of plants or a **frequency**, because
at N0 = 30 a frequency of 0.1 IS a count of 3. Running N0 in {20, 30, 60} with per-plant
service held constant separates them.

**The floor is a count.** The registered decision procedure returns COUNT in both arms, the
crossing points agree with it, and — independent of both, and not subject to their noise — a
minority of **one plant has exactly zero fitness at every population size**.

## Controls

38 founded of 40 seeds in every cell.

| id     | control                                                | result                                                                      |
| ------ | ------------------------------------------------------ | --------------------------------------------------------------------------- |
| **C1** | N0=30 arm A HELD on seeds 1..40                        | 0.289 vs 0.289 **PASS**                                                     |
| **C2** | N0=30 arm B HELD on seeds 1..40                        | 0.026 vs 0.026 **PASS**                                                     |
| **C3** | corr(slice crowding, visits), premium vs not           | A: **-0.438 / -0.431 / -0.469** at N0 20/30/60; B: +0.029 / +0.017 / -0.003 |
| **C5** | lineage counts exhaust the population                  | **PASS**                                                                    |
| **C7** | `visitsPerPlant=800` a no-op at N0=30, not inert at 60 | **PASS** both halves, verified against a mutant                             |
| **C8** | this file's `w`/`r` reproduce #55's exactly            | **PASS** — 665 generation rows identical to 1e-12                           |

**C8 is the #43 guard and it is exact.** Because `visitsPerPlant=800` is bit-identical to
`visits=24000` at N0=30, cell 30:A and #55's arm A are the _same simulation_, so their
per-generation rows must agree — not merely their binned means. They do, to 1e-12, and the gate
fails with exit 3 on a single value perturbed by 1e-9.

## The decisive evidence: a lineage of one

| N0  | minority frequency at k=1 | w         | self-pollen share | conspecific outcross receipt |
| --- | ------------------------- | --------- | ----------------- | ---------------------------- |
| 20  | 0.050                     | **0.000** | **1.0000**        | **0.00**                     |
| 30  | 0.033                     | **0.000** | **1.0000**        | **0.00**                     |
| 60  | 0.017                     | **0.000** | **1.0000**        | **0.00**                     |

Arm A, 9 / 7 / 9 generation-observations; arm B gives the same 0.000 on 15 / 16 / 13.

**These three cells span a three-fold range of frequency and give an identical outcome.** That
is what "the floor is a count" means, and it needs no statistic: a lone plant has no conspecific
partner, so every grain it receives is its own, and it produces no pure-lineage offspring at
all. The mechanism is not inferred here — the self share is measured at exactly 1.0 and the
conspecific receipt at exactly 0.

The contrast at matched **frequency** is the other half of the argument. In the 0.05-0.10 band:

| N0  | w at p in 0.05-0.10 |
| --- | ------------------- |
| 20  | 0.000               |
| 30  | 0.734               |
| 60  | 1.204               |

Same frequency, three different answers. Same count, one answer.

## Primary — the collapse statistic

| arm | D_count         | D_freq         | ratio D_p/D_k | registered verdict |
| --- | --------------- | -------------- | ------------- | ------------------ |
| A   | 0.697 (10 bins) | 1.148 (9 bins) | **1.647**     | **COUNT** (>1.25)  |
| B   | 0.505 (10 bins) | 0.682 (9 bins) | **1.352**     | **COUNT** (>1.25)  |

Both arms clear the registered threshold independently, and arm B is not a control here so
much as a replication: the floor is a count whether or not the premium is on.

⚠️ **A bootstrap over seeds, added AFTER the run and therefore not registered, shows this
statistic is much softer than its point estimate:** arm A [0.608, 2.700] with P(ratio > 1.25) =
0.698; arm B [1.048, 1.828] with P = 0.719. Arm A's lower bound does not exclude the frequency
hypothesis. **The collapse ratio alone is suggestive, not decisive**, and it is reported that
way. Its width comes from the k=2 and k=3 bins, which carry 13-22 observations each and swing
hard; the k=4 and k=5 rows collapse tightly (1.216 / 1.186 / 1.211 and 1.060 / 1.077 / 1.181).

## Secondary — the crossing points

Where `w` crosses 1, per N0:

| N0  | k\*  | p\*       |
| --- | ---- | --------- |
| 20  | 2.04 | 0.102     |
| 30  | 2.79 | 0.097     |
| 60  | 2.22 | **0.040** |

`k*` spans a factor of 1.37 (coefficient of variation 0.17); `p*` spans a factor of 2.55 (CV
0.43). The count axis is about 2.6x more consistent, and the registered requirement that the
crossings agree with the primary is met, so no branch is being claimed off a single estimator.

⚠️ N0 = 20 and 30 give nearly the same `p*` (0.102, 0.097) — on those two alone the frequency
hypothesis would look fine. **The discrimination rests substantially on the N0 = 60 cell**,
which is exactly the config the design was built around, and it is a single cell.

## The mechanism, measured rather than argued

Minority self-pollen share by count, arm A. `T` has a diagonal and `received` skips it
("selfing is not mating success", `sim/ibm.js:1751`), so this is a direct measurement:

| k   | N0=20  | N0=30  | N0=60  |
| --- | ------ | ------ | ------ |
| 1   | 1.0000 | 1.0000 | 1.0000 |
| 2   | 0.679  | 0.751  | 0.640  |
| 3   | 0.624  | 0.483  | 0.513  |
| 4   | 0.420  | 0.422  | 0.397  |
| 6   | 0.436  | 0.302  | 0.321  |
| 10  | 0.576  | 0.324  | 0.275  |

The registered prediction was that the self share **rises** as the minority thins while its
visits rise. It does, and it collapses on count too. **#55's suggested explanation is
confirmed**: the rare lineage is visited generously and has nobody to be visited from, so the
visits move its pollen onto itself. For scale, 57% of all pollen this model moves is self-pollen
even at parity.

## The spend-matched arm closes #55's open confound

#55 could not separate "the premium delivers more visits" from "the premium allocates them
differently", because arm A spends 1.57x what arm B spends. Arm **Bx** is arm B handed enough
budget to spend what arm A spends — 16,236 against arm A's 15,956, within 2%:

| k   | A (premium) | B     | **Bx (no premium, A's spend)** |
| --- | ----------- | ----- | ------------------------------ |
| 1   | 4.587       | 0.960 | **1.029**                      |
| 2   | 2.939       | 1.021 | **1.033**                      |
| 3   | 2.348       | 0.948 | **1.026**                      |
| 5   | 1.760       | 1.023 | **1.009**                      |
| 10  | 1.107       | 0.989 | **0.981**                      |

**Bx is flat at ~1.0, exactly like B.** Its crowding correlation is +0.033, like B's +0.017 and
nothing like A's -0.431. And HELD at N0=30 reads **A 0.289, B 0.026, Bx 0.000** — the extra
budget does not help coexistence at all.

⚠️ **The advantage is the allocation rule, not the number of visits.** That confound is closed,
and #55's statement of it was itself imprecise: both arms were always _given_ 24,000; they
differ in how much of it the rule _consumes_.

## Limitations

1. **The collapse statistic is soft** (above). The verdict rests more on the k=1 structural
   result and the crossing consistency than on the registered ratio.
2. **N0 = 60 is a single cell** and carries most of the discrimination.
3. **`k*` is not perfectly constant** — 2.04 to 2.79. A count-based floor with no frequency
   component at all would hold it fixed; some frequency dependence is not excluded, only shown
   to be the smaller term.
4. **Generations differ by design** (23 / 35 / 70, scaling with N0 to equalise drift time). That
   is registered and deliberate, but it means the three cells are not identical in every
   respect other than size.
5. **Selfing is off** (`selfing: null`), so a lone plant's self-pollen produces nothing at all.
   In a model with any selfing the k=1 floor would be softer, and how much is untested.

## What this settles, and what it opens

The premium's rare-lineage advantage is real, is about allocation rather than budget, and dies
against a **mate-availability floor set by absolute numbers**. Coexistence under this mechanism
therefore has a hard minimum population of the minority lineage — around 2 to 3 plants here —
below which no amount of preferential visitation helps. Scaling the whole population up does
not scale the floor with it.

That is a different shape of prediction from anything earlier in this arc: it says the
protection the premium offers is **not** density-independent, and that a large community and a
small one fail in the same absolute place.
