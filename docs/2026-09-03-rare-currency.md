# #57 — the currency is plants, not co-flowering plants, and a lone plant mothers nothing

_2026-09-03. Registered in [the pre-registration](2026-09-03-rare-currency-prereg.md) before the
run. Follows [#56](2026-09-03-rare-floor.md), which found the floor is a count and used census
count as a proxy for "partners"._

## The result

Co-flowering count is **not** a currency beyond census count. At fixed `k`, having more
co-flowering conspecifics does not raise fitness — and under the premium it slightly **lowers**
it, which turns out to be a visit-allocation effect rather than anything about mating.

Meanwhile #56's mate-limitation reading gets **stronger than it claimed**: a lone minority plant
does not merely fail to produce pure-lineage offspring, she mothers **nothing at all** — not
even hybrids.

## Controls

38 founded of 40 seeds in every cell.

| id      | control                                       | result                                                          |
| ------- | --------------------------------------------- | --------------------------------------------------------------- |
| **C1**  | N0=30 arm A HELD                              | 0.289 vs 0.289 **PASS**                                         |
| **C2**  | N0=30 arm B HELD                              | 0.026 vs 0.026 **PASS**                                         |
| **C3**  | corr(crowding, visits)                        | A: -0.438 / -0.431 / -0.469; S -0.449, Sn -0.461; **B +0.017**  |
| **C5**  | lineage counts exhaust the population         | **PASS**                                                        |
| **C8**  | cell 30:A reproduces #55's arm A rows exactly | **PASS** — 1330 rows, 520 informative, identical to 1e-12       |
| **C9**  | `cf` never exceeds `k-1`                      | **PASS** — 0 violations in 3,194 informative generations        |
| **C10** | the selfing arms self, the others do not      | A/B **0.00%**; S **33.24%**, Sn **33.00%** — **PASS** both ways |

**C8 was re-run rather than assumed to transfer.** #56 passed it with `logMatings` OFF; this
experiment turns the flag ON, so the check was repeated rather than inherited.

**C10 exists because #56 taught it.** An arm that fails to perform its intervention returns a
confident null about that intervention. Measured in both directions, with the documented
`always` arm at 100% as a third point.

## Primary — at fixed count, does co-flowering raise fitness?

Stratified on `k`, split at each stratum's median `cf`, bootstrapped over seeds:

| cell          | d       | 95% CI             | strata | registered reading                    |
| ------------- | ------- | ------------------ | ------ | ------------------------------------- |
| arm A, all N0 | -0.0671 | [-0.1354, -0.0098] | 22     | **negative** — unregistered direction |
| arm A, N0=60  | -0.1009 | [-0.1690, -0.0374] | 21     | **negative** — unregistered direction |
| arm A, N0=30  | -0.0449 | [-0.2041, +0.1300] | 7      | NO VERDICT, underpowered              |
| arm B, N0=30  | +0.1626 | [-0.0005, +0.3649] | 9      | NO VERDICT, underpowered              |

**The registered hypothesis — that `cf` is a currency beyond `k` — is not supported.** The CI
lies _below_ zero in the two well-powered arm-A cells, which the pre-registration classified in
advance as "unregistered direction, reported not interpreted". So it is diagnosed rather than
interpreted, below.

## Why the sign is negative, and it is not about mating

Under a flat per-slice budget the visits in a slice are shared among whoever flowers there, so a
minority whose plants are packed into **one** slice has fewer slices drawing a full allowance
for it. If the fitness effect is that crowding, the same statistic on the **visit ratio** must
be negative — and must vanish in arm B, which has no flat budget to crowd.

| cell          | d(visit ratio) | 95% CI             |
| ------------- | -------------- | ------------------ |
| arm A, all N0 | **-0.2793**    | [-0.3354, -0.1970] |
| arm A, N0=60  | **-0.3209**    | [-0.3717, -0.2436] |
| arm B, N0=30  | +0.0134        | [-0.0301, +0.1006] |

Strongly negative in the premium arms, **indistinguishable from zero in arm B**. ⚠️ This is
post-hoc and labelled as such throughout, but it has a control built into it: the effect is
present exactly where the flat budget is and absent where it is not. The negative sign on
fitness is an **allocation** consequence of the premium, not a statement about mate finding.

## The fallback reading, and a correction to this experiment's own pre-registration

Registered in advance as the reading that would carry the result if the primary went soft:

| cell  | mean cf/(k-1) | n    |
| ----- | ------------- | ---- |
| 20:A  | 0.763         | 291  |
| 30:A  | **0.739**     | 513  |
| 60:A  | 0.675         | 1259 |
| 30:B  | **0.636**     | 253  |
| 30:S  | 0.696         | 679  |
| 30:Sn | 0.369         | 127  |

The premium does raise co-flowering — 0.739 against 0.636 at N0=30 — but ⚠️ **by considerably
less than the 8-seed pre-flight suggested, and the pre-registration quotes the pre-flight's
figure.** It said "0.90 against arm B's 0.65"; at 38 seeds it is 0.739 against 0.636, a gap of
0.10 rather than 0.25. The pre-flight's job was to check whether the two axes are separable at
all, and for that it was adequate; as an effect size it was inflated by its own small sample.

30:Sn's 0.369 sits in a different regime and is not comparable — under `ancNull` the pure-lineage
counts collapse into hybrids, so its "minority" is a small remnant of a mostly-admixed
population.

## Secondary — a lone plant mothers nothing, and the tracer convention decides what that means

`w` counts offspring by their own lineage label; `wMat` counts them by their **mother's**, which
the `anc`-averaging convention cannot touch. They agree wherever nothing blends, and diverge
exactly where the convention bites.

| cell      | k   | w (tracer) | wMat (by mother) | offspring mothered | n   |
| --------- | --- | ---------- | ---------------- | ------------------ | --- |
| 20:A      | 1   | 0.0000     | 0.0000           | **0.000**          | 9   |
| 30:A      | 1   | 0.0000     | 0.0000           | **0.000**          | 7   |
| 30:B      | 1   | 0.0000     | 0.0000           | **0.000**          | 16  |
| 60:A      | 1   | 0.0000     | 0.1058           | 0.111              | 9   |
| **30:S**  | 1   | **0.1111** | 0.1111           | **0.111**          | 18  |
| **30:Sn** | 1   | **0.0000** | **0.9559**       | **0.769**          | 13  |

Three things, in order of how much they change the story.

**1. The registered prediction is falsified, in the informative direction.** The
pre-registration predicted `wMat > 0` at k = 1 — that a lone plant would mother hybrids even
though her lineage ended. She does not: **0.000 offspring** at N0 = 20 and 30, in both arms.
She is not choosing badly, she is not being chosen at all. #56 said a lone plant produces no
_pure-lineage_ offspring; the correct statement is stronger — **she produces no offspring**.

**2. Selfing lifts the floor, modestly.** 30:S mothers 0.111 offspring at k = 1 against 0.000
without selfing, on 33% selfed matings. Reproductive assurance does reach a lone plant, but it
does not rescue her to parity.

**3. The tracer artefact is enormous, and is exactly what `ancNull` was built to expose.** At
k = 1, arm Sn reports fitness **0.0000** while the very same plants mother **0.769** offspring.
Nothing biological separates those two numbers: under `ancNull` a selfed offspring's `anc` is
averaged against a random individual, so it is scored a hybrid rather than its mother's lineage.
⚠️ **A result read off the tracer alone here would have reported that selfing does nothing for a
lone plant, and it would have been wrong by a factor of seven.**

⚠️ S and Sn are not a clean pair for the demographic quantity. `ancNull` changes which offspring
count as which lineage, so the two arms follow different trajectories and reach k = 1 in
differently-composed populations. The S-vs-Sn contrast is sound for the _tracer_ artefact, which
is what it was registered for; it is not a clean measure of how much selfing helps.

## What this settles

- The floor's currency is the **census count of the lineage**, not how many of its plants happen
  to flower together. Co-flowering adds nothing positive once count is held.
- The mate limitation behind it is more absolute than #56 stated: at k = 1 the plant is
  **unpollinated**, not merely unable to make conspecific seed.
- Co-flowering does matter, but through the **premium's allocation**, and in the opposite
  direction: tighter overlap means fewer slices drawing a full budget, so fewer visits per plant.
- Selfing is a real but partial escape from the floor, and measuring it demands the
  tracer-independent quantity.

## Limitations

1. **The negative fitness sign is post-hoc.** Its diagnosis is supported by the arm-B control,
   but it was not predicted and is not treated as a registered finding.
2. **N0=30 and arm B are underpowered** on the primary (7 and 9 strata; half-widths 0.17 and
   0.18). The verdict rests on the pooled and N0=60 cells.
3. **`wMat` is redundant except at k = 1** — without blending an offspring's label is its
   mother's. It earns its place only in the rows that matter here.
4. **One selfing rate** (`rate: 0.5`) at one population size. How far the floor moves with rate
   is unmeasured; #38 swept selfing for a different question and does not answer this one.
