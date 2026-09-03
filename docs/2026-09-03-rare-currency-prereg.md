# #57 pre-registration — is the floor's currency plants, or CO-FLOWERING plants?

_2026-09-03. Registered before the run. Follows [#56](2026-09-03-rare-floor.md), which showed
the floor is a count and used census count as a proxy for "partners"._

## The design as filed does not work, and the pre-flight is why

#57 was filed to bin `w` by census count `k` and by co-flowering conspecifics `cf`, and ask
which axis collapses the curves across N0. Measured before registering anything, on 8 seeds at
N0 = 30:

| arm            | cf / (k-1)   | mean sd(cf given k) |
| -------------- | ------------ | ------------------- |
| A (premium)    | 0.75 to 0.98 | 1.720               |
| B (no premium) | 0.44 to 1.00 | 1.575               |

**Under the premium `cf` is about 0.9 (k-1).** The premium drives each lineage into its own
bloom slice — [#55](2026-09-02-rare-advantage.md) measured segregation above 0.75 in 414 of 520
arm-A generations — so a minority plant co-flowers with almost every conspecific it has. A
collapse comparison between `k` and `cf` would be comparing two nearly identical axes and would
return NO VERDICT _by construction rather than by evidence_, which is the failure mode #53 and
#54 already paid for.

⚠️ That the two axes nearly coincide **only under the premium** (0.90 against arm B's 0.65) is
itself a result and is reported whatever else happens: the premium is what makes census count
and partner count the same quantity.

## The replacement, using the spread that does exist

`sd(cf | k) = 1.72` — at k = 11, `cf` ranges from 2.0 to 10.0. So the question can be asked
_within_ a count stratum, where it needs no N0 contrast at all:

> **At fixed minority count `k`, does realised fitness rise with co-flowering partners `cf`?**
>
> - currency is **`cf`** -> positive partial dependence of `w` on `cf` given `k`
> - currency is **`k`** -> `w` is flat in `cf` once `k` is held

**Primary statistic.** Within each `k` stratum holding at least 12 informative generations,
split at that stratum's median `cf` and take mean `w` above minus mean `w` below. Average those
differences across strata, weighting each by its observation count. Bootstrap **over seeds**
(a seed is one trajectory; its generations are not independent draws).

**Registered decision rule — an interval, not a point.** This is the lesson #56 charged for: its
collapse ratio cleared a point threshold at 1.647 and then produced a bootstrap of [0.608,
2.700].

| outcome                                      | reading                                         |
| -------------------------------------------- | ----------------------------------------------- |
| 95% CI excludes 0 and lies above it          | `cf` is a currency beyond `k`                   |
| 95% CI contains 0 **and** half-width < 0.15  | `k` alone suffices — an informative null        |
| 95% CI contains 0 **and** half-width >= 0.15 | **UNDERPOWERED, NO VERDICT** — reported as such |

**Named in advance, the reading that carries the result if the primary goes soft:** the arm-A
against arm-B contrast in `cf / (k-1)`, which is structural, independent of `w` entirely, and
already visible in the pre-flight.

## Secondary 1 — the one intervention that can move k = 1

`selfing` is off throughout #52-#56, so a lone plant's own pollen produces nothing and the k = 1
floor is absolute by construction. `sim/ibm.js:670-701` describes `rate` as a maternal weight
floor under which "a plant nobody visited reproduces almost entirely by selfing" — reproductive
assurance against exactly the mate limitation #56 measured.

Arms at N0 = 30: **S** = `{rate: 0.5, cost: 0}`, and **Sn** = the same plus `ancNull: true`.

⚠️ **The tracer convention, not biology, decides what "the floor lifts" means here, and the run
must not hide that.** Without `ancNull` a selfed offspring inherits the mother's `anc`
unaveraged, so a lone minority plant's selfed seed IS minority and `w` at k = 1 rises above 0.
With `ancNull` that offspring's `anc` is averaged against a random individual, so it is a hybrid
and is not counted — `w` at k = 1 may stay at 0 while the identical plants set identical seed.
**The difference between S and Sn is the artefact, measured rather than argued about**, which is
what `ancNull` exists for.

## Secondary 2 — is a lone plant sterile, or just not perpetuating its lineage?

Registered because #56's headline is ambiguous without it. At k = 1, conspecific outcross
receipt is 0 and self share is 1 — but self share is `self / (self + conspecific outcross)`, and
says nothing about pollen from the _other_ lineage. A lone plant may well mother hybrids.

So a **tracer-independent** fitness measure is added: offspring counted by their **mother's**
lineage, from the realised parentage (`opts.logMatings`, added in #55 and verified inert).
`wMat` is immune to the `anc`-averaging convention entirely.

**Registered prediction:** with selfing off, `w` at k = 1 is 0 while `wMat` at k = 1 is **above**
0 — the lone plant reproduces, and what ends is the lineage, not the plant. If `wMat` is also 0,
she is genuinely unpollinated and #56's mate-limitation reading is stronger than stated.

## Cells

Arm A at N0 in {20, 30, 60} and arm B at N0 = 30, re-run with `cf` and `wMat` recorded; plus S
and Sn at N0 = 30. Six cells, 40 seeds each, one systemd unit per cell, dump checkpointed every
5 seeds.

## Controls carried

| id     | control                                                             |
| ------ | ------------------------------------------------------------------- |
| **C1** | N0=30 arm A HELD on seeds 1..40 = 0.289                             |
| **C2** | N0=30 arm B HELD on seeds 1..40 = 0.026                             |
| **C3** | corr(slice crowding, visits) negative under the premium, ~0 without |
| **C5** | lineage counts exhaust the population                               |
| **C7** | `visitsPerPlant=800` a no-op at N0=30 and not inert at N0=60        |
| **C8** | cell 30:A reproduces #55's arm A rows exactly, to 1e-12             |

⚠️ **C8 must still pass with `logMatings` now ON in this experiment.** It passed in #56 with the
flag OFF against #55's arm A which had it ON, so the flag is already known not to matter; this
re-checks it rather than assuming the earlier check transfers.

**New control, C9:** `cf` must never exceed `k - 1`. It is a count of _other_ conspecifics, so
`cf > k-1` is impossible and would mean the predicate is counting the plant itself or crossing
lineages. Asserted per generation.

## Kill conditions

1. **C1, C2 or C8 fails** — nothing is reported.
2. **C9 fails** — the co-flowering measurement is wrong and the primary is void.
3. **Fewer than 4 usable `k` strata** — the stratified statistic has nothing to average and is
   reported unestimable rather than computed.
