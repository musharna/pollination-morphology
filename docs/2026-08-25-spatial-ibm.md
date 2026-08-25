# Spatial structure in the IBM — 2026-08-25

**H-spatial is REFUTED, and the intervention did not merely fail — the half of it
that acts at all acts AGAINST the hypothesis. Local foraging significantly
REDUCES retained ancestry variance; limited dispersal does exactly nothing, by
construction.**

Pre-registered in [prereg](2026-08-16-spatial-ibm-prereg.md), written and
committed before the experiment ran. Result at n=30, d=8, 40 seeds/cell (38
built), 35 generations, siteN=160, `FORAGE = 0.06`, `SEED = 0.02`. jobd 3513 on
`desktop`, commit at the head of branch `spatial-ibm`.

Roadmap `:530` named spatial structure **favoured** — _"the only remaining
candidate that gives a rare morph neighbours of its own kind rather than merely
more visits."_ It is the one mechanism this project ever measured moving the
rare-morph barrier (0.247 → 0.950 in the v1 harness, 2026-08-02). This is the
first time it has been run in the model that can actually speciate.

## The registered outcome

| cell                         | HELD  | FUSED | one lost | clustering |
| ---------------------------- | ----- | ----- | -------- | ---------- |
| global forage · global seed  | 0.000 | 0.000 | 1.000    | 0.986      |
| local forage · global seed   | 0.000 | 0.000 | 1.000    | 0.980      |
| global forage · limited seed | 0.000 | 0.000 | 1.000    | 0.808      |
| local forage · limited seed  | 0.000 | 0.000 | 1.000    | 0.793      |

**HELD occurred 0 of 38 times in every cell.**

⚠️⚠️ **NO CONFIDENCE INTERVAL IS QUOTED ON THAT, AND THE FIRST VERSION OF THIS
EXPERIMENT QUOTED ONE.** It printed `+0.000 [0.000, 0.000]` and the verdict read
it as a tight refutation. It is not a measurement. `pairedCI` resamples the
observed pairs, so when every pair is `(0, 0)` every resample is `(0, 0)` and the
interval collapses — it would print identically at n=3. That width reports the
sample being constant, not the precision of the estimate.

What the data support is a **bound**:

- exact one-sided 95% upper bound on the HELD probability: **7.58%**
- Bonferroni across the four cells: **10.89%**

That **refutes a large rescue and says nothing about a small one.**

✅ **The manipulation landed.** Ancestry clustering went 0.983 under global
dispersal to 0.800 under limited dispersal — kin structure EMERGED rather than
being imposed. Founders are scattered at random; the 2026-08-02 run placed the
morphs in arcs, which asserts the structure whose consequences it then measures.

## The continuous readouts, because the label cannot move and they can

`fateOf` reduces a whole trajectory to one of four words. A mechanism that
SLOWED exclusion without ever clearing the `0.4 × ancVar0` threshold is invisible
to it. So the run also records what the label throws away:

| cell                         | ancVar/ancVar0 (gens 1–5) | lineage skew | lost by gen |
| ---------------------------- | ------------------------- | ------------ | ----------- |
| global forage · global seed  | 0.519                     | 0.998        | 4.1         |
| local forage · global seed   | 0.437                     | 1.000        | 3.6         |
| global forage · limited seed | 0.519                     | 0.998        | 4.1         |
| local forage · limited seed  | 0.398                     | 0.998        | 3.6         |

**Loss time does NOT clear zero** — −0.421 [−1.053, 0.263] and
−0.447 [−1.289, 0.421]. The apparent "3.6 against 4.1" is not a finding, and an
earlier draft of this document would have reported it as one.

**Retained ancestry variance over generations 1–5 DOES clear zero, and it is
negative:**

| contrast vs global·global    | ancVar/ancVar0 (gens 1–5)   |
| ---------------------------- | --------------------------- |
| local forage · global seed   | **−0.082 [−0.143, −0.030]** |
| global forage · limited seed | no interval — see below     |
| local forage · limited seed  | **−0.121 [−0.211, −0.035]** |

⚠️⚠️ **NEGATIVE MEANS THE LINEAGES COLLAPSED TOWARD EACH OTHER SOONER.** Local
foraging does not merely fail to rescue a rare morph. It **costs** it.

## Two structural findings about the design itself

⚠️⚠️ **THE "LIMITED DISPERSAL ALONE" CELL CANNOT DIFFER FROM THE BASELINE, AND
THAT IS NOT A NULL RESULT — IT IS AN IDENTITY.** `sim/carryover.js:276-278` reads
`positions` only when `forageRange` is finite. Under global foraging the
coordinates are never consulted, so the trajectory is bit-identical to baseline
whatever the dispersal kernel did. Its paired difference is identical in every
seed, which is why the run refuses an interval there.

**So this is not a 2×2. It has three distinct cells.** Limited dispersal can act
ONLY through local foraging; it has no independent channel to the outcome.

⚠️ **AND THAT MAKES THE POSITIVE CONTROL NECESSARY BUT NOT SUFFICIENT.** The
clustering statistic confirms limited dispersal built kin structure — 0.986 to
0.808 — and that kin structure is **causally inert** unless foraging is local. A
control that verifies the manipulation happened does not establish that the
manipulation could reach the outcome.

⚠️ **EVERY READOUT THAT MOVED AT ALL TRACKS FORAGING, NOT DISPERSAL.** That is
worth stating plainly, because limited dispersal is the half roadmap `:530`
actually argued for — _"a new morph's offspring land near it, so it is locally
common while globally rare"_ — and it is the half that does nothing.

## The mechanism, and a prediction it makes elsewhere

Local foraging shrinks the effective mating neighbourhood. Founders are scattered
at random, so a plant's neighbours are an ancestrally MIXED sample — the smaller
pool does not align with lineage. A smaller mating sample that is not aligned
with lineage is simply more drift, and drift collapses ancestry variance faster.
That is the standard Wright-neighbourhood result, arriving here as a cost.

⚠️ **THIS SHARPENS WHAT "SMALL POOL" MEANS, AND THE PHENOLOGY RUN DEPENDS ON THE
DISTINCTION.** The flowering-time experiment's live confound is also a small
mating pool (~3.6 co-flowering plants of 30). But the two predictions are
OPPOSITE, and the difference is whether the pool structure is **aligned with
lineage**:

- pool NOT aligned with lineage (here) → accelerated drift → variance lost sooner
- pool aligned with lineage (heritable flowering time) → assortative mating →
  variance retained

So this result makes a falsifiable prediction about the shuffled-bloom arm: with
the schedules permuted the pools stop tracking lineage, and phenology should look
like **this** experiment — HELD down, not merely flat.

## The two attractors

| cell                         | placement-mated | random-mated |
| ---------------------------- | --------------- | ------------ |
| global forage · global seed  | 38/38 one lost  | 38/38 FUSED  |
| local forage · global seed   | 38/38 one lost  | 38/38 FUSED  |
| global forage · limited seed | 38/38 one lost  | 38/38 FUSED  |
| local forage · limited seed  | 38/38 one lost  | 38/38 FUSED  |

Under placement-mediated mating the model **excludes**; sever placement from
parentage and it **fuses**. ⚠️ Stated as counts rather than as 1.000: n/n
supports an exact one-sided 95% lower bound of **92.8%**, not a probability of
one.

## What this closes

Spatial structure joins the spent routes on roadmap `:219`. ⚠️ Scope it
correctly: **refuted at the tested configuration**, not a universal spatial null.
`FORAGE = 0.06` and `SEED = 0.02` are two points, the population is 30, and the
bound admits a rescue probability under 7.58%. What is established is that the
one mechanism with a prior positive does not produce a large-probability rescue
in the model that can speciate, and that its active half acts in the wrong
direction.

⚠️ **The v1 positive is not thereby explained away.** That harness has no
inheritance, no recombination and no hybrids; 0.247 → 0.950 was measured on a
different object. The two results do not contradict each other so much as
demonstrate that the v1 proxy did not predict the IBM.

[prereg](2026-08-16-spatial-ibm-prereg.md) · raw output: jobd 3513
