# Groundwork beyond the biology — six axes

**Status:** axes 1–2 COMPLETE. Axes 3, 6, 4, 5 outstanding.
**Date:** 2026-07-31
**Why:** the mechanism enumeration (`2026-07-31-pollination-mechanism-enumeration.md`, 141 sources)
covered the SUBJECT exhaustively and the ARTIFACT not at all. These axes cover everything else
that determines final quality. Order chosen: 1 → 2 → 3 → 6 → 4+5, because only axis 1 can
invalidate the premise and axis 2 constrains what validation is possible.

---

## AXIS 1 — Artifact prior art ✅ COMPLETE

### Verdict: the premise SURVIVES, and is now precisely located.

**A pollination-modelling tradition exists, but it models a different thing.** Everything found is
a **landscape / abundance / ecosystem-service** model — how many pollinators, and where they fly.
**None model floral morphology or pollen placement.**

- Gardner et al. 2020 `10.1111/2041-210x.13483` — calibrating process-based pollinator ABUNDANCE
  models against multi-habitat observation.
- Glad et al. 2025 `10.1016/j.ecolmodel.2025.111208` — **SimOïko_CPF**, an IBM for wild-bee
  central-place foraging movement, benchmarked against InVEST's distance-decay crop-pollination model.
- Gold et al. 2025 `10.1016/j.ecolmodel.2025.111399` — framework comparing mechanistic vs
  process-based pollinator population models; notes detailed individual-level models become
  "computationally intractable at larger spatial extents."
- Knight et al. 2024 `10.1111/2041-210x.14424`, 2026 `10.1016/j.ecolmodel.2026.111489` — genetic
  algorithms and land-cover integration for landscape decisions.

### ⭐⭐ The gap is stated in the field's own words, twice, from both directions

**From the modelling side** — Mailly, Riotte-Lambert & **Lihoreau** 2025
`10.3389/fevo.2025.1504480`, _"Integrating pollinators' movements into pollination models"_:

> "**most current models of pollination ecology assume RANDOM POLLEN MOVEMENTS**, [while] studies
> in animal behaviour show how pollinating insects, birds and bats rely on **sensory cues,
> learning and memory** to visit flowers, thereby producing complex movement patterns."

(Lihoreau is the radar-tracked-trapline author from the enumeration doc.) Mailly's 2025 thesis
_"Modelling bee foraging movements and their consequences on pollination"_ builds an
individual-based **cognitive** model of foraging → pollen dispersal. **This is the closest
adjacent work in existence** and it still has no floral morphology in it.

**From the measurement side** — Ballantyne, Baldock & Willmer 2015 `10.1098/rspb.2015.1130`
(188 cites):

> "**most networks to date are based on recording VISITS to flowers, rather than recording clearly
> defined effective POLLINATION events**."

They introduce **pollinator effectiveness (PE)** = pollen deposition on stigmas per visit, and
**pollinator importance (PI)** = PE × visit frequency.

**Net position of this project:** ABMs model **visitation**; morphology research measures
**effectiveness**; **nobody joins them mechanistically in 3D.** That join — morphology ↔
morphology determining where pollen lands — is the contribution.

### 3D mechanical-fit simulation: strong null

A targeted search for 3D biomechanical flower–pollinator contact simulation returned **15 results,
zero relevant** (lower-limb prosthetics, bird-bill biomechanics, a robot lobster). Nobody has built
this. Tangentially useful: Krishnan 2023 `10.1242/jeb.245171` on **bird-bill form–function
biomechanics** — the pollinator side for hummingbirds.

### Games / procedural artifacts — adjacent, none overlapping

- **noio's _Seed_** — procedural plant breeding. ⚠️ **The user has already modernised this as
  `heirloom`** (per MEMORY.md: LIVE, PUBLIC, 320 tests). Closest owned prior art.
- **The Sapling** — design plants and animals, ecosystem evolution.
- **Paper/Folded Flowers**, **Breeder 3.0**, **gardenscience.ac** — flower-breeding sims.
- **FloraGen** — Blender procedural flora generator.
- Established procedural methods: **L-systems**, space colonization, SpeedTree.
- arXiv 2505.22337 — _Learning to Infer Parameterized Representations of Plants from 3D Scans_
  (also relevant to agrigen).

**All are breeding/genetics games or asset generators. None model pollinator morphological fit.**

---

## AXIS 2 — Data accessibility ✅ COMPLETE

### Verdict: MUCH better than expected. This is not a data-blocked project.

### ⭐⭐ The single most important find

**Dellinger, Hanusch, Oswald, Fernández-Fernández & Schönenberger 2023** — _"Using geometric
morphometrics to determine the '**fittest**' floral shape: a case study in large-flowered
**buzz-pollinated Melastomataceae**"_

- Data: Dryad `10.5061/dryad.2fqz612t5` — **CC-ZERO**
- Code: Zenodo `10.5281/zenodo.7580514` — **MIT**
- Keywords: 3D-flower shape · bee pollination · buzz pollination · **fitness** · geometric
  morphometrics · **pollen release** · **stigmatic pollen loads** · landmarks

This is 3D floral shape linked to **measured pollination fitness**, open-licensed, with code — i.e.
almost exactly our core measurement. ⚠️ **And it is the same group (Dellinger) whose Merianieae
work I flagged as the ideal six-syndrome test bed.** They are the closest scientific neighbours;
treat as both calibration source and prior-art risk.

### Other open floral-morphology datasets (all CC-ZERO unless noted)

| Dataset                                | Why it matters                                                                                      | DOI                       |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------- |
| _Mucuna macrocarpa_, mammal-pollinated | **Floral traits vs EXTERNAL MORPHOLOGY of mammalian pollinators** — a morphology↔morphology dataset | `10.5061/dryad.nv5cr00`   |
| _Linaria_ radiation                    | "Bees explain floral variation"; **nectar spurs, long-tongued bees, pollination niches**            | `10.5061/dryad.p25m0`     |
| Iochrominae (Solanaceae)               | Convergent floral shape evolution tied to **pollinator shifts**                                     | `10.5061/dryad.5jn7b`     |
| _Rhododendron_ sect. Schistanthe       | **Symmetry spectrum** in a hybridising radiation, 114 taxa (4,186 downloads)                        | `10.5061/dryad.47d7wm3f4` |
| Antillean Gesneriaceae                 | Intraspecific floral variation, generalist vs specialist                                            | `10.5061/dryad.hqbzkh1nh` |
| Blueberry, 750 flowers                 | Floral traits + **stigma pollen deposition** after free visitation (CC-BY)                          | `10.5281/zenodo.10786710` |
| _Impatiens capensis_                   | Flower size/shape vs urbanisation gradient                                                          | `10.5061/dryad.63xsj3v77` |

### 3D acquisition — two routes, both with public data

- **μCT + geometric morphometrics** is established for pollination biology specifically: a
  _Theobroma cacao_ study did "3D pollination biology using micro-CT and geometric morphometrics"
  with **CT datasets archived on MorphoSource**. Also: precision phenotyping of **nectar-related
  traits** by X-ray μCT.
- ⭐ **Photogrammetry** — Leménager et al. 2023, _New Phytologist_ `10.1111/nph.18553`, _"Studying
  flowers in 3D using photogrammetry"_: 3D models, RAW image series, **colour charts and CALIBRATED
  TEXTURES** on MorphoSource. Cheaper than μCT **and it preserves calibrated colour**, which μCT
  cannot — and colour must be modelled in receiver photoreceptor space (enumeration §7.1). For this
  project photogrammetry is likely the better route.
- **MorphoSource**: ~27,000 published 3D models, **~13,000 open-access and freely downloadable**,
  batch download, formats tiff / dicom / ply / stl.

### ⭐ Pollinator trait data — the animal side is well covered

- **`pollimetry`** (R, on CRAN) — body dry weight, **intertegular distance (ITD)** and body length
  for **4,438 bee and hoverfly specimens**; the package _predicts_ body size, **tongue length** and
  foraging distance allometrically. Kendall et al. 2019 `10.1002/ece3.4835`.
- **Bee Functional Trait Database** (big-bee-network) — sociality, nesting, diet breadth, body
  size, thermal tolerance, desiccation resistance, phenology, **tongue length**, **pilosity**
  (i.e. hairiness — the §7.2 adhesion variable).
- **BeeFunc** (_Scientific Data_ 2025 `10.1038/s41597-025-05626-0`) — French bees; body length
  89.6% and phenology 80.4% of species.
- Cariveau et al. — allometry of **bee proboscis length**: ITD ↔ proboscis across 786 individuals,
  100 species, 5 families. **So tongue length is derivable from a single easily-measured variable.**

### Tooling note

`pavo 2` (visual models, §7.1) is **R**. With `pollimetry` also being R, an R analysis layer is
looking natural for calibration even if the sim itself is not R.

### Remaining data unknowns

- Liu et al. 2025 Cymbidieae 140-species shape matrix — deposit not yet confirmed.
- Lankester pollinaria collection / EPIDENDRA — browsable vs bulk-downloadable not yet confirmed.
- Simon et al. 2021 acoustic echo dataset — availability not yet confirmed.

---

## AXIS 3 — Validation design ✅ COMPLETE (design, not search)

Decided BEFORE architecture, so the architecture can serve it rather than have it bolted on.

### 3.1 ⚠️ The headline target, and why the obvious version is TAUTOLOGICAL

Obvious target: _"do pollination syndromes emerge?"_ — attractive because Ollerton et al. 2009 and
Rosas-Guerrero et al. 2014 genuinely disagree about whether syndromes predict pollinators.

**But as stated it is close to circular.** If we encode receiver-specific colour spaces, mechanical
fit, reward types and pollinator body plans, then trait suites clustering by pollinator class is
approximately what we built, not a discovery. This is exactly the failure mode already on record:
_a constant calibrated FROM the artifact under test encodes its defect._

**The non-tautological form has three parts:**

1. Syndromes are never encoded — no trait→syndrome lookup exists anywhere in the model.
2. The test is not "do clusters appear" but **"do the SAME clusters appear as in nature, at
   comparable frequency and composition"** — compared against Rosas-Guerrero's 417-species matrix.
3. It only counts **against the negative control in §3.3.** Clusters that also appear with the
   placement geometry disabled prove nothing.

### 3.2 The validation ladder

**Tier 1 — reproduce measured quantities (calibration).**

- Pollen transfer efficiency by dispersal-unit type: **<45% for solid pollinia, >80% for granular
  monads/sectile** (Johnson & Harder 2023). A sharp, published, two-fold contrast — an excellent
  first gate because it is hard to hit by accident.
- **Pollination accuracy** (Armbruster) — simulated placement precision vs measured.
- **Dellinger et al. 2023** (CC-ZERO, axis 2): can the model reproduce _which_ 3D floral shapes are
  fittest in buzz-pollinated Melastomataceae? This is the strongest available end-to-end check
  because it links 3D shape directly to measured stigmatic pollen loads.

**Tier 2 — reproduce emergent patterns not fitted to.**

- **Mechanical isolation**: two species sharing one pollinator should diverge in placement site
  (Cortis et al. 2008, _Ophrys_) _without being told to_.
- **Character displacement under interspecific pollen transfer** (Moreira-Hernández & Muchhala 2019).
- **Last-male advantage** from finite, contested placement space (Santana et al. 2025).
- **Repeatability**: Wessinger et al. 2014 — the hummingbird syndrome evolved **>100 times** in one
  region. Run N replicates; convergence should recur at a comparable rate. Repeatability is a
  _quantitative_ target, not a vibe.

**Tier 3 — the honest negatives.** Report what the model does NOT reproduce. Given the enumeration,
likely candidates: lethal pollination (_Arisaema_), nursery-pollination sanctions, hydrophily.

### 3.3 ⭐ Controls — the part that makes any of it mean something

- **Negative control = mechanism OFF.** A build in which pollen is placed at a **random body site**
  rather than by geometry. If syndromes, isolation and character displacement still emerge, the
  contact model is not doing the work and the thesis is dead. This is the portfolio's ON/OFF
  mechanism-separation calibration, applied to the one mechanism that matters.
- **Positive control in the SAME harness.** Reproduce a system whose answer is known (Dellinger's
  Melastomataceae, or _Ophrys_ placement divergence). A harness that cannot recover a known result
  makes every null elsewhere meaningless.
- ⚠️ **Verify the control is not INERT.** Recorded failure mode: _an inert control returns the
  original answer, reading as the hypothesis surviving._ So the random-placement build must be
  asserted to **measurably change** downstream statistics — the same discipline as auditable-cell's
  "the toggle must provably change the render," with a pre-computed non-zero delta.
- **Seen-it-fail.** Run the syndrome-emergence test against a deliberately broken model first and
  confirm it fails **for the stated reason**.

### 3.4 Epistemic tiers on everything rendered (reuse auditable-cell)

Every on-screen element resolves to **measured / inferred / assumed**, per species and per trait:

- **Measured** — bee intertegular distance (`pollimetry`, n=4,438); corolla dimensions from a named
  Dryad dataset; transfer efficiency by packaging class.
- **Inferred** — tongue length from the ITD allometry (carry the prediction interval, do not
  present as measured).
- **Assumed** — contact-geometry parameters chosen for legibility, adhesion constants, anything
  tuned by eye.

⚠️ Tier is a property of an **attribute**, not of an element — the disambiguation that a sibling
project's (not published) spec says an implementer will otherwise get wrong. The machinery already
exists there.

### 3.5 Abandon conditions — agreed in advance

1. Syndromes/isolation emerge **as well without** the placement geometry as with it (§3.3).
2. The reachable state space collapses to near-degeneracy (axis 4) — the cell-sand failure.
3. Dellinger's fittest-shape result cannot be reproduced from their open data.
4. Transfer efficiency cannot be made to land near the pollinia-vs-monads contrast without
   per-case fudging.

### 3.6 Scope of claims — what this project explicitly does NOT claim

Not pollinator abundance, not ecosystem-service prediction, not crop yield, not conservation
forecasting. That is the established ABM tradition's territory (axis 1) and they are better at it.
**The claim is narrow: given a flower and an animal, where does pollen go, and what follows.**

## AXIS 6 — Product definition ⚠️ OPTIONS + RECOMMENDATION (needs the user's decision)

### 6.1 The four candidate shapes

| Shape                                     | Audience                | Success looks like                                                           | Risk                                                                   |
| ----------------------------------------- | ----------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **A. Research tool**                      | Pollination biologists  | A cited package/paper; Dellinger's group uses it                             | Becomes work, not play; competes directly with §2's closest neighbours |
| **B. Sim you watch**                      | Science-curious general | Beautiful, runs, ambient                                                     | Passive; the mechanism stays invisible                                 |
| **C. Game**                               | Players                 | Goals, progression, mastery                                                  | Goals distort the biology; the honest model gets bent to be winnable   |
| **D. Explorable interactive artifact** ⭐ | Anyone, one link        | You open it, manipulate a flower, and _see_ what it does to pollen placement | Needs a genuinely strong central reveal or it's a toy                  |

### 6.2 Recommendation: **D**, with a path to B

Reasons, in order of weight:

1. **It's the shape that has actually shipped here.** `auditable-cell` is exactly this — a
   self-contained explorable artifact with provenance — and it got built and finished. The
   300–2,300-commit sims in this portfolio stalled; the scoped artifacts did not.
2. **The thesis is inherently interactive.** "Morphology ↔ morphology determines where pollen
   lands" is a claim you demonstrate by _changing a shape and watching the consequence_. That is
   not a video and not a paper figure.
3. **It preserves scientific accuracy without the research-tool burden.** No need to be
   general, fast, or peer-reviewed — only honest, which the epistemic-tier machinery already handles.
4. It does not foreclose B or C. An artifact that works can be extended into an ambient sim, or
   given goals later. The reverse is much harder.

### 6.3 ⭐ The one moment — the thing that has to work

**Two flowers, one bee, and you watch pollen land on two different parts of its body.**

Then you drag one flower's anther position — and the two species start exchanging pollen again.

That is **mechanical isolation made visible**: the Cortis _Ophrys_ result, the entire project
thesis, and a genuinely surprising fact about the world, in one frame. It also silently carries
the harder ideas — that placement space is finite and contested, and that two species can share a
pollinator completely and still not interbreed.

If this moment isn't compelling in a grey-box prototype, the project is not compelling. **Build
this first, before anything else.**

### 6.4 v0 / v1 split

**v0 — the reveal.** One pollinator, two flowers, 3D. Analytic placement map only (no evolution,
no population). Contact site shown on the animal's body. Provenance panel with measured / inferred
/ assumed per trait. Success = the §6.3 moment lands with someone who has never heard of any of this.

**v1 — the argument.** Evolution loop over a community; syndrome-emergence test (§3.1) with the
random-placement negative control as a user-visible toggle; calibration against the Johnson &
Harder transfer-efficiency contrast and the Dellinger fittest-shape dataset.

**Explicitly deferred:** the physical-trajectory renderer (the (c)-architecture showpiece), the
acoustic and electric channels, the deception classes, lethal traps, hydrophily.

### 6.5 Open question for the user

Is the intended audience **someone else** (shareable link, needs to land in 30 seconds) or
**you** (a thing to think with, can demand patience)? This changes v0's interaction budget more
than any other decision.

## AXIS 4 — State-space depth check ✅ COMPLETE (design, not search)

### 4.1 The failure this axis exists to prevent

From `cell_sand_build_2026-07-29.md`, the user's verdict on that project's v0, twice: _"pretty
low depth" / "still thinking relatively small."_ The diagnosis that satisfied them:

> v0's state space is a line segment — `ATP+ADP` conserved, glucose/ion/waste are flows against
> a perfused set point, enzyme count conserved and `BLOCKED` irreversible, so the entire state is
> ONE monotonically non-increasing number and there is exactly one story it can tell. **No feature
> list fixes that.**

Two derived tests from the same record, both of which this project must pass:

- **The delete-the-grid test.** _"space in v0 is decorative: delete the grid, track
  concentrations, most readouts barely move. That test is the one a spatial sim must pass."_
- **The wrong-half-of-Noita test.** _"per-grain simulation is the substrate, the combinatorial
  interaction table is the product, and I shipped 10 species / 5 rules."_

### 4.2 Is this state space a line?

Six axes with genuine tradeoffs — meaning each has a cost that the others do not pay, so none is
a rescaling of another:

| Axis                       | The tradeoff that makes it real                                                                                   | Grounded in                       |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **Placement position**     | Finite contested surface; a good site is good _because_ it is empty                                               | Armbruster; Cortis 2008           |
| **Placement precision**    | Precise = high transfer per visit, fails on pollinator variation. Imprecise = robust, leaky. Accuracy ≠ precision | Armbruster's accuracy framework   |
| **Male/female allocation** | Pollen export and seed set decouple; a flower can be a great donor and a bad receiver                             | herkogamy/dichogamy               |
| **Reward currency**        | Pollen is larval protein and is _lost gametes_; nectar is adult fuel and is cheap; fragrance is neither           | §8 batch 6; euglossine literature |
| **Packaging**              | Pollinia <45% removal vs monads >80%, traded against dosing and carryover shape                                   | Johnson & Harder 2023, 228 spp.   |
| **Specialization breadth** | One pollinator = high transfer, high risk. Many = low transfer, buffered                                          | Ollerton/Rosas-Guerrero dispute   |

**Nothing here is conserved or monotone.** The line failure required a quantity that only ever
decreased; there is no such quantity in this system. Placement space being finite is a
_constraint_, not a conserved total, and it is the source of frequency dependence rather than of
monotone decay.

The axes are **not independent, and that is the point.** CYCLOIDEA-like genes couple symmetry,
orientation and guide patterning (Yang 2023); pollinia co-occur with specialization; deception
requires specialization. The space is a **constrained manifold, not a hypercube** — which is what
gives an evolutionary landscape structure instead of uniformity.

### 4.3 The real risk is not a line — it is a fixed point

This project's analogous failure mode is **static equilibrium**: the loop runs, everything matches
its partner optimally, trait variance goes to zero, and there is one story again. Four named
mechanisms resist it:

1. **Male–male competition for finite placement space is frequency-dependent** — the best site
   depends on who already occupies the others (Santana 2025, last-male advantage).
2. **Deception is negative frequency-dependent by construction** — a food-deceptive orchid does
   worse as it becomes common, because pollinators learn. It _cannot_ fixate.
3. **Pollinator learning is a fast timescale feeding back on a slow one.**
4. **Antagonists bypass the geometry entirely** — a nectar robber ignores the placement you
   optimised for.

⚠️ **Honest counter-risk:** with one pollinator and two species, it almost certainly _does_
fixate. Depth lives in v1's community, not in v0. **Therefore v1 ships a measured convergence
check — population trait variance over generations — and if it collapses to zero, that is
cell-sand v0 again and must be treated as a finding, not a tuning problem.**

### 4.4 ⭐ The decisive test: the ablation ladder

The delete-the-grid test, made concrete as three builds of the same loop:

| Level  | Placement model                                                             | Cost        |
| ------ | --------------------------------------------------------------------------- | ----------- |
| **L0** | No placement. Visit success = f(trait match). _The standard ABM assumption_ | trivial     |
| **L1** | Placement is a 1-D coordinate along the body, evolving directly as a trait  | small       |
| **L2** | Placement is a 2-D site on a body surface, **derived from 3-D morphology**  | the project |

A-priori predictions, written down _before_ building so they can fail:

- **L0 cannot produce mechanical isolation at all.** Two species with equal match scores must
  exchange pollen. This is exactly the gap the field names in its own words (Mailly & Lihoreau
  2025: models "assume random pollen movements").
- **L1 _can_ produce mechanical isolation and character displacement.** ⚠️ **This is the dangerous
  level** — it buys most of the headline phenomenon for ~1% of the work. If the project cannot
  beat L1, the 3-D is decorative and this is the delete-the-grid failure.
- **L2 must produce something L1 cannot.** Three candidates, of which the third is sharp enough to
  be a real prediction:
  1. **Approach-angle dependence** — the same anther position contacts different body regions
     depending on landing-platform geometry, so morphology maps many-to-one _and_ one-to-many onto
     placement. In L1 that map is the identity.
  2. **Surface heterogeneity** — pilosity and grooming reach vary by body region, so two sites at
     the same 1-D coordinate have different retention (the safe-sites result).
  3. ⭐ **Packing limit.** A 1-D placement axis saturates at a small number of coexisting species
     at any fixed precision; a 2-D surface, at matched precision, packs more — because "move away
     from your competitor" has two escape directions in 1-D and a whole neighbourhood in 2-D.
     **Prediction: L1 has a hard species-packing ceiling that L2 exceeds, and real Stanhopeinae
     richness on shared euglossine pollinators sits above the L1 ceiling.** That is a falsifiable
     statement about the world, not about the renderer.

### 4.5 The design constraint that falls out of this

**Placement must never be a gene.** Genes are shape parameters; placement is _computed_ from shape
and body. The moment placement is directly heritable, L2 collapses into L1 and the geometry becomes
ornament. This is cell-sand's own thesis — _"every number is either a law of physics or a gene;
nothing in between"_ — transplanted, and it is load-bearing here rather than stylistic.

### 4.6 The Noita test: what is the combinatorial table?

**Rows** = mechanism classes from the enumeration doc (reward type × advertisement channel ×
contact mechanism × packaging × mating system × antagonist). **Columns** = pollinator body plans and
their regions. The _table_ is the product; the trajectory renderer is the substrate.

v0 implements **one cell** of it. That is correct for v0 and would be a failure as an endpoint —
so v1's value scales with **how many mechanism classes are implemented**, not with render quality.
The enumeration doc exists precisely to make that table enumerable rather than improvised.

### 4.7 Verdict

**Passes the line test** (six non-collapsing axes, nothing monotone). **At risk on the fixed-point
test** (mitigated by four named anti-fixation mechanisms, and measured rather than assumed).
**Undecided on the delete-the-grid test until L1 is actually built and beaten** — and building L1
is cheap, so there is no excuse for asserting the answer instead of measuring it.

## AXIS 5 — Technical architecture ✅ COMPLETE (design, not search)

### 5.1 Two tiers, because the one that shipped here had two

Verified live in a sibling project (not published) on 2026-07-31: a Python build tier
(`build_auditable.py`, 23 KB; `provenance.py`, 5.6 KB; tests) emitting **one self-contained
`auditable.html`** (4.8 MB). Same split here:

- **Python tier** — geometry sampling, fitting the analytic placement map, the evolution loop,
  validation against Rosas-Guerrero / Johnson & Harder / Dellinger, provenance-tier bookkeeping.
- **Browser tier** — one self-contained HTML: 3-D flower and pollinator, drag-a-trait interaction,
  contact visualisation, provenance panel.

The Python tier is where the science is checkable; the browser tier is the artifact from §6.2.

### 5.2 Morphology representation

**A generalised cylinder on a curved axis with per-angle radius modulation** — roughly 10–12
parameters: axis curvature and length, mouth and throat radius, taper, zygomorphy amplitude and
phase, lip/landing-platform extension and angle, anther position (2 surface coordinates), stigma
position.

- **Not a mesh** — no gene-level control; you cannot mutate a vertex buffer meaningfully.
- **Not an L-system, yet** — overkill for a single flower, and exactly right for the _inflorescence_
  later (Harder & Prusinkiewicz 2012, the floral canopy). Deferred to v2, where it is also the
  bridge to AgriGen.
- **CYCLOIDEA coupling is structural, not cosmetic:** zygomorphy amplitude, lip extension and
  nectar-guide pattern are driven by a shared latent dorsoventral-polarity variable rather than
  being three free parameters. The developmental constraint is thereby _in the representation_,
  which is the only place it can honestly live.

### 5.3 Contact computation — the (c) hybrid, made concrete

**Pollinator** = a labelled capsule chain: face, scutum, scutellum, abdomen dorsum, abdomen venter,
legs. Regions matter because retention and grooming reach differ per region.

**Physical path (the showpiece).** Entry trajectory determined by landing site on the platform,
approach direction from advertisement geometry, and reach bounded by tongue and body length. Sweep
the capsule chain along it; contact = intersection with the anther surface patch; record region,
within-region position, and contact area. Jittered resampling yields a placement _distribution_.

**Analytic path (the loop).** A fitted map from (flower params, pollinator params) → distribution
parameters. Must be **inspectable** — low-order polynomial or interpolated lookup, not a black-box
net — because the provenance panel has to be able to say _why_ pollen went where it went.

⚠️ **The fit must be validated on held-out flower parameters, never on the ones it was fitted to.**
A map calibrated from the artifact it is meant to predict encodes that artifact's defects — the
recorded circular-calibration failure mode, where the "fix" turned out to be a no-op.

### 5.4 Determinism and provenance

Single explicit seeded PRNG stream; no wall-clock, no unseeded randomness anywhere. Every constant
carries a **measured / inferred / assumed** tier, and the **measured-only toggle must provably
change the output** — the same assertion `auditable-cell` already ships, for the same reason: a
toggle that changes nothing is indistinguishable from a toggle that is not wired up.

### 5.5 Performance budget — the arithmetic that forces the hybrid

Evolution loop at 30 species × 1,000 generations × 200 visits = **6 × 10⁶ placement evaluations**.

- At ~1 ms per swept-capsule evaluation → **~100 minutes per run.** Unusable for interactive work.
- At ~1 µs per analytic evaluation → **~6 seconds.**

So the analytic map is not an optimisation, it is **load-bearing** — and the fit-agreement
requirement in §5.3 is what keeps it honest rather than merely fast. v0 needs no loop at all: one
bee, two flowers, real-time swept contact is comfortably within frame budget.

### 5.6 Distribution constraints

Self-contained single file, everything inlined — no CDN, no external fonts, no fetch. Inlining a
3-D library costs a few hundred KB against a 4.8 MB precedent, so it is not a real constraint.
Light/dark both styled. Wide content scrolls in its own container.

### 5.7 Open technical questions — measure, do not assume

1. **Does the analytic map generalise to held-out flower shapes, or only interpolate?** Report R²
   on held-out parameter sets, and state the extrapolation boundary.
2. **Is a capsule-chain pollinator accurate enough to reproduce documented placements?** Positive
   control: reproduce a published nototribic-vs-sternotribic contrast before trusting any novel
   placement the model outputs.
3. **Is pilosity data regionalised?** The Bee Functional Trait Database records pilosity, but
   per-body-region resolution is unconfirmed — and §4.4's surface-heterogeneity claim depends on it.
   ⬜ **NOT VERIFIED.**
