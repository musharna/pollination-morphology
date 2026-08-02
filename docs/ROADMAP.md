# Roadmap

**Canonical.** If another document disagrees about what comes next, this one wins.
Last updated 2026-08-02.

## Where this stands

Four things are built and measured, in this order, each gating the next:

1. **The contact model** (`sim/placement.js`) — placement computed from shape, never set. 12 tests,
   three load-bearing mechanisms mutation-verified.
2. **The reveal** (`visit.html`) — one bee, two flowers, pollen loaded and not delivered. The first
   attempt failed on a user's read (_"feels more like the number on a chart changing"_); rebuilt as
   an event in time with a rigid animal, and it now lands.
3. **The ablation** — 2-D placement supports **3.0×** the species a 1-D gene does, at matched
   precision. This was the delete-the-grid test and it passed, which is the only reason v1 exists.
4. **v1, the evolution loop** — blind selection reaches **~52%** of the achievable ceiling and
   preserves the 2-D advantage at **3.07×**.
5. **The head cap** (item D below) — the coordinate edge is gone, and fixing it exposed a broken
   control. Both headline figures above are post-correction.
   [detail](2026-08-01-head-cap-result.md)
6. **Three mechanism classes** on the item-C table — carryover, reward currency, and the cost of
   prolonged presentation. Castellanos et al. 2006 now reproduces **4 of 4**, though the last cell
   turned out to be half missing biology and half my own carry-cap artefact.
   [detail](2026-08-02-presentation-cost-result.md)

## Next

### A. Close the empirical leg ⬜ _blocked on access, not on work_

The packing prediction has two halves and only the geometric one is closed. Needed: **orchid species
per _shared_ euglossine pollinator**, to compare against the 1-D ceiling. The figure in the
enumeration doc — fifteen sympatric _Euglossa_ — is **bee** richness and must not be reused.
Named source: Ackerman, Phillips, Tremblay, Karremans & Reiter 2023, `10.1093/botlinnean/boac082` —
global orchid reproductive-biology database, >2900 species, pollinator identity tabulated.

⚠️ **Re-probed 2026-08-02 and it IS genuinely closed** — verified against the OpenAlex API
(`is_oa: false`, `oa_status: closed`, no OA URL), not assumed. Worth having checked: the same roadmap
recorded Johnson & Harder 2023 as a gate to work toward and that one turned out to be open access.
Three further searches for orchid-species-per-shared-euglossine found no open source carrying the
number.

Two things the probe did yield. The abstract gives **median 1 pollinator species per orchid** — the
extreme specificity mechanical isolation predicts, though it is the orchid→pollinator direction and
not the richness figure needed here. And an alternative empirical route exists that is open access
and tests the MECHANISM rather than the ceiling: Esposito, Merckx & Tyteca 2017
(`10.15517/lank.v17i3.31576`, diamond OA) identify which moth species carried pollinaria and of which
orchid species, for sympatric _Platanthera bifolia_ and _P. chlorantha_ — the textbook
pollinaria-on-proboscis vs pollinaria-on-eyes pair.

Until this lands the claim is _"2-D out-packs 1-D in this model"_, **not** _"real richness exceeds
what 1-D placement supports."_ Only the second is about the world.

### B. Speciation, which v1 explicitly cannot address — 🟡 premise verified, model not built

v1 is adaptive dynamics over species already distinct. It has no standing variation, no
recombination and no hybridisation, so it cannot speak to how a lineage _splits_. The interesting
question sits exactly there: placement selection in one panmictic population is positively
frequency-dependent and converges, so what breaks that symmetry in the first place? Needs an
individual-based model with real inheritance and hybrid formation. **This is the biggest open
scientific question in the project.**

✅ **The premise is now measured rather than asserted** (2026-08-02). It had lived only in a comment
at the top of `sim/evolve.js`, and it justifies both B's framing and why the evolution loop starts
with many species. Measured in a panmictic population with per-plant mating success: the selection
gradient is stabilising at **−48.9% ± 16.2pp across 7 independent populations** (all seven negative),
and with mutation off the placement spread **collapses 12.6×** while mating success rises 2.5×.
⚠️ The disruptive-detection control **failed on the first run** and caught a real bug — the shape
test was written for a trait axis, but on a |deviation| axis disruptive selection rises rather than
forming an interior U. Without that control, a harness that could only say "stabilising" would have
returned the expected answer. **B is asking the right question**, and this is what licenses building
the individual-based model. [detail](2026-08-02-panmictic-premise.md)

✅ **Recombination and hybrids, measured 2026-08-02.** ⚠️ **My hypothesis was refuted.** Because
placement is computed from shape rather than inherited, I expected hybrids to land off-axis — giving
isolation a placement gene could not. Measured: additive inheritance of shape produces **almost
perfectly blending placement** (detour 1.01, nearest 0.45 — indistinguishable from the L1 control),
and transgressive hybrids are **rare at 2%**. Geometry does not rescue divergence from blending.
**But hybrids still pay 19.1% [0.708, 0.910]** in mating success, purely from placement mismatch —
and the clonal-population control matters, because hybrids are also slightly worse flowers (0.960)
and that accounted for 6 of the 25 raw points. So selection against hybrids is real without any
genetic incompatibility. [detail](2026-08-02-hybrid-placement.md)

✅ **Pollinator heterogeneity tested 2026-08-02 — it is NOT the symmetry-breaker.** Assortment by
placement is already present (the transfer matrix _is_ placement matching) and is conformist, so a
rare placement must first be worth something. Two pollinators with different geometry do not make it
so: frequency dependence stays strongly positive, `rare/common` = **0.325 at distance ~10 under two
animals against 0.258 under one** — a real 26% relief, nowhere near the 1.0 a rare morph needs.
Pushing the body plans further apart does not help (9%, 5%, 0%, 0% rare-advantage morphs).
⚠️ **The first version of this experiment was structurally incapable of answering it** and returned a
uniform 0% null that only the positive control exposed — see the doc, it is the most instructive part.
[detail](2026-08-02-two-pollinators.md)

✅ **Flower constancy tested 2026-08-02 — it makes things WORSE.** The obvious candidate, and the
hypothesis was backwards. `rare/common` falls **0.296 → 0.198** as constancy rises; no morph gains a
rare advantage at any level. ⚠️ My explanation for the refutation was also wrong: it is not partner
exhaustion, because the penalty is **scale-invariant** (−0.211 → −0.183 while the rare morph triples
at fixed frequency). Constancy amplifies the encounter rate — a bee that lands on the majority stays
there — so it **reinforces the majority**, which is the documented minority disadvantage of flower
constancy. Only the BASELINE penalty eases with population size (0.471 → 0.550), and that part is
partner availability. [detail](2026-08-02-constancy.md)

✅ **Spatial structure BUILT 2026-08-02 — the first mechanism in five that helps.** Plants on a ring,
bee foraging from a Gaussian kernel. ⚠️ It is a genuine INTERACTION, which was the test: only
clustered+local pays (0.360) against scattered+global 0.148, clustered+global 0.142 and
scattered+local **0.048** — each factor alone is worse than neither. Tightening the kernel lifts
`rare/common` **0.247 → 0.950**, a fourfold relief tracking the patch width as predicted.
⚠️ **Parity is not an advantage** — 0.950 is ~0.876 once corrected for a real +8.4% bias the
calibration control shows in exactly that cell (it survived seed-averaging). The penalty is
RELIEVED, not reversed. ⚠️ The patch-growing arm (corrected 0.889, 0.800, 1.220) is non-monotone and
single-draw; the crossing it hints at is **not claimed**. [detail](2026-08-02-spatial.md)

⚠️ **Larger patch: MEASURED AND INCONCLUSIVE 2026-08-02.** Corrected 1.020 ± 0.492 (4/24) and
0.863 ± 0.278 (8/48) — intervals spanning penalty to advantage, point estimates falling not rising.
Reported as a failure to measure rather than dressed up; the verdict logic now refuses to conclude
above ±0.2, after an earlier draft printed "✅ PREDICTION HELD" off ±0.417.
⚠️ **The diagnostic was worth more than the result**: holding the bout fixed while the ring grew made
the identical-morph control drift 0.976 → 1.133 → 1.228, and a control that cannot vary by
construction but does is a broken harness. A locally foraging bee DIFFUSES, so mixing time scales as
(ring/step)²; scaling visits accordingly flattens the control to 1.009/1.071.
⬜ **Better next move than brute force:** measure boundary and interior plants SEPARATELY. The
prediction is specifically about boundary dilution and interior plants should already sit at parity,
so that tests the mechanism at 4/24 without needing large rings — brute force costs 9× per row.
[detail](2026-08-02-patch-size.md)

⚠️ **Live possibility after five mechanisms: NOTHING in this model pushes a rare placement past
parity**, and placement divergence needs drift plus the measured 19.1% hybrid cost rather than a rare
advantage. That would be a result, but no experiment has established it.

⬜ _Superseded framing:_ does a LARGER PATCH push `rare/common` past 1.0? The mechanism argues yes — more un-emptied partners, the separate
partner-availability effect already measured in the constancy work (0.471 → 0.550 at fixed
frequency) — and the under-powered arm hints yes. Needs many more draws. After that: clustering that
EMERGES from limited dispersal rather than being imposed, and temporal assortment by flowering time.

⬜ _Superseded framing, kept for the record:_ **spatial structure, favoured.** It is the only remaining candidate that
gives a rare morph *neighbours of its own kind* rather than merely more visits: a new morph's
offspring land near it, so it is locally common while globally rare. That attacks the measured
barrier in the one way neither a second pollinator nor constancy does. Temporal assortment by
flowering time is the other, and is genuinely independent of placement.

⬜ _Superseded framing, kept for the record:_ `rare/common ≈ 0.26` is the **rare-morph
mate-finding problem** — a novel placement is penalised because there is nobody to exchange pollen
with, not because it is badly built. So the mechanisms to try are the ones that let a rare morph
**meet itself**: spatial structure / limited dispersal, **pollinator constancy** (real bee behaviour,
and it converts the rare morph's penalty directly into an advantage), or temporal assortment by
flowering time — an assortment axis genuinely independent of placement. Then hybrid zones across
generations (the F1 test has no backcrossing).

### C. Widen the table, which is where value scales — 🟡 first class shipped

Groundwork §4.6: rows are mechanism classes, columns are pollinator body plans. v1 implements
**one cell**. Value scales with how many classes are implemented, not with render quality.
Nearest, in order of cheapness:

- ✅ **carryover between visits** — BUILT 2026-08-01, `sim/carryover.js`. Packaging efficiency rises
  4.1% → 35.7%; last-male advantage emerges from stacking rather than being imposed. ⚠️ **Numbers
  corrected 2026-08-02 and one conclusion retracted**: re-run after the head-cap fix, carryover
  raises coexistence **only where species still overlap** (4→5), and is **flat at 7** in the
  already-separated community — the earlier "8→9 separated, 3→5 overlapping" was an artefact of the
  old contact model. [detail](2026-08-01-carryover-result.md). ✅ **Now inside the evolution loop
  too** (v2) — and it
  changes ecology but **not, demonstrably, evolution**: no effect on evolved species count survives a
  strict paired measurement, because selection drives overlap to zero under both transfer models and
  carryover's benefit is worth nothing once nothing overlaps.
  [detail](2026-08-01-v2-result.md)
- ✅ **reward currency** — BUILT 2026-08-01, `sim/reward.js`. Harder & Thomson's saturating gain
  curve reproduced (1.75× fall), and ⚠️ the mechanism is **finite stigma capacity, not grooming** —
  grooming only sets the level. The pollen dilemma quantified: **nectar's best schedule is 4×
  more gradual and yields 2.2× the male fitness**, because a pollen-rewarding flower must spend
  gametes to advertise. ⚠️ Castellanos' two-sided prediction reproduces in **3 of 4 cells**;
  frequent+efficient robustly fails and three of my explanations for it were refuted — the model
  gives gradual dispensing no cost except stranding. [detail](2026-08-01-reward-result.md)
  ✅ **Now 4 of 4** — see the next item.
- **more body plans as first-class** — check 2 showed the 2-D advantage runs **2.1–3.0×** across
  four animals, clearing 2× on every one; that variation is a result, not noise. ⚠️ The original
  "largest for small compact ones" did **not** survive the head-cap re-run — the default bee now
  leads, not the small slender plan. Only the coarse compact-above-elongated pattern holds.
- ✅ **cost of prolonged presentation** — BUILT 2026-08-02. Pollen senescence in the anther and
  floral upkeep while open, both schedule-selective (a simultaneous presenter's anther residence is
  zero, so senescence costs it exactly nothing). **Castellanos now reproduces 4 of 4** across a wide
  plateau — but ⚠️ **not for the reason the roadmap predicted**. A cost alone provably cannot repair
  the table: gradual's margin was _larger_ in the cell meant to reverse, so any regime-independent
  cost breaks frequent+wasteful (m = 0.593) before it fixes frequent+efficient (m = 0.559), and
  neither cost exceeded 3/4 alone. The rest was **my own artefact** — the carry cap bound in exactly
  one cell of the four, suppressing simultaneous presentation by 44%, because `cap = 140` was
  calibrated for an 8-grain deposit and then reused across a sweep running to 60.
  [detail](2026-08-02-presentation-cost-result.md)
- ✅ **pollen packaging** — BUILT 2026-08-02 as roadmap E's mechanism; solid pollinia vs granular
  monads, calibrated against 228 species. [detail](2026-08-02-dispersal-unit.md)
- **deception** — no reward at all, already enumerated

### D. Close the head-tip boundary artefact ✅ _found and closed 2026-08-01_

The head is now a rounded cap rather than a coordinate edge: contacts ahead of the spine end are
relabelled onto it at s = −r0·(u·fwd)/L, and the along-body histogram gained six bins ahead of zero
**at the same width**, so species that never touch the cap keep numerically identical histograms.
38.5% of sampled morphologies touched that boundary.

**The headline survived and one conclusion did not.** 2-D placement supports 3.0× a 1-D gene
(was 3.3×); the τ→0 ceiling moved 14 → 16 and the evolved community 9 → 8.3, so evolution reaches
52% rather than 64%. Separately, the fix exposed that **CTRL-2D-ideal was not a ceiling** — L2 beat
it, because the control gave every blob the _median_ precision while 71 of 309 real species are
tighter than median on both axes. With the control drawing precision pairs from the pool's own
distribution, L2 sits at **39% of the ideal surface, not 88%**. That is the substantive correction.

My own leading hypothesis — that φ was numerically degenerate for pinned contacts — was **refuted by
the probe**: `|perp|/|w|` measures 0.87–0.99, not the vanishing value I predicted.
[detail](2026-08-01-head-cap-result.md)

⬜ **Left open, deliberately:** v1's L1 arm still gives every species the median precision while L2
inherits heterogeneous precision from morphology. Inside the evolution loop that is a modelling
choice (is precision heritable in a placement-gene world?), not a bug, and it should be decided
rather than defaulted.

### E. Replace overlap with a transfer rate — 🟡 three of four targets met

Everything rests on _placement overlap_, a proxy. The gate is Johnson & Harder 2023
(10.1098/rspb.2023.1148, 228 species) — ⚠️ **open access, not blocked as this roadmap previously
recorded** — and it is a CROSSED pair, which is why it can fail: removal <45% for solid pollinia
against >80% for granular monads, while transfer efficiency runs 27.0% against 2.4%.

✅ **BUILT 2026-08-02** (`dispersalUnit` in `sim/carryover.js`). One mechanism — a pollinium is one
solid object — with `viscidium` selected on the REMOVAL axis alone, so the transfer figure is a
prediction. Removal: 99.9% granular, 27.0% pollinia, both targets met. Transfer decomposes at matched
removal as granular 7.1% → coherence 10.3% → not-harvestable 18.6% → adhesion **27.1%** against the
measured 27.0%.

⚠️ **The monad side is still 2.9x too generous** (7.1% vs 2.4%), so absolute delivery magnitudes are
still not quotable as rates. What IS calibrated is the contrast between dispersal units.
⚠️ **Retires a caveat repeated in four documents**: "3–6% against Harder & Thomson's 0.6%, five to ten
times too generous" compared against ONE species; PTE is the same quantity and the 228-species monad
mean is 2.4%, so the discrepancy was always 2.9x.
⬜ Next here: **sectile pollinia**, the intermediate condition — packaged but not solid, and grouped
with monads on removal — which is the sharpest remaining test.
[detail](2026-08-02-dispersal-unit.md)

### F. Renderer, only where it serves the above ⬜

Known defects: flowers read as long trumpets rather than compact blooms (that is the model's own
aspect ratio, so it is a biology change); near petals occlude the mouth at some rotations; the
flight arc has no real deceleration into a hover. **Not a priority** — the event lands, and the
project's value scales with mechanism classes rather than polish.

## Standing constraints

- **Placement must never be a gene.** Genes are shape; placement is computed. The moment that
  breaks, the geometry is ornament and the ablation result is void.
- **Every null ships a positive control.** Three separate inversions have already been caught this
  way — the packing harness, the L0/L2 pair in v1, and the seed control that killed an apparent
  herkogamy asymmetry.
- **Never compare an evolved outcome to an optimiser's bound at a tolerance the evolutionary
  process does not use.** Cost one wrong headline already (30% vs the true 64%).
- **A single-seed assertion about a stochastic quantity can be green and backwards at the same
  time.** A test asserting that coherence is a liability at matched removal passed on one seed; over
  twelve seeds the effect is a ~1.6x advantage in the opposite direction, and it had already
  propagated into an experiment's conclusion text. Seed-average anything directional.
- **A new mechanism needs a limiting case or a deterministic reference with a known right answer,
  and any effect it reports must survive a stricter measurement before it is believed.** Three
  measurement artefacts impersonated results on 2026-08-01 alone: a 10× wrong pollen-limitation
  floor, an 8.0→7.0 "reversal" that was bout noise, and a paired interval that cleared zero by 0.02
  and then swallowed it when the budget tripled.
- **A ceiling arm must be checked against the measured arm every time it is used, not once when it
  is written.** CTRL-2D-ideal read as a valid ceiling for as long as L2 happened to sit under it,
  and only announced itself as broken when a _different_ fix pushed L2 past it. If the measured arm
  can beat the bound, the bound is a lower bound wearing the wrong label.
- **A constant calibrated under one regime must be re-checked by any sweep that varies that
  regime.** `cap = 140` was chosen when a visit deposited 8 grains, then reused across a dispensing
  sweep running to 60, where it bound on the first visit and decided a published cell. The sweep
  varied exactly the quantity the constant had been sized against.
- **Two loss mechanisms sharing one counter hide whichever binds.** Cap truncation was added to
  `groomedOff`, so a mechanism destroying 451,299 grains was indistinguishable from ordinary
  grooming. Give each loss its own counter; a mechanism that cannot be seen separately cannot be
  ruled out.
- **Fixing a shared model obliges a re-run of everything built on it.** The head-cap fix moved every
  downstream number, but only the two experiments re-run at the time were annotated. The carryover
  result kept its pre-fix figures — and one of its conclusions — for a day, and was caught only
  incidentally. A superseded contact model supersedes every result that used it.
- **Matching a distribution by its median is not matching it.** The synthetic arms were built at
  median precision under a rule that said precision must be matched; a quarter of the real pool was
  sharper than any blob they contained. Match the distribution, or state plainly that you matched
  one moment of it.
