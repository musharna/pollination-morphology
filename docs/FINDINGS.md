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

Selection rule: **pre-registered primary endpoints only.** Each was registered in a
committed pre-registration document _before_ the experiment ran. Nothing here is a
post-hoc favourite.

### 1. A reproductive floor given to only some plants is worse than no floor at all

**−0.211, 95% CI [−0.303, −0.119]** · study **#64** ·
[2026-09-06-selfing-cover.md](2026-09-06-selfing-cover.md) ·
registered in [2026-09-05-selfing-cover-prereg.md](2026-09-05-selfing-cover-prereg.md) ·
commit `64e76ca`

```
node experiments/selfing-cover.js docs/data/2026-09-06-selfing-cover.json.gz
```

Selfing gives a plant with no mating partners a way to leave offspring — a floor under
rare lineages. Hold the **total** selfing budget exactly constant and withhold it from a
growing random fraction of plants, and coexistence does not merely lose the floor's
benefit: at q = 0.85 it falls **below the arm that never had a floor at all** (0.055
against the no-floor anchor's 0.266). The registered primary, q = 0.69 against the flat
floor, was **−0.221 [−0.339, −0.101]**.

The harm (0.349) exceeds the floor's entire benefit (0.138), which is what rules out the
simple explanation that unlucky plants merely lose what they were given. **Unevenness is a
distinct harmful mechanism, not the absence of a helpful one** — a cost the conserved
total cannot see.

### 2. Flowering time reaches placement — the one positive that survives its controls

**+0.289, 95% CI [0.158, 0.447]** · study **#37** ·
[2026-08-25-phenology.md](2026-08-25-phenology.md) ·
registered in [2026-08-16-phenology-prereg.md](2026-08-16-phenology-prereg.md) ·
commit `94d61c0`

```
node experiments/phenology.js
```

Plants that flower at different times mate assortatively, and that assortment reaches
placement under **free recombination** — so it is not an artefact of linkage. The
supergene arm is inert and the pool-size confound is excluded by a control whose residual
points the wrong way to rescue it.

⚠️ **Scope condition.** It holds where the flowering windows are effectively disjoint. At
`S=32`, where a width of 0.12 spans about four slices, the same cell gives 0.083 against
0.417 at `S=8`. And study #52 showed the result rests on a per-slice rarity premium — see
[2026-09-01-rarity-premium.md](2026-09-01-rarity-premium.md). Nothing is retracted; every
number reproduces.

### 3. A narrow flowering season cannot be derived — it is selected against

**+0.291 / +0.084 / +0.233** at `S` = 8 / 16 / 32 (wider drift, treatment − shuffled) ·
study **#50** · [2026-08-31-evolving-width-conserved.md](2026-08-31-evolving-width-conserved.md) ·
registered in [2026-08-28-conserved-display-prereg.md](2026-08-28-conserved-display-prereg.md) ·
commit `5602460`

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

No build step and no dependencies — Node 18 or newer.

```
git clone https://github.com/musharna/pollination-morphology
cd pollination-morphology
node --test tests/          # 363 tests
```

Every result document names the experiment that produced it. The runners live in
`experiments/`; those that ship their data read it back from `docs/data/*.json.gz`, so a
headline can be re-derived without re-running the sweep — which is how finding 1 above was
checked for this release.

The three playables are plain HTML — open `visit.html`, `population.html` or
`greybox.html` in a browser, or visit the [live site](https://musharna.github.io/pollination-morphology/).
