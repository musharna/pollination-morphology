# #56 pre-registration — is the rare-lineage floor a COUNT or a FREQUENCY?

_2026-09-03. Registered before the run. Follows [#55](2026-09-02-rare-advantage.md), which
found the floor and did not explain it._

## What #55 left

The per-slice premium gives a rare lineage a large per-capita **visit** advantage — 3.52x
[2.545, 4.662] below minority frequency 0.1, against 0.99-1.02 in the no-premium arm — and that
advantage **fails to convert into offspring exactly where it is largest**: realised per-capita
fitness is 0.477 [0.130, 0.732] below p = 0.1.

The candidate explanation is mate finding, and #55 could not test it because at N0 = 30 a
minority **frequency** of 0.1 IS a minority **count** of 3. The two are the same number.

## The test

Mate finding is about absolute numbers — how many compatible partners are co-flowering. A
frequency-dependent explanation is about the ratio. Varying N0 separates them, and the two
predictions are **opposite in `p` and identical in `k`**:

| N0     | count-based floor at k ~ 3 | frequency-based floor at p ~ 0.1 |
| ------ | -------------------------- | -------------------------------- |
| **20** | p ~ 0.15                   | k ~ 2                            |
| **30** | p ~ 0.10                   | k ~ 3                            |
| **60** | p ~ 0.05                   | k ~ 6                            |

So the design cannot come back ambiguous the way #53 and #54 did: whichever axis is the real
one, the other must move in a specific direction by a specific amount.

## Configuration, and why per-plant service is held constant

`opts.visits` is a **constant total** shared over however many plants there are, so varying N0
with it fixed would silently change per-plant service and confound "fewer plants" with "more
service each". `opts.visitsPerPlant` makes the budget `visitsPerPlant * n` instead — constant
per-plant service.

**`visitsPerPlant = 800` is used throughout, and at N0 = 30 it is a no-op**: the budget is
`round(800 * 30) = 24000`, exactly `opts.visits`. Verified rather than assumed — 10/10 seed-arms
bit-identical in both ancestry and visit spend, and simultaneously verified NOT inert elsewhere
(N0 = 60 spends 48000). That makes the N0 = 30 arm a **byte-level anchor to #55**.

| N0  | generations | why                                                                       |
| --- | ----------- | ------------------------------------------------------------------------- |
| 20  | 23          | `round(35 * N0/30)` — equalises drift time in units of population size    |
| 30  | 35          | the #55 anchor, unchanged                                                 |
| 60  | 70          | drift is ~2x slower at twice the size; without this the tail is unsampled |

Arms **A** (premium on) and **B** (premium off) at every N0; 40 seeds each.

## Primary — which axis collapses the curves

Realised per-capita fitness `w` (minority over majority) is binned twice: by minority **count**
`k` and by minority **frequency** `p`. Over the shared domain of each axis (k in 1..10, since
N0 = 20 admits no larger minority; p in 0.05..0.5) compute

    D = mean over bins of [ SD across the three N0 values ] / mean over bins of |w - 1|

normalised so the two axes are comparable, and report **`D_p / D_k`**:

- **> 1.25** — the curves collapse better on COUNT. The floor is a count; mate finding.
- **< 0.80** — they collapse better on FREQUENCY. The floor is a ratio; not mate finding.
- **0.80 to 1.25** — **NO VERDICT**, reported as such.

Bins with fewer than 5 observations at any N0 are excluded from the shared domain, and the
count of contributing bins is printed beside the ratio — a collapse statistic computed over two
bins is not a result.

## Secondary — the crossing points

The `k` and the `p` at which `w` crosses 1, per N0, by linear interpolation. The count
hypothesis predicts `k*` agrees across N0 and `p*` does not; the frequency hypothesis predicts
the reverse. **Registered requirement: the crossings must agree with the primary.** If the
whole-curve collapse and the crossing points point different ways, that is estimator dependence
and **no branch is claimed** — the standing lesson from #54's amendment A9.

## Secondary 2 — is it geitonogamy, measured directly

`visitsTo` counts landings, "NOT how much outcrossed pollen moved — the two differ exactly by
the geitonogamy term" (`sim/ibm.js:2058`). The transfer matrix has a diagonal and `received`
explicitly skips it (`sim/ibm.js:1751`, "selfing is not mating success"), so self-pollen is
separately measurable. Per lineage, per capita, from `T`:

- **self** receipt `T[j][j]`
- **conspecific outcross** receipt, sum over `i != j` of same lineage
- **heterospecific** receipt, sum over `i != j` of the other lineage

**Registered prediction under mate limitation:** as the minority thins, its per-capita
**visits** rise while its per-capita **conspecific outcross receipt** falls, and its self share
`self / (self + outcross)` rises. If instead the self share is flat while fitness still
collapses, geitonogamy is not the mechanism and #55's suggested explanation is wrong.

## Controls

| id     | control                                                                               | fails if                                              |
| ------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **C1** | N0=30 arm A HELD on seeds 1..40 = 0.289                                               | the anchor does not reproduce #55                     |
| **C2** | N0=30 arm B HELD on seeds 1..40 = 0.026                                               | same, other arm                                       |
| **C3** | corr(slice crowding, visits) negative in A, ~0 in B, at every N0                      | the flat budget's signature is not present            |
| **C5** | lineage counts exhaust the population at every N0                                     | the counting is wrong                                 |
| **C7** | `visitsPerPlant=800` bit-identical to `visits=24000` at N0=30, and NOT inert at N0=60 | the anchor is not an anchor, or the knob does nothing |
| **C8** | N0=30 arm A's `w`-by-frequency table reproduces #55's published values                | this runner's statistics have drifted from #55's      |

**C8 is the #43 guard.** This experiment computes `w` in its own file, which is a second
implementation of a quantity #55 already published. It is required to agree with the archived
#55 numbers at the shared configuration, and disagreement stops the run rather than being
explained.

**C7 is already discharged** — measured before registering: 10/10 seed-arms bit-identical at
N0=30, and 48000 vs 24000 spend at N0=60.

## Kill conditions

1. **C1 or C2 fails** — the anchor is broken; nothing is reported about any N0.
2. **C8 fails** — the two implementations of `w` disagree; nothing is reported.
3. **Fewer than 4 shared bins** on either axis — the collapse statistic has nothing to average
   and is reported as unestimable rather than computed.

## What is deliberately NOT claimed

The **spend-matched arm** is included at N0 = 30 only, as arm `Bx`: arm B with its budget
inflated so its realised visit **spend** matches arm A's. ⚠️ Note this corrects #55's own
statement of the limitation — the arms were always **given** the same budget (24000); what
differs is how much of it the allocation rule **consumes** (15956 vs 10135). So this is not a
"budget-matched" control in the sense #55 described; it asks whether arm A's advantage survives
when arm B is handed enough extra budget to deliver the same number of visits.
