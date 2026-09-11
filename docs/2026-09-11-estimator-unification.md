# Result — the hand-rolled `ci()` helpers, retired and checked

**Date:** 2026-09-11 · **Status:** run, 8/8 complete · **Registered in:**
[2026-09-11-estimator-unification-prereg.md](2026-09-11-estimator-unification-prereg.md)
**Runs:** jobd jobs 3732–3736 plus two local (`hybrid-placement`, both arms)

Closes disposition row 8 of [RELEASE-1.0.md](RELEASE-1.0.md) §2.4. **Nothing here revises a
headline finding.** One published interval is materially wrong and is corrected; every directional
verdict in the project survives.

## The headline: `n` was 4, not 5

`docs/2026-08-04-density-dependence.md` never recorded its sample size. RELEASE-1.0 §2.3 could
therefore only **bound** the correction — "+42% at n=5, +119% at n=3" — and said so rather than
silently restating an interval it could not reconstruct. The run settles it:

**Every treatment row ran at `n = 4`.** The true widening is `t(3)/z = 3.182/1.960` = **+62%**,
inside the bracket 1.0 quoted but not equal to either end of it.

The mechanism is visible and is the one 1.0 suspected: the runner draws `SEEDS = [1,2,3,4,5]` with
`continue` guards that can drop a seed. **The treatment arms lose exactly one; the positive controls
keep all five** — `n = 4` and `n = 5` side by side in the same run. This replicates across two
independent runners:

| run                             | rows at `n=4` | rows at `n=5` |
| ------------------------------- | ------------- | ------------- |
| `density-dependence`, both arms | 5             | 5             |
| `limiting-factors`, both arms   | 30            | 10            |

No row anywhere ran at `n < 3`, so P3's refutation condition never fired.

### `density-dependence` — the corrected intervals

| row                        | published (z, n assumed 5)       | **corrected (t, n = 4)**                   | verdict      |
| -------------------------- | -------------------------------- | ------------------------------------------ | ------------ |
| rare B at freq 0.10        | 0.214 ± 0.072 → `[0.142, 0.286]` | **0.213890 ± 0.116346 → `[0.098, 0.330]`** | below 1.0 ✅ |
| symmetric point, freq 0.50 | 0.981 ± 0.142 → `[0.839, 1.123]` | **0.981179 ± 0.230866 → `[0.750, 1.212]`** | spans 1.0 ✅ |
| common B at freq 0.90      | 4.654 ± 0.556 → `[4.098, 5.211]` | **4.654337 ± 0.903295 → `[3.751, 5.558]`** | above 1.0 ✅ |

**"The sign is backwards — a rare lineage does worse" does not depend on the estimator**, exactly as
1.0 predicted from the bound.

## P1 — no directional verdict moves. HOLDS.

| experiment           | row                     | corrected (t)    | claim                    | survives                 |
| -------------------- | ----------------------- | ---------------- | ------------------------ | ------------------------ |
| `hybrid-placement`   | NET matching effect     | `[0.705, 0.912]` | 19.1% cost, excludes 1.0 | ✅                       |
| `hybrid-placement`   | clonal control          | `[0.918, 1.001]` | cannot exclude 1.0       | ✅ (still cannot)        |
| `hybrid-placement`   | rare among both parents | `[0.658, 0.844]` | excludes 1.0             | ✅                       |
| `density-dependence` | all three               | above            | sign backwards           | ✅                       |
| `secondary-contact`  | matched anchor          | `[0.505, 0.751]` | "reproduction in kind"   | ✅ (upper 0.749 → 0.751) |

## P2 — pinned runs reproduce the published numbers. HOLDS, with one honest gap.

Every row that the committed runner still computes reproduces **to every printed digit**:

| experiment           | published (z)                                 | pinned arm A measured                                               |
| -------------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| `hybrid-placement`   | 0.751 ± 0.091 · 0.960 ± 0.040 · 0.809 ± 0.101 | **0.750980 ± 0.091342 · 0.959545 ± 0.040300 · 0.808513 ± 0.101189** |
| `density-dependence` | 0.214 ± 0.072 · 0.981 ± 0.142 · 4.654 ± 0.556 | **0.213890 ± 0.071654 · 0.981179 ± 0.142183 · 4.654337 ± 0.556310** |
| `secondary-contact`  | 0.628 ± 0.121 (matched anchor)                | **0.627977 ± 0.120728**                                             |

So the published numbers **did** come from the committed runner — the question the `v2` episode made
worth asking, answered affirmatively here.

⚠️ **The gap.** Two rows published in `2026-08-04-secondary-contact.md` — "wrong construction"
`1.145 ± 0.252` and "wrong sample size, n=12" `0.877 ± 0.305` — **are not produced by the runner at
all**; there is no `n = 12` computation in it. They are narrative diagnostics describing earlier
mis-constructed attempts, not outputs of the committed code. This retroactively justifies
RELEASE-1.0 §2.3 recomputing them from published statistics rather than from a run, and labelling
them "anchor-gate diagnostics". **They remain un-reproducible by construction**, and that should be
said in the source document rather than left for the next person to discover.

## P4 — arm B differs from arm A. ⚠️ REFUTED, 4 out of 4.

This was registered as: _"If arm B matches arm A everywhere, that is the surprise."_ It matched
everywhere.

| experiment           | probes | arm A vs arm B             |
| -------------------- | ------ | -------------------------- |
| `hybrid-placement`   | 4      | **identical, every digit** |
| `density-dependence` | 10     | **identical, every digit** |
| `limiting-factors`   | 40     | **identical, every digit** |
| `secondary-contact`  | 7      | **identical, every digit** |

**34 commits to `sim/` since these published — touching `carryover.js`, `evolve.js`, `ibm.js` and
`verdict-gates.js`, all on these experiments' dependency paths — moved not one digit.**

The `secondary-contact` case is the sharpest, because there the two arms ran **different runners**:
arm A the published one, arm B today's, which carries the `a084f5b` verdict-gate fix that arm A
lacks. They still agree exactly. That is coherent with what the fix actually did — the
instrument-debt table records it as making "the positive text unreachable except through `claim()`",
i.e. it changed which **verdict text** was reachable, not which **numbers** were computed.

### What this costs the design

**The two-arm design was unnecessary, and the §6/§8 agonising over how to pin `secondary-contact`
was moot.** The pin-versus-supersede distinction only matters if drift moves numbers, and here it
moves none. Recorded because the reasoning was sound in advance and the answer was not knowable
without running it — but the next estimator-style correction in this repo should run one arm, check
a cheap experiment for drift first, and only add the second arm if drift is demonstrated.

This does **not** generalise past these four. `v2` genuinely did move under drift; that is why the
pin discipline exists. The finding is that these four are insensitive, not that drift is harmless.

## Method

Arm A is `sim/` **and** the runner at each document's publishing commit — `9d4df53`
(`hybrid-placement`), `7f58d96` (`density-dependence`), `16e40aa` (`limiting-factors`), `4b1eebd`
(`secondary-contact`). Arm B is today's tree. In both, the hand-rolled `ci()` was replaced by
`sim/paired-stats.js` `interval()`, which returns the t and z intervals together; each call emits
`n`, `mean`, `z_half` and `t_half`. The **z column is the reproduction instrument** — it must match
the published half-width, and it does.

`sim/paired-stats.js` exists at none of the four pins, so today's copy was placed in each pinned
worktree. It cannot contaminate the model: `interval()` is mean, sd and `tCrit` — pure arithmetic,
no model state, no RNG. (The only `E.makeRng` call in that file is inside `pairedCI`, the bootstrap,
which is not used here.)

⚠️ **`ci()` is called twice for every statistic** in `density-dependence`, `limiting-factors` and
`secondary-contact` — the probe sequence shows each value computed twice. Harmless, and tidied by
the consolidation this document registers.

## The code change, landed

The four hand-rolled helpers are deleted. All four experiments now call `PS.makeCi(label)` from
`sim/paired-stats.js`, which returns the Student's t half-width **and records `n`, the mean and the
half-width for every interval it computes**, emitting a provenance block to **stderr** at exit —
stderr rather than stdout so each runner's published table keeps its exact shape.

Verification: the swapped `hybrid-placement` on `master` reproduces the pinned-arm numbers to the
digit (`n = 58`, halves `0.093322 / 0.041174 / 0.103384`). Suite **367/367**, 0 fail.

`tests/paired-stats.test.js` gains four tests, one of which reconstructs the superseded `1.96`
helper and asserts the t interval is ~62% wider at `n = 4`, so it can tell the two estimators apart
rather than agreeing with whatever is in the file. A fifth scans **every** file in `experiments/`
for a re-introduced `1.96 * sd` and was **watched failing** before the swap — it named exactly the
four offenders — and passing after.

## ⚠️ What this does NOT fix, stated plainly

It is tempting to call the recording of `n` a root-cause fix. It is not. Three candidate mechanisms
for "a published interval became unreconstructable":

1. **The helpers did not record `n`.** Against: recording `n` in the _helper_ does not put `n` in the
   _document_. The provenance block goes to stderr, and an author writing up results from stdout may
   never see it.
2. **The seed drop is silent.** The `continue` guards discard a seed without announcing it, so the
   author did not know `n ≠ 5`. This is upstream of (1) but expresses through it.
3. **The publication path is hand-copied** — numbers reach documents by a human transcribing run
   output, with nothing checking the document against any run.

**(3) is the mechanism, and the discriminator is in this very document:** two rows published in
`2026-08-04-secondary-contact.md` correspond to **no computation the runner performs**. Neither (1)
nor (2) can put a number into a document that the code never produced; only a hand-authored path can.

So the honest scope of this work: **the estimator is corrected, and `n` is now always computed and
reported.** The gap between what a runner emits and what a document claims is **still open**, and a
future interval can still be published without its `n` by the same route. Closing it means making
published tables derive from — or be checked against — run output, which is a larger change at a
layer nothing here touches.
