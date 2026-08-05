# Roadmap

**Canonical.** If another document disagrees about what comes next, this one wins.
Last updated 2026-08-05.

## Where this stands

Four things are built and measured, in this order, each gating the next:

1. **The contact model** (`sim/placement.js`) — placement computed from shape, never set. 12 tests,
   three load-bearing mechanisms mutation-verified.
2. **The reveal** (`visit.html`) — one bee, two flowers, pollen loaded and not delivered. The first
   attempt failed on a user's read (_"feels more like the number on a chart changing"_); rebuilt as
   an event in time with a rigid animal, and it now lands.
   ⚠️⚠️ **RESTATED 2026-08-02 — the advantage is CONDITIONAL ON PRECISION, and the whole project is now measured on a CONTINUOUS metric.** The L1 control had been handicapped with a FIXED MEDIAN precision while L2 inherits precision from morphology; making L1's precision heritable and bounded by real morphologies collapsed the evolved advantage. The 24-bin histogram that scored placement SATURATES below one bin width, so it was replaced throughout `sim/` — in the evolution loop as well as the ablation, since L1 evolves to a precision 7× finer than a bin. TWO symmetric comparisons: **2.5× with neither arm precision-selected, and a TIE (0.92×, converged) with both**. The 2-D advantage is a fact about PRECISION as much as dimensionality — a second axis multiplies slots only while placement is imprecise. [detail](2026-08-02-continuous-metric-rebaseline.md) [decision](2026-08-02-l1-precision-decision.md)

3. **The ablation** — 2-D placement out-packs a precision-matched 1-D gene **2.1× at the 309-species
   pool it samples** (40 vs 19 at τ=0.2), rising to **~3.1× once both arms get a large enough
   candidate set**. ⚠️ The ratio is NOT a constant and the arms had never been given the SAME NUMBER
   OF CANDIDATES — 234 vs 309 vs 3760 — so every earlier figure was two points on two different
   curves. Quote the pool size with the ratio. This was the delete-the-grid test; it passed, which is
   the only reason v1 exists. [detail](2026-08-02-pool-scaling.md)
4. **v1, the evolution loop** — blind selection reaches **40%** of the achievable ceiling, and with
   both arms precision-selected the 2-D advantage is **0.92× — a tie**, stable from KDE_M 96 to 192.
   ⚠️ At the estimator's old resolution this read 0.84×, i.e. the 1-D control WINNING; that was an
   artefact of retained sample size, which biases irregular and gaussian clouds in OPPOSITE
   directions. [detail](2026-08-02-continuous-metric-rebaseline.md)
5. **The head cap** (item D below) — the coordinate edge is gone, and fixing it exposed a broken
   control. Both headline figures above are post-correction.
   [detail](2026-08-01-head-cap-result.md)
6. **Four mechanism classes** on the item-C table — carryover, reward currency, the cost of
   prolonged presentation, and pollen packaging. Castellanos et al. 2006 reproduces **4 of 4**, though
   that last cell turned out to be half missing biology and half my own carry-cap artefact.
   [detail](2026-08-02-presentation-cost-result.md)
7. **Roadmap B, six steps** — the premise verified, then four mechanism tests of which three are clean
   negatives and spatial structure a partial positive. [detail](2026-08-02-spatial.md)

## Next

### A. Close the empirical leg — 🟡 mechanism leg CLOSED 2026-08-03, ceiling leg still blocked

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

✅ **THE MECHANISM LEG IS CLOSED 2026-08-03 — the first result in this project that is a fact about
the world rather than about the model.** The Esposito route above turned out to test something better
than the ceiling: it tests the **founding constraint**. The companion paper (Esposito et al. 2018,
PeerJ 6:e4256) types these plants with AFLP and the intermediates are **NOT hybrids** — "could not be
genetically separated from _P. bifolia_ (full overlap of AFLP's profiles)", hybrid index 0.1. So
inside ONE gene pool a shape trait shifts half a millimetre and the pollen lands somewhere else on
the animal, on a cheek that is nobody's adaptation. That is `placement is never a gene` in the wild.

The paper measures **four** floral traits and so supplies its own control. Split declared before the
run — placement (viscidia distance, caudicle length) vs size (spur length, labellum length) — and
scored against an independent molecular answer key. **Only the placement traits separate the two
species** (bif–chl overlap 1.5e-5 and 2.4e-13) ; the size traits leave them **30–66% overlapping**.
Both sympatric sites, independently.

⚠️ **The secondary criterion FAILED and was not re-thresholded.** Viscidia distance misses the
pre-registered bifolia–intermediate cut (0.397, 0.230 vs 0.5). The criterion is confounded — the
intermediates were _defined_ morphologically — but the number is real and points at **B**: placement
diverged this far **inside one gene pool with no isolation following**, so placement divergence is
necessary but not sufficient. ⚠️ The cross-site gradient arm (17% vs 7% admixture) is **uninformative**
— all four traits get the direction right, which is what a coin does with two sites.
⚠️ **The metric control found a real defect**: below the `1e-4` bandwidth floor the KDE estimator
reports **0.997 overlap for well-separated samples** — it saturates toward "these are the same",
which here would read as "no isolation". No existing result is affected (all run at scale ~1;
smallest real SD is 10⁵× clear) and a test now pins both the invariance and the floor.
⬜ Still open, and still needing the paywalled source: the **ceiling** half. Nothing here measures how
many species a shared pollinator supports. [detail](2026-08-03-platanthera.md)

### B. Speciation, which v1 explicitly cannot address — ✅ ORIGIN **and** MAINTENANCE both fail, and the two are ONE PROBLEM (2026-08-04)

⚠️⚠️ **THE UNIFYING RESULT (2026-08-04, density dependence).** Origin and maintenance both need the
same thing — **a rare placement doing better than a common one** — and the invasion criterion says
this model has the opposite sign at every frequency tested (0.214 → 4.654 across f = 0.1…0.9, flat
control). So the coexistence gap is not a second problem to solve after the speciation barrier: it is
the speciation barrier seen from the far side, and neither demography nor pollinator number can close
it. What would: **negative** frequency dependence on placement, or a genuinely second limiting factor.

⚠️⚠️ **AND A SECOND LIMITING FACTOR IS NOT AVAILABLE BY THE POLLINATOR ROUTE (2026-08-04, limiting
factors).** The two-pollinator run's own control — SPLIT the visit budget — keeps ONE limiting factor,
so its negative was partly built in. Tested with **INDEPENDENT budgets** (two factors, 2× visits)
against a **ONE-ANIMAL DOUBLE-BUDGET** arm at the SAME volume. Delivered pollen genuinely doubles
(51,985 → 103,738, measured) and absolute per-capita receipt doubles with it — **but the RATIO between
lineages is unchanged to within a percent at every frequency**, log-slope 3.46 / 3.42 / 3.41. All four
arms lose a lineage 5/5; the null fuses.
⚠️⚠️ **THE EXPONENT IS THE QUOTABLE NUMBER: receipt ratio ≈ (own-frequency odds)^0.70**, identical
across all three service regimes (0.72/0.70, 0.70/0.70, 0.70/0.71). 0 = no frequency dependence,
1 = pure partner-counting — so it is **mostly partner-counting**, softened by carryover. That is a
property of MATE-FINDING, not of provisioning: **partners are not a resource a pollinator can
deliver**, so a second limiting factor cannot be manufactured by adding animals or visits.
✅ **The bar is now QUANTITATIVE and CHEAP:** a candidate mechanism must move the 0.70 exponent, and
the exponent is measurable in single bouts — screen mechanisms there before spending 35 generations.
What would move it is **rare-biased visit allocation**, which is what deception was recruited to
supply and it acted on the advertisement axis instead. **RUN 2026-08-04 — see immediately below.**

⚠️⚠️ **RARE-BIASED VISITATION IS SELF-DEFEATING ON A CONTINUOUS TRAIT AXIS (2026-08-04).** The
textbook route to negative frequency dependence, and the last mechanism that could plausibly overturn
the exclusion result. `allocExponent: a` gives a morph of frequency f a share `f^a` of the visits;
a = 1 is visits-proportional-to-abundance and every earlier result is bit-identical under it. ⚠️ Rarity
is read off the population's own **placement cloud, NEVER off `anc`** — ancestry is bookkeeping the
pollinator cannot perceive, so biasing on it would be the same mistake as making placement a gene.
**The criterion inverts at a ≤ 0.5** and a = 1 independently reproduces the published 0.70 (0.663) —
⚠️ but the no-placement-difference **control swings just as hard**, so the statistic is real − control,
and the analytic identities (control `= odds^(a-1)`, real `= odds^(2a-1)`) make the mate-finding gap
**exactly a**. It shrinks 0.670 → 0.092 and never reaches zero: rare-bias **subsidises** the rare
type, it does not **repair** mate-finding.
⚠️ **The bar IS met in nature, against my prior expectation** — Gigord et al. 2001 converts to
**a ≈ 0.43**; rewarding systems go the other way (Smithson & Macnair 1997), so **deception is the only
route to a < 1**. The calibrated value nonetheless fails dynamically (0/10); a = 0.25 works
(6/29 vs 0/34, p = 0.0070, clean dose–response) but is **twice the measured bias**, and a = 0.30
(p = 0.0414) does not survive Bonferroni.
⚠️⚠️ **THE MECHANISM, AND IT IS SELF-DEFEATING.** At d = 8 the barrier leaks **exactly zero**, yet
strong bias still FUSES the clusters. Weighting by `dens^(a-1)` means the lowest-density placement is
the **GAP BETWEEN the two clusters**, so a preference for rare morphs pours visits onto the
intermediates that bridge them — **136× at d = 8, a = 0.25** — and those intermediates sit at d/2
where the barrier IS leaky (m = 0.083). FUSED counts track the subsidy exactly: 0 → 5 → 8.
**That is why deception splits the ADVERTISEMENT** — a discrete colour dimorphism, with no
intermediate to subsidise — **rather than the plant.** Discrete-vs-continuous is what this adds.
⬜ **NOT ESTABLISHED, and cheap:** 136× is the weight an intermediate WOULD receive, not evidence that
intermediates arose and bridged in the fused replicates. Does gap occupancy rise BEFORE `ancVar`
collapses? Unrun.
⚠️ This repo has **no CI**, so a green PR is not a green suite — the local `node --test tests/` run is
the only test evidence. [detail](2026-08-04-rare-biased-visits.md)
⚠️ A surviving mutant caught two worthless tests: they measured delivered pollen with a helper that
REIMPLEMENTED the budget rule, so a `step()` that ignored the flag left them green. **A test that
recomputes the behaviour under test is testing the recomputation.**
[detail](2026-08-04-limiting-factors.md)

v1 is adaptive dynamics over species already distinct. It has no standing variation, no
recombination and no hybridisation, so it cannot speak to how a lineage _splits_. The interesting
question sits exactly there: placement selection in one panmictic population is positively
frequency-dependent and converges, so what breaks that symmetry in the first place? Needs an
individual-based model with real inheritance and hybrid formation. **This is the biggest open
scientific question in the project.**

✅ **THE IBM IS BUILT 2026-08-03 (`sim/ibm.js`), and the proxy is retired.** Every mechanism above was
scored against `rare/common ~ 0.26` in machinery that cannot speciate. This one can: `runBout`'s
`T[i][j]` IS a mating matrix, so a mother is drawn by the pollen she received and her mate by who
delivered it — **parentage is decided by the placement geometry and assortative mating is an OUTPUT,
not a parameter.** Diploid, free recombination, additive expression (because the hybrid work MEASURED
additive shape to give blending placement), placement still computed.

**Neither arm splits.** A placement-mated population is indistinguishable from a null whose mating is
severed from placement (tail separation 2.20 vs 2.32). ⚠️⚠️ **The stronger half: fecundity selection
pointed at two REACHABLE placements at k=8 still did not go bimodal — it CONTRACTED, spread 0.73
against the null's 1.97.** Whichever cluster falls behind loses its mates, so placement-mediated
mating is positively frequency-dependent and **ERASES an imposed bimodality rather than merely
failing to create one**. That is the rare-morph mate-finding problem with real inheritance, and it is
what sympatric Platanthera shows in the field.

⚠️⚠️ **Two positive controls FAILED before one worked, both in the same mechanism class**, and the
tell was identical each time: the forced arm had LESS spread than the null, which no real split does.
`exp(k·distance-from-mean)` is disruptive on a 1-D trait axis but on a 2-D body surface rewards a
direction-free shell and then collapses onto the leading extreme — **the second time this project has
hit that**, the panmictic experiment recorded it first. The control that worked **changed mechanism
class**: it selects nothing, hands the pipeline a population that IS two lineages, and asks only
whether the measurement can see one — up to **23x** the one-cloud baseline. A control sharing a
mechanism with the thing under test cannot separate "selection can't beat the mating system" from
"the statistic can't see a split", because the mechanism under test is free to defeat it.
⚠️ **The anchor gate also caught a broken diagnostic**: correlating deviation against pollen RECEIVED
(the female half of fitness) read +0.149, i.e. disruptive; realized parentage reads **-0.842**.
N=30 over 35 generations bounds the effect rather than proving impossibility. [detail](2026-08-03-ibm.md)

✅ **DECEPTION IS NOW WIRED IN 2026-08-04, and it splits the ADVERTISEMENT and not the plant.** The
framing is what made it decisive: deception's negative frequency-dependence acts on the **signal**
axis, the mating system's positive frequency-dependence acts on **placement**, so the question was
whether the first can **reach** the axis the second lives on. Signal is allowed to be a gene (colour
morphs are heritable; _D. sambucina_'s polymorphism is one) while placement still is not — kept apart
by `shapeOf` and by giving the advertisement **its own rng stream**, so switching deception on cannot
silently re-roll every shape mutation. Verified bit-identical to the pre-advertisement model.

Deception inflates the advertisement cloud **3.2× free / 3.6× linked** (spread 0.055 → 0.175) and
**does not move placement at all** (2.36 vs a random-mating band of 2.90). ⚠️⚠️ **And LINKING the advertisement to the anther
loci does not rescue it** (2.17) — the discriminator the supergene arm existed for, killing the
attractive explanation that free recombination merely separated them. Flat across a 7.5× sweep of the
one unanchored parameter.

⚠️⚠️ **The mechanism: NEGATIVE FREQUENCY-DEPENDENCE MAINTAINS A POLYMORPHISM, IT DOES NOT COMPLETE A
SPLIT.** The numbers separate the claims — advertisement **spread** inflates reliably, **bimodality**
clears its matched honest band only marginally. A rare-morph advantage must evaporate once the morph
is common, so it protects variance without ever resolving it into two morphs, and **a protected
polymorphism is the opposite of a completed split**. That is what Gigord et al. 2001 actually
reported: maintenance of a colour polymorphism **within one species**. ⚠️ **My own hypothesis was
refuted first** — that "past parity" was an artefact of scoring summed transfer rather than realized
parentage; re-scored from the identical bout it is 4 of 8 under **both** (parentage mean 1.040 vs
transfer 1.132), so the claim stands and the negative is about generations, not measurement.
⚠️ A verdict bug scored the linked arm against the **unlinked** control's band; fixed and the run
regenerated rather than reinterpreted. **Seven mechanisms, and two of them now break a real symmetry
on an axis that is not the one reproductive isolation lives on.** [detail](2026-08-04-deception-ibm.md)

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

⚠️ **THE COEXISTENCE DISCREPANCY IS NOT POLLINATOR NUMBER (2026-08-04).** The exclusion result
predicts a pair past d=8 ends with ONE MEMBER LOST, yet orchid communities contain coexisting
congeners — so the IBM was extended from one pollinator to N (separate bouts summed, never one mixed
bout; visit budget SPLIT so arms differ in geometry not in how much pollination they get; single-animal
path bit-identical across 45 fields). **It does not work: one lineage is still lost 5/5 with two very
different body plans.** The decisive control is **two IDENTICAL animals** — same bouts, same split
budget, same summation, no new geometry — which also loses 5/5, so it is not the machinery. ⚠️ The
animals genuinely differ: **106.9x** the sampling floor measured from two identical animals drawing
sites independently.
⚠️⚠️ **The leading remaining candidate is a MODELLING ASSUMPTION, not biology: POPULATION SIZE IS
FIXED.** The IBM fills exactly N slots every generation, so two isolated lineages are forced into a
zero-sum contest that is built into the demography rather than derived from pollination. Testable by
letting size follow total seed set — ⚠️ but giving each lineage its own quota would ASSUME coexistence.
✅ **TESTED AND REFUTED 2026-08-04, below.**
[detail](2026-08-04-two-pollinator-coexistence.md)

⚠️⚠️ **IT IS NOT THE FIXED POPULATION SIZE EITHER — AND PART C SAYS NO DEMOGRAPHY COULD EVER FIX IT
(2026-08-04).** Filling exactly N slots is **soft selection** (Wallace 1975), so only relative success
can matter; letting recruits follow total seed set is **hard selection**. ⚠️ It is TWO constants, not
one — `visits` is also a constant total shared over n plants, and lifting only the first would have
been inert. Both were lifted as a 2×2 with a **shared** ceiling (a per-lineage quota would assume the
answer). **Every viable regime still loses a lineage 5/5 at d=8**, including the one that genuinely
tracks its own seed set (mean N 28.5, range 7–45, **0.0% at the ceiling**); the null still fuses.
⚠️ One cell is unevaluable and that is a finding: constant PER-PLANT service has **no density
regulation at all** (critical branching — 3/5 seeds extinct), so removing the fixed limiting factor
removes the regulation with it.
⚠️⚠️ **THE MECHANISM: the invasion criterion fails in BOTH directions.** Per-capita receipt vs own
frequency at d=8 = **0.214 / 0.580 / 0.981 / 1.789 / 4.654** at f = 0.1…0.9 — a rare lineage does
WORSE, monotonically. 0.981 at 50/50 and near-exact reciprocity (1/0.214 = 4.67 vs 4.654) make it pure
symmetric frequency dependence, not an intrinsic advantage; **0.214 sits on the same order as the
rare/common ≈ 0.26 proxy**, reached from a different construction. Control: one lineage wearing BOTH
labels (exact null) reads 1.011/0.991/0.992/0.947/0.997 — flat, so the statistic can report absence.
**Coexistence needs a STABILISING niche difference and this model has the opposite sign, so the
constant was never the cause.**
⚠️⚠️ **THIS UNIFIES B AND THE COEXISTENCE GAP:** coexistence needs a rare lineage to beat a common
one, and so does the ORIGIN of a split — the same requirement, failed by eight mechanisms. The
coexistence gap is the speciation barrier seen from the far side.
⚠️ **And it explains why two pollinators could not have worked:** the split budget keeps ONE limiting
factor. Two animals become two limiting factors only with INDEPENDENT budgets — which needs a
one-animal double-budget control to separate that from "more visits".
⚠️ The anchor gate fired once and was WRONG: it demanded HELD in every seed and got 4/5, but seed 5
genuinely loses a lineage in 3 generations. The predicate's scope exceeded its claim (reachability),
so it could not discriminate its target from ordinary behaviour.
[detail](2026-08-04-density-dependence.md)

✅ **SECONDARY CONTACT RUN 2026-08-04 — the standing alternative fails too, and the failure CHANGES
CHARACTER.** Everything before asked whether a split can ARISE. This asked whether one PERSISTS: two
lineages founded at a controlled placement separation (genomes DRAWN and SELECTED on the placement
they produce — placement still never a gene), run forward under ordinary mating.
**Below d≈4 they interbreed and FUSE, exactly as the random-mating null does. At d=8 they do not fuse
at all — ONE LINEAGE IS LOST OUTRIGHT in every seed, while the null at the SAME separation fuses.**
Same demography, same drift, same N: the exclusion is the geometry. ⚠️⚠️ **NOT DRIFT — the lineage is
still lost at N=60.**
⚠️ Every arm ends at ancestry variance 0.000, so a **neutral ancestry tracer** is what distinguishes
fusion from extinction; without it they are the same row. ⚠️ **The hybrid cost is
SEPARATION-DEPENDENT** (1.018/0.997/1.105/1.109 at d=0.5–4, **0.268 at d=8**) — absent exactly where
it would be needed and arriving only once the lineages have already stopped exchanging genes.
**Reproductive isolation does not protect a lineage: once two groups stop competing for MATES they
compete for OFFSPRING SLOTS, and one is excluded.** Placement-mediated mating erases a minority
whether it ARISES, is IMPOSED, or is FOUNDED.
⚠️⚠️ **THE TENSION THIS CREATES:** Platanthera sits in the fusion regime and is consistent, but the
model predicts a pair past the exclusion separation ends with ONE MEMBER LOST — and real orchid
communities contain coexisting congeners. Something outside this model permits that; the obvious
candidate is **more than one pollinator** (roadmap C). ⚠️ The anchor gate blocked this run THREE times
and was right each time (wrong frequency → sign inverted; wrong construction; underpowered n).
[detail](2026-08-04-secondary-contact.md)

⚠️ **Live possibility after five mechanisms: NOTHING in this model pushes a rare placement past
parity**, and placement divergence needs drift plus the measured 19.1% hybrid cost rather than a rare
advantage. That would be a result, but no experiment has established it.

✅ **CLOSED 2026-08-03 by the sixth mechanism. Deception pushes a rare placement past parity in 4 of
8 morphs**, mean lift 3.18× over an identical no-learner arm that never crosses (max 0.679). The
no-learner arm independently reproduces the 0.26 barrier it was not tuned for (0.236/0.249/0.253),
so the harness is measuring the right thing. **The property that mattered is that deception acts on
the animal's MOTIVATION rather than on its encounter rate** — the other five redistribute visits
among plants the animal already wants to visit. ⚠️ It is not a general rare-morph advantage: the
surrounding community must itself be deceptive (a rare cheat among honest flowers is punished), and
it assumes a new placement morph also carries a new signal, which is unmodelled pleiotropy.
[detail](2026-08-03-deception.md)

⬜ _Superseded framing:_ does a LARGER PATCH push `rare/common` past 1.0? The mechanism argues yes — more un-emptied partners, the separate
partner-availability effect already measured in the constancy work (0.471 → 0.550 at fixed
frequency) — and the under-powered arm hints yes. Needs many more draws. After that: clustering that
EMERGES from limited dispersal rather than being imposed, and temporal assortment by flowering time.

⬜ _Superseded framing, kept for the record:_ **spatial structure, favoured.** It is the only remaining candidate that
gives a rare morph _neighbours of its own kind_ rather than merely more visits: a new morph's
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

### C. Widen the table, which is where value scales — ✅ five classes shipped, table complete

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
- **more body plans as first-class** — check 2 showed the 2-D advantage runs **2.06–2.47×** across
  four animals at a matched pool size, clearing 2× on every one. ⚠️ The original "largest for small
  compact ones" did **not** survive the head-cap re-run — the default bee leads, not the small
  slender plan. Only the coarse compact-above-elongated pattern holds. ⚠️ **And the variation is
  about half what was claimed**: at unmatched pool sizes it read 2.1–3.0× (~1.5× modulation); at a
  common N = 337 it is ~1.2×. Still a real parameter, but most of the apparent spread across animals
  was the spread in how many candidates each animal's pool contained.
  [detail](2026-08-03-checks-rebaseline.md)
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
- ✅ **deception** — BUILT 2026-08-03, `sim/deception.js`. Rescorla-Wagner associative learning over
  a ring of signal space with a stimulus-generalisation gradient; a cheat advertises and pays
  nothing, and what limits it is what the animal has LEARNED. **Negative frequency-dependence is an
  OUTPUT, not an assumption** — the literature is split (Gigord et al. 2001 measured a rare-morph
  advantage; the same group found no diversity advantage in 2007; avoidance learning is
  short-lived per Whitehead & Peakall 2012), so building it in would have assumed the answer.
  A rare cheat gains up to **2.01×** against a measured null band of 0.991 ± 0.028, the effect
  survives a 3-visit memory half-life, and **Internicola & Harder reproduces** — a cheat's advantage
  falls 1.69× → 0.42× as its neighbours become honest. ⚠️ A perfect memory is WORSE than a leaky one
  (saturated aversion generalises onto the rare morph too), so the mechanism has an optimum memory
  length. [detail](2026-08-03-deception.md)

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

✅ **DECIDED 2026-08-02: precision is a second heritable gene in L1, bounded by what real
morphologies achieve** (s sd 0.0077–0.0670, phi sd 0.0788–0.9655 rad). Granting direct genetic
control of WHERE pollen goes while withholding control of HOW TIGHTLY is an arbitrary handicap, and
the whole claim rests on L1 being a steelman. The bound is load-bearing: unbounded precision packs
unlimited species, which is not a fact about dimensionality.

⚠️⚠️ **It costs most of the result.** The evolved 2-D advantage falls **3.07× → 1.24×** (L1 2.7 → 6.7;
L2 unchanged at 8.3). Two consequences that must not be buried: **L1's ceiling constant is now stale**
(it reports 111% of a bound computed under the old assumption — the "ceiling must be re-checked every
time" constraint firing again), and **the static ablation's 3.0× is subject to the same objection**
and has not been re-measured. Implemented on two loci that were previously INERT for L1, so L2's
numbers provably cannot move — verified by the suite. [detail](2026-08-02-l1-precision-decision.md)

**⚠️ SUPERSEDED — all three figures in the paragraph above are pre-re-baseline.** Both numbers were
measured on the saturating histogram, which the loop was still using. On the continuous metric the
evolved advantage is **0.92× (a tie)**, the stale ceiling constant is **recomputed and now asserted**
rather than commented, and the static ablation **has** been re-measured at 2.5×.
[detail](2026-08-02-continuous-metric-rebaseline.md)

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

⚠️ **RUN 2026-08-03, AND THE MECHANISM DOES NOT REACH IT.** Two corrections to the framing above:
sectile groups with monads on **both** axes, not just removal ("massula and monad dispersal with
higher removal _and lower transfer efficiency_ ... was not expected a priori"), and the structure
worth predicting is a **split** — on net export sectile groups with the SOLID pollinia while monads
sit alone and worst. Selected on carryover length so transfer stayed a prediction, sectile lands at
**6.9%, i.e. −3% of the way** from monad to pollinium where the measured unit sits at 67%; the export
grouping fails too. **The negative survives a hundredfold resolution control** — transfer depends on
the massula COUNT alone and is identical at pools of 60, 600 and 6000, so grains-per-massula is
irrelevant to transfer here. What binds is a **tension between the two axes**: carryover pushes the
count up and transfer falls as it rises, so the model cannot match sectile's carryover and its
transfer at once. Points at a missing mechanism — massula adhesion, or the pollinarium bending that
places successive massulae on successive stigmas — rather than at a tuning failure.
[detail](2026-08-03-sectile.md)
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
