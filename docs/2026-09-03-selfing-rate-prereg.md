# #58 pre-registration — how far does selfing move the floor?

_2026-09-03. Registered before the run. Follows [#57](2026-09-03-rare-currency.md), which found
the floor absolute and selfing a partial escape at one rate._

## What is already settled

[#56](2026-09-03-rare-floor.md) and [#57](2026-09-03-rare-currency.md): the rare-lineage floor
is an absolute **count** of conspecific plants, not a frequency and not a count of co-flowering
ones. At k = 1 a lone minority plant mothers **nothing** — 0.000 offspring at N0 = 20 and 30, in
both arms — so she is not merely unable to make conspecific seed, she is not chosen as a mother
at all.

Selfing is the only intervention that can move that, and #57 measured **one point**: at rate 0.5
with 33% of matings selfed, a lone plant mothers 0.111 offspring against 0.000 without. Real,
partial, and shapeless on a single point.

## The lever spreads — measured before registering

`rate` sets a maternal weight floor of `rate x mean(received)`, and a mother selfs with
probability `floor / (her own weight)`, so the response need not be linear. Measured on 12 seeds
at N0 = 30 before committing to any cells:

| rate         | 0     | 0.25   | 0.5    | 1.0    | 2.0    |
| ------------ | ----- | ------ | ------ | ------ | ------ |
| selfed share | 0.00% | 19.52% | 33.03% | 50.47% | 66.94% |

Five distinct, monotone points spanning 0 to 67%. ⚠️ The pre-flight's k = 1 column is **not**
used to set any band here — it rests on 3 to 7 lone-generations per rate and is exploratory.

## Cells

Selfing rate in {0, 0.25, 0.5, 1.0, 2.0} at **N0 = 30, arm A (premium on), 120 seeds each**.
Rate 0 is arm A itself, re-run at 120 seeds so every rate is compared at matched n.

**120 seeds, not 40, and the reason is measured.** In #57's archived 30:A cell, informative
generations at k <= 1 number 7 per 38 seeds and at k <= 2 number 20. At 120 seeds that is ~22
and ~63. Forty seeds would leave the headline uninterval-able, which is the failure this
pre-registration exists to avoid.

## Primary

**Mean offspring mothered per minority plant, pooled over k <= 2, at each rate**, with a
bootstrap over seeds.

k <= 2 is the floor region and k <= 3 is not: #56 measured w = 0.000 at k = 1 and 0.734 at k = 2
but 1.646 at k = 3, so including k = 3 would dilute the floor with counts that have already
escaped it. k = 1 is reported separately as the structural extreme.

**Registered decision rule, interval-based** — the standing lesson from #56, where a point
estimate cleared a threshold and its interval did not:

| outcome                                                          | reading                           |
| ---------------------------------------------------------------- | --------------------------------- |
| CI of (rate r minus rate 0) excludes 0 above, for at least one r | selfing lifts the floor           |
| every such CI contains 0, and all half-widths < 0.15             | selfing does not lift it — a null |
| every such CI contains 0 and any half-width >= 0.15              | **UNDERPOWERED, NO VERDICT**      |

## Shape, registered in advance

Only if the primary shows a lift. Let `R(r)` be the rescue at rate `r` relative to rate 0, and
consider its increments across the four steps:

- **smooth-monotone** — every increment positive, none dominating
- **saturating** — increments positive then the last is under a quarter of the first
- **threshold** — the first one or two increments' CIs contain 0, then a jump

Classified by which increments' CIs exclude 0, and reported as **shape unresolved** if they all
overlap zero. With five rates this is a description, not a fit, and is labelled as one.

## ⚠️ Every headline is reported BOTH ways, and #57 is why

At k = 1, #57's `ancNull` arm reported tracer fitness **0.0000** while the very same plants
mothered **0.769** offspring — a factor of seven decided entirely by whether a selfed offspring's
`anc` is averaged against a random individual. **A rate sweep read off the tracer alone would
produce a clean, confident, wrong curve.**

So every rate reports the tracer measure `w` **and** the mother-based measure (`opts.logMatings`,
already wired and verified inert), and the primary is the mother-based one.

⚠️ **`ancNull` is NOT used for any cross-rate comparison.** It changes which offspring count as
which lineage, so it changes the trajectory and not merely the accounting — #57's S and Sn
reached k = 1 in differently-composed populations. It is run at one rate only, to size the
artefact.

## Controls

| id      | control                                              | note                                                                                               |
| ------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **C1**  | rate-0 cell HELD on seeds 1..40 = 0.289              | ⚠️ anchors the rate-0 cell ONLY — the selfing arms are a different model and MUST NOT reproduce it |
| **C8**  | rate-0 cell reproduces #55's arm A rows to 1e-12     | on seeds 1..40 of the 120                                                                          |
| **C9**  | `cf` never exceeds `k-1`                             | carried                                                                                            |
| **C10** | selfed share is 0 at rate 0 and spreads across rates | already measured above; re-asserted at full n                                                      |
| **C5**  | lineage counts exhaust the population                | carried                                                                                            |

## Kill conditions

1. **C1 or C8 fails on the rate-0 cell** — the anchor is broken and nothing is reported.
2. **C10 shows the selfed share not spreading** — the lever is inert at full n and the sweep has
   no shape to resolve.
3. **Fewer than 20 informative generations at k <= 2 in any cell** — that cell is reported as
   unestimable rather than given an interval.

## Stated rather than assumed away

**`cost` is 0 in every cell.** A selfed offspring always establishes, which is the most generous
possible case for selfing, so every rescue measured here is an **upper bound**. Inbreeding
depression is a second axis this sweep does not touch and its absence is a limitation, not a
finding.
