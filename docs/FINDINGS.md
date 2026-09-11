# Findings

## What this is

A simulation of pollination by shape. Flowers and a bee are built from a handful of
morphological genes, and **where pollen lands on the animal's body is computed from that
geometry — it is never a gene and never set by hand.** Two plants whose pollen lands on
different parts of the same bee are reproductively isolated without any genetic
incompatibility, so this is a model in which mechanical isolation can arise, or fail to,
for reasons you can inspect.

Almost everything below is a **negative**. That is the point: the project's own claim is
not that it found an effect, but that its instruments are good enough for the absences to
mean something. The measurement debt is tracked as openly as the results, in
[ROADMAP.md](ROADMAP.md) and [RELEASE-1.0.md](RELEASE-1.0.md).

## The one mechanism

`sim/placement.js` computes a contact point from flower and bee shape. Everything else —
coexistence, isolation, speciation, the seasonal results — is downstream of that one
function. If placement were ever made a gene, the geometry would be ornament and the
central ablation void; a standing constraint in the roadmap forbids it and tests enforce
it.

## Headline findings

Selection rule: **pre-registered endpoints only** — each registered in a committed
pre-registration document _before_ its experiment ran. Where a number below is a
registered **secondary** rather than the primary, it is labelled as such and the primary is
given beside it. Nothing here is a post-hoc favourite.

### 1. Spreading a reproductive floor thinner across the population reduces coexistence

**Registered primary: −0.221, 95% CI [−0.339, −0.101]** (q = 0.69 against the flat floor) ·
study **#64** · [2026-09-06-selfing-cover.md](2026-09-06-selfing-cover.md) ·
registered in [2026-09-05-selfing-cover-prereg.md](2026-09-05-selfing-cover-prereg.md) ·
commit `64e76ca`

⚠️ **The primary endpoint was chosen after seeing #63's data**, and the pre-registration says
so itself: #63 registered `motheredTotal` as its primary, that returned an interval including
zero while the secondary `HELD` excluded zero, and #64 then registered `HELD` as the primary.
The prereg records this as "a garden-of-forking-paths hazard which pre-registering it here does
not erase" ([2026-09-05-selfing-cover-prereg.md](2026-09-05-selfing-cover-prereg.md) §"Disclosure",
lines 211–217). It is repeated here rather than left in the source document.

```
node experiments/selfing-cover.js docs/data/2026-09-06-selfing-cover.json.gz
```

Selfing gives a plant with no mating partners a way to leave offspring — a floor under
rare lineages. Spread that floor thinner across the population, holding the **total**
selfing budget exactly constant, and coexistence falls: the registered primary above
compares q = 0.69 against the flat floor and clears zero.

**Registered secondary 2 ("the anchor crossing"): −0.211 [−0.303, −0.119].** This is the
one that makes the result interesting rather than merely negative, and it is a _secondary_
endpoint, not the primary — at q = 0.85 coexistence falls **below the arm that never had a
floor at all**, 0.055 against the no-floor anchor's 0.266.

The harm (0.349) exceeds the floor's entire benefit (0.138), which is what rules out the
simple explanation that unlucky plants merely lose what they were given. **Unevenness is a
distinct harmful mechanism, not the absence of a helpful one** — a cost the conserved
total cannot see.

### 2. Flowering time reaches placement — the one positive that survives its controls

**Registered `H-free` (narrow+free vs wide+free): +0.289, 95% CI [0.158, 0.447]** · study **#37** ·
[2026-08-25-phenology.md](2026-08-25-phenology.md) ·
registered in [2026-08-16-phenology-prereg.md](2026-08-16-phenology-prereg.md) ·
commit `94d61c0`

⚠️ **`H-free` was registered as the expected NULL, and the registered null was REFUTED.** The
pre-registration predicted that with free recombination a narrow season "sorts flowering times
without sorting shapes" and that HELD would be **unchanged**
([2026-08-16-phenology-prereg.md:38-39](2026-08-16-phenology-prereg.md)); HELD rose instead. The
prereg registers only `H-free` and `H-link` — **`H-pool` is a post-hoc control**, introduced in the
result document, not registered.

```
node experiments/phenology.js
```

Plants that flower at different times mate assortatively, and that assortment reaches
placement under **free recombination** — so it is not an artefact of linkage. The supergene
arm is inert, and under the registered visit rule the **post-hoc** pool-size control `H-pool`
(narrow+free vs narrow+SHUFFLED) reads `+0.289 [0.158, 0.447]` — numerically identical to `H-free`
here ([2026-08-25-phenology.md:55,59](2026-08-25-phenology.md)) — pointing the wrong way to rescue a
small-mating-pool explanation. It was not registered, so it carries the weight of a control the
author chose after seeing the data, not of a registered endpoint.

⚠️⚠️ **This is the most heavily qualified result here, and the qualifications belong beside
it rather than in a footnote.**

- **It is conditional on the visit-allocation rule, and that condition is load-bearing.**
  Every slice receives the same number of visits however much display is in it, so rare
  flowering times pay a penalty generated by the allocation rule rather than by
  pollination. Apportion the **same total** in proportion to display and **`HELD` falls
  0.289 → 0.026**, `H-link` goes to 0/38 vs 0/38, and **`H-pool` — the very contrast that
  licensed "heritable temporal assortment" over "small mating pools" — spans zero at
  `+0.026 [0.000, 0.079]`**. The proportional rule is at least as defensible as the
  registered one. Source: [2026-09-01-rarity-premium.md](2026-09-01-rarity-premium.md),
  recorded in the scope box of the result document itself.
- **It holds only where the flowering windows are effectively disjoint.** At `S=32`, where
  a width of 0.12 spans about four slices, the same cell gives `0.083` against `0.417` at
  `S=8`. ⚠️ Both of those are **pre-conservation** numbers: the display-conservation fix
  (#49/#50) moved the fixed-narrow cells at `S=16` and `S=32`, so this scope condition has
  not been re-measured on the conserved build.

Nothing above is retracted and every number in the source reproduces — but a reader should
take finding 2 as "an effect exists under a stated visit rule", not as "temporal assortment
reaches placement, settled".

### 3. A narrow flowering season cannot be derived — it is selected against

**+0.291 / +0.084 / +0.233** at `S` = 8 / 16 / 32 (wider drift, treatment − shuffled) ·
study **#50** · [2026-08-31-evolving-width-conserved.md](2026-08-31-evolving-width-conserved.md) ·
commit `5602460`

⚠️ **Two pre-registrations are involved and they register different things.** The
`treatment − shuffled` contrast quoted above is registered in
[2026-08-25-evolving-width-prereg.md](2026-08-25-evolving-width-prereg.md) (P1, direction;
P3, the shuffled null). The run that produced these particular numbers was registered in
[2026-08-28-conserved-display-prereg.md](2026-08-28-conserved-display-prereg.md), which
registers the **conservation** predictions — not this contrast.

```
EW_CONSERVE=1 node experiments/evolving-width.js
```

Finding 2 needed a narrow season, but imposed one. Make flowering width a heritable
per-plant locus and ask whether narrowness evolves on its own, and it does not — width
evolves **wider**. This is the project's northstar and it is open.

The interesting part is the correction history: the original explanation (flowering longer
is free) was **wrong**. A plant's display share was being re-offered whole in every slice
it flowered, so flowering all season _manufactured_ `S` times the floral display of
flowering once. Conserving the display — which costs no parameter — removed four fifths of
the gradient. The direction survived; the explanation did not. It has since been corrected
three times **without the answer ever reversing**.

⚠️⚠️ **And the run's own registered prediction failed.** The conserved-display
pre-registration's **P3 — equal-width invariance** held that turning conservation on
changes no reported number when every plant is at the same width, and it was explicitly
_"the prediction that protects #37"_. The built-in control fired: the fixed-narrow cells
**moved** (`0.819 → 0.860` at `S=16`, `0.887 → 0.837` at `S=32`), and the result document
records it as **"P3 is false as registered"**. The root cause is that the invariance is a
property of **occupancy, not width** — equal width is only a stand-in for equal occupancy,
and they coincide by phase rather than by principle.

Nothing published moves as a consequence, because every fixed-width site in the project
runs at `S=8` where the two happen to agree. But that means **finding 2 is protected by its
parameters rather than by the principle that was registered** — which is a weaker position
than the prereg claimed, and is stated here rather than left in the source document.

### 4. Spatial structure does not rescue divergence, and the half that acts, acts against it

**HELD occurred 0 of 38 times in every cell** · study **#36** ·
[2026-08-25-spatial-ibm.md](2026-08-25-spatial-ibm.md) ·
registered in [2026-08-16-spatial-ibm-prereg.md](2026-08-16-spatial-ibm-prereg.md) ·
commit `239c6cc`

```
node experiments/spatial-ibm.js
```

The roadmap named spatial structure the most favoured remaining route — give a rare morph
neighbours of its own kind. Refuted. Local foraging significantly **reduces** retained
ancestry variance, and limited dispersal does nothing at all, by construction. This also
retired an earlier partial positive (0.247 → 0.950) that had been measured in a harness
with no inheritance, no recombination and no hybrids: the proxy did not predict the
individual-based model, which is why that model exists.

## The foundation (pre-dates pre-registration)

Reported separately because it does not meet the selection rule above, but it is what the
rest stands on:

- **Two-dimensional placement out-packs a precision-matched one-dimensional gene 2.1×** at
  the 309-species pool it samples (40 against 19 at τ = 0.2), rising to ~3.1× once both
  arms get a large enough candidate set. The ratio is **not a constant** — quote the pool
  size with it. [2026-08-02-pool-scaling.md](2026-08-02-pool-scaling.md)
- **Hybrids pay a mating cost from geometry alone**, with no genetic incompatibility:
  19.1%, interval **[0.706, 0.912]**, excluding 1.0.
  [2026-08-02-hybrid-placement.md](2026-08-02-hybrid-placement.md)

## What is open

**The northstar**, verbatim from the roadmap's "Where this stands":

> 🛑 **AND THE NARROW SEASON CANNOT BE DERIVED — it is selected AGAINST.** With width a
> heritable per-plant locus it evolves WIDE […] 🛑 **So the northstar's answer does not
> move — narrow flowering still does not arise on its own — and its cause has now been
> corrected three times without ever reversing.**

Also open, carried from the release disposition table:

- **The empirical ceiling leg is not cleared.** Restricted to one named region the maximum
  is 14 orchid species per euglossine bee against the 1-D arm's 19, so this project says
  "2-D out-packs 1-D _in this model_" and **cannot** say real richness exceeds what 1-D
  placement supports. Settling it needs a single-site census, which is a data requirement
  rather than a paywall. [2026-08-28-euglossine-ceiling.md](2026-08-28-euglossine-ceiling.md)
- **`docs/2026-08-01-v2-result.md` Round 3 does not reproduce** under any of four
  configurations tried; best fit 6 of 8 paired differences. The conclusion it supports
  survives, but its provenance is incomplete.
- **That document's Round-2 table mixes run lengths** — a 250-generation row printed beside
  a 120-generation one.
- **Four experiments still compute intervals with a hand-rolled normal approximation**
  instead of the project's own t estimator in `sim/paired-stats.js`. No published verdict
  depends on it (see below), but the duplication should be removed and the affected
  experiments re-run after 1.0.

## A correction shipped with this release

The release inventory swept the whole tree for normal-approximation (z) intervals at small
n — the defect the v2 document was written to record — and **found the same estimator
still live in four experiments**. One carried a boundary verdict of exactly the retracted
shape: the hybrid-placement clonal control was described as an interval that "only just
excludes 1.0", and it does not. As printed, `0.960 + 0.040 = 1.000` sits exactly on the
null, so the claim never held under its own estimator either; under the correct t it is
`[0.919, 1.001]`.

**No headline moved.** The 19.1% hybrid cost and the invasibility failure both survive, and
every directional verdict in the affected documents survives at every admissible sample
size. The full inventory, the recomputations and their dispositions are in
[RELEASE-1.0.md](RELEASE-1.0.md) §2.

The lesson worth keeping is about blast radius: **writing a failure mode down in the
document where it happened did not stop it from already having happened in three others.**

## How to reproduce

No build step and no runtime dependencies.

```
git clone https://github.com/musharna/pollination-morphology
cd pollination-morphology
node --test tests/          # 363 tests, ~4 min
```

**What each part actually needs:**

| to run                                                    | requirement                                                                                                                                                |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the suite and any `experiments/*.js`                      | Node 18 or newer, for the built-in `node --test` runner. Verified on **v18.19.1** — the only version this release was tested against                       |
| `tools/run-bloom-fixed.sh`, `tools/run-rarity-premium.sh` | **`NODE_BIN` set to an absolute path to a node binary**; both refuse to start without it (`tools/run-bloom-fixed.sh:19`, `tools/run-rarity-premium.sh:21`) |
| `tools/build-site.sh` + `tools/smoke-site.py`             | Python 3 with **Playwright and Chromium**. Optional — it checks the built site only                                                                        |

Every result document names the experiment that produced it. The runners live in
`experiments/`.

**⚠️ Only finding 1 re-derives from an archive. Findings 2–4 re-run the whole sweep.**

| finding | command                                                                        | cost                                                                                                                                                                          |
| ------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**   | `node experiments/selfing-cover.js docs/data/2026-09-06-selfing-cover.json.gz` | reads the shipped archive — **seconds**, no sweep. This is how finding 1 was checked for this release                                                                         |
| **2**   | `node experiments/phenology.js`                                                | **full sweep, no archive.** No runtime is recorded in the result document, so none is quoted here rather than one invented                                                    |
| **3**   | `EW_CONSERVE=1 node experiments/evolving-width.js`                             | **full sweep, no archive.** The published run took **29.8 min** on the desktop (job 3572, [2026-08-31-evolving-width-conserved.md:3](2026-08-31-evolving-width-conserved.md)) |
| **4**   | `node experiments/spatial-ibm.js`                                              | **full sweep, no archive.** No runtime is recorded in the result document                                                                                                     |

For scale, comparable sweeps in this project are recorded at 26–47 min
([2026-09-01-empty-time.md:113](2026-09-01-empty-time.md) 26.2 min;
[2026-09-01-rarity-premium.md:3](2026-09-01-rarity-premium.md) 46.7 min), so budget tens of
minutes for findings 2 and 4 — but that is an analogy, not a measurement of those two runs.

⚠️ **One analysis script is not shipped.** The euglossine ceiling count
([2026-08-28-euglossine-ceiling.md](2026-08-28-euglossine-ceiling.md)) was produced by a parser that
was never committed — it lived in the gitignored `_scratch/` and is not recoverable. The result
document states the source database, the release and the filename it was read from, so the count can
be re-derived, but not by re-running the original script.

The three playables are plain HTML — open `visit.html`, `population.html` or
`greybox.html` in a browser, or visit the [live site](https://musharna.github.io/pollination-morphology/).
