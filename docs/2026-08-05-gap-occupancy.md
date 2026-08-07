# Do intermediates actually arise and bridge? (2026-08-05)

**The subsidised intermediate is real, and it is what fusion runs through.** But
the run also found that one of my own pre-registered criteria was unsatisfiable,
and the strongest evidence turned out to be the arm I added as an afterthought.

## Why this run exists

The rare-bias result closed with a mechanism: at the exclusion separation the
barrier leaks _exactly zero_ pollen, yet strong rare-bias still fuses the two
lineages, because weight goes as `dens^(a-1)` and the lowest-density placement in
a two-cluster population is the **gap between the clusters**. The number quoted
was **136×**.

⚠️ **But 136× is the weight an intermediate _would_ receive.** It was computed by
dropping a hypothetical plant at the midpoint of a _founding_ population and
asking what the kernel would give it. Nothing in that run observed an
intermediate appearing, and nothing observed one carrying genes across. A
mechanism inferred from a static weight is a hypothesis about a dynamical
process — and this project has already been caught reading a number off a
display and naming the wrong organ.

## Three hypotheses

|               | mechanism                                                          | signature                                                    |
| ------------- | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| **H1 BRIDGE** | intermediates arise in the gap, get subsidised, carry genes across | gap fills **before** `ancVar` falls; both ends stay occupied |
| **H2 MERGE**  | no intermediate class; the clusters migrate bodily together        | cores drain to ~empty, everything ends in the middle         |
| **H3 LOSS**   | `ancVar` falls because a lineage dies, nothing bridged             | gap stays empty, ancestry mean runs to 0 or 1                |

H1 is the published explanation. H2 and H3 would both refute it while leaving the
fusion result itself intact, which is why the run was worth doing. H3 is excluded
by construction: only `FUSED` replicates are scored, and `fate` already separates
`FUSED` from `one lost`.

## How it was measured

`run({trace: true})` attaches each generation's placement cloud and the
**parents'** ancestry labels to its history row. Opt-in, consumes no random
numbers, verified bit-identical against the pre-existing golden.

⚠️ **The alternative was to copy the generation loop into the experiment**, and
this project has already recorded what that costs: a helper that recomputed the
behaviour under test left two tests green against a `step()` that ignored a flag.
The trace reports the same objects the model itself scored, so it cannot drift
from the model.

`gapOccupancy(places, pA, pB)` classifies each plant against the **founding**
geometry — near the segment joining the two founding placements (a prolate
ellipse, since the body metric is circular in phi and has no straight line to
project onto) and in neither core.

⚠️ **The reference points are fixed at founding and that is load-bearing.**
Re-deriving "the gap" from the current cloud would be circular: as two clusters
merge, the midpoint of what remains drifts with them, and a fused population
would report a comfortably empty gap forever — the statistic would confirm the
hypothesis it exists to test. A test fails on exactly that mutation.

⚠️ **"The gap is empty" is one of the candidate ANSWERS**, so a statistic
hard-wired to zero would look like a result. Every test asserting an empty gap
asserts a filled one in the same test: unbridged reads **0.000**, a deliberately
bridged population **0.333**, a fully merged cloud **1.000**. Real founding
populations read **0.000**, so any occupancy later is something the run produced.

## PART A — the gap fills first

`a = 0.25`, `d = 8`, 40 seeds (38 founded), 35 generations. `Tgap` = first
generation with ≥10% of plants intermediate; `Tanc` = first generation where
ancestry variance has fallen by half. Threshold declared before the run.

**12 of 38 replicates FUSED. In 11 of those 12 the gap filled first**
(sign test against 50/50, one-sided **p = 0.0032**, two-sided 0.0064). Median
lead **3 generations**; mean `Tgap` 10.3 against mean `Tanc` 13.1.

⚠️ **Seed 38 goes the other way** (`Tgap` 19, `Tanc` 6) and is reported rather
than trimmed. The ordering is a strong tendency, not a law.

⚠️ **Gap-filling is NOT sufficient for fusion.** Several `one lost` replicates
reach peak occupancies of 0.667, 0.500, 0.433 — intermediates arise, and a
lineage is still excluded. Whatever decides between fusion and exclusion is not
captured by occupancy alone, and this run does not identify it.

## PART B — a bridge, not a merge, on a criterion I had to rewrite

⚠️⚠️ **MY PRE-REGISTERED CRITERION FOR THIS WAS UNSATISFIABLE.** I said a bridge
would keep **both cores occupied** while the gap fills. At **fixed population
size that cannot happen**: the gap can only fill by taking plants from somewhere,
and the only somewhere is the cores. A true bridge and a true merge both drain
them, so the criterion could not have discriminated anything. It was written
without noticing that the model's own fixed-N assumption made it vacuous.

What does discriminate is the **end state**, pinned by the synthetic controls: a
merge ends with cores < 0.1 and gap ≈ 1.0. Averaged over the 12 fused replicates:

| gen | gap   | coreA | coreB | cores | ancVar |
| --- | ----- | ----- | ----- | ----- | ------ |
| 0   | 0.000 | 0.500 | 0.500 | 1.000 | 0.250  |
| 8   | 0.173 | 0.401 | 0.406 | 0.807 | 0.159  |
| 14  | 0.371 | 0.301 | 0.264 | 0.565 | 0.103  |
| 20  | 0.364 | 0.242 | 0.256 | 0.497 | 0.056  |
| 32  | 0.349 | 0.234 | 0.145 | 0.379 | 0.014  |

Cores retain **~38%** of the population at generation 32 and both ends stay
occupied, against < 10% for the merge control. So it is a bridge rather than a
migration into the middle — **but that conclusion rests on a criterion rewritten
after seeing the data, and is not pre-registered.** It should be re-run against
the corrected criterion before it is quoted as a finding.

The averaged trace also reproduces the ordering: gap crosses 0.10 near generation
6–8 while `ancVar` halves near 12–14.

## PART C — the causal arm, and the one that carries the result

Every earlier arm explored `a < 1`. The identities say the mate-finding gap is
exactly `a`, which is a claim about `a > 1` too: a **common**-bias should starve
the intermediate rather than subsidise it. 12 seeds per arm.

| a                  | peak gap | mean gap  | HELD / FUSED / one lost |
| ------------------ | -------- | --------- | ----------------------- |
| 0.25               | 0.298    | 0.107     | 4 / 3 / 5               |
| 0.50               | 0.406    | 0.143     | 0 / 3 / 9               |
| **1.00 (no bias)** | 0.129    | **0.024** | 0 / 0 / 12              |
| 1.50               | 0.086    | 0.028     | 0 / 0 / 12              |
| 2.00               | 0.064    | 0.006     | 0 / 0 / 12              |

**The gap fills only under rare-bias** — roughly 5× the mean occupancy at
`a ≤ 0.5` against `a ≥ 1`. This is the causal link the 136× figure never had:
intermediates are not something these runs produce anyway, they are something
rare-bias specifically creates. Had occupancy been the same at `a ≥ 1`, the
subsidy would have explained nothing.

✅ The `a = 1` row independently reproduces the published exclusion result at
`d = 8`: **12/12 lose a lineage**, matching the 0/34 HELD reported earlier.

⚠️ **The predicted monotone decline holds for peak gap** (0.129 → 0.086 → 0.064)
**but not for mean gap**, which goes 0.024 → 0.028 → 0.006. The `a = 1.5`
inversion is small and unexplained; it is reported rather than smoothed.

## What this establishes, and what it does not

**Established.** Rare-bias causes intermediates to occupy the gap (PART C, the
strongest arm); in fused replicates that occupancy precedes ancestry collapse
(PART A, p = 0.0032); and the end state is a bridge rather than a merge (PART B,
on a rewritten criterion).

**Not established.**

- What decides fusion vs exclusion, given that gap-filling occurs in both.
- PART B's conclusion, which needs a pre-registered re-run.
- Whether the intermediates that occupy the gap are the _same individuals_ that
  carry ancestry across. Occupancy and gene flow are correlated here; the
  parentage link is not traced.

## Reproduce

```
node experiments/gap-occupancy.js                 # 12 seeds, all three parts
GO_SEEDS=40 GO_PARTS=AB node experiments/gap-occupancy.js
GO_SMOKE=1 node experiments/gap-occupancy.js      # code path only, not results
```

⚠️ This repo has **no CI**, so the local `node --test tests/` run is the only test
evidence.
