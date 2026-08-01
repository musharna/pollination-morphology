# Roadmap

**Canonical.** If another document disagrees about what comes next, this one wins.
Last updated 2026-08-01.

## Where this stands

Four things are built and measured, in this order, each gating the next:

1. **The contact model** (`sim/placement.js`) — placement computed from shape, never set. 12 tests,
   three load-bearing mechanisms mutation-verified.
2. **The reveal** (`visit.html`) — one bee, two flowers, pollen loaded and not delivered. The first
   attempt failed on a user's read (_"feels more like the number on a chart changing"_); rebuilt as
   an event in time with a rigid animal, and it now lands.
3. **The ablation** — 2-D placement supports 3.3× the species a 1-D gene does, at matched
   precision. This was the delete-the-grid test and it passed, which is the only reason v1 exists.
4. **v1, the evolution loop** — blind selection reaches ~64% of the achievable ceiling and
   preserves the 2-D advantage at 2.7×.

## Next

### A. Close the empirical leg ⬜ _blocked on access, not on work_

The packing prediction has two halves and only the geometric one is closed. Needed: **orchid species
per _shared_ euglossine pollinator**, to compare against the 1-D ceiling. The figure in the
enumeration doc — fifteen sympatric _Euglossa_ — is **bee** richness and must not be reused.
Named source: Ackerman, Phillips, Tremblay, Karremans & Reiter 2023, `10.1093/botlinnean/boac082` —
global orchid reproductive-biology database, >2900 species, pollinator identity tabulated, closed
access. Two OpenAlex sweeps came back thin; that is a qualified null over one registry.

Until this lands the claim is _"2-D out-packs 1-D in this model"_, **not** _"real richness exceeds
what 1-D placement supports."_ Only the second is about the world.

### B. Speciation, which v1 explicitly cannot address ⬜

v1 is adaptive dynamics over species already distinct. It has no standing variation, no
recombination and no hybridisation, so it cannot speak to how a lineage _splits_. The interesting
question sits exactly there: placement selection in one panmictic population is positively
frequency-dependent and converges, so what breaks that symmetry in the first place? Needs an
individual-based model with real inheritance and hybrid formation. **This is the biggest open
scientific question in the project.**

### C. Widen the table, which is where value scales — 🟡 first class shipped

Groundwork §4.6: rows are mechanism classes, columns are pollinator body plans. v1 implements
**one cell**. Value scales with how many classes are implemented, not with render quality.
Nearest, in order of cheapness:

- ✅ **carryover between visits** — BUILT 2026-08-01, `sim/carryover.js`. Packaging efficiency rises
  4.6% → 40.5%; last-male advantage emerges from stacking rather than being imposed; carryover
  *raises* coexistence (8→9 separated, 3→5 overlapping), so extra chances beat rival accumulation.
  [detail](2026-08-01-carryover-result.md). ✅ **Now inside the evolution loop too** (v2) — and it
  changes ecology but **not, demonstrably, evolution**: no effect on evolved species count survives a
  strict paired measurement, because selection drives overlap to zero under both transfer models and
  carryover's benefit is worth nothing once nothing overlaps.
  [detail](2026-08-01-v2-result.md)
- **reward currency** — pollen-as-lost-gametes vs nectar vs fragrance, which changes the cost of a
  visit and so the whole payoff structure
- **more body plans as first-class** — check 2 showed the 2-D advantage runs 2.3–3.6× across four
  animals and is largest for small compact ones; that variation is a result, not noise
- **deception** — no reward at all, already enumerated

### D. Close the head-tip boundary artefact ⬜ *new, found 2026-08-01*

`contactSite` finds the point on the body **closest** to an organ. When an organ sits deeper than
the animal's head can reach, that argmin saturates at s=0 — the very front of the face — so many
different morphologies map to one coordinate. **Four of the nine species in the evolved L2
community sit exactly on that boundary**, separated from one another only in roll.

Their separation in roll is real, but the body's length is doing no work for them, and the count
cannot be fully trusted until the head is a rounded cap rather than a coordinate edge. Check: re-run
v1 with the body extended past s=0, and see whether the ceiling of 14 and the evolved 9 survive.

### E. Replace overlap with a transfer rate ⬜

Everything currently rests on _placement overlap_, which is a proxy. The sharpest available
calibration gate is Johnson & Harder 2023 (228 species): under 45% removal for solid pollinia
against over 80% for granular monads. A model that reproduces that split has earned the right to
call its number a transfer rate.

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
- **A new mechanism needs a limiting case or a deterministic reference with a known right answer,
  and any effect it reports must survive a stricter measurement before it is believed.** Three
  measurement artefacts impersonated results on 2026-08-01 alone: a 10× wrong pollen-limitation
  floor, an 8.0→7.0 "reversal" that was bout noise, and a paired interval that cleared zero by 0.02
  and then swallowed it when the budget tripled.
