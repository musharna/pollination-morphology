# #64 pre-registration — coverage as a dose: a flat floor given to only a fraction of plants

_Written 2026-09-05, before any implementation exists and before any sweep has
run. Both pre-flights below were run first, on shipped code and shipped data,
and each one changed this design — the first changed the DIRECTION of the
registered prediction, the second changed the GRID. Recorded here in the order
they happened._

## The question

#63 found that withdrawing assurance from 69.1% of plants destroys a third of
all coexistence (**HELD 0.404 → 0.266, −0.138 [−0.257, −0.018]**), while a
second arm that ablated the same correlation and starved nobody did no harm at
all. Its conclusion was that **the floor is a coverage device, not a targeting
device**: any rule that gives a partnerless plant non-zero maternal weight
suffices, and a rule that stops doing so for two-thirds of plants stops doing
the job.

That conclusion rests on one point on the coverage axis, reached sideways —
69.1% was not chosen, it fell out of clipping OLS residuals at zero. #64 makes
coverage its own knob and sweeps it: keep the flat floor's SHAPE exactly, hand
it to a (1 − q) fraction of plants chosen **at random**, C-matched so every arm
spends the same total assurance, and vary q.

This is the axis #63's own headline demands. #63's tell was **"a refutation is
scoped to the magnitude it was measured at"** — #62 refuted the abandoned-plant
mechanism at 4.3% and #63 found it decisive at 69.1%. The honest response to
that tell is not another single magnitude. It is the curve.

## Pre-flight A — from #63's shipped archive, no simulation

`_scratch/rf64-preflight-a.js`, run against
`docs/data/2026-09-05-selfing-resid.json.gz`.

The filed task predicted that random starvation at q = 0.691 would **reproduce**
#63's clipped arm, on the reasoning that both withdraw assurance from the same
share of plants. That prediction is wrong, and the archive says so:

|   arm | starved (all) | minority | majority | **P(SHE is starved \| k=1)** | gens / seeds |
| ----: | ------------: | -------: | -------: | ---------------------------: | -----------: |
|  flat |          0.0% |     0.0% |     0.0% |                         0.0% |      69 / 45 |
|  dose |          4.4% |     5.3% |     4.1% |                         4.0% |      75 / 40 |
|  clip |     **69.1%** |    62.2% |    72.0% |                    **10.0%** |      70 / 46 |
| shift |          4.7% |     5.2% |     4.7% |                         7.1% |      70 / 43 |

⚠️ **#63's clip is not a blind coverage cut. It is an accidentally TARGETED rule
that protects almost exactly the plant the floor exists for.** It starves 69.1%
of plants and starves the lone k = 1 minority plant 10.0% of the time. The
mechanism is structural rather than lucky: a partnerless plant has
`received ≈ 0`, so the OLS residual of her diagonal on `received` is large and
positive, so clipping at zero keeps her.

Random starvation at the same nominal rate hits her at ~69% — about **seven
times** the rate. C-match widens the gap rather than closing it: when clip
spares her she draws ~7.4× the flat floor (measured in #63's pre-flight),
whereas random spares her only 30.9% of the time and pays 1/(1 − q) = 3.24×
when it does.

**Therefore #64 registers "worse than clip", not "equal to clip".** And it
sharpens #63 in retrospect: the third of coexistence clip destroyed is a **lower
bound** on the cost of losing coverage, because clip was quietly protecting the
critical plant the entire time it did the damage.

### ⚠️ Correction to this section, recorded BEFORE the sweep ran

_Added later on 2026-09-05, after the implementation existed and its tests ran,
and before any sweep was submitted. No #64 result exists at the time of writing._

The paragraph above says clip "protects almost exactly the plant the floor
exists for". **That is true at k = 1 and overstated everywhere else, and the
overstatement was caught by a test that failed.**

Measured on the new implementation over 8 seeds × 12 generations, on **every**
plant with `received === 0` rather than only the lone minority plant at k = 1:

| rule                     | starved overall | starved AMONG `received === 0` |
| ------------------------ | --------------: | -----------------------------: |
| random coverage q = 0.69 |           ~0.70 |                      **0.726** |
| #63's clip               |          ~0.691 |                      **0.468** |

Random sits on its blind null, as it must. Clip sits clearly below its own —
so clip **is** targeted, which is what #64's prediction requires. But it kills
roughly **half** the exposed class, not the ~10% pre-flight A found at k = 1.

Both numbers are correct and the reconciliation is mechanical: at
`received === 0` the OLS residual reduces to `self − a`, so whether clip spares
a partnerless plant turns on **her own self-pollen against the intercept**.
About half the exposed class carries too little display to clear it. The k = 1
minority plant does clear it, because she is the extreme member of the class —
partnerless _and_ heavily geitonogamous — not a typical one.

⚠️ **So clip's protection is CONCENTRATED AT LOW k rather than uniform**, and
#64's harshness advantage over clip should therefore be expected to be
concentrated at low k too. The registered direction is unchanged — clip is not
blind, and random is strictly harsher at the plant that ends coexistence — but
the claim is now scoped to where it was measured. The tests assert clip against
**its own blind null** rather than against a ratio chosen by hand, so the
property they hold is "clip is not blind", which is what the prediction needs,
and not "clip spares nearly everyone", which is false.

⚠️ **Scope limit on this pre-flight, stated because it is the exact hazard #63
was built around.** `P(· | k = 1)` is collider-conditioned. It cannot be a
result and is not used as one. It is admissible here as a **design** input only:
it establishes that the two treatments differ mechanically at the plant that
matters, which is enough to fix the direction of a prediction. #64's own primary
is unconditional.

## Pre-flight B — by re-simulation, flat arm only, shipped code

`_scratch/rf64-preflight-b.js`, arm `30:R200`, N0 = 30, 35 generations, seeds
1–25 (24 founded), 840 generations, 25,200 plant-generations. No new option is
set and no new branch exists yet; this measures the NULL arm.

| quantity                                                |                              value |
| ------------------------------------------------------- | ---------------------------------: |
| plants with `received === 0` (weight is ENTIRELY floor) |                          **8.81%** |
| — of minority plants                                    |                         **18.01%** |
| — of majority plants                                    |                              8.35% |
| generations containing ≥ 1 such plant                   |                             86.07% |
| **P(her `received === 0` \| k = 1)**                    | **100.00%** (15/15 gens, 11 seeds) |
| floor / (received + floor): median                      |                          **0.677** |
| plants for whom the floor is > 50% of maternal weight   |                         **93.50%** |

Two findings, and they do different work.

**First, #61's wall, measured directly on the null arm.** At k = 1 the lone
minority plant had `received === 0` in **every generation observed**. Her
maternal weight is the floor and nothing else. Starving her is not a demotion to
a worse chance; it is weight exactly zero, and `pick()` never returns her. With
pre-flight A this closes the mechanism: clip spares her ~90% of the time, random
at matched nominal coverage spares her ~31%.

**Second — and this changed the grid — coverage is not a scalpel.** At rate 2.0
the floor is the MAJORITY of maternal weight for 93.5% of plants (median share
0.677). Withdrawing it is a ~3× weight cut for nearly everyone, while C-match
hands the covered fraction 1/(1 − q)×. So the treatment injects variance into
maternal weight across the whole population, with severity going as q/(1 − q):
**0.33, 1.00, 2.24, 5.67** at q = 0.25, 0.50, 0.69, 0.85. That is sharply
convex, and a two-point design could not tell it from a step.

## The three mechanisms, and why the grid is the discriminator

| #       | mechanism                                                                                                                                                                                                              | prediction for the q → HELD curve                                                                                                                           |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **H-a** | **KILL.** Coverage acts only through plants with `received === 0`, whose weight goes to exactly zero (#61's wall).                                                                                                     | Harm roughly **linear** in q; total drop bounded by the floor's whole benefit (flat − no-floor, measured in this sweep); concentrated in low-k generations. |
| **H-b** | **LOTTERY.** Under C-match the covered fraction is paid 1/(1 − q)×, so maternal weight becomes high-variance for the 93.5% of plants the floor dominates. Drift accelerates, and drift removes the rare lineage first. | Harm **convex** in q, accelerating at high q; q = 0.85 falls **below** the no-floor baseline — worse than never having had a floor. Visible at all k.       |
| **H-c** | **CONSERVED TOTAL.** C-match preserves total assurance, so who receives it is immaterial; #63's clip harm was caused by residual TARGETING, not by starvation.                                                         | **No** coverage effect at any q. Would contradict #63's discriminator, which found the harm on the starvation axis and not the ablation axis.               |

Evidence already in hand: H-a is supported by both pre-flights and cannot be the
whole story if the harm exceeds the floor's total benefit; H-b is supported by
pre-flight B's 93.5% and by the fact that #63's clip (HELD 0.266) already sits
nominally below the published 40-seed no-floor anchor (0.289) — **flagged as
motivation and explicitly NOT as evidence**, since those are different seed sets
and #64 re-measures the anchor on its own seeds; H-c is not distinguished by
anything #63 ran, because #63's harmless arm did not starve.

⚠️ **The discriminator is the SHAPE of the dose-response curve, not any single
contrast.** That is the reason #64 is a sweep. A one-point design at q = 0.69
would separate H-c from {H-a, H-b} and could not touch the split that matters.

## Arms

Eight cells, all at N0 = 30, rate 2.0, cost 0, 35 generations, `RF_SEEDS=120`
(the same 120 draws that founded #63's 109 seeds, so seeds are shared and every
contrast is paired on founding seed).

| cell         | what it is                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------------- |
| `30:A`       | **no floor at all.** The anchor: coexistence without assurance.                                |
| `30:R200`    | the flat floor. The reference arm.                                                             |
| `30:R200q0`  | coverage q = 0. **C-null — must be BIT-IDENTICAL to `30:R200`.**                               |
| `30:R200q25` | q = 0.25                                                                                       |
| `30:R200q50` | q = 0.50                                                                                       |
| `30:R200q69` | q = 0.69 — matched to clip's measured 69.1% within grid resolution                             |
| `30:R200q85` | q = 0.85                                                                                       |
| `30:R200r`   | #63's clip, re-run. The matched-coverage head-to-head, and the C-anchor against #63's archive. |

The starved set is redrawn **every generation**, from a **dedicated rng stream**
in the style of `signalRng`/`bloomRng`/`widthRng`, so the main stream is
untouched and q = 0 reproduces the flat arm bit-for-bit rather than merely
distributionally. Selection is a partial Fisher–Yates over plant indices taking
`n − round(q·n)` winners, each paid `rate · Σreceived / (n − round(q·n))`.

⚠️ `round(q·n)` means **realised** coverage differs from nominal (at n = 30:
8/30 = 0.267, 15/30 = 0.500, 21/30 = 0.700, 26/30 = 0.867). Realised coverage is
measured on shipped rows and reported as a control; nominal q is a label.

⚠️ q = 1 is **not swept**. It would spend zero assurance and so break C-match by
construction; `30:A` is the cleaner anchor for that endpoint. The degenerate
case is covered by a unit test asserting q = 1 yields all-zero `selfW` rather
than a division by zero.

## The registered primary

**HELD (coexistence, `fate === "HELD"`), per run, no `k` filter, no conditioning
of any kind, contrast `30:R200q69` vs `30:R200`, paired on founding seed,
10,000 bootstrap resamples over SEEDS.**

Decision rule, fixed now:

- **H1** — the interval excludes zero and is negative ⇒ random coverage loss
  destroys coexistence. Additionally recorded: whether the point estimate is
  more negative than #63's clip-vs-flat **−0.138**.
- **H2** — the interval includes zero ⇒ coverage at 69% does not move
  coexistence when the starved set is random, which would put #63's harm on the
  targeting axis after all and require #63's conclusion to be revised.
- **H3** — the interval excludes zero and is positive ⇒ withdrawing assurance
  from 69% of plants at random IMPROVES coexistence. No mechanism above predicts
  this; it would be reported as an anomaly and not explained after the fact.

### ⚠️ Disclosure: the primary has been changed from #63's, after seeing #63's data

#63 registered `motheredTotal` as its primary. It returned H2 (interval included
zero) while HELD — a registered secondary — excluded zero. #64 registers **HELD**
as the primary. **This choice was made after seeing which outcome was sharper in
#63, and that is a garden-of-forking-paths hazard which pre-registering it here
does not erase.** It is made anyway, for three reasons stated in advance:

1. HELD is the arc's target construct. Every question from #56 onward has been
   about coexistence; `motheredTotal` is an intermediate.
2. It is unconditional and has no treatment-movable denominator — the property
   #63 was built to secure after #62's collider inverted.
3. It is a binary, and therefore lower-variance than a count summed over a
   number of informative generations that the treatment itself moves.

`motheredTotal` ships as a **registered secondary on every contrast**, so #63's
comparison survives intact. If the two disagree again, the disagreement is
reported as a disagreement and NOT resolved in favour of whichever excludes
zero.

## Registered secondaries

All unconditional, all paired on founding seed, all with 10,000 resamples.

1. **The dose curve.** HELD at every q with its interval, plus the
   pre-specified monotonicity check that the point estimates are ordered
   `flat ≥ q25 ≥ q50 ≥ q69 ≥ q85`, and the paired difference **q85 − q25** with
   its interval. Reported whether the curve is closer to linear (H-a) or convex
   (H-b) in q, using the pre-specified comparison of the q25→q50 step against
   the q69→q85 step.
2. **The anchor crossing.** HELD at `30:A`, measured on these seeds, and whether
   any coverage arm's interval lies **below** it. H-b predicts q = 0.85 does;
   H-a forbids it.
3. **The mechanism head-to-head.** HELD at `30:R200q69` vs `30:R200r`, paired.
   Predicted negative: random starvation is harsher than residual starvation at
   matched coverage. This is the direct test of pre-flight A.
4. **`motheredTotal`** — #63's primary — on every contrast above.
5. Generations with both lineages present; generations at k = 1; ever reached
   k = 1.
6. **#62's collider-conditioned `minMothered` at k = 1**, printed for every arm
   and **labelled collider-conditioned**, explicitly unable to change any
   verdict. #63 showed this statistic can invert; it is carried only so the
   inversion can be seen to recur or not on a second, independent treatment.

## Controls

| id           | control                                                                                                                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C-null**   | `30:R200q0` is **bit-identical** to `30:R200` on every shipped row. The coverage path draws only from its own stream, so switching it on must not perturb the model.                                |
| **C-match**  | every coverage arm spends `rate · Σreceived` exactly (relative gap < 1e−12), at g = 0 across all arms and seeds.                                                                                    |
| **C-cover**  | **realised** starved share per arm equals `round(q·n)/n`, measured on shipped rows, reported beside nominal q.                                                                                      |
| **C-kill**   | the kill channel measured directly: count of plants with `received === 0` AND `selfW === 0`, split by lineage. This is what discriminates H-a from H-b on the shipped data rather than by argument. |
| **C-anchor** | `30:R200` and `30:R200r` reproduce #63's archive exactly, row for row, through changed code.                                                                                                        |
| **C10**      | every selfing arm actually selfs at the rate asked.                                                                                                                                                 |
| **C-seed**   | distinct seed counts printed beside every aggregate.                                                                                                                                                |
| **negctl**   | ⚠️ the controls must be SEEN TO FAIL: a doctored copy of the sweep dump violating each control's premise in turn must be detected, with a positive control asserting untouched input still passes.  |

## What would make this uninformative, stated in advance

- If `30:A` and `30:R200` do not differ on these seeds, the floor has no benefit
  to withdraw and the whole coverage axis is measuring noise. The sweep reports
  this and stops rather than interpreting the q arms.
- If every coverage arm goes extinct so often that HELD is near zero throughout,
  the grid is too harsh and the answer is "somewhere below q = 0.25", not a
  curve. Reported as such.
- The monotonicity check is descriptive. Five point estimates ordered correctly
  is weak evidence on its own and is reported with its intervals, not as a test.
