# #58 — selfing lifts the floor from an exact zero, but coexistence follows only at the extreme

_2026-09-03. Registered in [the pre-registration](2026-09-03-selfing-rate-prereg.md) before the
run. Follows [#57](2026-09-03-rare-currency.md), which found the floor absolute and selfing a
partial escape at one rate._

## The result

Selfing lifts the rare-lineage floor, monotonically, from an exact zero. At a minority of one
plant, offspring mothered per plant runs **0.000 → 0.196 → 0.355 → 0.438 → 0.580** as the selfed
share of matings goes 0% → 20% → 33% → 50% → 67%.

But **coexistence does not follow until the extreme**. HELD is flat from rate 0 through rate
1.0 and rises only at rate 2.0, where 67% of matings are selfed. Rescuing lone plants is not
sufficient for coexistence until the rescue is very large.

## Cells and controls

Five cells at N0 = 30, arm A (premium on), **120 seeds each, 109 founded**.

| id      | control                                 | result                                                   |
| ------- | --------------------------------------- | -------------------------------------------------------- |
| **C1**  | rate-0 cell HELD on seeds 1..40 = 0.289 | **PASS** — 0.289, on a cell holding 109 seeds            |
| **C5**  | lineage counts exhaust the population   | **PASS**                                                 |
| **C9**  | `cf` never exceeds `k-1`                | **PASS** — 0 violations in 9,642 informative generations |
| **C10** | selfed share is 0 at rate 0 and spreads | **PASS** — 0.0 / 20.0 / 33.3 / 50.1 / 66.8%              |

C1 passing at 0.289 on a 109-seed cell is the seeds-1..40 discipline working: the anchor is
read on the same 40 seeds #52-#57 used, whatever the cell's own size.

⚠️ **C10 initially reported FAIL on all four rate cells, and the control was wrong, not the
data.** Its predicate listed only the arms named `S` and `Sn`, so the `R*` rate arms were scored
as failures while selfing at exactly the rates they had been asked for. **A control that cries
wolf on correct behaviour is as broken as one that passes on bad behaviour** — it just fails in
the direction that looks conscientious. Fixed, and the fix is recorded rather than quietly
applied.

## Primary — offspring mothered per minority plant at k <= 2

| rate | selfed% | mothered/plant [95% CI]  | vs rate 0 [95% CI]          | tracer w | obs |
| ---- | ------- | ------------------------ | --------------------------- | -------- | --- |
| 0.00 | 0.0%    | 0.493 [0.295, 0.691]     | (reference)                 | 0.544    | 70  |
| 0.25 | 20.0%   | 0.495 [0.327, 0.659]     | +0.004 [-0.255, +0.263]     | 0.490    | 109 |
| 0.50 | 33.3%   | 0.533 [0.405, 0.656]     | +0.039 [-0.195, +0.273]     | 0.552    | 121 |
| 1.00 | 50.1%   | 0.658 [0.527, 0.787]     | +0.160 [-0.078, +0.398]     | 0.679    | 152 |
| 2.00 | 66.8%   | **0.734** [0.614, 0.844] | **+0.241 [+0.007, +0.475]** | 0.751    | 145 |

**The registered rule returns a verdict: selfing lifts the floor.** The rate-2.0 difference
excludes zero, which the pre-registration fixed in advance as sufficient.

⚠️ The intermediate rates are **underpowered, not null**: their half-widths are 0.23 to 0.26
against a registered null threshold of 0.15, so the pre-registration classifies each of them
individually as NO VERDICT. The verdict rests on the top rate and on the k = 1 series below.

## The structural extreme, k = 1

| rate | mothered/plant | tracer w | lone-generations |
| ---- | -------------- | -------- | ---------------- |
| 0.00 | **0.000**      | 0.000    | 23               |
| 0.25 | 0.196          | 0.163    | 56               |
| 0.50 | 0.355          | 0.360    | 62               |
| 1.00 | 0.438          | 0.446    | 73               |
| 2.00 | **0.580**      | 0.599    | 69               |

This is the cleanest signal in the run: a monotone rise **from an exact 0.000**, on 23 to 73
lone-generations a rate. #57 established that without selfing a lone plant mothers nothing at
all; this is how far each rate moves her off that floor.

⚠️ **The tracer and the mother-based measure agree closely here** (0.000/0.000, 0.196/0.163,
0.355/0.360, 0.438/0.446, 0.580/0.599) — because `ancNull` is off in these arms, so a selfed
offspring keeps the mother's `anc` and counts as her lineage. That agreement is not luck, and it
is exactly what #57 warned would _not_ hold under `ancNull`. The primary is still the
mother-based measure, as registered.

⚠️ **The lone-generation counts themselves rise with rate** (23 to 69). Selfing keeps lineages
alive at k = 1 rather than losing them, so the higher-rate cells spend more time in the state
being measured. The comparison is conditional on k = 1 and so is not invalidated, but the runs
reaching that state are not a fixed sample across rates.

## Coexistence follows only at the extreme

| rate | HELD, seeds 1..40 | HELD, all seeds    | vs rate 0 [95% CI]          |
| ---- | ----------------- | ------------------ | --------------------------- |
| 0.00 | 0.289             | 0.266 (29/109)     | (reference)                 |
| 0.25 | 0.263             | 0.303 (33/109)     | +0.037 [-0.083, +0.156]     |
| 0.50 | 0.289             | 0.284 (31/109)     | +0.014 [-0.101, +0.128]     |
| 1.00 | 0.263             | 0.294 (32/109)     | +0.028 [-0.092, +0.147]     |
| 2.00 | 0.395             | **0.404** (44/109) | **+0.138 [+0.009, +0.266]** |

⚠️ **Corrected 2026-09-03 by [#59](2026-09-03-selfing-cost.md).** This row
originally read `0.404 (44/109)` in the seeds-1..40 column with `—` in "all
seeds": the two columns were swapped, and `(44/109)` gives it away as the
all-seeds figure. #59 re-ran this exact cell and the run is bit-identical (C8′:
3,815 generations, 55,767 values, 1e-12), so the seeds-1..40 value is **0.395**.
The registered interval was computed on all seeds and is unaffected.

Flat through rate 1.0, then a rise whose interval just excludes zero. So the floor rescue is
**gradual** while the coexistence response is **not** — the two do not track each other, and
that gap is the finding.

## Is the HELD rise a tracer artefact? No, and the reason is checkable

`sim/ibm.js:696-701` warns that a selfed offspring normally inherits the mother's `anc`
**unaveraged**, which inflates ancestry variance and therefore HELD **by construction**. That is
the right worry, and it does not bite here:

| cell   | hybrid plant-generations | share     |
| ------ | ------------------------ | --------- |
| rate 0 | 1049 / 114450            | 0.92%     |
| 0.25   | 365 / 114450             | 0.32%     |
| 0.50   | 945 / 114450             | 0.83%     |
| 1.00   | 277 / 114450             | 0.24%     |
| 2.00   | 207 / 114450             | **0.18%** |

`anc` stays essentially **two-valued** in every cell, so ancestry variance is just `p(1-p)` in
the lineage frequency and there is no averaging for selfing to skip. The inflation the docs warn
about needs blending to suppress, and there is under 1% of it — decreasing with rate, since
selfing reduces outcrossing.

⚠️ **`ancNull` is NOT a clean null — measured directly, at the one rate where coexistence moved.**
The registered control arm (rate 2.0 plus `ancNull`, 109 founded seeds):

| quantity                 | rate 2.0       | rate 2.0 + `ancNull` |
| ------------------------ | -------------- | -------------------- |
| selfed share of matings  | 66.84%         | 66.58%               |
| hybrid plant-generations | **0.18%**      | **93.74%**           |
| HELD, all seeds          | 0.404 (44/109) | **0.000** (0/109)    |
| k=1 offspring mothered   | 0.580          | **0.857**            |
| k=1 tracer `w`           | 0.599          | **0.000**            |

Selfing is identical in the two arms — 66.6% against 66.8% — so every other difference is the
tracer convention alone. `ancNull` converts **94% of plant-generations into hybrids**, which is
not netting out an inflation but destroying the quantity being measured: with almost no
pure-lineage plants left, HELD is 0 by construction.

⚠️⚠️ **At k = 1 this is starker than #57's factor of seven.** Those plants mother **0.857**
offspring — _more_ than the 0.580 of the arm without `ancNull` — while the tracer reports
**exactly 0.000**. Same plants, same seed set, one convention apart.

So the HELD rise at rate 2.0 **cannot** be netted against this arm. The inflation `ancNull`
exists to size is instead ruled out directly by the hybrid-share table above — under 1%, and
falling with rate. This confirms the caveat #57 attached to `ancNull` rather than contradicting
it.

## Shape — unresolved, as the pre-registration allows

Consecutive increments in the primary are +0.004, +0.035, +0.121, +0.081. Every per-increment
interval overlaps zero, so by the registered rule the shape is **unresolved**: the data
distinguish "selfing lifts the floor" from "it does not", but not smooth-monotone from
saturating from thresholded.

The k = 1 series looks smoothly monotone, but it carries no per-increment intervals and is not
promoted to a shape claim on that basis.

## Limitations

1. **`cost` is 0 in every cell.** A selfed offspring always establishes — the most generous
   possible case — so **every rescue here is an upper bound**. Inbreeding depression is a second
   axis this sweep does not touch.
2. **Rate 2.0 means 67% of matings selfed**, which is a large intervention. The coexistence
   effect exists only there, and its interval only just excludes zero.
3. **Shape unresolved** (above), and the intermediate rates are underpowered rather than null.
4. **One population size** (N0 = 30) and one premium setting.
5. **The k = 1 sample is not fixed across rates** — selfing keeps lineages in that state longer.

## What this adds

#55 through #57 built a mechanism: the premium cancels a destabilising force rather than
supplying one, and what stops a rare lineage recovering is an absolute floor of conspecific
plants, with a lone plant mothering nothing at all. #58 shows that floor is **not immovable** —
reproductive assurance lifts it smoothly off zero — but that **lifting it is not the same as
rescuing coexistence**. A lineage saved from the last extinction step still sits at the floor.
