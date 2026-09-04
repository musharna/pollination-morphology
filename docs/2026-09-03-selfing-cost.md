# #59 — inbreeding depression does close the selfing escape, but the rescue is far tougher than it should be

_2026-09-03. Registered in [the pre-registration](2026-09-03-selfing-cost-prereg.md)
before the run. Follows [#58](2026-09-03-selfing-rate.md), which lifted the floor
with `cost` pinned at 0 in every cell._

## The result

Two things, and they are not the same thing.

**The rescue does not degrade proportionally with inbreeding depression — it is
almost untouched to cost 0.5 and then collapses.** At a minority of one plant,
offspring mothered per plant runs **0.580 → 0.637 → 0.554 → 0.286 → 0.150** as
cost goes 0 → 0.25 → 0.50 → 0.75 → 0.95. Half the selfed seed can die and the
lone plant still mothers what she did before.

**But coexistence closes completely.** HELD falls **0.404 → 0.266**, and 0.266 is
exactly arm A's no-selfing baseline. At 95% inbreeding depression the entire
+0.138 coexistence gain #58 measured is gone.

## Cells and controls

Five cells at N0 = 30, arm A, rate 2.0, **120 seeds each, 109 founded**.

| id       | control                               | result                                                        |
| -------- | ------------------------------------- | ------------------------------------------------------------- |
| **C8′**  | re-run cost-0 cell == #58's archive   | **PASS** — 3,815 generations, 55,767 values, 18 fields, 1e-12 |
| **C5**   | lineage counts exhaust the population | **PASS**                                                      |
| **C9**   | `cf` never exceeds k−1                | **PASS** — 0 violations in 10,163 informative generations     |
| **C10′** | attempted selfing non-zero and flat   | **PASS** — 66.84 / 66.59 / 66.37 / 66.68 / 66.65%             |
| **—**    | cost is not demographic               | **PASS** — recruits/gen 30.000, stalls 0, shortfall 0         |

C1 does not apply and was not run, as registered: these are selfing arms and must
not reproduce arm A's 0.289.

C8′ is the strong one. `cost: 0` draws no random number, so the re-run cost-0
cell is the _same simulation_ as #58's `R200` — and it reproduces it exactly,
which is also what licenses comparing #59's cells to #58's numbers at all.

## ⚠️ C10 cried wolf a SECOND time, for the same reason

#58 recorded that C10 failed its four rate cells while they selfed at exactly the
rates asked, and widened the predicate from an S/Sn name list to `/^R\d+$/`.
**#59's four cost cells then failed the same control the same way.**

The cause was not the regex. "Does this arm self" was being derived **twice** —
once authoritatively in `replicate()`, turning the arm string into
`opts.selfing`, and once again in C10 by re-parsing that same string — so every
new arm name broke whichever copy was not the source of truth. Widening the
pattern a third time would have left the duplication in place for the next naming
dimension to trip; a hypothetical `R200c25n` defeats both the old pattern and the
obvious widening.

So the duplication was removed instead: `experiments/selfing-arms.js` is now the
one place an arm name becomes a selfing config, and C10 asks it. **This is the
#43 single-sourcing lesson, which this repo has already learned twice for
statistics, arriving for a control.**

## ⚠️⚠️ Cost is a COMPETITIVE penalty here, not a demographic one

This decides how everything below reads, and it was measured, not assumed.

With demography off the recruitment loop is `while (next.length < target)`, and a
selfed seed killed by `cost` returns false so the caller does `failed++;
continue` (`sim/ibm.js:1941`). **The slot is not lost.** The loop draws another
mother, and that draw goes to whoever the visit-weighted distribution favours.

| cost | attempted selfing | established selfing | recruits/gen | unmated/gen | shortfall |
| ---- | ----------------- | ------------------- | ------------ | ----------- | --------- |
| 0.00 | 66.84%            | 66.84%              | 30.000       | 0.00        | 0         |
| 0.25 | 66.59%            | 60.00%              | 30.000       | 5.92        | 0         |
| 0.50 | 66.37%            | 49.61%              | 30.000       | 14.95       | 0         |
| 0.75 | 66.68%            | 33.54%              | 30.000       | 29.84       | 0         |
| 0.95 | 66.65%            | 8.86%               | 30.000       | 51.99       | 0         |

Recruits per generation is exactly 30 in every cell. The brief's warning — that
cost might do demographic damage on top of genetic, and that the two must not be
reported as one — is answered: there is no demographic damage to confound.

⚠️ **The established selfed share reads 8.86% at cost 0.95, and reading C10 off
that alone would say the arm stopped selfing.** It did not: attempted selfing is
flat at 66.6–66.8% across the whole sweep. The plants are selfing exactly as hard
and nineteen of every twenty selfed seeds are dying. Attempts are recovered as
`selfedN + unmated`, with "unmated is exactly 0 at cost 0" as the positive
control that says `unmated` is counting what it is claimed to count.

## Primary — offspring mothered per minority plant at k ≤ 2

| cost | mothered/plant [95% CI] | vs cost 0 [95% CI]      | tracer w | obs |
| ---- | ----------------------- | ----------------------- | -------- | --- |
| 0.00 | 0.734 [0.613, 0.842]    | (reference)             | 0.751    | 145 |
| 0.25 | 0.758 [0.628, 0.905]    | +0.027 [−0.151, +0.205] | 0.771    | 178 |
| 0.50 | 0.652 [0.509, 0.785]    | −0.087 [−0.264, +0.090] | 0.643    | 145 |
| 0.75 | 0.604 [0.429, 0.788]    | −0.131 [−0.340, +0.079] | 0.644    | 101 |
| 0.95 | 0.506 [0.294, 0.747]    | −0.219 [−0.484, +0.047] | 0.494    | 79  |

⚠️ **The registered primary returns NO VERDICT.** Every interval contains zero,
and every half-width (0.178, 0.177, 0.210, 0.266) exceeds the registered null
threshold of 0.15. By the rule fixed in advance this is underpowered, **not** a
demonstration that the rescue survives. The means fall monotonically after cost
0.25 and the trend is in the expected direction, but the pre-registration exists
precisely to stop that being reported as a result.

The verdict below rests on the k = 1 series, which is where the registered
criterion actually resolves.

## k = 1 alone — with intervals this time

#58 reported this series as bare means and explicitly declined to make a shape
claim on it. Here it carries a bootstrap interval, as registered.

| cost | mothered/plant [95% CI] | vs cost 0 [95% CI]          | tracer w | lone-gens |
| ---- | ----------------------- | --------------------------- | -------- | --------- |
| 0.00 | 0.580 [0.391, 0.757]    | (reference)                 | 0.599    | 69        |
| 0.25 | 0.637 [0.476, 0.800]    | +0.067 [−0.169, +0.303]     | 0.602    | 91        |
| 0.50 | 0.554 [0.391, 0.720]    | −0.019 [−0.267, +0.229]     | 0.522    | 74        |
| 0.75 | 0.286 [0.125, 0.440]    | **−0.289 [−0.530, −0.049]** | 0.296    | 49        |
| 0.95 | 0.150 [0.000, 0.385]    | **−0.400 [−0.675, −0.126]** | 0.050    | 40        |

**Two intervals exclude zero.** Inbreeding depression erodes the lone-plant
rescue at cost 0.75 and 0.95 — and does not measurably touch it at 0.25 or 0.50.

## The registered shape test — H1 is excluded, H2 survives

`s` = attempted-selfing share at cost 0 = **0.6684**, measured.

| cost | measured [95% CI]    | H1: m(0)(1−c) | H2: m(0)(1−c)/(1−sc) | verdict              |
| ---- | -------------------- | ------------- | -------------------- | -------------------- |
| 0.25 | 0.637 [0.476, 0.800] | 0.435         | 0.522                | **H1 excluded**      |
| 0.50 | 0.554 [0.391, 0.720] | 0.290         | 0.435                | **H1 excluded**      |
| 0.75 | 0.286 [0.125, 0.440] | 0.145         | 0.291                | neither — UNRESOLVED |
| 0.95 | 0.150 [0.000, 0.385] | 0.029         | 0.079                | neither — UNRESOLVED |

**Proportional loss is rejected in the lower half of the sweep, and re-draw
compensation is consistent with all four points.** The registered prediction was
H2, made on the strength of having read the recruitment loop rather than from a
pilot number, and it holds.

The mechanism is the one the loop implies: a killed selfed seed costs the
population a **draw**, not a recruit. A mate-limited mother's share of draws is
unchanged, so as cost rises the loop simply runs longer and she is drawn more
often — which is why she can lose half her seed to inbreeding depression and
still mother what she did before. That compensation is bounded, and past cost 0.5
it stops being enough.

## Coexistence closes — and lands exactly on the no-selfing baseline

| cost | HELD, seeds 1–40 | HELD, all seeds    | vs cost 0 [95% CI]          |
| ---- | ---------------- | ------------------ | --------------------------- |
| 0.00 | 0.395            | 0.404 (44/109)     | (reference)                 |
| 0.25 | 0.342            | 0.321 (35/109)     | −0.083 [−0.211, +0.046]     |
| 0.50 | 0.316            | 0.294 (32/109)     | −0.115 [−0.239, +0.009]     |
| 0.75 | 0.342            | 0.294 (32/109)     | −0.110 [−0.229, +0.009]     |
| 0.95 | 0.342            | **0.266 (29/109)** | **−0.138 [−0.257, −0.018]** |

Only the top cost excludes zero, and its effect is **−0.138** — numerically the
exact negative of the **+0.138** #58 measured for turning selfing on. Arm A's
no-selfing HELD is 0.266 (29/109). At 95% inbreeding depression, reproductive
assurance buys **nothing** in coexistence terms.

⚠️ **The rate returns to arm A's, but not the same runs.** Of the 29 seeds that
hold at cost 0.95 and the 29 that hold in arm A, only **12** are shared — against
about 7.7 expected if the two were independent. So cost-0.95 selfing is not inert:
it reshuffles _which_ lineages survive while restoring _how many_ to the
no-selfing value. That comparison was not registered and is reported as an
observation, not a test.

## Registered predictions: one held, one failed

✅ **"HELD declines toward arm A's 0.266 but does not fall below it."** Held, and
landed exactly on it (0.266, 29/109) rather than merely approaching it. The
reasoning was that the weight floor still hands the rare plant draws she would
otherwise never get, so depression cannot push her below the no-floor case.

❌ **"Lone-generation counts will fall with cost."** Falsified as stated. They run
**69 → 91 → 74 → 49 → 40** — a substantial _rise_ at cost 0.25 before falling.
The prediction was that cost pushes lineages through k = 1 to extinction faster;
at low cost it evidently does the opposite, holding them in that state longer.
The non-monotonicity is not explained here.

## ⚠️ The tracer and the mother-based measure diverge again, at the extreme

At k = 1 the two measures track closely until cost 0.75 (0.286 vs 0.296) and then
split: at cost 0.95 the mother-based measure reads **0.150** and the tracer reads
**0.050**, a factor of three.

Measured rather than asserted: hybrids per lone-generation rise **0.159 → 1.125**
between cost 0 and 0.95. A lone plant has no conspecific mate, so any outcross she
achieves is necessarily cross-lineage; as her selfed seed dies, the offspring that
survive are increasingly hybrids, which the mother-based measure counts as hers
and the tracer does not. This is the same class as #57's factor of seven — the
tracer convention deciding what "her offspring" means — and it is why the primary
is registered on the mother-based measure.

Overall hybrid plant-generations stay under 1.5% in every cell (0.18 / 1.49 /
0.70 / 1.06 / 1.34%), so `anc` remains essentially two-valued and #58's argument
that the HELD inflation artefact does not bite carries over unchanged.

## A correction to #58

#58's HELD table put **0.404 (44/109)** in the "HELD, seeds 1..40" column with
"—" in "all seeds". The bit-identical re-run shows the seeds-1..40 value is
**0.395**, and 0.404 (44/109) is the all-seeds figure — the two columns are
swapped in that row. The registered interval (+0.138 [+0.009, +0.266]) was
computed on all seeds and is unaffected, so #58's verdict stands.

## Limitations

1. **The registered primary is underpowered** (above) and returns NO VERDICT; the
   result rests on k = 1 and on HELD.
2. **The k = 1 sample is not fixed across cost** and does not vary as predicted
   (69 → 91 → 74 → 49 → 40). The comparison is conditional on k = 1.
3. **One rate (2.0), one population size, one premium setting.** Cost was swept
   only where #58 saw coexistence move; whether depression bites differently at
   rates that never moved is untested.
4. `cost` acts at establishment only — no effect on later fitness or on
   subsequent generations, so this is inbreeding depression in its simplest form.
5. The bootstrap resamples seeds **unpaired**, matching #58's estimator for
   comparability even though the arms share seeds and a paired bootstrap would be
   tighter.
6. The shape test discriminates only in the lower half of the sweep; at cost 0.75
   and 0.95 both models sit inside the interval.

## What this adds

#55–#58 built the mechanism: the premium cancels a destabilising force rather
than supplying one; what stops a rare lineage recovering is an absolute floor of
conspecific plants; a lone plant mothers nothing; and reproductive assurance
lifts that floor off zero. #58 flagged that every one of its rescues was an upper
bound because a selfed offspring always established.

#59 collects that debt, and the answer is two-sided. The lone-plant rescue is
**much more robust to inbreeding depression than proportional accounting
predicts** — because a dead seed costs a draw rather than a recruit, and the
mate-limited mother is simply drawn again. But robustness at k = 1 does not buy
coexistence: at 95% depression HELD returns exactly to the no-selfing baseline.
**Selfing's contribution to coexistence is the part that inbreeding depression
takes away first.**
